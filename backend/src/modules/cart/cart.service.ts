import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { randomInt } from 'crypto'
import db from '../../config/database'

type JwtUser = {
  profileId?: number
  channelCode?: string
}

type CartStatus = 'ACTIVE' | 'ORDERED' | 'DELETED' | 'EXPIRED'
type OrderFlowType = 'IN_STORE' | 'PICKUP' | 'DELIVERY' | 'RESERVATION' | 'SERVICE' | 'ROOM_SERVICE' | 'PARCEL'
type OptionType = 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM'

type ActorContext = {
  actorProfileId: number
  actorChannelCode: string
}

type ProviderProfileRow = {
  id: number
  channelCode: string
}

type ProductRow = {
  id: number
  profileId: number
  channelCode: string
  productCode: string
  productName: string
  productType: string | null
  productKind: string | null
  categoryName: string | null
  basePrice: number
  currency: string | null
}

type ProductOptionRow = {
  id: number
  optionName: string
  optionType: OptionType
}

type ProductOptionValueRow = {
  id: number
  optionId: number
  optionValueName: string
  priceDelta: number
}

type AddCartItemOptionInput = {
  productOptionId?: number
  productOptionValueId?: number
  optionNameSnapshot?: string
  optionTypeSnapshot?: OptionType
  optionValueNameSnapshot?: string
  priceDeltaSnapshot?: number
  quantity?: number
}

type AddCartItemInput = {
  providerChannelCode: string
  productCode: string
  quantity: number
  orderFlowType: OrderFlowType
  requestMemo?: string
  options?: AddCartItemOptionInput[]
}

type CartItemOwnerRow = {
  id: number
  actorChannelCode: string
  cartStatus: CartStatus
  unitPriceSnapshot: number
  optionTotalAmount: number
}

@Injectable()
export class CartService {
  private createBusinessCode12(prefix = ''): string {
    const normalizedPrefix = prefix.trim().toUpperCase()
    if (!/^[A-Z0-9]*$/.test(normalizedPrefix) || normalizedPrefix.length > 12) {
      throw new BadRequestException('code prefix is invalid')
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = normalizedPrefix
    while (code.length < 12) {
      code += chars[randomInt(0, chars.length)]
    }
    return code
  }

  private normalizeRequiredCode(value: unknown, fieldName: string): string {
    const code = String(value ?? '').trim().toUpperCase()
    if (!code) {
      throw new BadRequestException(`${fieldName} is required`)
    }
    return code
  }

  private normalizeChannelCode13(value: unknown, fieldName: string): string {
    const code = this.normalizeRequiredCode(value, fieldName)
    if (!/^[A-Z][A-Z0-9]{12}$/.test(code)) {
      throw new BadRequestException(`${fieldName} must be a 13 character channelCode`)
    }
    return code
  }

  private normalizeBusinessCode12(value: unknown, fieldName: string): string {
    const code = this.normalizeRequiredCode(value, fieldName)
    if (!/^[A-Z0-9]{12}$/.test(code)) {
      throw new BadRequestException(`${fieldName} must be a 12 character business code`)
    }
    return code
  }

  private createUniqueCartItemCode(): string {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const cartItemCode = this.createBusinessCode12('CI')
      const exists = db.prepare(`
        SELECT id
        FROM cart_items
        WHERE cartItemCode = ?
        LIMIT 1
      `).get(cartItemCode) as { id?: number } | undefined

      if (!exists?.id) {
        return cartItemCode
      }
    }

    throw new BadRequestException('failed to create cartItemCode')
  }

  private normalizeCartStatus(value?: string): CartStatus {
    const normalized = String(value ?? 'ACTIVE').trim().toUpperCase()
    if (!['ACTIVE', 'ORDERED', 'DELETED', 'EXPIRED'].includes(normalized)) {
      throw new BadRequestException('cartStatus must be ACTIVE, ORDERED, DELETED, or EXPIRED')
    }
    return normalized as CartStatus
  }

  private normalizeOrderFlowType(value: unknown): OrderFlowType {
    const normalized = String(value ?? '').trim().toUpperCase()
    if (!['IN_STORE', 'PICKUP', 'DELIVERY', 'RESERVATION', 'SERVICE', 'ROOM_SERVICE', 'PARCEL'].includes(normalized)) {
      throw new BadRequestException('orderFlowType is invalid')
    }
    return normalized as OrderFlowType
  }

  private normalizePositiveQuantity(value: unknown): number {
    const quantity = Number(value)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be an integer greater than 0')
    }
    return quantity
  }

  private normalizeNonNegativeInteger(value: unknown, fallback = 0): number {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) {
      return fallback
    }
    return Math.max(0, Math.trunc(numeric))
  }

  private getActorContext(user?: JwtUser): ActorContext {
    const actorProfileId = Number(user?.profileId ?? 0)
    const actorChannelCode = String(user?.channelCode ?? '').trim().toUpperCase()

    if (!actorProfileId || !actorChannelCode) {
      throw new UnauthorizedException('invalid auth context')
    }

    const actor = db
      .prepare(
        `
          SELECT id, channelCode
          FROM profiles
          WHERE id = ?
            AND channelCode = ?
          LIMIT 1
        `
      )
      .get(actorProfileId, actorChannelCode) as { id?: number; channelCode?: string } | undefined

    if (!actor?.id || !actor?.channelCode) {
      throw new UnauthorizedException('actor profile not found')
    }

    return {
      actorProfileId,
      actorChannelCode
    }
  }

  private getProviderProfile(providerChannelCode: string): ProviderProfileRow {
    const provider = db
      .prepare(
        `
          SELECT id, channelCode
          FROM profiles
          WHERE channelCode = ?
          LIMIT 1
        `
      )
      .get(providerChannelCode) as ProviderProfileRow | undefined

    if (!provider?.id) {
      throw new NotFoundException('provider profile not found')
    }

    return provider
  }

  private getTargetProduct(providerChannelCode: string, productCode: string): ProductRow {
    const product = db
      .prepare(
        `
          SELECT
            p.id,
            p.profileId,
            p.channelCode,
            p.productCode,
            p.productName,
            p.productType,
            p.productKind,
            c.categoryName AS categoryName,
            p.basePrice,
            p.currency
          FROM pos_products p
          LEFT JOIN pos_product_categories c
            ON c.id = p.categoryId
          WHERE p.channelCode = ?
            AND p.productCode = ?
            AND COALESCE(p.isActive, 1) = 1
            AND p.deletedAt IS NULL
            AND COALESCE(p.menuStatus, 'ON_SALE') = 'ON_SALE'
            AND COALESCE(p.isSoldOut, 0) = 0
          LIMIT 1
        `
      )
      .get(providerChannelCode, productCode) as ProductRow | undefined

    if (!product?.id) {
      throw new NotFoundException('product not found or unavailable')
    }

    return product
  }

  private getProductOption(providerChannelCode: string, productCode: string, productOptionId: number): ProductOptionRow {
    const option = db
      .prepare(
        `
          SELECT
            id,
            optionName,
            optionType
          FROM pos_product_options
          WHERE id = ?
            AND channelCode = ?
            AND productCode = ?
            AND COALESCE(isActive, 1) = 1
            AND deletedAt IS NULL
          LIMIT 1
        `
      )
      .get(productOptionId, providerChannelCode, productCode) as ProductOptionRow | undefined

    if (!option?.id) {
      throw new NotFoundException('product option not found')
    }

    return option
  }

  private getProductOptionValue(
    providerChannelCode: string,
    productCode: string,
    productOptionValueId: number
  ): ProductOptionValueRow {
    const optionValue = db
      .prepare(
        `
          SELECT
            v.id,
            v.optionId,
            v.optionValueName,
            COALESCE(v.priceDelta, 0) AS priceDelta
          FROM pos_product_option_values v
          INNER JOIN pos_product_options o
            ON o.id = v.optionId
          WHERE v.id = ?
            AND v.channelCode = ?
            AND v.productCode = ?
            AND COALESCE(v.isActive, 1) = 1
            AND v.deletedAt IS NULL
            AND COALESCE(o.isActive, 1) = 1
            AND o.deletedAt IS NULL
          LIMIT 1
        `
      )
      .get(productOptionValueId, providerChannelCode, productCode) as ProductOptionValueRow | undefined

    if (!optionValue?.id) {
      throw new NotFoundException('product option value not found')
    }

    return optionValue
  }

  private getOwnedCartItem(actorChannelCode: string, cartItemId: number): CartItemOwnerRow {
    const row = db
      .prepare(
        `
          SELECT
            id,
            actorChannelCode,
            cartStatus,
            COALESCE(unitPriceSnapshot, 0) AS unitPriceSnapshot,
            COALESCE(optionTotalAmount, 0) AS optionTotalAmount
          FROM cart_items
          WHERE id = ?
            AND actorChannelCode = ?
          LIMIT 1
        `
      )
      .get(cartItemId, actorChannelCode) as CartItemOwnerRow | undefined

    if (!row?.id) {
      throw new NotFoundException('cart item not found')
    }

    return row
  }

  addCartItem(user: JwtUser | undefined, input: AddCartItemInput) {
    const actor = this.getActorContext(user)
    const providerChannelCode = this.normalizeChannelCode13(input.providerChannelCode, 'providerChannelCode')
    const productCode = this.normalizeBusinessCode12(input.productCode, 'productCode')
    const quantity = this.normalizePositiveQuantity(input.quantity)
    const orderFlowType = this.normalizeOrderFlowType(input.orderFlowType)
    const requestMemo = input.requestMemo === undefined ? null : String(input.requestMemo ?? '').trim() || null
    const provider = this.getProviderProfile(providerChannelCode)
    const product = this.getTargetProduct(providerChannelCode, productCode)

    const optionInputs = Array.isArray(input.options) ? input.options : []

    let cartItemId = 0
    const cartSessionCode = this.createBusinessCode12('CS')
    const cartItemCode = this.createUniqueCartItemCode()
    let optionTotalAmount = 0
    let lineTotalAmount = 0

    const tx = db.transaction(() => {
      const insertResult = db
        .prepare(
          `
            INSERT INTO cart_items(
              actorProfileId,
              actorChannelCode,
              providerProfileId,
              providerChannelCode,
              productId,
              cartSessionCode,
              cartItemCode,
              productCode,
              productNameSnapshot,
              productTypeSnapshot,
              productKindSnapshot,
              categoryNameSnapshot,
              unitPriceSnapshot,
              currency,
              quantity,
              optionTotalAmount,
              lineTotalAmount,
              orderFlowType,
              cartStatus,
              requestMemo,
              createdAt,
              updatedAt
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'ACTIVE',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
          `
        )
        .run(
          actor.actorProfileId,
          actor.actorChannelCode,
          provider.id,
          provider.channelCode,
          product.id,
          cartSessionCode,
          cartItemCode,
          product.productCode,
          product.productName,
          'PRODUCT',
          product.productKind,
          product.categoryName,
          this.normalizeNonNegativeInteger(product.basePrice, 0),
          product.currency ?? 'KRW',
          quantity,
          0,
          0,
          orderFlowType,
          requestMemo
        )

      cartItemId = Number(insertResult.lastInsertRowid ?? 0)

      if (!cartItemId) {
        throw new BadRequestException('failed to create cart item')
      }

      optionInputs.forEach((optionInput, index) => {
        const optionQuantity = this.normalizePositiveQuantity(optionInput.quantity ?? 1)
        const normalizedOptionName = String(optionInput.optionNameSnapshot ?? '').trim()
        const normalizedOptionValueName = String(optionInput.optionValueNameSnapshot ?? '').trim()

        const productOptionId = optionInput.productOptionId ? Number(optionInput.productOptionId) : null
        const productOptionValueId = optionInput.productOptionValueId ? Number(optionInput.productOptionValueId) : null

        if ((productOptionId ?? 0) <= 0 && (productOptionValueId ?? 0) <= 0 && !normalizedOptionName && !normalizedOptionValueName) {
          throw new BadRequestException(`options[${index}] is invalid`)
        }

        let optionNameSnapshot = normalizedOptionName
        let optionTypeSnapshot = optionInput.optionTypeSnapshot ?? 'CUSTOM'
        let optionValueNameSnapshot = normalizedOptionValueName
        let priceDeltaSnapshot = this.normalizeNonNegativeInteger(optionInput.priceDeltaSnapshot, 0)
        let resolvedOptionId: number | null = productOptionId && productOptionId > 0 ? productOptionId : null
        let resolvedOptionValueId: number | null = productOptionValueId && productOptionValueId > 0 ? productOptionValueId : null

        if (resolvedOptionId) {
          const option = this.getProductOption(providerChannelCode, productCode, resolvedOptionId)
          optionNameSnapshot = option.optionName
          optionTypeSnapshot = option.optionType
        }

        if (resolvedOptionValueId) {
          const optionValue = this.getProductOptionValue(providerChannelCode, productCode, resolvedOptionValueId)
          optionValueNameSnapshot = optionValue.optionValueName
          priceDeltaSnapshot = this.normalizeNonNegativeInteger(optionValue.priceDelta, 0)
          if (resolvedOptionId && optionValue.optionId !== resolvedOptionId) {
            throw new BadRequestException(`options[${index}] option mismatch`)
          }
          resolvedOptionId = optionValue.optionId
          if (resolvedOptionId) {
            const option = this.getProductOption(providerChannelCode, productCode, resolvedOptionId)
            optionNameSnapshot = option.optionName
            optionTypeSnapshot = option.optionType
          }
        }

        if (!optionNameSnapshot) {
          throw new BadRequestException(`options[${index}] optionNameSnapshot is required`)
        }

        if (!['SIZE', 'TEMPERATURE', 'ADDON', 'CHOICE', 'CUSTOM'].includes(optionTypeSnapshot)) {
          throw new BadRequestException(`options[${index}] optionTypeSnapshot is invalid`)
        }

        if (!optionValueNameSnapshot) {
          throw new BadRequestException(`options[${index}] optionValueNameSnapshot is required`)
        }

        const lineOptionAmount = this.normalizeNonNegativeInteger(priceDeltaSnapshot, 0) * optionQuantity
        optionTotalAmount += lineOptionAmount

        db.prepare(
          `
            INSERT INTO cart_item_options(
              cartItemId,
              cartItemCode,
              providerChannelCode,
              productCode,
              productOptionId,
              productOptionValueId,
              optionNameSnapshot,
              optionTypeSnapshot,
              optionValueNameSnapshot,
              priceDeltaSnapshot,
              quantity,
              lineOptionAmount,
              sortOrder,
              createdAt
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
          `
        ).run(
          cartItemId,
          cartItemCode,
          provider.channelCode,
          product.productCode,
          resolvedOptionId,
          resolvedOptionValueId,
          optionNameSnapshot,
          optionTypeSnapshot,
          optionValueNameSnapshot,
          this.normalizeNonNegativeInteger(priceDeltaSnapshot, 0),
          optionQuantity,
          lineOptionAmount,
          index
        )
      })

      lineTotalAmount = (this.normalizeNonNegativeInteger(product.basePrice, 0) + optionTotalAmount) * quantity

      db.prepare(
        `
          UPDATE cart_items
          SET
            optionTotalAmount = ?,
            lineTotalAmount = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `
      ).run(optionTotalAmount, lineTotalAmount, cartItemId)
    })

    tx()

    return {
      ok: true as const,
      item: {
        id: cartItemId,
        actorChannelCode: actor.actorChannelCode,
        providerChannelCode: provider.channelCode,
        cartSessionCode,
        cartItemCode,
        productCode: product.productCode,
        quantity,
        cartStatus: 'ACTIVE' as CartStatus,
        lineTotalAmount
      }
    }
  }

  getMyCartItems(user: JwtUser | undefined, statusInput?: string) {
    const actor = this.getActorContext(user)
    const cartStatus = this.normalizeCartStatus(statusInput)

    const rows = db
      .prepare(
        `
          SELECT
            id,
            cartSessionCode,
            cartItemCode,
            providerChannelCode,
            productCode,
            productNameSnapshot,
            unitPriceSnapshot,
            quantity,
            optionTotalAmount,
            lineTotalAmount,
            orderFlowType,
            cartStatus,
            requestMemo,
            createdAt
          FROM cart_items
          WHERE actorChannelCode = ?
            AND cartStatus = ?
          ORDER BY createdAt DESC, id DESC
        `
      )
      .all(actor.actorChannelCode, cartStatus) as Array<{
        id: number
        cartSessionCode: string | null
        cartItemCode: string
        providerChannelCode: string
        productCode: string
        productNameSnapshot: string
        unitPriceSnapshot: number
        quantity: number
        optionTotalAmount: number
        lineTotalAmount: number
        orderFlowType: string
        cartStatus: CartStatus
        requestMemo: string | null
        createdAt: string
      }>

    const optionRows = db
      .prepare(
        `
          SELECT
            id,
            cartItemId,
            optionNameSnapshot,
            optionTypeSnapshot,
            optionValueNameSnapshot,
            priceDeltaSnapshot,
            quantity,
            lineOptionAmount
          FROM cart_item_options
          WHERE cartItemId IN (
            SELECT id
            FROM cart_items
            WHERE actorChannelCode = ?
              AND cartStatus = ?
          )
          ORDER BY cartItemId ASC, sortOrder ASC, id ASC
        `
      )
      .all(actor.actorChannelCode, cartStatus) as Array<{
        id: number
        cartItemId: number
        optionNameSnapshot: string
        optionTypeSnapshot: OptionType
        optionValueNameSnapshot: string
        priceDeltaSnapshot: number
        quantity: number
        lineOptionAmount: number
      }>

    const optionsByCartItemId = new Map<number, Array<{
      id: number
      optionNameSnapshot: string
      optionTypeSnapshot: OptionType
      optionValueNameSnapshot: string
      priceDeltaSnapshot: number
      quantity: number
      lineOptionAmount: number
    }>>()

    optionRows.forEach((option) => {
      const list = optionsByCartItemId.get(option.cartItemId) ?? []
      list.push({
        id: option.id,
        optionNameSnapshot: option.optionNameSnapshot,
        optionTypeSnapshot: option.optionTypeSnapshot,
        optionValueNameSnapshot: option.optionValueNameSnapshot,
        priceDeltaSnapshot: this.normalizeNonNegativeInteger(option.priceDeltaSnapshot, 0),
        quantity: this.normalizePositiveQuantity(option.quantity),
        lineOptionAmount: this.normalizeNonNegativeInteger(option.lineOptionAmount, 0)
      })
      optionsByCartItemId.set(option.cartItemId, list)
    })

    return {
      ok: true as const,
      items: rows.map((item) => ({
        id: item.id,
        cartSessionCode: item.cartSessionCode,
        cartItemCode: item.cartItemCode,
        providerChannelCode: item.providerChannelCode,
        productCode: item.productCode,
        productNameSnapshot: item.productNameSnapshot,
        unitPriceSnapshot: this.normalizeNonNegativeInteger(item.unitPriceSnapshot, 0),
        quantity: this.normalizePositiveQuantity(item.quantity),
        optionTotalAmount: this.normalizeNonNegativeInteger(item.optionTotalAmount, 0),
        lineTotalAmount: this.normalizeNonNegativeInteger(item.lineTotalAmount, 0),
        orderFlowType: item.orderFlowType,
        cartStatus: item.cartStatus,
        requestMemo: item.requestMemo,
        createdAt: item.createdAt,
        options: optionsByCartItemId.get(item.id) ?? []
      }))
    }
  }

  updateCartItemQuantity(user: JwtUser | undefined, cartItemIdInput: string, quantityInput: number) {
    const actor = this.getActorContext(user)
    const cartItemId = Number(cartItemIdInput)
    const quantity = this.normalizePositiveQuantity(quantityInput)

    if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
      throw new BadRequestException('cartItemId is invalid')
    }

    const owned = this.getOwnedCartItem(actor.actorChannelCode, cartItemId)
    if (owned.cartStatus !== 'ACTIVE') {
      throw new BadRequestException('only ACTIVE cart item can be updated')
    }

    const unit = this.normalizeNonNegativeInteger(owned.unitPriceSnapshot, 0)
    const optionTotal = this.normalizeNonNegativeInteger(owned.optionTotalAmount, 0)
    const lineTotalAmount = (unit + optionTotal) * quantity

    db.prepare(
      `
        UPDATE cart_items
        SET
          quantity = ?,
          lineTotalAmount = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    ).run(quantity, lineTotalAmount, cartItemId)

    return {
      ok: true as const,
      item: {
        id: cartItemId,
        quantity,
        lineTotalAmount
      }
    }
  }

  updateCartItemMemo(user: JwtUser | undefined, cartItemIdInput: string, requestMemoInput: string | null) {
    const actor = this.getActorContext(user)
    const cartItemId = Number(cartItemIdInput)
    if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
      throw new BadRequestException('cartItemId is invalid')
    }

    const owned = this.getOwnedCartItem(actor.actorChannelCode, cartItemId)
    if (owned.cartStatus !== 'ACTIVE') {
      throw new BadRequestException('only ACTIVE cart item can be updated')
    }

    const requestMemo = requestMemoInput === null
      ? null
      : String(requestMemoInput ?? '').trim() || null

    db.prepare(
      `
        UPDATE cart_items
        SET
          requestMemo = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    ).run(requestMemo, cartItemId)

    return {
      ok: true as const,
      item: {
        id: cartItemId,
        requestMemo
      }
    }
  }

  deleteCartItem(user: JwtUser | undefined, cartItemIdInput: string) {
    const actor = this.getActorContext(user)
    const cartItemId = Number(cartItemIdInput)
    if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
      throw new BadRequestException('cartItemId is invalid')
    }

    this.getOwnedCartItem(actor.actorChannelCode, cartItemId)

    db.prepare(
      `
        UPDATE cart_items
        SET
          cartStatus = 'DELETED',
          deletedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND actorChannelCode = ?
      `
    ).run(cartItemId, actor.actorChannelCode)

    return {
      ok: true as const,
      cartItemId,
      cartStatus: 'DELETED' as CartStatus
    }
  }

  clearCartItems(user: JwtUser | undefined, providerChannelCodeInput?: string) {
    const actor = this.getActorContext(user)
    const providerChannelCode = String(providerChannelCodeInput ?? '').trim()

    if (providerChannelCode) {
      const normalizedProviderChannelCode = this.normalizeChannelCode13(providerChannelCode, 'providerChannelCode')
      db.prepare(
        `
          UPDATE cart_items
          SET
            cartStatus = 'DELETED',
            deletedAt = CURRENT_TIMESTAMP,
            updatedAt = CURRENT_TIMESTAMP
          WHERE actorChannelCode = ?
            AND providerChannelCode = ?
            AND cartStatus = 'ACTIVE'
        `
      ).run(actor.actorChannelCode, normalizedProviderChannelCode)
    } else {
      db.prepare(
        `
          UPDATE cart_items
          SET
            cartStatus = 'DELETED',
            deletedAt = CURRENT_TIMESTAMP,
            updatedAt = CURRENT_TIMESTAMP
          WHERE actorChannelCode = ?
            AND cartStatus = 'ACTIVE'
        `
      ).run(actor.actorChannelCode)
    }

    return {
      ok: true as const
    }
  }

  getCartCount(user: JwtUser | undefined) {
    const actor = this.getActorContext(user)

    const row = db.prepare(
      `
        SELECT
          COUNT(*) AS activeItemCount,
          COALESCE(SUM(quantity), 0) AS activeProductQuantity
        FROM cart_items
        WHERE actorChannelCode = ?
          AND cartStatus = 'ACTIVE'
      `
    ).get(actor.actorChannelCode) as {
      activeItemCount?: number
      activeProductQuantity?: number
    } | undefined

    return {
      ok: true as const,
      activeItemCount: this.normalizeNonNegativeInteger(row?.activeItemCount, 0),
      activeProductQuantity: this.normalizeNonNegativeInteger(row?.activeProductQuantity, 0)
    }
  }
}

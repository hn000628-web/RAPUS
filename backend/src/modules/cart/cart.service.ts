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
type ProductSourceType = 'POS_PRODUCT' | 'MARKET_PRODUCT'

type ActorContext = {
  actorProfileId: number
  actorChannelCode: string
  customerChannelCode: string
}

type ProviderProfileRow = {
  id: number
  channelCode: string
}

type ProductRow = {
  id: number
  productId: string | null
  profileId: number
  channelCode: string
  productCode: string
  sourceType: ProductSourceType
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
  productDbId?: number
  productId?: string
  productCode: string
  sourceType?: ProductSourceType
  quantity: number
  orderFlowType: OrderFlowType
  fulfillmentType?: OrderFlowType
  requestMemo?: string
  options?: AddCartItemOptionInput[]
}

type CartItemOwnerRow = {
  id: number
  customerChannelCode: string
  cartStatus: CartStatus
  unitPriceSnapshot: number
  optionTotalAmount: number
}

type ResolvedCartOption = {
  productOptionId: number | null
  productOptionValueId: number | null
  optionNameSnapshot: string
  optionTypeSnapshot: OptionType
  optionValueNameSnapshot: string
  priceDeltaSnapshot: number
  quantity: number
  lineOptionAmount: number
  sortOrder: number
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

  private createUniqueCartCode(): string {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const cartCode = this.createBusinessCode12('CT')
      const exists = db.prepare(`
        SELECT id
        FROM cart_items
        WHERE cartCode = ?
        LIMIT 1
      `).get(cartCode) as { id?: number } | undefined

      if (!exists?.id) {
        return cartCode
      }
    }

    throw new BadRequestException('failed to create cartCode')
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

  private buildFulfillmentSignature(
    fulfillmentType: OrderFlowType,
    providerChannelCode: string
  ): string {
    if (fulfillmentType === 'DELIVERY') {
      return 'DELIVERY:DEFAULT'
    }
    if (fulfillmentType === 'PICKUP') {
      return `PICKUP:${providerChannelCode}`
    }
    if (fulfillmentType === 'IN_STORE') {
      return `IN_STORE:${providerChannelCode}`
    }
    if (fulfillmentType === 'PARCEL') {
      return 'PARCEL:DEFAULT'
    }
    if (fulfillmentType === 'RESERVATION') {
      return 'RESERVATION:DEFAULT'
    }
    if (fulfillmentType === 'ROOM_SERVICE') {
      return 'ROOM_SERVICE:DEFAULT'
    }
    if (fulfillmentType === 'SERVICE') {
      return 'SERVICE:DEFAULT'
    }
    return 'DEFAULT_FULFILLMENT'
  }

  private normalizeSourceType(value: unknown): ProductSourceType {
    const normalized = String(value ?? 'POS_PRODUCT').trim().toUpperCase()
    if (normalized !== 'POS_PRODUCT' && normalized !== 'MARKET_PRODUCT') {
      throw new BadRequestException('sourceType is invalid')
    }
    return normalized as ProductSourceType
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
      actorChannelCode,
      customerChannelCode: actorChannelCode
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
            p.productId,
            p.profileId,
            p.channelCode,
            p.productCode,
            p.sourceType,
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

  private buildOptionSignature(options: ResolvedCartOption[]): string {
    if (options.length < 1) {
      return 'NO_OPTIONS'
    }

    const tokens = options
      .map((option) => {
        if (
          Number.isInteger(option.productOptionId) &&
          Number(option.productOptionId) > 0 &&
          Number.isInteger(option.productOptionValueId) &&
          Number(option.productOptionValueId) > 0
        ) {
          return `${Number(option.productOptionId)}:${Number(option.productOptionValueId)}`
        }

        const optionName = String(option.optionNameSnapshot ?? '').trim()
        const optionValueName = String(option.optionValueNameSnapshot ?? '').trim()
        return `name:${optionName}|value:${optionValueName}`
      })
      .filter((token) => token.length > 0)
      .sort()

    return tokens.length > 0 ? tokens.join(',') : 'NO_OPTIONS'
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

  private getOwnedCartItem(customerChannelCode: string, cartItemId: number): CartItemOwnerRow {
    const row = db
      .prepare(
        `
          SELECT
            id,
            customerChannelCode,
            cartStatus,
            COALESCE(unitPriceSnapshot, 0) AS unitPriceSnapshot,
            COALESCE(optionTotalAmount, 0) AS optionTotalAmount
          FROM cart_items ci
          WHERE id = ?
            AND customerChannelCode = ?
          LIMIT 1
        `
      )
      .get(cartItemId, customerChannelCode) as CartItemOwnerRow | undefined

    if (!row?.id) {
      throw new NotFoundException('cart item not found')
    }

    return row
  }

  addCartItem(user: JwtUser | undefined, input: AddCartItemInput) {
    const actor = this.getActorContext(user)
    const providerChannelCode = this.normalizeChannelCode13(input.providerChannelCode, 'providerChannelCode')
    const productDbId = input.productDbId === undefined ? null : this.normalizePositiveQuantity(input.productDbId)
    const productId = input.productId === undefined ? null : String(input.productId).trim()
    const productCode = this.normalizeBusinessCode12(input.productCode, 'productCode')
    const sourceType = this.normalizeSourceType(input.sourceType)
    const quantity = this.normalizePositiveQuantity(input.quantity)
    const orderFlowType = this.normalizeOrderFlowType(input.orderFlowType)
    const fulfillmentType = input.fulfillmentType
      ? this.normalizeOrderFlowType(input.fulfillmentType)
      : orderFlowType
    const fulfillmentSignature = this.buildFulfillmentSignature(
      fulfillmentType,
      providerChannelCode
    )
    const requestMemo = input.requestMemo === undefined ? null : String(input.requestMemo ?? '').trim() || null
    const provider = this.getProviderProfile(providerChannelCode)
    const product = this.getTargetProduct(providerChannelCode, productCode)

    if (productDbId !== null && product.id !== productDbId) {
      throw new BadRequestException('productDbId does not match productCode')
    }

    if (productId !== null && product.productId && product.productId !== productId) {
      throw new BadRequestException('productId does not match productCode')
    }

    if (product.sourceType !== sourceType) {
      throw new BadRequestException('sourceType does not match product')
    }

    const optionInputs = Array.isArray(input.options) ? input.options : []
    const resolvedOptions: ResolvedCartOption[] = []
    let optionTotalAmount = 0

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

      const normalizedPriceDeltaSnapshot = this.normalizeNonNegativeInteger(priceDeltaSnapshot, 0)
      const lineOptionAmount = normalizedPriceDeltaSnapshot * optionQuantity
      optionTotalAmount += lineOptionAmount

      resolvedOptions.push({
        productOptionId: resolvedOptionId,
        productOptionValueId: resolvedOptionValueId,
        optionNameSnapshot,
        optionTypeSnapshot,
        optionValueNameSnapshot,
        priceDeltaSnapshot: normalizedPriceDeltaSnapshot,
        quantity: optionQuantity,
        lineOptionAmount,
        sortOrder: index
      })
    })

    const optionSignature = this.buildOptionSignature(resolvedOptions)
    const duplicate = db
      .prepare(
        `
          SELECT
            id,
            cartCode,
            cartSessionCode,
            cartItemCode,
            fulfillmentType,
            fulfillmentSignature,
            lineTotalAmount
          FROM cart_items ci
          WHERE customerChannelCode = ?
            AND providerChannelCode = ?
            AND sourceType = ?
            AND productCode = ?
            AND optionSignature = ?
            AND fulfillmentSignature = ?
            AND cartStatus = 'ACTIVE'
          LIMIT 1
        `
      )
      .get(
        actor.customerChannelCode,
        provider.channelCode,
        sourceType,
        product.productCode,
        optionSignature,
        fulfillmentSignature
      ) as {
        id?: number
        cartCode?: string | null
        cartSessionCode?: string | null
        cartItemCode?: string | null
        fulfillmentType?: string | null
        fulfillmentSignature?: string | null
        lineTotalAmount?: number
      } | undefined

    if (duplicate?.id) {
      return {
        ok: true as const,
        status: 'DUPLICATE' as const,
        message: '이미 장바구니에 저장되었습니다.',
        item: {
          id: duplicate.id,
          customerChannelCode: actor.customerChannelCode,
          providerChannelCode: provider.channelCode,
          cartCode: duplicate.cartCode ?? duplicate.cartSessionCode ?? null,
          cartSessionCode: duplicate.cartSessionCode ?? null,
          cartItemCode: duplicate.cartItemCode ?? '',
          productDbId: product.id,
          productId: product.productId,
          productCode: product.productCode,
          sourceType,
          quantity: 0,
          fulfillmentType: (duplicate.fulfillmentType ?? fulfillmentType) as OrderFlowType,
          fulfillmentSignature: duplicate.fulfillmentSignature ?? fulfillmentSignature,
          cartStatus: 'ACTIVE' as CartStatus,
          lineTotalAmount: this.normalizeNonNegativeInteger(duplicate.lineTotalAmount, 0)
        }
      }
    }

    let cartItemId = 0
    const activeCart = db
      .prepare(
        `
          SELECT
            cartCode,
            cartSessionCode
          FROM cart_items
          WHERE customerChannelCode = ?
            AND providerChannelCode = ?
            AND cartStatus = 'ACTIVE'
          ORDER BY id DESC
          LIMIT 1
        `
      )
      .get(actor.customerChannelCode, provider.channelCode) as {
        cartCode?: string | null
        cartSessionCode?: string | null
      } | undefined
    const cartCode = activeCart?.cartCode?.trim()
      ? String(activeCart.cartCode).trim()
      : activeCart?.cartSessionCode?.trim()
        ? String(activeCart.cartSessionCode).trim()
        : this.createUniqueCartCode()
    const cartSessionCode = cartCode
    const cartItemCode = this.createUniqueCartItemCode()
    let lineTotalAmount = 0

    const tx = db.transaction(() => {
      const insertResult = db
        .prepare(
          `
            INSERT INTO cart_items(
              actorProfileId,
              actorChannelCode,
              customerChannelCode,
              providerProfileId,
              providerChannelCode,
              productId,
              sourceType,
              cartCode,
              cartSessionCode,
              cartItemCode,
              productCode,
              optionSignature,
              fulfillmentType,
              fulfillmentSignature,
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
            VALUES(
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            )
          `
        )
        .run(
          actor.actorProfileId,
          actor.actorChannelCode,
          actor.customerChannelCode,
          provider.id,
          provider.channelCode,
          product.id,
          sourceType,
          cartCode,
          cartSessionCode,
          cartItemCode,
          product.productCode,
          optionSignature,
          fulfillmentType,
          fulfillmentSignature,
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
          'ACTIVE',
          requestMemo
        )

      cartItemId = Number(insertResult.lastInsertRowid ?? 0)

      if (!cartItemId) {
        throw new BadRequestException('failed to create cart item')
      }

      resolvedOptions.forEach((option) => {
        db.prepare(
          `
            INSERT INTO cart_item_options(
              cartItemId,
              cartCode,
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
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
          `
        ).run(
          cartItemId,
          cartCode,
          cartItemCode,
          provider.channelCode,
          product.productCode,
          option.productOptionId,
          option.productOptionValueId,
          option.optionNameSnapshot,
          option.optionTypeSnapshot,
          option.optionValueNameSnapshot,
          option.priceDeltaSnapshot,
          option.quantity,
          option.lineOptionAmount,
          option.sortOrder
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
      status: 'CREATED' as const,
      message: '장바구니에 저장되었습니다.',
      item: {
        id: cartItemId,
        customerChannelCode: actor.customerChannelCode,
        providerChannelCode: provider.channelCode,
        cartCode,
        cartSessionCode,
        cartItemCode,
        productDbId: product.id,
        productId: product.productId,
        productCode: product.productCode,
        sourceType,
        quantity,
        fulfillmentType,
        fulfillmentSignature,
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
            ci.id,
            ci.cartCode,
            ci.cartSessionCode,
            ci.cartItemCode,
            ci.providerChannelCode,
            ci.productId AS productDbId,
            p.productId AS productId,
            ci.productCode,
            ci.sourceType,
            ci.productNameSnapshot,
            ci.unitPriceSnapshot,
            ci.quantity,
            ci.optionTotalAmount,
            ci.lineTotalAmount,
            ci.orderFlowType,
            ci.fulfillmentType,
            ci.fulfillmentSignature,
            ci.cartStatus,
            ci.orderCode,
            ci.requestMemo,
            ci.createdAt
          FROM cart_items ci
          LEFT JOIN pos_products p
            ON p.id = ci.productId
          WHERE ci.customerChannelCode = ?
            AND ci.cartStatus = ?
          ORDER BY ci.createdAt DESC, ci.id DESC
        `
      )
      .all(actor.customerChannelCode, cartStatus) as Array<{
        id: number
        cartSessionCode: string | null
        cartCode: string | null
        cartItemCode: string
        providerChannelCode: string
        productDbId: number | null
        productId: string | null
        productCode: string
        sourceType: ProductSourceType
        productNameSnapshot: string
        unitPriceSnapshot: number
        quantity: number
        optionTotalAmount: number
        lineTotalAmount: number
        orderFlowType: string
        fulfillmentType: string | null
        fulfillmentSignature: string | null
        cartStatus: CartStatus
        orderCode: string | null
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
            WHERE customerChannelCode = ?
              AND cartStatus = ?
          )
          ORDER BY cartItemId ASC, sortOrder ASC, id ASC
        `
      )
      .all(actor.customerChannelCode, cartStatus) as Array<{
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
        cartCode: item.cartCode,
        cartSessionCode: item.cartSessionCode,
        cartItemCode: item.cartItemCode,
        providerChannelCode: item.providerChannelCode,
        productDbId: item.productDbId,
        productId: item.productId,
        productCode: item.productCode,
        sourceType: item.sourceType,
        productNameSnapshot: item.productNameSnapshot,
        unitPriceSnapshot: this.normalizeNonNegativeInteger(item.unitPriceSnapshot, 0),
        quantity: this.normalizePositiveQuantity(item.quantity),
        optionTotalAmount: this.normalizeNonNegativeInteger(item.optionTotalAmount, 0),
        lineTotalAmount: this.normalizeNonNegativeInteger(item.lineTotalAmount, 0),
        orderFlowType: item.orderFlowType,
        fulfillmentType: item.fulfillmentType,
        fulfillmentSignature: item.fulfillmentSignature,
        cartStatus: item.cartStatus,
        orderCode: item.orderCode,
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

    const owned = this.getOwnedCartItem(actor.customerChannelCode, cartItemId)
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

    const owned = this.getOwnedCartItem(actor.customerChannelCode, cartItemId)
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

    this.getOwnedCartItem(actor.customerChannelCode, cartItemId)

    db.prepare(
      `
        UPDATE cart_items
        SET
          cartStatus = 'DELETED',
          deletedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND customerChannelCode = ?
      `
    ).run(cartItemId, actor.customerChannelCode)

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
          WHERE customerChannelCode = ?
            AND providerChannelCode = ?
            AND cartStatus = 'ACTIVE'
        `
      ).run(actor.customerChannelCode, normalizedProviderChannelCode)
    } else {
      db.prepare(
        `
          UPDATE cart_items
          SET
            cartStatus = 'DELETED',
            deletedAt = CURRENT_TIMESTAMP,
            updatedAt = CURRENT_TIMESTAMP
          WHERE customerChannelCode = ?
            AND cartStatus = 'ACTIVE'
        `
      ).run(actor.customerChannelCode)
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
        WHERE customerChannelCode = ?
          AND cartStatus = 'ACTIVE'
      `
    ).get(actor.customerChannelCode) as {
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

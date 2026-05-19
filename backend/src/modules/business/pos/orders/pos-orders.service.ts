// FILE : backend/src/modules/business/pos/orders/pos-orders.service.ts
// ROOT : backend/src/modules/business/pos/orders/pos-orders.service.ts
// STATUS : CREATE MODE
// ROLE : POS ORDER CREATE SERVICE
// CHANGE SUMMARY :
// - POS 주문 등록 Service 신규 생성
// - Service 단일 DB 접근 구조 적용
// - pos_orders / pos_order_items / pos_order_item_options transaction 저장
// - 상품명 / 가격 / 카테고리 / 옵션 snapshot 저장
// - totalAmount는 Service에서 DB 상품 기준으로 계산
// - TABLE orderFlowType 입력은 DB 호환값 IN_STORE로 정규화

// SECTION 01 : IMPORT

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'

import db from '../../../../config/database'

import {
  CancelPosOrderDto,
  CancelPosOrderResponse,
  CompletePosPaymentDto,
  CompletePosPaymentResponse,
  CreatePosOrderDto,
  CreatePosOrderItemDto,
  CreatePosOrderItemOptionDto,
  CreatePosOrderResponse,
  GetActivePosOrderDto,
  GetActivePosOrderResponse,
  PosPaymentMethod,
  PosOrderFlowType,
  PosOrderOptionType,
  PosOrderSource
} from './dto/create-pos-order.dto'

// SECTION 02 : TYPE

type ProfileRow = {
  id: number
  channelCode: string
}

type PosLocationRow = {
  id: number
  locationName: string
  defaultPrice: number | null
  resourceStatus: string | null
}

type ActivePosOrderRow = {
  id: number
  orderCode: string
  revisionCode: string
  revisionNo: number
  orderDate: string
  orderYear: number
  orderMonth: number
  orderDay: number
  orderSequence: number
  subtotalAmount: number
  totalAmount: number
}

type ActivePosOrderItemRow = {
  id: number
  posProductId: number
  productNameSnapshot: string
  unitPriceSnapshot: number
  quantity: number
  lineTotalAmount: number
  sortOrder: number
}

type ActivePosOrderItemOptionRow = {
  id: number
  orderItemId: number
  productOptionId: number | null
  productOptionValueId: number | null
  optionNameSnapshot: string
  optionValueNameSnapshot: string
  quantity: number
  lineOptionAmount: number
}

type PayablePosOrderRow = {
  id: number
  orderCode: string
  revisionCode: string
  providerChannelCode: string
  orderSource: PosOrderSource
  orderFlowType: NormalizedOrderFlowType
  locationId: number
  totalAmount: number
  customerProfileId: number | null
  customerChannelCode: string | null
}

type PosProductRow = {
  id: number
  productCode: string | null
  productKind: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  categoryCode: string | null
  categoryName: string | null
  ageRestrictionType: string | null
  requiresAdultVerification: number
  restrictedOrderChannel: string | null
  productName: string
  basePrice: number
}

type PosOptionRow = {
  optionId: number
  optionName: string
  optionType: PosOrderOptionType
  optionValueId: number | null
  optionValueName: string | null
  priceDelta: number | null
}

type InsertResult = {
  lastInsertRowid: number | bigint
}

type NormalizedOrderFlowType =
  | 'IN_STORE'
  | 'PICKUP'
  | 'DELIVERY'
  | 'RESERVATION'
  | 'SERVICE'

type NormalizedOrderItemOption = {
  productOptionId: number | null
  productOptionValueId: number | null
  optionNameSnapshot: string
  optionTypeSnapshot: PosOrderOptionType
  optionValueNameSnapshot: string
  priceDeltaSnapshot: number
  quantity: number
  lineOptionAmount: number
}

type NormalizedOrderItem = {
  posProductId: number
  productTypeSnapshot: 'PRODUCT'
  productKindSnapshot: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  categoryNameSnapshot: string | null
  productNameSnapshot: string
  unitPriceSnapshot: number
  categoryCode: string | null
  ageRestrictionType: string | null
  requiresAdultVerification: boolean
  restrictedOrderChannel: string | null
  quantity: number
  lineTotalAmount: number
  sortOrder: number
  options: NormalizedOrderItemOption[]
}

type NormalizedOrderPayload = {
  providerProfileId: number
  providerChannelCode: string
  customerProfileId: number | null
  customerChannelCode: string | null
  orderSource: PosOrderSource
  orderFlowType: NormalizedOrderFlowType
  locationId: number
  locationNameSnapshot: string
  subtotalAmount: number
  totalAmount: number
  memo: string | null
  previousOrderId: number | null
  previousOrderCode: string | null
  items: NormalizedOrderItem[]
}

type OrderCodeContext = {
  orderCode: string
  revisionCode: string
  revisionNo: number
  orderDate: string
  orderYear: number
  orderMonth: number
  orderDay: number
  orderSequence: number
}

// SECTION 03 : CONSTANT

const ORDER_SOURCE_SET =
  new Set<PosOrderSource>([
    'POS',
    'KIOSK',
    'TABLE_ORDER',
    'QR_ORDER',
    'ONLINE',
    'PHONE',
    'ADMIN'
  ])

const ORDER_FLOW_TYPE_SET =
  new Set<PosOrderFlowType>([
    'TABLE',
    'IN_STORE',
    'PICKUP',
    'DELIVERY',
    'RESERVATION',
    'SERVICE'
  ])

const OPTION_TYPE_SET =
  new Set<PosOrderOptionType>([
    'SIZE',
    'TEMPERATURE',
    'ADDON',
    'CHOICE',
    'CUSTOM'
  ])

const PAYMENT_METHOD_SET =
  new Set<PosPaymentMethod>([
    'CASH',
    'CARD',
    'QR',
    'NFC',
    'MIXED'
  ])

// SECTION 04 : SERVICE

@Injectable()
export class PosOrdersService {
  // SECTION 05 : PUBLIC METHOD

  createOrder(
    dto: CreatePosOrderDto
  ): CreatePosOrderResponse {
    const payload =
      this.normalizeOrderPayload(dto)

    const createOrderTransaction =
      db.transaction(() => {
        const activeOrder =
          this.findActiveUnpaidOrderForLocation(
            payload.providerProfileId,
            payload.providerChannelCode,
            payload.locationId
          )

        const orderCodeContext =
          activeOrder
            ? this.createRevisionContextFromActiveOrder(activeOrder)
            : this.createOrderCodeContext(payload.providerChannelCode)

        this.deactivateActiveUnpaidOrdersForLocation(
          payload.providerProfileId,
          payload.providerChannelCode,
          payload.locationId
        )

        const orderResult =
          db.prepare(`
            INSERT INTO pos_orders(
              orderCode,
              revisionCode,
              revisionNo,
              orderDate,
              orderYear,
              orderMonth,
              orderDay,
              orderSequence,
              providerProfileId,
              providerChannelCode,
              customerProfileId,
              customerChannelCode,
              orderSource,
              orderFlowType,
              locationId,
              locationNameSnapshot,
              orderStatus,
              paymentStatus,
              subtotalAmount,
              discountAmount,
              taxAmount,
              totalAmount,
              isActive,
              memo,
              updatedAt
            )
            VALUES(
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              'CREATED',
              'UNPAID',
              ?,
              0,
              0,
              ?,
              1,
              ?,
              CURRENT_TIMESTAMP
            )
          `).run(
            orderCodeContext.orderCode,
            orderCodeContext.revisionCode,
            orderCodeContext.revisionNo,
            orderCodeContext.orderDate,
            orderCodeContext.orderYear,
            orderCodeContext.orderMonth,
            orderCodeContext.orderDay,
            orderCodeContext.orderSequence,
            payload.providerProfileId,
            payload.providerChannelCode,
            payload.customerProfileId,
            payload.customerChannelCode,
            payload.orderSource,
            payload.orderFlowType,
            payload.locationId,
            payload.locationNameSnapshot,
            payload.subtotalAmount,
            payload.totalAmount,
            payload.memo
          ) as InsertResult

        const orderId =
          Number(orderResult.lastInsertRowid)

        if (this.shouldMoveLocationToInUse(payload)) {
          db.prepare(`
            UPDATE pos_locations
            SET
              resourceStatus = 'IN_USE',
              lastStatusChangedAt = CURRENT_TIMESTAMP,
              updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
              AND channelCode = ?
              AND deletedAt IS NULL
          `).run(
            payload.locationId,
            payload.providerChannelCode
          )
        }

        for (const item of payload.items) {
          const itemResult =
            db.prepare(`
              INSERT INTO pos_order_items(
                orderId,
                orderCode,
                revisionCode,
                revisionNo,
                providerChannelCode,
                posProductId,
                productTypeSnapshot,
                productKindSnapshot,
                categoryNameSnapshot,
                productNameSnapshot,
                unitPriceSnapshot,
                quantity,
                lineTotalAmount,
                sortOrder
              )
              VALUES(
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
              )
              `).run(
                orderId,
                orderCodeContext.orderCode,
                orderCodeContext.revisionCode,
                orderCodeContext.revisionNo,
                payload.providerChannelCode,
                item.posProductId,
                item.productTypeSnapshot,
              item.productKindSnapshot,
              item.categoryNameSnapshot,
              item.productNameSnapshot,
              item.unitPriceSnapshot,
              item.quantity,
              item.lineTotalAmount,
              item.sortOrder
            ) as InsertResult

          const orderItemId =
            Number(itemResult.lastInsertRowid)

          for (const option of item.options) {
            db.prepare(`
              INSERT INTO pos_order_item_options(
                orderItemId,
                providerChannelCode,
                productOptionId,
                productOptionValueId,
                optionNameSnapshot,
                optionTypeSnapshot,
                optionValueNameSnapshot,
                priceDeltaSnapshot,
                quantity,
                lineOptionAmount
              )
              VALUES(
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
              )
            `).run(
              orderItemId,
              payload.providerChannelCode,
              option.productOptionId,
              option.productOptionValueId,
              option.optionNameSnapshot,
              option.optionTypeSnapshot,
              option.optionValueNameSnapshot,
              option.priceDeltaSnapshot,
              option.quantity,
              option.lineOptionAmount
            )
          }
        }

        return {
          ok: true,
          orderId,
          orderCode: orderCodeContext.orderCode,
          orderNumber: orderCodeContext.orderCode,
          revisionCode: orderCodeContext.revisionCode,
          revisionNo: orderCodeContext.revisionNo,
          subtotalAmount: payload.subtotalAmount,
          totalAmount: payload.totalAmount
        }
      })

    try {
      return createOrderTransaction() as CreatePosOrderResponse
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }

      throw new InternalServerErrorException(
        'POS 주문 등록 중 오류가 발생했습니다.'
      )
    }
  }

  cancelOrder(
    dto: CancelPosOrderDto
  ): CancelPosOrderResponse {
    if (!this.isPositiveInteger(dto.profileId)) {
      throw new BadRequestException('profileId가 올바르지 않습니다.')
    }

    const channelCode =
      this.normalizeNullableString(dto.channelCode)

    if (!channelCode) {
      throw new BadRequestException('channelCode가 필요합니다.')
    }

    if (!this.isPositiveInteger(dto.locationId)) {
      throw new BadRequestException('locationId가 올바르지 않습니다.')
    }

    const profile =
      this.findBusinessProfile(dto.profileId, channelCode)

    const orderId =
      this.normalizeNullableNumber(dto.orderId)

    const orderCode =
      this.normalizeNullableString(dto.orderCode)

    const result =
      this.cancelActiveUnpaidOrdersForLocation({
        providerProfileId: profile.id,
        providerChannelCode: profile.channelCode,
        locationId: dto.locationId,
        orderId,
        orderCode
      })

    return {
      ok: true,
      canceledOrderCount: result
    }
  }

  getActiveOrder(
    dto: GetActivePosOrderDto
  ): GetActivePosOrderResponse {
    const profileId =
      this.normalizeQueryPositiveInteger(dto.profileId)

    const locationId =
      this.normalizeQueryPositiveInteger(dto.locationId)

    if (!this.isPositiveInteger(profileId)) {
      throw new BadRequestException('profileId가 올바르지 않습니다.')
    }

    const channelCode =
      this.normalizeNullableString(dto.channelCode)

    if (!channelCode) {
      throw new BadRequestException('channelCode가 필요합니다.')
    }

    if (!this.isPositiveInteger(locationId)) {
      throw new BadRequestException('locationId가 올바르지 않습니다.')
    }

    const profile =
      this.findBusinessProfile(profileId, channelCode)

    const activeOrder =
      this.findActiveUnpaidOrderForLocation(
        profile.id,
        profile.channelCode,
        locationId
      )

    if (!activeOrder) {
      return {
        ok: true,
        order: null,
        items: []
      }
    }

    const items =
      db.prepare(`
        SELECT
          id,
          posProductId,
          productNameSnapshot,
          unitPriceSnapshot,
          quantity,
          lineTotalAmount,
          sortOrder
        FROM pos_order_items
        WHERE orderId = ?
        ORDER BY sortOrder ASC, id ASC
      `).all(activeOrder.id) as ActivePosOrderItemRow[]

    const itemIds = items.map((item) => item.id)
    const optionRows =
      itemIds.length < 1
        ? []
        : db.prepare(`
            SELECT
              id,
              orderItemId,
              productOptionId,
              productOptionValueId,
              optionNameSnapshot,
              optionValueNameSnapshot,
              quantity,
              lineOptionAmount
            FROM pos_order_item_options
            WHERE orderItemId IN (${itemIds.map(() => '?').join(', ')})
            ORDER BY id ASC
          `).all(...itemIds) as ActivePosOrderItemOptionRow[]

    const optionRowsByOrderItemId =
      optionRows.reduce<Map<number, ActivePosOrderItemOptionRow[]>>((accumulator, row) => {
        const current = accumulator.get(row.orderItemId) ?? []
        current.push(row)
        accumulator.set(row.orderItemId, current)
        return accumulator
      }, new Map())

    return {
      ok: true,
      order: {
        orderId: activeOrder.id,
        orderCode: activeOrder.orderCode,
        orderNumber: activeOrder.orderCode,
        revisionCode: activeOrder.revisionCode,
        revisionNo: activeOrder.revisionNo,
        subtotalAmount: activeOrder.subtotalAmount,
        totalAmount: activeOrder.totalAmount
      },
      items: items.map((item) => ({
        id: item.id,
        productId: item.posProductId,
        productName: item.productNameSnapshot,
        unitPrice: item.unitPriceSnapshot,
        quantity: item.quantity,
        lineTotalAmount: item.lineTotalAmount,
        sortOrder: item.sortOrder,
        options: (optionRowsByOrderItemId.get(item.id) ?? []).map((optionRow) => ({
          id: optionRow.id,
          productOptionId: optionRow.productOptionId ?? null,
          productOptionValueId: optionRow.productOptionValueId ?? null,
          optionName: optionRow.optionNameSnapshot,
          optionValueName: optionRow.optionValueNameSnapshot,
          quantity: optionRow.quantity,
          lineOptionAmount: optionRow.lineOptionAmount
        }))
      }))
    }
  }

  completePayment(
    dto: CompletePosPaymentDto
  ): CompletePosPaymentResponse {
    if (!this.isPositiveInteger(dto.profileId)) {
      throw new BadRequestException('profileId가 올바르지 않습니다.')
    }

    const channelCode =
      this.normalizeNullableString(dto.channelCode)

    if (!channelCode) {
      throw new BadRequestException('channelCode가 필요합니다.')
    }

    if (!this.isPositiveInteger(dto.locationId)) {
      throw new BadRequestException('locationId가 올바르지 않습니다.')
    }

    if (!PAYMENT_METHOD_SET.has(dto.paymentMethod)) {
      throw new BadRequestException('paymentMethod가 올바르지 않습니다.')
    }

    const profile =
      this.findBusinessProfile(dto.profileId, channelCode)

    const targetOrder =
      this.findPayableActiveOrder({
        providerProfileId: profile.id,
        providerChannelCode: profile.channelCode,
        locationId: dto.locationId,
        orderId: this.normalizeNullableNumber(dto.orderId),
        orderCode: this.normalizeNullableString(dto.orderCode)
      })

    if (!targetOrder) {
      throw new BadRequestException('결제 가능한 주문을 찾을 수 없습니다.')
    }

    const paymentAmount =
      Number(targetOrder.totalAmount ?? 0)

    let receivedCashAmount: number | null = null
    let changeAmount: number | null = null

    if (dto.paymentMethod === 'CASH') {
      const normalizedReceivedCash =
        this.normalizeNonNegativeNumber(
          Number(dto.receivedCashAmount ?? 0),
          '받은 금액이 올바르지 않습니다.'
        )

      if (normalizedReceivedCash < paymentAmount) {
        throw new BadRequestException('받은 금액이 부족합니다.')
      }

      receivedCashAmount = normalizedReceivedCash
      changeAmount = normalizedReceivedCash - paymentAmount
    }

    const paidStaffCode =
      this.normalizeNullableString(dto.paidStaffCode) ||
      profile.channelCode

    const paidStaffNameSnapshot =
      this.normalizeNullableString(dto.paidStaffNameSnapshot)

    const memo =
      this.normalizeNullableString(dto.memo)

    const completePaymentTransaction =
      db.transaction(() => {
        const paymentCode =
          this.createPaymentCode()

        const paymentResult =
          db.prepare(`
            INSERT INTO pos_payments(
              providerProfileId,
              providerChannelCode,
              orderId,
              orderCode,
              revisionCode,
              paymentCode,
              paymentMethod,
              paymentStatus,
              paymentAmount,
              receivedCashAmount,
              changeAmount,
              customerProfileId,
              customerChannelCode,
              paidStaffCode,
              paidStaffNameSnapshot,
              approvedAt,
              memo,
              updatedAt
            )
            VALUES(
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              'PAID',
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              CURRENT_TIMESTAMP,
              ?,
              CURRENT_TIMESTAMP
            )
          `).run(
            profile.id,
            profile.channelCode,
            targetOrder.id,
            targetOrder.orderCode,
            targetOrder.revisionCode,
            paymentCode,
            dto.paymentMethod,
            paymentAmount,
            receivedCashAmount,
            changeAmount,
            targetOrder.customerProfileId,
            targetOrder.customerChannelCode,
            paidStaffCode,
            paidStaffNameSnapshot,
            memo
          ) as InsertResult

        db.prepare(`
          UPDATE pos_orders
          SET
            paymentStatus = 'PAID',
            orderStatus = 'CONFIRMED',
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
            AND providerProfileId = ?
            AND providerChannelCode = ?
            AND paymentStatus = 'UNPAID'
        `).run(
          targetOrder.id,
          profile.id,
          profile.channelCode
        )

        if (this.shouldMoveTableToCleaning(targetOrder)) {
          db.prepare(`
            UPDATE pos_locations
            SET
              resourceStatus = 'CLEANING',
              lastStatusChangedAt = CURRENT_TIMESTAMP,
              updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
              AND channelCode = ?
              AND deletedAt IS NULL
          `).run(
            targetOrder.locationId,
            profile.channelCode
          )
        }

        const paymentId =
          Number(paymentResult.lastInsertRowid)

        return {
          ok: true,
          paymentId,
          paymentCode,
          orderId: targetOrder.id,
          orderCode: targetOrder.orderCode,
          paymentAmount,
          paymentStatus: 'PAID' as const,
          paymentMethod: dto.paymentMethod,
          receivedCashAmount,
          changeAmount
        }
      })

    try {
      return completePaymentTransaction() as CompletePosPaymentResponse
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }

      throw new InternalServerErrorException(
        'POS 결제 처리 중 오류가 발생했습니다.'
      )
    }
  }

  // SECTION 06 : NORMALIZE ORDER

  private normalizeOrderPayload(
    dto: CreatePosOrderDto
  ): NormalizedOrderPayload {
    this.validateBaseDto(dto)

    const profile =
      this.findBusinessProfile(
        dto.profileId,
        dto.channelCode
      )

    const location =
      this.findPosLocation(
        dto.locationId,
        profile.id,
        profile.channelCode
      )

    const orderFlowType =
      this.normalizeOrderFlowType(dto.orderFlowType)

    this.assertLocationCanAcceptTableOrder(
      location,
      dto.orderSource,
      orderFlowType
    )

    const customerProfileId =
      this.normalizeNullableNumber(dto.customerProfileId)
    const customerChannelCode =
      this.normalizeNullableString(dto.customerChannelCode)

    const items =
      dto.items.map((item, index) =>
        this.normalizeOrderItem(
          item,
          profile.channelCode,
          profile.id,
          index
        )
      )

    this.assertAdultVerificationForQrOrder(
      dto.orderSource,
      customerProfileId,
      customerChannelCode,
      items
    )

    const subtotalAmount =
      items.reduce((sum, item) => {
        const optionAmount =
          item.options.reduce(
            (optionSum, option) => optionSum + option.lineOptionAmount,
            0
          )

        return sum + item.lineTotalAmount + optionAmount
      }, 0)

    const normalizedDefaultPrice =
      Number(location.defaultPrice ?? 0)

    const baseAmount =
      Number.isFinite(normalizedDefaultPrice) && normalizedDefaultPrice > 0
        ? Math.floor(normalizedDefaultPrice)
        : 0

    const finalSubtotalAmount =
      items.length === 0
        ? baseAmount
        : subtotalAmount

    return {
      providerProfileId: profile.id,
      providerChannelCode: profile.channelCode,
      customerProfileId,
      customerChannelCode,
      orderSource: dto.orderSource,
      orderFlowType,
      locationId: location.id,
      locationNameSnapshot: location.locationName,
      subtotalAmount: finalSubtotalAmount,
      totalAmount: finalSubtotalAmount,
      memo: this.normalizeNullableString(dto.customerMemo),
      previousOrderId: this.normalizeNullableNumber(dto.previousOrderId),
      previousOrderCode: this.normalizeNullableString(dto.previousOrderCode),
      items
    }
  }

  private normalizeOrderItem(
    item: CreatePosOrderItemDto,
    providerChannelCode: string,
    providerProfileId: number,
    sortOrder: number
  ): NormalizedOrderItem {
    if (!this.isPositiveInteger(item.productId)) {
      throw new BadRequestException('상품 ID가 올바르지 않습니다.')
    }

    if (!this.isPositiveInteger(item.quantity)) {
      throw new BadRequestException('상품 수량은 1개 이상이어야 합니다.')
    }

    const product =
      this.findPosProduct(
        item.productId,
        providerProfileId,
        providerChannelCode
      )

    const options =
      (item.options ?? []).map((option) =>
        this.normalizeOrderItemOption(
          option,
          product.id,
          product.productCode,
          providerChannelCode,
          providerProfileId,
          item.quantity
        )
      )

    return {
      posProductId: product.id,
      productTypeSnapshot: 'PRODUCT',
      productKindSnapshot: product.productKind,
      categoryNameSnapshot: product.categoryName,
      productNameSnapshot: product.productName,
      unitPriceSnapshot: product.basePrice,
      categoryCode: product.categoryCode,
      ageRestrictionType: product.ageRestrictionType,
      requiresAdultVerification: Number(product.requiresAdultVerification || 0) === 1,
      restrictedOrderChannel: product.restrictedOrderChannel,
      quantity: item.quantity,
      lineTotalAmount: product.basePrice * item.quantity,
      sortOrder,
      options
    }
  }

  private assertAdultVerificationForQrOrder(
    orderSource: PosOrderSource,
    customerProfileId: number | null,
    customerChannelCode: string | null,
    items: NormalizedOrderItem[]
  ): void {
    if (orderSource !== 'QR_ORDER') {
      return
    }

    const requiresAdultItems = items.filter((item) => {
      if (!item.requiresAdultVerification) {
        return false
      }

      const restrictedOrderChannel = String(item.restrictedOrderChannel || '')
        .trim()
        .toUpperCase()

      return restrictedOrderChannel === 'QR_ORDER' || restrictedOrderChannel === 'ALL'
    })

    if (requiresAdultItems.length < 1) {
      return
    }

    if (!customerProfileId || !customerChannelCode) {
      throw new BadRequestException('ADULT_VERIFICATION_REQUIRED_FOR_QR_ORDER')
    }

    const verificationRow = db.prepare(`
      SELECT
        u.adultVerificationStatus AS adultVerificationStatus
      FROM profiles p
      INNER JOIN users u
        ON u.id = p.userId
      WHERE p.id = ?
        AND p.channelCode = ?
      LIMIT 1
    `).get(customerProfileId, customerChannelCode) as
      | { adultVerificationStatus?: string | null }
      | undefined

    const adultVerificationStatus = String(
      verificationRow?.adultVerificationStatus || ''
    ).trim().toUpperCase()

    if (adultVerificationStatus !== 'VERIFIED') {
      throw new BadRequestException('ADULT_VERIFICATION_REQUIRED_FOR_QR_ORDER')
    }
  }

  private normalizeOrderItemOption(
    option: CreatePosOrderItemOptionDto,
    productId: number,
    productCode: string | null,
    providerChannelCode: string,
    providerProfileId: number,
    itemQuantity: number
  ): NormalizedOrderItemOption {
    const optionQuantity =
      this.normalizeOptionQuantity(
        option.quantity,
        itemQuantity
      )

    if (
      option.optionId &&
      this.isPositiveInteger(option.optionId)
    ) {
      const optionRow =
        this.findPosProductOption(
          option.optionId,
          option.optionValueId ?? null,
          option.optionValueName ?? null,
          productId,
          productCode,
          providerProfileId,
          providerChannelCode
        )

      const priceDeltaSnapshot =
        Number(optionRow.priceDelta ?? 0)

      return {
        productOptionId: optionRow.optionId,
        productOptionValueId: optionRow.optionValueId,
        optionNameSnapshot: optionRow.optionName,
        optionTypeSnapshot: optionRow.optionType,
        optionValueNameSnapshot:
          optionRow.optionValueName ?? '옵션',
        priceDeltaSnapshot,
        quantity: optionQuantity,
        lineOptionAmount: priceDeltaSnapshot * optionQuantity
      }
    }

    const optionNameSnapshot =
      this.normalizeRequiredString(
        option.optionName,
        '옵션명이 필요합니다.'
      )

    const optionTypeSnapshot =
      this.normalizeOptionType(option.optionType)

    const optionValueNameSnapshot =
      this.normalizeRequiredString(
        option.optionValueName,
        '옵션값이 필요합니다.'
      )

    const priceDeltaSnapshot =
      this.normalizeNonNegativeNumber(
        option.priceDelta ?? 0,
        '옵션 금액이 올바르지 않습니다.'
      )

    return {
      productOptionId: null,
      productOptionValueId: null,
      optionNameSnapshot,
      optionTypeSnapshot,
      optionValueNameSnapshot,
      priceDeltaSnapshot,
      quantity: optionQuantity,
      lineOptionAmount: priceDeltaSnapshot * optionQuantity
    }
  }

  // SECTION 07 : DB LOOKUP

  private findBusinessProfile(
    profileId: number,
    channelCode: string
  ): ProfileRow {
    const row =
      db.prepare(`
        SELECT
          id,
          channelCode
        FROM profiles
        WHERE id = ?
          AND channelCode = ?
          AND profileType = 'BUSINESS'
        LIMIT 1
      `).get(
        profileId,
        channelCode
      ) as ProfileRow | undefined

    if (!row) {
      throw new BadRequestException('BUSINESS 프로필 정보를 찾을 수 없습니다.')
    }

    return row
  }

  private findPosLocation(
    locationId: number,
    profileId: number,
    channelCode: string
  ): PosLocationRow {
    const row =
      db.prepare(`
        SELECT
          id,
          locationName,
          COALESCE(defaultPrice, 0) AS defaultPrice,
          resourceStatus
        FROM pos_locations
        WHERE id = ?
          AND profileId = ?
          AND channelCode = ?
          AND isActive = 1
          AND deletedAt IS NULL
        LIMIT 1
      `).get(
        locationId,
        profileId,
        channelCode
      ) as PosLocationRow | undefined

    if (!row) {
      throw new BadRequestException('POS 테이블 정보를 찾을 수 없습니다.')
    }

    return row
  }

  private findPosProduct(
    productId: number,
    profileId: number,
    channelCode: string
  ): PosProductRow {
    const row =
      db.prepare(`
        SELECT
          p.id,
          p.productCode,
          p.productKind,
          c.categoryCode AS categoryCode,
          c.categoryName AS categoryName,
          c.ageRestrictionType AS ageRestrictionType,
          COALESCE(c.requiresAdultVerification, 0) AS requiresAdultVerification,
          c.restrictedOrderChannel AS restrictedOrderChannel,
          p.productName,
          p.basePrice
        FROM pos_products p
        LEFT JOIN pos_product_categories c
          ON c.id = p.categoryId
        WHERE p.id = ?
          AND p.profileId = ?
          AND p.channelCode = ?
          AND p.isActive = 1
          AND p.isSoldOut = 0
          AND p.deletedAt IS NULL
        LIMIT 1
      `).get(
        productId,
        profileId,
        channelCode
      ) as PosProductRow | undefined

    if (!row) {
      throw new BadRequestException('주문 가능한 POS 상품을 찾을 수 없습니다.')
    }

    return row
  }

  private findPosProductOption(
    optionId: number,
    optionValueId: number | null,
    optionValueName: string | null,
    productId: number,
    productCode: string | null,
    profileId: number,
    channelCode: string
  ): PosOptionRow {
    if (optionValueId !== null && !this.isPositiveInteger(optionValueId)) {
      throw new BadRequestException('옵션값 ID가 올바르지 않습니다.')
    }

    const normalizedOptionValueName =
      this.normalizeNullableString(optionValueName)
    const normalizedProductCode =
      this.normalizeNullableString(productCode)

    const row =
      optionValueId !== null
        ? db.prepare(`
        SELECT
          o.id AS optionId,
          o.optionName,
          o.optionType,
          v.id AS optionValueId,
          v.optionValueName,
          v.priceDelta
        FROM pos_product_option_values v
        INNER JOIN pos_product_options o
          ON o.id = v.optionId
        WHERE v.id = @optionValueId
          AND v.channelCode = @channelCode
          AND COALESCE(v.isVisible, 1) = 1
          AND v.deletedAt IS NULL
          AND o.profileId = @profileId
          AND o.channelCode = @channelCode
          AND o.isActive = 1
          AND o.deletedAt IS NULL
          AND (
            o.productId = @productId
            OR (
              @productCode IS NOT NULL
              AND o.productCode = @productCode
            )
          )
          AND (
            @productCode IS NULL
            OR v.productCode IS NULL
            OR v.productCode = @productCode
          )
        LIMIT 1
      `).get({
          optionValueId,
          productId,
          productCode: normalizedProductCode,
          profileId,
          channelCode,
        }) as PosOptionRow | undefined
        : normalizedOptionValueName
          ? db.prepare(`
        SELECT
          o.id AS optionId,
          o.optionName,
          o.optionType,
          v.id AS optionValueId,
          v.optionValueName,
          v.priceDelta
        FROM pos_product_options o
        INNER JOIN pos_product_option_values v
          ON v.optionId = o.id
        WHERE o.id = @optionId
          AND o.profileId = @profileId
          AND o.channelCode = @channelCode
          AND o.isActive = 1
          AND o.deletedAt IS NULL
          AND (
            o.productId = @productId
            OR (
              @productCode IS NOT NULL
              AND o.productCode = @productCode
            )
          )
          AND v.optionValueName = @optionValueName
          AND v.channelCode = @channelCode
          AND COALESCE(v.isVisible, 1) = 1
          AND v.deletedAt IS NULL
          AND (
            @productCode IS NULL
            OR v.productCode IS NULL
            OR v.productCode = @productCode
          )
        LIMIT 1
      `).get({
            optionId,
            productId,
            productCode: normalizedProductCode,
            profileId,
            channelCode,
            optionValueName: normalizedOptionValueName
          }) as PosOptionRow | undefined
          : db.prepare(`
        SELECT
          o.id AS optionId,
          o.optionName,
          o.optionType,
          v.id AS optionValueId,
          v.optionValueName,
          v.priceDelta
        FROM pos_product_options o
        LEFT JOIN pos_product_option_values v
          ON v.optionId = o.id
          AND (
            v.id = @optionValueId
            OR @optionValueId IS NULL
          )
          AND v.channelCode = @channelCode
          AND COALESCE(v.isVisible, 1) = 1
          AND v.deletedAt IS NULL
          AND (
            @productCode IS NULL
            OR v.productCode IS NULL
            OR v.productCode = @productCode
          )
        WHERE o.id = @optionId
          AND o.profileId = @profileId
          AND o.channelCode = @channelCode
          AND o.isActive = 1
          AND o.deletedAt IS NULL
          AND (
            o.productId = @productId
            OR (
              @productCode IS NOT NULL
              AND o.productCode = @productCode
            )
          )
        LIMIT 1
      `).get({
            optionValueId,
            optionId,
            productId,
            productCode: normalizedProductCode,
            profileId,
            channelCode
          }) as PosOptionRow | undefined

    if (!row) {
      throw new BadRequestException('상품 옵션 정보를 찾을 수 없습니다.')
    }

    if (
      optionValueId !== null &&
      row.optionValueId !== optionValueId
    ) {
      throw new BadRequestException('상품 옵션값 정보를 찾을 수 없습니다.')
    }

    return row
  }

  private findPayableActiveOrder(input: {
    providerProfileId: number
    providerChannelCode: string
    locationId: number
    orderId: number | null
    orderCode: string | null
  }): PayablePosOrderRow | null {
    const byOrderIdAndCode =
      input.orderId && input.orderCode
        ? db.prepare(`
            SELECT
              id,
              orderCode,
              revisionCode,
              providerChannelCode,
              orderSource,
              orderFlowType,
              locationId,
              totalAmount,
              customerProfileId,
              customerChannelCode
            FROM pos_orders
            WHERE id = ?
              AND orderCode = ?
              AND providerProfileId = ?
              AND providerChannelCode = ?
              AND locationId = ?
              AND isActive = 1
              AND paymentStatus = 'UNPAID'
            LIMIT 1
          `).get(
            input.orderId,
            input.orderCode,
            input.providerProfileId,
            input.providerChannelCode,
            input.locationId
          ) as PayablePosOrderRow | undefined
        : undefined

    if (byOrderIdAndCode) {
      return byOrderIdAndCode
    }

    const row = db.prepare(`
      SELECT
        id,
        orderCode,
        revisionCode,
        providerChannelCode,
        orderSource,
        orderFlowType,
        locationId,
        totalAmount,
        customerProfileId,
        customerChannelCode
      FROM pos_orders
      WHERE providerProfileId = ?
        AND providerChannelCode = ?
        AND locationId = ?
        AND isActive = 1
        AND paymentStatus = 'UNPAID'
      ORDER BY revisionNo DESC, id DESC
      LIMIT 1
    `).get(
      input.providerProfileId,
      input.providerChannelCode,
      input.locationId
    ) as PayablePosOrderRow | undefined

    return row ?? null
  }

  private shouldMoveTableToCleaning(
    order: PayablePosOrderRow
  ): boolean {
    if (!this.isPositiveInteger(order.locationId)) {
      return false
    }

    const isTableOrder =
      order.orderFlowType === 'IN_STORE' ||
      order.orderSource === 'POS' ||
      order.orderSource === 'TABLE_ORDER' ||
      order.orderSource === 'QR_ORDER'

    if (!isTableOrder) {
      return false
    }

    return this.areAllCookingTicketsFinished(
      order.id,
      order.providerChannelCode
    )
  }

  private areAllCookingTicketsFinished(
    orderId: number,
    channelCode: string
  ): boolean {
    const row = db.prepare(`
      SELECT
        COUNT(*) AS totalCount,
        SUM(
          CASE
            WHEN cookingStatus IN ('DONE', 'CANCELED') THEN 1
            ELSE 0
          END
        ) AS finishedCount
      FROM pos_order_cooking_tickets
      WHERE orderId = ?
        AND providerChannelCode = ?
        AND isActive = 1
        AND deletedAt IS NULL
    `).get(
      orderId,
      channelCode
    ) as { totalCount: number, finishedCount: number | null } | undefined

    const totalCount =
      Number(row?.totalCount ?? 0)
    const finishedCount =
      Number(row?.finishedCount ?? 0)

    return totalCount > 0 && finishedCount === totalCount
  }

  private shouldMoveLocationToInUse(
    payload: NormalizedOrderPayload
  ): boolean {
    if (!this.isPositiveInteger(payload.locationId)) {
      return false
    }

    return (
      payload.orderFlowType === 'IN_STORE' ||
      payload.orderSource === 'POS' ||
      payload.orderSource === 'TABLE_ORDER' ||
      payload.orderSource === 'QR_ORDER'
    )
  }

  private assertLocationCanAcceptTableOrder(
    location: PosLocationRow,
    orderSource: PosOrderSource,
    orderFlowType: NormalizedOrderFlowType
  ): void {
    const isTableOrder =
      orderFlowType === 'IN_STORE' ||
      orderSource === 'POS' ||
      orderSource === 'TABLE_ORDER' ||
      orderSource === 'QR_ORDER'

    if (!isTableOrder) {
      return
    }

    const resourceStatus =
      this.normalizeNullableString(location.resourceStatus)?.toUpperCase() ?? 'AVAILABLE'

    if (
      resourceStatus === 'CLEANING' ||
      resourceStatus === 'CHECKOUT_PENDING' ||
      resourceStatus === 'MAINTENANCE' ||
      resourceStatus === 'DISABLED'
    ) {
      throw new BadRequestException(
        '테이블 정리대기 상태입니다. 정리완료 후 주문을 등록할 수 있습니다.'
      )
    }
  }

  // SECTION 08 : VALIDATION

  private validateBaseDto(
    dto: CreatePosOrderDto
  ) {
    if (!this.isPositiveInteger(dto.profileId)) {
      throw new BadRequestException('profileId가 올바르지 않습니다.')
    }

    if (!this.normalizeNullableString(dto.channelCode)) {
      throw new BadRequestException('channelCode가 필요합니다.')
    }

    if (!this.isPositiveInteger(dto.locationId)) {
      throw new BadRequestException('locationId가 올바르지 않습니다.')
    }

    if (!ORDER_SOURCE_SET.has(dto.orderSource)) {
      throw new BadRequestException('orderSource가 올바르지 않습니다.')
    }

    if (!ORDER_FLOW_TYPE_SET.has(dto.orderFlowType)) {
      throw new BadRequestException('orderFlowType이 올바르지 않습니다.')
    }

    if (!Array.isArray(dto.items) || dto.items.length < 1) {
      throw new BadRequestException('주문 상품이 필요합니다.')
    }

    if (
      dto.previousOrderId !== null &&
      dto.previousOrderId !== undefined &&
      !this.isPositiveInteger(dto.previousOrderId)
    ) {
      throw new BadRequestException('previousOrderId가 올바르지 않습니다.')
    }
  }

  private normalizeOrderFlowType(
    orderFlowType: PosOrderFlowType
  ): NormalizedOrderFlowType {
    if (orderFlowType === 'TABLE') {
      return 'IN_STORE'
    }

    return orderFlowType
  }

  private normalizeOptionType(
    optionType?: PosOrderOptionType | null
  ): PosOrderOptionType {
    if (!optionType) {
      return 'CUSTOM'
    }

    if (!OPTION_TYPE_SET.has(optionType)) {
      throw new BadRequestException('옵션 타입이 올바르지 않습니다.')
    }

    return optionType
  }

  private normalizeOptionQuantity(
    quantity: number | null | undefined,
    fallbackQuantity: number
  ): number {
    if (quantity === null || quantity === undefined) {
      return fallbackQuantity
    }

    if (!this.isPositiveInteger(quantity)) {
      throw new BadRequestException('옵션 수량은 1개 이상이어야 합니다.')
    }

    return quantity
  }

  private normalizeRequiredString(
    value: string | null | undefined,
    errorMessage: string
  ): string {
    const normalized =
      this.normalizeNullableString(value)

    if (!normalized) {
      throw new BadRequestException(errorMessage)
    }

    return normalized
  }

  private normalizeNullableString(
    value: string | null | undefined
  ): string | null {
    if (typeof value !== 'string') {
      return null
    }

    const normalized =
      value.trim()

    return normalized.length > 0
      ? normalized
      : null
  }

  private normalizeNullableNumber(
    value: number | null | undefined
  ): number | null {
    if (value === null || value === undefined) {
      return null
    }

    return this.isPositiveInteger(value)
      ? value
      : null
  }

  private normalizeNonNegativeNumber(
    value: number,
    errorMessage: string
  ): number {
    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException(errorMessage)
    }

    return value
  }

  private isPositiveInteger(
    value: unknown
  ): value is number {
    return (
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value > 0
    )
  }

  private normalizeQueryPositiveInteger(
    value: unknown
  ): number | null {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value : null
    }

    if (typeof value === 'string') {
      const parsedValue =
        Number.parseInt(value, 10)

      return Number.isInteger(parsedValue)
        ? parsedValue
        : null
    }

    return null
  }

  // SECTION 09 : ORDER CODE

  private deactivateActiveUnpaidOrdersForLocation(
    providerProfileId: number,
    providerChannelCode: string,
    locationId: number
  ) {
    db.prepare(`
      UPDATE pos_orders
      SET
        isActive = 0,
        orderStatus = 'REPLACED',
        updatedAt = CURRENT_TIMESTAMP
      WHERE providerProfileId = ?
        AND providerChannelCode = ?
        AND locationId = ?
        AND isActive = 1
        AND paymentStatus = 'UNPAID'
    `).run(
      providerProfileId,
      providerChannelCode,
      locationId
    )
  }

  private cancelActiveUnpaidOrdersForLocation(input: {
    providerProfileId: number
    providerChannelCode: string
    locationId: number
    orderId: number | null
    orderCode: string | null
  }): number {
    const hasOrderId = Boolean(input.orderId)
    const hasOrderCode = Boolean(input.orderCode)

    if (hasOrderId && hasOrderCode) {
      const result = db.prepare(`
        UPDATE pos_orders
        SET
          isActive = 0,
          orderStatus = 'CANCELLED',
          updatedAt = CURRENT_TIMESTAMP
        WHERE providerProfileId = ?
          AND providerChannelCode = ?
          AND locationId = ?
          AND isActive = 1
          AND paymentStatus = 'UNPAID'
          AND id = ?
          AND orderCode = ?
      `).run(
        input.providerProfileId,
        input.providerChannelCode,
        input.locationId,
        input.orderId,
        input.orderCode
      )

      return Number(result.changes || 0)
    }

    const result = db.prepare(`
      UPDATE pos_orders
      SET
        isActive = 0,
        orderStatus = 'CANCELLED',
        updatedAt = CURRENT_TIMESTAMP
      WHERE providerProfileId = ?
        AND providerChannelCode = ?
        AND locationId = ?
        AND isActive = 1
        AND paymentStatus = 'UNPAID'
    `).run(
      input.providerProfileId,
      input.providerChannelCode,
      input.locationId
    )

    return Number(result.changes || 0)
  }

  private findActiveUnpaidOrderForLocation(
    providerProfileId: number,
    providerChannelCode: string,
    locationId: number
  ): ActivePosOrderRow | null {
    const row = db.prepare(`
      SELECT
        id,
        orderCode,
        revisionCode,
        revisionNo,
        orderDate,
        orderYear,
        orderMonth,
        orderDay,
        orderSequence,
        subtotalAmount,
        totalAmount
      FROM pos_orders
      WHERE providerProfileId = ?
        AND providerChannelCode = ?
        AND locationId = ?
        AND isActive = 1
        AND paymentStatus = 'UNPAID'
      ORDER BY revisionNo DESC, id DESC
      LIMIT 1
    `).get(
      providerProfileId,
      providerChannelCode,
      locationId
    ) as ActivePosOrderRow | undefined

    if (!row) {
      return null
    }

    return row
  }

  private createOrderCodeContext(
    providerChannelCode: string
  ): OrderCodeContext {
    const now =
      new Date()

    const yearFull =
      now.getFullYear()

    const yearTwoDigits =
      String(yearFull % 100).padStart(2, '0')

    const monthNumber =
      now.getMonth() + 1

    const dayNumber =
      now.getDate()

    const month =
      String(monthNumber).padStart(2, '0')

    const day =
      String(dayNumber).padStart(2, '0')

    const orderDate =
      `${yearFull}-${month}-${day}`

    const sequenceRow =
      db.prepare(`
        SELECT
          COALESCE(MAX(orderSequence), 0) AS maxSequence
        FROM pos_orders
        WHERE providerChannelCode = ?
          AND orderDate = ?
      `).get(
        providerChannelCode,
        orderDate
      ) as { maxSequence?: number } | undefined

    const nextSequence =
      Number(sequenceRow?.maxSequence ?? 0) + 1

    if (nextSequence > 9999) {
      throw new InternalServerErrorException('POS 일일 주문 순번 한도를 초과했습니다.')
    }

    const sequenceText =
      String(nextSequence).padStart(4, '0')

    const orderCode =
      `OC${yearTwoDigits}${month}${day}${sequenceText}`

    if (orderCode.length !== 12) {
      throw new InternalServerErrorException('POS 주문코드 생성 규칙이 올바르지 않습니다.')
    }

    return {
      orderCode,
      revisionCode: this.createRevisionCode(),
      revisionNo: 1,
      orderDate,
      orderYear: yearFull,
      orderMonth: monthNumber,
      orderDay: dayNumber,
      orderSequence: nextSequence
    }
  }

  private createRevisionContextFromActiveOrder(
    activeOrder: ActivePosOrderRow
  ): OrderCodeContext {
    return {
      orderCode: activeOrder.orderCode,
      revisionCode: this.createRevisionCode(),
      revisionNo: Number(activeOrder.revisionNo || 0) + 1,
      orderDate: activeOrder.orderDate,
      orderYear: activeOrder.orderYear,
      orderMonth: activeOrder.orderMonth,
      orderDay: activeOrder.orderDay,
      orderSequence: activeOrder.orderSequence
    }
  }

  private createRevisionCode(): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

    for (let attempt = 0; attempt < 30; attempt += 1) {
      let candidate = ''

      for (let index = 0; index < 12; index += 1) {
        const randomIndex =
          Math.floor(Math.random() * charset.length)

        candidate += charset[randomIndex]
      }

      const exists = db.prepare(`
        SELECT id
        FROM pos_orders
        WHERE revisionCode = ?
        LIMIT 1
      `).get(candidate) as { id?: number } | undefined

      if (!exists?.id) {
        return candidate
      }
    }

    throw new InternalServerErrorException('POS revisionCode 생성에 실패했습니다.')
  }

  private createPaymentCode(): string {
    const now = new Date()
    const yearTwoDigits = String(now.getFullYear() % 100).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateToken = `${yearTwoDigits}${month}${day}`

    const sequenceRow = db.prepare(`
      SELECT
        COUNT(*) AS count
      FROM pos_payments
      WHERE substr(paymentCode, 1, 8) = ?
    `).get(`PM${dateToken}`) as { count?: number } | undefined

    const nextSequence = Number(sequenceRow?.count ?? 0) + 1

    if (nextSequence > 999999) {
      throw new InternalServerErrorException('결제코드 일일 발급 한도를 초과했습니다.')
    }

    const paymentCode = `PM${dateToken}${String(nextSequence).padStart(6, '0')}`

    if (paymentCode.length !== 14) {
      throw new InternalServerErrorException('결제코드 생성 규칙이 올바르지 않습니다.')
    }

    return paymentCode
  }
}

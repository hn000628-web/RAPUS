// FILE : backend/src/modules/business/pos/order-dashboard/pos-order-dashboard.service.ts
// ROOT : backend/src/modules/business/pos/order-dashboard/pos-order-dashboard.service.ts
// STATUS : CREATE MODE
// ROLE : POS ORDER DASHBOARD SERVICE

// SECTION 01 : IMPORT

import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'

import db from '../../../../config/database'

import {
  PosOrderCompositionType,
  PosOrderDashboardCategory,
  PosOrderDashboardDetail,
  PosOrderDashboardItem,
  PosOrderDashboardQuery,
  PosOrderDashboardResponse,
  PosOrderDashboardSummary,
  PosOrderDashboardUiCategory,
  PosOrderDashboardDisplayStatusGroup,
  PosOrderStatus,
  PosOrderStatusUpdateInput,
  PosTableCookingStatus,
  assertAllowedStatusTransition,
  buildOrderSummary,
  formatReceivedAt,
  getOrderCategoryLabel,
  mapOrderCategory,
  mapOrderStatusToUiStatus,
  normalizeDashboardQuery
} from './pos-order-dashboard.types'

// SECTION 02 : ROW TYPE

type DashboardOrderRow = {
  id: number
  orderCode: string
  revisionCode: string | null
  orderYear: number | null
  orderMonth: number | null
  orderDay: number | null
  orderSequence: number | null
  orderSource: string
  orderFlowType: string
  locationNameSnapshot: string | null
  orderStatus: PosOrderStatus
  paymentStatus: string
  subtotalAmount: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  memo: string | null
  createdAt: string
  sourceLabelSnapshot: string | null
  kioskDeviceCode: string | null
  qrCodeValue: string | null
  deliveryAddress: string | null
  itemCount: number
  totalQuantity: number
  firstProductName: string | null
  cookingTicketTotal: number | null
  waitingCount: number | null
  cookingCount: number | null
  doneCount: number | null
  canceledCount: number | null
}

type DashboardSummaryRow = {
  orderSource: string
  orderFlowType: string
  orderStatus: PosOrderStatus
  cookingTicketTotal: number | null
  waitingCount: number | null
  cookingCount: number | null
  doneCount: number | null
  canceledCount: number | null
}

type DashboardFulfillmentRow = {
  fulfillmentType: string
  sourceLabelSnapshot: string | null
  deliveryAddress: string | null
  deliveryDetailAddress: string | null
  deliveryPhone: string | null
  deliveryMemo: string | null
  pickupExpectedAt: string | null
  reservationExpectedAt: string | null
  kioskDeviceCode: string | null
  qrCodeValue: string | null
  customerRequestMemo: string | null
}

type DashboardItemRow = {
  id: number
  posProductId: number | null
  productNameSnapshot: string
  categoryNameSnapshot: string | null
  unitPriceSnapshot: number
  quantity: number
  lineTotalAmount: number
}

type DashboardOptionRow = {
  id: number
  orderItemId: number
  optionNameSnapshot: string
  optionTypeSnapshot: string
  optionValueNameSnapshot: string
  priceDeltaSnapshot: number | null
  quantity: number
  lineOptionAmount: number
}

type DashboardStatusEventRow = {
  id: number
  fromStatus: string | null
  toStatus: string
  changedByType: string
  changedByProfileId: number | null
  changedByStaffCode: string | null
  reason: string | null
  createdAt: string
}

type DashboardOrderIdentityRow = {
  id: number
  orderCode: string
  revisionCode: string | null
  providerProfileId: number
  providerChannelCode: string
  orderStatus: PosOrderStatus
}

type DerivedDisplayStatus = {
  cookingStatus: PosTableCookingStatus | null
  displayStatusLabel: string
  displayStatusGroup: PosOrderDashboardDisplayStatusGroup
}

// SECTION 03 : SERVICE

@Injectable()
export class PosOrderDashboardService {
  // SECTION 04 : LIST

  getDashboard(
    rawQuery: Record<string, unknown>
  ): PosOrderDashboardResponse {
    const query = this.normalizeQuery(rawQuery)
    const where = this.buildWhereClause(query, true)
    const listRows = db.prepare(`
      SELECT
        o.id,
        o.orderCode,
        o.revisionCode,
        o.orderYear,
        o.orderMonth,
        o.orderDay,
        o.orderSequence,
        o.orderSource,
        o.orderFlowType,
        o.locationNameSnapshot,
        o.orderStatus,
        o.paymentStatus,
        o.subtotalAmount,
        o.discountAmount,
        o.taxAmount,
        o.totalAmount,
        o.memo,
        o.createdAt,
        f.sourceLabelSnapshot,
        f.kioskDeviceCode,
        f.qrCodeValue,
        f.deliveryAddress,
        COUNT(i.id) AS itemCount,
        COALESCE(SUM(i.quantity), 0) AS totalQuantity,
        (
          SELECT fi.productNameSnapshot
          FROM pos_order_items fi
          WHERE fi.orderId = o.id
          ORDER BY fi.sortOrder ASC, fi.id ASC
          LIMIT 1
        ) AS firstProductName,
        ct.cookingTicketTotal,
        ct.waitingCount,
        ct.cookingCount,
        ct.doneCount,
        ct.canceledCount
      FROM pos_orders o
      LEFT JOIN pos_order_fulfillment_details f
        ON f.orderId = o.id
       AND f.providerChannelCode = o.providerChannelCode
      LEFT JOIN (
        SELECT
          orderId,
          providerChannelCode,
          COUNT(*) AS cookingTicketTotal,
          SUM(CASE WHEN cookingStatus = 'WAITING' THEN 1 ELSE 0 END) AS waitingCount,
          SUM(CASE WHEN cookingStatus = 'COOKING' THEN 1 ELSE 0 END) AS cookingCount,
          SUM(CASE WHEN cookingStatus = 'DONE' THEN 1 ELSE 0 END) AS doneCount,
          SUM(CASE WHEN cookingStatus = 'CANCELED' THEN 1 ELSE 0 END) AS canceledCount
        FROM pos_order_cooking_tickets
        WHERE isActive = 1
          AND deletedAt IS NULL
        GROUP BY orderId, providerChannelCode
      ) ct
        ON ct.orderId = o.id
       AND ct.providerChannelCode = o.providerChannelCode
      LEFT JOIN pos_order_items i
        ON i.orderId = o.id
      ${where.sql}
      GROUP BY
        o.id,
        o.orderCode,
        o.revisionCode,
        o.orderYear,
        o.orderMonth,
        o.orderDay,
        o.orderSequence,
        o.orderSource,
        o.orderFlowType,
        o.locationNameSnapshot,
        o.orderStatus,
        o.paymentStatus,
        o.subtotalAmount,
        o.discountAmount,
        o.taxAmount,
        o.totalAmount,
        o.memo,
        o.createdAt,
        f.sourceLabelSnapshot,
        f.kioskDeviceCode,
        f.qrCodeValue,
        f.deliveryAddress,
        ct.cookingTicketTotal,
        ct.waitingCount,
        ct.cookingCount,
        ct.doneCount,
        ct.canceledCount
      ORDER BY
        CASE o.orderStatus
          WHEN 'CREATED' THEN 1
          WHEN 'CONFIRMED' THEN 2
          WHEN 'PREPARING' THEN 3
          WHEN 'READY' THEN 4
          WHEN 'COMPLETED' THEN 5
          WHEN 'CANCELLED' THEN 6
          WHEN 'ADMIN_DISABLED' THEN 7
          WHEN 'REPLACED' THEN 8
          ELSE 9
        END ASC,
        o.createdAt DESC
      LIMIT @limit
      OFFSET @offset
    `).all({
      ...where.params,
      limit: query.limit,
      offset: query.offset
    }) as DashboardOrderRow[]

    const summary = this.getSummary(query)

    return {
      summary,
      items: listRows.map((row) => this.mapDashboardItem(row))
    }
  }

  // SECTION 05 : DETAIL

  getDetail(
    orderId: number,
    channelCode: string
  ): PosOrderDashboardDetail {
    const safeChannelCode = this.normalizeChannelCode(channelCode)
    const orderRow = db.prepare(`
      SELECT
        o.id,
        o.orderCode,
        o.revisionCode,
        o.orderYear,
        o.orderMonth,
        o.orderDay,
        o.orderSequence,
        o.orderSource,
        o.orderFlowType,
        o.locationNameSnapshot,
        o.orderStatus,
        o.paymentStatus,
        o.subtotalAmount,
        o.discountAmount,
        o.taxAmount,
        o.totalAmount,
        o.memo,
        o.createdAt,
        f.sourceLabelSnapshot,
        f.kioskDeviceCode,
        f.qrCodeValue,
        f.deliveryAddress,
        COUNT(i.id) AS itemCount,
        COALESCE(SUM(i.quantity), 0) AS totalQuantity,
        (
          SELECT fi.productNameSnapshot
          FROM pos_order_items fi
          WHERE fi.orderId = o.id
          ORDER BY fi.sortOrder ASC, fi.id ASC
          LIMIT 1
        ) AS firstProductName,
        ct.cookingTicketTotal,
        ct.waitingCount,
        ct.cookingCount,
        ct.doneCount,
        ct.canceledCount
      FROM pos_orders o
      LEFT JOIN pos_order_fulfillment_details f
        ON f.orderId = o.id
       AND f.providerChannelCode = o.providerChannelCode
      LEFT JOIN (
        SELECT
          orderId,
          providerChannelCode,
          COUNT(*) AS cookingTicketTotal,
          SUM(CASE WHEN cookingStatus = 'WAITING' THEN 1 ELSE 0 END) AS waitingCount,
          SUM(CASE WHEN cookingStatus = 'COOKING' THEN 1 ELSE 0 END) AS cookingCount,
          SUM(CASE WHEN cookingStatus = 'DONE' THEN 1 ELSE 0 END) AS doneCount,
          SUM(CASE WHEN cookingStatus = 'CANCELED' THEN 1 ELSE 0 END) AS canceledCount
        FROM pos_order_cooking_tickets
        WHERE isActive = 1
          AND deletedAt IS NULL
        GROUP BY orderId, providerChannelCode
      ) ct
        ON ct.orderId = o.id
       AND ct.providerChannelCode = o.providerChannelCode
      LEFT JOIN pos_order_items i
        ON i.orderId = o.id
      WHERE o.id = @orderId
        AND o.providerChannelCode = @channelCode
        AND COALESCE(o.isActive, 1) = 1
      GROUP BY
        o.id,
        o.orderCode,
        o.revisionCode,
        o.orderYear,
        o.orderMonth,
        o.orderDay,
        o.orderSequence,
        o.orderSource,
        o.orderFlowType,
        o.locationNameSnapshot,
        o.orderStatus,
        o.paymentStatus,
        o.subtotalAmount,
        o.discountAmount,
        o.taxAmount,
        o.totalAmount,
        o.memo,
        o.createdAt,
        f.sourceLabelSnapshot,
        f.kioskDeviceCode,
        f.qrCodeValue,
        f.deliveryAddress,
        ct.cookingTicketTotal,
        ct.waitingCount,
        ct.cookingCount,
        ct.doneCount,
        ct.canceledCount
    `).get({
      orderId,
      channelCode: safeChannelCode
    }) as DashboardOrderRow | undefined

    if (!orderRow) {
      throw new NotFoundException('주문을 찾을 수 없습니다.')
    }

    const fulfillment = db.prepare(`
      SELECT
        fulfillmentType,
        sourceLabelSnapshot,
        deliveryAddress,
        deliveryDetailAddress,
        deliveryPhone,
        deliveryMemo,
        pickupExpectedAt,
        reservationExpectedAt,
        kioskDeviceCode,
        qrCodeValue,
        customerRequestMemo
      FROM pos_order_fulfillment_details
      WHERE orderId = @orderId
        AND providerChannelCode = @channelCode
      LIMIT 1
    `).get({
      orderId,
      channelCode: safeChannelCode
    }) as DashboardFulfillmentRow | undefined

    const items = db.prepare(`
      SELECT
        id,
        posProductId,
        productNameSnapshot,
        categoryNameSnapshot,
        unitPriceSnapshot,
        quantity,
        lineTotalAmount
      FROM pos_order_items
      WHERE orderId = @orderId
      ORDER BY sortOrder ASC, id ASC
    `).all({ orderId }) as DashboardItemRow[]

    const options = db.prepare(`
      SELECT
        id,
        orderItemId,
        optionNameSnapshot,
        optionTypeSnapshot,
        optionValueNameSnapshot,
        priceDeltaSnapshot,
        quantity,
        lineOptionAmount
      FROM pos_order_item_options
      WHERE orderItemId IN (
        SELECT id
        FROM pos_order_items
        WHERE orderId = @orderId
      )
      ORDER BY id ASC
    `).all({ orderId }) as DashboardOptionRow[]

    const statusEvents = db.prepare(`
      SELECT
        id,
        fromStatus,
        toStatus,
        changedByType,
        changedByProfileId,
        changedByStaffCode,
        reason,
        createdAt
      FROM pos_order_status_events
      WHERE orderId = @orderId
        AND providerChannelCode = @channelCode
      ORDER BY createdAt ASC, id ASC
    `).all({
      orderId,
      channelCode: safeChannelCode
    }) as DashboardStatusEventRow[]

    const baseItem = this.mapDashboardItem(orderRow)

    return {
      ...baseItem,
      subtotalAmount: orderRow.subtotalAmount,
      discountAmount: orderRow.discountAmount,
      taxAmount: orderRow.taxAmount,
      totalAmount: orderRow.totalAmount,
      memo: orderRow.memo,
      fulfillment: fulfillment ?? null,
      items: items.map((item) => ({
        id: item.id,
        productId: item.posProductId,
        productName: item.productNameSnapshot,
        categoryName: item.categoryNameSnapshot,
        unitPrice: item.unitPriceSnapshot,
        quantity: item.quantity,
        lineTotalAmount: item.lineTotalAmount,
        options: options
          .filter((option) => option.orderItemId === item.id)
          .map((option) => ({
            id: option.id,
            optionName: option.optionNameSnapshot,
            optionType: option.optionTypeSnapshot,
            optionValueName: option.optionValueNameSnapshot,
            priceDelta: option.priceDeltaSnapshot ?? 0,
            quantity: option.quantity,
            lineOptionAmount: option.lineOptionAmount
          }))
      })),
      statusEvents: statusEvents.map((event) => ({
        id: event.id,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        changedByType: event.changedByType,
        changedByProfileId: event.changedByProfileId,
        changedByStaffCode: event.changedByStaffCode,
        reason: event.reason,
        createdAt: event.createdAt
      }))
    }
  }

  // SECTION 06 : STATUS UPDATE

  updateStatus(
    orderId: number,
    body: PosOrderStatusUpdateInput
  ): PosOrderDashboardDetail {
    const channelCode = this.normalizeChannelCode(body.channelCode)
    const nextStatus = this.normalizeNextStatus(body.nextStatus)
    const changedByType = this.normalizeChangedByType(body.changedByType)

    const updateTransaction = db.transaction(() => {
      const order = db.prepare(`
        SELECT
          id,
          orderCode,
          revisionCode,
          providerProfileId,
          providerChannelCode,
          orderStatus
        FROM pos_orders
        WHERE id = @orderId
          AND providerChannelCode = @channelCode
          AND COALESCE(isActive, 1) = 1
        LIMIT 1
      `).get({
        orderId,
        channelCode
      }) as DashboardOrderIdentityRow | undefined

      if (!order) {
        throw new NotFoundException('주문을 찾을 수 없습니다.')
      }

      try {
        assertAllowedStatusTransition(order.orderStatus, nextStatus)
      } catch {
        throw new BadRequestException('허용되지 않은 주문 상태 변경입니다.')
      }

      db.prepare(`
        UPDATE pos_orders
        SET
          orderStatus = @nextStatus,
          updatedAt = CURRENT_TIMESTAMP,
          completedAt = CASE
            WHEN @nextStatus = 'COMPLETED' THEN CURRENT_TIMESTAMP
            ELSE completedAt
          END,
          canceledAt = CASE
            WHEN @nextStatus = 'CANCELLED' THEN CURRENT_TIMESTAMP
            ELSE canceledAt
          END
        WHERE id = @orderId
          AND providerChannelCode = @channelCode
      `).run({
        nextStatus,
        orderId,
        channelCode
      })

      db.prepare(`
        INSERT INTO pos_order_status_events(
          orderId,
          orderCode,
          revisionCode,
          providerProfileId,
          providerChannelCode,
          fromStatus,
          toStatus,
          changedByType,
          changedByProfileId,
          changedByStaffCode,
          reason,
          createdAt
        )
        VALUES(
          @orderId,
          @orderCode,
          @revisionCode,
          @providerProfileId,
          @providerChannelCode,
          @fromStatus,
          @toStatus,
          @changedByType,
          @changedByProfileId,
          @changedByStaffCode,
          @reason,
          CURRENT_TIMESTAMP
        )
      `).run({
        orderId: order.id,
        orderCode: order.orderCode,
        revisionCode: order.revisionCode,
        providerProfileId: order.providerProfileId,
        providerChannelCode: order.providerChannelCode,
        fromStatus: order.orderStatus,
        toStatus: nextStatus,
        changedByType,
        changedByProfileId: body.changedByProfileId ?? null,
        changedByStaffCode: body.changedByStaffCode ?? null,
        reason: body.reason ?? null
      })
    })

    updateTransaction()

    return this.getDetail(orderId, channelCode)
  }

  // SECTION 07 : SUMMARY

  private getSummary(
    query: PosOrderDashboardQuery
  ): PosOrderDashboardSummary {
    const where = this.buildWhereClause(query, false)
    const rows = db.prepare(`
      SELECT
        o.orderSource,
        o.orderFlowType,
        o.orderStatus,
        ct.cookingTicketTotal,
        ct.waitingCount,
        ct.cookingCount,
        ct.doneCount,
        ct.canceledCount
      FROM pos_orders o
      LEFT JOIN pos_order_fulfillment_details f
        ON f.orderId = o.id
       AND f.providerChannelCode = o.providerChannelCode
      LEFT JOIN (
        SELECT
          orderId,
          providerChannelCode,
          COUNT(*) AS cookingTicketTotal,
          SUM(CASE WHEN cookingStatus = 'WAITING' THEN 1 ELSE 0 END) AS waitingCount,
          SUM(CASE WHEN cookingStatus = 'COOKING' THEN 1 ELSE 0 END) AS cookingCount,
          SUM(CASE WHEN cookingStatus = 'DONE' THEN 1 ELSE 0 END) AS doneCount,
          SUM(CASE WHEN cookingStatus = 'CANCELED' THEN 1 ELSE 0 END) AS canceledCount
        FROM pos_order_cooking_tickets
        WHERE isActive = 1
          AND deletedAt IS NULL
        GROUP BY orderId, providerChannelCode
      ) ct
        ON ct.orderId = o.id
       AND ct.providerChannelCode = o.providerChannelCode
      ${where.sql}
    `).all(where.params) as DashboardSummaryRow[]

    const summary: PosOrderDashboardSummary = {
      totalOrders: 0,
      receivedOrders: 0,
      progressOrders: 0,
      doneOrders: 0,
      canceledOrders: 0
    }

    for (const row of rows) {
      summary.totalOrders += 1

      const category = mapOrderCategory(
        row.orderSource,
        row.orderFlowType
      )
      const displayStatus = this.deriveTableCookingDisplayStatus({
        category,
        orderStatus: row.orderStatus,
        cookingTicketTotal: row.cookingTicketTotal,
        waitingCount: row.waitingCount,
        cookingCount: row.cookingCount,
        doneCount: row.doneCount,
        canceledCount: row.canceledCount
      })

      if (displayStatus.displayStatusGroup === 'RECEIVED') {
        summary.receivedOrders += 1
      } else if (displayStatus.displayStatusGroup === 'PROGRESS') {
        summary.progressOrders += 1
      } else if (displayStatus.displayStatusGroup === 'DONE') {
        summary.doneOrders += 1
      } else {
        summary.canceledOrders += 1
      }
    }

    return summary
  }

  // SECTION 08 : MAPPING

  private mapDashboardItem(
    row: DashboardOrderRow
  ): PosOrderDashboardItem {
    const normalizedOrderCode = this.normalizeOrderCodeForDisplay(row)
    const orderItemCount = Number(row.itemCount ?? 0)
    const orderCompositionType =
      this.resolveOrderCompositionType(orderItemCount)
    const category = mapOrderCategory(
      row.orderSource,
      row.orderFlowType
    )
    const displayStatus = this.deriveTableCookingDisplayStatus({
      category,
      orderStatus: row.orderStatus,
      cookingTicketTotal: row.cookingTicketTotal,
      waitingCount: row.waitingCount,
      cookingCount: row.cookingCount,
      doneCount: row.doneCount,
      canceledCount: row.canceledCount
    })

    return {
      id: row.id,
      orderId: row.id,
      orderNo: normalizedOrderCode,
      orderCode: normalizedOrderCode,
      revisionCode: row.revisionCode,
      category,
      categoryLabel: getOrderCategoryLabel(category),
      status: mapOrderStatusToUiStatus(row.orderStatus),
      orderStatus: row.orderStatus,
      paymentStatus: row.paymentStatus,
      amount: row.totalAmount,
      receivedAt: row.createdAt,
      receivedAtText: formatReceivedAt(row.createdAt),
      summary: buildOrderSummary(
        orderItemCount,
        Number(row.totalQuantity ?? 0),
        row.firstProductName
      ),
      source: this.resolveSource(row),
      itemCount: orderItemCount,
      orderItemCount,
      orderCompositionType,
      orderCompositionLabel:
        this.getOrderCompositionLabel(orderCompositionType),
      totalQuantity: Number(row.totalQuantity ?? 0),
      tableCookingStatus: displayStatus.cookingStatus,
      displayStatusLabel: displayStatus.displayStatusLabel,
      displayStatusGroup: displayStatus.displayStatusGroup
    }
  }

  private deriveTableCookingDisplayStatus(input: {
    category: PosOrderDashboardUiCategory
    orderStatus: PosOrderStatus
    cookingTicketTotal?: number | null
    waitingCount?: number | null
    cookingCount?: number | null
    doneCount?: number | null
    canceledCount?: number | null
  }): DerivedDisplayStatus {
    const fallback = this.deriveOrderStatusDisplay(input.orderStatus)

    if (input.category !== 'TABLE') {
      return fallback
    }

    const cookingTicketTotal = Number(input.cookingTicketTotal ?? 0)

    if (cookingTicketTotal < 1) {
      return this.deriveTableOrderStatusFallback(input.orderStatus)
    }

    const waitingCount = Number(input.waitingCount ?? 0)
    const cookingCount = Number(input.cookingCount ?? 0)
    const doneCount = Number(input.doneCount ?? 0)
    const canceledCount = Number(input.canceledCount ?? 0)

    if (cookingCount > 0) {
      return {
        cookingStatus: 'COOKING',
        displayStatusLabel: '조리중',
        displayStatusGroup: 'PROGRESS'
      }
    }

    if (waitingCount > 0) {
      return {
        cookingStatus: 'WAITING',
        displayStatusLabel: '접수(조리대기)',
        displayStatusGroup: 'RECEIVED'
      }
    }

    if (doneCount === cookingTicketTotal) {
      return {
        cookingStatus: 'DONE',
        displayStatusLabel: '조리완료(사용중)',
        displayStatusGroup: 'DONE'
      }
    }

    if (canceledCount === cookingTicketTotal) {
      return {
        cookingStatus: 'CANCELED',
        displayStatusLabel: '취소',
        displayStatusGroup: 'CANCELED'
      }
    }

    return fallback
  }

  private deriveTableOrderStatusFallback(
    orderStatus: PosOrderStatus
  ): DerivedDisplayStatus {
    if (orderStatus === 'CREATED' || orderStatus === 'CONFIRMED') {
      return {
        cookingStatus: null,
        displayStatusLabel: '접수(조리대기)',
        displayStatusGroup: 'RECEIVED'
      }
    }

    if (orderStatus === 'PREPARING') {
      return {
        cookingStatus: null,
        displayStatusLabel: '조리중',
        displayStatusGroup: 'PROGRESS'
      }
    }

    if (orderStatus === 'READY' || orderStatus === 'COMPLETED') {
      return {
        cookingStatus: null,
        displayStatusLabel: '조리완료(사용중)',
        displayStatusGroup: 'DONE'
      }
    }

    return {
      cookingStatus: null,
      displayStatusLabel: '취소',
      displayStatusGroup: 'CANCELED'
    }
  }

  private deriveOrderStatusDisplay(
    orderStatus: PosOrderStatus
  ): DerivedDisplayStatus {
    const uiStatus = mapOrderStatusToUiStatus(orderStatus)

    if (uiStatus === '접수') {
      return {
        cookingStatus: null,
        displayStatusLabel: '접수',
        displayStatusGroup: 'RECEIVED'
      }
    }

    if (uiStatus === '처리중') {
      return {
        cookingStatus: null,
        displayStatusLabel: '처리중',
        displayStatusGroup: 'PROGRESS'
      }
    }

    if (uiStatus === '완료') {
      return {
        cookingStatus: null,
        displayStatusLabel: '완료',
        displayStatusGroup: 'DONE'
      }
    }

    return {
      cookingStatus: null,
      displayStatusLabel: '취소',
      displayStatusGroup: 'CANCELED'
    }
  }

  private resolveSource(
    row: DashboardOrderRow
  ): string {
    return (
      row.sourceLabelSnapshot ||
      row.locationNameSnapshot ||
      row.kioskDeviceCode ||
      row.qrCodeValue ||
      row.deliveryAddress ||
      row.orderSource ||
      '-'
    )
  }

  // SECTION 09 : QUERY HELPER

  private normalizeQuery(
    rawQuery: Record<string, unknown>
  ): PosOrderDashboardQuery {
    try {
      const query = normalizeDashboardQuery(rawQuery)

      if (!query.channelCode) {
        throw new Error('channelCode is required')
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date)) {
        throw new Error('Invalid date')
      }

      return query
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Invalid dashboard query'

      throw new BadRequestException(message)
    }
  }

  private buildWhereClause(
    query: PosOrderDashboardQuery,
    includeStatus: boolean
  ): {
    sql: string
    params: Record<string, unknown>
  } {
    const conditions = [
      'o.providerChannelCode = @channelCode',
      'o.orderDate = @date',
      'COALESCE(o.isActive, 1) = 1'
    ]
    const params: Record<string, unknown> = {
      channelCode: query.channelCode,
      date: query.date
    }

    this.appendCategoryCondition(
      conditions,
      query.category
    )

    if (includeStatus && query.status !== 'ALL') {
      conditions.push('o.orderStatus = @status')
      params.status = query.status
    }

    return {
      sql: `WHERE ${conditions.join(' AND ')}`,
      params
    }
  }

  private appendCategoryCondition(
    conditions: string[],
    category: PosOrderDashboardCategory
  ): void {
    if (category === 'ALL') {
      return
    }

    if (category === 'KIOSK') {
      conditions.push("o.orderSource = 'KIOSK'")
      return
    }

    if (category === 'QR') {
      conditions.push("o.orderSource = 'QR_ORDER'")
      return
    }

    if (category === 'DELIVERY') {
      conditions.push("o.orderFlowType = 'DELIVERY'")
      return
    }

    if (category === 'PICKUP') {
      conditions.push("o.orderFlowType = 'PICKUP'")
      return
    }

    if (category === 'RESERVATION') {
      conditions.push("o.orderFlowType = 'RESERVATION'")
      return
    }

    conditions.push(`
      (
        o.orderFlowType = 'IN_STORE'
        AND o.orderSource NOT IN ('KIOSK', 'QR_ORDER')
      )
    `)
  }

  private normalizeOrderCodeForDisplay(
    row: Pick<
      DashboardOrderRow,
      'orderCode' | 'orderYear' | 'orderMonth' | 'orderDay' | 'orderSequence'
    >
  ): string {
    const rawOrderCode = String(row.orderCode ?? '').trim().toUpperCase()

    if (/^OC[0-9]{10}$/.test(rawOrderCode)) {
      return rawOrderCode
    }

    const year = Number(row.orderYear ?? 0)
    const month = Number(row.orderMonth ?? 0)
    const day = Number(row.orderDay ?? 0)
    const sequence = Number(row.orderSequence ?? 0)

    const canNormalize =
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      Number.isInteger(day) &&
      Number.isInteger(sequence) &&
      year > 0 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31 &&
      sequence >= 1 &&
      sequence <= 9999

    if (!canNormalize) {
      return rawOrderCode
    }

    const yy = String(year).slice(-2).padStart(2, '0')
    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    const nnnn = String(sequence).padStart(4, '0')

    return `OC${yy}${mm}${dd}${nnnn}`
  }

  private resolveOrderCompositionType(
    orderItemCount: number
  ): PosOrderCompositionType {
    return orderItemCount >= 2
      ? 'COMPOSITE'
      : 'SINGLE'
  }

  private getOrderCompositionLabel(
    compositionType: PosOrderCompositionType
  ): string {
    return compositionType === 'COMPOSITE'
      ? '복합 주문'
      : '단일 주문'
  }

  private normalizeChannelCode(
    channelCode: string | undefined
  ): string {
    const safeChannelCode = String(channelCode ?? '').trim()

    if (!safeChannelCode) {
      throw new BadRequestException('channelCode is required')
    }

    return safeChannelCode
  }

  private normalizeNextStatus(
    nextStatus: PosOrderStatusUpdateInput['nextStatus']
  ): PosOrderStatusUpdateInput['nextStatus'] {
    const statusSet = new Set<PosOrderStatusUpdateInput['nextStatus']>([
      'CONFIRMED',
      'PREPARING',
      'READY',
      'COMPLETED',
      'CANCELLED'
    ])

    if (!statusSet.has(nextStatus)) {
      throw new BadRequestException('Invalid nextStatus')
    }

    return nextStatus
  }

  private normalizeChangedByType(
    changedByType: PosOrderStatusUpdateInput['changedByType']
  ): NonNullable<PosOrderStatusUpdateInput['changedByType']> {
    const safeChangedByType = changedByType ?? 'SYSTEM'
    const changedByTypeSet =
      new Set<NonNullable<PosOrderStatusUpdateInput['changedByType']>>([
        'SYSTEM',
        'OWNER',
        'STAFF',
        'CUSTOMER'
      ])

    if (!changedByTypeSet.has(safeChangedByType)) {
      throw new BadRequestException('Invalid changedByType')
    }

    return safeChangedByType
  }
}

// FILE : backend/src/modules/business/pos/order-dashboard/pos-order-dashboard.types.ts
// ROOT : backend/src/modules/business/pos/order-dashboard/pos-order-dashboard.types.ts
// STATUS : CREATE MODE
// ROLE : POS ORDER DASHBOARD TYPES

// SECTION 01 : TYPE

export type PosOrderDashboardCategory =
  | 'ALL'
  | 'TABLE'
  | 'RESERVATION'
  | 'DELIVERY'
  | 'PICKUP'
  | 'QR'
  | 'KIOSK'

export type PosOrderDashboardUiCategory =
  | 'TABLE'
  | 'RESERVATION'
  | 'DELIVERY'
  | 'PICKUP'
  | 'QR'
  | 'KIOSK'

export type PosOrderDashboardUiStatus =
  | '접수'
  | '처리중'
  | '완료'
  | '취소'

export type PosTableCookingStatus =
  | 'WAITING'
  | 'COOKING'
  | 'DONE'
  | 'CANCELED'

export type PosOrderDashboardDisplayStatusGroup =
  | 'RECEIVED'
  | 'PROGRESS'
  | 'DONE'
  | 'CANCELED'

export type PosOrderCompositionType =
  | 'SINGLE'
  | 'COMPOSITE'

export type PosOrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REPLACED'
  | 'CANCELLED'
  | 'ADMIN_DISABLED'

export type PosOrderDashboardStatusFilter =
  | 'ALL'
  | 'CREATED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'

export type PosOrderStatusUpdateInput = {
  channelCode: string
  nextStatus: 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  changedByType?: 'SYSTEM' | 'OWNER' | 'STAFF' | 'CUSTOMER'
  changedByProfileId?: number
  changedByStaffCode?: string
  reason?: string
}

export type PosOrderDashboardQuery = {
  channelCode: string
  category: PosOrderDashboardCategory
  date: string
  status: PosOrderDashboardStatusFilter
  limit: number
  offset: number
}

export type PosOrderDashboardItem = {
  id: number
  orderId: number
  orderNo: string
  orderCode: string
  revisionCode: string | null
  category: PosOrderDashboardUiCategory
  categoryLabel: string
  status: PosOrderDashboardUiStatus
  orderStatus: PosOrderStatus
  paymentStatus: string
  amount: number
  receivedAt: string
  receivedAtText: string
  summary: string
  source: string
  itemCount: number
  orderItemCount: number
  orderCompositionType: PosOrderCompositionType
  orderCompositionLabel: string
  totalQuantity: number
  tableCookingStatus?: PosTableCookingStatus | null
  displayStatusLabel?: string
  displayStatusGroup?: PosOrderDashboardDisplayStatusGroup
}

export type PosOrderDashboardSummary = {
  totalOrders: number
  receivedOrders: number
  progressOrders: number
  doneOrders: number
  canceledOrders: number
}

export type PosOrderDashboardResponse = {
  summary: PosOrderDashboardSummary
  items: PosOrderDashboardItem[]
}

export type PosOrderDashboardDetail = PosOrderDashboardItem & {
  subtotalAmount: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  memo: string | null
  fulfillment: {
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
  } | null
  items: Array<{
    id: number
    productId: number | null
    productName: string
    categoryName: string | null
    unitPrice: number
    quantity: number
    lineTotalAmount: number
    options: Array<{
      id: number
      optionName: string
      optionType: string
      optionValueName: string
      priceDelta: number
      quantity: number
      lineOptionAmount: number
    }>
  }>
  statusEvents: Array<{
    id: number
    fromStatus: string | null
    toStatus: string
    changedByType: string
    changedByProfileId: number | null
    changedByStaffCode: string | null
    reason: string | null
    createdAt: string
  }>
}

// SECTION 02 : CONSTANT

const CATEGORY_SET = new Set<PosOrderDashboardCategory>([
  'ALL',
  'TABLE',
  'RESERVATION',
  'DELIVERY',
  'PICKUP',
  'QR',
  'KIOSK'
])

const STATUS_FILTER_SET = new Set<PosOrderDashboardStatusFilter>([
  'ALL',
  'CREATED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED'
])

// SECTION 03 : UTILITY

export function mapOrderCategory(
  orderSource: string | null | undefined,
  orderFlowType: string | null | undefined
): PosOrderDashboardUiCategory {
  if (orderSource === 'KIOSK') {
    return 'KIOSK'
  }

  if (orderSource === 'QR_ORDER') {
    return 'QR'
  }

  if (orderFlowType === 'DELIVERY') {
    return 'DELIVERY'
  }

  if (orderFlowType === 'PICKUP') {
    return 'PICKUP'
  }

  if (orderFlowType === 'RESERVATION') {
    return 'RESERVATION'
  }

  return 'TABLE'
}

export function getOrderCategoryLabel(
  category: PosOrderDashboardUiCategory
): string {
  const labels: Record<PosOrderDashboardUiCategory, string> = {
    TABLE: '테이블 주문',
    RESERVATION: '예약 주문',
    DELIVERY: '배달 주문',
    PICKUP: '픽업 주문',
    QR: 'QR 주문',
    KIOSK: '키오스크 주문'
  }

  return labels[category]
}

export function mapOrderStatusToUiStatus(
  orderStatus: string | null | undefined
): PosOrderDashboardUiStatus {
  if (orderStatus === 'PREPARING' || orderStatus === 'READY') {
    return '처리중'
  }

  if (orderStatus === 'COMPLETED') {
    return '완료'
  }

  if (
    orderStatus === 'CANCELLED' ||
    orderStatus === 'ADMIN_DISABLED' ||
    orderStatus === 'REPLACED'
  ) {
    return '취소'
  }

  return '접수'
}

export function assertAllowedStatusTransition(
  currentStatus: PosOrderStatus,
  nextStatus: PosOrderStatusUpdateInput['nextStatus']
): void {
  const allowedTransitions: Record<PosOrderStatus, PosOrderStatus[]> = {
    CREATED: ['CONFIRMED', 'PREPARING', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'COMPLETED', 'CANCELLED'],
    READY: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    REPLACED: [],
    CANCELLED: [],
    ADMIN_DISABLED: []
  }

  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new Error(`Invalid status transition: ${currentStatus} -> ${nextStatus}`)
  }
}

export function normalizeDashboardQuery(
  query: Record<string, unknown>
): PosOrderDashboardQuery {
  const channelCode = String(query.channelCode ?? '').trim()
  const category = String(query.category ?? 'ALL').trim().toUpperCase()
  const status = String(query.status ?? 'ALL').trim().toUpperCase()
  const date = String(query.date ?? getTodayDateText()).trim()
  const limit = normalizeInteger(query.limit, 100, 1, 500)
  const offset = normalizeInteger(query.offset, 0, 0, 1000000)

  if (!CATEGORY_SET.has(category as PosOrderDashboardCategory)) {
    throw new Error('Invalid category')
  }

  if (!STATUS_FILTER_SET.has(status as PosOrderDashboardStatusFilter)) {
    throw new Error('Invalid status')
  }

  return {
    channelCode,
    category: category as PosOrderDashboardCategory,
    date,
    status: status as PosOrderDashboardStatusFilter,
    limit,
    offset
  }
}

export function formatReceivedAt(
  createdAt: string | null | undefined
): string {
  if (!createdAt) {
    return '-'
  }

  const timeMatch = createdAt.match(/\b(\d{2}):(\d{2})/)

  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`
  }

  const parsed = new Date(createdAt)

  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  return parsed.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export function buildOrderSummary(
  itemCount: number,
  totalQuantity: number,
  firstProductName: string | null
): string {
  if (itemCount <= 0) {
    return '메뉴 없음'
  }

  const productName = firstProductName?.trim() || '메뉴'

  if (itemCount === 1) {
    return totalQuantity > 1
      ? `${productName} ${totalQuantity}개`
      : productName
  }

  const headQuantity = totalQuantity > 0 ? totalQuantity : 1

  return `${productName} ${headQuantity}개 x 외`
}

function normalizeInteger(
  value: unknown,
  defaultValue: number,
  min: number,
  max: number
): number {
  const parsed = Number(value ?? defaultValue)

  if (!Number.isInteger(parsed)) {
    return defaultValue
  }

  return Math.min(Math.max(parsed, min), max)
}

function getTodayDateText(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

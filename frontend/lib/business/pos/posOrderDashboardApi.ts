// FILE : frontend/lib/business/pos/posOrderDashboardApi.ts
// ROOT : frontend/lib/business/pos/posOrderDashboardApi.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS ORDER DASHBOARD FRONT API

// SECTION 01 : IMPORT

import { apiFetch } from '@/lib/api'

// SECTION 02 : TYPE

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

export type PosOrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REPLACED'
  | 'CANCELLED'
  | 'ADMIN_DISABLED'

export type PosOrderDashboardSummary = {
  totalOrders: number
  receivedOrders: number
  progressOrders: number
  doneOrders: number
  canceledOrders: number
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
  totalQuantity: number
  tableCookingStatus?: PosTableCookingStatus | null
  displayStatusLabel?: string
  displayStatusGroup?: PosOrderDashboardDisplayStatusGroup
}

export type PosOrderDashboardResponse = {
  summary: PosOrderDashboardSummary
  items: PosOrderDashboardItem[]
}

export type PosOrderDashboardDetail = {
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
  summary: string
  subtotalAmount: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  receivedAt: string
  source: string
  tableCookingStatus?: PosTableCookingStatus | null
  displayStatusLabel?: string
  displayStatusGroup?: PosOrderDashboardDisplayStatusGroup
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

export type FetchPosOrderDashboardParams = {
  channelCode: string
  category?: PosOrderDashboardCategory
  date?: string
  status?: 'ALL' | PosOrderStatus
  limit?: number
  offset?: number
}

export type UpdatePosOrderStatusInput = {
  channelCode: string
  nextStatus: 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  changedByType?: 'SYSTEM' | 'OWNER' | 'STAFF' | 'CUSTOMER'
  changedByProfileId?: number
  changedByStaffCode?: string
  reason?: string
}

// SECTION 03 : CONSTANT

const POS_ORDER_DASHBOARD_API_PATH =
  'business/pos/order-dashboard'

// SECTION 04 : HELPER

function assertChannelCode(
  channelCode: string
) {
  if (!channelCode?.trim()) {
    throw new Error('channelCode is required')
  }
}

function buildPathWithQuery(
  basePath: string,
  query: Record<string, string | number | undefined | null>
) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()

  return queryString
    ? `${basePath}?${queryString}`
    : basePath
}

// SECTION 05 : API

export async function fetchPosOrderDashboard(
  params: FetchPosOrderDashboardParams
): Promise<PosOrderDashboardResponse> {
  assertChannelCode(params.channelCode)

  return apiFetch<PosOrderDashboardResponse>(
    buildPathWithQuery(
      POS_ORDER_DASHBOARD_API_PATH,
      {
        channelCode: params.channelCode,
        category: params.category ?? 'ALL',
        date: params.date,
        status: params.status ?? 'ALL',
        limit: params.limit ?? 100,
        offset: params.offset ?? 0
      }
    )
  )
}

export async function fetchPosOrderDashboardDetail(
  orderId: number,
  channelCode: string
): Promise<PosOrderDashboardDetail> {
  assertChannelCode(channelCode)

  return apiFetch<PosOrderDashboardDetail>(
    buildPathWithQuery(
      `${POS_ORDER_DASHBOARD_API_PATH}/${orderId}`,
      {
        channelCode
      }
    )
  )
}

export async function updatePosOrderDashboardStatus(
  orderId: number,
  input: UpdatePosOrderStatusInput
): Promise<PosOrderDashboardDetail | PosOrderDashboardItem> {
  assertChannelCode(input.channelCode)

  return apiFetch<PosOrderDashboardDetail | PosOrderDashboardItem>(
    `${POS_ORDER_DASHBOARD_API_PATH}/${orderId}/status`,
    {
      method: 'PATCH',
      body: input
    }
  )
}

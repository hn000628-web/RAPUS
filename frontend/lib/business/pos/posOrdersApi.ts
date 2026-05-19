// FILE : frontend/lib/business/posOrdersApi.ts
// ROOT : frontend/lib/business/posOrdersApi.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS ORDER FRONT API
// CHANGE SUMMARY :
// - POS 주문등록 전용 Front API 신규 생성
// - POST /api/business/pos/orders 연결
// - backend create-pos-order.dto.ts 기준 request / response 타입 정의
// - /pos/table/[tableNo] 주문하기 버튼 연결용 createPosOrder() 추가
// - DB 직접 접근 없음
// - Service 직접 접근 없음

// SECTION 01 : IMPORT

import { apiFetch } from '@/lib/api'

// SECTION 02 : TYPE

export type PosOrderSource =
  | 'POS'
  | 'KIOSK'
  | 'TABLE_ORDER'
  | 'QR_ORDER'
  | 'ONLINE'
  | 'PHONE'
  | 'ADMIN'

export type PosOrderFlowType =
  | 'TABLE'
  | 'IN_STORE'
  | 'PICKUP'
  | 'DELIVERY'
  | 'RESERVATION'
  | 'SERVICE'

export type PosOrderOptionType =
  | 'SIZE'
  | 'TEMPERATURE'
  | 'ADDON'
  | 'CHOICE'
  | 'CUSTOM'

export type CreatePosOrderItemOptionInput = {
  optionId?: number | null
  optionValueId?: number | null
  optionName?: string | null
  optionType?: PosOrderOptionType | null
  optionValueName?: string | null
  priceDelta?: number | null
  quantity?: number | null
}

export type CreatePosOrderItemInput = {
  productId: number
  productName?: string | null
  unitPrice?: number | null
  quantity: number
  categoryName?: string | null
  productKind?: 'MAIN_PRODUCT' | 'SUB_PRODUCT' | null
  options?: CreatePosOrderItemOptionInput[] | null
}

export type CreatePosOrderRequest = {
  profileId: number
  channelCode: string
  locationId: number
  locationName?: string | null
  orderSource: PosOrderSource
  orderFlowType: PosOrderFlowType
  customerProfileId?: number | null
  customerChannelCode?: string | null
  customerMemo?: string | null
  previousOrderId?: number | null
  previousOrderCode?: string | null
  items: CreatePosOrderItemInput[]
}

export type CreatePosOrderResponse = {
  ok: true
  orderId: number
  orderCode: string
  orderNumber: string
  revisionCode?: string
  revisionNo?: number
  subtotalAmount: number
  totalAmount: number
}

export type CancelPosOrderRequest = {
  profileId: number
  channelCode: string
  locationId: number
  orderId?: number | null
  orderCode?: string | null
}

export type CancelPosOrderResponse = {
  ok: true
  canceledOrderCount: number
}

export type PosPaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'QR'
  | 'NFC'
  | 'MIXED'

export type CompletePosPaymentRequest = {
  profileId: number
  channelCode: string
  locationId: number
  orderId?: number | null
  orderCode?: string | null
  paymentMethod: PosPaymentMethod
  receivedCashAmount?: number | null
  paidStaffCode?: string | null
  paidStaffNameSnapshot?: string | null
  memo?: string | null
}

export type CompletePosPaymentResponse = {
  ok: true
  paymentId: number
  paymentCode: string
  orderId: number
  orderCode: string
  paymentAmount: number
  paymentStatus: 'PAID'
  paymentMethod: PosPaymentMethod
  receivedCashAmount: number | null
  changeAmount: number | null
}

export type ActivePosOrderItem = {
  id: number
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  lineTotalAmount: number
  sortOrder: number
  options: ActivePosOrderItemOption[]
}

export type ActivePosOrderItemOption = {
  id: number
  productOptionId: number | null
  productOptionValueId: number | null
  optionName: string
  optionValueName: string
  quantity: number
  lineOptionAmount: number
}

export type ActivePosOrder = {
  orderId: number
  orderCode: string
  orderNumber: string
  revisionCode: string
  revisionNo: number
  subtotalAmount: number
  totalAmount: number
}

export type GetActivePosOrderRequest = {
  profileId: number
  channelCode: string
  locationId: number
}

export type GetActivePosOrderResponse = {
  ok: true
  order: ActivePosOrder | null
  items: ActivePosOrderItem[]
}

export type PosOrderApiErrorResponse = {
  message?: string | string[]
  error?: string
  statusCode?: number
}

export type PosOrderApiResult<T> = {
  data: T | null
  error: string | null
}

// SECTION 03 : CONSTANT

const POS_ORDERS_ENDPOINT =
  'business/pos/orders'

// SECTION 04 : API FUNCTION

export async function createPosOrder(
  payload: CreatePosOrderRequest
): Promise<PosOrderApiResult<CreatePosOrderResponse>> {
  try {
    const data =
      await apiFetch<CreatePosOrderResponse>(
        POS_ORDERS_ENDPOINT,
        {
          method: 'POST',
          body: payload
        }
      )

    return {
      data,
      error: null
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'POS 주문 등록 요청 중 네트워크 오류가 발생했습니다.'

    return {
      data: null,
      error: message
    }
  }
}

export async function cancelPosOrder(
  payload: CancelPosOrderRequest
): Promise<PosOrderApiResult<CancelPosOrderResponse>> {
  try {
    const data =
      await apiFetch<CancelPosOrderResponse>(
        'business/pos/orders/cancel',
        {
          method: 'PATCH',
          body: payload
        }
      )

    return {
      data,
      error: null
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'POS 주문취소 요청 중 오류가 발생했습니다.'

    return {
      data: null,
      error: message
    }
  }
}

export async function getActivePosOrder(
  params: GetActivePosOrderRequest
): Promise<PosOrderApiResult<GetActivePosOrderResponse>> {
  try {
    const query = new URLSearchParams({
      profileId: String(params.profileId),
      channelCode: params.channelCode,
      locationId: String(params.locationId)
    })

    const data =
      await apiFetch<GetActivePosOrderResponse>(
        `${POS_ORDERS_ENDPOINT}/active?${query.toString()}`,
        {
          method: 'GET'
        }
      )

    return {
      data,
      error: null
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'POS 진행중 주문 조회 중 오류가 발생했습니다.'

    return {
      data: null,
      error: message
    }
  }
}

export async function completePosPayment(
  payload: CompletePosPaymentRequest
): Promise<PosOrderApiResult<CompletePosPaymentResponse>> {
  try {
    const data =
      await apiFetch<CompletePosPaymentResponse>(
        `${POS_ORDERS_ENDPOINT}/pay`,
        {
          method: 'POST',
          body: payload
        }
      )

    return {
      data,
      error: null
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'POS 결제 처리 중 오류가 발생했습니다.'

    return {
      data: null,
      error: message
    }
  }
}

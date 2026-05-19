// FILE : backend/src/modules/business/pos/orders/dto/create-pos-order.dto.ts
// ROOT : backend/src/modules/business/pos/orders/dto/create-pos-order.dto.ts
// STATUS : CREATE MODE
// ROLE : POS ORDER CREATE DTO
// CHANGE SUMMARY :
// - POS 주문 등록 요청 DTO 신규 생성
// - pos_orders / pos_order_items / pos_order_item_options 저장 입력 구조 정의
// - DB schema 기준 orderSource / orderFlowType / optionType 값 제한 반영
// - TABLE 입력은 Service에서 IN_STORE로 정규화 가능하도록 허용

// SECTION 01 : TYPE

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

// SECTION 02 : OPTION DTO

export class CreatePosOrderItemOptionDto {
  readonly optionId?: number | null

  readonly optionValueId?: number | null

  readonly optionName?: string | null

  readonly optionType?: PosOrderOptionType | null

  readonly optionValueName?: string | null

  readonly priceDelta?: number | null

  readonly quantity?: number | null
}

// SECTION 03 : ITEM DTO

export class CreatePosOrderItemDto {
  readonly productId!: number

  readonly productName?: string | null

  readonly unitPrice?: number | null

  readonly quantity!: number

  readonly categoryName?: string | null

  readonly productKind?: 'MAIN_PRODUCT' | 'SUB_PRODUCT' | null

  readonly options?: CreatePosOrderItemOptionDto[] | null
}

// SECTION 04 : ORDER DTO

export class CreatePosOrderDto {
  readonly profileId!: number

  readonly channelCode!: string

  readonly locationId!: number

  readonly locationName?: string | null

  readonly orderSource!: PosOrderSource

  readonly orderFlowType!: PosOrderFlowType

  readonly customerProfileId?: number | null

  readonly customerChannelCode?: string | null

  readonly customerMemo?: string | null

  readonly previousOrderId?: number | null

  readonly previousOrderCode?: string | null

  readonly items!: CreatePosOrderItemDto[]
}

// SECTION 05 : RESPONSE TYPE

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

export class CancelPosOrderDto {
  readonly profileId!: number
  readonly channelCode!: string
  readonly locationId!: number
  readonly orderId?: number | null
  readonly orderCode?: string | null
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

export class CompletePosPaymentDto {
  readonly profileId!: number
  readonly channelCode!: string
  readonly locationId!: number
  readonly orderId?: number | null
  readonly orderCode?: string | null
  readonly paymentMethod!: PosPaymentMethod
  readonly receivedCashAmount?: number | null
  readonly paidStaffCode?: string | null
  readonly paidStaffNameSnapshot?: string | null
  readonly memo?: string | null
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

export class GetActivePosOrderDto {
  readonly profileId!: number
  readonly channelCode!: string
  readonly locationId!: number
}

export type ActivePosOrderItemResponse = {
  id: number
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  lineTotalAmount: number
  sortOrder: number
  options: ActivePosOrderItemOptionResponse[]
}

export type ActivePosOrderItemOptionResponse = {
  id: number
  productOptionId: number | null
  productOptionValueId: number | null
  optionName: string
  optionValueName: string
  quantity: number
  lineOptionAmount: number
}

export type GetActivePosOrderResponse = {
  ok: true
  order: {
    orderId: number
    orderCode: string
    orderNumber: string
    revisionCode: string
    revisionNo: number
    subtotalAmount: number
    totalAmount: number
  } | null
  items: ActivePosOrderItemResponse[]
}

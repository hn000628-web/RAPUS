export type CustomerOrderSource =
  | 'TABLE_ORDER'
  | 'QR_ORDER'
  | 'ONLINE'

export type CustomerOrderFlowType =
  | 'IN_STORE'
  | 'PICKUP'
  | 'DELIVERY'
  | 'RESERVATION'
  | 'ROOM_SERVICE'

export type CustomerOrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REPLACED'
  | 'CANCELLED'
  | 'ADMIN_DISABLED'

export type CustomerPaymentStatus =
  | 'UNPAID'
  | 'PAID'
  | 'PARTIAL_REFUND'
  | 'REFUNDED'
  | 'FAILED'
  | 'CANCELED'

export type CustomerOrderOptionValueResponse = {
  id: number
  optionValueName: string
  priceDelta: number
  isDefault: number
  isVisible: number
}

export type CustomerOrderOptionResponse = {
  id: number
  optionName: string
  optionType: string
  isRequired: number
  isMultiple: number
  minSelectCount: number
  maxSelectCount: number
  values: CustomerOrderOptionValueResponse[]
}

export type CustomerOrderProductResponse = {
  id: number
  productCode: string | null
  productName: string
  productDescription: string | null
  basePrice: number
  categoryId: number | null
  categoryName: string | null
  menuStatus: string
  isSoldOut: number
  showOnTableOrder: number
  allowDineIn: number
  allowTakeout: number
  allowDelivery: number
  options: CustomerOrderOptionResponse[]
}

export type CustomerOrderBootstrapResponse = {
  provider: {
    profileId: number
    channelCode: string
    displayName: string | null
  }
  location: {
    id: number
    locationName: string
    floor: string
    zone: string
    resourceStatus: string
  } | null
  categories: Array<{
    id: number
    categoryCode: string
    categoryName: string
    sortOrder: number
  }>
  products: CustomerOrderProductResponse[]
}

export type CustomerOrderItemResponse = {
  id: number
  posProductId: number
  productNameSnapshot: string
  unitPriceSnapshot: number
  quantity: number
  lineTotalAmount: number
  requestMemoSnapshot: string | null
  options: Array<{
    id: number
    productOptionId: number | null
    productOptionValueId: number | null
    optionNameSnapshot: string
    optionValueNameSnapshot: string
    quantity: number
    lineOptionAmount: number
  }>
}

export type CustomerOrderFulfillmentResponse = {
  id: number
  fulfillmentType: string
  locationId: number | null
  sourceLabelSnapshot: string | null
  deliveryAddress: string | null
  deliveryDetailAddress: string | null
  deliveryPhone: string | null
  deliveryMemo: string | null
  pickupExpectedAt: string | null
  reservationExpectedAt: string | null
  qrCodeValue: string | null
  customerRequestMemo: string | null
}

export type CustomerOrderResponse = {
  id: number
  orderCode: string
  revisionCode: string
  revisionNo: number
  providerChannelCode: string
  customerChannelCode: string | null
  orderStatus: CustomerOrderStatus
  paymentStatus: CustomerPaymentStatus
  subtotalAmount: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  createdAt: string
}

export type CustomerOrderDetailResponse = {
  order: CustomerOrderResponse
  items: CustomerOrderItemResponse[]
  fulfillment: CustomerOrderFulfillmentResponse | null
  statusEvents: Array<{
    id: number
    fromStatus: string | null
    toStatus: string
    changedByType: string
    reason: string | null
    createdAt: string
  }>
}

export type ValidatedOrderOption = {
  productOptionId: number
  productOptionValueId: number
  optionNameSnapshot: string
  optionTypeSnapshot: string
  optionValueNameSnapshot: string
  priceDeltaSnapshot: number
  quantity: number
  lineOptionAmount: number
}

export type ValidatedOrderProduct = {
  posProductId: number
  productKindSnapshot: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  categoryNameSnapshot: string | null
  productNameSnapshot: string
  unitPriceSnapshot: number
  quantity: number
  lineTotalAmount: number
  requestMemoSnapshot: string | null
  options: ValidatedOrderOption[]
}

export type CustomerOrderCalculationResult = {
  subtotalAmount: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
}

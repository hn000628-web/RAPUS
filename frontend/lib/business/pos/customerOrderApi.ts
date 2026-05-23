import { apiFetch } from '@/lib/api'

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
  | 'PARTIAL'
  | 'REFUNDED'
  | 'CANCELED'
  | 'CANCELLED'

export type CustomerOrderBootstrapQuery = {
  providerChannelCode: string
  orderFlowType?: CustomerOrderFlowType
  locationId?: number
  tableCode?: string
}

export type CustomerOrderProvider = {
  profileId: number
  channelCode: string
  displayName: string | null
}

export type CustomerOrderLocation = {
  id: number
  locationName: string
  floor: string
  zone: string
  resourceStatus: string
}

export type CustomerOrderCategory = {
  id: number
  categoryCode: string
  categoryName: string
  sortOrder: number
}

export type CustomerOrderOptionValue = {
  id: number
  optionValueName: string
  priceDelta: number
  isDefault: number
  isVisible: number
  isQuantityEnabled?: number | boolean
  isQuantityLimitEnabled?: number | boolean
  minOptionQuantity?: number | null
  maxOptionQuantity?: number | null
  defaultOptionQuantity?: number | null
}

export type CustomerOrderProductOption = {
  id: number
  optionName: string
  optionType: string
  isRequired: number
  isMultiple: number
  minSelectCount: number
  maxSelectCount: number
  values: CustomerOrderOptionValue[]
}

export type CustomerOrderProduct = {
  id: number
  productDbId?: number
  productId?: string | null
  productCode: string | null
  sourceType?: 'POS_PRODUCT' | 'MARKET_PRODUCT'
  primaryScanCodeType?: string | null
  primaryScanCodeValue?: string | null
  primaryQrCodeValue?: string | null
  primaryScanCodeSource?: string | null
  externalBarcodeFormat?: string | null
  primaryBarcodeValue?: string | null
  primaryBarcodeType?: string | null
  itemNumber?: string | null
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
  thumbnail?: {
    filePath: string | null
  } | null
  options: CustomerOrderProductOption[]
}

export type CustomerOrderBootstrapResponse = {
  provider: CustomerOrderProvider
  location: CustomerOrderLocation | null
  categories: CustomerOrderCategory[]
  products: CustomerOrderProduct[]
}

export type CreateCustomerOrderOptionInput = {
  productOptionId: number
  productOptionValueId: number
  quantity?: number
}

export type CreateCustomerOrderItemInput = {
  posProductId: number
  productCode?: string
  productId?: string
  sourceType?: 'POS_PRODUCT' | 'MARKET_PRODUCT'
  cartCode?: string
  cartItemCode?: string
  quantity: number
  requestMemo?: string
  options?: CreateCustomerOrderOptionInput[]
}

export type CustomerOrderFulfillmentInput = {
  deliveryAddress?: string
  deliveryDetailAddress?: string
  deliveryPhone?: string
  deliveryMemo?: string
  pickupExpectedAt?: string
  reservationExpectedAt?: string
  customerRequestMemo?: string
  qrCodeValue?: string
}

export type CreateCustomerOrderRequest = {
  providerChannelCode: string
  orderSource: CustomerOrderSource
  orderFlowType: CustomerOrderFlowType
  locationId?: number
  tableCode?: string
  customerProfileId?: number
  customerChannelCode?: string
  customerName?: string
  customerPhone?: string
  memo?: string
  fulfillment?: CustomerOrderFulfillmentInput
  items: CreateCustomerOrderItemInput[]
}

export type CustomerOrderSummary = {
  id: number
  orderCode: string
  revisionCode: string
  revisionNo: number
  providerChannelCode: string
  customerChannelCode: string | null
  orderStatus: CustomerOrderStatus | string
  paymentStatus: CustomerPaymentStatus | string
  subtotalAmount: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  createdAt: string
}

export type CustomerOrderItemOptionResponse = {
  id: number
  orderItemId: number
  productOptionId: number | null
  productOptionValueId: number | null
  optionNameSnapshot: string
  optionTypeSnapshot: string
  optionValueNameSnapshot: string
  priceDeltaSnapshot: number
  quantity: number
  lineOptionAmount: number
}

export type CustomerOrderItemResponse = {
  id: number
  orderId: number
  orderCode: string
  revisionCode: string
  revisionNo: number
  posProductId: number | null
  productCode?: string | null
  productId?: string | null
  sourceType?: 'POS_PRODUCT' | 'MARKET_PRODUCT' | null
  cartCode?: string | null
  cartItemCode?: string | null
  optionSignature?: string | null
  fulfillmentType?: string | null
  fulfillmentSignature?: string | null
  productNameSnapshot: string
  categoryNameSnapshot: string | null
  unitPriceSnapshot: number
  quantity: number
  lineTotalAmount: number
  options?: CustomerOrderItemOptionResponse[]
}

export type CustomerOrderFulfillmentResponse = {
  id: number
  orderId: number
  orderCode: string
  revisionCode: string | null
  fulfillmentType: string
  locationId: number | null
  sourceLabelSnapshot: string | null
  deliveryAddress: string | null
  deliveryDetailAddress: string | null
  deliveryPhone: string | null
  deliveryMemo: string | null
  pickupExpectedAt: string | null
  reservationExpectedAt: string | null
  customerRequestMemo: string | null
  qrCodeValue: string | null
}

export type CustomerOrderStatusEventResponse = {
  id: number
  orderId: number
  orderCode: string
  revisionCode: string | null
  fromStatus: string | null
  toStatus: string
  changedByType: string
  reason: string | null
  createdAt: string
}

export type CreateCustomerOrderResponse = {
  order: CustomerOrderSummary
  items: CustomerOrderItemResponse[]
  fulfillment: CustomerOrderFulfillmentResponse | null
}

export type CustomerOrderDetailQuery = {
  providerChannelCode: string
  revisionCode?: string
  customerChannelCode?: string
}

export type CustomerOrderDetailResponse = {
  order: CustomerOrderSummary
  items: CustomerOrderItemResponse[]
  fulfillment: CustomerOrderFulfillmentResponse | null
  statusEvents: CustomerOrderStatusEventResponse[]
}

export type CancelCustomerOrderRequest = {
  providerChannelCode: string
  revisionCode?: string
  customerChannelCode?: string
  reason?: string
}

export type CancelCustomerOrderResponse = {
  order: CustomerOrderSummary
  statusEvent?: CustomerOrderStatusEventResponse
}

const CUSTOMER_ORDER_API_PATH =
  'business/pos/customer/orders'

function buildQueryString(
  query: Record<string, string | number | undefined | null>
): string {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    params.set(key, String(value))
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

async function requestJson<TResponse>(
  path: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    body?: unknown
  }
): Promise<TResponse> {
  return apiFetch<TResponse>(
    path,
    {
      method: options?.method,
      body: options?.body,
    }
  )
}

export async function getCustomerOrderBootstrap(
  query: CustomerOrderBootstrapQuery
): Promise<CustomerOrderBootstrapResponse> {
  const queryString = buildQueryString({
    providerChannelCode: query.providerChannelCode,
    orderFlowType: query.orderFlowType,
    locationId: query.locationId,
    tableCode: query.tableCode,
  })

  return requestJson<CustomerOrderBootstrapResponse>(
    `${CUSTOMER_ORDER_API_PATH}/bootstrap${queryString}`,
    {
      method: 'GET',
    }
  )
}

export async function createCustomerOrder(
  payload: CreateCustomerOrderRequest
): Promise<CreateCustomerOrderResponse> {
  return requestJson<CreateCustomerOrderResponse>(
    CUSTOMER_ORDER_API_PATH,
    {
      method: 'POST',
      body: payload,
    }
  )
}

export async function getCustomerOrderDetail(
  orderCode: string,
  query: CustomerOrderDetailQuery
): Promise<CustomerOrderDetailResponse> {
  const encodedOrderCode = encodeURIComponent(orderCode)
  const queryString = buildQueryString({
    providerChannelCode: query.providerChannelCode,
    revisionCode: query.revisionCode,
    customerChannelCode: query.customerChannelCode,
  })

  return requestJson<CustomerOrderDetailResponse>(
    `${CUSTOMER_ORDER_API_PATH}/${encodedOrderCode}${queryString}`,
    {
      method: 'GET',
    }
  )
}

export async function cancelCustomerOrder(
  orderCode: string,
  payload: CancelCustomerOrderRequest
): Promise<CancelCustomerOrderResponse> {
  const encodedOrderCode = encodeURIComponent(orderCode)

  return requestJson<CancelCustomerOrderResponse>(
    `${CUSTOMER_ORDER_API_PATH}/${encodedOrderCode}/cancel`,
    {
      method: 'PATCH',
      body: payload,
    }
  )
}

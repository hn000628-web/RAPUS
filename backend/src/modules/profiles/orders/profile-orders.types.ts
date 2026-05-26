export type ProfileType = 'GENERAL' | 'BUSINESS'

export type ProfileOrdersContext = {
  userId: number
  profileId: number
  profileType: ProfileType
  channelCode: string
}

export type ProfileOrdersSummary = {
  totalCount: number
  cartItemCount: number
  orderCount: number
  activeOrderCount: number
  completedOrderCount: number
}

export type ProfileCartItem = {
  id: number
  cartCode: string | null
  cartItemCode: string | null
  providerChannelCode: string
  providerName: string
  thumbnailFilePath: string | null
  sourceType: 'POS_PRODUCT' | 'MARKET_PRODUCT'
  orderFlowType: string
  productNameSnapshot: string
  quantity: number
  lineTotalAmount: number
  createdAt: string | null
}

export type ProfileOrderItem = {
  id: number
  orderCode: string
  providerChannelCode: string
  providerName: string
  sourceType: 'POS_PRODUCT' | 'MARKET_PRODUCT'
  orderFlowType: string
  orderStatus: string
  totalAmount: number
  createdAt: string | null
  itemSummary: string
}

export type ProfileOrderDetail = {
  id: number
  orderCode: string
  providerChannelCode: string
  providerName: string
  storeName: string
  sourceType: 'POS_PRODUCT' | 'MARKET_PRODUCT'
  orderFlowType: string
  orderStatus: string
  totalAmount: number
  createdAt: string | null
  orderedAt: string | null
  items: Array<{
    id: number
    itemName: string
    quantity: number
    unitPrice: number
    lineTotal: number
    options: Array<{
      optionName: string
      optionQuantity: number
      optionPrice: number
    }>
    lineTotalAmount: number
    productNameSnapshot: string
  }>
}

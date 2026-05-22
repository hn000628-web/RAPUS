import { apiFetch } from '@/lib/api'
import { normalizeCodeInput, type BusinessObjectCode12, type ChannelCode13 } from '@/lib/codeTypes'

export type CartStatus = 'ACTIVE' | 'ORDERED' | 'DELETED' | 'EXPIRED'
export type OrderFlowType = 'IN_STORE' | 'PICKUP' | 'DELIVERY' | 'RESERVATION' | 'SERVICE' | 'ROOM_SERVICE' | 'PARCEL'
export type CartOptionType = 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM'

export type AddCartItemOptionInput = {
  productOptionId?: number
  productOptionValueId?: number
  optionNameSnapshot?: string
  optionTypeSnapshot?: CartOptionType
  optionValueNameSnapshot?: string
  priceDeltaSnapshot?: number
  quantity?: number
}

export type AddCartItemRequest = {
  providerChannelCode: ChannelCode13
  productCode: BusinessObjectCode12
  quantity: number
  orderFlowType: OrderFlowType
  requestMemo?: string
  options?: AddCartItemOptionInput[]
}

export type AddCartItemResponse = {
  ok: true
  item: {
    id: number
    actorChannelCode: string
    providerChannelCode: ChannelCode13
    cartSessionCode: BusinessObjectCode12 | null
    cartItemCode: BusinessObjectCode12
    productCode: BusinessObjectCode12
    quantity: number
    cartStatus: CartStatus
    lineTotalAmount: number
  }
}

export type CartItemOption = {
  id: number
  optionNameSnapshot: string
  optionTypeSnapshot: CartOptionType
  optionValueNameSnapshot: string
  priceDeltaSnapshot: number
  quantity: number
  lineOptionAmount: number
}

export type CartItem = {
  id: number
  providerChannelCode: ChannelCode13
  cartSessionCode: BusinessObjectCode12 | null
  cartItemCode: BusinessObjectCode12
  productCode: BusinessObjectCode12
  productNameSnapshot: string
  unitPriceSnapshot: number
  quantity: number
  optionTotalAmount: number
  lineTotalAmount: number
  orderFlowType: OrderFlowType
  cartStatus: CartStatus
  requestMemo: string | null
  createdAt: string
  options: CartItemOption[]
}

export type GetMyCartItemsResponse = {
  ok: true
  items: CartItem[]
}

export type UpdateCartItemQuantityResponse = {
  ok: true
  item: {
    id: number
    quantity: number
    lineTotalAmount: number
  }
}

export type UpdateCartItemMemoResponse = {
  ok: true
  item: {
    id: number
    requestMemo: string | null
  }
}

export type DeleteCartItemResponse = {
  ok: true
  cartItemId: number
  cartStatus: CartStatus
}

export type ClearCartItemsResponse = {
  ok: true
}

export type CartCountResponse = {
  ok: true
  activeItemCount: number
  activeProductQuantity: number
}

export async function addCartItem(params: AddCartItemRequest) {
  const body = {
    ...params,
    providerChannelCode: normalizeCodeInput(params.providerChannelCode),
    productCode: normalizeCodeInput(params.productCode)
  }
  return apiFetch<AddCartItemResponse>('cart/items', {
    method: 'POST',
    body
  })
}

export async function getMyCartItems(status: CartStatus = 'ACTIVE') {
  const query = `cart/items?cartStatus=${encodeURIComponent(status)}`
  return apiFetch<GetMyCartItemsResponse>(query)
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number) {
  return apiFetch<UpdateCartItemQuantityResponse>(`cart/items/${cartItemId}/quantity`, {
    method: 'PATCH',
    body: { quantity }
  })
}

export async function updateCartItemMemo(cartItemId: number, requestMemo: string | null) {
  return apiFetch<UpdateCartItemMemoResponse>(`cart/items/${cartItemId}/memo`, {
    method: 'PATCH',
    body: { requestMemo }
  })
}

export async function deleteCartItem(cartItemId: number) {
  return apiFetch<DeleteCartItemResponse>(`cart/items/${cartItemId}`, {
    method: 'DELETE'
  })
}

export async function clearCartItems(providerChannelCode?: string) {
  const query = providerChannelCode?.trim()
    ? `cart/items?providerChannelCode=${encodeURIComponent(normalizeCodeInput(providerChannelCode))}`
    : 'cart/items'

  return apiFetch<ClearCartItemsResponse>(query, {
    method: 'DELETE'
  })
}

export async function getCartCount() {
  return apiFetch<CartCountResponse>('cart/count')
}

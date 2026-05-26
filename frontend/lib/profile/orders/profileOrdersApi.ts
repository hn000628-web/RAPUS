'use client'

import { apiFetch } from '@/lib/api'

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
    productNameSnapshot: string
    quantity: number
    unitPrice: number
    lineTotal: number
    options: Array<{
      optionName: string
      optionQuantity: number
      optionPrice: number
    }>
    lineTotalAmount: number
  }>
}

export async function fetchProfileOrdersSummary(): Promise<ProfileOrdersSummary> {
  const res = await apiFetch<{ ok: boolean; summary: ProfileOrdersSummary }>('/profile/orders/summary')
  return res.summary
}

export async function fetchProfileCartItems(): Promise<ProfileCartItem[]> {
  const res = await apiFetch<{ ok: boolean; items: ProfileCartItem[] }>('/profile/orders/cart-items')
  return Array.isArray(res.items) ? res.items : []
}

export async function fetchProfileOrders(): Promise<ProfileOrderItem[]> {
  const res = await apiFetch<{ ok: boolean; items: ProfileOrderItem[] }>('/profile/orders/orders')
  return Array.isArray(res.items) ? res.items : []
}

export async function fetchProfileOrderDetail(orderId: number): Promise<ProfileOrderDetail> {
  const res = await apiFetch<{ ok: boolean; item: ProfileOrderDetail }>(`/profile/orders/${orderId}`)
  return res.item
}

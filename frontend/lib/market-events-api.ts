import { apiFetch } from '@/lib/api'

export type MarketEventStatus =
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'ENDED'
  | 'HIDDEN'

export type MarketEventType =
  | 'NORMAL'
  | 'PROMOTION'
  | 'SEASON'
  | 'CLEARANCE'
  | 'COUPON'

export type MarketEventMaster = {
  id: number
  eventCode: string
  channelCode: string
  eventTitle: string
  eventDescription: string | null
  eventType: MarketEventType
  eventStatus: MarketEventStatus
  eventStartAt: string | null
  eventEndAt: string | null
  bannerImageAssetId: number | null
  connectedProductCount: number
  hasBanner: number
  createdAt: string | null
  updatedAt: string | null
}

export type MarketEventProduct = {
  id: number
  channelCode: string
  productCode: string
  barcode: string | null
  productName: string
  brandName: string | null
  salePrice: number
  currentStock: number
  safeStock: number
  isSoldOut: number
  displayStatus: string
  eventStatus: string
  thumbnailUrl: string | null
}

export type MarketEventsResponse = {
  summary: {
    totalEvents: number
    activeEvents: number
    scheduledEvents: number
    endedEvents: number
  }
  items: MarketEventMaster[]
}

export type MarketEventDetailResponse = {
  event: MarketEventMaster
  products: MarketEventProduct[]
  productCount: number
  bannerImageAssetId: number | null
}

export type CreateMarketEventInput = {
  channelCode: string
  eventCode: string
  eventTitle: string
  eventDescription?: string | null
  eventType?: MarketEventType
  eventStatus?: MarketEventStatus
  eventStartAt?: string | null
  eventEndAt?: string | null
  bannerImageAssetId?: number | null
}

export type UpdateMarketEventInput = Partial<CreateMarketEventInput> & {
  channelCode: string
}

export function fetchMarketEvents(channelCode: string): Promise<MarketEventsResponse> {
  const searchParams = new URLSearchParams({
    channelCode
  })

  return apiFetch<MarketEventsResponse>(
    `/market-events?${searchParams.toString()}`
  )
}

export function createMarketEvent(
  input: CreateMarketEventInput
): Promise<MarketEventMaster> {
  return apiFetch<MarketEventMaster>('/market-events', {
    method: 'POST',
    body: input
  })
}

export function updateMarketEvent(
  eventCode: string,
  input: UpdateMarketEventInput
): Promise<MarketEventMaster> {
  return apiFetch<MarketEventMaster>(`/market-events/${eventCode}`, {
    method: 'PATCH',
    body: input
  })
}

export function fetchMarketEventDetail(
  eventCode: string
): Promise<MarketEventDetailResponse> {
  return apiFetch<MarketEventDetailResponse>(`/market-events/${eventCode}`)
}

export function connectMarketEventProduct(
  eventCode: string,
  productCode: string
): Promise<MarketEventDetailResponse> {
  return apiFetch<MarketEventDetailResponse>(`/market-events/${eventCode}/products`, {
    method: 'POST',
    body: {
      productCode
    }
  })
}

export function disconnectMarketEventProduct(
  eventCode: string,
  productCode: string
): Promise<MarketEventDetailResponse> {
  return apiFetch<MarketEventDetailResponse>(
    `/market-events/${eventCode}/products/${productCode}`,
    {
      method: 'DELETE'
    }
  )
}

import { apiFetch } from '@/lib/api'

export type FavoriteStatus = 'ACTIVE' | 'DELETED'

export type ToggleProfileFavoriteResponse = {
  ok: true
  status: FavoriteStatus
  isFavorite: boolean
  actorChannelCode: string
  providerChannelCode: string
}

export type ToggleProductFavoriteResponse = {
  ok: true
  status: FavoriteStatus
  isFavorite: boolean
  actorChannelCode: string
  providerChannelCode: string
  productCode: string
}

export type TogglePostRecommendationResponse = {
  ok: true
  status: FavoriteStatus
  isRecommended: boolean
  actorChannelCode: string
  providerChannelCode: string
  postCode: string
}

export type ProfileFavoriteItem = {
  id: number
  providerProfileId: number
  providerChannelCode: string
  providerProfileType: 'GENERAL' | 'BUSINESS'
  displayName: string | null
  channelURL: string | null
  status: FavoriteStatus
  createdAt: string
}

export type ProductFavoriteItem = {
  id: number
  providerProfileId: number
  providerChannelCode: string
  productId: number | null
  productCode: string
  productName: string | null
  basePrice: number | null
  currency: string | null
  status: FavoriteStatus
  createdAt: string
}

export type PostRecommendationItem = {
  id: number
  providerProfileId: number
  providerChannelCode: string
  postId: number | null
  postCode: string
  postType: 'GENERAL' | 'GALLERY' | 'PRODUCT' | 'EVENT' | 'REVIEW'
  title: string | null
  content: string | null
  status: FavoriteStatus
  createdAt: string
}

export type FavoriteListResponse<TItem> = {
  ok: true
  items: TItem[]
}

export type FavoriteStatusResponse = {
  ok: true
  isActive: boolean
  status: FavoriteStatus | null
}

export async function toggleProfileFavorite(providerChannelCode: string) {
  return apiFetch<ToggleProfileFavoriteResponse>(
    'favorites/profiles/toggle',
    {
      method: 'POST',
      body: {
        providerChannelCode
      }
    }
  )
}

export async function getMyProfileFavorites(status: FavoriteStatus = 'ACTIVE') {
  const query = `favorites/profiles/me?status=${encodeURIComponent(status)}`
  return apiFetch<FavoriteListResponse<ProfileFavoriteItem>>(query)
}

export async function getProfileFavoriteStatus(providerChannelCode: string) {
  const query = `favorites/profiles/status?providerChannelCode=${encodeURIComponent(providerChannelCode)}`
  return apiFetch<FavoriteStatusResponse>(query)
}

export async function toggleProductFavorite(params: {
  providerChannelCode: string
  productCode: string
}) {
  return apiFetch<ToggleProductFavoriteResponse>(
    'favorites/products/toggle',
    {
      method: 'POST',
      body: params
    }
  )
}

export async function getMyProductFavorites(status: FavoriteStatus = 'ACTIVE') {
  const query = `favorites/products/me?status=${encodeURIComponent(status)}`
  return apiFetch<FavoriteListResponse<ProductFavoriteItem>>(query)
}

export async function getProductFavoriteStatus(params: {
  providerChannelCode: string
  productCode: string
}) {
  const query = `favorites/products/status?providerChannelCode=${encodeURIComponent(params.providerChannelCode)}&productCode=${encodeURIComponent(params.productCode)}`
  return apiFetch<FavoriteStatusResponse>(query)
}

export async function togglePostRecommendation(params: {
  providerChannelCode: string
  postCode: string
}) {
  return apiFetch<TogglePostRecommendationResponse>(
    'favorites/posts/recommend/toggle',
    {
      method: 'POST',
      body: params
    }
  )
}

export async function getMyPostRecommendations(status: FavoriteStatus = 'ACTIVE') {
  const query = `favorites/posts/recommend/me?status=${encodeURIComponent(status)}`
  return apiFetch<FavoriteListResponse<PostRecommendationItem>>(query)
}

export async function getPostRecommendationStatus(params: {
  providerChannelCode: string
  postCode: string
}) {
  const query = `favorites/posts/recommend/status?providerChannelCode=${encodeURIComponent(params.providerChannelCode)}&postCode=${encodeURIComponent(params.postCode)}`
  return apiFetch<FavoriteStatusResponse>(query)
}


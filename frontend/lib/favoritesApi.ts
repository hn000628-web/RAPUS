import { apiFetch } from '@/lib/api'
import { normalizeCodeInput, type BusinessObjectCode12, type ChannelCode13 } from '@/lib/codeTypes'

export type FavoriteStatus = 'ACTIVE' | 'DELETED'

export type ToggleProfileFavoriteResponse = {
  ok: true
  status: FavoriteStatus
  isFavorite: boolean
  actorChannelCode: ChannelCode13
  providerChannelCode: ChannelCode13
}

export type ToggleProductFavoriteResponse = {
  ok: true
  status: FavoriteStatus
  isFavorite: boolean
  actorChannelCode: ChannelCode13
  providerChannelCode: ChannelCode13
  productCode: BusinessObjectCode12
  favoriteProfileCount?: number
}

export type TogglePostRecommendationResponse = {
  ok: true
  status: FavoriteStatus
  isRecommended: boolean
  actorChannelCode: ChannelCode13
  providerChannelCode: ChannelCode13
  postCode: BusinessObjectCode12
}

export type ProfileFavoriteItem = {
  id: number
  providerProfileId: number
  providerChannelCode: ChannelCode13
  providerProfileType: 'GENERAL' | 'BUSINESS'
  displayName: string | null
  channelURL: string | null
  status: FavoriteStatus
  createdAt: string
}

export type ProductFavoriteItem = {
  id: number
  providerProfileId: number
  providerChannelCode: ChannelCode13
  productId: number | null
  productCode: BusinessObjectCode12
  productName: string | null
  basePrice: number | null
  currency: string | null
  status: FavoriteStatus
  createdAt: string
}

export type PostRecommendationItem = {
  id: number
  providerProfileId: number
  providerChannelCode: ChannelCode13
  postId: number | null
  postCode: BusinessObjectCode12
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
  const normalizedProviderChannelCode = normalizeCodeInput(providerChannelCode)
  return apiFetch<ToggleProfileFavoriteResponse>(
    'favorites/profiles/toggle',
    {
      method: 'POST',
      body: {
        providerChannelCode: normalizedProviderChannelCode
      }
    }
  )
}

export async function getMyProfileFavorites(status: FavoriteStatus = 'ACTIVE') {
  const query = `favorites/profiles/me?status=${encodeURIComponent(status)}`
  return apiFetch<FavoriteListResponse<ProfileFavoriteItem>>(query)
}

export async function getProfileFavoriteStatus(providerChannelCode: string) {
  const query = `favorites/profiles/status?providerChannelCode=${encodeURIComponent(normalizeCodeInput(providerChannelCode))}`
  return apiFetch<FavoriteStatusResponse>(query)
}

export async function toggleProductFavorite(params: {
  providerChannelCode: string
  productCode: string
}) {
  const body = {
    providerChannelCode: normalizeCodeInput(params.providerChannelCode),
    productCode: normalizeCodeInput(params.productCode)
  }
  return apiFetch<ToggleProductFavoriteResponse>(
    'favorites/products/toggle',
    {
      method: 'POST',
      body
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
  const query = `favorites/products/status?providerChannelCode=${encodeURIComponent(normalizeCodeInput(params.providerChannelCode))}&productCode=${encodeURIComponent(normalizeCodeInput(params.productCode))}`
  return apiFetch<FavoriteStatusResponse>(query)
}

export async function togglePostRecommendation(params: {
  providerChannelCode: string
  postCode: string
}) {
  const body = {
    providerChannelCode: normalizeCodeInput(params.providerChannelCode),
    postCode: normalizeCodeInput(params.postCode)
  }
  return apiFetch<TogglePostRecommendationResponse>(
    'favorites/posts/recommend/toggle',
    {
      method: 'POST',
      body
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
  const query = `favorites/posts/recommend/status?providerChannelCode=${encodeURIComponent(normalizeCodeInput(params.providerChannelCode))}&postCode=${encodeURIComponent(normalizeCodeInput(params.postCode))}`
  return apiFetch<FavoriteStatusResponse>(query)
}

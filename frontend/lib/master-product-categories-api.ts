import { apiFetch } from '@/lib/api'

export type FeedExposeType = 'NONE' | 'MARKET_FEED' | 'EVENT_FEED' | 'PROMOTION_FEED'

export type MasterProductCategory = {
  id: number
  categoryCode: string
  categoryName: string
  parentCategoryId: number | null
  parentCategoryCode: string | null
  parentCategoryName: string | null
  depth: number
  sortOrder: number
  isActive: number
  feedExposeType: FeedExposeType
  linkedProductCount: number
  createdAt: string | null
  updatedAt: string | null
}

export type MasterProductCategoriesResponse = {
  summary: {
    totalCount: number
    activeCount: number
    depth1Count: number
    depth2Count: number
  }
  categories: MasterProductCategory[]
}

export type MasterProductCategoryPayload = {
  categoryCode?: string
  categoryName?: string
  parentCategoryId?: number | string | null
  sortOrder?: number | string | null
  isActive?: number | string | boolean | null
  feedExposeType?: FeedExposeType
}

export function fetchMasterProductCategories() {
  return apiFetch<MasterProductCategoriesResponse>('/master-product-categories')
}

export function createMasterProductCategory(payload: MasterProductCategoryPayload) {
  return apiFetch<MasterProductCategory>('/master-product-categories', {
    method: 'POST',
    body: payload
  })
}

export function updateMasterProductCategory(
  categoryCode: string,
  payload: MasterProductCategoryPayload
) {
  return apiFetch<MasterProductCategory>(`/master-product-categories/${categoryCode}`, {
    method: 'PATCH',
    body: payload
  })
}

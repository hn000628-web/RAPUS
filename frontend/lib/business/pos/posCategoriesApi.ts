// FILE : frontend/lib/business/pos/posCategoriesApi.ts
// ROOT : frontend/lib/business/pos/posCategoriesApi.ts
// STATUS : NEW
// ROLE : BUSINESS POS CATEGORIES FRONT API
// CHANGE SUMMARY :
// - GET /api/business/pos/categories 호출 함수 추가
// - PUT /api/business/pos/categories 호출 함수 추가
// - POS 카테고리 타입 정의 추가

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import { apiFetch } from '@/lib/api'

/* ==================================================
SECTION 02 : TYPES
================================================== */

export type PosProductCategory = {
  id: number
  profileId: number
  channelCode: string
  categoryCode: string
  categoryName: string
  sortOrder: number
  isActive: number
  isDefault: number
  isDeletable: number
  ageRestrictionType: string | null
  requiresAdultVerification: number
  restrictedOrderChannel: string | null
  createdAt: string
  updatedAt: string | null
}

export type SavePosProductCategoryInput = {
  id?: number
  categoryCode: string
  categoryName: string
  sortOrder: number
  isActive: number | boolean
  isDefault: number | boolean
  isDeletable: number | boolean
  ageRestrictionType?: string | null
  requiresAdultVerification?: number | boolean
  restrictedOrderChannel?: string | null
}

export type SavePosProductCategoriesRequest = {
  profileId: number
  channelCode: string
  categories: SavePosProductCategoryInput[]
}

export type PosProductCategoriesResponse = {
  success: boolean
  categories: PosProductCategory[]
}

/* ==================================================
SECTION 03 : BASE
================================================== */

const BUSINESS_POS_CATEGORIES_BASE = 'business/pos/categories'

/* ==================================================
SECTION 04 : API
================================================== */

export async function getPosProductCategories(): Promise<PosProductCategoriesResponse> {
  return apiFetch<PosProductCategoriesResponse>(BUSINESS_POS_CATEGORIES_BASE)
}

export async function savePosProductCategories(
  payload: SavePosProductCategoriesRequest
): Promise<PosProductCategoriesResponse> {
  return apiFetch<PosProductCategoriesResponse>(
    BUSINESS_POS_CATEGORIES_BASE,
    {
      method: 'PUT',
      body: payload
    }
  )
}

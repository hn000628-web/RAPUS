// FILE : backend/src/modules/business/pos/categories/pos-categories.types.ts
// ROOT : backend/src/modules/business/pos/categories/pos-categories.types.ts
// STATUS : NEW
// ROLE : BUSINESS POS CATEGORY TYPES
// CHANGE SUMMARY :
// - POS 카테고리 조회/일괄 저장 타입 정의

export type PosProductCategoryCode =
  | 'MAIN'
  | 'SUB'
  | 'DRINK'
  | 'SIDE'
  | 'ALCOHOL'
  | 'CUSTOM'

export type PosProductCategoryRow = {
  id: number
  profileId: number
  channelCode: string
  categoryCode: string
  categoryName: string
  sortOrder: number
  isActive: 0 | 1
  isDefault: 0 | 1
  isDeletable: 0 | 1
  ageRestrictionType: string | null
  requiresAdultVerification: 0 | 1
  restrictedOrderChannel: string | null
  createdAt: string
  updatedAt: string
}

export type SavePosProductCategoryInput = {
  id?: number
  categoryCode: string
  categoryName: string
  sortOrder: number
  isActive: boolean | number
  isDefault: boolean | number
  isDeletable: boolean | number
  ageRestrictionType?: string | null
  requiresAdultVerification?: boolean | number
  restrictedOrderChannel?: string | null
}

export type SavePosProductCategoriesRequest = {
  profileId?: number
  channelCode?: string
  categories: SavePosProductCategoryInput[]
}

export type PosProductCategoriesResponse = {
  success: true
  categories: PosProductCategoryRow[]
}

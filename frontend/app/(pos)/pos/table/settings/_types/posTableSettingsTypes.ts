// FILE : frontend/app/(pos)/pos/table/settings/_types/posTableSettingsTypes.ts
// ROOT : frontend/app/(pos)/pos/table/settings/_types/posTableSettingsTypes.ts
// STATUS : UPDATE
// ROLE : POS TABLE SETTINGS HUB TYPE
// CHANGE SUMMARY :
// - 카테고리관리 탭 관리형 목업 타입 확장

// SECTION 01 : MODULE TYPE
export type PosTableSettingsModule = 'MENU' | 'CATEGORY' | 'TABLE'

// SECTION 02 : MENU MOCK TYPE
export type PosTableSettingsMenuItem = {
  id: string
  name: string
  priceText: string
  statusLabel: '판매중' | '품절' | '숨김'
}

// SECTION 03 : CATEGORY MOCK TYPE
export type PosTableSettingsCategoryItem = {
  id: string
  categoryCode: string
  categoryName: string
  sortOrder: number
  isDefault: boolean
  isRequired: boolean
  isActive: boolean
  requiresAdultVerification: boolean
  deletable: boolean
}

// SECTION 04 : TABLE MOCK TYPE
export type PosTableSettingsTableItem = {
  id: string
  name: string
  statusLabel: '사용중' | '비어있음' | '예약' | '청소중'
  amountText: string
}

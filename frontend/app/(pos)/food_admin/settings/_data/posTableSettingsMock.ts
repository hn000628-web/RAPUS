// FILE : frontend/app/(pos)/pos/table/settings/_data/posTableSettingsMock.ts
// ROOT : frontend/app/(pos)/pos/table/settings/_data/posTableSettingsMock.ts
// STATUS : UPDATE
// ROLE : POS TABLE SETTINGS HUB MOCK DATA
// CHANGE SUMMARY :
// - 카테고리관리 관리형 UI용 목업 데이터 구조 보강

import type {
  PosTableSettingsCategoryItem,
  PosTableSettingsMenuItem,
  PosTableSettingsTableItem
} from '../_types/posTableSettingsTypes'

// SECTION 01 : MENU MOCK
export const menuMockItems: PosTableSettingsMenuItem[] = [
  {
    id: 'menu-1',
    name: '아메리카노',
    priceText: '4,000원',
    statusLabel: '판매중'
  },
  {
    id: 'menu-2',
    name: '카페라떼',
    priceText: '4,500원',
    statusLabel: '판매중'
  },
  {
    id: 'menu-3',
    name: '샌드위치',
    priceText: '7,000원',
    statusLabel: '품절'
  }
]

// SECTION 02 : CATEGORY MOCK
export const categoryMockItems: PosTableSettingsCategoryItem[] = [
  {
    id: 'cat-1',
    categoryCode: 'MAIN',
    categoryName: '메인 메뉴',
    sortOrder: 1,
    isDefault: true,
    isRequired: true,
    isActive: true,
    requiresAdultVerification: false,
    deletable: false
  },
  {
    id: 'cat-2',
    categoryCode: 'SUB',
    categoryName: '서브 메뉴',
    sortOrder: 2,
    isDefault: true,
    isRequired: false,
    isActive: true,
    requiresAdultVerification: false,
    deletable: true
  },
  {
    id: 'cat-3',
    categoryCode: 'DRINK',
    categoryName: '음료',
    sortOrder: 3,
    isDefault: true,
    isRequired: false,
    isActive: true,
    requiresAdultVerification: false,
    deletable: true
  },
  {
    id: 'cat-4',
    categoryCode: 'SIDE',
    categoryName: '사이드',
    sortOrder: 4,
    isDefault: true,
    isRequired: false,
    isActive: true,
    requiresAdultVerification: false,
    deletable: true
  },
  {
    id: 'cat-5',
    categoryCode: 'ALCOHOL',
    categoryName: '주류',
    sortOrder: 5,
    isDefault: true,
    isRequired: false,
    isActive: true,
    requiresAdultVerification: true,
    deletable: true
  }
]

// SECTION 03 : TABLE MOCK
export const tableMockItems: PosTableSettingsTableItem[] = [
  {
    id: 'table-1',
    name: '테이블 1',
    statusLabel: '비어있음',
    amountText: '0원'
  },
  {
    id: 'table-2',
    name: '테이블 2',
    statusLabel: '비어있음',
    amountText: '0원'
  },
  {
    id: 'table-3',
    name: '테이블 3',
    statusLabel: '비어있음',
    amountText: '0원'
  },
  {
    id: 'table-4',
    name: '테이블 4',
    statusLabel: '비어있음',
    amountText: '0원'
  }
]

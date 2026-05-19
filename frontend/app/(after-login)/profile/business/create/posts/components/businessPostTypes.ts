// FILE : frontend/app/(after-login)/profile/business/create/posts/components/businessPostTypes.ts
// ROOT : frontend/app/(after-login)/profile/business/create/posts/components/businessPostTypes.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS POST TYPE DOMAIN + PROFILE BLOCK MAPPING
// CHANGE SUMMARY :
// - BUSINESS 포스트 작성 타입을 EVENT / PRODUCT / GENERAL 3개로 축소
// - GALLERY 제거: 사진첩 전용 영역이므로 포스트 작성 페이지에서 제외
// - REVIEW 제거: 다른 사용자가 작성하는 영역이므로 비즈니스 작성 페이지에서 제외
// - BusinessProfileBlock / Link / Image / Text Block 타입 유지
// - 단일 귀속 profileId + channelCode 기준 주석 유지

// SECTION 01 : BUSINESS POST TYPE DOMAIN

export type BusinessPostType =
  | 'EVENT'
  | 'PRODUCT'
  | 'GENERAL'

export type Category =
  | 'GENERAL'
  | 'PLACE'
  | 'EVENT'
  | 'USED'
  | 'REAL_ESTATE'
  | 'AUTO'
  | 'JOB'
  | 'GROUP'

// SECTION 02 : BUSINESS PROFILE BLOCK

export type BusinessProfileBlock = {
  id?: number
  tempId: string
  type: 'TEXT' | 'LINK' | 'IMAGE' | 'SECTION'
  title?: string
  value?: string
  url?: string
  imageUrl?: string
  sortOrder?: number
}

// SECTION 02-1 : LEGACY ALIAS
export type ProfileBlock = BusinessProfileBlock

// SECTION 03 : LINK BLOCK

export type BusinessProfileLink = {
  tempId: string
  title: string
  url: string
}

// SECTION 04 : IMAGE BLOCK

export type BusinessProfileImageBlock = {
  tempId: string
  imageUrl: string
}

// SECTION 05 : TEXT BLOCK

export type BusinessProfileTextBlock = {
  tempId: string
  title?: string
  value: string
}

// SECTION 06 : DB CATEGORY MAPPING

export interface BusinessCategoryMap {
  profileId: number
  channelCode: string
  postType: BusinessPostType
  name: string
  title: string
  sortOrder: number
  isActive: boolean
  isSystem?: boolean
  createdAt?: string
  updatedAt?: string
}

// SECTION 07 : SINGLE OWNERSHIP RULE

// 단일 귀속 : profileId + channelCode
// posts / profile_categories / media domain 모두 동일 기준 적용
// ownerChannelCode 사용 금지
// 추정 profileId 사용 금지

// SECTION 08 : BUSINESS POST TYPE POLICY

// 작성 가능:
// EVENT   → 행사 / 이벤트 / 프로모션
// PRODUCT → 메뉴 / 서비스 / 가격 / 상품
// GENERAL → 일반 게시물
//
// 작성 제외:
// GALLERY → 사진첩 전용 영역
// REVIEW  → 다른 사용자가 작성하는 리뷰 영역

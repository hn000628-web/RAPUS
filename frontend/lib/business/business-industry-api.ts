// FILE : frontend/lib/business/business-industry-api.ts
// ROOT : frontend/lib/business/business-industry-api.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS INDUSTRY FRONTEND API
// CHANGE SUMMARY :
// - BUSINESS 업종설정 전용 프론트 API helper 신규 생성
// - 현재 업종 조회 / 업종 검색 / 서브업종 조회 / 업종 저장 함수 추가
// - business-industry.service 전용 백엔드 경로 기준으로 정렬
// - 단일 귀속 write 기준(channelCode + profileId) validation 유지
// - 공용 fetch wrapper 반환 계약 기준으로 직접 typed return 구조 적용

// SECTION 01 : IMPORT

import { apiFetch } from '@/lib/api'

// SECTION 02 : TYPE

export type CurrentBusinessIndustryResponse = {
  ok: true
  profileId: number
  channelCode: string
  current: {
    industryId: number | null
    industryCode: string | null
    industryName: string | null
    industrySubtypeId: number | null
    industrySubtypeCode: string | null
    industrySubtypeName: string | null
  }
}

export type BusinessIndustrySearchItem = {
  industryId: number
  industryCode: string
  industryName: string
  description: string | null
  sortOrder: number
}

export type BusinessIndustrySearchResponse = {
  ok: true
  keyword: string
  items: BusinessIndustrySearchItem[]
}

export type BusinessIndustrySubtypeItem = {
  subtypeId: number
  subtypeCode: string
  subtypeName: string | null
  subtypeNameEn: string | null
  subtypeNameKo: string | null
  searchKeywords: string | null
  sortOrder: number
}

export type BusinessIndustrySubtypeResponse = {
  ok: true
  industryCode: string
  industryId: number
  industryName: string
  items: BusinessIndustrySubtypeItem[]
}

export type UpdateBusinessIndustryParams = {
  profileId: number
  channelCode: string
  industryCode: string
  industrySubtypeCode?: string | null
}

export type UpdateBusinessIndustryResponse = {
  ok: true
  profileId: number
  channelCode: string
  industryId: number
  industryCode: string
  industrySubtypeId: number | null
  industrySubtypeCode: string | null
}

// SECTION 03 : VALIDATION

function normalizeRequiredProfileId(
  profileId: number
): number {
  const normalizedProfileId = Number(profileId)

  if (
    !Number.isInteger(normalizedProfileId) ||
    normalizedProfileId <= 0
  ) {
    throw new Error('profileId invalid')
  }

  return normalizedProfileId
}

function normalizeRequiredChannelCode(
  channelCode: string
): string {
  if (typeof channelCode !== 'string') {
    throw new Error('channelCode missing')
  }

  const normalizedChannelCode = channelCode.trim()

  if (!normalizedChannelCode) {
    throw new Error('channelCode missing')
  }

  return normalizedChannelCode
}

function normalizeRequiredIndustryCode(
  industryCode: string
): string {
  if (typeof industryCode !== 'string') {
    throw new Error('industryCode missing')
  }

  const normalizedIndustryCode =
    industryCode.trim().toUpperCase()

  if (!normalizedIndustryCode) {
    throw new Error('industryCode missing')
  }

  return normalizedIndustryCode
}

function normalizeOptionalIndustrySubtypeCode(
  industrySubtypeCode?: string | null
): string | null {
  if (typeof industrySubtypeCode !== 'string') {
    return null
  }

  const normalizedIndustrySubtypeCode =
    industrySubtypeCode.trim().toUpperCase()

  if (!normalizedIndustrySubtypeCode) {
    return null
  }

  return normalizedIndustrySubtypeCode
}

function normalizeSearchKeyword(
  keyword?: string
): string {
  if (typeof keyword !== 'string') {
    return ''
  }

  return keyword.trim()
}

// SECTION 04 : CURRENT INDUSTRY

export async function getCurrentBusinessIndustry(
  channelCode: string
): Promise<CurrentBusinessIndustryResponse> {
  const normalizedChannelCode =
    normalizeRequiredChannelCode(channelCode)

  return apiFetch<CurrentBusinessIndustryResponse>(
    `/business/industry/current/${encodeURIComponent(normalizedChannelCode)}`
  )
}

// SECTION 05 : INDUSTRY SEARCH

export async function searchBusinessIndustries(
  keyword?: string
): Promise<BusinessIndustrySearchResponse> {
  const normalizedKeyword =
    normalizeSearchKeyword(keyword)

  const queryString = normalizedKeyword
    ? `?keyword=${encodeURIComponent(normalizedKeyword)}`
    : ''

  return apiFetch<BusinessIndustrySearchResponse>(
    `/business/industry/search${queryString}`
  )
}

// SECTION 06 : INDUSTRY SUBTYPES

export async function getBusinessIndustrySubtypes(
  industryCode: string
): Promise<BusinessIndustrySubtypeResponse> {
  const normalizedIndustryCode =
    normalizeRequiredIndustryCode(industryCode)

  return apiFetch<BusinessIndustrySubtypeResponse>(
    `/business/industry/subtypes/${encodeURIComponent(normalizedIndustryCode)}`
  )
}

// SECTION 07 : UPDATE INDUSTRY

export async function updateBusinessIndustry(
  params: UpdateBusinessIndustryParams
): Promise<UpdateBusinessIndustryResponse> {
  const profileId =
    normalizeRequiredProfileId(params.profileId)

  const channelCode =
    normalizeRequiredChannelCode(params.channelCode)

  const industryCode =
    normalizeRequiredIndustryCode(params.industryCode)

  const industrySubtypeCode =
    normalizeOptionalIndustrySubtypeCode(
      params.industrySubtypeCode
    )

  return apiFetch<UpdateBusinessIndustryResponse>(
    '/business/industry',
    {
      method: 'PATCH',
      body: {
        profileId,
        channelCode,
        industryCode,
        industrySubtypeCode
      }
    }
  )
}
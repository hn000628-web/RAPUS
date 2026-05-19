// FILE : frontend/lib/business/profile-info-api.ts
// ROOT : frontend/lib/business/profile-info-api.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS INFO TAB FRONTEND API HELPER
// CHANGE SUMMARY :
// - BUSINESS 안내 탭 전용 프론트 API helper를 인포 전용 backend endpoint 직접 호출 구조로 수정
// - 기존 getBusinessProfileDetail(channelCode) 재사용 제거
// - /business/profile-info/:channelCode 응답 계약 기준으로 정규화
// - 안내 탭 전용 bio / contactPhone / detailAddress / hours / sections 반환 유지

import { apiFetch } from '@/lib/api'

/* ==================================================
SECTION 01 : TYPE
================================================== */

export type BusinessInfoBlockType =
  | 'TEXT'
  | 'LINK'
  | 'IMAGE'
  | 'SECTION'

export type BusinessInfoBlock = {
  id?: number
  type: BusinessInfoBlockType
  title?: string
  value?: string | null
  content?: string | null
  url?: string | null
  imageUrl?: string | null
  sortOrder?: number
}

export type BusinessInfoHoursDay = {
  dayKey: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
  dayLabel: string
  isClosed: boolean
  openTime: string
  closeTime: string
}

export type BusinessInfoView = {
  bio: string | null
  contactPhone: string | null
  detailAddress: string | null
  hours: {
    summary: string
    weeklyHours: BusinessInfoHoursDay[]
    temporaryClosed: boolean
    alwaysOpen: boolean
    updatedAt: string | null
  } | null
  sections: BusinessInfoBlock[]
}

type BusinessInfoApiResponse = {
  profile: {
    profileId: number
    channelCode: string
    displayName: string | null
    bio: string | null
  }
  placeMeta: {
    contactPhone: string | null
    detailAddress: string | null
    activityRegionId: number | null
    feedRegionId: number | null
    activityRegion: {
      id: number
      code: string | null
      name: string | null
      fullName: string | null
      regionType: string | null
      countryCode: string | null
      latitude: number | null
      longitude: number | null
    } | null
    feedRegion: {
      id: number
      code: string | null
      name: string | null
      fullName: string | null
      regionType: string | null
      countryCode: string | null
      latitude: number | null
      longitude: number | null
    } | null
  }
  hours: {
    weeklyHours: Array<{
      dayKey: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
      dayLabel: string
      isClosed: boolean
      openTime: string
      closeTime: string
    }>
    summary: string
    temporaryClosed?: boolean | number
    alwaysOpen?: boolean | number
    updatedAt: string | null
  }
  infoBlocks: Array<{
    id?: number
    profileId: number
    blockType: string
    title?: string | null
    content?: string | null
    linkUrl?: string | null
    description?: string | null
    sortOrder: number
    isActive?: number | null
    createdAt?: string | null
    updatedAt?: string | null
  }>
}

/* ==================================================
SECTION 02 : HELPER
================================================== */

function mapInfoBlocks(
  response: BusinessInfoApiResponse
): BusinessInfoBlock[] {
  if (!Array.isArray(response.infoBlocks)) {
    return []
  }

  return response.infoBlocks.map((block) => ({
    id: block.id,
    type: (block.blockType || 'TEXT') as BusinessInfoBlockType,
    title: block.title ?? undefined,
    value: block.content ?? null,
    content: block.content ?? null,
    url: block.linkUrl ?? null,
    imageUrl: null,
    sortOrder: block.sortOrder
  }))
}

function mapHours(
  response: BusinessInfoApiResponse
): BusinessInfoView['hours'] {
  const hours = response.hours

  if (!hours) {
    return null
  }

  return {
    summary: hours.summary ?? '',
    temporaryClosed: Boolean(hours.temporaryClosed),
    alwaysOpen: Boolean(hours.alwaysOpen),
    updatedAt: hours.updatedAt ?? null,
    weeklyHours: Array.isArray(hours.weeklyHours)
      ? hours.weeklyHours.map((day) => ({
          dayKey: day.dayKey,
          dayLabel: day.dayLabel,
          isClosed: day.isClosed,
          openTime: day.openTime,
          closeTime: day.closeTime
        }))
      : []
  }
}

/* ==================================================
SECTION 03 : API
================================================== */

const BUSINESS_INFO_BASE = 'business/profile-info'

export async function getBusinessInfoView(
  channelCode: string
): Promise<BusinessInfoView> {
  const normalizedChannelCode =
    channelCode?.trim()

  if (!normalizedChannelCode) {
    throw new Error('channelCode missing')
  }

  const response =
    await apiFetch<BusinessInfoApiResponse>(
      `${BUSINESS_INFO_BASE}/${normalizedChannelCode}`
    )

  return {
    bio: response.profile?.bio ?? null,
    contactPhone: response.placeMeta?.contactPhone ?? null,
    detailAddress: response.placeMeta?.detailAddress ?? null,
    hours: mapHours(response),
    sections: mapInfoBlocks(response)
  }
}

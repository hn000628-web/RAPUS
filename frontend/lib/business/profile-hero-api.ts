// FILE : frontend/lib/business/profile-hero-api.ts
// ROOT : frontend/lib/business/profile-hero-api.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS PROFILE HERO FRONTEND API MODULE
// CHANGE SUMMARY :
// - BUSINESS 히어로 전용 frontend api module 생성
// - backend business/profile-hero controller 기준으로 조회/연결/수정/정렬/삭제 함수 구성
// - profileId + channelCode 단일 귀속 컨텍스트 전달 구조 유지
// - media upload 와 hero relation connect 분리 구조 유지
// - 공통 apiFetch 기반으로 통일

import { apiFetch } from '@/lib/api'

// SECTION 01 : TYPE

export type BusinessHeroImage = {
  id: number
  profileId: number
  channelCode: string | null
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
  externalUrl: string | null
  title: string | null
  description: string | null
  linkUrl: string | null
  sortOrder: number
  isActive: number | null
  createdAt: string | null
  updatedAt: string | null
}

export type ConnectBusinessHeroPayload = {
  channelCode: string
  imageAssetId?: number | null
  externalUrl?: string | null
  title?: string | null
  description?: string | null
  linkUrl?: string | null
  sortOrder?: number | null
}

export type UpdateBusinessHeroPayload = {
  channelCode: string
  title?: string | null
  description?: string | null
  linkUrl?: string | null
  sortOrder?: number | null
  isActive?: number | null
}

export type ReorderBusinessHeroItem = {
  heroId: number
  sortOrder: number
}

export type ReorderBusinessHeroPayload = {
  channelCode: string
  items: ReorderBusinessHeroItem[]
}

export type DeleteBusinessHeroResponse = {
  success: boolean
}

// SECTION 02 : BASE

const BUSINESS_PROFILE_HERO_BASE = 'business/profile-hero'

// SECTION 03 : HELPER

function normalizeChannelCode(
  channelCode: string
): string {
  const normalized = channelCode.trim()

  if (!normalized) {
    throw new Error('channelCode missing')
  }

  return normalized
}

function buildHeroListQuery(
  channelCode: string
): string {
  const params = new URLSearchParams()

  params.set(
    'channelCode',
    normalizeChannelCode(channelCode)
  )

  return params.toString()
}

// SECTION 04 : READ API

export async function getBusinessHeroImages(
  profileId: number,
  channelCode: string
): Promise<BusinessHeroImage[]> {
  const queryString = buildHeroListQuery(channelCode)

  return apiFetch<BusinessHeroImage[]>(
    `${BUSINESS_PROFILE_HERO_BASE}/${profileId}?${queryString}`
  )
}

export async function getBusinessHeroImageDetail(
  profileId: number,
  heroId: number,
  channelCode: string
): Promise<BusinessHeroImage> {
  const queryString = buildHeroListQuery(channelCode)

  return apiFetch<BusinessHeroImage>(
    `${BUSINESS_PROFILE_HERO_BASE}/${profileId}/${heroId}?${queryString}`
  )
}

// SECTION 05 : WRITE API

export async function connectBusinessHeroImage(
  profileId: number,
  payload: ConnectBusinessHeroPayload
): Promise<BusinessHeroImage> {
  return apiFetch<BusinessHeroImage>(
    `${BUSINESS_PROFILE_HERO_BASE}/${profileId}`,
    {
      method: 'PUT',
      body: {
        channelCode: normalizeChannelCode(payload.channelCode),
        imageAssetId: payload.imageAssetId ?? null,
        externalUrl: payload.externalUrl ?? null,
        title: payload.title ?? null,
        description: payload.description ?? null,
        linkUrl: payload.linkUrl ?? null,
        sortOrder: payload.sortOrder ?? null
      }
    }
  )
}

export async function updateBusinessHeroImageMeta(
  profileId: number,
  heroId: number,
  payload: UpdateBusinessHeroPayload
): Promise<BusinessHeroImage> {
  return apiFetch<BusinessHeroImage>(
    `${BUSINESS_PROFILE_HERO_BASE}/${profileId}/${heroId}`,
    {
      method: 'PATCH',
      body: {
        channelCode: normalizeChannelCode(payload.channelCode),
        title: payload.title ?? null,
        description: payload.description ?? null,
        linkUrl: payload.linkUrl ?? null,
        sortOrder: payload.sortOrder ?? null,
        isActive: payload.isActive ?? null
      }
    }
  )
}

export async function reorderBusinessHeroImages(
  profileId: number,
  payload: ReorderBusinessHeroPayload
): Promise<BusinessHeroImage[]> {
  return apiFetch<BusinessHeroImage[]>(
    `${BUSINESS_PROFILE_HERO_BASE}/${profileId}/reorder`,
    {
      method: 'PATCH',
      body: {
        channelCode: normalizeChannelCode(payload.channelCode),
        items: Array.isArray(payload.items)
          ? payload.items.map((item) => ({
              heroId: item.heroId,
              sortOrder: item.sortOrder
            }))
          : []
      }
    }
  )
}

export async function deleteBusinessHeroImage(
  profileId: number,
  heroId: number,
  channelCode: string
): Promise<DeleteBusinessHeroResponse> {
  const queryString = buildHeroListQuery(channelCode)

  return apiFetch<DeleteBusinessHeroResponse>(
    `${BUSINESS_PROFILE_HERO_BASE}/${profileId}/${heroId}?${queryString}`,
    {
      method: 'DELETE'
    }
  )
}
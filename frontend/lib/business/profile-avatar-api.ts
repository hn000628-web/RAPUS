// FILE : frontend/lib/business/profile-avatar-api.ts
// ROOT : frontend/lib/business/profile-avatar-api.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE AVATAR FRONTEND API
// CHANGE SUMMARY :
// - 비지니스 아바타 전용 프론트 API 파일 재정렬
// - 공통 apiFetch 기반으로 avatar read / connect / delete 구성 유지
// - 백엔드 business/profile/avatar 전용 API 계약 반영
// - settings 공용 API와 아바타 write 책임 분리 유지
// - read / connect / delete 를 profileId + channelCode 기준으로 정렬
// - 단일 파일 단일 책임 구조 유지

import { apiFetch } from '@/lib/api'

// SECTION 01 : TYPE

export type BusinessProfileAvatar = {
  id: number
  profileId: number
  channelCode: string | null
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
  isActive?: number | null
  createdAt?: string | null
} | null

export type ConnectBusinessProfileAvatarRequest = {
  channelCode: string
  imageAssetId: number
}

export type ConnectBusinessProfileAvatarResponse = {
  ok: true
  profileId: number
  channelCode: string
  imageAssetId: number
  avatar: BusinessProfileAvatar
}

export type DeleteBusinessProfileAvatarRequest = {
  channelCode: string
}

export type DeleteBusinessProfileAvatarResponse = {
  ok: true
  profileId: number
  channelCode: string
  deletedImageAssetId: number | null
}

// SECTION 02 : BASE

const BUSINESS_PROFILE_AVATAR_BASE =
  '/business/profile/avatar'

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

function normalizeRequiredImageAssetId(
  imageAssetId: number
): number {
  const normalizedImageAssetId = Number(imageAssetId)

  if (
    !Number.isInteger(normalizedImageAssetId) ||
    normalizedImageAssetId <= 0
  ) {
    throw new Error('imageAssetId invalid')
  }

  return normalizedImageAssetId
}

// SECTION 04 : READ

export async function getBusinessProfileAvatar(
  profileId: number,
  channelCode: string
): Promise<BusinessProfileAvatar> {
  const normalizedProfileId =
    normalizeRequiredProfileId(profileId)

  const normalizedChannelCode =
    normalizeRequiredChannelCode(channelCode)

  return apiFetch<BusinessProfileAvatar>(
    `${BUSINESS_PROFILE_AVATAR_BASE}/${normalizedProfileId}?channelCode=${encodeURIComponent(normalizedChannelCode)}`
  )
}

// SECTION 05 : CONNECT

export async function connectBusinessProfileAvatar(
  profileId: number,
  data: ConnectBusinessProfileAvatarRequest
): Promise<ConnectBusinessProfileAvatarResponse> {
  const normalizedProfileId =
    normalizeRequiredProfileId(profileId)

  const normalizedChannelCode =
    normalizeRequiredChannelCode(data.channelCode)

  const normalizedImageAssetId =
    normalizeRequiredImageAssetId(data.imageAssetId)

  return apiFetch<ConnectBusinessProfileAvatarResponse>(
    `${BUSINESS_PROFILE_AVATAR_BASE}/${normalizedProfileId}`,
    {
      method: 'POST',
      body: {
        channelCode: normalizedChannelCode,
        imageAssetId: normalizedImageAssetId
      }
    }
  )
}

// SECTION 06 : DELETE

export async function deleteBusinessProfileAvatar(
  profileId: number,
  data: DeleteBusinessProfileAvatarRequest
): Promise<DeleteBusinessProfileAvatarResponse> {
  const normalizedProfileId =
    normalizeRequiredProfileId(profileId)

  const normalizedChannelCode =
    normalizeRequiredChannelCode(data.channelCode)

  return apiFetch<DeleteBusinessProfileAvatarResponse>(
    `${BUSINESS_PROFILE_AVATAR_BASE}/${normalizedProfileId}`,
    {
      method: 'DELETE',
      body: {
        channelCode: normalizedChannelCode
      }
    }
  )
}
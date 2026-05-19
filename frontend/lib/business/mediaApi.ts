// FILE : frontend/lib/business/mediaApi.ts
// ROOT : frontend/lib/business/mediaApi.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS MEDIA API CLIENT
// CHANGE SUMMARY :
// - BUSINESS media upload 에 isForm: true 유지
// - apiFetch 인증 헤더 유지 + FormData 정상 전송 유지
// - raw fetch 우회 없이 공통 apiFetch 사용 유지
// - media upload 에 channelCode 컨텍스트 전달 구조 추가
// - avatar 전용 helper 를 file + channelCode 계약으로 변경
// - DELETE API 기존 구조 유지

// SECTION 01 : IMPORT

import { apiFetch } from '@/lib/api'

// SECTION 02 : TYPES

export type BusinessMediaUsageType =
  | 'avatar'
  | 'hero'
  | 'post'
  | 'gallery'
  | 'pos-product-thumbnail'

export type UploadBusinessMediaContext = {
  channelCode: string
}

export type UploadBusinessMediaParams = {
  file: File
  usageType: BusinessMediaUsageType
  channelCode: string
  postId?: number
  index?: number
}

export type UploadBusinessMediaResponse = {
  ok: boolean
  assetId: number
  fileName: string
  filePath: string
}

export type DeleteBusinessMediaResponse = {
  ok: boolean
}

// SECTION 03 : CONSTANT

const BUSINESS_MEDIA_BASE = 'business/media'

// SECTION 04 : VALIDATION

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

function normalizeOptionalPositiveInteger(
  value?: number
): number | undefined {
  if (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0
  ) {
    return value
  }

  return undefined
}

// SECTION 05 : API

export async function uploadBusinessMedia(
  params: UploadBusinessMediaParams
): Promise<UploadBusinessMediaResponse> {
  if (!(params.file instanceof File)) {
    throw new Error('file missing')
  }

  const normalizedChannelCode =
    normalizeRequiredChannelCode(params.channelCode)

  const safePostId =
    normalizeOptionalPositiveInteger(params.postId)

  const safeIndex =
    normalizeOptionalPositiveInteger(params.index)

  const formData = new FormData()

  formData.append('file', params.file)
  formData.append('usageType', params.usageType)
  formData.append('channelCode', normalizedChannelCode)

  if (typeof safePostId === 'number') {
    formData.append('postId', String(safePostId))
  }

  if (typeof safeIndex === 'number') {
    formData.append('index', String(safeIndex))
  }

  return apiFetch<UploadBusinessMediaResponse>(
    `${BUSINESS_MEDIA_BASE}/upload`,
    {
      method: 'POST',
      body: formData,
      isForm: true
    }
  )
}

export async function deleteBusinessMedia(
  assetId: number
): Promise<DeleteBusinessMediaResponse> {
  return apiFetch<DeleteBusinessMediaResponse>(
    `${BUSINESS_MEDIA_BASE}/image`,
    {
      method: 'DELETE',
      body: {
        assetId
      }
    }
  )
}

// SECTION 06 : SPECIALIZED HELPERS

export async function uploadBusinessAvatar(
  file: File,
  context: UploadBusinessMediaContext
): Promise<UploadBusinessMediaResponse> {
  return uploadBusinessMedia({
    file,
    usageType: 'avatar',
    channelCode: context.channelCode
  })
}

export async function uploadBusinessHero(
  file: File,
  context: UploadBusinessMediaContext,
  index?: number
): Promise<UploadBusinessMediaResponse> {
  return uploadBusinessMedia({
    file,
    usageType: 'hero',
    channelCode: context.channelCode,
    index
  })
}

export async function uploadBusinessPostImage(
  file: File,
  context: UploadBusinessMediaContext,
  postId?: number,
  index?: number
): Promise<UploadBusinessMediaResponse> {
  return uploadBusinessMedia({
    file,
    usageType: 'post',
    channelCode: context.channelCode,
    postId,
    index
  })
}

export async function uploadBusinessGalleryImage(
  file: File,
  context: UploadBusinessMediaContext
): Promise<UploadBusinessMediaResponse> {
  return uploadBusinessMedia({
    file,
    usageType: 'gallery',
    channelCode: context.channelCode
  })
}

export async function uploadPosProductThumbnail(
  file: File,
  context: UploadBusinessMediaContext
): Promise<UploadBusinessMediaResponse> {
  return uploadBusinessMedia({
    file,
    usageType: 'pos-product-thumbnail',
    channelCode: context.channelCode
  })
}

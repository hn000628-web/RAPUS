// FILE : frontend/lib/business/business-gallery-api.ts
// ROOT : frontend/lib/business/business-gallery-api.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS GALLERY FRONTEND API
// CHANGE SUMMARY :
// - BUSINESS gallery 전용 helper 역할로 재정렬
// - getMe() / BUSINESS 현재 프로필 컨텍스트 추론 제거
// - BUSINESS gallery asset upload helper 유지
// - 단일 귀속 write 기준(channelCode + profileId) validation 유지
// - BUSINESS 사진첩 전용 list / connect / unlink / upload+connect helper 유지
// - 공용 fetch wrapper 반환 계약 기준으로 직접 typed return 구조 유지

// SECTION 01 : IMPORT

import { apiFetch } from '@/lib/api'

// SECTION 02 : TYPE

export type BusinessGalleryItem = {
  galleryId: number
  profileId: number
  channelCode: string | null
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
  fileName: string | null
  mimeType: string | null
  fileSize: number | null
  caption: string | null
  sortOrder: number
  isActive: number | null
  createdAt: string | null
  updatedAt: string | null
}

export type BusinessGalleryListResponse = {
  ok: true
  profileId: number
  channelCode: string
  items: BusinessGalleryItem[]
}

export type ConnectBusinessGalleryParams = {
  profileId: number
  channelCode: string
  imageAssetId: number
  caption?: string | null
}

export type ConnectBusinessGalleryResponse = {
  ok: true
  profileId: number
  channelCode: string
  galleryId: number
  imageAssetId: number
}

export type UnlinkBusinessGalleryParams = {
  profileId: number
  channelCode: string
  galleryId: number
}

export type UnlinkBusinessGalleryResponse = {
  ok: true
  profileId: number
  channelCode: string
  galleryId: number
  imageAssetId: number
}

export type UploadBusinessGalleryAssetContext = {
  profileId: number
  channelCode: string
}

export type UploadBusinessGalleryAssetResponse = {
  ok: true
  profileId: number
  channelCode: string
  assetId: number | null
  fileName: string
  filePath: string
}

export type UploadBusinessGalleryAssetResult = {
  assetId: number
  fileName?: string
  filePath?: string
}

// SECTION 03 : VALIDATION

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

function normalizeRequiredGalleryId(
  galleryId: number
): number {
  const normalizedGalleryId = Number(galleryId)

  if (
    !Number.isInteger(normalizedGalleryId) ||
    normalizedGalleryId <= 0
  ) {
    throw new Error('galleryId invalid')
  }

  return normalizedGalleryId
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

function normalizeUploadContext(
  context: UploadBusinessGalleryAssetContext
): UploadBusinessGalleryAssetContext {
  return {
    profileId: normalizeRequiredProfileId(context.profileId),
    channelCode: normalizeRequiredChannelCode(context.channelCode)
  }
}

// SECTION 04 : GALLERY LIST

export async function getBusinessGalleryByChannelCode(
  channelCode: string
): Promise<BusinessGalleryListResponse> {
  const normalizedChannelCode =
    normalizeRequiredChannelCode(channelCode)

  return apiFetch<BusinessGalleryListResponse>(
    `/business/gallery/${encodeURIComponent(normalizedChannelCode)}`
  )
}

// SECTION 05 : GALLERY CONNECT

export async function connectBusinessGalleryImage(
  params: ConnectBusinessGalleryParams
): Promise<ConnectBusinessGalleryResponse> {
  const profileId =
    normalizeRequiredProfileId(params.profileId)

  const channelCode =
    normalizeRequiredChannelCode(params.channelCode)

  const imageAssetId =
    normalizeRequiredImageAssetId(params.imageAssetId)

  return apiFetch<ConnectBusinessGalleryResponse>(
    '/business/gallery/connect',
    {
      method: 'POST',
      body: {
        profileId,
        channelCode,
        imageAssetId,
        caption: params.caption ?? null
      }
    }
  )
}

// SECTION 06 : GALLERY UNLINK

export async function unlinkBusinessGalleryImage(
  params: UnlinkBusinessGalleryParams
): Promise<UnlinkBusinessGalleryResponse> {
  const profileId =
    normalizeRequiredProfileId(params.profileId)

  const channelCode =
    normalizeRequiredChannelCode(params.channelCode)

  const galleryId =
    normalizeRequiredGalleryId(params.galleryId)

  return apiFetch<UnlinkBusinessGalleryResponse>(
    `/business/gallery/${galleryId}`,
    {
      method: 'DELETE',
      body: {
        profileId,
        channelCode
      }
    }
  )
}

// SECTION 07 : GALLERY UPLOAD

export async function uploadBusinessGalleryAsset(
  file: File,
  context: UploadBusinessGalleryAssetContext
): Promise<UploadBusinessGalleryAssetResult> {
  const normalizedContext =
    normalizeUploadContext(context)

  if (!(file instanceof File)) {
    throw new Error('file missing')
  }

  const formData = new FormData()

  formData.append('file', file)
  formData.append(
    'profileId',
    String(normalizedContext.profileId)
  )
  formData.append(
    'channelCode',
    normalizedContext.channelCode
  )

  const uploaded = await apiFetch<UploadBusinessGalleryAssetResponse>(
    '/business/gallery/upload',
    {
      method: 'POST',
      body: formData,
      isForm: true
    }
  )

  return {
    assetId: normalizeRequiredImageAssetId(
      Number(uploaded.assetId)
    ),
    fileName: uploaded.fileName,
    filePath: uploaded.filePath
  }
}

// SECTION 08 : UPLOAD + CONNECT FLOW HELPER

export type UploadBusinessGalleryAssetFn = (
  file: File,
  context: UploadBusinessGalleryAssetContext
) => Promise<UploadBusinessGalleryAssetResult>

export async function uploadAndConnectBusinessGalleryImage(
  file: File,
  context: UploadBusinessGalleryAssetContext,
  uploadBusinessGalleryAssetFn: UploadBusinessGalleryAssetFn = uploadBusinessGalleryAsset,
  caption?: string | null
): Promise<ConnectBusinessGalleryResponse> {
  const normalizedContext =
    normalizeUploadContext(context)

  const uploaded = await uploadBusinessGalleryAssetFn(
    file,
    normalizedContext
  )

  const assetId =
    normalizeRequiredImageAssetId(uploaded.assetId)

  return connectBusinessGalleryImage({
    profileId: normalizedContext.profileId,
    channelCode: normalizedContext.channelCode,
    imageAssetId: assetId,
    caption: caption ?? null
  })
}
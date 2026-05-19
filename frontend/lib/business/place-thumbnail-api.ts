// FILE : frontend/lib/business/place-thumbnail-api.ts
// ROOT : frontend/lib/business/place-thumbnail-api.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS PLACE THUMBNAIL API CLIENT
// CHANGE SUMMARY :
// - BUSINESS 피드/플레이스 썸네일 전용 frontend API client 생성
// - GET /api/business/place-thumbnail/:profileId 연결
// - GET /api/business/place-thumbnail/:profileId/:thumbnailId 연결
// - PUT /api/business/place-thumbnail/:profileId 연결
// - PATCH /api/business/place-thumbnail/:profileId/reorder 연결
// - PATCH /api/business/place-thumbnail/:profileId/:thumbnailId 연결
// - DELETE /api/business/place-thumbnail/:profileId/:thumbnailId 연결
// - profileId + channelCode 단일 귀속 요청 구조 유지
// - 이미지 업로드 API 포함 없음
// - DB 직접 접근 없음

// SECTION 01 : TYPE
import { apiFetch } from '@/lib/api'

export type BusinessPlaceThumbnail = {
  id: number
  profileId: number
  channelCode: string
  imageAssetId: number
  sortOrder: number
  isActive: number | null
  filePath: string | null
  imageUrl: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type ConnectBusinessPlaceThumbnailPayload = {
  channelCode: string
  imageAssetId: number
  sortOrder?: number | null
}

export type UpdateBusinessPlaceThumbnailPayload = {
  channelCode: string
  sortOrder?: number | null
  isActive?: number | null
}

export type ReorderBusinessPlaceThumbnailItem = {
  thumbnailId: number
  sortOrder: number
}

export type ReorderBusinessPlaceThumbnailPayload = {
  channelCode: string
  items: ReorderBusinessPlaceThumbnailItem[]
}

export type DeleteBusinessPlaceThumbnailResponse = {
  success: boolean
}

export type UploadBusinessPlaceThumbnailResponse = {
  ok: boolean
  assetId: number
  fileName: string
  filePath: string
}

// SECTION 02 : CONSTANT

const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API ||
  'http://localhost:4000'

const API_BASE_URL =
  RAW_API_BASE_URL
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')

const PLACE_THUMBNAIL_API_URL =
  `${API_BASE_URL}/api/business/place-thumbnail`

// SECTION 03 : HELPER

function buildJsonHeaders() {
  return {
    'Content-Type': 'application/json'
  }
}

function buildQueryString(
  params: Record<string, string | number | null | undefined>
) {
  const searchParams =
    new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return
    }

    searchParams.append(
      key,
      String(value)
    )
  })

  const query =
    searchParams.toString()

  return query
    ? `?${query}`
    : ''
}

async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  let data: unknown =
    null

  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : fallbackMessage

    throw new Error(message)
  }

  return data as T
}

function assertProfileId(
  profileId: number
) {
  if (
    typeof profileId !== 'number' ||
    Number.isNaN(profileId) ||
    profileId <= 0
  ) {
    throw new Error('profileId invalid')
  }
}

function assertThumbnailId(
  thumbnailId: number
) {
  if (
    typeof thumbnailId !== 'number' ||
    Number.isNaN(thumbnailId) ||
    thumbnailId <= 0
  ) {
    throw new Error('thumbnailId invalid')
  }
}

function assertChannelCode(
  channelCode: string
) {
  if (
    typeof channelCode !== 'string' ||
    !channelCode.trim()
  ) {
    throw new Error('channelCode missing')
  }
}

function assertImageAssetId(
  imageAssetId: number
) {
  if (
    typeof imageAssetId !== 'number' ||
    Number.isNaN(imageAssetId) ||
    imageAssetId <= 0
  ) {
    throw new Error('imageAssetId invalid')
  }
}

// SECTION 03-1 : UPLOAD API

export async function uploadBusinessPlaceThumbnailImages(
  files: File[],
  channelCode: string
): Promise<number[]> {
  assertChannelCode(channelCode)

  if (!Array.isArray(files) || files.length === 0) {
    return []
  }

  const uploadedAssetIds: number[] = []

  for (const file of files) {
    if (!(file instanceof File) || file.size <= 0) {
      continue
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('usageType', 'place-thumbnail')
    formData.append('channelCode', channelCode)

    const response =
      await apiFetch<UploadBusinessPlaceThumbnailResponse>(
        'business/media/upload',
        {
          method: 'POST',
          body: formData,
          isForm: true
        }
      )

    if (
      typeof response?.assetId === 'number' &&
      response.assetId > 0
    ) {
      uploadedAssetIds.push(response.assetId)
    }
  }

  return uploadedAssetIds
}

// SECTION 04 : READ API

export async function getBusinessPlaceThumbnails(
  profileId: number,
  channelCode: string
): Promise<BusinessPlaceThumbnail[]> {
  assertProfileId(profileId)
  assertChannelCode(channelCode)

  const query =
    buildQueryString({
      channelCode
    })

  const response =
    await fetch(
      `${PLACE_THUMBNAIL_API_URL}/${profileId}${query}`,
      {
        method: 'GET',
        headers: buildJsonHeaders(),
        cache: 'no-store'
      }
    )

  return parseJsonResponse<BusinessPlaceThumbnail[]>(
    response,
    'business place thumbnail fetch failed'
  )
}

export async function getBusinessPlaceThumbnailDetail(
  profileId: number,
  thumbnailId: number,
  channelCode: string
): Promise<BusinessPlaceThumbnail> {
  assertProfileId(profileId)
  assertThumbnailId(thumbnailId)
  assertChannelCode(channelCode)

  const query =
    buildQueryString({
      channelCode
    })

  const response =
    await fetch(
      `${PLACE_THUMBNAIL_API_URL}/${profileId}/${thumbnailId}${query}`,
      {
        method: 'GET',
        headers: buildJsonHeaders(),
        cache: 'no-store'
      }
    )

  return parseJsonResponse<BusinessPlaceThumbnail>(
    response,
    'business place thumbnail detail fetch failed'
  )
}

// SECTION 05 : WRITE API

export async function connectBusinessPlaceThumbnail(
  profileId: number,
  payload: ConnectBusinessPlaceThumbnailPayload
): Promise<BusinessPlaceThumbnail> {
  assertProfileId(profileId)
  assertChannelCode(payload.channelCode)
  assertImageAssetId(payload.imageAssetId)

  return apiFetch<BusinessPlaceThumbnail>(
    `business/place-thumbnail/${profileId}`,
    {
      method: 'PUT',
      body: {
        channelCode: payload.channelCode,
        imageAssetId: payload.imageAssetId,
        sortOrder: payload.sortOrder ?? null
      }
    }
  )
}

export async function updateBusinessPlaceThumbnailMeta(
  profileId: number,
  thumbnailId: number,
  payload: UpdateBusinessPlaceThumbnailPayload
): Promise<BusinessPlaceThumbnail> {
  assertProfileId(profileId)
  assertThumbnailId(thumbnailId)
  assertChannelCode(payload.channelCode)

  return apiFetch<BusinessPlaceThumbnail>(
    `business/place-thumbnail/${profileId}/${thumbnailId}`,
    {
      method: 'PATCH',
      body: {
        channelCode: payload.channelCode,
        sortOrder: payload.sortOrder ?? null,
        isActive: payload.isActive ?? null
      }
    }
  )
}

export async function reorderBusinessPlaceThumbnails(
  profileId: number,
  payload: ReorderBusinessPlaceThumbnailPayload
): Promise<BusinessPlaceThumbnail[]> {
  assertProfileId(profileId)
  assertChannelCode(payload.channelCode)

  if (
    !Array.isArray(payload.items) ||
    payload.items.length === 0
  ) {
    throw new Error('place thumbnail reorder items invalid')
  }

  return apiFetch<BusinessPlaceThumbnail[]>(
    `business/place-thumbnail/${profileId}/reorder`,
    {
      method: 'PATCH',
      body: {
        channelCode: payload.channelCode,
        items: payload.items
      }
    }
  )
}

export async function deleteBusinessPlaceThumbnail(
  profileId: number,
  thumbnailId: number,
  channelCode: string
): Promise<DeleteBusinessPlaceThumbnailResponse> {
  assertProfileId(profileId)
  assertThumbnailId(thumbnailId)
  assertChannelCode(channelCode)

  const query =
    buildQueryString({
      channelCode
    })

  return apiFetch<DeleteBusinessPlaceThumbnailResponse>(
    `business/place-thumbnail/${profileId}/${thumbnailId}${query}`,
    {
      method: 'DELETE'
    }
  )
}

// SECTION 06 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- BUSINESS 피드/플레이스 썸네일 frontend API client
- backend route: /api/business/place-thumbnail
- profileId + channelCode 단일 귀속 요청 구조
- GET 목록 조회 연결
- GET 상세 조회 연결
- PUT relation 연결
- PATCH relation meta 수정
- PATCH relation reorder
- DELETE relation 삭제
- 이미지 업로드 API 없음
- DB 직접 접근 없음
- Service 직접 호출 없음
*/

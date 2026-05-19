// FILE : frontend/lib/business/business-posts-api.ts
// ROOT : frontend/lib/business/business-posts-api.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS POSTS API CLIENT
// CHANGE SUMMARY :
// - 기존 BUSINESS 전용 포스트 생성 API 유지
// - PRODUCT / GENERAL / EVENT 조회용 API 함수 추가
// - GET /api/business/posts?profileId=&channelCode=&postType= 연결 추가
// - 상품 페이지 BusinessProducts.tsx에서 사용할 getBusinessProductPosts() 추가
// - 이미지 대표 경로 imageUrl / filePath 대응 타입 추가
// - 기존 이미지 업로드 / 생성 흐름 유지

'use client'

// SECTION 01 : TYPE

export type BusinessPostType =
  | 'GENERAL'
  | 'PRODUCT'
  | 'EVENT'

export type BusinessPostStatus =
  | 'ACTIVE'
  | 'DRAFT'

export type BusinessPostImageUploadResult = {
  assetId: number
  fileName: string
  filePath: string
}

export type CreateBusinessPostPayload = {
  profileId: number
  channelCode: string
  title: string
  content: string
  postType: BusinessPostType
  regionId?: number | null
  priceAmount?: number | string | null
  eventStartAt?: string | null
  eventEndAt?: string | null
  status: BusinessPostStatus
  imageAssetIds?: number[]
}

export type CreateBusinessPostWithFilesPayload = {
  profileId: number
  channelCode: string
  title: string
  content: string
  postType: BusinessPostType
  regionId?: number | null
  priceAmount?: number | string | null
  price?: number | string | null
  eventStartAt?: string | null
  eventEndAt?: string | null
  status: BusinessPostStatus
  images: File[]
}

export type CreatedBusinessPost = {
  id: number
  profileId: number
  channelCode: string
  postType: BusinessPostType
  title: string
  content: string
  regionId: number | null
  priceAmount: number | null
  eventStartAt: string | null
  eventEndAt: string | null
  status: BusinessPostStatus
  mediaCount: number
}

export type CreateBusinessPostResponse = {
  ok: boolean
  post: CreatedBusinessPost
}

export type BusinessPostImage = {
  id: number
  postId: number
  imageAssetId: number
  filePath: string | null
  imageUrl: string | null
  sortOrder: number
}

export type BusinessPostListItem = {
  id: number
  profileId: number
  channelCode: string
  postType: BusinessPostType
  title: string
  content: string
  regionId: number | null
  priceAmount: number | null
  eventStartAt: string | null
  eventEndAt: string | null
  status: BusinessPostStatus
  mediaCount: number
  industryId?: number | null
  industrySubtypeId?: number | null
  industryCode?: string | null
  industrySubtypeCode?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  images?: BusinessPostImage[]
  imageUrl?: string | null
  thumbnailUrl?: string | null
}

export type GetBusinessPostsPayload = {
  profileId: number
  channelCode: string
  postType?: BusinessPostType
  status?: BusinessPostStatus | 'ACTIVE'
}

export type GetBusinessPostsResponse = {
  ok: boolean
  posts: BusinessPostListItem[]
}

// SECTION 02 : CONSTANT

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API ||
  'http://localhost:4000'

const BUSINESS_MEDIA_UPLOAD_URL =
  `${API_BASE_URL}/api/business/media/upload`

const BUSINESS_POSTS_URL =
  `${API_BASE_URL}/api/business/posts`

// SECTION 03 : TOKEN

function getAccessToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    ''
  )
}

// SECTION 04 : RESPONSE HELPER

async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  let data: unknown = null

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

// SECTION 05 : NORMALIZE HELPER

function normalizePriceAmount(
  value: number | string | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? value
      : null
  }

  const normalized =
    value.replace(/,/g, '').trim()

  if (!normalized) {
    return null
  }

  const amount =
    Number(normalized)

  return Number.isFinite(amount)
    ? amount
    : null
}

function normalizeDateValue(
  value: string | null | undefined
) {
  if (!value) {
    return null
  }

  const trimmed =
    value.trim()

  return trimmed || null
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

// SECTION 06 : UPLOAD BUSINESS POST IMAGE

export async function uploadBusinessPostImage(params: {
  file: File
  channelCode: string
  index: number
}): Promise<BusinessPostImageUploadResult> {
  const token =
    getAccessToken()

  if (!params.file) {
    throw new Error('file required')
  }

  if (!params.channelCode) {
    throw new Error('channelCode required')
  }

  const form =
    new FormData()

  form.append('file', params.file)
  form.append('channelCode', params.channelCode)
  form.append('usageType', 'post')
  form.append('index', String(params.index))

  const response =
    await fetch(BUSINESS_MEDIA_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    })

  return parseJsonResponse<BusinessPostImageUploadResult>(
    response,
    'business post image upload failed'
  )
}

// SECTION 07 : UPLOAD BUSINESS POST IMAGES

export async function uploadBusinessPostImages(params: {
  images: File[]
  channelCode: string
}): Promise<BusinessPostImageUploadResult[]> {
  if (!params.images.length) {
    return []
  }

  const uploaded: BusinessPostImageUploadResult[] = []

  for (let index = 0; index < params.images.length; index += 1) {
    const result =
      await uploadBusinessPostImage({
        file: params.images[index],
        channelCode: params.channelCode,
        index: index + 1
      })

    uploaded.push(result)
  }

  return uploaded
}

// SECTION 08 : CREATE BUSINESS POST

export async function createBusinessPost(
  payload: CreateBusinessPostPayload
): Promise<CreateBusinessPostResponse> {
  const token =
    getAccessToken()

  const body = {
    profileId: payload.profileId,
    channelCode: payload.channelCode,
    title: payload.title,
    content: payload.content,
    postType: payload.postType,
    categoryCode: payload.postType,
    regionId: payload.regionId ?? null,
    priceAmount: normalizePriceAmount(payload.priceAmount),
    eventStartAt: normalizeDateValue(payload.eventStartAt),
    eventEndAt: normalizeDateValue(payload.eventEndAt),
    status: payload.status,
    imageAssetIds: payload.imageAssetIds ?? []
  }

  const response =
    await fetch(BUSINESS_POSTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

  return parseJsonResponse<CreateBusinessPostResponse>(
    response,
    'business post create failed'
  )
}

// SECTION 09 : CREATE BUSINESS POST WITH FILES

export async function createBusinessPostWithFiles(
  payload: CreateBusinessPostWithFilesPayload
): Promise<CreateBusinessPostResponse> {
  const uploadedImages =
    await uploadBusinessPostImages({
      images: payload.images,
      channelCode: payload.channelCode
    })

  const imageAssetIds =
    uploadedImages.map((image) => image.assetId)

  return createBusinessPost({
    profileId: payload.profileId,
    channelCode: payload.channelCode,
    title: payload.title,
    content: payload.content,
    postType: payload.postType,
    regionId: payload.regionId ?? null,
    priceAmount: payload.priceAmount ?? payload.price ?? null,
    eventStartAt: payload.eventStartAt ?? null,
    eventEndAt: payload.eventEndAt ?? null,
    status: payload.status,
    imageAssetIds
  })
}

// SECTION 10 : GET BUSINESS POSTS

export async function getBusinessPosts(
  payload: GetBusinessPostsPayload
): Promise<GetBusinessPostsResponse> {
  const token =
    getAccessToken()

  if (!payload.profileId) {
    throw new Error('profileId required')
  }

  if (!payload.channelCode) {
    throw new Error('channelCode required')
  }

  const query =
    buildQueryString({
      profileId: payload.profileId,
      channelCode: payload.channelCode,
      postType: payload.postType,
      status: payload.status ?? 'ACTIVE'
    })

  const response =
    await fetch(`${BUSINESS_POSTS_URL}${query}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

  return parseJsonResponse<GetBusinessPostsResponse>(
    response,
    'business posts fetch failed'
  )
}

// SECTION 11 : GET BUSINESS PRODUCT POSTS

export async function getBusinessProductPosts(params: {
  profileId: number
  channelCode: string
}): Promise<BusinessPostListItem[]> {
  const response =
    await getBusinessPosts({
      profileId: params.profileId,
      channelCode: params.channelCode,
      postType: 'PRODUCT',
      status: 'ACTIVE'
    })

  return Array.isArray(response.posts)
    ? response.posts
    : []
}

// SECTION 12 : GET BUSINESS EVENT POSTS

export async function getBusinessEventPosts(params: {
  profileId: number
  channelCode: string
}): Promise<BusinessPostListItem[]> {
  const response =
    await getBusinessPosts({
      profileId: params.profileId,
      channelCode: params.channelCode,
      postType: 'EVENT',
      status: 'ACTIVE'
    })

  return Array.isArray(response.posts)
    ? response.posts
    : []
}

// SECTION 13 : GET BUSINESS GENERAL POSTS

export async function getBusinessGeneralPosts(params: {
  profileId: number
  channelCode: string
}): Promise<BusinessPostListItem[]> {
  const response =
    await getBusinessPosts({
      profileId: params.profileId,
      channelCode: params.channelCode,
      postType: 'GENERAL',
      status: 'ACTIVE'
    })

  return Array.isArray(response.posts)
    ? response.posts
    : []
}
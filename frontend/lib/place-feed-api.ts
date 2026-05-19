// FILE : frontend/lib/feed/place-feed-api.ts
// ROOT : frontend/lib/feed/place-feed-api.ts
// STATUS : CREATE MODE
// ROLE : COMMON PLACE FEED API CLIENT
// CHANGE SUMMARY :
// - 로그인 / 비로그인 공통 PLACE 피드 조회 API client 생성
// - GET /api/feed/place 연결
// - regionId / keyword / limit query 지원
// - JWT / getMe 강제 없음
// - 프론트 DB 직접 접근 없음
// - PLACE 카드 UI에서 사용할 타입 정의

// SECTION 01 : TYPE

export type PlaceFeedItem = {
  channelCode: string
  displayName: string
  bio: string
  imageUrl: string | null
  regionName: string | null
  regionFullName: string | null
  industryName: string | null
  industrySubtypeName: string | null
  closedOverlayText: string | null
  matchedProductTitle: string | null
  matchedProductPriceAmount: number | null
  distanceKm: number | null
  distanceLabel: string | null
  adSlotNo: number
  effectiveAdSlotNo: number
  adEndAt: string | null
}

export type GetPlaceFeedPayload = {
  regionId?: number | string | null
  keyword?: string | null
  limit?: number | string | null
  businessStatus?: 'ALL' | 'OPEN' | 'CLOSED' | null
}

export type GetPlaceFeedResponse = {
  ok: boolean
  places: PlaceFeedItem[]
}

// SECTION 02 : CONSTANT

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API ||
  'http://localhost:4000'

const PLACE_FEED_URL =
  `${API_BASE_URL}/api/feed/place`

// SECTION 03 : QUERY HELPER

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

// SECTION 05 : API

export async function getPlaceFeed(
  payload: GetPlaceFeedPayload = {}
): Promise<PlaceFeedItem[]> {
  const query =
    buildQueryString({
      regionId: payload.regionId,
      keyword: payload.keyword,
      limit: payload.limit,
      businessStatus: payload.businessStatus
    })

  const response =
    await fetch(`${PLACE_FEED_URL}${query}`, {
      method: 'GET',
      cache: 'no-store'
    })

  const data =
    await parseJsonResponse<GetPlaceFeedResponse>(
      response,
      'place feed fetch failed'
    )

  return Array.isArray(data.places)
    ? data.places
    : []
}

// SECTION 06 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- 공용 PLACE 피드 API client 생성
- 로그인 / 비로그인 공통 READ API
- GET /api/feed/place 연결
- JWT / getMe 강제 없음
- DB 직접 접근 없음
- regionId / keyword / limit query 지원
- profileId 응답 타입 없음
- channelCode 공개 식별자 사용
*/

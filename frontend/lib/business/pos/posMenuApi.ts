// FILE : frontend/lib/business/posMenuApi.ts
// ROOT : frontend/lib/business/posMenuApi.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS MENU FRONT API
// CHANGE SUMMARY :
// - POS 메뉴 / 상품 등록 화면 전용 Front API 신규 생성
// - /api/business/pos/menu 백엔드 API 연결
// - 메뉴 목록 조회 / 단건 조회 / 생성 / 수정 / 비활성화 함수 제공
// - channelCode + profileId 단일 귀속 요청 구조 적용
// - UI category 값 main/sub/drink/side 를 백엔드 categoryCode MAIN/SUB/DRINK/SIDE 로 변환하는 helper 제공
// - DB 직접 접근 없음
// - Service 직접 접근 없음
// - GENERAL API import 없음

import { apiFetch } from '@/lib/api'

// SECTION 01 : TYPE
export type PosMenuCategoryCode =
  | 'MAIN'
  | 'SUB'
  | 'DRINK'
  | 'SIDE'
  | 'ALCOHOL'
  | 'CUSTOM'

export type PosMenuUiCategory =
  | 'main'
  | 'sub'
  | 'drink'
  | 'side'
  | 'alcohol'
  | ''

export type PosProductKind =
  | 'MAIN_PRODUCT'
  | 'SUB_PRODUCT'

export type PosMenuSaleStatus =
  | 'ON'
  | 'OFF'

export type PosMenuStatus =
  | 'ON_SALE'
  | 'STOPPED'

export type PosMenuOptionValueType =
  | 'BASE'
  | 'CUSTOM'

export type PosMenuOptionValue = {
  id?: number
  optionId?: number
  productCode?: string | null
  optionValueName: string
  priceDelta: number
  isDefault: boolean
  isActive: boolean
  optionValueType?: PosMenuOptionValueType
  isVisible?: boolean | number
  isQuantityEnabled?: boolean | number
  isQuantityLimitEnabled?: boolean | number
  minOptionQuantity?: number | null
  maxOptionQuantity?: number | null
  defaultOptionQuantity?: number | null
  sortOrder?: number
}

export type PosMenuOptionGroup = {
  id?: number
  productCode?: string | null
  optionName: string
  optionType?: 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM'
  isRequired?: boolean | number
  isMultiple?: boolean | number
  minSelectCount?: number
  maxSelectCount?: number
  isActive?: boolean | number
  sortOrder?: number
  values: PosMenuOptionValue[]
}

export type PosMenuThumbnail = {
  imageAssetId: number
  productCode?: string | null
  fileName: string
  filePath: string
  mimeType: string | null
  width: number | null
  height: number | null
}

export type PosMenuItem = {
  id: number
  profileId: number
  channelCode: string
  productCode?: string | null
  productType: 'PRODUCT'
  productKind: PosProductKind
  categoryId: number | null
  categoryCode: PosMenuCategoryCode | string | null
  categoryName: string | null
  productName: string
  productDescription: string | null
  basePrice: number
  currency: string
  isActive: boolean
  isSoldOut: boolean
  isRepresentative?: boolean
  showOnTableOrder?: boolean
  allowNormalOrder?: boolean
  allowReservationOrder?: boolean
  allowDineIn?: boolean
  allowTakeout?: boolean
  allowDelivery?: boolean
  dailySalesLimit?: number | null
  menuStatus?: PosMenuStatus
  saleStatus: PosMenuSaleStatus
  options?: PosMenuOptionGroup[]
  thumbnail?: PosMenuThumbnail | null
  sortOrder: number
  createdAt: string
  updatedAt: string | null
}

export type PosMenuContext = {
  channelCode: string
  profileId: number
}

export type CreatePosMenuInput = PosMenuContext & {
  categoryId?: number | null
  categoryCode?: PosMenuCategoryCode | string | null
  productName: string
  productDescription?: string | null
  basePrice: number
  productKind?: PosProductKind
  saleStatus?: PosMenuSaleStatus
  isActive?: boolean | number
  isSoldOut?: boolean | number
  isRepresentative?: boolean | number
  showOnTableOrder?: boolean | number
  allowNormalOrder?: boolean | number
  allowReservationOrder?: boolean | number
  allowDineIn?: boolean | number
  allowTakeout?: boolean | number
  allowDelivery?: boolean | number
  dailySalesLimit?: number | null
  menuStatus?: PosMenuStatus
  thumbnailImageAssetId?: number | null
  options?: PosMenuOptionGroup[]
  sortOrder?: number
}

export type UpdatePosMenuInput = PosMenuContext & {
  categoryId?: number | null
  categoryCode?: PosMenuCategoryCode | string | null
  productName?: string
  productDescription?: string | null
  basePrice?: number
  productKind?: PosProductKind
  saleStatus?: PosMenuSaleStatus
  isActive?: boolean | number
  isSoldOut?: boolean | number
  isRepresentative?: boolean | number
  showOnTableOrder?: boolean | number
  allowNormalOrder?: boolean | number
  allowReservationOrder?: boolean | number
  allowDineIn?: boolean | number
  allowTakeout?: boolean | number
  allowDelivery?: boolean | number
  dailySalesLimit?: number | null
  menuStatus?: PosMenuStatus
  thumbnailImageAssetId?: number | null
  options?: PosMenuOptionGroup[]
  sortOrder?: number
}

export type PosMenuListResponse = {
  success: boolean
  items: PosMenuItem[]
}

export type PosMenuItemResponse = {
  success: boolean
  item: PosMenuItem
}

export type PosMenuDeleteResponse = {
  success: boolean
  deleted: boolean
}

type ApiErrorResponse = {
  message?: string | string[]
  error?: string
  statusCode?: number
}

// SECTION 02 : CONSTANT
const POS_MENU_API_PATH = 'business/pos/menu'
const POS_MENU_API_FALLBACK_PATH = 'api/business/pos/menu'

// SECTION 03 : REQUEST HELPER
function buildPathWithQuery(
  basePath: string,
  query?: Record<string, string | number | boolean | null | undefined>
): string {
  if (!query) {
    return basePath
  }

  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()
  if (!queryString) {
    return basePath
  }

  return `${basePath}?${queryString}`
}

async function requestWithFallback<TResponse>(
  basePath: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
    query?: Record<string, string | number | boolean | null | undefined>
  }
): Promise<TResponse> {
  const primaryPath = buildPathWithQuery(
    basePath,
    options?.query
  )

  try {
    return await apiFetch<TResponse>(
      primaryPath,
      {
        method: options?.method,
        body: options?.body
      }
    )
  } catch (primaryError) {
    const fallbackPath = buildPathWithQuery(
      basePath.replace('business/pos/menu', POS_MENU_API_FALLBACK_PATH),
      options?.query
    )

    try {
      return await apiFetch<TResponse>(
        fallbackPath,
        {
          method: options?.method,
          body: options?.body
        }
      )
    } catch (fallbackError) {
      console.error(
        '[POS MENU API ERROR]',
        {
          primaryPath,
          fallbackPath,
          primaryError,
          fallbackError
        }
      )
      throw fallbackError
    }
  }
}

// SECTION 05 : MAPPER
export function mapMenuCategoryToCategoryCode(
  category: PosMenuUiCategory
): PosMenuCategoryCode | null {
  if (category === 'main') {
    return 'MAIN'
  }

  if (category === 'sub') {
    return 'SUB'
  }

  if (category === 'drink') {
    return 'DRINK'
  }

  if (category === 'side') {
    return 'SIDE'
  }

  if (category === 'alcohol') {
    return 'ALCOHOL'
  }

  return null
}

export function mapSaleStatusToActiveFlag(
  saleStatus: PosMenuSaleStatus
) {
  return saleStatus === 'ON'
}

// SECTION 06 : READ API
export async function getPosMenus(
  context: PosMenuContext
): Promise<PosMenuListResponse> {
  return requestWithFallback<PosMenuListResponse>(
    POS_MENU_API_PATH,
    {
      query: {
        channelCode: context.channelCode,
        profileId: context.profileId
      }
    }
  )
}

export async function getPosMenuById(
  id: number,
  context: PosMenuContext
): Promise<PosMenuItemResponse> {
  return requestWithFallback<PosMenuItemResponse>(
    `${POS_MENU_API_PATH}/${id}`,
    {
      query: {
        channelCode: context.channelCode,
        profileId: context.profileId
      }
    }
  )
}

// SECTION 07 : WRITE API
export async function createPosMenu(
  payload: CreatePosMenuInput
): Promise<PosMenuItemResponse> {
  return requestWithFallback<PosMenuItemResponse>(
    POS_MENU_API_PATH,
    {
      method: 'POST',
      body: payload
    }
  )
}

export async function updatePosMenu(
  id: number,
  payload: UpdatePosMenuInput
): Promise<PosMenuItemResponse> {
  return requestWithFallback<PosMenuItemResponse>(
    `${POS_MENU_API_PATH}/${id}`,
    {
      method: 'PATCH',
      body: payload
    }
  )
}

export async function deletePosMenu(
  id: number,
  context: PosMenuContext
): Promise<PosMenuDeleteResponse> {
  return requestWithFallback<PosMenuDeleteResponse>(
    `${POS_MENU_API_PATH}/${id}`,
    {
      method: 'DELETE',
      query: {
        channelCode: context.channelCode,
        profileId: context.profileId
      }
    }
  )
}

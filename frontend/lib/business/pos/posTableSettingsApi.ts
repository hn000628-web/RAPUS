// FILE : frontend/lib/business/pos/posTableSettingsApi.ts
// ROOT : frontend/lib/business/pos/posTableSettingsApi.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS POS TABLE SETTINGS FRONT API
// CHANGE SUMMARY :
// - 개별 fetch + 고정 포트 호출 제거
// - 공통 apiFetch 기반 호출 구조로 통일
// - business 경로 단일 호출로 통일
// - POS 테이블 설정 API의 인증/에러 처리 일관성 확보

import { apiFetch } from '@/lib/api'

// SECTION 01 : TYPE

export type PosTableQrStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'

export type PosResourceType =
  | 'TABLE'
  | 'ROOM'
  | 'SPACE'
  | 'SEAT'
  | 'BOOTH'

export type PosTableSettingItem = {
  id: number
  profileId: number
  channelCode: string
  locationType: string
  resourceType?: PosResourceType
  tableName: string
  zoneName: string
  tableOptionName: string
  tableTypeCode?: string
  defaultPrice?: number
  resourceStatus?: string
  tableCode?: string | null
  capacity: number | null
  qrStatus: PosTableQrStatus
  tableOrderUrl?: string | null
  qrCodeValue: string | null
  sortOrder: number
  isActive: number
  createdAt: string
  updatedAt: string | null
}

export type PosTableSettingsResponse = {
  tables: PosTableSettingItem[]
}

export type GetPosTableSettingsParams = {
  profileId: number
  channelCode: string
  resourceType?: PosResourceType | 'ALL'
}

export type CreatePosTableSettingRequest = {
  profileId: number
  channelCode: string
  tableName: string
  zoneName: string
  tableOptionName: string
  tableTypeCode?: string
  resourceType?: PosResourceType
  defaultPrice?: number
  capacity?: number | null
  sortOrder?: number
}

export type UpdatePosTableSettingRequest = {
  profileId: number
  channelCode: string
  tableName?: string
  zoneName?: string
  tableOptionName?: string
  tableTypeCode?: string
  resourceType?: PosResourceType
  defaultPrice?: number
  capacity?: number | null
  sortOrder?: number
  isActive?: number
}

export type DeletePosTableSettingRequest = {
  profileId: number
  channelCode: string
}

export type ConnectPosTableQrRequest = {
  profileId: number
  channelCode: string
  qrCodeValue: string
}

export type DisconnectPosTableQrRequest = {
  profileId: number
  channelCode: string
}

export type UpdatePosTableSortOrderItem = {
  locationId: number
  sortOrder: number
}

export type UpdatePosTableSortOrderRequest = {
  profileId: number
  channelCode: string
  items: UpdatePosTableSortOrderItem[]
}

export type PosTableSuccessResponse = {
  success: true
}

export type PosTableResourceStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'CHECKOUT_PENDING'
  | 'CLEANING'
  | 'CLEAN_DONE'

export type UpdatePosTableResourceStatusRequest = {
  profileId: number
  channelCode: string
  resourceStatus: PosTableResourceStatus
}

export type UpdatePosTableResourceStatusResponse = {
  success: true
  locationId: number
  resourceStatus: PosTableResourceStatus
  lastStatusChangedAt: string | null
}

// SECTION 02 : CONSTANT

const POS_TABLE_SETTINGS_API_PATH =
  'business/pos/table-settings'

// SECTION 03 : URL FUNCTION

function buildQueryString(
  params: Record<string, string | number | null | undefined>
): string {

  const searchParams =
    new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {

    if (value !== undefined && value !== null) {
      searchParams.set(
        key,
        String(value)
      )
    }

  })

  const queryString =
    searchParams.toString()

  return queryString
    ? `?${queryString}`
    : ''

}

// SECTION 04 : REQUEST FUNCTION

async function requestJson<TResponse>(
  path: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    body?: unknown
  }
): Promise<TResponse> {
  return apiFetch<TResponse>(
    path,
    {
      method: options?.method,
      body: options?.body
    }
  )

}

// SECTION 05 : READ API

export async function getPosTableSettings(
  params: GetPosTableSettingsParams
): Promise<PosTableSettingsResponse> {

  const queryString =
    buildQueryString({
      profileId: params.profileId,
      channelCode: params.channelCode,
      resourceType: params.resourceType
    })

  return requestJson<PosTableSettingsResponse>(
    `${POS_TABLE_SETTINGS_API_PATH}${queryString}`,
    {
      method: 'GET'
    }
  )

}

// SECTION 06 : CREATE API

export async function createPosTableSetting(
  payload: CreatePosTableSettingRequest
): Promise<PosTableSettingItem> {

  return requestJson<PosTableSettingItem>(
    POS_TABLE_SETTINGS_API_PATH,
    {
      method: 'POST',
      body: payload
    }
  )

}

// SECTION 07 : UPDATE API

export async function updatePosTableSetting(
  locationId: number,
  payload: UpdatePosTableSettingRequest
): Promise<PosTableSettingItem> {

  return requestJson<PosTableSettingItem>(
    `${POS_TABLE_SETTINGS_API_PATH}/${locationId}`,
    {
      method: 'PATCH',
      body: payload
    }
  )

}

// SECTION 08 : DELETE API

export async function deletePosTableSetting(
  locationId: number,
  payload: DeletePosTableSettingRequest
): Promise<PosTableSuccessResponse> {

  return requestJson<PosTableSuccessResponse>(
    `${POS_TABLE_SETTINGS_API_PATH}/${locationId}`,
    {
      method: 'DELETE',
      body: payload
    }
  )

}

// SECTION 09 : QR API

export async function connectPosTableQr(
  locationId: number,
  payload: ConnectPosTableQrRequest
): Promise<PosTableSettingItem> {

  return requestJson<PosTableSettingItem>(
    `${POS_TABLE_SETTINGS_API_PATH}/${locationId}/qr/connect`,
    {
      method: 'PATCH',
      body: payload
    }
  )

}

export async function disconnectPosTableQr(
  locationId: number,
  payload: DisconnectPosTableQrRequest
): Promise<PosTableSettingItem> {

  return requestJson<PosTableSettingItem>(
    `${POS_TABLE_SETTINGS_API_PATH}/${locationId}/qr/disconnect`,
    {
      method: 'PATCH',
      body: payload
    }
  )

}

// SECTION 10 : SORT API

export async function updatePosTableSortOrder(
  payload: UpdatePosTableSortOrderRequest
): Promise<PosTableSuccessResponse> {

  return requestJson<PosTableSuccessResponse>(
    `${POS_TABLE_SETTINGS_API_PATH}/sort-order`,
    {
      method: 'PATCH',
      body: payload
    }
  )

}

// SECTION 11 : RESOURCE STATUS API

export async function updatePosTableResourceStatus(
  locationId: number,
  payload: UpdatePosTableResourceStatusRequest
): Promise<UpdatePosTableResourceStatusResponse> {

  return requestJson<UpdatePosTableResourceStatusResponse>(
    `${POS_TABLE_SETTINGS_API_PATH}/${locationId}/status`,
    {
      method: 'PATCH',
      body: payload
    }
  )

}

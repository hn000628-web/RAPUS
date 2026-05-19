// FILE : frontend/lib/business/business-type-api.ts
// ROOT : frontend/lib/business/business-type-api.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS TYPE API
// CHANGE SUMMARY :
// - business_types 마스터 조회 API 추가
// - profiles.businessTypeCode BUSINESS 전용 저장 API 추가
// - STORE / FREELANCER / MOBILE_BIZ 타입 고정
// - GENERAL 영향 없음

'use client'

import { apiFetch } from '@/lib/api'

// SECTION 01 : TYPE

export type BusinessTypeCode =
  | 'STORE'
  | 'FREELANCER'
  | 'MOBILE_BIZ'

export type BusinessTypeItem = {
  id: number
  code: BusinessTypeCode
  name: string
  description: string | null
  sortOrder: number
}

export type BusinessTypesResponse = {
  items: BusinessTypeItem[]
}

export type UpdateBusinessTypePayload = {
  profileId: number
  channelCode: string
  businessTypeCode: BusinessTypeCode
}

// SECTION 02 : GET BUSINESS TYPES

export async function getBusinessTypes(): Promise<BusinessTypesResponse> {
  const response =
    await apiFetch<{
      ok: true
      items: Array<{
        businessTypeId: number
        businessTypeCode: BusinessTypeCode
        businessTypeName: string
        description: string | null
        sortOrder: number
      }>
    }>('/business/industry/business-types')

  return {
    items: response.items.map((item) => ({
      id: item.businessTypeId,
      code: item.businessTypeCode,
      name: item.businessTypeName,
      description: item.description,
      sortOrder: item.sortOrder
    }))
  }
}

// SECTION 03 : UPDATE BUSINESS TYPE

export async function updateBusinessType(
  payload: UpdateBusinessTypePayload
): Promise<void> {
  await apiFetch('/business/industry/business-type', {
    method: 'PATCH',
    body: {
      profileId: payload.profileId,
      channelCode: payload.channelCode,
      businessTypeCode: payload.businessTypeCode
    }
  })
}

// FILE : frontend/lib/business/pos/posOrderTypesApi.ts
// ROOT : frontend/lib/business/pos/posOrderTypesApi.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS POS ORDER TYPES FRONT API

import { apiFetch } from '@/lib/api'

export type PosOrderTypeCode =
  | 'TABLE'
  | 'RESERVATION'
  | 'DELIVERY'
  | 'PICKUP'
  | 'QR_ORDER'
  | 'KIOSK'

export type PosOrderTypeItem = {
  code: PosOrderTypeCode
  defaultTitle: string
  customTitle: string
  displayTitle: string
  description: string
  isEnabled: boolean
  sortOrder: number
}

export type PosOrderTypesResponse = {
  items: PosOrderTypeItem[]
}

export type SavePosOrderTypeInput = {
  code: PosOrderTypeCode
  customTitle?: string | null
  isEnabled?: boolean
  sortOrder?: number
}

export type SavePosOrderTypesRequest = {
  items: SavePosOrderTypeInput[]
}

export type PosOrderTypesContext = {
  profileId: number
  channelCode: string
}

const POS_ORDER_TYPES_BASE = 'business/pos/order-types'

const ORDER_TYPE_CODES: PosOrderTypeCode[] = [
  'TABLE',
  'RESERVATION',
  'DELIVERY',
  'PICKUP',
  'QR_ORDER',
  'KIOSK'
]

function validateContext(
  context: PosOrderTypesContext
) {
  if (!Number.isInteger(context.profileId) || context.profileId <= 0) {
    throw new Error('valid profileId is required')
  }

  const channelCode = String(context.channelCode || '').trim()
  if (!channelCode) {
    throw new Error('valid channelCode is required')
  }
}

function validateOrderTypeCode(code: PosOrderTypeCode) {
  if (!ORDER_TYPE_CODES.includes(code)) {
    throw new Error(`invalid order type code: ${code}`)
  }
}

function validateSavePayload(payload: SavePosOrderTypesRequest) {
  if (!payload || !Array.isArray(payload.items)) {
    throw new Error('items array is required')
  }

  for (const item of payload.items) {
    validateOrderTypeCode(item.code)

    if (typeof item.customTitle === 'string' && item.customTitle.trim().length > 24) {
      throw new Error('customTitle max length is 24')
    }

    if (
      typeof item.sortOrder !== 'undefined' &&
      (!Number.isInteger(item.sortOrder) || item.sortOrder < 0)
    ) {
      throw new Error('sortOrder must be a positive integer')
    }
  }
}

function buildEndpoint(
  context: PosOrderTypesContext
) {
  const params = new URLSearchParams()
  params.set('profileId', String(context.profileId))
  params.set('channelCode', String(context.channelCode || '').trim())

  return `${POS_ORDER_TYPES_BASE}?${params.toString()}`
}

export async function getPosOrderTypes(
  context: PosOrderTypesContext
): Promise<PosOrderTypesResponse> {
  validateContext(context)
  return apiFetch<PosOrderTypesResponse>(buildEndpoint(context))
}

export async function savePosOrderTypes(
  context: PosOrderTypesContext,
  payload: SavePosOrderTypesRequest
): Promise<PosOrderTypesResponse> {
  validateContext(context)
  validateSavePayload(payload)

  return apiFetch<PosOrderTypesResponse>(
    buildEndpoint(context),
    {
      method: 'PATCH',
      body: payload
    }
  )
}


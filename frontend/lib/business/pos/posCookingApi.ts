// FILE : frontend/lib/business/pos/posCookingApi.ts
// ROOT : frontend/lib/business/pos/posCookingApi.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS COOKING FRONT API
// CHANGE SUMMARY :
// - POS 조리현황 runtime API 프론트 전용 파일 생성
// - GET/PATCH/POST cooking endpoint 연동
// - /pos/cooking UI 매핑용 타입/헬퍼 제공

import { apiFetch } from '@/lib/api'

// SECTION 01 : TYPE
export type PosCookingStatus =
  | 'WAITING'
  | 'COOKING'
  | 'DONE'
  | 'CANCELED'

export type PosCookingPriorityLevel =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT'

export type PosCookingTicketDto = {
  id: number
  profileId: number
  channelCode: string
  orderId: number
  orderCode: string
  orderItemId: number
  locationId: number | null
  locationNameSnapshot: string | null
  productNameSnapshot: string
  quantity: number
  optionSummarySnapshot: string | null
  requestMemoSnapshot: string | null
  cookingStatus: PosCookingStatus
  priorityLevel: PosCookingPriorityLevel
  cookStaffCode: string | null
  cookStaffNameSnapshot: string | null
  orderedAt: string | null
  cookingStartedAt: string | null
  cookingCompletedAt: string | null
  elapsedMinutes: number | null
  isActive: number
  createdAt: string
  updatedAt: string | null
}

export type PosCookingTicketListResponse = {
  tickets: PosCookingTicketDto[]
}

export type GetPosCookingTicketsParams = {
  profileId: number
  channelCode: string
  cookingStatus?: PosCookingStatus | 'ALL'
  isActive?: 0 | 1
}

export type UpdateCookingStatusRequest = {
  profileId: number
  channelCode: string
  cookingStatus: PosCookingStatus
  cookStaffCode?: string | null
  cookStaffNameSnapshot?: string | null
}

export type CreateCookingTicketRequest = {
  profileId: number
  channelCode: string
  orderId: number
  orderCode: string
  orderItemId: number
  locationId?: number | null
  locationNameSnapshot?: string | null
  productNameSnapshot: string
  quantity: number
  optionSummarySnapshot?: string | null
  requestMemoSnapshot?: string | null
  priorityLevel?: PosCookingPriorityLevel
  cookStaffCode?: string | null
  cookStaffNameSnapshot?: string | null
  orderedAt?: string | null
}

export type PosCookingUiItem = {
  id: number
  orderLabel: string
  menuName: string
  quantity: number
  optionText: string
  requestText: string
  orderedAt: string | null
  cookingStartedAt: string | null
  cookingCompletedAt: string | null
  elapsedMinutes: number | null
  status: PosCookingStatus
}

// SECTION 02 : CONSTANT
const POS_COOKING_API_PATH =
  'business/pos/cooking'

// SECTION 03 : URL FUNCTION
function buildQueryString(
  params: Record<string, string | number | null | undefined>
): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()

  return queryString.length > 0
    ? `?${queryString}`
    : ''
}

// SECTION 04 : REQUEST FUNCTION
async function requestJson<TResponse>(
  path: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH'
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

// SECTION 05 : NORMALIZE / MAP
export function normalizeCookingStatus(
  value: string | null | undefined
): PosCookingStatus {
  const normalized =
    String(value ?? '').trim().toUpperCase()

  if (
    normalized === 'WAITING' ||
    normalized === 'COOKING' ||
    normalized === 'DONE' ||
    normalized === 'CANCELED'
  ) {
    return normalized
  }

  return 'WAITING'
}

export function mapCookingTicketDto(
  ticket: PosCookingTicketDto
): PosCookingUiItem {
  return {
    id: ticket.id,
    orderLabel: ticket.orderCode,
    menuName: ticket.productNameSnapshot,
    quantity: Number(ticket.quantity ?? 0),
    optionText: String(ticket.optionSummarySnapshot ?? '').trim(),
    requestText: String(ticket.requestMemoSnapshot ?? '').trim(),
    orderedAt: ticket.orderedAt ?? null,
    cookingStartedAt: ticket.cookingStartedAt ?? null,
    cookingCompletedAt: ticket.cookingCompletedAt ?? null,
    elapsedMinutes:
      typeof ticket.elapsedMinutes === 'number'
        ? ticket.elapsedMinutes
        : null,
    status: normalizeCookingStatus(ticket.cookingStatus)
  }
}

// SECTION 06 : READ API
export async function getPosCookingTickets(
  params: GetPosCookingTicketsParams
): Promise<PosCookingTicketListResponse> {
  const queryString =
    buildQueryString({
      profileId: params.profileId,
      channelCode: params.channelCode,
      cookingStatus: params.cookingStatus,
      isActive: params.isActive
    })

  return requestJson<PosCookingTicketListResponse>(
    `${POS_COOKING_API_PATH}/tickets${queryString}`,
    {
      method: 'GET'
    }
  )
}

// SECTION 07 : UPDATE API
export async function updatePosCookingStatus(
  ticketId: number,
  payload: UpdateCookingStatusRequest
): Promise<PosCookingTicketDto> {
  return requestJson<PosCookingTicketDto>(
    `${POS_COOKING_API_PATH}/tickets/${ticketId}/status`,
    {
      method: 'PATCH',
      body: payload
    }
  )
}

// SECTION 08 : CREATE API
export async function createPosCookingTicket(
  payload: CreateCookingTicketRequest
): Promise<PosCookingTicketDto> {
  return requestJson<PosCookingTicketDto>(
    `${POS_COOKING_API_PATH}/tickets`,
    {
      method: 'POST',
      body: payload
    }
  )
}

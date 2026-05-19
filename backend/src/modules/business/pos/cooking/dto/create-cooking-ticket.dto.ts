// FILE : backend/src/modules/business/pos/cooking/dto/create-cooking-ticket.dto.ts
// ROOT : backend/src/modules/business/pos/cooking/dto/create-cooking-ticket.dto.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS COOKING CREATE DTO

import {
  CookingPriorityLevel
} from './cooking-query.dto'

export class CreateCookingTicketDto {
  profileId!: number
  channelCode!: string
  orderId!: number
  orderCode!: string
  orderItemId!: number
  locationId?: number | null
  locationNameSnapshot?: string | null
  productNameSnapshot!: string
  quantity!: number
  optionSummarySnapshot?: string | null
  requestMemoSnapshot?: string | null
  priorityLevel?: CookingPriorityLevel
  cookStaffCode?: string | null
  cookStaffNameSnapshot?: string | null
  orderedAt?: string | null
}

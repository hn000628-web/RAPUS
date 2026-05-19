// FILE : backend/src/modules/business/pos/cooking/dto/update-cooking-status.dto.ts
// ROOT : backend/src/modules/business/pos/cooking/dto/update-cooking-status.dto.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS COOKING STATUS UPDATE DTO

import {
  CookingStatus
} from './cooking-query.dto'

export class UpdateCookingStatusDto {
  profileId!: number
  channelCode!: string
  cookingStatus!: CookingStatus
  cookStaffCode?: string | null
  cookStaffNameSnapshot?: string | null
}

// FILE : backend/src/modules/business/pos/cooking/dto/cooking-query.dto.ts
// ROOT : backend/src/modules/business/pos/cooking/dto/cooking-query.dto.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS COOKING QUERY DTO

export type CookingStatus =
  | 'WAITING'
  | 'COOKING'
  | 'DONE'
  | 'CANCELED'

export type CookingPriorityLevel =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT'

export class CookingQueryDto {
  profileId!: number | string
  channelCode!: string
  cookingStatus?: CookingStatus | 'ALL'
  isActive?: number | string
}

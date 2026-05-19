export type RoomUseType = 'STAY' | 'SHORT_STAY'
export type CheckInInputType = 'QR' | 'PHOTO' | 'MANUAL' | 'NONE'

export class CheckInRoomDto {
  readonly profileId!: number
  readonly channelCode!: string

  readonly useType!: RoomUseType
  readonly inputType!: CheckInInputType

  readonly guestName?: string | null
  readonly guestPhone?: string | null
  readonly vehicleNumber?: string | null
  readonly guestCount?: number | null
  readonly memo?: string | null
  readonly qrReferenceCode?: string | null

  readonly expectedCheckOutAt?: string | null
  readonly basePriceSnapshot?: number | null
  readonly baseUsageMinutes?: number | null
}

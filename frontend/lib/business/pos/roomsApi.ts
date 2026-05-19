import { apiFetch } from '@/lib/api'

export type RoomUseType =
  | 'STAY'
  | 'SHORT_STAY'

export type RoomCheckInInputType =
  | 'QR'
  | 'PHOTO'
  | 'MANUAL'
  | 'NONE'

export type RoomCheckInStatus =
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'

export type RoomResourceStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_USE'
  | 'WAITING'
  | 'CHECKIN_READY'
  | 'CHECKOUT_PENDING'
  | 'CLEANING'
  | 'CLEAN_DONE'
  | 'MAINTENANCE'
  | 'DISABLED'

export type CurrentRoomCheckIn = {
  id: number
  useType: RoomUseType
  inputType: RoomCheckInInputType
  guestName: string | null
  guestPhone: string | null
  vehicleNumber: string | null
  guestCount: number | null
  memo: string | null
  checkedInAt: string
  expectedCheckOutAt: string | null
  basePriceSnapshot: number
  extensionAmountSnapshot: number
  discountAmountSnapshot: number
}

export type GetCurrentRoomCheckInResponse = {
  locationId: number
  roomName: string
  resourceStatus: RoomResourceStatus
  currentUseType: RoomUseType | null
  currentCheckInId: number | null
  currentCheckInAt: string | null
  expectedCheckOutAt: string | null
  baseUsageMinutes: number | null
  currentCheckIn: CurrentRoomCheckIn | null
}

export type CheckInRoomRequest = {
  profileId: number
  channelCode: string
  useType: RoomUseType
  inputType: RoomCheckInInputType
  guestName?: string | null
  guestPhone?: string | null
  vehicleNumber?: string | null
  guestCount?: number | null
  memo?: string | null
  qrReferenceCode?: string | null
  expectedCheckOutAt?: string | null
  basePriceSnapshot?: number | null
  baseUsageMinutes?: number | null
}

export type CheckInRoomResponse = {
  checkInId: number
  locationId: number
  useType: RoomUseType
  inputType: RoomCheckInInputType
  resourceStatus: RoomResourceStatus
  checkedInAt: string
  expectedCheckOutAt: string | null
  currentUseType: RoomUseType
}

export type CheckOutRoomRequest = {
  profileId: number
  channelCode: string
  memo?: string | null
}

export type CheckOutRoomResponse = {
  checkInId: number
  locationId: number
  checkInStatus: RoomCheckInStatus
  resourceStatus: RoomResourceStatus
  checkedOutAt: string
}

export type CompleteRoomCleaningRequest = {
  profileId: number
  channelCode: string
}

export type CompleteRoomCleaningResponse = {
  locationId: number
  resourceStatus: RoomResourceStatus
  currentUseType: RoomUseType | null
  currentCheckInId: number | null
  updatedAt?: string | null
}

export type GetCurrentRoomCheckInParams = {
  locationId: number
  profileId: number
  channelCode: string
}

export type PosRoomResource = {
  id: number
  locationId: number
  roomNo: string
  tableCode?: string | null
  locationName: string
  locationType: 'ROOM'
  tableTypeCode: string | null
  tableOptionName: string | null
  defaultPrice: number
  resourceStatus: RoomResourceStatus
  currentUseType: RoomUseType | null
  currentCheckInId: number | null
  currentCheckInAt: string | null
  expectedCheckOutAt: string | null
  baseUsageMinutes: number | null
  sortOrder: number
}

export type GetPosRoomsParams = {
  profileId: number
  channelCode: string
}

export type GetPosRoomsResponse = {
  rooms: PosRoomResource[]
}

const POS_ROOMS_API_BASE = 'business/pos'

export async function getPosRooms(
  params: GetPosRoomsParams
): Promise<GetPosRoomsResponse> {
  const query = new URLSearchParams({
    profileId: String(params.profileId),
    channelCode: params.channelCode
  })

  const response = await apiFetch<GetPosRoomsResponse | PosRoomResource[]>(
    `${POS_ROOMS_API_BASE}/rooms?${query.toString()}`,
    {
      method: 'GET'
    }
  )

  const rooms = Array.isArray(response)
    ? response
    : Array.isArray(response?.rooms)
      ? response.rooms
      : []

  return {
    rooms: rooms
      .map((room) => {
        const id = Number(room?.id)
        const locationId = Number(room?.locationId ?? room?.id)
        if (!Number.isFinite(id) || !Number.isFinite(locationId)) {
          return null
        }

        const locationName = String(room?.locationName ?? room?.roomNo ?? room?.tableCode ?? '').trim()
        const roomNo = String(room?.roomNo ?? room?.locationName ?? '').trim()

        return {
          ...room,
          id,
          locationId,
          locationName,
          roomNo
        } as PosRoomResource
      })
      .filter((room): room is PosRoomResource => room !== null)
  }
}

export async function getCurrentRoomCheckIn(
  params: GetCurrentRoomCheckInParams
): Promise<GetCurrentRoomCheckInResponse> {
  const query = new URLSearchParams({
    profileId: String(params.profileId),
    channelCode: params.channelCode
  })

  return apiFetch<GetCurrentRoomCheckInResponse>(
    `${POS_ROOMS_API_BASE}/rooms/${params.locationId}/check-in/current?${query.toString()}`,
    {
      method: 'GET'
    }
  )
}

export async function checkInRoom(
  locationId: number,
  body: CheckInRoomRequest
): Promise<CheckInRoomResponse> {
  return apiFetch<CheckInRoomResponse>(
    `${POS_ROOMS_API_BASE}/rooms/${locationId}/check-in`,
    {
      method: 'POST',
      body
    }
  )
}

export async function checkOutRoom(
  checkInId: number,
  body: CheckOutRoomRequest
): Promise<CheckOutRoomResponse> {
  return apiFetch<CheckOutRoomResponse>(
    `${POS_ROOMS_API_BASE}/rooms/check-ins/${checkInId}/check-out`,
    {
      method: 'PATCH',
      body
    }
  )
}

export async function completeRoomCleaning(
  locationId: number,
  body: CompleteRoomCleaningRequest
): Promise<CompleteRoomCleaningResponse> {
  return apiFetch<CompleteRoomCleaningResponse>(
    `${POS_ROOMS_API_BASE}/rooms/${locationId}/cleaning/complete`,
    {
      method: 'PATCH',
      body
    }
  )
}

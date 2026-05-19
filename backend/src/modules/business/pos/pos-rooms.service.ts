import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'

import db from '../../../config/database'

import {
  CheckInInputType,
  CheckInRoomDto,
  RoomUseType
} from './dto/check-in-room.dto'
import { CheckOutRoomDto } from './dto/check-out-room.dto'
import { CompleteRoomCleaningDto } from './dto/complete-room-cleaning.dto'

type RoomLocationRow = {
  id: number
  profileId: number
  channelCode: string
  locationType: string
  locationName: string
  tableTypeCode: string | null
  tableOptionName: string | null
  resourceStatus: string
  currentUseType: RoomUseType | null
  currentCheckInId: number | null
  currentCheckInAt: string | null
  expectedCheckOutAt: string | null
  baseUsageMinutes: number | null
  isActive: number
  deletedAt: string | null
}

type RoomListRow = {
  id: number
  locationName: string
  locationType: string
  tableTypeCode: string | null
  tableOptionName: string | null
  defaultPrice: number | null
  resourceStatus: string
  currentUseType: RoomUseType | null
  currentCheckInId: number | null
  currentCheckInAt: string | null
  expectedCheckOutAt: string | null
  baseUsageMinutes: number | null
  sortOrder: number
}

type RoomCheckInRow = {
  id: number
  locationId: number
  useType: RoomUseType
  inputType: CheckInInputType
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
  checkInStatus: 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
}

export type CurrentRoomCheckInResponse = {
  locationId: number
  roomName: string
  resourceStatus: string
  currentUseType: RoomUseType | null
  currentCheckInId: number | null
  currentCheckInAt: string | null
  expectedCheckOutAt: string | null
  baseUsageMinutes: number | null
  currentCheckIn: null | {
    id: number
    useType: RoomUseType
    inputType: CheckInInputType
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
}

export type CreateRoomCheckInResponse = {
  checkInId: number
  locationId: number
  useType: RoomUseType
  inputType: CheckInInputType
  resourceStatus: 'IN_USE'
  checkedInAt: string
  expectedCheckOutAt: string | null
  currentUseType: RoomUseType
}

export type CheckOutRoomResponse = {
  checkInId: number
  locationId: number
  checkInStatus: 'CHECKED_OUT'
  resourceStatus: 'CLEANING'
  checkedOutAt: string
}

export type CompleteRoomCleaningResponse = {
  locationId: number
  resourceStatus: 'AVAILABLE'
  currentUseType: null
  currentCheckInId: null
  updatedAt: string | null
}

export type PosRoomResource = {
  id: number
  locationId: number
  roomNo: string
  locationName: string
  locationType: 'ROOM'
  tableTypeCode: string | null
  tableOptionName: string | null
  defaultPrice: number
  resourceStatus: string
  currentUseType: RoomUseType | null
  currentCheckInId: number | null
  currentCheckInAt: string | null
  expectedCheckOutAt: string | null
  baseUsageMinutes: number | null
  sortOrder: number
}

export type GetPosRoomsResponse = {
  rooms: PosRoomResource[]
}

@Injectable()
export class PosRoomsService {
  getRooms(
    profileId: number,
    channelCode: string
  ): GetPosRoomsResponse {
    const profile = this.assertProfileContext(profileId, channelCode)

    const rows = db.prepare(`
      SELECT
        id,
        locationName,
        locationType,
        tableTypeCode,
        tableOptionName,
        defaultPrice,
        resourceStatus,
        currentUseType,
        currentCheckInId,
        currentCheckInAt,
        expectedCheckOutAt,
        baseUsageMinutes,
        sortOrder
      FROM pos_locations
      WHERE profileId = ?
        AND channelCode = ?
        AND locationType = 'ROOM'
        AND isActive = 1
        AND deletedAt IS NULL
      ORDER BY sortOrder ASC, id ASC
    `).all(profile.id, profile.channelCode) as RoomListRow[]

    return {
      rooms: rows.map((row) => ({
        id: row.id,
        locationId: row.id,
        roomNo: row.locationName,
        locationName: row.locationName,
        locationType: 'ROOM',
        tableTypeCode: row.tableTypeCode,
        tableOptionName: row.tableOptionName,
        defaultPrice: Number(row.defaultPrice ?? 0),
        resourceStatus: row.resourceStatus,
        currentUseType: row.currentUseType,
        currentCheckInId: row.currentCheckInId,
        currentCheckInAt: row.currentCheckInAt,
        expectedCheckOutAt: row.expectedCheckOutAt,
        baseUsageMinutes: row.baseUsageMinutes,
        sortOrder: row.sortOrder
      }))
    }
  }

  getCurrentCheckIn(
    locationId: number,
    profileId: number,
    channelCode: string
  ): CurrentRoomCheckInResponse {
    this.assertProfileContext(profileId, channelCode)
    const room = this.findOwnedRoomOrFail(locationId, profileId, channelCode)

    const currentCheckIn = db.prepare(`
      SELECT
        id,
        locationId,
        useType,
        inputType,
        guestName,
        guestPhone,
        vehicleNumber,
        guestCount,
        memo,
        checkedInAt,
        expectedCheckOutAt,
        basePriceSnapshot,
        extensionAmountSnapshot,
        discountAmountSnapshot,
        checkInStatus
      FROM pos_room_checkins
      WHERE profileId = ?
        AND channelCode = ?
        AND locationId = ?
        AND checkInStatus = 'CHECKED_IN'
      ORDER BY checkedInAt DESC, id DESC
      LIMIT 1
    `).get(profileId, channelCode, locationId) as RoomCheckInRow | undefined

    return {
      locationId: room.id,
      roomName: room.locationName,
      resourceStatus: room.resourceStatus,
      currentUseType: room.currentUseType,
      currentCheckInId: room.currentCheckInId,
      currentCheckInAt: room.currentCheckInAt,
      expectedCheckOutAt: room.expectedCheckOutAt,
      baseUsageMinutes: room.baseUsageMinutes,
      currentCheckIn: currentCheckIn
        ? {
            id: currentCheckIn.id,
            useType: currentCheckIn.useType,
            inputType: currentCheckIn.inputType,
            guestName: currentCheckIn.guestName,
            guestPhone: currentCheckIn.guestPhone,
            vehicleNumber: currentCheckIn.vehicleNumber,
            guestCount: currentCheckIn.guestCount,
            memo: currentCheckIn.memo,
            checkedInAt: currentCheckIn.checkedInAt,
            expectedCheckOutAt: currentCheckIn.expectedCheckOutAt,
            basePriceSnapshot: currentCheckIn.basePriceSnapshot,
            extensionAmountSnapshot: currentCheckIn.extensionAmountSnapshot,
            discountAmountSnapshot: currentCheckIn.discountAmountSnapshot
          }
        : null
    }
  }

  createCheckIn(
    locationId: number,
    input: CheckInRoomDto
  ): CreateRoomCheckInResponse {
    const profile = this.assertProfileContext(input.profileId, input.channelCode)
    const room = this.findOwnedRoomOrFail(locationId, profile.id, profile.channelCode)

    const useType = this.normalizeUseType(input.useType)
    const inputType = this.normalizeInputType(input.inputType)
    const guestCount = this.normalizeNullableNonNegativeInteger(input.guestCount, 'guestCount')
    const basePriceSnapshot = this.normalizeNullableNonNegativeInteger(input.basePriceSnapshot, 'basePriceSnapshot') ?? 0
    const baseUsageMinutes = this.normalizeNullableNonNegativeInteger(input.baseUsageMinutes, 'baseUsageMinutes')
    const expectedCheckOutAt = this.normalizeNullableText(input.expectedCheckOutAt)

    const activeCheckIn = db.prepare(`
      SELECT id
      FROM pos_room_checkins
      WHERE profileId = ?
        AND channelCode = ?
        AND locationId = ?
        AND checkInStatus = 'CHECKED_IN'
      LIMIT 1
    `).get(profile.id, profile.channelCode, locationId) as { id?: number } | undefined

    if (activeCheckIn?.id) {
      throw new BadRequestException('room already checked in')
    }

    const tx = db.transaction(() => {
      const insertResult = db.prepare(`
        INSERT INTO pos_room_checkins(
          profileId,
          channelCode,
          locationId,
          roomNameSnapshot,
          roomTypeSnapshot,
          useType,
          inputType,
          guestName,
          guestPhone,
          vehicleNumber,
          guestCount,
          memo,
          qrReferenceCode,
          checkInStatus,
          checkedInAt,
          expectedCheckOutAt,
          basePriceSnapshot,
          extensionAmountSnapshot,
          discountAmountSnapshot,
          createdAt,
          updatedAt
        )
        VALUES(
          ?,?,?,?,?,?,?,?,?,?,?,?,?,
          'CHECKED_IN',
          CURRENT_TIMESTAMP,
          ?,
          ?,
          0,
          0,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `).run(
        profile.id,
        profile.channelCode,
        room.id,
        room.locationName,
        room.tableTypeCode || room.tableOptionName,
        useType,
        inputType,
        this.normalizeNullableText(input.guestName),
        this.normalizeNullableText(input.guestPhone),
        this.normalizeNullableText(input.vehicleNumber),
        guestCount,
        this.normalizeNullableText(input.memo),
        this.normalizeNullableText(input.qrReferenceCode),
        expectedCheckOutAt,
        basePriceSnapshot
      )

      const checkInId = Number(insertResult.lastInsertRowid)

      db.prepare(`
        UPDATE pos_locations
        SET
          resourceStatus = 'IN_USE',
          currentUseType = ?,
          currentCheckInId = ?,
          currentCheckInAt = CURRENT_TIMESTAMP,
          expectedCheckOutAt = ?,
          baseUsageMinutes = ?,
          lastStatusChangedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND profileId = ?
          AND channelCode = ?
          AND locationType = 'ROOM'
          AND isActive = 1
          AND deletedAt IS NULL
      `).run(
        useType,
        checkInId,
        expectedCheckOutAt,
        baseUsageMinutes,
        room.id,
        profile.id,
        profile.channelCode
      )

      const inserted = db.prepare(`
        SELECT
          id,
          checkedInAt,
          expectedCheckOutAt,
          useType,
          inputType
        FROM pos_room_checkins
        WHERE id = ?
      `).get(checkInId) as {
        id: number
        checkedInAt: string
        expectedCheckOutAt: string | null
        useType: RoomUseType
        inputType: CheckInInputType
      }

      return {
        checkInId: inserted.id,
        checkedInAt: inserted.checkedInAt,
        expectedCheckOutAt: inserted.expectedCheckOutAt,
        useType: inserted.useType,
        inputType: inserted.inputType
      }
    })

    const result = tx()

    return {
      checkInId: result.checkInId,
      locationId: room.id,
      useType: result.useType,
      inputType: result.inputType,
      resourceStatus: 'IN_USE',
      checkedInAt: result.checkedInAt,
      expectedCheckOutAt: result.expectedCheckOutAt,
      currentUseType: result.useType
    }
  }

  checkOut(
    checkInId: number,
    input: CheckOutRoomDto
  ): CheckOutRoomResponse {
    this.normalizePositiveInteger(checkInId, 'checkInId')
    const profile = this.assertProfileContext(input.profileId, input.channelCode)

    const targetCheckIn = db.prepare(`
      SELECT
        id,
        locationId,
        memo,
        checkInStatus
      FROM pos_room_checkins
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
      LIMIT 1
    `).get(checkInId, profile.id, profile.channelCode) as {
      id: number
      locationId: number
      memo: string | null
      checkInStatus: 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
    } | undefined

    if (!targetCheckIn) {
      throw new NotFoundException('check-in not found')
    }

    if (targetCheckIn.checkInStatus !== 'CHECKED_IN') {
      throw new BadRequestException('check-in is not active')
    }

    const nextMemo = this.buildCheckOutMemo(targetCheckIn.memo, input.memo)

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE pos_room_checkins
        SET
          checkInStatus = 'CHECKED_OUT',
          checkedOutAt = CURRENT_TIMESTAMP,
          memo = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND profileId = ?
          AND channelCode = ?
          AND checkInStatus = 'CHECKED_IN'
      `).run(
        nextMemo,
        checkInId,
        profile.id,
        profile.channelCode
      )

      db.prepare(`
        UPDATE pos_locations
        SET
          resourceStatus = 'CLEANING',
          currentUseType = NULL,
          currentCheckInId = NULL,
          currentCheckInAt = NULL,
          expectedCheckOutAt = NULL,
          baseUsageMinutes = NULL,
          lastStatusChangedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND profileId = ?
          AND channelCode = ?
      `).run(
        targetCheckIn.locationId,
        profile.id,
        profile.channelCode
      )

      db.prepare(`
        UPDATE pos_room_order_sessions
        SET
          status = 'CLOSED',
          closedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE profileId = ?
          AND channelCode = ?
          AND checkInId = ?
          AND status = 'ACTIVE'
      `).run(
        profile.id,
        profile.channelCode,
        checkInId
      )

      const checkedOutRow = db.prepare(`
        SELECT checkedOutAt
        FROM pos_room_checkins
        WHERE id = ?
      `).get(checkInId) as { checkedOutAt: string }

      return checkedOutRow.checkedOutAt
    })

    const checkedOutAt = tx()

    return {
      checkInId,
      locationId: targetCheckIn.locationId,
      checkInStatus: 'CHECKED_OUT',
      resourceStatus: 'CLEANING',
      checkedOutAt
    }
  }

  completeCleaning(
    locationId: number,
    input: CompleteRoomCleaningDto
  ): CompleteRoomCleaningResponse {
    const profile = this.assertProfileContext(input.profileId, input.channelCode)
    const room = this.findOwnedRoomOrFail(locationId, profile.id, profile.channelCode)

    if (room.currentCheckInId !== null && room.currentCheckInId !== undefined) {
      throw new BadRequestException('room is currently checked in')
    }

    if (room.resourceStatus !== 'CLEANING' && room.resourceStatus !== 'CLEAN_DONE') {
      throw new BadRequestException('room is not cleaning status')
    }

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE pos_locations
        SET
          resourceStatus = 'AVAILABLE',
          currentUseType = NULL,
          currentCheckInId = NULL,
          currentCheckInAt = NULL,
          expectedCheckOutAt = NULL,
          baseUsageMinutes = NULL,
          lastStatusChangedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND profileId = ?
          AND channelCode = ?
          AND locationType = 'ROOM'
          AND isActive = 1
          AND deletedAt IS NULL
      `).run(
        room.id,
        profile.id,
        profile.channelCode
      )

      const updatedRow = db.prepare(`
        SELECT updatedAt
        FROM pos_locations
        WHERE id = ?
      `).get(room.id) as { updatedAt: string | null } | undefined

      return updatedRow?.updatedAt ?? null
    })

    const updatedAt = tx()

    return {
      locationId: room.id,
      resourceStatus: 'AVAILABLE',
      currentUseType: null,
      currentCheckInId: null,
      updatedAt
    }
  }

  private assertProfileContext(
    profileId: number,
    channelCode: string
  ): { id: number; channelCode: string } {
    this.normalizePositiveInteger(profileId, 'profileId')

    if (typeof channelCode !== 'string' || !channelCode.trim()) {
      throw new BadRequestException('channelCode is required')
    }

    const profileById = db.prepare(`
      SELECT id, channelCode, profileType
      FROM profiles
      WHERE id = ?
      LIMIT 1
    `).get(profileId) as { id: number; channelCode: string; profileType: string } | undefined

    if (!profileById) {
      throw new NotFoundException('profile not found')
    }

    if (profileById.profileType !== 'BUSINESS') {
      throw new ForbiddenException('profile/channel mismatch')
    }

    if (profileById.channelCode !== channelCode.trim()) {
      throw new ForbiddenException('profile/channel mismatch')
    }

    return {
      id: profileById.id,
      channelCode: profileById.channelCode
    }
  }

  private findOwnedRoomOrFail(
    locationId: number,
    profileId: number,
    channelCode: string
  ): RoomLocationRow {
    this.normalizePositiveInteger(locationId, 'locationId')

    const row = db.prepare(`
      SELECT
        id,
        profileId,
        channelCode,
        locationType,
        locationName,
        tableTypeCode,
        tableOptionName,
        resourceStatus,
        currentUseType,
        currentCheckInId,
        currentCheckInAt,
        expectedCheckOutAt,
        baseUsageMinutes,
        isActive,
        deletedAt
      FROM pos_locations
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
      LIMIT 1
    `).get(locationId, profileId, channelCode) as RoomLocationRow | undefined

    if (!row) {
      throw new NotFoundException('room not found')
    }

    if (row.locationType !== 'ROOM') {
      throw new BadRequestException('room is not ROOM type')
    }

    if (row.isActive !== 1 || row.deletedAt !== null) {
      throw new BadRequestException('room not found')
    }

    return row
  }

  private normalizeUseType(value: string): RoomUseType {
    if (value !== 'STAY' && value !== 'SHORT_STAY') {
      throw new BadRequestException('invalid useType')
    }
    return value
  }

  private normalizeInputType(value: string): CheckInInputType {
    if (value !== 'QR' && value !== 'PHOTO' && value !== 'MANUAL' && value !== 'NONE') {
      throw new BadRequestException('invalid inputType')
    }
    return value
  }

  private normalizePositiveInteger(value: number, field: string): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} must be positive integer`)
    }
    return value
  }

  private normalizeNullableNonNegativeInteger(
    value: number | null | undefined,
    fieldName: string
  ): number | null {
    if (value === undefined || value === null) {
      return null
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException(`invalid ${fieldName}`)
    }

    return value
  }

  private normalizeNullableText(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
      return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  private buildCheckOutMemo(
    prevMemo: string | null,
    checkOutMemo: string | null | undefined
  ): string | null {
    const nextCheckOutMemo = this.normalizeNullableText(checkOutMemo)

    if (!nextCheckOutMemo) {
      return prevMemo
    }

    if (!prevMemo || !prevMemo.trim()) {
      return `[CHECK_OUT] ${nextCheckOutMemo}`
    }

    return `${prevMemo}\n[CHECK_OUT] ${nextCheckOutMemo}`
  }
}

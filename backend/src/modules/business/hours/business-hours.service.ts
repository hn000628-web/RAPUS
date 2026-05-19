// FILE: backend/src/modules/business/hours/business-hours.service.ts
// ROOT: backend/src/modules/business/hours/business-hours.service.ts
// STATUS: PRODUCTION READY
// ROLE: BUSINESS HOURS SERVICE (1 PROFILE = 1 ROW)
// CHANGE SUMMARY:
// - business_hours 테이블 기준 영업시간 조회/저장
// - 메뉴 API 구조와 동일한 패턴 적용
// - BUSINESS 프로필 인증/검증 포함
// - GET / PATCH 대응
// - temporaryClosed 포함

import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'

import Database from 'better-sqlite3'

/* ==================================================
SECTION 01 : TYPE
================================================== */

type JwtUser = {
  sub?: number
  profileId?: number
  profileType?: 'GENERAL' | 'BUSINESS'
}

type BusinessProfileRow = {
  id: number
  channelCode: string
}

export type BusinessHoursDayKeyShort =
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat'
  | 'sun'

export type BusinessHoursRow = {
  profileId: number
  channelCode: string
  isActive?: number

  mon_isActive?: number
  mon_isClosed: number
  mon_startTime: string
  mon_endTime: string

  tue_isActive?: number
  tue_isClosed: number
  tue_startTime: string
  tue_endTime: string

  wed_isActive?: number
  wed_isClosed: number
  wed_startTime: string
  wed_endTime: string

  thu_isActive?: number
  thu_isClosed: number
  thu_startTime: string
  thu_endTime: string

  fri_isActive?: number
  fri_isClosed: number
  fri_startTime: string
  fri_endTime: string

  sat_isActive?: number
  sat_isClosed: number
  sat_startTime: string
  sat_endTime: string

  sun_isActive?: number
  sun_isClosed: number
  sun_startTime: string
  sun_endTime: string

  temporaryClosed: number
  alwaysOpen: number

  createdAt?: string | null
  updatedAt?: string | null
}

export type SaveBusinessHoursPayload = {
  mon_isClosed?: boolean | number
  mon_startTime?: string
  mon_endTime?: string

  tue_isClosed?: boolean | number
  tue_startTime?: string
  tue_endTime?: string

  wed_isClosed?: boolean | number
  wed_startTime?: string
  wed_endTime?: string

  thu_isClosed?: boolean | number
  thu_startTime?: string
  thu_endTime?: string

  fri_isClosed?: boolean | number
  fri_startTime?: string
  fri_endTime?: string

  sat_isClosed?: boolean | number
  sat_startTime?: string
  sat_endTime?: string

  sun_isClosed?: boolean | number
  sun_startTime?: string
  sun_endTime?: string

  temporaryClosed?: boolean | number
  alwaysOpen?: boolean | number
}

export type UpdateBusinessHoursPayload = {
  isActive?: 0 | 1
  temporaryClosed?: 0 | 1
  alwaysOpen?: 0 | 1
  day?: BusinessHoursDayKeyShort
}

/* ==================================================
SECTION 02 : SERVICE
================================================== */

@Injectable()
export class BusinessHoursService {

  private readonly db: Database.Database

  constructor() {
    this.db = new Database('data/prod.sqlite')
  }

  /* ==================================================
  SECTION 03 : PROFILE RESOLVER
  ================================================== */

  private getBusinessProfile(user: JwtUser): BusinessProfileRow {

    if (!user?.profileId) {
      throw new UnauthorizedException('PROFILE_REQUIRED')
    }

    if (user.profileType !== 'BUSINESS') {
      throw new UnauthorizedException('BUSINESS_PROFILE_REQUIRED')
    }

    const profile = this.db.prepare(`
      SELECT
        id,
        channelCode
      FROM profiles
      WHERE id = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(user.profileId) as BusinessProfileRow | undefined

    if (!profile) {
      throw new UnauthorizedException('PROFILE_NOT_FOUND')
    }

    return profile
  }

  private getBusinessProfileByIdentity(
    profileId: number,
    channelCode: string
  ): BusinessProfileRow {
    if (!profileId || !channelCode?.trim()) {
      throw new BadRequestException('PROFILE_IDENTITY_REQUIRED')
    }

    const profile = this.db.prepare(`
      SELECT
        id,
        channelCode
      FROM profiles
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId, channelCode.trim()) as BusinessProfileRow | undefined

    if (!profile) {
      throw new UnauthorizedException('PROFILE_NOT_FOUND')
    }

    return profile
  }

  /* ==================================================
  SECTION 04 : HELPER
  ================================================== */

  private normalizeFlag(value: boolean | number | undefined, fallback = 0): number {
    if (value === undefined || value === null) return fallback
    return value ? 1 : 0
  }

  private normalizeTime(value: string | undefined, isClosed: number): string {
    if (isClosed === 1) return ''
    return String(value || '').trim()
  }

  private validateDayRange(
    dayLabel: string,
    isClosed: number,
    startTime: string,
    endTime: string
  ): void {

    if (isClosed === 1) {
      return
    }

    if (!startTime) {
      throw new BadRequestException(`${dayLabel}_START_REQUIRED`)
    }

    if (!endTime) {
      throw new BadRequestException(`${dayLabel}_END_REQUIRED`)
    }

    if (startTime >= endTime) {
      throw new BadRequestException(`${dayLabel}_TIME_RANGE_INVALID`)
    }
  }

  private mapRow(row: BusinessHoursRow | undefined, profile: BusinessProfileRow) {
    const nowIsOpen =
      this.calculateIsOpenNow(row)

    if (!row) {
      return {
        ok: true,
        isOpenNow: false,
        hours: {
          profileId: profile.id,
          channelCode: profile.channelCode,

          mon_isClosed: true,
          mon_startTime: '',
          mon_endTime: '',

          tue_isClosed: true,
          tue_startTime: '',
          tue_endTime: '',

          wed_isClosed: true,
          wed_startTime: '',
          wed_endTime: '',

          thu_isClosed: true,
          thu_startTime: '',
          thu_endTime: '',

          fri_isClosed: true,
          fri_startTime: '',
          fri_endTime: '',

          sat_isClosed: true,
          sat_startTime: '',
          sat_endTime: '',

          sun_isClosed: true,
          sun_startTime: '',
          sun_endTime: '',

          temporaryClosed: false,
          alwaysOpen: false
        }
      }
    }

    return {
      ok: true,
      isOpenNow: nowIsOpen,
      hours: {
        profileId: row.profileId,
        channelCode: row.channelCode,

        mon_isClosed: row.mon_isClosed === 1,
        mon_startTime: row.mon_startTime || '',
        mon_endTime: row.mon_endTime || '',

        tue_isClosed: row.tue_isClosed === 1,
        tue_startTime: row.tue_startTime || '',
        tue_endTime: row.tue_endTime || '',

        wed_isClosed: row.wed_isClosed === 1,
        wed_startTime: row.wed_startTime || '',
        wed_endTime: row.wed_endTime || '',

        thu_isClosed: row.thu_isClosed === 1,
        thu_startTime: row.thu_startTime || '',
        thu_endTime: row.thu_endTime || '',

        fri_isClosed: row.fri_isClosed === 1,
        fri_startTime: row.fri_startTime || '',
        fri_endTime: row.fri_endTime || '',

        sat_isClosed: row.sat_isClosed === 1,
        sat_startTime: row.sat_startTime || '',
        sat_endTime: row.sat_endTime || '',

        sun_isClosed: row.sun_isClosed === 1,
        sun_startTime: row.sun_startTime || '',
        sun_endTime: row.sun_endTime || '',

        temporaryClosed: row.temporaryClosed === 1,
        alwaysOpen: row.alwaysOpen === 1
      }
    }
  }

  private calculateIsOpenNow(row?: BusinessHoursRow): boolean {
    if (!row) {
      return false
    }

    if (row.temporaryClosed === 1) {
      return false
    }

    if ((row.isActive ?? 1) !== 1) {
      return false
    }

    if (row.alwaysOpen === 1) {
      return true
    }

    const dayKeys: BusinessHoursDayKeyShort[] = [
      'sun',
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat'
    ]

    const currentDay = dayKeys[new Date().getDay()]
    const dayActive = row[`${currentDay}_isActive` as keyof BusinessHoursRow]
    const dayClosed = row[`${currentDay}_isClosed` as keyof BusinessHoursRow]
    const startTime = row[`${currentDay}_startTime` as keyof BusinessHoursRow]
    const endTime = row[`${currentDay}_endTime` as keyof BusinessHoursRow]

    if (Number(dayActive ?? 1) !== 1) {
      return false
    }

    if (Number(dayClosed ?? 1) === 1) {
      return false
    }

    const normalizedStart = String(startTime ?? '').trim()
    const normalizedEnd = String(endTime ?? '').trim()

    if (!normalizedStart || !normalizedEnd) {
      return false
    }

    const now = new Date()
    const nowMinute = (now.getHours() * 60) + now.getMinutes()

    const [startHour, startMinute] = normalizedStart.split(':').map(Number)
    const [endHour, endMinute] = normalizedEnd.split(':').map(Number)

    if (
      Number.isNaN(startHour) ||
      Number.isNaN(startMinute) ||
      Number.isNaN(endHour) ||
      Number.isNaN(endMinute)
    ) {
      return false
    }

    const startTotal = (startHour * 60) + startMinute
    const endTotal = (endHour * 60) + endMinute

    return nowMinute >= startTotal && nowMinute < endTotal
  }

  private ensureBusinessHoursRow(profile: BusinessProfileRow): void {
    const exists = this.db.prepare(`
      SELECT
        profileId,
        channelCode
      FROM business_hours
      WHERE profileId = ?
      LIMIT 1
    `).get(profile.id) as { profileId: number; channelCode: string } | undefined

    if (exists) {
      if (exists.channelCode !== profile.channelCode) {
        this.db.prepare(`
          UPDATE business_hours
          SET
            channelCode = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE profileId = ?
        `).run(profile.channelCode, profile.id)
      }
      return
    }

    this.db.prepare(`
      INSERT INTO business_hours(
        profileId,
        channelCode,
        isActive,
        mon_isActive, mon_isClosed, mon_startTime, mon_endTime,
        tue_isActive, tue_isClosed, tue_startTime, tue_endTime,
        wed_isActive, wed_isClosed, wed_startTime, wed_endTime,
        thu_isActive, thu_isClosed, thu_startTime, thu_endTime,
        fri_isActive, fri_isClosed, fri_startTime, fri_endTime,
        sat_isActive, sat_isClosed, sat_startTime, sat_endTime,
        sun_isActive, sun_isClosed, sun_startTime, sun_endTime,
        temporaryClosed,
        alwaysOpen
      )
      VALUES(
        ?, ?,
        1,
        1, 1, '', '',
        1, 1, '', '',
        1, 1, '', '',
        1, 1, '', '',
        1, 1, '', '',
        1, 1, '', '',
        1, 1, '', '',
        0,
        0
      )
    `).run(profile.id, profile.channelCode)
  }

  private getHoursRowByIdentity(
    profileId: number,
    channelCode: string
  ): BusinessHoursRow {
    const row = this.db.prepare(`
      SELECT
        profileId,
        channelCode,
        isActive,
        mon_isActive, mon_isClosed, mon_startTime, mon_endTime,
        tue_isActive, tue_isClosed, tue_startTime, tue_endTime,
        wed_isActive, wed_isClosed, wed_startTime, wed_endTime,
        thu_isActive, thu_isClosed, thu_startTime, thu_endTime,
        fri_isActive, fri_isClosed, fri_startTime, fri_endTime,
        sat_isActive, sat_isClosed, sat_startTime, sat_endTime,
        sun_isActive, sun_isClosed, sun_startTime, sun_endTime,
        temporaryClosed,
        alwaysOpen,
        createdAt,
        updatedAt
      FROM business_hours
      WHERE profileId = ?
        AND channelCode = ?
      LIMIT 1
    `).get(profileId, channelCode) as BusinessHoursRow | undefined

    if (!row) {
      throw new BadRequestException('BUSINESS_HOURS_NOT_FOUND')
    }

    return row
  }

  /* ==================================================
  SECTION 05 : GET HOURS
  ================================================== */

  async getHours(user: JwtUser) {

    const profile = this.getBusinessProfile(user)

    const row = this.db.prepare(`
      SELECT
        profileId,
        channelCode,
        isActive,
        mon_isActive,

        mon_isClosed,
        mon_startTime,
        mon_endTime,

        tue_isActive,
        tue_isClosed,
        tue_startTime,
        tue_endTime,

        wed_isActive,
        wed_isClosed,
        wed_startTime,
        wed_endTime,

        thu_isActive,
        thu_isClosed,
        thu_startTime,
        thu_endTime,

        fri_isActive,
        fri_isClosed,
        fri_startTime,
        fri_endTime,

        sat_isActive,
        sat_isClosed,
        sat_startTime,
        sat_endTime,

        sun_isActive,
        sun_isClosed,
        sun_startTime,
        sun_endTime,

        temporaryClosed,
        alwaysOpen,
        createdAt,
        updatedAt
      FROM business_hours
      WHERE profileId = ?
        AND channelCode = ?
      LIMIT 1
    `).get(profile.id, profile.channelCode) as BusinessHoursRow | undefined

    return this.mapRow(row, profile)
  }

  /* ==================================================
  SECTION 06 : SAVE HOURS
  ================================================== */

  async saveHours(user: JwtUser, payload: SaveBusinessHoursPayload) {

    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('INVALID_HOURS_PAYLOAD')
    }

    const profile = this.getBusinessProfile(user)
    this.ensureBusinessHoursRow(profile)

    const mon_isClosed = this.normalizeFlag(payload.mon_isClosed, 0)
    const tue_isClosed = this.normalizeFlag(payload.tue_isClosed, 0)
    const wed_isClosed = this.normalizeFlag(payload.wed_isClosed, 0)
    const thu_isClosed = this.normalizeFlag(payload.thu_isClosed, 0)
    const fri_isClosed = this.normalizeFlag(payload.fri_isClosed, 0)
    const sat_isClosed = this.normalizeFlag(payload.sat_isClosed, 0)
    const sun_isClosed = this.normalizeFlag(payload.sun_isClosed, 1)

    const mon_startTime = this.normalizeTime(payload.mon_startTime, mon_isClosed)
    const mon_endTime = this.normalizeTime(payload.mon_endTime, mon_isClosed)

    const tue_startTime = this.normalizeTime(payload.tue_startTime, tue_isClosed)
    const tue_endTime = this.normalizeTime(payload.tue_endTime, tue_isClosed)

    const wed_startTime = this.normalizeTime(payload.wed_startTime, wed_isClosed)
    const wed_endTime = this.normalizeTime(payload.wed_endTime, wed_isClosed)

    const thu_startTime = this.normalizeTime(payload.thu_startTime, thu_isClosed)
    const thu_endTime = this.normalizeTime(payload.thu_endTime, thu_isClosed)

    const fri_startTime = this.normalizeTime(payload.fri_startTime, fri_isClosed)
    const fri_endTime = this.normalizeTime(payload.fri_endTime, fri_isClosed)

    const sat_startTime = this.normalizeTime(payload.sat_startTime, sat_isClosed)
    const sat_endTime = this.normalizeTime(payload.sat_endTime, sat_isClosed)

    const sun_startTime = this.normalizeTime(payload.sun_startTime, sun_isClosed)
    const sun_endTime = this.normalizeTime(payload.sun_endTime, sun_isClosed)

    const temporaryClosed = this.normalizeFlag(payload.temporaryClosed, 0)
    const alwaysOpen = this.normalizeFlag(payload.alwaysOpen, 0)

    if (alwaysOpen !== 1) {
      this.validateDayRange('MON', mon_isClosed, mon_startTime, mon_endTime)
      this.validateDayRange('TUE', tue_isClosed, tue_startTime, tue_endTime)
      this.validateDayRange('WED', wed_isClosed, wed_startTime, wed_endTime)
      this.validateDayRange('THU', thu_isClosed, thu_startTime, thu_endTime)
      this.validateDayRange('FRI', fri_isClosed, fri_startTime, fri_endTime)
      this.validateDayRange('SAT', sat_isClosed, sat_startTime, sat_endTime)
      this.validateDayRange('SUN', sun_isClosed, sun_startTime, sun_endTime)
    }

    const tx = this.db.transaction(() => {

      const exists = this.db.prepare(`
        SELECT profileId
        FROM business_hours
        WHERE profileId = ?
        LIMIT 1
      `).get(profile.id)

      if (exists) {
        this.db.prepare(`
          UPDATE business_hours
          SET
            channelCode = ?,

            mon_isClosed = ?,
            mon_startTime = ?,
            mon_endTime = ?,

            tue_isClosed = ?,
            tue_startTime = ?,
            tue_endTime = ?,

            wed_isClosed = ?,
            wed_startTime = ?,
            wed_endTime = ?,

            thu_isClosed = ?,
            thu_startTime = ?,
            thu_endTime = ?,

            fri_isClosed = ?,
            fri_startTime = ?,
            fri_endTime = ?,

            sat_isClosed = ?,
            sat_startTime = ?,
            sat_endTime = ?,

            sun_isClosed = ?,
            sun_startTime = ?,
            sun_endTime = ?,

            temporaryClosed = ?,
            alwaysOpen = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE profileId = ?
            AND channelCode = ?
        `).run(
          profile.channelCode,

          mon_isClosed,
          mon_startTime,
          mon_endTime,

          tue_isClosed,
          tue_startTime,
          tue_endTime,

          wed_isClosed,
          wed_startTime,
          wed_endTime,

          thu_isClosed,
          thu_startTime,
          thu_endTime,

          fri_isClosed,
          fri_startTime,
          fri_endTime,

          sat_isClosed,
          sat_startTime,
          sat_endTime,

          sun_isClosed,
          sun_startTime,
          sun_endTime,

          temporaryClosed,
          alwaysOpen,
          profile.id,
          profile.channelCode
        )
      } else {
        this.db.prepare(`
          INSERT INTO business_hours(
            profileId,
            channelCode,

            mon_isClosed,
            mon_startTime,
            mon_endTime,

            tue_isClosed,
            tue_startTime,
            tue_endTime,

            wed_isClosed,
            wed_startTime,
            wed_endTime,

            thu_isClosed,
            thu_startTime,
            thu_endTime,

            fri_isClosed,
            fri_startTime,
            fri_endTime,

            sat_isClosed,
            sat_startTime,
            sat_endTime,

            sun_isClosed,
            sun_startTime,
            sun_endTime,

            temporaryClosed,
            alwaysOpen
          )
          VALUES(
            ?,?,
            ?,?,?,
            ?,?,?,
            ?,?,?,
            ?,?,?,
            ?,?,?,
            ?,?,?,
            ?,?,?,
            ?,?
          )
        `).run(
          profile.id,
          profile.channelCode,

          mon_isClosed,
          mon_startTime,
          mon_endTime,

          tue_isClosed,
          tue_startTime,
          tue_endTime,

          wed_isClosed,
          wed_startTime,
          wed_endTime,

          thu_isClosed,
          thu_startTime,
          thu_endTime,

          fri_isClosed,
          fri_startTime,
          fri_endTime,

          sat_isClosed,
          sat_startTime,
          sat_endTime,

          sun_isClosed,
          sun_startTime,
          sun_endTime,

          temporaryClosed,
          alwaysOpen
        )
      }
    })

    tx()

    return this.getHours(user)
  }

  /* ==================================================
  SECTION 07 : PATCH BUSINESS HOURS STATUS
  ================================================== */

  async updateBusinessHours(
    profileId: number,
    channelCode: string,
    updates: UpdateBusinessHoursPayload
  ) {
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new BadRequestException('INVALID_HOURS_UPDATE_PAYLOAD')
    }

    const profile = this.getBusinessProfileByIdentity(profileId, channelCode)
    this.ensureBusinessHoursRow(profile)

    const setParts: string[] = []
    const params: Array<number | string> = []

    if (updates.isActive !== undefined) {
      if (updates.isActive !== 0 && updates.isActive !== 1) {
        throw new BadRequestException('INVALID_IS_ACTIVE')
      }
      setParts.push('isActive = ?')
      params.push(updates.isActive)
    }

    if (updates.temporaryClosed !== undefined) {
      if (updates.temporaryClosed !== 0 && updates.temporaryClosed !== 1) {
        throw new BadRequestException('INVALID_TEMPORARY_CLOSED')
      }
      setParts.push('temporaryClosed = ?')
      params.push(updates.temporaryClosed)
    }

    if (updates.alwaysOpen !== undefined) {
      if (updates.alwaysOpen !== 0 && updates.alwaysOpen !== 1) {
        throw new BadRequestException('INVALID_ALWAYS_OPEN')
      }
      setParts.push('alwaysOpen = ?')
      params.push(updates.alwaysOpen)
    }

    if (updates.day !== undefined) {
      const allowedDays: BusinessHoursDayKeyShort[] = [
        'mon',
        'tue',
        'wed',
        'thu',
        'fri',
        'sat',
        'sun'
      ]

      if (!allowedDays.includes(updates.day)) {
        throw new BadRequestException('INVALID_DAY')
      }

      if (updates.isActive === undefined) {
        throw new BadRequestException('DAY_UPDATE_REQUIRES_IS_ACTIVE')
      }

      setParts.push(`${updates.day}_isActive = ?`)
      params.push(updates.isActive)
    }

    if (setParts.length === 0) {
      throw new BadRequestException('EMPTY_UPDATE_PAYLOAD')
    }

    setParts.push('updatedAt = CURRENT_TIMESTAMP')

    const sql = `
      UPDATE business_hours
      SET ${setParts.join(', ')}
      WHERE profileId = ?
        AND channelCode = ?
    `

    this.db.prepare(sql).run(
      ...params,
      profile.id,
      profile.channelCode
    )

    const row = this.getHoursRowByIdentity(profile.id, profile.channelCode)
    return {
      ok: true,
      isOpenNow: this.calculateIsOpenNow(row),
      hours: row
    }
  }

  async getBusinessHours(
    profileId: number,
    channelCode: string
  ) {
    const profile = this.getBusinessProfileByIdentity(profileId, channelCode)
    this.ensureBusinessHoursRow(profile)
    const row = this.getHoursRowByIdentity(profile.id, profile.channelCode)

    return {
      ok: true,
      isOpenNow: this.calculateIsOpenNow(row),
      hours: row
    }
  }
}

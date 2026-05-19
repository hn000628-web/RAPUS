// FILE : frontend/lib/business/business-hours-api.ts
// ROOT : frontend/lib/business/business-hours-api.ts
// STATUS : PRODUCTION READY
// ROLE : BUSINESS HOURS API
// CHANGE SUMMARY :
// - 영업시간 설정 조회 API 추가
// - 영업시간 설정 저장 API 추가
// - backend /api/business/hours GET / PATCH 연동
// - 1프로필 1행 business_hours 구조 기준
// - 프론트 hours/page.tsx 에서 바로 사용 가능

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import { apiFetch } from '@/lib/api'

/* ==================================================
SECTION 02 : TYPES
================================================== */

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type BusinessHour = {
  isClosed: boolean
  startTime: string
  endTime: string
}

export type BusinessHoursState = Record<DayKey, BusinessHour>

export type BusinessHoursApiRow = {
  profileId: number
  channelCode: string
  isActive?: boolean | number

  mon_isActive?: boolean | number

  mon_isClosed: boolean
  mon_startTime: string
  mon_endTime: string

  tue_isActive?: boolean | number
  tue_isClosed: boolean
  tue_startTime: string
  tue_endTime: string

  wed_isActive?: boolean | number
  wed_isClosed: boolean
  wed_startTime: string
  wed_endTime: string

  thu_isActive?: boolean | number
  thu_isClosed: boolean
  thu_startTime: string
  thu_endTime: string

  fri_isActive?: boolean | number
  fri_isClosed: boolean
  fri_startTime: string
  fri_endTime: string

  sat_isActive?: boolean | number
  sat_isClosed: boolean
  sat_startTime: string
  sat_endTime: string

  sun_isActive?: boolean | number
  sun_isClosed: boolean
  sun_startTime: string
  sun_endTime: string

  temporaryClosed: boolean
  alwaysOpen?: boolean | number
}

export type BusinessHoursResponse = {
  ok: boolean
  hours: BusinessHoursApiRow
  isOpenNow?: boolean
}

/* ==================================================
SECTION 03 : DEFAULT
================================================== */

export const defaultBusinessHoursState: BusinessHoursState = {
  monday: { isClosed: false, startTime: '09:00', endTime: '18:00' },
  tuesday: { isClosed: false, startTime: '09:00', endTime: '18:00' },
  wednesday: { isClosed: false, startTime: '09:00', endTime: '18:00' },
  thursday: { isClosed: false, startTime: '09:00', endTime: '18:00' },
  friday: { isClosed: false, startTime: '09:00', endTime: '18:00' },
  saturday: { isClosed: false, startTime: '09:00', endTime: '18:00' },
  sunday: { isClosed: true, startTime: '', endTime: '' }
}

/* ==================================================
SECTION 04 : MAPPER
================================================== */

export function mapBusinessHoursApiToState(
  row?: Partial<BusinessHoursApiRow> | null
): BusinessHoursState {
  if (!row) {
    return { ...defaultBusinessHoursState }
  }

  return {
    monday: {
      isClosed: !!row.mon_isClosed,
      startTime: row.mon_startTime || '09:00',
      endTime: row.mon_endTime || '18:00'
    },
    tuesday: {
      isClosed: !!row.tue_isClosed,
      startTime: row.tue_startTime || '09:00',
      endTime: row.tue_endTime || '18:00'
    },
    wednesday: {
      isClosed: !!row.wed_isClosed,
      startTime: row.wed_startTime || '09:00',
      endTime: row.wed_endTime || '18:00'
    },
    thursday: {
      isClosed: !!row.thu_isClosed,
      startTime: row.thu_startTime || '09:00',
      endTime: row.thu_endTime || '18:00'
    },
    friday: {
      isClosed: !!row.fri_isClosed,
      startTime: row.fri_startTime || '09:00',
      endTime: row.fri_endTime || '18:00'
    },
    saturday: {
      isClosed: !!row.sat_isClosed,
      startTime: row.sat_startTime || '09:00',
      endTime: row.sat_endTime || '18:00'
    },
    sunday: {
      isClosed: !!row.sun_isClosed,
      startTime: row.sun_startTime || '',
      endTime: row.sun_endTime || ''
    }
  }
}

export function mapBusinessHoursStateToApiBody(
  hours: BusinessHoursState & { temporaryClosed?: 0 | 1; alwaysOpen?: 0 | 1 }
) {
  return {
    mon_isClosed: hours.monday.isClosed,
    mon_startTime: hours.monday.startTime,
    mon_endTime: hours.monday.endTime,

    tue_isClosed: hours.tuesday.isClosed,
    tue_startTime: hours.tuesday.startTime,
    tue_endTime: hours.tuesday.endTime,

    wed_isClosed: hours.wednesday.isClosed,
    wed_startTime: hours.wednesday.startTime,
    wed_endTime: hours.wednesday.endTime,

    thu_isClosed: hours.thursday.isClosed,
    thu_startTime: hours.thursday.startTime,
    thu_endTime: hours.thursday.endTime,

    fri_isClosed: hours.friday.isClosed,
    fri_startTime: hours.friday.startTime,
    fri_endTime: hours.friday.endTime,

    sat_isClosed: hours.saturday.isClosed,
    sat_startTime: hours.saturday.startTime,
    sat_endTime: hours.saturday.endTime,

    sun_isClosed: hours.sunday.isClosed,
    sun_startTime: hours.sunday.startTime,
    sun_endTime: hours.sunday.endTime,

    temporaryClosed: hours.temporaryClosed ?? 0,
    alwaysOpen: hours.alwaysOpen ?? 0
  }
}

/* ==================================================
SECTION 05 : API
================================================== */

const BUSINESS_HOURS_BASE = 'business/hours'

export async function getBusinessHoursSetting(
  profileId?: number | null,
  channelCode?: string | null
): Promise<BusinessHoursState & { temporaryClosed?: 0 | 1; alwaysOpen?: 0 | 1; isOpenNow?: boolean }> {
  const canUseScopedRoute =
    typeof profileId === 'number' &&
    profileId > 0 &&
    typeof channelCode === 'string' &&
    channelCode.trim().length > 0

  const res = await apiFetch<BusinessHoursResponse>(
    canUseScopedRoute
      ? `business/profile/${encodeURIComponent(channelCode!.trim())}/hours`
      : BUSINESS_HOURS_BASE
  )

  const mapped = mapBusinessHoursApiToState(res?.hours)
  return {
    ...mapped,
    temporaryClosed: res?.hours?.temporaryClosed ? 1 : 0,
    alwaysOpen: res?.hours?.alwaysOpen ? 1 : 0,
    isOpenNow: Boolean(res?.isOpenNow)
  }
}

export async function saveBusinessHoursSetting(
  hours: BusinessHoursState & { temporaryClosed?: 0 | 1; alwaysOpen?: 0 | 1 }
): Promise<BusinessHoursResponse> {
  return apiFetch<BusinessHoursResponse>(
    BUSINESS_HOURS_BASE,
    {
      method: 'PATCH',
      body: mapBusinessHoursStateToApiBody(hours)
    }
  )
}

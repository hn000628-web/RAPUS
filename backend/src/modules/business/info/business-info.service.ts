// FILE : backend/src/modules/business/info/business-info.service.ts
// ROOT : backend/src/modules/business/info/business-info.service.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS INFO TAB READ SERVICE
// CHANGE SUMMARY :
// - BUSINESS 안내 탭 전용 read service 신규 생성
// - channelCode 기준 profile resolve 후 bio / placeMeta / hours / infoBlocks 조립
// - 메인 프로필 API와 분리된 안내 전용 read projection 담당
// - business_hours / profile_blocks / profiles 기준 read assemble 유지
// - service only DB access 구조 유지

import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common'

import db from '../../../config/database'

// SECTION 01 : TYPE

type BusinessProfileRow = {
  id: number
  userId: number
  profileType: 'BUSINESS'
  displayName: string | null
  bio: string | null
  channelCode: string
  contactPhone: string | null
  activityRegionId: number | null
  feedRegionId: number | null
  detailAddress: string | null
  updatedAt: string | null
}

type RegionRow = {
  id: number
  code: string | null
  name: string | null
  fullName: string | null
  regionType: string | null
  countryCode: string | null
  latitude: number | null
  longitude: number | null
}

type ProfileBlockRow = {
  id: number
  profileId: number
  blockType: string
  title: string | null
  content: string | null
  linkUrl: string | null
  description: string | null
  sortOrder: number
  isActive: number | null
  createdAt: string | null
  updatedAt: string | null
}

type BusinessHoursDayKey =
  | 'MON'
  | 'TUE'
  | 'WED'
  | 'THU'
  | 'FRI'
  | 'SAT'
  | 'SUN'

type BusinessHoursDayPayload = {
  dayKey: BusinessHoursDayKey
  dayLabel: string
  isClosed: boolean
  openTime: string
  closeTime: string
}

type BusinessHoursRow = {
  profileId: number
  channelCode: string | null
  mon_isClosed: number
  mon_startTime: string | null
  mon_endTime: string | null
  tue_isClosed: number
  tue_startTime: string | null
  tue_endTime: string | null
  wed_isClosed: number
  wed_startTime: string | null
  wed_endTime: string | null
  thu_isClosed: number
  thu_startTime: string | null
  thu_endTime: string | null
  fri_isClosed: number
  fri_startTime: string | null
  fri_endTime: string | null
  sat_isClosed: number
  sat_startTime: string | null
  sat_endTime: string | null
  sun_isClosed: number
  sun_startTime: string | null
  sun_endTime: string | null
  temporaryClosed: number
  alwaysOpen: number
  updatedAt: string | null
}

type BusinessInfoPayload = {
  profile: {
    profileId: number
    channelCode: string
    displayName: string | null
    bio: string | null
  }
  placeMeta: {
    contactPhone: string | null
    detailAddress: string | null
    activityRegionId: number | null
    feedRegionId: number | null
    activityRegion: RegionRow | null
    feedRegion: RegionRow | null
  }
  hours: {
    weeklyHours: BusinessHoursDayPayload[]
    summary: string
    temporaryClosed: boolean
    alwaysOpen: boolean
    updatedAt: string | null
  }
  infoBlocks: ProfileBlockRow[]
}

// SECTION 02 : SERVICE

@Injectable()
export class BusinessInfoService {
  // SECTION 03 : CORE VALIDATION

  private normalizeRequiredChannelCode(
    channelCode: string
  ): string {
    if (typeof channelCode !== 'string') {
      throw new BadRequestException('channelCode missing')
    }

    const normalizedChannelCode =
      channelCode.trim()

    if (!normalizedChannelCode) {
      throw new BadRequestException('channelCode missing')
    }

    return normalizedChannelCode
  }

  private getBusinessProfileByChannelCode(
    channelCode: string
  ): BusinessProfileRow {
    const normalizedChannelCode =
      this.normalizeRequiredChannelCode(channelCode)

    const row = db.prepare(`
      SELECT
        id,
        userId,
        profileType,
        displayName,
        bio,
        channelCode,
        contactPhone,
        activityRegionId,
        feedRegionId,
        detailAddress,
        updatedAt
      FROM profiles
      WHERE channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(normalizedChannelCode) as BusinessProfileRow | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found')
    }

    return row
  }

  private getRegion(
    regionId: number | null
  ): RegionRow | null {
    if (
      typeof regionId !== 'number' ||
      Number.isNaN(regionId) ||
      regionId <= 0
    ) {
      return null
    }

    const row = db.prepare(`
      SELECT
        id,
        code,
        name,
        fullName,
        regionType,
        countryCode,
        latitude,
        longitude
      FROM regions
      WHERE id = ?
      LIMIT 1
    `).get(regionId) as RegionRow | undefined

    return row ?? null
  }

  private getInfoBlocks(
    profileId: number
  ): ProfileBlockRow[] {
    return db.prepare(`
      SELECT
        id,
        profileId,
        type AS blockType,
        title,
        content,
        url AS linkUrl,
        description,
        sortOrder,
        isActive,
        createdAt,
        updatedAt
      FROM profile_blocks
      WHERE profileId = ?
      ORDER BY sortOrder ASC, id ASC
    `).all(profileId) as ProfileBlockRow[]
  }

  private getBusinessHoursRow(
    profileId: number,
    channelCode: string
  ): BusinessHoursRow | null {
    const row = db.prepare(`
      SELECT
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
        alwaysOpen,
        updatedAt
      FROM business_hours
      WHERE profileId = ?
        AND channelCode = ?
      LIMIT 1
    `).get(
      profileId,
      channelCode
    ) as BusinessHoursRow | undefined

    return row ?? null
  }

  private buildHoursSummary(
    weeklyHours: BusinessHoursDayPayload[],
    temporaryClosed = false,
    alwaysOpen = false
  ): string {
    if (temporaryClosed) {
      return '전체 OFF'
    }

    if (alwaysOpen) {
      return '24시간 영업'
    }

    const todayIndex = new Date().getDay()

    const dayKeyMap: BusinessHoursDayKey[] = [
      'SUN',
      'MON',
      'TUE',
      'WED',
      'THU',
      'FRI',
      'SAT'
    ]

    const todayKey =
      dayKeyMap[todayIndex]

    const todayHours =
      weeklyHours.find(
        (day) => day.dayKey === todayKey
      )

    if (!todayHours) {
      return '영업시간 정보 없음'
    }

    if (todayHours.isClosed) {
      return `${todayHours.dayLabel} 휴무`
    }

    return `${todayHours.dayLabel} ${todayHours.openTime} - ${todayHours.closeTime}`
  }

  private getBusinessHoursPayload(
    profileId: number,
    channelCode: string
  ): BusinessInfoPayload['hours'] {
    const row =
      this.getBusinessHoursRow(
        profileId,
        channelCode
      )

    const dayLabelMap: Record<BusinessHoursDayKey, string> = {
      MON: '월요일',
      TUE: '화요일',
      WED: '수요일',
      THU: '목요일',
      FRI: '금요일',
      SAT: '토요일',
      SUN: '일요일'
    }

    const dayKeys: BusinessHoursDayKey[] = [
      'MON',
      'TUE',
      'WED',
      'THU',
      'FRI',
      'SAT',
      'SUN'
    ]

    const defaultWeeklyHours: BusinessHoursDayPayload[] =
      dayKeys.map((dayKey) => ({
        dayKey,
        dayLabel: dayLabelMap[dayKey],
        isClosed: true,
        openTime: '09:00',
        closeTime: '18:00'
      }))

    if (!row) {
      return {
        weeklyHours: defaultWeeklyHours,
        summary: '영업시간 정보 없음',
        temporaryClosed: false,
        alwaysOpen: false,
        updatedAt: null
      }
    }

    const weeklyHours: BusinessHoursDayPayload[] = [
      {
        dayKey: 'MON',
        dayLabel: dayLabelMap.MON,
        isClosed: row.mon_isClosed === 1,
        openTime: row.mon_startTime || '09:00',
        closeTime: row.mon_endTime || '18:00'
      },
      {
        dayKey: 'TUE',
        dayLabel: dayLabelMap.TUE,
        isClosed: row.tue_isClosed === 1,
        openTime: row.tue_startTime || '09:00',
        closeTime: row.tue_endTime || '18:00'
      },
      {
        dayKey: 'WED',
        dayLabel: dayLabelMap.WED,
        isClosed: row.wed_isClosed === 1,
        openTime: row.wed_startTime || '09:00',
        closeTime: row.wed_endTime || '18:00'
      },
      {
        dayKey: 'THU',
        dayLabel: dayLabelMap.THU,
        isClosed: row.thu_isClosed === 1,
        openTime: row.thu_startTime || '09:00',
        closeTime: row.thu_endTime || '18:00'
      },
      {
        dayKey: 'FRI',
        dayLabel: dayLabelMap.FRI,
        isClosed: row.fri_isClosed === 1,
        openTime: row.fri_startTime || '09:00',
        closeTime: row.fri_endTime || '18:00'
      },
      {
        dayKey: 'SAT',
        dayLabel: dayLabelMap.SAT,
        isClosed: row.sat_isClosed === 1,
        openTime: row.sat_startTime || '09:00',
        closeTime: row.sat_endTime || '18:00'
      },
      {
        dayKey: 'SUN',
        dayLabel: dayLabelMap.SUN,
        isClosed: row.sun_isClosed === 1,
        openTime: row.sun_startTime || '09:00',
        closeTime: row.sun_endTime || '18:00'
      }
    ]

    return {
      weeklyHours,
      summary: this.buildHoursSummary(
        weeklyHours,
        row.temporaryClosed === 1,
        row.alwaysOpen === 1
      ),
      temporaryClosed: row.temporaryClosed === 1,
      alwaysOpen: row.alwaysOpen === 1,
      updatedAt: row.updatedAt
    }
  }

  // SECTION 04 : READ

  getBusinessInfoByChannelCode(
    channelCode: string
  ): BusinessInfoPayload {
    const profile =
      this.getBusinessProfileByChannelCode(channelCode)

    return {
      profile: {
        profileId: profile.id,
        channelCode: profile.channelCode,
        displayName: profile.displayName,
        bio: profile.bio
      },
      placeMeta: {
        contactPhone: profile.contactPhone,
        detailAddress: profile.detailAddress,
        activityRegionId: profile.activityRegionId,
        feedRegionId: profile.feedRegionId,
        activityRegion: this.getRegion(profile.activityRegionId),
        feedRegion: this.getRegion(profile.feedRegionId)
      },
      hours: this.getBusinessHoursPayload(
        profile.id,
        profile.channelCode
      ),
      infoBlocks: this.getInfoBlocks(profile.id)
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common'
import db from '../../config/database'

export type ProfileDetailPayload = {
  id: number
  userId: number
  profileType: 'GENERAL' | 'BUSINESS'
  baseCode: string
  channelCode: string
  displayName: string | null
  bio: string | null
  channelURL: string | null
  channelName: string | null
  contactPhone: string | null
  activityRegionId: number | null
  feedRegionId: number | null
  detailAddress: string | null
  businessRegistrationNumber: string | null
  primaryIndustryId: number | null
  primaryIndustrySubtypeId: number | null
  primaryIndustryCode: string | null
  primaryIndustrySubtypeCode: string | null
  placeFeedTypeCode: PlaceFeedTypeCode | null
  avatarImage: ProfileSummaryImagePayload | null
  heroImage: ProfileSummaryImagePayload | null
  activityRegion: ProfileSummaryRegionPayload | null
  feedRegion: ProfileSummaryRegionPayload | null
  businessHours: ProfileSummaryBusinessHoursPayload | null
  createdAt: string
  updatedAt: string | null
}

type ProfileSummaryImagePayload = {
  id: number
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
}

type ProfileSummaryRegionPayload = {
  id: number
  code: string | null
  name: string | null
  fullName: string | null
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

type ProfileSummaryBusinessHoursPayload = {
  weeklyHours: BusinessHoursDayPayload[]
  summary: string
  isOpenNow: boolean
  alwaysOpen: boolean
  temporaryClosed: boolean
  updatedAt: string | null
}

type ProfileSummaryImageRow = {
  id: number
  imageAssetId: number | null
  filePath: string | null
}

type BusinessHoursRow = {
  profileId: number
  channelCode: string | null
  isActive: number | null
  mon_isActive: number | null
  mon_isClosed: number | null
  mon_startTime: string | null
  mon_endTime: string | null
  tue_isActive: number | null
  tue_isClosed: number | null
  tue_startTime: string | null
  tue_endTime: string | null
  wed_isActive: number | null
  wed_isClosed: number | null
  wed_startTime: string | null
  wed_endTime: string | null
  thu_isActive: number | null
  thu_isClosed: number | null
  thu_startTime: string | null
  thu_endTime: string | null
  fri_isActive: number | null
  fri_isClosed: number | null
  fri_startTime: string | null
  fri_endTime: string | null
  sat_isActive: number | null
  sat_isClosed: number | null
  sat_startTime: string | null
  sat_endTime: string | null
  sun_isActive: number | null
  sun_isClosed: number | null
  sun_startTime: string | null
  sun_endTime: string | null
  temporaryClosed: number | null
  alwaysOpen: number | null
  updatedAt: string | null
}

export type PlaceFeedTypeCode =
  | 'NORMAL'
  | 'CLASSIC'
  | 'MARKET'
  | 'ONLINE_SHOP'
  | 'FOOD'
  | 'BEAUTY'
  | 'CULTURE'
  | 'STAY'
  | 'RENTCAR'

@Injectable()
export class ProfileSummaryService {
  // channelCode 단독 조회
  getProfileByChannelCode(channelCode: string): ProfileDetailPayload {
    const row = db.prepare(`
      SELECT *
      FROM profiles
      WHERE channelCode = ?
      LIMIT 1
    `).get(channelCode)

    if (!row) throw new NotFoundException('Profile not found for the given channelCode')

    return this.buildProfileDetailPayload(row as ProfileDetailPayload)
  }

  // profileId 단독 조회
  getProfileByProfileId(profileId: number): ProfileDetailPayload {
    const row = db.prepare(`
      SELECT *
      FROM profiles
      WHERE id = ?
      LIMIT 1
    `).get(profileId)

    if (!row) throw new NotFoundException('Profile not found for the given profileId')

    return this.buildProfileDetailPayload(row as ProfileDetailPayload)
  }

  // profileId + channelCode 조합 단일 귀속 조회
  getProfileByProfileIdAndChannelCode(profileId: number, channelCode: string): ProfileDetailPayload {
    const row = db.prepare(`
      SELECT *
      FROM profiles
      WHERE id = ? AND channelCode = ?
      LIMIT 1
    `).get(profileId, channelCode)

    if (!row) throw new NotFoundException('Profile not found for the given profileId and channelCode')

    return this.buildProfileDetailPayload(row as ProfileDetailPayload)
  }

  private buildProfileDetailPayload(
    profile: ProfileDetailPayload
  ): ProfileDetailPayload {
    return {
      ...profile,
      avatarImage: this.getAvatarImage(profile),
      heroImage: this.getHeroImage(profile),
      activityRegion: this.getRegion(profile.activityRegionId),
      feedRegion: this.getRegion(profile.feedRegionId),
      businessHours: profile.profileType === 'BUSINESS'
        ? this.getBusinessHours(profile)
        : null
    }
  }

  private getAvatarImage(
    profile: ProfileDetailPayload
  ): ProfileSummaryImagePayload | null {
    const row = db.prepare(`
      SELECT
        pa.id,
        pa.imageAssetId,
        COALESCE(ia.filePath, pa.filePath) AS filePath
      FROM profile_avatars pa
      LEFT JOIN image_assets ia
        ON ia.id = pa.imageAssetId
        AND COALESCE(ia.isActive, 1) = 1
      WHERE pa.profileId = ?
        AND pa.channelCode = ?
        AND COALESCE(pa.isActive, 1) = 1
      ORDER BY pa.id DESC
      LIMIT 1
    `).get(
      profile.id,
      profile.channelCode
    ) as ProfileSummaryImageRow | undefined

    return this.mapImageRow(row)
  }

  private getHeroImage(
    profile: ProfileDetailPayload
  ): ProfileSummaryImagePayload | null {
    const row = db.prepare(`
      SELECT
        ph.id,
        ph.imageAssetId,
        COALESCE(ia.filePath, ph.externalUrl) AS filePath
      FROM profile_hero_images ph
      LEFT JOIN image_assets ia
        ON ia.id = ph.imageAssetId
        AND COALESCE(ia.isActive, 1) = 1
      WHERE ph.profileId = ?
        AND (
          ph.channelCode = ?
          OR ph.channelCode IS NULL
        )
        AND COALESCE(ph.isActive, 1) = 1
      ORDER BY ph.sortOrder ASC, ph.id ASC
      LIMIT 1
    `).get(
      profile.id,
      profile.channelCode
    ) as ProfileSummaryImageRow | undefined

    return this.mapImageRow(row)
  }

  private mapImageRow(
    row?: ProfileSummaryImageRow
  ): ProfileSummaryImagePayload | null {
    if (!row) {
      return null
    }

    return {
      id: row.id,
      imageAssetId: row.imageAssetId,
      filePath: row.filePath,
      imageUrl: this.buildMediaUrl(row.filePath)
    }
  }

  private getRegion(
    regionId: number | null
  ): ProfileSummaryRegionPayload | null {
    if (!regionId) {
      return null
    }

    const row = db.prepare(`
      SELECT
        id,
        code,
        name,
        fullName
      FROM regions
      WHERE id = ?
      LIMIT 1
    `).get(regionId) as ProfileSummaryRegionPayload | undefined

    return row ?? null
  }

  private getBusinessHours(
    profile: ProfileDetailPayload
  ): ProfileSummaryBusinessHoursPayload | null {
    const row = db.prepare(`
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
        updatedAt
      FROM business_hours
      WHERE profileId = ?
        AND (
          channelCode = ?
          OR channelCode IS NULL
        )
      ORDER BY
        CASE WHEN channelCode = ? THEN 0 ELSE 1 END ASC
      LIMIT 1
    `).get(
      profile.id,
      profile.channelCode,
      profile.channelCode
    ) as BusinessHoursRow | undefined

    if (!row) {
      return null
    }

    const weeklyHours =
      this.buildWeeklyHours(row)
    const alwaysOpen =
      row.alwaysOpen === 1
    const temporaryClosed =
      row.temporaryClosed === 1

    return {
      weeklyHours,
      summary: this.buildHoursSummary(
        weeklyHours,
        temporaryClosed,
        alwaysOpen
      ),
      isOpenNow: this.calculateIsOpenNow(row),
      alwaysOpen,
      temporaryClosed,
      updatedAt: row.updatedAt
    }
  }

  private buildWeeklyHours(
    row: BusinessHoursRow
  ): BusinessHoursDayPayload[] {
    return [
      this.buildDayHours(row, 'MON', '월요일'),
      this.buildDayHours(row, 'TUE', '화요일'),
      this.buildDayHours(row, 'WED', '수요일'),
      this.buildDayHours(row, 'THU', '목요일'),
      this.buildDayHours(row, 'FRI', '금요일'),
      this.buildDayHours(row, 'SAT', '토요일'),
      this.buildDayHours(row, 'SUN', '일요일')
    ]
  }

  private buildDayHours(
    row: BusinessHoursRow,
    dayKey: BusinessHoursDayKey,
    dayLabel: string
  ): BusinessHoursDayPayload {
    const key =
      dayKey.toLowerCase()

    return {
      dayKey,
      dayLabel,
      isClosed: Number(row[`${key}_isClosed` as keyof BusinessHoursRow] ?? 1) === 1,
      openTime: String(row[`${key}_startTime` as keyof BusinessHoursRow] || '09:00'),
      closeTime: String(row[`${key}_endTime` as keyof BusinessHoursRow] || '18:00')
    }
  }

  private buildHoursSummary(
    weeklyHours: BusinessHoursDayPayload[],
    temporaryClosed: boolean,
    alwaysOpen: boolean
  ): string {
    if (temporaryClosed) {
      return '전체 OFF'
    }

    if (alwaysOpen) {
      return '24시간 영업'
    }

    const dayKeys: BusinessHoursDayKey[] = [
      'SUN',
      'MON',
      'TUE',
      'WED',
      'THU',
      'FRI',
      'SAT'
    ]

    const todayHours =
      weeklyHours.find((day) => day.dayKey === dayKeys[new Date().getDay()])

    if (!todayHours) {
      return '영업시간 정보 없음'
    }

    if (todayHours.isClosed) {
      return `${todayHours.dayLabel} 휴무`
    }

    return `${todayHours.dayLabel} ${todayHours.openTime} - ${todayHours.closeTime}`
  }

  private calculateIsOpenNow(
    row: BusinessHoursRow
  ): boolean {
    if (row.temporaryClosed === 1) {
      return false
    }

    if (Number(row.isActive ?? 1) !== 1) {
      return false
    }

    if (row.alwaysOpen === 1) {
      return true
    }

    const dayKeys = [
      'sun',
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat'
    ]

    const currentDay =
      dayKeys[new Date().getDay()]
    const dayActive =
      Number(row[`${currentDay}_isActive` as keyof BusinessHoursRow] ?? 1)
    const dayClosed =
      Number(row[`${currentDay}_isClosed` as keyof BusinessHoursRow] ?? 1)
    const startTime =
      String(row[`${currentDay}_startTime` as keyof BusinessHoursRow] ?? '').trim()
    const endTime =
      String(row[`${currentDay}_endTime` as keyof BusinessHoursRow] ?? '').trim()

    if (dayActive !== 1 || dayClosed === 1 || !startTime || !endTime) {
      return false
    }

    const [startHour, startMinute] =
      startTime.split(':').map(Number)
    const [endHour, endMinute] =
      endTime.split(':').map(Number)

    if (
      Number.isNaN(startHour) ||
      Number.isNaN(startMinute) ||
      Number.isNaN(endHour) ||
      Number.isNaN(endMinute)
    ) {
      return false
    }

    const now =
      new Date()
    const nowMinute =
      now.getHours() * 60 + now.getMinutes()
    const startTotal =
      startHour * 60 + startMinute
    const endTotal =
      endHour * 60 + endMinute

    return nowMinute >= startTotal && nowMinute < endTotal
  }

  private buildMediaUrl(
    filePath: string | null
  ): string | null {
    if (!filePath) {
      return null
    }

    const trimmed =
      filePath.trim()

    if (!trimmed) {
      return null
    }

    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
    ) {
      return trimmed
    }

    const baseUrl =
      (
        process.env.API_URL ||
        process.env.PUBLIC_API_URL ||
        'http://localhost:4000'
      ).replace(/\/+$/, '')

    if (trimmed.startsWith('/media/')) {
      return `${baseUrl}${trimmed}`
    }

    if (trimmed.startsWith('media/')) {
      return `${baseUrl}/${trimmed}`
    }

    if (trimmed.startsWith('/uploads/')) {
      return `${baseUrl}${trimmed.replace(/^\/uploads\//, '/media/')}`
    }

    if (trimmed.startsWith('uploads/')) {
      return `${baseUrl}/${trimmed.replace(/^uploads\//, 'media/')}`
    }

    return `${baseUrl}/media/${trimmed.replace(/^\/+/, '')}`
  }
}

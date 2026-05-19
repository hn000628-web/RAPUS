// FILE : backend/src/modules/business/profile-settings/profile-settings.service.ts
// ROOT : backend/src/modules/business/profile-settings/profile-settings.service.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE SETTINGS SERVICE
// CHANGE SUMMARY :
// - avatar 조회를 profile_avatars 직접 filePath 참조 방식에서 image_assets JOIN 방식으로 수정
// - hero 조회 방식과 avatar 조회 방식을 동일한 media relation 구조로 정렬
// - imageUrl 생성 기준을 image_assets.filePath로 통일
// - media url 생성 시 backend origin 기준 절대 URL 반환으로 수정
// - 기존 반환 타입 / UI 계약 유지

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common'

import * as bcrypt from 'bcrypt'

import db from '../../../config/database'

// SECTION 01 : TYPE

type BusinessProfileRow = {
  id: number
  userId: number
  profileType: 'BUSINESS'
  displayName: string | null
  bio: string | null
  channelCode: string
  channelURL: string | null
  channelName: string | null
  contactPhone: string | null
  secondaryPhone: string | null
  faxNumber: string | null
  managerEmail: string | null
  loginPasswordStatus: 'SET' | 'NOT_SET'
  paymentPasswordStatus: 'SET' | 'NOT_SET'
  activityRegionId: number | null
  feedRegionId: number | null
  detailAddress: string | null
  businessRegistrationNumber: string | null
  primaryIndustryId: number | null
  primaryIndustrySubtypeId: number | null
  primaryIndustryCode: string | null
  primaryIndustrySubtypeCode: string | null
  createdAt: string
  updatedAt: string | null
}

type BusinessProfilePasswordRow = {
  loginPasswordHash: string | null
  paymentPasswordHash: string | null
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

type BusinessAvatarRow = {
  id: number
  profileId: number
  channelCode: string
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
  isActive: number | null
  createdAt: string | null
}

type BusinessHeroImageRow = {
  id: number
  profileId: number
  channelCode: string | null
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
  sortOrder: number
  createdAt: string | null
}

type BusinessPlaceMetaPayload = {
  activityRegionId: number | null
  feedRegionId: number | null
  activityRegion: RegionRow | null
  feedRegion: RegionRow | null
  detailAddress: string | null
  bio: string | null
  contactPhone: string | null
  secondaryPhone: string | null
  faxNumber: string | null
  managerEmail: string | null
}

type BusinessIndustryRow = {
  id: number | null
  code: string | null
  name: string | null
  description: string | null
}

type BusinessIndustrySubtypeRow = {
  id: number | null
  code: string | null
  name: string | null
}

type BusinessIndustryPayload = {
  primaryIndustryId: number | null
  primaryIndustrySubtypeId: number | null
  primaryIndustryCode: string | null
  primaryIndustrySubtypeCode: string | null
  industry: BusinessIndustryRow | null
  industrySubtype: BusinessIndustrySubtypeRow | null
}

type BusinessIndustryOptionRow = {
  id: number
  code: string
  name: string
  description: string | null
  isActive: number
  sortOrder: number
  createdAt: string | null
}

type BusinessIndustrySubtypeOptionRow = {
  id: number
  industryId: number
  code: string
  name: string
  name_en: string | null
  name_ko: string | null
  searchKeywords: string | null
  isActive: number
  sortOrder: number
  industryName: string | null
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
  updatedAt: string | null
}

// SECTION 02 : SERVICE

@Injectable()
export class ProfileSettingsService {

  // SECTION 03 : SECURITY CORE

  private assertProfileOwnership(userId: number, profileId: number): void {
    if (!userId || !profileId) {
      throw new BadRequestException('auth invalid')
    }

    const row = db.prepare(`
      SELECT id
      FROM profiles
      WHERE id = ?
        AND userId = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId, userId) as { id: number } | undefined

    if (!row) {
      throw new ForbiddenException('Business profile access denied')
    }
  }

  private assertProfileOwnershipWithChannel(
    userId: number,
    profileId: number,
    channelCode: string
  ): void {
    if (!userId || !profileId || !channelCode?.trim()) {
      throw new BadRequestException('auth invalid')
    }

    const row = db.prepare(`
      SELECT id
      FROM profiles
      WHERE id = ?
        AND userId = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId, userId, channelCode.trim()) as { id: number } | undefined

    if (!row) {
      throw new ForbiddenException('Business profile access denied')
    }
  }

  private getProfilePasswordRow(
    profileId: number,
    channelCode: string
  ): BusinessProfilePasswordRow {
    const row = db.prepare(`
      SELECT
        loginPasswordHash,
        paymentPasswordHash
      FROM profiles
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(
      profileId,
      channelCode.trim()
    ) as BusinessProfilePasswordRow | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found')
    }

    return row
  }

  private assertProfileId(profileId: number): void {
    if (!profileId) {
      throw new BadRequestException('profileId missing')
    }

    const row = db.prepare(`
      SELECT id
      FROM profiles
      WHERE id = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId) as { id: number } | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found')
    }
  }

  private getProfileIdByChannelCode(channelCode: string): number {
    if (!channelCode?.trim()) {
      throw new BadRequestException('channelCode missing')
    }

    const row = db.prepare(`
      SELECT id
      FROM profiles
      WHERE channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(channelCode.trim()) as { id: number } | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found by channelCode')
    }

    return row.id
  }

  private getChannelCode(profileId: number): string {
    this.assertProfileId(profileId)

    const row = db.prepare(`
      SELECT channelCode
      FROM profiles
      WHERE id = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId) as { channelCode: string } | undefined

    if (!row) {
      throw new NotFoundException('Business channel not found')
    }

    return row.channelCode
  }

  private buildMediaUrl(filePath?: string | null): string | null {
    if (!filePath) {
      return null
    }

    const trimmed = filePath.trim()

    if (!trimmed) {
      return null
    }

    if (/^(https?:|blob:)/.test(trimmed)) {
      return trimmed
    }

    const mediaBaseUrl =
      process.env.MEDIA_BASE_URL?.trim() ||
      process.env.BACKEND_URL?.trim() ||
      `http://localhost:${process.env.PORT || 4000}`

    const normalizedBaseUrl = mediaBaseUrl.replace(/\/+$/, '')

    if (trimmed.startsWith('/media/')) {
      return `${normalizedBaseUrl}${trimmed}`
    }

    if (trimmed.startsWith('/uploads/')) {
      return `${normalizedBaseUrl}${trimmed.replace(/^\/uploads\//, '/media/')}`
    }

    if (trimmed.startsWith('/')) {
      return `${normalizedBaseUrl}${trimmed}`
    }

    return `${normalizedBaseUrl}/media/${trimmed.replace(/^\/+/, '')}`
  }

  private getRegion(regionId: number | null): RegionRow | null {
    if (!regionId) {
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

  private normalizeOptionalKeyword(keyword?: string): string | null {
    if (typeof keyword !== 'string') {
      return null
    }

    const trimmedKeyword = keyword.trim()

    if (!trimmedKeyword) {
      return null
    }

    return `%${trimmedKeyword.toLowerCase()}%`
  }

  private normalizeOptionalIndustryId(industryId?: number | null): number | null {
    if (industryId === null || industryId === undefined) {
      return null
    }

    if (
      typeof industryId !== 'number' ||
      Number.isNaN(industryId) ||
      industryId <= 0
    ) {
      throw new BadRequestException('invalid industryId')
    }

    return industryId
  }

  // SECTION 04 : PROFILE CORE READ

  getProfile(profileId: number): BusinessProfileRow {
    this.assertProfileId(profileId)

    const row = db.prepare(`
      SELECT
        id,
        userId,
        profileType,
        displayName,
        bio,
        channelCode,
        channelURL,
        channelName,
        contactPhone,
        secondaryPhone,
        faxNumber,
        managerEmail,
        CASE
          WHEN loginPasswordHash IS NULL OR loginPasswordHash = ''
            THEN 'NOT_SET'
          ELSE 'SET'
        END AS loginPasswordStatus,
        CASE
          WHEN paymentPasswordHash IS NULL OR paymentPasswordHash = ''
            THEN 'NOT_SET'
          ELSE 'SET'
        END AS paymentPasswordStatus,
        activityRegionId,
        feedRegionId,
        detailAddress,
        businessRegistrationNumber,
        primaryIndustryId,
        primaryIndustrySubtypeId,
        primaryIndustryCode,
        primaryIndustrySubtypeCode,
        createdAt,
        updatedAt
      FROM profiles
      WHERE id = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId) as BusinessProfileRow | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found')
    }

    return row
  }

  getProfileBlocks(profileId: number): ProfileBlockRow[] {
    this.assertProfileId(profileId)

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

  getBusinessHoursRow(profileId: number): BusinessHoursRow | null {
    this.assertProfileId(profileId)

    return db.prepare(`
      SELECT *
      FROM business_hours
      WHERE profileId = ?
      LIMIT 1
    `).get(profileId) as BusinessHoursRow | undefined ?? null
  }

  getPlaceMeta(profileId: number): BusinessPlaceMetaPayload {
    const profile = this.getProfile(profileId)

    return {
      activityRegionId: profile.activityRegionId,
      feedRegionId: profile.feedRegionId,
      activityRegion: this.getRegion(profile.activityRegionId),
      feedRegion: this.getRegion(profile.feedRegionId),
      detailAddress: profile.detailAddress,
      bio: profile.bio,
      contactPhone: profile.contactPhone,
      secondaryPhone: profile.secondaryPhone,
      faxNumber: profile.faxNumber,
      managerEmail: profile.managerEmail
    }
  }

  getIndustry(profileId: number): BusinessIndustryPayload {
    const profile = this.getProfile(profileId)

    const industry = profile.primaryIndustryId
      ? (
          db.prepare(`
            SELECT
              id,
              code,
              name,
              description
            FROM industries
            WHERE id = ?
            LIMIT 1
          `).get(profile.primaryIndustryId) as BusinessIndustryRow | undefined
        ) ?? null
      : null

    const industrySubtype = profile.primaryIndustrySubtypeId
      ? (
          db.prepare(`
            SELECT
              id,
              code,
              name
            FROM industry_subtypes
            WHERE id = ?
            LIMIT 1
          `).get(profile.primaryIndustrySubtypeId) as BusinessIndustrySubtypeRow | undefined
        ) ?? null
      : null

    return {
      primaryIndustryId: profile.primaryIndustryId,
      primaryIndustrySubtypeId: profile.primaryIndustrySubtypeId,
      primaryIndustryCode: profile.primaryIndustryCode,
      primaryIndustrySubtypeCode: profile.primaryIndustrySubtypeCode,
      industry,
      industrySubtype
    }
  }

  getBusinessIndustryOptions(keyword?: string): BusinessIndustryOptionRow[] {
    const searchKeyword = this.normalizeOptionalKeyword(keyword)

    if (!searchKeyword) {
      return db.prepare(`
        SELECT
          id,
          code,
          name,
          description,
          isActive,
          sortOrder,
          createdAt
        FROM industries
        WHERE isActive = 1
        ORDER BY sortOrder ASC, id ASC
      `).all() as BusinessIndustryOptionRow[]
    }

    return db.prepare(`
      SELECT
        id,
        code,
        name,
        description,
        isActive,
        sortOrder,
        createdAt
      FROM industries
      WHERE isActive = 1
        AND (
          LOWER(code) LIKE ?
          OR LOWER(name) LIKE ?
          OR LOWER(COALESCE(description, '')) LIKE ?
        )
      ORDER BY sortOrder ASC, id ASC
    `).all(
      searchKeyword,
      searchKeyword,
      searchKeyword
    ) as BusinessIndustryOptionRow[]
  }

  getBusinessIndustrySubtypeOptions(
    industryId?: number | null,
    keyword?: string
  ): BusinessIndustrySubtypeOptionRow[] {
    const normalizedIndustryId =
      this.normalizeOptionalIndustryId(industryId)

    const searchKeyword =
      this.normalizeOptionalKeyword(keyword)

    if (normalizedIndustryId && !searchKeyword) {
      return db.prepare(`
        SELECT
          s.id,
          s.industryId,
          s.code,
          s.name,
          s.name_en,
          s.name_ko,
          s.searchKeywords,
          s.isActive,
          s.sortOrder,
          i.name AS industryName,
          s.createdAt,
          s.updatedAt
        FROM industry_subtypes s
        LEFT JOIN industries i
          ON s.industryId = i.id
        WHERE s.isActive = 1
          AND s.industryId = ?
        ORDER BY s.sortOrder ASC, s.id ASC
      `).all(normalizedIndustryId) as BusinessIndustrySubtypeOptionRow[]
    }

    if (!normalizedIndustryId && !searchKeyword) {
      return db.prepare(`
        SELECT
          s.id,
          s.industryId,
          s.code,
          s.name,
          s.name_en,
          s.name_ko,
          s.searchKeywords,
          s.isActive,
          s.sortOrder,
          i.name AS industryName,
          s.createdAt,
          s.updatedAt
        FROM industry_subtypes s
        LEFT JOIN industries i
          ON s.industryId = i.id
        WHERE s.isActive = 1
        ORDER BY s.sortOrder ASC, s.id ASC
      `).all() as BusinessIndustrySubtypeOptionRow[]
    }

    if (normalizedIndustryId && searchKeyword) {
      return db.prepare(`
        SELECT
          s.id,
          s.industryId,
          s.code,
          s.name,
          s.name_en,
          s.name_ko,
          s.searchKeywords,
          s.isActive,
          s.sortOrder,
          i.name AS industryName,
          s.createdAt,
          s.updatedAt
        FROM industry_subtypes s
        LEFT JOIN industries i
          ON s.industryId = i.id
        WHERE s.isActive = 1
          AND s.industryId = ?
          AND (
            LOWER(s.code) LIKE ?
            OR LOWER(s.name) LIKE ?
            OR LOWER(COALESCE(s.name_en, '')) LIKE ?
            OR LOWER(COALESCE(s.name_ko, '')) LIKE ?
            OR LOWER(COALESCE(s.searchKeywords, '')) LIKE ?
          )
        ORDER BY s.sortOrder ASC, s.id ASC
      `).all(
        normalizedIndustryId,
        searchKeyword,
        searchKeyword,
        searchKeyword,
        searchKeyword,
        searchKeyword
      ) as BusinessIndustrySubtypeOptionRow[]
    }

    return db.prepare(`
      SELECT
        s.id,
        s.industryId,
        s.code,
        s.name,
        s.name_en,
        s.name_ko,
        s.searchKeywords,
        s.isActive,
        s.sortOrder,
        i.name AS industryName,
        s.createdAt,
        s.updatedAt
      FROM industry_subtypes s
      LEFT JOIN industries i
        ON s.industryId = i.id
      WHERE s.isActive = 1
        AND (
          LOWER(s.code) LIKE ?
          OR LOWER(s.name) LIKE ?
          OR LOWER(COALESCE(s.name_en, '')) LIKE ?
          OR LOWER(COALESCE(s.name_ko, '')) LIKE ?
          OR LOWER(COALESCE(s.searchKeywords, '')) LIKE ?
        )
      ORDER BY s.sortOrder ASC, s.id ASC
    `).all(
      searchKeyword,
      searchKeyword,
      searchKeyword,
      searchKeyword,
      searchKeyword
    ) as BusinessIndustrySubtypeOptionRow[]
  }

  getAvatar(profileId: number): BusinessAvatarRow | null {
    this.assertProfileId(profileId)

    const row = db.prepare(`
      SELECT
        a.id,
        a.profileId,
        a.channelCode,
        a.imageAssetId,
        ia.filePath,
        a.isActive,
        a.createdAt
      FROM profile_avatars a
      LEFT JOIN image_assets ia
        ON ia.id = a.imageAssetId
      WHERE a.profileId = ?
        AND COALESCE(a.isActive, 1) = 1
      ORDER BY a.id DESC
      LIMIT 1
    `).get(profileId) as Omit<BusinessAvatarRow, 'imageUrl'> | undefined

    if (!row) {
      return null
    }

    return {
      ...row,
      imageUrl: this.buildMediaUrl(row.filePath)
    }
  }

  getHeroImages(profileId: number): BusinessHeroImageRow[] {
    this.assertProfileId(profileId)

    const rows = db.prepare(`
      SELECT
        h.id,
        h.profileId,
        h.channelCode,
        h.imageAssetId,
        ia.filePath,
        h.sortOrder,
        h.createdAt
      FROM profile_hero_images h
      LEFT JOIN image_assets ia
        ON ia.id = h.imageAssetId
      WHERE h.profileId = ?
        AND COALESCE(h.isActive, 1) = 1
      ORDER BY h.sortOrder ASC, h.id ASC
    `).all(profileId) as Array<{
      id: number
      profileId: number
      channelCode: string | null
      imageAssetId: number | null
      filePath: string | null
      sortOrder: number
      createdAt: string | null
    }>

    return rows.map((row) => ({
      ...row,
      imageUrl: this.buildMediaUrl(row.filePath)
    }))
  }

  // SECTION 05 : PROFILE DETAIL

  getProfileDetailByChannelCode(channelCode: string) {
    const profileId = this.getProfileIdByChannelCode(channelCode)

    return {
      profile: this.getProfile(profileId),
      placeMeta: this.getPlaceMeta(profileId),
      infoBlocks: this.getProfileBlocks(profileId),
      media: {
        avatar: this.getAvatar(profileId),
        heroImages: this.getHeroImages(profileId)
      }
    }
  }

  // SECTION 06 : PROFILE WRITE

  updateProfileCore(userId: number, profileId: number, channelCode: string, payload: {
    displayName?: string
  }) {
    this.assertProfileOwnershipWithChannel(userId, profileId, channelCode)

    const current = this.getProfile(profileId)

    db.prepare(`
      UPDATE profiles
      SET
        displayName = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileType = 'BUSINESS'
    `).run(
      payload.displayName ?? current.displayName,
      profileId
    )

    return this.getProfile(profileId)
  }

  updateProfileFields(userId: number, profileId: number, channelCode: string, payload: {
    detailAddress?: string | null
    primaryIndustryId?: number | null
    primaryIndustrySubtypeId?: number | null
    primaryIndustryCode?: string | null
    primaryIndustrySubtypeCode?: string | null
    channelName?: string | null
    channelURL?: string | null
    activityRegionId?: number | null
    feedRegionId?: number | null
  }) {
    this.assertProfileOwnershipWithChannel(userId, profileId, channelCode)

    const current = this.getProfile(profileId)
    const normalizedChannelCode = channelCode.trim()

    const normalizedChannelName =
      payload.channelName === undefined
        ? current.channelName
        : (payload.channelName?.trim() || null)

    const normalizedDetailAddress =
      payload.detailAddress === undefined
        ? current.detailAddress
        : (payload.detailAddress?.trim() || null)

    const normalizedChannelUrl =
      `xxx.com/@${current.channelCode}`

    db.prepare(`
      UPDATE profiles
      SET
        detailAddress = ?,
        primaryIndustryId = ?,
        primaryIndustrySubtypeId = ?,
        primaryIndustryCode = ?,
        primaryIndustrySubtypeCode = ?,
        channelName = ?,
        channelURL = ?,
        activityRegionId = ?,
        feedRegionId = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
    `).run(
      normalizedDetailAddress,
      payload.primaryIndustryId ?? current.primaryIndustryId,
      payload.primaryIndustrySubtypeId ?? current.primaryIndustrySubtypeId,
      payload.primaryIndustryCode ?? current.primaryIndustryCode,
      payload.primaryIndustrySubtypeCode ?? current.primaryIndustrySubtypeCode,
      normalizedChannelName,
      normalizedChannelUrl,
      payload.activityRegionId ?? current.activityRegionId,
      payload.feedRegionId ?? current.feedRegionId,
      profileId,
      normalizedChannelCode
    )

    return this.getProfile(profileId)
  }

  updateBusinessRegistrationNumber(
    userId: number,
    profileId: number,
    channelCode: string,
    payload: {
      businessRegistrationNumber?: string | null
    }
  ) {
    this.assertProfileOwnershipWithChannel(userId, profileId, channelCode)

    const normalizedBusinessRegistrationNumber =
      payload.businessRegistrationNumber?.trim() ?? ''

    if (!normalizedBusinessRegistrationNumber) {
      throw new BadRequestException('businessRegistrationNumber missing')
    }

    const result = db.prepare(`
      UPDATE profiles
      SET
        businessRegistrationNumber = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
    `).run(
      normalizedBusinessRegistrationNumber,
      profileId,
      channelCode.trim()
    )

    if (result.changes < 1) {
      throw new NotFoundException('Business profile not found')
    }

    return {
      ok: true,
      businessRegistrationNumber: normalizedBusinessRegistrationNumber
    }
  }

  updateContactSettings(
    userId: number,
    profileId: number,
    channelCode: string,
    payload: {
      contactPhone?: string | null
      secondaryPhone?: string | null
      faxNumber?: string | null
      managerEmail?: string | null
    }
  ) {
    this.assertProfileOwnershipWithChannel(userId, profileId, channelCode)

    const current = this.getProfile(profileId)

    const normalizeOptionalText = (
      value: string | null | undefined,
      fallback: string | null
    ) => {
      if (value === undefined) {
        return fallback
      }

      return value?.trim() || null
    }

    db.prepare(`
      UPDATE profiles
      SET
        contactPhone = ?,
        secondaryPhone = ?,
        faxNumber = ?,
        managerEmail = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
    `).run(
      normalizeOptionalText(payload.contactPhone, current.contactPhone),
      normalizeOptionalText(payload.secondaryPhone, current.secondaryPhone),
      normalizeOptionalText(payload.faxNumber, current.faxNumber),
      normalizeOptionalText(payload.managerEmail, current.managerEmail),
      profileId,
      channelCode.trim()
    )

    return this.getProfile(profileId)
  }

  async updateOperationPassword(
    userId: number,
    profileId: number,
    channelCode: string,
    payload: {
      currentPassword?: string | null
      settlementApprovalPassword?: string | null
      newPassword?: string | null
      confirmNewPassword?: string | null
    }
  ) {
    this.assertProfileOwnershipWithChannel(userId, profileId, channelCode)

    const passwordRow = this.getProfilePasswordRow(profileId, channelCode)
    const currentPassword = payload.currentPassword?.trim() ?? ''
    const settlementApprovalPassword =
      payload.settlementApprovalPassword?.trim() ?? ''
    const newPassword = payload.newPassword?.trim() ?? ''
    const confirmNewPassword = payload.confirmNewPassword?.trim() ?? ''

    if (!currentPassword || !settlementApprovalPassword || !newPassword || !confirmNewPassword) {
      throw new BadRequestException('password fields missing')
    }

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('password confirmation mismatch')
    }

    if (
      passwordRow.loginPasswordHash &&
      !(await bcrypt.compare(currentPassword, passwordRow.loginPasswordHash))
    ) {
      throw new BadRequestException('current password mismatch')
    }

    if (
      passwordRow.paymentPasswordHash &&
      !(await bcrypt.compare(settlementApprovalPassword, passwordRow.paymentPasswordHash))
    ) {
      throw new BadRequestException('settlement password mismatch')
    }

    const loginPasswordHash = await bcrypt.hash(newPassword, 10)

    db.prepare(`
      UPDATE profiles
      SET
        loginPasswordHash = ?,
        loginPasswordSetAt = COALESCE(loginPasswordSetAt, CURRENT_TIMESTAMP),
        loginPasswordUpdatedAt = CURRENT_TIMESTAMP,
        loginPasswordFailCount = 0,
        loginPasswordLockedUntil = NULL,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
    `).run(
      loginPasswordHash,
      profileId,
      channelCode.trim()
    )

    return {
      ok: true,
      loginPasswordStatus: 'SET'
    }
  }

  async updatePaymentPassword(
    userId: number,
    profileId: number,
    channelCode: string,
    payload: {
      paymentPassword?: string | null
      confirmPaymentPassword?: string | null
    }
  ) {
    this.assertProfileOwnershipWithChannel(userId, profileId, channelCode)

    const paymentPassword = payload.paymentPassword?.trim() ?? ''
    const confirmPaymentPassword = payload.confirmPaymentPassword?.trim() ?? ''

    if (!paymentPassword || !confirmPaymentPassword) {
      throw new BadRequestException('payment password fields missing')
    }

    if (paymentPassword !== confirmPaymentPassword) {
      throw new BadRequestException('payment password confirmation mismatch')
    }

    const paymentPasswordHash = await bcrypt.hash(paymentPassword, 10)

    db.prepare(`
      UPDATE profiles
      SET
        paymentPasswordHash = ?,
        paymentPasswordSetAt = COALESCE(paymentPasswordSetAt, CURRENT_TIMESTAMP),
        paymentPasswordUpdatedAt = CURRENT_TIMESTAMP,
        paymentPasswordFailCount = 0,
        paymentPasswordLockedUntil = NULL,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
    `).run(
      paymentPasswordHash,
      profileId,
      channelCode.trim()
    )

    return {
      ok: true,
      paymentPasswordStatus: 'SET'
    }
  }

  replaceProfileBlocks(userId: number, profileId: number, blocks: Array<{
    blockType: string
    title?: string | null
    content?: string | null
    linkUrl?: string | null
    sortOrder: number
    isActive?: number | null
  }>) {
    this.assertProfileOwnership(userId, profileId)

    db.prepare(`
      DELETE FROM profile_blocks
      WHERE profileId = ?
    `).run(profileId)

    const statement = db.prepare(`
      INSERT INTO profile_blocks(
        profileId,
        type,
        title,
        content,
        url,
        description,
        sortOrder,
        isActive,
        createdAt,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)

    for (const block of blocks) {
      statement.run(
        profileId,
        block.blockType,
        block.title ?? null,
        block.content ?? null,
        block.linkUrl ?? null,
        null,
        block.sortOrder,
        block.isActive ?? 1
      )
    }

    return this.getProfileBlocks(profileId)
  }

  updateProfileHours(
    userId: number,
    profileId: number,
    payload: { weeklyHours: BusinessHoursDayPayload[] }
  ) {
    this.assertProfileOwnership(userId, profileId)

    const weeklyHours = Array.isArray(payload.weeklyHours)
      ? payload.weeklyHours
      : []

    if (weeklyHours.length !== 7) {
      throw new BadRequestException('invalid weeklyHours')
    }

    const getDay = (dayKey: BusinessHoursDayKey) => {
      const found = weeklyHours.find((item) => item.dayKey === dayKey)

      if (!found) {
        throw new BadRequestException(`missing dayKey: ${dayKey}`)
      }

      return found
    }

    const mon = getDay('MON')
    const tue = getDay('TUE')
    const wed = getDay('WED')
    const thu = getDay('THU')
    const fri = getDay('FRI')
    const sat = getDay('SAT')
    const sun = getDay('SUN')

    const exists = this.getBusinessHoursRow(profileId)
    const channelCode = this.getChannelCode(profileId)

    if (exists) {
      db.prepare(`
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
          updatedAt = CURRENT_TIMESTAMP
        WHERE profileId = ?
      `).run(
        channelCode,
        mon.isClosed ? 1 : 0,
        mon.openTime,
        mon.closeTime,
        tue.isClosed ? 1 : 0,
        tue.openTime,
        tue.closeTime,
        wed.isClosed ? 1 : 0,
        wed.openTime,
        wed.closeTime,
        thu.isClosed ? 1 : 0,
        thu.openTime,
        thu.closeTime,
        fri.isClosed ? 1 : 0,
        fri.openTime,
        fri.closeTime,
        sat.isClosed ? 1 : 0,
        sat.openTime,
        sat.closeTime,
        sun.isClosed ? 1 : 0,
        sun.openTime,
        sun.closeTime,
        profileId
      )
    } else {
      db.prepare(`
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
          createdAt,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        profileId,
        channelCode,
        mon.isClosed ? 1 : 0,
        mon.openTime,
        mon.closeTime,
        tue.isClosed ? 1 : 0,
        tue.openTime,
        tue.closeTime,
        wed.isClosed ? 1 : 0,
        wed.openTime,
        wed.closeTime,
        thu.isClosed ? 1 : 0,
        thu.openTime,
        thu.closeTime,
        fri.isClosed ? 1 : 0,
        fri.openTime,
        fri.closeTime,
        sat.isClosed ? 1 : 0,
        sat.openTime,
        sat.closeTime,
        sun.isClosed ? 1 : 0,
        sun.openTime,
        sun.closeTime
      )
    }

    return this.getBusinessHoursRow(profileId)
  }
}

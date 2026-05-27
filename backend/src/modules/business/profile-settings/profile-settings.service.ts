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
  customDomain: string | null
  enabledFulfillmentTypes: FulfillmentTypeCode[]
  localDeliveryRegions: LocalDeliveryRegionPayload[]
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
  placeFeedTypeCode: PlaceFeedTypeCode | null
  createdAt: string
  updatedAt: string | null
}

type PlaceFeedTypeCode =
  | 'NORMAL'
  | 'CLASSIC'
  | 'MARKET'
  | 'FOOD'
  | 'BEAUTY'
  | 'CULTURE'
  | 'STAY'
  | 'RENTCAR'

type FulfillmentTypeCode =
  | 'NONE'
  | 'LOCAL_DELIVERY'
  | 'QUICK_SERVICE'
  | 'SHIPPING'
  | 'PICKUP'

type BusinessProfilePasswordRow = {
  loginPasswordHash: string | null
  paymentPasswordHash: string | null
}

type ProfileCustomDomainRow = {
  id: number
  profile_id: number
  channel_code: string
  custom_domain: string
  domain_status: 'PENDING' | 'ACTIVE' | 'FAILED' | 'DISABLED'
  is_primary: number
  is_active: number
  verified_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type ResolvedCustomDomainPayload = {
  channelCode: string
  profileId: number
  domainStatus: ProfileCustomDomainRow['domain_status']
  isActive: boolean
}

type ProfileCustomDomainPayload = {
  id: number
  profileId: number
  channelCode: string
  customDomain: string
  domainStatus: ProfileCustomDomainRow['domain_status']
  isPrimary: boolean
  isActive: boolean
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type MarketFulfillmentSettingRow = {
  id: number
  profile_id: number
  channel_code: string
  fulfillment_type: FulfillmentTypeCode
  is_enabled: number
  is_default: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type BusinessLocalDeliveryRegionRow = {
  id: number
  profile_id: number
  channel_code: string
  region_name: string
  region_code: string | null
  delivery_fee: number
  minimum_order_amount: number
  sort_order: number
  is_enabled: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type LocalDeliveryRegionPayload = {
  id?: number
  regionName: string
  regionCode: string | null
  deliveryFee: number
  minimumOrderAmount: number
  sortOrder: number
  isEnabled: boolean
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

  private normalizePlaceFeedTypeCode(
    placeFeedTypeCode: unknown,
    fallback: PlaceFeedTypeCode | null
  ): PlaceFeedTypeCode | null {
    if (placeFeedTypeCode === undefined) {
      return fallback
    }

    if (placeFeedTypeCode === null) {
      return fallback
    }

    if (typeof placeFeedTypeCode !== 'string') {
      throw new BadRequestException('invalid placeFeedTypeCode')
    }

    const normalizedPlaceFeedTypeCode =
      placeFeedTypeCode.trim().toUpperCase()

    if (
      normalizedPlaceFeedTypeCode === 'NORMAL' ||
      normalizedPlaceFeedTypeCode === 'CLASSIC' ||
      normalizedPlaceFeedTypeCode === 'MARKET' ||
      normalizedPlaceFeedTypeCode === 'FOOD' ||
      normalizedPlaceFeedTypeCode === 'BEAUTY' ||
      normalizedPlaceFeedTypeCode === 'CULTURE' ||
      normalizedPlaceFeedTypeCode === 'STAY' ||
      normalizedPlaceFeedTypeCode === 'RENTCAR'
    ) {
      return normalizedPlaceFeedTypeCode
    }

    throw new BadRequestException('invalid placeFeedTypeCode')
  }

  private normalizeCustomDomain(customDomain: unknown): string | null {
    if (customDomain === undefined) {
      return null
    }

    if (customDomain === null) {
      return ''
    }

    if (typeof customDomain !== 'string') {
      throw new BadRequestException('올바른 도메인 형식을 입력해주세요.')
    }

    const normalizedCustomDomain =
      customDomain.trim().toLowerCase()

    if (!normalizedCustomDomain) {
      return ''
    }

    if (customDomain !== customDomain.trim()) {
      throw new BadRequestException('올바른 도메인 형식을 입력해주세요.')
    }

    const domainPattern =
      /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

    if (!domainPattern.test(normalizedCustomDomain)) {
      throw new BadRequestException('올바른 도메인 형식을 입력해주세요.')
    }

    return normalizedCustomDomain
  }

  private normalizeFulfillmentTypes(
    enabledFulfillmentTypes: unknown
  ): FulfillmentTypeCode[] {
    const allowedTypes: FulfillmentTypeCode[] = [
      'NONE',
      'LOCAL_DELIVERY',
      'QUICK_SERVICE',
      'SHIPPING',
      'PICKUP'
    ]

    if (
      enabledFulfillmentTypes === undefined ||
      enabledFulfillmentTypes === null
    ) {
      return ['NONE']
    }

    if (!Array.isArray(enabledFulfillmentTypes)) {
      throw new BadRequestException('invalid enabledFulfillmentTypes')
    }

    const normalizedTypes =
      enabledFulfillmentTypes
        .map((value) => {
          return typeof value === 'string'
            ? value.trim().toUpperCase()
            : ''
        })
        .filter((value) => Boolean(value))

    if (normalizedTypes.length < 1) {
      return ['NONE']
    }

    for (const type of normalizedTypes) {
      if (!allowedTypes.includes(type as FulfillmentTypeCode)) {
        throw new BadRequestException('invalid enabledFulfillmentTypes')
      }
    }

    if (normalizedTypes.includes('NONE')) {
      return ['NONE']
    }

    const uniqueTypes =
      Array.from(new Set(normalizedTypes)) as FulfillmentTypeCode[]

    return uniqueTypes.length > 0
      ? uniqueTypes
      : ['NONE']
  }

  private normalizeLocalDeliveryRegions(
    localDeliveryRegions: unknown
  ): LocalDeliveryRegionPayload[] {
    if (
      localDeliveryRegions === undefined ||
      localDeliveryRegions === null
    ) {
      return []
    }

    if (!Array.isArray(localDeliveryRegions)) {
      throw new BadRequestException('invalid localDeliveryRegions')
    }

    const seenRegionNames = new Set<string>()

    return localDeliveryRegions.map((region, index) => {
      if (!region || typeof region !== 'object') {
        throw new BadRequestException('invalid localDeliveryRegions')
      }

      const regionPayload =
        region as Record<string, unknown>
      const regionName =
        typeof regionPayload.regionName === 'string'
          ? regionPayload.regionName.trim()
          : ''

      if (!regionName || regionName.length > 100) {
        throw new BadRequestException('배달 가능 지역명을 입력해 주세요.')
      }

      const regionNameKey =
        regionName.toLowerCase()

      if (seenRegionNames.has(regionNameKey)) {
        throw new BadRequestException('같은 배달 가능 지역이 중복되었습니다.')
      }

      seenRegionNames.add(regionNameKey)

      const regionCode =
        typeof regionPayload.regionCode === 'string'
          ? regionPayload.regionCode.trim() || null
          : null

      const deliveryFee =
        Number(regionPayload.deliveryFee ?? 0)
      const minimumOrderAmount =
        Number(regionPayload.minimumOrderAmount ?? 0)

      if (
        !Number.isFinite(deliveryFee) ||
        deliveryFee < 0 ||
        !Number.isInteger(deliveryFee)
      ) {
        throw new BadRequestException('배달비는 0 이상 숫자만 입력해 주세요.')
      }

      if (
        !Number.isFinite(minimumOrderAmount) ||
        minimumOrderAmount < 0 ||
        !Number.isInteger(minimumOrderAmount)
      ) {
        throw new BadRequestException('최소주문금액은 0 이상 숫자만 입력해 주세요.')
      }

      return {
        regionName,
        regionCode,
        deliveryFee,
        minimumOrderAmount,
        sortOrder: index + 1,
        isEnabled: regionPayload.isEnabled !== false
      }
    })
  }

  private mapProfileCustomDomain(
    row: ProfileCustomDomainRow
  ): ProfileCustomDomainPayload {
    return {
      id: row.id,
      profileId: row.profile_id,
      channelCode: row.channel_code,
      customDomain: row.custom_domain,
      domainStatus: row.domain_status,
      isPrimary: row.is_primary === 1,
      isActive: row.is_active === 1,
      verifiedAt: row.verified_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    }
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
        (
          SELECT custom_domain
          FROM profile_custom_domains
          WHERE profile_id = profiles.id
            AND channel_code = profiles.channelCode
            AND is_primary = 1
            AND is_active = 1
            AND deleted_at IS NULL
          ORDER BY id DESC
          LIMIT 1
        ) AS customDomain,
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
        placeFeedTypeCode,
        createdAt,
        updatedAt
      FROM profiles
      WHERE id = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId) as Omit<
      BusinessProfileRow,
      'enabledFulfillmentTypes' | 'localDeliveryRegions'
    > | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found')
    }

    return {
      ...row,
      enabledFulfillmentTypes: this.getEnabledFulfillmentTypes(
        row.id,
        row.channelCode
      ),
      localDeliveryRegions: this.getLocalDeliveryRegions(
        row.id,
        row.channelCode
      )
    }
  }

  getEnabledFulfillmentTypes(
    profileId: number,
    channelCode: string
  ): FulfillmentTypeCode[] {
    this.assertProfileId(profileId)

    const rows = db.prepare(`
      SELECT *
      FROM market_fulfillment_settings
      WHERE profile_id = ?
        AND channel_code = ?
        AND is_enabled = 1
        AND deleted_at IS NULL
      ORDER BY is_default DESC, id ASC
    `).all(
      profileId,
      channelCode
    ) as MarketFulfillmentSettingRow[]

    const fulfillmentTypes =
      rows.map((row) => row.fulfillment_type)

    return fulfillmentTypes.length > 0
      ? fulfillmentTypes
      : ['NONE']
  }

  getLocalDeliveryRegions(
    profileId: number,
    channelCode: string
  ): LocalDeliveryRegionPayload[] {
    this.assertProfileId(profileId)

    const rows = db.prepare(`
      SELECT *
      FROM business_local_delivery_regions
      WHERE profile_id = ?
        AND channel_code = ?
        AND deleted_at IS NULL
      ORDER BY sort_order ASC, id ASC
    `).all(
      profileId,
      channelCode
    ) as BusinessLocalDeliveryRegionRow[]

    return rows.map((row) => ({
      id: row.id,
      regionName: row.region_name,
      regionCode: row.region_code,
      deliveryFee: row.delivery_fee,
      minimumOrderAmount: row.minimum_order_amount,
      sortOrder: row.sort_order,
      isEnabled: row.is_enabled === 1
    }))
  }

  getPrimaryCustomDomain(
    profileId: number,
    channelCode: string
  ): ProfileCustomDomainRow | null {
    this.assertProfileId(profileId)

    const row = db.prepare(`
      SELECT *
      FROM profile_custom_domains
      WHERE profile_id = ?
        AND channel_code = ?
        AND is_primary = 1
        AND is_active = 1
        AND deleted_at IS NULL
      ORDER BY id DESC
      LIMIT 1
    `).get(
      profileId,
      channelCode
    ) as ProfileCustomDomainRow | undefined

    return row ?? null
  }

  resolveCustomDomain(
    customDomain: string
  ): ResolvedCustomDomainPayload | null {
    const normalizedCustomDomain =
      this.normalizeCustomDomain(customDomain)

    if (!normalizedCustomDomain) {
      return null
    }

    const row = db.prepare(`
      SELECT *
      FROM profile_custom_domains
      WHERE custom_domain = ?
        AND deleted_at IS NULL
      ORDER BY is_primary DESC, id DESC
      LIMIT 1
    `).get(normalizedCustomDomain) as ProfileCustomDomainRow | undefined

    if (!row) {
      return null
    }

    return {
      channelCode: row.channel_code,
      profileId: row.profile_id,
      domainStatus: row.domain_status,
      isActive: row.is_active === 1
    }
  }

  getProfileCustomDomains(
    userId: number,
    profileId: number,
    channelCode: string
  ): ProfileCustomDomainPayload[] {
    this.assertProfileOwnershipWithChannel(userId, profileId, channelCode)

    const rows = db.prepare(`
      SELECT *
      FROM profile_custom_domains
      WHERE profile_id = ?
        AND channel_code = ?
        AND deleted_at IS NULL
      ORDER BY is_primary DESC, id DESC
    `).all(
      profileId,
      channelCode.trim()
    ) as ProfileCustomDomainRow[]

    return rows.map((row) => this.mapProfileCustomDomain(row))
  }

  connectCustomDomain(
    userId: number,
    profileId: number,
    channelCode: string,
    customDomain: unknown
  ): ProfileCustomDomainPayload[] {
    this.assertProfileOwnershipWithChannel(userId, profileId, channelCode)

    this.saveCustomDomain(
      profileId,
      channelCode.trim(),
      customDomain
    )

    return this.getProfileCustomDomains(
      userId,
      profileId,
      channelCode
    )
  }

  disconnectCustomDomain(
    userId: number,
    profileId: number,
    channelCode: string,
    domainId: number
  ): ProfileCustomDomainPayload[] {
    this.assertProfileOwnershipWithChannel(userId, profileId, channelCode)

    if (!domainId) {
      throw new BadRequestException('domainId missing')
    }

    db.prepare(`
      UPDATE profile_custom_domains
      SET
        is_active = 0,
        domain_status = 'DISABLED',
        updated_at = CURRENT_TIMESTAMP,
        deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP)
      WHERE id = ?
        AND profile_id = ?
        AND channel_code = ?
        AND deleted_at IS NULL
    `).run(
      domainId,
      profileId,
      channelCode.trim()
    )

    return this.getProfileCustomDomains(
      userId,
      profileId,
      channelCode
    )
  }

  private saveCustomDomain(
    profileId: number,
    channelCode: string,
    customDomain: unknown
  ) {
    if (customDomain === undefined) {
      return
    }

    const normalizedCustomDomain =
      this.normalizeCustomDomain(customDomain)

    if (!normalizedCustomDomain) {
      db.prepare(`
        UPDATE profile_custom_domains
        SET
          is_active = 0,
          domain_status = 'DISABLED',
          updated_at = CURRENT_TIMESTAMP,
          deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP)
        WHERE profile_id = ?
          AND channel_code = ?
          AND is_primary = 1
          AND deleted_at IS NULL
      `).run(
        profileId,
        channelCode
      )

      return
    }

    const duplicate = db.prepare(`
      SELECT channel_code
      FROM profile_custom_domains
      WHERE custom_domain = ?
        AND channel_code <> ?
        AND deleted_at IS NULL
      LIMIT 1
    `).get(
      normalizedCustomDomain,
      channelCode
    ) as { channel_code: string } | undefined

    if (duplicate) {
      throw new BadRequestException('이미 다른 채널에서 사용 중인 도메인입니다.')
    }

    const current =
      this.getPrimaryCustomDomain(profileId, channelCode)

    if (current) {
      db.prepare(`
        UPDATE profile_custom_domains
        SET
          custom_domain = ?,
          domain_status = 'PENDING',
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP,
          deleted_at = NULL
        WHERE id = ?
      `).run(
        normalizedCustomDomain,
        current.id
      )

      return
    }

    db.prepare(`
      INSERT INTO profile_custom_domains(
        profile_id,
        channel_code,
        custom_domain,
        domain_status,
        is_primary,
        is_active,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, 'PENDING', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      profileId,
      channelCode,
      normalizedCustomDomain
    )
  }

  private saveFulfillmentTypes(
    profileId: number,
    channelCode: string,
    enabledFulfillmentTypes: unknown
  ) {
    if (enabledFulfillmentTypes === undefined) {
      return
    }

    const nextFulfillmentTypes =
      this.normalizeFulfillmentTypes(enabledFulfillmentTypes)

    db.prepare(`
      UPDATE market_fulfillment_settings
      SET
        is_enabled = 0,
        updated_at = CURRENT_TIMESTAMP,
        deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP)
      WHERE profile_id = ?
        AND channel_code = ?
        AND deleted_at IS NULL
    `).run(
      profileId,
      channelCode
    )

    for (const [index, fulfillmentType] of nextFulfillmentTypes.entries()) {
      db.prepare(`
        INSERT INTO market_fulfillment_settings(
          profile_id,
          channel_code,
          fulfillment_type,
          is_enabled,
          is_default,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        profileId,
        channelCode,
        fulfillmentType,
        index === 0 ? 1 : 0
      )
    }
  }

  private saveLocalDeliveryRegions(
    profileId: number,
    channelCode: string,
    enabledFulfillmentTypes: FulfillmentTypeCode[],
    localDeliveryRegions: unknown
  ) {
    if (localDeliveryRegions === undefined) {
      return
    }

    if (!enabledFulfillmentTypes.includes('LOCAL_DELIVERY')) {
      return
    }

    const nextRegions =
      this.normalizeLocalDeliveryRegions(localDeliveryRegions)

    db.prepare(`
      UPDATE business_local_delivery_regions
      SET
        is_enabled = 0,
        updated_at = CURRENT_TIMESTAMP,
        deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP)
      WHERE profile_id = ?
        AND channel_code = ?
        AND deleted_at IS NULL
    `).run(
      profileId,
      channelCode
    )

    for (const region of nextRegions) {
      db.prepare(`
        INSERT INTO business_local_delivery_regions(
          profile_id,
          channel_code,
          region_name,
          region_code,
          delivery_fee,
          minimum_order_amount,
          sort_order,
          is_enabled,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        profileId,
        channelCode,
        region.regionName,
        region.regionCode,
        region.deliveryFee,
        region.minimumOrderAmount,
        region.sortOrder,
        region.isEnabled ? 1 : 0
      )
    }
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
    customDomain?: string | null
    enabledFulfillmentTypes?: string[] | null
    localDeliveryRegions?: unknown
    placeFeedTypeCode?: string | null
  }) {
    this.assertProfileOwnershipWithChannel(userId, profileId, channelCode)

    const current = this.getProfile(profileId)
    const nextPlaceFeedTypeCode =
      this.normalizePlaceFeedTypeCode(
        payload.placeFeedTypeCode,
        current.placeFeedTypeCode ?? 'NORMAL'
      )
    const nextFulfillmentTypes =
      payload.enabledFulfillmentTypes === undefined
        ? current.enabledFulfillmentTypes
        : this.normalizeFulfillmentTypes(payload.enabledFulfillmentTypes)

    db.prepare(`
      UPDATE profiles
      SET
        displayName = ?,
        placeFeedTypeCode = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileType = 'BUSINESS'
    `).run(
      payload.displayName ?? current.displayName,
      nextPlaceFeedTypeCode,
      profileId
    )

    this.saveCustomDomain(
      profileId,
      current.channelCode,
      payload.customDomain
    )

    this.saveFulfillmentTypes(
      profileId,
      current.channelCode,
      payload.enabledFulfillmentTypes
    )

    this.saveLocalDeliveryRegions(
      profileId,
      current.channelCode,
      nextFulfillmentTypes,
      payload.localDeliveryRegions
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

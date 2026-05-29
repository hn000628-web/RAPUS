// FILE : backend/src/modules/business/business-profile.service.ts
// ROOT : backend/src/modules/business/business-profile.service.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS MAIN PROFILE DETAIL READ SERVICE
// CHANGE SUMMARY :
// - business-profile.service.ts를 BUSINESS 메인 프로필 detail 전용 read 서비스로 유지
// - 프론트 business/page.tsx가 사용하는 channelCode 기반 detail 응답 계약 유지
// - profile / industry / placeMeta / infoBlocks / media.avatar / media.heroImages 조립 유지
// - avatar / hero imageUrl 을 원시 filePath 반환이 아닌 backend media 절대 URL로 보정
// - BACKEND_URL 또는 MEDIA_BASE_URL 끝의 /api 자동 제거 처리 유지
// - /api/media 또는 api/media 형태 filePath 입력도 /media 기준으로 정규화 추가
// - service only DB access 구조 유지

import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common'

import db from '../../config/database'

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
  | 'ONLINE_SHOP'
  | 'FOOD'
  | 'BEAUTY'
  | 'CULTURE'
  | 'STAY'
  | 'RENTCAR'

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

type IndustryRow = {
  id: number | null
  code: string | null
  name: string | null
  description: string | null
}

type IndustrySubtypeRow = {
  id: number | null
  code: string | null
  name: string | null
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

type BusinessIndustryPayload = {
  primaryIndustryId: number | null
  primaryIndustrySubtypeId: number | null
  primaryIndustryCode: string | null
  primaryIndustrySubtypeCode: string | null
  industry: IndustryRow | null
  industrySubtype: IndustrySubtypeRow | null
}

type BusinessPlaceMetaPayload = {
  contactPhone: string | null
  activityRegionId: number | null
  feedRegionId: number | null
  detailAddress: string | null
  bio: string | null
  activityRegion: RegionRow | null
  feedRegion: RegionRow | null
}

type BusinessProfileSummaryPayload = {
  profile: BusinessProfileRow
  industry: BusinessIndustryPayload
  placeMeta: BusinessPlaceMetaPayload
  infoBlocks: ProfileBlockRow[]
}

type BusinessProfileDetailPayload = {
  profile: BusinessProfileRow
  industry: BusinessIndustryPayload
  placeMeta: BusinessPlaceMetaPayload
  infoBlocks: ProfileBlockRow[]
  media: {
    avatar: BusinessAvatarRow | null
    heroImages: BusinessHeroImageRow[]
  }
}

// SECTION 02 : SERVICE

@Injectable()
export class BusinessProfileService {
  // SECTION 03 : CORE VALIDATION

  private normalizeRequiredChannelCode(
    channelCode: string
  ): string {
    if (typeof channelCode !== 'string') {
      throw new BadRequestException('channelCode missing')
    }

    const normalizedChannelCode = channelCode.trim()

    if (!normalizedChannelCode) {
      throw new BadRequestException('channelCode missing')
    }

    return normalizedChannelCode
  }

  private assertBusinessChannelCode(
    channelCode: string
  ): void {
    const normalizedChannelCode =
      this.normalizeRequiredChannelCode(channelCode)

    const row = db.prepare(`
      SELECT
        id
      FROM profiles
      WHERE channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(normalizedChannelCode) as { id: number } | undefined

    if (!row) {
      throw new NotFoundException('Business channel not found')
    }
  }

  private buildMediaUrl(
    filePath?: string | null
  ): string | null {
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

    const rawBaseUrl =
      process.env.MEDIA_BASE_URL?.trim() ||
      process.env.BACKEND_URL?.trim() ||
      `http://localhost:${process.env.PORT || 4000}`

    const normalizedBaseUrl = rawBaseUrl
      .replace(/\/+$/, '')
      .replace(/\/api$/, '')

    if (trimmed.startsWith('/api/media/')) {
      return `${normalizedBaseUrl}${trimmed.replace(/^\/api\/media\//, '/media/')}`
    }

    if (trimmed.startsWith('/media/')) {
      return `${normalizedBaseUrl}${trimmed}`
    }

    if (trimmed.startsWith('/uploads/')) {
      return `${normalizedBaseUrl}${trimmed.replace(/^\/uploads\//, '/media/')}`
    }

    if (trimmed.startsWith('/')) {
      return `${normalizedBaseUrl}${trimmed.replace(/^\/api\//, '/')}`
    }

    if (trimmed.startsWith('api/media/')) {
      return `${normalizedBaseUrl}/${trimmed.replace(/^api\/media\//, 'media/')}`
    }

    return `${normalizedBaseUrl}/media/${trimmed.replace(/^\/+/, '')}`
  }

  // SECTION 04 : PROFILE CORE READ

  getBusinessProfileByChannelCode(
    channelCode: string
  ): BusinessProfileRow {
    const normalizedChannelCode =
      this.normalizeRequiredChannelCode(channelCode)

    this.assertBusinessChannelCode(normalizedChannelCode)

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
      WHERE channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(normalizedChannelCode) as BusinessProfileRow | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found')
    }

    return row
  }

  private getBusinessRegion(
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

  // SECTION 05 : PROFILE SUB PAYLOAD BUILDERS

  private getBusinessIndustryByProfile(
    profile: BusinessProfileRow
  ): BusinessIndustryPayload {
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
          `).get(profile.primaryIndustryId) as IndustryRow | undefined
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
          `).get(profile.primaryIndustrySubtypeId) as IndustrySubtypeRow | undefined
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

  private getBusinessPlaceMetaByProfile(
    profile: BusinessProfileRow
  ): BusinessPlaceMetaPayload {
    return {
      contactPhone: profile.contactPhone,
      activityRegionId: profile.activityRegionId,
      feedRegionId: profile.feedRegionId,
      detailAddress: profile.detailAddress,
      bio: profile.bio,
      activityRegion: this.getBusinessRegion(profile.activityRegionId),
      feedRegion: this.getBusinessRegion(profile.feedRegionId)
    }
  }

  private getBusinessInfoBlocksByProfile(
    profile: BusinessProfileRow
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
    `).all(profile.id) as ProfileBlockRow[]
  }

  // SECTION 06 : MEDIA READ

  private getBusinessAvatarByProfile(
    profile: BusinessProfileRow
  ): BusinessAvatarRow | null {
    const row = db.prepare(`
      SELECT
        pa.id,
        pa.profileId,
        pa.channelCode,
        pa.imageAssetId,
        COALESCE(pa.filePath, ia.filePath) AS filePath,
        pa.isActive,
        pa.createdAt
      FROM profile_avatars pa
      LEFT JOIN image_assets ia
        ON pa.imageAssetId = ia.id
      WHERE pa.profileId = ?
        AND pa.channelCode = ?
        AND COALESCE(pa.isActive, 1) = 1
      ORDER BY pa.id DESC
      LIMIT 1
    `).get(
      profile.id,
      profile.channelCode
    ) as Omit<BusinessAvatarRow, 'imageUrl'> | undefined

    if (!row) {
      return null
    }

    return {
      ...row,
      imageUrl: this.buildMediaUrl(row.filePath)
    }
  }

  private getBusinessHeroImagesByProfile(
    profile: BusinessProfileRow
  ): BusinessHeroImageRow[] {
    const rows = db.prepare(`
      SELECT
        ph.id,
        ph.profileId,
        ph.channelCode,
        ph.imageAssetId,
        COALESCE(ia.filePath, ph.externalUrl) AS filePath,
        ph.sortOrder,
        ph.createdAt
      FROM profile_hero_images ph
      LEFT JOIN image_assets ia
        ON ph.imageAssetId = ia.id
      WHERE ph.profileId = ?
        AND ph.channelCode = ?
        AND COALESCE(ph.isActive, 1) = 1
      ORDER BY ph.sortOrder ASC, ph.id ASC
    `).all(
      profile.id,
      profile.channelCode
    ) as Array<{
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

  // SECTION 07 : SUMMARY / DETAIL READ

  getBusinessProfileSummaryByChannelCode(
    channelCode: string
  ): BusinessProfileSummaryPayload {
    const profile =
      this.getBusinessProfileByChannelCode(channelCode)

    return {
      profile,
      industry: this.getBusinessIndustryByProfile(profile),
      placeMeta: this.getBusinessPlaceMetaByProfile(profile),
      infoBlocks: this.getBusinessInfoBlocksByProfile(profile)
    }
  }

  getBusinessProfileDetailByChannelCode(
    channelCode: string
  ): BusinessProfileDetailPayload {
    const profile =
      this.getBusinessProfileByChannelCode(channelCode)

    return {
      profile,
      industry: this.getBusinessIndustryByProfile(profile),
      placeMeta: this.getBusinessPlaceMetaByProfile(profile),
      infoBlocks: this.getBusinessInfoBlocksByProfile(profile),
      media: {
        avatar: this.getBusinessAvatarByProfile(profile),
        heroImages: this.getBusinessHeroImagesByProfile(profile)
      }
    }
  }
}

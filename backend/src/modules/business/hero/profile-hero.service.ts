// FILE : backend/src/modules/business/hero/profile-hero.service.ts
// ROOT : backend/src/modules/business/hero/profile-hero.service.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE HERO SERVICE
// CHANGE SUMMARY :
// - BUSINESS 커버/히어로 relation 전용 service 유지
// - profile_hero_images + image_assets 기준 hero 조회/연결/수정/삭제 처리 유지
// - profileId + channelCode 단일 귀속 검증 유지
// - media upload → assetId 반환 → hero connect 분리 구조 유지
// - imageUrl 생성 시 backend origin 기준 절대 URL 반환 유지
// - BACKEND_URL 또는 MEDIA_BASE_URL 끝의 /api 자동 제거 처리 유지
// - /api/media 또는 api/media 형태 filePath 입력도 /media 기준으로 정규화 추가
// - DB 접근은 service only 구조 유지

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'

import db from '../../../config/database'

// SECTION 01 : TYPE

type BusinessProfileRow = {
  id: number
  userId: number
  profileType: 'BUSINESS'
  channelCode: string
}

type BusinessHeroRow = {
  id: number
  profileId: number
  channelCode: string | null
  imageAssetId: number | null
  externalUrl: string | null
  title: string | null
  description: string | null
  linkUrl: string | null
  sortOrder: number
  isActive: number | null
  filePath: string | null
  imageUrl: string | null
  createdAt: string | null
  updatedAt: string | null
}

type ImageAssetRow = {
  id: number
  channelCode: string
  usageType: string
  filePath: string | null
}

type ConnectProfileHeroPayload = {
  channelCode: string
  imageAssetId?: number | null
  externalUrl?: string | null
  title?: string | null
  description?: string | null
  linkUrl?: string | null
  sortOrder?: number | null
}

type UpdateProfileHeroPayload = {
  channelCode: string
  title?: string | null
  description?: string | null
  linkUrl?: string | null
  sortOrder?: number | null
  isActive?: number | null
}

type ReorderProfileHeroItem = {
  heroId: number
  sortOrder: number
}

type ReorderProfileHeroPayload = {
  channelCode: string
  items: ReorderProfileHeroItem[]
}

// SECTION 02 : SERVICE

@Injectable()
export class ProfileHeroService {
  private readonly HERO_LIMIT = 5

  // SECTION 03 : SECURITY CORE

  private assertProfileOwnership(
    userId: number,
    profileId: number
  ): void {
    if (!userId || !profileId) {
      throw new BadRequestException('auth invalid')
    }

    const row = db.prepare(`
      SELECT
        id
      FROM profiles
      WHERE id = ?
        AND userId = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(
      profileId,
      userId
    ) as { id: number } | undefined

    if (!row) {
      throw new ForbiddenException('Business profile access denied')
    }
  }

  private assertProfileId(
    profileId: number
  ): void {
    if (!profileId) {
      throw new BadRequestException('profileId missing')
    }

    const row = db.prepare(`
      SELECT
        id
      FROM profiles
      WHERE id = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId) as { id: number } | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found')
    }
  }

  private getProfile(
    profileId: number
  ): BusinessProfileRow {
    this.assertProfileId(profileId)

    const row = db.prepare(`
      SELECT
        id,
        userId,
        profileType,
        channelCode
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

  private assertContextMatch(
    profile: BusinessProfileRow,
    channelCode: string
  ): void {
    const normalizedChannelCode = channelCode?.trim()

    if (!normalizedChannelCode) {
      throw new BadRequestException('channelCode missing')
    }

    if (profile.channelCode !== normalizedChannelCode) {
      throw new BadRequestException('hero channelCode mismatch')
    }
  }

  private getImageAsset(
    imageAssetId: number
  ): ImageAssetRow {
    if (
      typeof imageAssetId !== 'number' ||
      Number.isNaN(imageAssetId) ||
      imageAssetId <= 0
    ) {
      throw new BadRequestException('imageAssetId invalid')
    }

    const row = db.prepare(`
      SELECT
        id,
        channelCode,
        usageType,
        filePath
      FROM image_assets
      WHERE id = ?
      LIMIT 1
    `).get(imageAssetId) as ImageAssetRow | undefined

    if (!row) {
      throw new NotFoundException('Image asset not found')
    }

    return row
  }

  private getHeroRowById(
    heroId: number
  ): BusinessHeroRow {
    if (
      typeof heroId !== 'number' ||
      Number.isNaN(heroId) ||
      heroId <= 0
    ) {
      throw new BadRequestException('heroId invalid')
    }

    const row = db.prepare(`
      SELECT
        ph.id,
        ph.profileId,
        ph.channelCode,
        ph.imageAssetId,
        ph.externalUrl,
        ph.title,
        ph.description,
        ph.linkUrl,
        ph.sortOrder,
        ph.isActive,
        ia.filePath,
        ph.createdAt,
        ph.updatedAt
      FROM profile_hero_images ph
      LEFT JOIN image_assets ia
        ON ia.id = ph.imageAssetId
      WHERE ph.id = ?
      LIMIT 1
    `).get(heroId) as Omit<BusinessHeroRow, 'imageUrl'> | undefined

    if (!row) {
      throw new NotFoundException('Profile hero not found')
    }

    return {
      ...row,
      imageUrl: row.externalUrl || this.buildMediaUrl(row.filePath)
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

  private normalizeNullableText(
    value?: string | null
  ): string | null {
    if (value === null || value === undefined) {
      return null
    }

    const trimmed = value.trim()

    return trimmed.length > 0
      ? trimmed
      : null
  }

  private normalizeSortOrder(
    sortOrder?: number | null
  ): number {
    if (
      typeof sortOrder !== 'number' ||
      Number.isNaN(sortOrder) ||
      sortOrder <= 0
    ) {
      return 1
    }

    return Math.floor(sortOrder)
  }

  private validateHeroSource(
    imageAssetId?: number | null,
    externalUrl?: string | null
  ): void {
    const hasImageAssetId =
      typeof imageAssetId === 'number' &&
      !Number.isNaN(imageAssetId) &&
      imageAssetId > 0

    const normalizedExternalUrl =
      this.normalizeNullableText(externalUrl)

    const hasExternalUrl =
      typeof normalizedExternalUrl === 'string' &&
      normalizedExternalUrl.length > 0

    if (!hasImageAssetId && !hasExternalUrl) {
      throw new BadRequestException('hero source missing')
    }

    if (hasImageAssetId && hasExternalUrl) {
      throw new BadRequestException('hero source duplicated')
    }
  }

  private assertHeroOwnership(
    hero: BusinessHeroRow,
    profileId: number,
    channelCode: string
  ): void {
    if (hero.profileId !== profileId) {
      throw new ForbiddenException('hero profile mismatch')
    }

    if ((hero.channelCode ?? '') !== channelCode) {
      throw new ForbiddenException('hero channel mismatch')
    }
  }

  private getNextSortOrder(
    profileId: number
  ): number {
    const row = db.prepare(`
      SELECT
        COALESCE(MAX(sortOrder), 0) AS maxSortOrder
      FROM profile_hero_images
      WHERE profileId = ?
    `).get(profileId) as { maxSortOrder: number } | undefined

    return (row?.maxSortOrder ?? 0) + 1
  }

  private getHeroCount(
    profileId: number
  ): number {
    const row = db.prepare(`
      SELECT
        COUNT(*) AS count
      FROM profile_hero_images
      WHERE profileId = ?
    `).get(profileId) as { count: number } | undefined

    return row?.count ?? 0
  }

  // SECTION 04 : READ

  getProfileHeroImages(
    profileId: number,
    channelCode: string
  ): BusinessHeroRow[] {
    const profile = this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      channelCode
    )

    const rows = db.prepare(`
      SELECT
        ph.id,
        ph.profileId,
        ph.channelCode,
        ph.imageAssetId,
        ph.externalUrl,
        ph.title,
        ph.description,
        ph.linkUrl,
        ph.sortOrder,
        ph.isActive,
        ia.filePath,
        ph.createdAt,
        ph.updatedAt
      FROM profile_hero_images ph
      LEFT JOIN image_assets ia
        ON ia.id = ph.imageAssetId
      WHERE ph.profileId = ?
        AND ph.channelCode = ?
      ORDER BY ph.sortOrder ASC, ph.id ASC
    `).all(
      profileId,
      channelCode
    ) as Array<Omit<BusinessHeroRow, 'imageUrl'>>

    return rows.map((row) => ({
      ...row,
      imageUrl: row.externalUrl || this.buildMediaUrl(row.filePath)
    }))
  }

  getProfileHeroImageDetail(
    profileId: number,
    channelCode: string,
    heroId: number
  ): BusinessHeroRow {
    const profile = this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      channelCode
    )

    const hero = this.getHeroRowById(heroId)

    this.assertHeroOwnership(
      hero,
      profileId,
      channelCode
    )

    return hero
  }

  // SECTION 05 : WRITE

  connectProfileHeroImage(
    userId: number,
    profileId: number,
    payload: ConnectProfileHeroPayload
  ): BusinessHeroRow {
    this.assertProfileOwnership(
      userId,
      profileId
    )

    const profile = this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      payload.channelCode
    )

    this.validateHeroSource(
      payload.imageAssetId,
      payload.externalUrl
    )

    if (this.getHeroCount(profileId) >= this.HERO_LIMIT) {
      throw new BadRequestException('hero limit exceeded')
    }

    let asset: ImageAssetRow | null = null

    if (
      typeof payload.imageAssetId === 'number' &&
      !Number.isNaN(payload.imageAssetId) &&
      payload.imageAssetId > 0
    ) {
      asset = this.getImageAsset(payload.imageAssetId)

      if (asset.channelCode !== profile.channelCode) {
        throw new BadRequestException('hero asset channel mismatch')
      }

      if (asset.usageType !== 'hero') {
        throw new BadRequestException('hero usageType invalid')
      }
    }

    const normalizedExternalUrl =
      this.normalizeNullableText(payload.externalUrl)

    const normalizedTitle =
      this.normalizeNullableText(payload.title)

    const normalizedDescription =
      this.normalizeNullableText(payload.description)

    const normalizedLinkUrl =
      this.normalizeNullableText(payload.linkUrl)

    const sortOrder =
      typeof payload.sortOrder === 'number' &&
      !Number.isNaN(payload.sortOrder) &&
      payload.sortOrder > 0
        ? Math.floor(payload.sortOrder)
        : this.getNextSortOrder(profileId)

    const insertResult = db.prepare(`
      INSERT INTO profile_hero_images(
        profileId,
        channelCode,
        imageAssetId,
        externalUrl,
        title,
        description,
        linkUrl,
        sortOrder,
        isActive,
        createdAt,
        updatedAt
      )
      VALUES(
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `).run(
      profile.id,
      profile.channelCode,
      asset?.id ?? null,
      normalizedExternalUrl,
      normalizedTitle,
      normalizedDescription,
      normalizedLinkUrl,
      sortOrder
    )

    return this.getHeroRowById(
      Number(insertResult.lastInsertRowid)
    )
  }

  updateProfileHeroImageMeta(
    userId: number,
    profileId: number,
    heroId: number,
    payload: UpdateProfileHeroPayload
  ): BusinessHeroRow {
    this.assertProfileOwnership(
      userId,
      profileId
    )

    const profile = this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      payload.channelCode
    )

    const current = this.getHeroRowById(heroId)

    this.assertHeroOwnership(
      current,
      profileId,
      profile.channelCode
    )

    const nextTitle =
      payload.title !== undefined
        ? this.normalizeNullableText(payload.title)
        : current.title

    const nextDescription =
      payload.description !== undefined
        ? this.normalizeNullableText(payload.description)
        : current.description

    const nextLinkUrl =
      payload.linkUrl !== undefined
        ? this.normalizeNullableText(payload.linkUrl)
        : current.linkUrl

    const nextSortOrder =
      payload.sortOrder !== undefined
        ? this.normalizeSortOrder(payload.sortOrder)
        : current.sortOrder

    const nextIsActive =
      payload.isActive !== undefined
        ? payload.isActive === 1
          ? 1
          : 0
        : (current.isActive ?? 1)

    db.prepare(`
      UPDATE profile_hero_images
      SET
        title = ?,
        description = ?,
        linkUrl = ?,
        sortOrder = ?,
        isActive = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
    `).run(
      nextTitle,
      nextDescription,
      nextLinkUrl,
      nextSortOrder,
      nextIsActive,
      heroId,
      profileId,
      profile.channelCode
    )

    return this.getHeroRowById(heroId)
  }

  reorderProfileHeroImages(
    userId: number,
    profileId: number,
    payload: ReorderProfileHeroPayload
  ): BusinessHeroRow[] {
    this.assertProfileOwnership(
      userId,
      profileId
    )

    const profile = this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      payload.channelCode
    )

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new BadRequestException('hero reorder items invalid')
    }

    const updateStatement = db.prepare(`
      UPDATE profile_hero_images
      SET
        sortOrder = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
    `)

    const transaction = db.transaction(() => {
      for (const item of payload.items) {
        if (
          typeof item.heroId !== 'number' ||
          Number.isNaN(item.heroId) ||
          item.heroId <= 0
        ) {
          throw new BadRequestException('heroId invalid')
        }

        if (
          typeof item.sortOrder !== 'number' ||
          Number.isNaN(item.sortOrder) ||
          item.sortOrder <= 0
        ) {
          throw new BadRequestException('sortOrder invalid')
        }

        const hero = this.getHeroRowById(item.heroId)

        this.assertHeroOwnership(
          hero,
          profileId,
          profile.channelCode
        )

        updateStatement.run(
          Math.floor(item.sortOrder),
          item.heroId,
          profileId,
          profile.channelCode
        )
      }
    })

    transaction()

    return this.getProfileHeroImages(
      profileId,
      profile.channelCode
    )
  }

  deleteProfileHeroImage(
    userId: number,
    profileId: number,
    channelCode: string,
    heroId: number
  ): { success: boolean } {
    this.assertProfileOwnership(
      userId,
      profileId
    )

    const profile = this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      channelCode
    )

    const hero = this.getHeroRowById(heroId)

    this.assertHeroOwnership(
      hero,
      profileId,
      profile.channelCode
    )

    db.prepare(`
      DELETE FROM profile_hero_images
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
    `).run(
      heroId,
      profileId,
      profile.channelCode
    )

    return {
      success: true
    }
  }
}
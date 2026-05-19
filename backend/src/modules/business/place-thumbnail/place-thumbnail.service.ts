// FILE : backend/src/modules/business/place-thumbnail/place-thumbnail.service.ts
// ROOT : backend/src/modules/business/place-thumbnail/place-thumbnail.service.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS PROFILE PLACE THUMBNAIL SERVICE
// CHANGE SUMMARY :
// - BUSINESS 피드/플레이스 썸네일 relation 전용 service 생성
// - profile_place_thumbnails + image_assets 기준 썸네일 조회/연결/정렬/삭제 처리
// - profileId + channelCode 단일 귀속 검증 적용
// - BUSINESS profile만 허용
// - 최대 5장 제한 적용
// - imageUrl 생성 시 backend origin 기준 절대 URL 반환
// - image_assets 실제 삭제 금지, relation row만 삭제
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

type BusinessPlaceThumbnailRow = {
  id: number
  profileId: number
  channelCode: string
  imageAssetId: number
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
  isActive: number | null
}

type ConnectPlaceThumbnailPayload = {
  channelCode: string
  imageAssetId: number
  sortOrder?: number | null
}

type UpdatePlaceThumbnailPayload = {
  channelCode: string
  sortOrder?: number | null
  isActive?: number | null
}

type ReorderPlaceThumbnailItem = {
  thumbnailId: number
  sortOrder: number
}

type ReorderPlaceThumbnailPayload = {
  channelCode: string
  items: ReorderPlaceThumbnailItem[]
}

// SECTION 02 : SERVICE

@Injectable()
export class ProfilePlaceThumbnailService {
  private readonly THUMBNAIL_LIMIT =
    5

  // SECTION 03 : SECURITY CORE

  private assertProfileOwnership(
    userId: number,
    profileId: number
  ): void {
    if (
      !userId ||
      !profileId
    ) {
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
    `).get(
      profileId
    ) as { id: number } | undefined

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
    `).get(
      profileId
    ) as BusinessProfileRow | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found')
    }

    return row
  }

  private assertContextMatch(
    profile: BusinessProfileRow,
    channelCode: string
  ): void {
    const normalizedChannelCode =
      channelCode?.trim()

    if (!normalizedChannelCode) {
      throw new BadRequestException('channelCode missing')
    }

    if (profile.channelCode !== normalizedChannelCode) {
      throw new BadRequestException('place thumbnail channelCode mismatch')
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
        filePath,
        isActive
      FROM image_assets
      WHERE id = ?
      LIMIT 1
    `).get(
      imageAssetId
    ) as ImageAssetRow | undefined

    if (!row) {
      throw new NotFoundException('Image asset not found')
    }

    if (row.isActive === 0) {
      throw new BadRequestException('image asset inactive')
    }

    return row
  }

  private getPlaceThumbnailRowById(
    thumbnailId: number
  ): BusinessPlaceThumbnailRow {
    if (
      typeof thumbnailId !== 'number' ||
      Number.isNaN(thumbnailId) ||
      thumbnailId <= 0
    ) {
      throw new BadRequestException('thumbnailId invalid')
    }

    const row = db.prepare(`
      SELECT
        pt.id,
        pt.profileId,
        pt.channelCode,
        pt.imageAssetId,
        pt.sortOrder,
        pt.isActive,
        ia.filePath,
        pt.createdAt,
        pt.updatedAt
      FROM profile_place_thumbnails pt
      LEFT JOIN image_assets ia
        ON ia.id = pt.imageAssetId
      WHERE pt.id = ?
      LIMIT 1
    `).get(
      thumbnailId
    ) as Omit<BusinessPlaceThumbnailRow, 'imageUrl'> | undefined

    if (!row) {
      throw new NotFoundException('Place thumbnail not found')
    }

    return {
      ...row,
      imageUrl: this.buildMediaUrl(row.filePath)
    }
  }

  private assertPlaceThumbnailOwnership(
    thumbnail: BusinessPlaceThumbnailRow,
    profileId: number,
    channelCode: string
  ): void {
    if (thumbnail.profileId !== profileId) {
      throw new ForbiddenException('place thumbnail profile mismatch')
    }

    if (thumbnail.channelCode !== channelCode) {
      throw new ForbiddenException('place thumbnail channel mismatch')
    }
  }

  private getNextSortOrder(
    profileId: number,
    channelCode: string
  ): number {
    const row = db.prepare(`
      SELECT
        COALESCE(MAX(sortOrder), 0) AS maxSortOrder
      FROM profile_place_thumbnails
      WHERE profileId = ?
        AND channelCode = ?
    `).get(
      profileId,
      channelCode
    ) as { maxSortOrder: number } | undefined

    return (row?.maxSortOrder ?? 0) + 1
  }

  private getThumbnailCount(
    profileId: number,
    channelCode: string
  ): number {
    const row = db.prepare(`
      SELECT
        COUNT(*) AS count
      FROM profile_place_thumbnails
      WHERE profileId = ?
        AND channelCode = ?
    `).get(
      profileId,
      channelCode
    ) as { count: number } | undefined

    return row?.count ?? 0
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

  private normalizeIsActive(
    value?: number | null
  ): number {
    if (value === undefined || value === null) {
      return 1
    }

    return value === 1
      ? 1
      : 0
  }

  private buildMediaUrl(
    filePath?: string | null
  ): string | null {
    if (!filePath) {
      return null
    }

    const trimmed =
      filePath.trim()

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

    const normalizedBaseUrl =
      rawBaseUrl
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

  // SECTION 04 : READ

  getProfilePlaceThumbnails(
    profileId: number,
    channelCode: string
  ): BusinessPlaceThumbnailRow[] {
    const profile =
      this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      channelCode
    )

    const rows = db.prepare(`
      SELECT
        pt.id,
        pt.profileId,
        pt.channelCode,
        pt.imageAssetId,
        pt.sortOrder,
        pt.isActive,
        ia.filePath,
        pt.createdAt,
        pt.updatedAt
      FROM profile_place_thumbnails pt
      LEFT JOIN image_assets ia
        ON ia.id = pt.imageAssetId
      WHERE pt.profileId = ?
        AND pt.channelCode = ?
      ORDER BY pt.sortOrder ASC, pt.id ASC
    `).all(
      profileId,
      channelCode
    ) as Array<Omit<BusinessPlaceThumbnailRow, 'imageUrl'>>

    return rows.map((row) => ({
      ...row,
      imageUrl: this.buildMediaUrl(row.filePath)
    }))
  }

  getProfilePlaceThumbnailDetail(
    profileId: number,
    channelCode: string,
    thumbnailId: number
  ): BusinessPlaceThumbnailRow {
    const profile =
      this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      channelCode
    )

    const thumbnail =
      this.getPlaceThumbnailRowById(thumbnailId)

    this.assertPlaceThumbnailOwnership(
      thumbnail,
      profileId,
      channelCode
    )

    return thumbnail
  }

  // SECTION 05 : WRITE

  connectProfilePlaceThumbnail(
    userId: number,
    profileId: number,
    payload: ConnectPlaceThumbnailPayload
  ): BusinessPlaceThumbnailRow {
    this.assertProfileOwnership(
      userId,
      profileId
    )

    const profile =
      this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      payload.channelCode
    )

    const asset =
      this.getImageAsset(payload.imageAssetId)

    if (asset.channelCode !== profile.channelCode) {
      throw new BadRequestException('place thumbnail asset channel mismatch')
    }

    if (
      this.getThumbnailCount(
        profileId,
        profile.channelCode
      ) >= this.THUMBNAIL_LIMIT
    ) {
      throw new BadRequestException('place thumbnail limit exceeded')
    }

    const sortOrder =
      typeof payload.sortOrder === 'number' &&
      !Number.isNaN(payload.sortOrder) &&
      payload.sortOrder > 0
        ? Math.floor(payload.sortOrder)
        : this.getNextSortOrder(
            profileId,
            profile.channelCode
          )

    const insertStatement = db.prepare(`
      INSERT INTO profile_place_thumbnails(
        profileId,
        channelCode,
        imageAssetId,
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
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `)

    const deactivateStatement = db.prepare(`
      UPDATE profile_place_thumbnails
      SET
        isActive = 0,
        updatedAt = CURRENT_TIMESTAMP
      WHERE profileId = ?
        AND channelCode = ?
        AND isActive = 1
    `)

    const insertResult = db.transaction(() => {
      deactivateStatement.run(
        profile.id,
        profile.channelCode
      )

      return insertStatement.run(
        profile.id,
        profile.channelCode,
        asset.id,
        sortOrder
      )
    })()

    return this.getPlaceThumbnailRowById(
      Number(insertResult.lastInsertRowid)
    )
  }

  updateProfilePlaceThumbnailMeta(
    userId: number,
    profileId: number,
    thumbnailId: number,
    payload: UpdatePlaceThumbnailPayload
  ): BusinessPlaceThumbnailRow {
    this.assertProfileOwnership(
      userId,
      profileId
    )

    const profile =
      this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      payload.channelCode
    )

    const current =
      this.getPlaceThumbnailRowById(thumbnailId)

    this.assertPlaceThumbnailOwnership(
      current,
      profileId,
      profile.channelCode
    )

    const nextSortOrder =
      payload.sortOrder !== undefined
        ? this.normalizeSortOrder(payload.sortOrder)
        : current.sortOrder

    const nextIsActive =
      payload.isActive !== undefined
        ? this.normalizeIsActive(payload.isActive)
        : (current.isActive ?? 1)

    db.prepare(`
      UPDATE profile_place_thumbnails
      SET
        sortOrder = ?,
        isActive = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
    `).run(
      nextSortOrder,
      nextIsActive,
      thumbnailId,
      profileId,
      profile.channelCode
    )

    return this.getPlaceThumbnailRowById(thumbnailId)
  }

  reorderProfilePlaceThumbnails(
    userId: number,
    profileId: number,
    payload: ReorderPlaceThumbnailPayload
  ): BusinessPlaceThumbnailRow[] {
    this.assertProfileOwnership(
      userId,
      profileId
    )

    const profile =
      this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      payload.channelCode
    )

    if (
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      throw new BadRequestException('place thumbnail reorder items invalid')
    }

    const updateStatement = db.prepare(`
      UPDATE profile_place_thumbnails
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
          typeof item.thumbnailId !== 'number' ||
          Number.isNaN(item.thumbnailId) ||
          item.thumbnailId <= 0
        ) {
          throw new BadRequestException('thumbnailId invalid')
        }

        if (
          typeof item.sortOrder !== 'number' ||
          Number.isNaN(item.sortOrder) ||
          item.sortOrder <= 0
        ) {
          throw new BadRequestException('sortOrder invalid')
        }

        const thumbnail =
          this.getPlaceThumbnailRowById(item.thumbnailId)

        this.assertPlaceThumbnailOwnership(
          thumbnail,
          profileId,
          profile.channelCode
        )

        updateStatement.run(
          Math.floor(item.sortOrder),
          item.thumbnailId,
          profileId,
          profile.channelCode
        )
      }
    })

    transaction()

    return this.getProfilePlaceThumbnails(
      profileId,
      profile.channelCode
    )
  }

  deleteProfilePlaceThumbnail(
    userId: number,
    profileId: number,
    channelCode: string,
    thumbnailId: number
  ): { success: boolean } {
    this.assertProfileOwnership(
      userId,
      profileId
    )

    const profile =
      this.getProfile(profileId)

    this.assertContextMatch(
      profile,
      channelCode
    )

    const thumbnail =
      this.getPlaceThumbnailRowById(thumbnailId)

    this.assertPlaceThumbnailOwnership(
      thumbnail,
      profileId,
      profile.channelCode
    )

    db.prepare(`
      DELETE FROM profile_place_thumbnails
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
    `).run(
      thumbnailId,
      profileId,
      profile.channelCode
    )

    return {
      success: true
    }
  }
}

// SECTION 06 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- profile_place_thumbnails relation table 기준
- image_assets filePath 기준 imageUrl 생성
- profileId + channelCode 단일 귀속 검증
- BUSINESS profile만 허용
- 최대 5장 제한
- image_assets channelCode 소유권 검증
- image_assets 실제 삭제 없음
- relation row만 삭제
- Controller 없음
- Module 없음
- DB schema 변경 없음
*/

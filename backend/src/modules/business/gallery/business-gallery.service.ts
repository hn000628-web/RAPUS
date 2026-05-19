// FILE : backend/src/modules/business/gallery/business-gallery.service.ts
// ROOT : backend/src/modules/business/gallery/business-gallery.service.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS GALLERY RELATION SERVICE
// CHANGE SUMMARY :
// - BUSINESS 사진첩 전용 relation 서비스 신규 생성
// - BusinessMediaService import / DI 주입 추가
// - gallery domain 에서 BUSINESS 공용 media storage 를 사용하는 구조를 코드에서 명시적으로 드러냄
// - 저장 책임은 business-media.service.ts 에 두고 본 서비스는 업로드 위임 / 연결 / 로딩 / 해제만 담당
// - profileId + channelCode + BUSINESS profileType 동시 검증 구조 적용
// - profile_gallery_images + image_assets 기준 목록 로딩 추가
// - 연결 해제는 unlink only 처리, 실제 파일 삭제는 수행하지 않음
// - orphan 후보 발생 시 image_assets.isActive = 0 처리만 수행

// SECTION 01 : IMPORT

import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common'

import db from '../../../config/database'
// /media/business-media.service 를 미디어 저장 공용컴포넌트(저장담당)
import { BusinessMediaService } from '../media/business-media.service'

// SECTION 02 : TYPE

type BusinessProfileRow = {
  id: number
  channelCode: string
  profileType: 'BUSINESS'
}

type BusinessImageAssetRow = {
  id: number
  channelCode: string
  usageType: 'gallery'
  fileName: string
  filePath: string
  mimeType: string | null
  fileSize: number | null
  isActive: number | null
}

type BusinessGalleryRow = {
  id: number
  profileId: number
  channelCode: string | null
  imageAssetId: number | null
  filePath: string | null
  caption: string | null
  sortOrder: number
  isActive: number | null
  createdAt: string | null
  updatedAt: string | null
  fileName: string | null
  mimeType: string | null
  fileSize: number | null
}

type BusinessGalleryItemPayload = {
  galleryId: number
  profileId: number
  channelCode: string | null
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
  fileName: string | null
  mimeType: string | null
  fileSize: number | null
  caption: string | null
  sortOrder: number
  isActive: number | null
  createdAt: string | null
  updatedAt: string | null
}

type BusinessGalleryListPayload = {
  ok: true
  profileId: number
  channelCode: string
  items: BusinessGalleryItemPayload[]
}

type BusinessGalleryUploadPayload = {
  ok: true
  profileId: number
  channelCode: string
  assetId: number | null
  fileName: string
  filePath: string
}

type BusinessGalleryConnectPayload = {
  ok: true
  profileId: number
  channelCode: string
  galleryId: number
  imageAssetId: number
}

type BusinessGalleryUnlinkPayload = {
  ok: true
  profileId: number
  channelCode: string
  galleryId: number
  imageAssetId: number
}

// SECTION 03 : SERVICE

@Injectable()
export class BusinessGalleryService {
  constructor(
    private readonly businessMediaService: BusinessMediaService
  ) {}

  // SECTION 04 : NORMALIZE

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

  private normalizeRequiredProfileId(
    profileId: number
  ): number {
    const normalizedProfileId = Number(profileId)

    if (
      !Number.isInteger(normalizedProfileId) ||
      normalizedProfileId <= 0
    ) {
      throw new BadRequestException('profileId invalid')
    }

    return normalizedProfileId
  }

  private normalizeRequiredGalleryId(
    galleryId: number
  ): number {
    const normalizedGalleryId = Number(galleryId)

    if (
      !Number.isInteger(normalizedGalleryId) ||
      normalizedGalleryId <= 0
    ) {
      throw new BadRequestException('galleryId invalid')
    }

    return normalizedGalleryId
  }

  private normalizeRequiredImageAssetId(
    imageAssetId: number
  ): number {
    const normalizedImageAssetId = Number(imageAssetId)

    if (
      !Number.isInteger(normalizedImageAssetId) ||
      normalizedImageAssetId <= 0
    ) {
      throw new BadRequestException('imageAssetId invalid')
    }

    return normalizedImageAssetId
  }

  private normalizeOptionalCaption(
    caption?: string | null
  ): string | null {
    if (typeof caption !== 'string') {
      return null
    }

    const normalizedCaption = caption.trim()

    if (!normalizedCaption) {
      return null
    }

    return normalizedCaption
  }

  // SECTION 05 : MEDIA URL

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

  // SECTION 06 : CORE ASSERT

  private getRequiredBusinessProfileContext(
    profileId: number,
    channelCode: string
  ): BusinessProfileRow {
    const normalizedProfileId =
      this.normalizeRequiredProfileId(profileId)

    const normalizedChannelCode =
      this.normalizeRequiredChannelCode(channelCode)

    const row = db.prepare(`
      SELECT
        id,
        channelCode,
        profileType
      FROM profiles
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(
      normalizedProfileId,
      normalizedChannelCode
    ) as BusinessProfileRow | undefined

    if (!row) {
      throw new NotFoundException('Business profile context not found')
    }

    return row
  }

  private getRequiredBusinessProfileByChannelCode(
    channelCode: string
  ): BusinessProfileRow {
    const normalizedChannelCode =
      this.normalizeRequiredChannelCode(channelCode)

    const row = db.prepare(`
      SELECT
        id,
        channelCode,
        profileType
      FROM profiles
      WHERE channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(normalizedChannelCode) as BusinessProfileRow | undefined

    if (!row) {
      throw new NotFoundException('Business channel not found')
    }

    return row
  }

  private getRequiredBusinessGalleryAsset(
    imageAssetId: number,
    channelCode: string
  ): BusinessImageAssetRow {
    const normalizedImageAssetId =
      this.normalizeRequiredImageAssetId(imageAssetId)

    const normalizedChannelCode =
      this.normalizeRequiredChannelCode(channelCode)

    const row = db.prepare(`
      SELECT
        id,
        channelCode,
        usageType,
        fileName,
        filePath,
        mimeType,
        fileSize,
        isActive
      FROM image_assets
      WHERE id = ?
        AND channelCode = ?
        AND usageType = 'gallery'
      LIMIT 1
    `).get(
      normalizedImageAssetId,
      normalizedChannelCode
    ) as BusinessImageAssetRow | undefined

    if (!row) {
      throw new NotFoundException('Business gallery asset not found')
    }

    return row
  }

  // SECTION 07 : GALLERY STORAGE DELEGATION

  async uploadBusinessGalleryAsset(params: {
    profileId: number
    channelCode: string
    file: Express.Multer.File
  }): Promise<BusinessGalleryUploadPayload> {
    const profile =
      this.getRequiredBusinessProfileContext(
        params.profileId,
        params.channelCode
      )

    const uploaded =
      await this.businessMediaService.uploadImage({
        file: params.file,
        channelCode: profile.channelCode,
        usageType: 'gallery'
      })

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      assetId: uploaded.assetId,
      fileName: uploaded.fileName,
      filePath: uploaded.filePath
    }
  }

  // SECTION 08 : GALLERY LOAD

  getBusinessGalleryByChannelCode(
    channelCode: string
  ): BusinessGalleryListPayload {
    const profile =
      this.getRequiredBusinessProfileByChannelCode(channelCode)

    const rows = db.prepare(`
      SELECT
        g.id,
        g.profileId,
        g.channelCode,
        g.imageAssetId,
        COALESCE(g.filePath, ia.filePath) AS filePath,
        g.caption,
        g.sortOrder,
        g.isActive,
        g.createdAt,
        g.updatedAt,
        ia.fileName,
        ia.mimeType,
        ia.fileSize
      FROM profile_gallery_images g
      LEFT JOIN image_assets ia
        ON ia.id = g.imageAssetId
      WHERE g.profileId = ?
        AND g.channelCode = ?
        AND COALESCE(g.isActive, 1) = 1
      ORDER BY g.sortOrder ASC, g.id ASC
    `).all(
      profile.id,
      profile.channelCode
    ) as BusinessGalleryRow[]

    const items = rows.map((row) => ({
      galleryId: row.id,
      profileId: row.profileId,
      channelCode: row.channelCode,
      imageAssetId: row.imageAssetId,
      filePath: row.filePath,
      imageUrl: this.buildMediaUrl(row.filePath),
      fileName: row.fileName,
      mimeType: row.mimeType,
      fileSize: row.fileSize,
      caption: row.caption,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      items
    }
  }

  // SECTION 09 : GALLERY CONNECT

  connectBusinessGalleryImage(params: {
    profileId: number
    channelCode: string
    imageAssetId: number
    caption?: string | null
  }): BusinessGalleryConnectPayload {
    const profile =
      this.getRequiredBusinessProfileContext(
        params.profileId,
        params.channelCode
      )

    const asset =
      this.getRequiredBusinessGalleryAsset(
        params.imageAssetId,
        profile.channelCode
      )

    const caption =
      this.normalizeOptionalCaption(params.caption)

    const existingRelation = db.prepare(`
      SELECT
        id
      FROM profile_gallery_images
      WHERE profileId = ?
        AND channelCode = ?
        AND imageAssetId = ?
        AND COALESCE(isActive, 1) = 1
      LIMIT 1
    `).get(
      profile.id,
      profile.channelCode,
      asset.id
    ) as { id: number } | undefined

    if (existingRelation) {
      return {
        ok: true,
        profileId: profile.id,
        channelCode: profile.channelCode,
        galleryId: existingRelation.id,
        imageAssetId: asset.id
      }
    }

    const maxRow = db.prepare(`
      SELECT
        COALESCE(MAX(sortOrder), -1) AS maxSortOrder
      FROM profile_gallery_images
      WHERE profileId = ?
        AND channelCode = ?
        AND COALESCE(isActive, 1) = 1
    `).get(
      profile.id,
      profile.channelCode
    ) as { maxSortOrder: number | null }

    const nextSortOrder =
      Number(maxRow?.maxSortOrder ?? -1) + 1

    let galleryId = 0

    try {
      db.exec('BEGIN')

      const result = db.prepare(`
        INSERT INTO profile_gallery_images(
          profileId,
          channelCode,
          imageAssetId,
          filePath,
          caption,
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
          1,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `).run(
        profile.id,
        profile.channelCode,
        asset.id,
        asset.filePath,
        caption,
        nextSortOrder
      )

      galleryId = Number(result.lastInsertRowid)

      db.prepare(`
        UPDATE image_assets
        SET
          isActive = 1,
          lastUsedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(asset.id)

      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')

      console.error(
        '[BUSINESS GALLERY CONNECT FAIL]',
        error
      )

      throw new BadRequestException('business gallery connect fail')
    }

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      galleryId,
      imageAssetId: asset.id
    }
  }

  // SECTION 10 : GALLERY UNLINK

  unlinkBusinessGalleryImage(params: {
    profileId: number
    channelCode: string
    galleryId: number
  }): BusinessGalleryUnlinkPayload {
    const profile =
      this.getRequiredBusinessProfileContext(
        params.profileId,
        params.channelCode
      )

    const galleryId =
      this.normalizeRequiredGalleryId(params.galleryId)

    const relation = db.prepare(`
      SELECT
        id,
        profileId,
        channelCode,
        imageAssetId
      FROM profile_gallery_images
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND COALESCE(isActive, 1) = 1
      LIMIT 1
    `).get(
      galleryId,
      profile.id,
      profile.channelCode
    ) as {
      id: number
      profileId: number
      channelCode: string
      imageAssetId: number
    } | undefined

    if (!relation) {
      throw new NotFoundException('Business gallery relation not found')
    }

    try {
      db.exec('BEGIN')

      db.prepare(`
        UPDATE profile_gallery_images
        SET
          isActive = 0,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(relation.id)

      const stillReferenced = db.prepare(`
        SELECT 1
        FROM profile_gallery_images
        WHERE imageAssetId = ?
          AND COALESCE(isActive, 1) = 1

        UNION

        SELECT 1
        FROM profile_avatars
        WHERE imageAssetId = ?
          AND COALESCE(isActive, 1) = 1

        UNION

        SELECT 1
        FROM profile_hero_images
        WHERE imageAssetId = ?
          AND COALESCE(isActive, 1) = 1

        UNION

        SELECT 1
        FROM post_images
        WHERE imageAssetId = ?

        LIMIT 1
      `).get(
        relation.imageAssetId,
        relation.imageAssetId,
        relation.imageAssetId,
        relation.imageAssetId
      )

      if (!stillReferenced) {
        db.prepare(`
          UPDATE image_assets
          SET
            isActive = 0
          WHERE id = ?
        `).run(relation.imageAssetId)
      }

      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')

      console.error(
        '[BUSINESS GALLERY UNLINK FAIL]',
        error
      )

      throw new BadRequestException('business gallery unlink fail')
    }

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      galleryId: relation.id,
      imageAssetId: relation.imageAssetId
    }
  }
}
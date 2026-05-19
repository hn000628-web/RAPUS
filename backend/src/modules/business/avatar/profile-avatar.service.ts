// FILE : backend/src/modules/business/avatar/profile-avatar.service.ts
// ROOT : backend/src/modules/business/avatar/profile-avatar.service.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE AVATAR RELATION SERVICE
// CHANGE SUMMARY :
// - BUSINESS 아바타 relation 전용 service 구조를 business-gallery.service.ts 와 동일한 media import 구조로 재정렬
// - BusinessMediaService import / DI 주입 추가
// - avatar domain 에서 BUSINESS 공용 media storage 를 사용하는 구조를 코드에서 명시적으로 드러냄
// - 저장 책임은 business-media.service.ts 에 두고 본 service 는 업로드 위임 / 조회 / 연결 / 해제만 담당
// - profileId + channelCode + BUSINESS profileType 동시 검증 구조 적용
// - profile_avatars + image_assets 기준 avatar 조회/연결/해제 처리 유지
// - 기존 active avatar relation 은 unlink 처리 후 신규 relation insert 방식 유지
// - 실제 파일 삭제는 수행하지 않고 orphan 후보 발생 시 image_assets.isActive = 0 처리만 수행

import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common'

import db from '../../../config/database'
import { BusinessMediaService } from '../media/business-media.service'

// SECTION 01 : TYPE

type BusinessProfileRow = {
  id: number
  channelCode: string
  profileType: 'BUSINESS'
}

type BusinessAvatarRow = {
  id: number
  profileId: number
  channelCode: string | null
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
  isActive: number | null
  createdAt: string | null
}

type BusinessImageAssetRow = {
  id: number
  channelCode: string
  usageType: 'avatar'
  fileName: string
  filePath: string
  mimeType: string | null
  fileSize: number | null
  isActive: number | null
}

type BusinessAvatarUploadPayload = {
  ok: true
  profileId: number
  channelCode: string
  assetId: number | null
  fileName: string
  filePath: string
}

type BusinessAvatarConnectPayload = {
  ok: true
  profileId: number
  channelCode: string
  imageAssetId: number
  avatar: BusinessAvatarRow | null
}

type BusinessAvatarDeletePayload = {
  ok: true
  profileId: number
  channelCode: string
  deletedImageAssetId: number | null
}

// SECTION 02 : SERVICE

@Injectable()
export class ProfileAvatarService {
  constructor(
    private readonly businessMediaService: BusinessMediaService
  ) {}

  // SECTION 03 : NORMALIZE

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

  // SECTION 04 : MEDIA URL

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

  // SECTION 05 : CORE ASSERT

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

  private getRequiredBusinessAvatarAsset(
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
        AND usageType = 'avatar'
      LIMIT 1
    `).get(
      normalizedImageAssetId,
      normalizedChannelCode
    ) as BusinessImageAssetRow | undefined

    if (!row) {
      throw new NotFoundException('Business avatar asset not found')
    }

    return row
  }

  // SECTION 06 : AVATAR STORAGE DELEGATION

  async uploadBusinessAvatarAsset(params: {
    profileId: number
    channelCode: string
    file: Express.Multer.File
  }): Promise<BusinessAvatarUploadPayload> {
    const profile =
      this.getRequiredBusinessProfileContext(
        params.profileId,
        params.channelCode
      )

    const uploaded =
      await this.businessMediaService.uploadImage({
        file: params.file,
        channelCode: profile.channelCode,
        usageType: 'avatar'
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

  // SECTION 07 : READ

  getProfileAvatar(
    profileId: number,
    channelCode: string
  ): BusinessAvatarRow | null {
    const profile =
      this.getRequiredBusinessProfileContext(
        profileId,
        channelCode
      )

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
        ON ia.id = pa.imageAssetId
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

  // SECTION 08 : CONNECT

  connectProfileAvatar(params: {
    profileId: number
    channelCode: string
    imageAssetId: number
  }): BusinessAvatarConnectPayload {
    const profile =
      this.getRequiredBusinessProfileContext(
        params.profileId,
        params.channelCode
      )

    const asset =
      this.getRequiredBusinessAvatarAsset(
        params.imageAssetId,
        profile.channelCode
      )

    try {
      db.exec('BEGIN')

      db.prepare(`
        UPDATE profile_avatars
        SET
          isActive = 0
        WHERE profileId = ?
          AND channelCode = ?
          AND COALESCE(isActive, 1) = 1
      `).run(
        profile.id,
        profile.channelCode
      )

      db.prepare(`
        INSERT INTO profile_avatars(
          profileId,
          channelCode,
          imageAssetId,
          filePath,
          isActive,
          createdAt
        )
        VALUES(
          ?,
          ?,
          ?,
          ?,
          1,
          CURRENT_TIMESTAMP
        )
      `).run(
        profile.id,
        profile.channelCode,
        asset.id,
        asset.filePath
      )

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
        '[BUSINESS AVATAR CONNECT FAIL]',
        error
      )

      throw new BadRequestException('business avatar connect fail')
    }

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      imageAssetId: asset.id,
      avatar: this.getProfileAvatar(
        profile.id,
        profile.channelCode
      )
    }
  }

  // SECTION 09 : DELETE / UNLINK

  deleteProfileAvatar(params: {
    profileId: number
    channelCode: string
  }): BusinessAvatarDeletePayload {
    const profile =
      this.getRequiredBusinessProfileContext(
        params.profileId,
        params.channelCode
      )

    const activeAvatar = db.prepare(`
      SELECT
        id,
        imageAssetId
      FROM profile_avatars
      WHERE profileId = ?
        AND channelCode = ?
        AND COALESCE(isActive, 1) = 1
      ORDER BY id DESC
      LIMIT 1
    `).get(
      profile.id,
      profile.channelCode
    ) as {
      id: number
      imageAssetId: number | null
    } | undefined

    if (!activeAvatar) {
      return {
        ok: true,
        profileId: profile.id,
        channelCode: profile.channelCode,
        deletedImageAssetId: null
      }
    }

    try {
      db.exec('BEGIN')

      db.prepare(`
        UPDATE profile_avatars
        SET
          isActive = 0
        WHERE id = ?
      `).run(activeAvatar.id)

      if (activeAvatar.imageAssetId) {
        const stillReferenced = db.prepare(`
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
          FROM profile_gallery_images
          WHERE imageAssetId = ?
            AND COALESCE(isActive, 1) = 1

          UNION

          SELECT 1
          FROM post_images
          WHERE imageAssetId = ?

          LIMIT 1
        `).get(
          activeAvatar.imageAssetId,
          activeAvatar.imageAssetId,
          activeAvatar.imageAssetId,
          activeAvatar.imageAssetId
        )

        if (!stillReferenced) {
          db.prepare(`
            UPDATE image_assets
            SET
              isActive = 0
            WHERE id = ?
          `).run(activeAvatar.imageAssetId)
        }
      }

      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')

      console.error(
        '[BUSINESS AVATAR DELETE FAIL]',
        error
      )

      throw new BadRequestException('business avatar delete fail')
    }

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      deletedImageAssetId: activeAvatar.imageAssetId ?? null
    }
  }
}
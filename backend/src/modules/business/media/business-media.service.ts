// FILE : backend/src/modules/business/media/business-media.service.ts
// ROOT : backend/src/modules/business/media/business-media.service.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS MEDIA STORAGE SERVICE
// CHANGE SUMMARY :
// - 공용 media.service.ts 를 BUSINESS 전용 서비스로 분리
// - BUSINESS profileType 검증 추가
// - BUSINESS 자산만 대상으로 stats / orphan 조회 제한
// - image_assets 저장 구조 / channelCode 저장 구조 유지
// - relation 처리 로직은 포함하지 않고 storage executor 역할만 유지

// SECTION 01 : IMPORT

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common'

import * as fs from 'fs'
import * as path from 'path'
import { randomBytes } from 'crypto'
import sharp from 'sharp'

import db from '../../../config/database'

// SECTION 02 : CONSTANT

const UPLOAD_ROOT = path.resolve(
  __dirname,
  '../../../../uploads'
)

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp'
] as const

const MAX_FILE_SIZE = 5 * 1024 * 1024

type BusinessUsageType =
  | 'avatar'
  | 'hero'
  | 'post'
  | 'gallery'
  | 'place-thumbnail'
  | 'pos-product-thumbnail'

type BusinessProfileRow = {
  id: number
  profileType: 'BUSINESS'
}

// SECTION 03 : SERVICE

@Injectable()
export class BusinessMediaService {
  // SECTION 04 : UPLOAD IMAGE

  async uploadImage(params: {
    file: Express.Multer.File
    channelCode: string
    usageType: BusinessUsageType
    postId?: number
    index?: number
  }) {
    const {
      file,
      channelCode,
      usageType,
      postId,
      index
    } = params

    try {
      if (!file) {
        throw new BadRequestException('file required')
      }

      if (!channelCode) {
        throw new BadRequestException('channelCode missing')
      }

      if (!ALLOWED_MIME.includes(file.mimetype as (typeof ALLOWED_MIME)[number])) {
        throw new BadRequestException('invalid mime')
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException('file too large')
      }

      const profile = db.prepare(`
        SELECT
          id,
          profileType
        FROM profiles
        WHERE channelCode = ?
          AND profileType = 'BUSINESS'
        LIMIT 1
      `).get(channelCode) as BusinessProfileRow | undefined

      if (!profile) {
        throw new BadRequestException('invalid business channelCode')
      }

      const safePostId =
        typeof postId === 'number' &&
        Number.isInteger(postId) &&
        postId > 0
          ? postId
          : undefined

      const safeIndex =
        typeof index === 'number' &&
        Number.isInteger(index) &&
        index > 0
          ? index
          : 1

      const dir = this.buildDirectory(
        channelCode,
        usageType,
        safePostId
      )

      this.ensureDir(dir)

      const fileName = this.generateFileName({
        usageType,
        postId: safePostId,
        index: safeIndex
      })

      const fullPath = path.join(
        dir,
        fileName
      )

      const relativePath = this.buildRelativePath(
        channelCode,
        usageType,
        fileName,
        safePostId
      )

      const transformedImage =
        await sharp(file.buffer)
          .rotate()
          .resize({
            width: 1024,
            height: 1024,
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({
            quality: 82
          })
          .toBuffer({
            resolveWithObject: true
          })

      fs.writeFileSync(
        fullPath,
        transformedImage.data
      )

      let assetId: number | null = null

      try {
        db.exec('BEGIN')

        const result = db.prepare(`
          INSERT INTO image_assets(
            channelCode,
            usageType,
            fileName,
            filePath,
            mimeType,
            fileSize,
            width,
            height,
            createdAt
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
            CURRENT_TIMESTAMP
          )
        `).run(
          channelCode,
          usageType,
          fileName,
          relativePath,
          'image/webp',
          transformedImage.data.length,
          transformedImage.info.width ?? null,
          transformedImage.info.height ?? null
        )

        assetId = Number(result.lastInsertRowid)

        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }

        console.error(
          '[BUSINESS MEDIA DB INSERT FAIL]',
          error
        )

        throw new InternalServerErrorException(
          'business media insert fail'
        )
      }

      return {
        assetId,
        fileName,
        filePath: relativePath
      }
    } catch (error) {
      console.error(
        '[BUSINESS MEDIA UPLOAD ERROR]',
        error
      )

      throw error
    }
  }

  // SECTION 05 : DELETE IMAGE

  async deleteImage(assetId: number) {
    if (!assetId) {
      return
    }

    const asset = db.prepare(`
      SELECT
        ia.id,
        ia.filePath,
        ia.channelCode
      FROM image_assets ia
      INNER JOIN profiles p
        ON p.channelCode = ia.channelCode
      WHERE ia.id = ?
        AND p.profileType = 'BUSINESS'
      LIMIT 1
    `).get(assetId) as {
      id: number
      filePath: string
      channelCode: string
    } | undefined

    if (!asset) {
      return
    }

    const ref = db.prepare(`
      SELECT 1
      FROM profile_avatars
      WHERE imageAssetId = ?

      UNION

      SELECT 1
      FROM profile_hero_images
      WHERE imageAssetId = ?

      UNION

      SELECT 1
      FROM post_images
      WHERE imageAssetId = ?

      LIMIT 1
    `).get(
      assetId,
      assetId,
      assetId
    )

    if (ref) {
      console.error(
        '[BUSINESS MEDIA FK BLOCK]',
        assetId
      )

      return
    }

    await this.forceDelete(assetId)
  }

  // SECTION 06 : FORCE DELETE

  private async forceDelete(assetId: number) {
    const asset = db.prepare(`
      SELECT
        ia.filePath
      FROM image_assets ia
      INNER JOIN profiles p
        ON p.channelCode = ia.channelCode
      WHERE ia.id = ?
        AND p.profileType = 'BUSINESS'
      LIMIT 1
    `).get(assetId) as { filePath: string } | undefined

    if (!asset) {
      return
    }

    const fullPath = path.join(
      UPLOAD_ROOT,
      asset.filePath
    )

    try {
      db.exec('BEGIN')

      db.prepare(`
        DELETE FROM image_assets
        WHERE id = ?
      `).run(assetId)

      db.exec('COMMIT')

      if (
        asset.filePath &&
        fs.existsSync(fullPath)
      ) {
        fs.unlinkSync(fullPath)
      }
    } catch (error) {
      db.exec('ROLLBACK')

      console.error(
        '[BUSINESS MEDIA DELETE ERROR]',
        assetId,
        error
      )
    }
  }

  // SECTION 07 : DIRECTORY BUILDER

  private buildDirectory(
    channelCode: string,
    usageType: BusinessUsageType,
    postId?: number
  ) {
    if (usageType === 'post') {
      if (postId) {
        return path.join(
          UPLOAD_ROOT,
          channelCode,
          'posts',
          `post_${postId}`
        )
      }

      return path.join(
        UPLOAD_ROOT,
        channelCode,
        'temp'
      )
    }

    return path.join(
      UPLOAD_ROOT,
      channelCode,
      usageType
    )
  }

  // SECTION 08 : RELATIVE PATH BUILDER

  private buildRelativePath(
    channelCode: string,
    usageType: BusinessUsageType,
    fileName: string,
    postId?: number
  ) {
    if (usageType === 'post') {
      if (postId) {
        return `${channelCode}/posts/post_${postId}/${fileName}`
      }

      return `${channelCode}/temp/${fileName}`
    }

    return `${channelCode}/${usageType}/${fileName}`
  }

  // SECTION 09 : FILE NAME BUILDER

  private generateFileName(params: {
    usageType: BusinessUsageType
    postId?: number
    index?: number
  }) {
    const now = Date.now()
    const rand = randomBytes(4).toString('hex')

    if (params.usageType === 'avatar') {
      return `avatar_${now}_${rand}.webp`
    }

    if (params.usageType === 'hero') {
      return `hero_${now}_${rand}.webp`
    }

    if (params.usageType === 'post') {
      if (params.postId) {
        return `post_${params.postId}_${params.index ?? 1}_${now}_${rand}.webp`
      }

      return `post_temp_${now}_${rand}.webp`
    }

    if (params.usageType === 'gallery') {
      return `gallery_${now}_${rand}.webp`
    }

    if (params.usageType === 'place-thumbnail') {
      return `place_thumbnail_${now}_${rand}.webp`
    }

    if (params.usageType === 'pos-product-thumbnail') {
      return `pos_product_thumbnail_${now}_${rand}.webp`
    }

    throw new BadRequestException('invalid usageType')
  }

  // SECTION 10 : DIRECTORY ENSURE

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      })
    }
  }

  // SECTION 11 : MEDIA STATS

  async getMediaStats() {
    const total = db.prepare(`
      SELECT
        COUNT(*) AS count,
        COALESCE(SUM(ia.fileSize), 0) AS size
      FROM image_assets ia
      INNER JOIN profiles p
        ON p.channelCode = ia.channelCode
      WHERE p.profileType = 'BUSINESS'
    `).get() as {
      count: number
      size: number
    }

    const orphan = db.prepare(`
      SELECT
        COUNT(*) AS count,
        COALESCE(SUM(ia.fileSize), 0) AS size
      FROM image_assets ia
      INNER JOIN profiles p
        ON p.channelCode = ia.channelCode
      WHERE p.profileType = 'BUSINESS'
        AND ia.isActive = 0
    `).get() as {
      count: number
      size: number
    }

    return {
      totalFiles: total.count,
      totalSize: total.size,
      orphanFiles: orphan.count,
      orphanSize: orphan.size
    }
  }

  // SECTION 12 : GET ORPHANS

  async getOrphanImages() {
    return db.prepare(`
      SELECT
        ia.id,
        ia.channelCode,
        ia.usageType,
        ia.fileName,
        ia.filePath,
        ia.fileSize,
        ia.createdAt
      FROM image_assets ia
      INNER JOIN profiles p
        ON p.channelCode = ia.channelCode
      WHERE p.profileType = 'BUSINESS'
        AND ia.isActive = 0
      ORDER BY ia.id DESC
    `).all()
  }

  // SECTION 13 : CLEAR ORPHANS

  async clearOrphans() {
    const orphans = await this.getOrphanImages()

    let deleted = 0

    for (const file of orphans as Array<{ id: number }>) {
      try {
        await this.deleteImage(file.id)
        deleted++
      } catch (error) {
        console.error(
          '[BUSINESS ORPHAN CLEAN FAIL]',
          file.id,
          error
        )
      }
    }

    return {
      ok: true,
      deleted
    }
  }
}

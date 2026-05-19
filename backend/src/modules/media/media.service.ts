// FILE : backend/src/modules/media/media.service.ts
// ROOT : backend/src/modules/media/media.service.ts
// STATUS : FINAL PRODUCTION SAFE v5
// ROLE : MEDIA CORE (POST TEMP UPLOAD SAFE)

// SECTION 01 : IMPORT

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common'

import * as fs from 'fs'
import * as path from 'path'

import db from '../../config/database'

// SECTION 02 : CONSTANT

const UPLOAD_ROOT = path.resolve(
  __dirname,
  '../../../uploads'
)

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp'
]

const MAX_FILE_SIZE = 5 * 1024 * 1024

type UsageType =
  | 'avatar'
  | 'hero'
  | 'post'
  | 'gallery'

// SECTION 03 : SERVICE

@Injectable()
export class MediaService {
  // SECTION 04 : UPLOAD IMAGE

  async uploadImage(params: {
    file: Express.Multer.File
    channelCode: string
    usageType: UsageType
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

      if (!ALLOWED_MIME.includes(file.mimetype)) {
        throw new BadRequestException('invalid mime')
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException('file too large')
      }

      const profile = db.prepare(`
        SELECT id
        FROM profiles
        WHERE channelCode = ?
      `).get(channelCode) as { id: number } | undefined

      if (!profile) {
        throw new BadRequestException('invalid channelCode')
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

      const fullPath = path.join(dir, fileName)

      const relativePath = this.buildRelativePath(
        channelCode,
        usageType,
        fileName,
        safePostId
      )

      fs.writeFileSync(
        fullPath,
        file.buffer
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
            createdAt
          )
          VALUES(
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
          file.mimetype,
          file.size
        )

        assetId = Number(result.lastInsertRowid)

        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }

        console.error(
          '[MEDIA DB INSERT FAIL]',
          error
        )

        throw new InternalServerErrorException(
          'media insert fail'
        )
      }

      return {
        assetId,
        fileName,
        filePath: relativePath
      }
    } catch (error) {
      console.error(
        '[MEDIA UPLOAD ERROR]',
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

    const ref = db.prepare(`
      SELECT 1 FROM profile_avatars
      WHERE imageAssetId = ?

      UNION

      SELECT 1 FROM profile_hero_images
      WHERE imageAssetId = ?

      UNION

      SELECT 1 FROM post_images
      WHERE imageAssetId = ?

      LIMIT 1
    `).get(
      assetId,
      assetId,
      assetId
    )

    if (ref) {
      console.error(
        '[MEDIA FK BLOCK]',
        assetId
      )

      return
    }

    await this.forceDelete(assetId)
  }

  // SECTION 06 : FORCE DELETE

  private async forceDelete(assetId: number) {
    const asset = db.prepare(`
      SELECT filePath
      FROM image_assets
      WHERE id = ?
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
        '[MEDIA DELETE ERROR]',
        assetId
      )
    }
  }

  // SECTION 07 : DIRECTORY BUILDER

  private buildDirectory(
    channelCode: string,
    usageType: UsageType,
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
    usageType: UsageType,
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
    usageType: UsageType
    postId?: number
    index?: number
  }) {
    const now = Date.now()

    const rand = Math.random()
      .toString(36)
      .slice(2, 8)

    if (params.usageType === 'avatar') {
      return `avatar_${now}_${rand}.webp`
    }

    if (params.usageType === 'hero') {
      return `hero_${now}_${rand}.webp`
    }

    if (params.usageType === 'post') {
      if (params.postId) {
        return `post_${params.postId}_${params.index ?? 1}_${now}.webp`
      }

      return `post_temp_${now}_${rand}.webp`
    }

    if (params.usageType === 'gallery') {
      return `gallery_${now}_${rand}.webp`
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
      SELECT COUNT(*) count,
      COALESCE(SUM(fileSize), 0) size
      FROM image_assets
    `).get() as {
      count: number
      size: number
    }

    const orphan = db.prepare(`
      SELECT COUNT(*) count,
      COALESCE(SUM(fileSize), 0) size
      FROM image_assets
      WHERE isActive = 0
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
        id,
        channelCode,
        usageType,
        fileName,
        filePath,
        fileSize,
        createdAt
      FROM image_assets
      WHERE isActive = 0
      ORDER BY id DESC
    `).all()
  }

  // SECTION 13 : CLEAR ORPHANS

  async clearOrphans() {
    const orphans = await this.getOrphanImages()

    let deleted = 0

    for (const file of orphans) {
      try {
        await this.deleteImage(file.id)
        deleted++
      } catch (error) {
        console.error(
          '[ORPHAN CLEAN FAIL]',
          file.id
        )
      }
    }

    return {
      ok: true,
      deleted
    }
  }
}
// FILE : backend/src/modules/business/media/business-media.controller.ts
// ROOT : backend/src/modules/business/media/business-media.controller.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS MEDIA DOMAIN ENTRY
// CHANGE SUMMARY :
// - 기존 media.controller.ts 는 유지
// - 신규 BUSINESS 전용 media controller 생성
// - BUSINESS 전용 경로 /api/business/media 로 분리
// - BusinessMediaService 호출 구조로 분리
// - JWT 기반 channelCode / BUSINESS profileType 검증 추가

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import {
  Controller,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
  ForbiddenException
} from '@nestjs/common'

import { FileInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '@nestjs/passport'

import { Request } from 'express'

import { BusinessMediaService } from './business-media.service'

/* ==================================================
SECTION 02 : TYPES
================================================== */

type AuthRequestUser = {
  channelCode?: string | null
  profileType?: string | null
}

type BusinessUsageType =
  | 'avatar'
  | 'post'
  | 'hero'
  | 'gallery'
  | 'place-thumbnail'
  | 'pos-product-thumbnail'

/* ==================================================
SECTION 03 : CONTROLLER
================================================== */

@Controller('business/media')
export class BusinessMediaController {
  constructor(
    private readonly businessMediaService: BusinessMediaService
  ) {}

  /* ==================================================
  SECTION 04 : AUTH HELPER
  ================================================== */

  private getBusinessChannel(req: Request) {
    const user = (req.user || {}) as AuthRequestUser

    const channelCode = user.channelCode || null
    const profileType = user.profileType || null

    if (!channelCode) {
      throw new BadRequestException('channelCode missing')
    }

    if (profileType !== 'BUSINESS') {
      throw new ForbiddenException('business profile only')
    }

    return channelCode
  }

  /* ==================================================
  SECTION 05 : IMAGE UPLOAD
  POST /api/business/media/upload
  BUSINESS MEDIA STORAGE ONLY
  ================================================== */

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile()
    file: Express.Multer.File,

    @Body()
    body: any,

    @Req()
    req: Request
  ) {
    if (!file) {
      throw new BadRequestException('file required')
    }

    const channelCode = this.getBusinessChannel(req)

    const usageType = (body?.usageType || 'post') as BusinessUsageType

    const allowed: BusinessUsageType[] = [
      'avatar',
      'post',
      'hero',
      'gallery',
      'place-thumbnail',
      'pos-product-thumbnail'
    ]

    if (!allowed.includes(usageType)) {
      throw new BadRequestException('invalid usageType')
    }

    const rawPostId = Number(body?.postId)
    const rawIndex = Number(body?.index)

    const safePostId =
      Number.isInteger(rawPostId) && rawPostId > 0
        ? rawPostId
        : undefined

    const safeIndex =
      Number.isInteger(rawIndex) && rawIndex > 0
        ? rawIndex
        : undefined

    const result =
      await this.businessMediaService.uploadImage({
        file,
        channelCode,
        usageType,
        postId: safePostId,
        index: safeIndex
      })

    return {
      ok: true,
      assetId: result.assetId,
      fileName: result.fileName,
      filePath: result.filePath
    }
  }

  /* ==================================================
  SECTION 06 : IMAGE DELETE
  DELETE /api/business/media/image
  BUSINESS MEDIA ONLY
  ================================================== */

  @UseGuards(AuthGuard('jwt'))
  @Delete('image')
  async deleteImage(
    @Body()
    body: any,

    @Req()
    req: Request
  ) {
    if (!body?.assetId) {
      throw new BadRequestException('assetId required')
    }

    this.getBusinessChannel(req)

    await this.businessMediaService.deleteImage(
      Number(body.assetId)
    )

    return {
      ok: true
    }
  }
}

/* ==================================================
SECTION END
================================================== */

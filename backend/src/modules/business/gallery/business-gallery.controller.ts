// FILE : backend/src/modules/business/gallery/business-gallery.controller.ts
// ROOT : backend/src/modules/business/gallery/business-gallery.controller.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS GALLERY RELATION CONTROLLER
// CHANGE SUMMARY :
// - BUSINESS 사진첩 전용 controller 유지
// - 목록 로딩 / 업로드 / 연결 / 연결해제 엔드포인트 정렬
// - POST /business/gallery/upload 라우트 추가
// - controller → service only 구조 유지
// - 저장은 business-media.service.ts 가 담당하고 본 controller 는 gallery service 를 통해 upload 위임만 수행
// - 실제 파일 삭제는 수행하지 않고 unlink only 정책 유지

// SECTION 01 : IMPORT

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'

import { FileInterceptor } from '@nestjs/platform-express'

import { BusinessGalleryService } from './business-gallery.service'

// SECTION 02 : TYPE

type UploadBusinessGalleryBody = {
  profileId: number
  channelCode: string
}

type ConnectBusinessGalleryBody = {
  profileId: number
  channelCode: string
  imageAssetId: number
  caption?: string | null
}

type UnlinkBusinessGalleryBody = {
  profileId: number
  channelCode: string
}

// SECTION 03 : CONTROLLER

@Controller('business/gallery')
export class BusinessGalleryController {
  // SECTION 04 : CONSTRUCTOR

  constructor(
    private readonly businessGalleryService: BusinessGalleryService
  ) {}

  // SECTION 05 : GALLERY LIST

  @Get(':channelCode')
  getBusinessGalleryByChannelCode(
    @Param('channelCode') channelCode: string
  ) {
    return this.businessGalleryService.getBusinessGalleryByChannelCode(
      channelCode
    )
  }

  // SECTION 06 : GALLERY UPLOAD

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadBusinessGalleryAsset(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadBusinessGalleryBody
  ) {
    return this.businessGalleryService.uploadBusinessGalleryAsset({
      profileId: Number(body.profileId),
      channelCode: body.channelCode,
      file
    })
  }

  // SECTION 07 : GALLERY CONNECT

  @Post('connect')
  connectBusinessGalleryImage(
    @Body() body: ConnectBusinessGalleryBody
  ) {
    return this.businessGalleryService.connectBusinessGalleryImage({
      profileId: body.profileId,
      channelCode: body.channelCode,
      imageAssetId: body.imageAssetId,
      caption: body.caption ?? null
    })
  }

  // SECTION 08 : GALLERY UNLINK

  @Delete(':galleryId')
  unlinkBusinessGalleryImage(
    @Param('galleryId') galleryId: string,
    @Body() body: UnlinkBusinessGalleryBody
  ) {
    return this.businessGalleryService.unlinkBusinessGalleryImage({
      profileId: body.profileId,
      channelCode: body.channelCode,
      galleryId: Number(galleryId)
    })
  }
}
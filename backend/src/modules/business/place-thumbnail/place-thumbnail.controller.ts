// FILE : backend/src/modules/business/place-thumbnail/place-thumbnail.controller.ts
// ROOT : backend/src/modules/business/place-thumbnail/place-thumbnail.controller.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS PROFILE PLACE THUMBNAIL CONTROLLER
// CHANGE SUMMARY :
// - BUSINESS 피드/플레이스 썸네일 전용 controller 생성
// - ProfilePlaceThumbnailService 기반 썸네일 조회/연결/수정/정렬/삭제 API 구성
// - getAuthUserId 로직을 id / userId / sub 대응 구조로 적용
// - number / string payload 안전 처리
// - write API에 JwtAuthGuard 적용
// - read API는 공개 유지
// - controller thin layer 원칙 유지

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Req,
  UseGuards
} from '@nestjs/common'

import { JwtAuthGuard } from '../../auth/jwt.guard'
import { ProfilePlaceThumbnailService } from './place-thumbnail.service'

// SECTION 01 : TYPE

type RequestUserShape = {
  id?: number | string
  userId?: number | string
  sub?: number | string
}

type RequestShape = {
  user?: RequestUserShape
}

type ConnectPlaceThumbnailBody = {
  channelCode?: string
  imageAssetId?: number | null
  sortOrder?: number | null
}

type UpdatePlaceThumbnailBody = {
  channelCode?: string
  sortOrder?: number | null
  isActive?: number | null
}

type ReorderPlaceThumbnailItemBody = {
  thumbnailId: number
  sortOrder: number
}

type ReorderPlaceThumbnailBody = {
  channelCode?: string
  items?: ReorderPlaceThumbnailItemBody[]
}

// SECTION 02 : CONTROLLER

@Controller('business/place-thumbnail')
export class ProfilePlaceThumbnailController {
  // SECTION 03 : CONSTRUCTOR

  constructor(
    private readonly profilePlaceThumbnailService: ProfilePlaceThumbnailService
  ) {}

  // SECTION 04 : HELPER

  private getAuthUserId(
    req: RequestShape
  ): number {
    const rawUser =
      req.user

    const candidate =
      typeof rawUser?.id === 'number'
        ? rawUser.id
        : typeof rawUser?.userId === 'number'
          ? rawUser.userId
          : typeof rawUser?.sub === 'number'
            ? rawUser.sub
            : typeof rawUser?.id === 'string'
              ? Number(rawUser.id)
              : typeof rawUser?.userId === 'string'
                ? Number(rawUser.userId)
                : typeof rawUser?.sub === 'string'
                  ? Number(rawUser.sub)
                  : NaN

    if (
      !Number.isInteger(candidate) ||
      candidate <= 0
    ) {
      throw new BadRequestException('auth invalid')
    }

    return candidate
  }

  private parseProfileId(
    value: string
  ): number {
    const parsed =
      Number(value)

    if (
      !Number.isInteger(parsed) ||
      parsed <= 0
    ) {
      throw new BadRequestException('profileId invalid')
    }

    return parsed
  }

  private parseThumbnailId(
    value: string
  ): number {
    const parsed =
      Number(value)

    if (
      !Number.isInteger(parsed) ||
      parsed <= 0
    ) {
      throw new BadRequestException('thumbnailId invalid')
    }

    return parsed
  }

  private requireChannelCode(
    channelCode?: string
  ): string {
    const normalized =
      channelCode?.trim()

    if (!normalized) {
      throw new BadRequestException('channelCode missing')
    }

    return normalized
  }

  private normalizeImageAssetId(
    imageAssetId?: number | null
  ): number {
    if (
      typeof imageAssetId !== 'number' ||
      Number.isNaN(imageAssetId) ||
      imageAssetId <= 0
    ) {
      throw new BadRequestException('imageAssetId invalid')
    }

    return Math.floor(imageAssetId)
  }

  private normalizeSortOrder(
    sortOrder?: number | null
  ): number | null {
    if (
      sortOrder === null ||
      sortOrder === undefined
    ) {
      return null
    }

    if (
      typeof sortOrder !== 'number' ||
      Number.isNaN(sortOrder) ||
      sortOrder <= 0
    ) {
      throw new BadRequestException('sortOrder invalid')
    }

    return Math.floor(sortOrder)
  }

  private normalizeIsActive(
    isActive?: number | null
  ): number | null {
    if (
      isActive === null ||
      isActive === undefined
    ) {
      return null
    }

    return isActive === 1
      ? 1
      : 0
  }

  // SECTION 05 : READ API

  @Get(':profileId')
  getProfilePlaceThumbnails(
    @Param('profileId') profileIdParam: string,
    @Query('channelCode') channelCode?: string
  ) {
    const profileId =
      this.parseProfileId(profileIdParam)

    const normalizedChannelCode =
      this.requireChannelCode(channelCode)

    return this.profilePlaceThumbnailService.getProfilePlaceThumbnails(
      profileId,
      normalizedChannelCode
    )
  }

  @Get(':profileId/:thumbnailId')
  getProfilePlaceThumbnailDetail(
    @Param('profileId') profileIdParam: string,
    @Param('thumbnailId') thumbnailIdParam: string,
    @Query('channelCode') channelCode?: string
  ) {
    const profileId =
      this.parseProfileId(profileIdParam)

    const thumbnailId =
      this.parseThumbnailId(thumbnailIdParam)

    const normalizedChannelCode =
      this.requireChannelCode(channelCode)

    return this.profilePlaceThumbnailService.getProfilePlaceThumbnailDetail(
      profileId,
      normalizedChannelCode,
      thumbnailId
    )
  }

  // SECTION 06 : WRITE API

  @UseGuards(JwtAuthGuard)
  @Put(':profileId')
  connectProfilePlaceThumbnail(
    @Req() req: RequestShape,
    @Param('profileId') profileIdParam: string,
    @Body() body: ConnectPlaceThumbnailBody
  ) {
    const userId =
      this.getAuthUserId(req)

    const profileId =
      this.parseProfileId(profileIdParam)

    return this.profilePlaceThumbnailService.connectProfilePlaceThumbnail(
      userId,
      profileId,
      {
        channelCode: this.requireChannelCode(body.channelCode),
        imageAssetId: this.normalizeImageAssetId(body.imageAssetId),
        sortOrder: this.normalizeSortOrder(body.sortOrder)
      }
    )
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':profileId/reorder')
  reorderProfilePlaceThumbnails(
    @Req() req: RequestShape,
    @Param('profileId') profileIdParam: string,
    @Body() body: ReorderPlaceThumbnailBody
  ) {
    const userId =
      this.getAuthUserId(req)

    const profileId =
      this.parseProfileId(profileIdParam)

    return this.profilePlaceThumbnailService.reorderProfilePlaceThumbnails(
      userId,
      profileId,
      {
        channelCode: this.requireChannelCode(body.channelCode),
        items: Array.isArray(body.items)
          ? body.items
          : []
      }
    )
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':profileId/:thumbnailId')
  updateProfilePlaceThumbnailMeta(
    @Req() req: RequestShape,
    @Param('profileId') profileIdParam: string,
    @Param('thumbnailId') thumbnailIdParam: string,
    @Body() body: UpdatePlaceThumbnailBody
  ) {
    const userId =
      this.getAuthUserId(req)

    const profileId =
      this.parseProfileId(profileIdParam)

    const thumbnailId =
      this.parseThumbnailId(thumbnailIdParam)

    return this.profilePlaceThumbnailService.updateProfilePlaceThumbnailMeta(
      userId,
      profileId,
      thumbnailId,
      {
        channelCode: this.requireChannelCode(body.channelCode),
        sortOrder: this.normalizeSortOrder(body.sortOrder),
        isActive: this.normalizeIsActive(body.isActive)
      }
    )
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':profileId/:thumbnailId')
  deleteProfilePlaceThumbnail(
    @Req() req: RequestShape,
    @Param('profileId') profileIdParam: string,
    @Param('thumbnailId') thumbnailIdParam: string,
    @Query('channelCode') channelCode?: string
  ) {
    const userId =
      this.getAuthUserId(req)

    const profileId =
      this.parseProfileId(profileIdParam)

    const thumbnailId =
      this.parseThumbnailId(thumbnailIdParam)

    const normalizedChannelCode =
      this.requireChannelCode(channelCode)

    return this.profilePlaceThumbnailService.deleteProfilePlaceThumbnail(
      userId,
      profileId,
      normalizedChannelCode,
      thumbnailId
    )
  }
}

// SECTION 07 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- ProfilePlaceThumbnailService 기준 controller 생성
- GET 목록 조회 공개
- GET 상세 조회 공개
- PUT 연결 API JwtAuthGuard 적용
- PATCH 정렬 API JwtAuthGuard 적용
- PATCH 메타 수정 API JwtAuthGuard 적용
- DELETE relation 삭제 API JwtAuthGuard 적용
- profileId parse 검증
- thumbnailId parse 검증
- channelCode 필수 검증
- imageAssetId 필수 검증
- Controller thin layer 유지
- DB 직접 접근 없음
- Service 호출만 수행
*/
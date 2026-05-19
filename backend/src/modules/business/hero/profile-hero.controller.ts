// FILE : backend/src/modules/business/hero/profile-hero.controller.ts
// ROOT : backend/src/modules/business/hero/profile-hero.controller.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE HERO CONTROLLER
// CHANGE SUMMARY :
// - BUSINESS 커버/히어로 전용 controller 유지
// - ProfileHeroService 기반 hero 조회/연결/수정/정렬/삭제 API 구조 유지
// - getAuthUserId 로직을 id / userId / sub 대응 구조로 유지
// - number / string payload 모두 안전하게 처리
// - hero write API에 JwtAuthGuard 추가
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
import { ProfileHeroService } from './profile-hero.service'

// SECTION 01 : TYPE

type RequestUserShape = {
  id?: number | string
  userId?: number | string
  sub?: number | string
}

type RequestShape = {
  user?: RequestUserShape
}

type ConnectProfileHeroBody = {
  channelCode?: string
  imageAssetId?: number | null
  externalUrl?: string | null
  title?: string | null
  description?: string | null
  linkUrl?: string | null
  sortOrder?: number | null
}

type UpdateProfileHeroBody = {
  channelCode?: string
  title?: string | null
  description?: string | null
  linkUrl?: string | null
  sortOrder?: number | null
  isActive?: number | null
}

type ReorderProfileHeroItemBody = {
  heroId: number
  sortOrder: number
}

type ReorderProfileHeroBody = {
  channelCode?: string
  items?: ReorderProfileHeroItemBody[]
}

// SECTION 02 : CONTROLLER

@Controller('business/profile-hero')
export class ProfileHeroController {
  // SECTION 03 : CONSTRUCTOR

  constructor(
    private readonly profileHeroService: ProfileHeroService
  ) {}

  // SECTION 04 : HELPER

  private getAuthUserId(
    req: RequestShape
  ): number {
    const rawUser = req.user

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
    const parsed = Number(value)

    if (
      !Number.isInteger(parsed) ||
      parsed <= 0
    ) {
      throw new BadRequestException('profileId invalid')
    }

    return parsed
  }

  private parseHeroId(
    value: string
  ): number {
    const parsed = Number(value)

    if (
      !Number.isInteger(parsed) ||
      parsed <= 0
    ) {
      throw new BadRequestException('heroId invalid')
    }

    return parsed
  }

  private requireChannelCode(
    channelCode?: string
  ): string {
    const normalized = channelCode?.trim()

    if (!normalized) {
      throw new BadRequestException('channelCode missing')
    }

    return normalized
  }

  // SECTION 05 : READ API

  @Get(':profileId')
  getProfileHeroImages(
    @Param('profileId') profileIdParam: string,
    @Query('channelCode') channelCode?: string
  ) {
    const profileId = this.parseProfileId(profileIdParam)
    const normalizedChannelCode =
      this.requireChannelCode(channelCode)

    return this.profileHeroService.getProfileHeroImages(
      profileId,
      normalizedChannelCode
    )
  }

  @Get(':profileId/:heroId')
  getProfileHeroImageDetail(
    @Param('profileId') profileIdParam: string,
    @Param('heroId') heroIdParam: string,
    @Query('channelCode') channelCode?: string
  ) {
    const profileId = this.parseProfileId(profileIdParam)
    const heroId = this.parseHeroId(heroIdParam)
    const normalizedChannelCode =
      this.requireChannelCode(channelCode)

    return this.profileHeroService.getProfileHeroImageDetail(
      profileId,
      normalizedChannelCode,
      heroId
    )
  }

  // SECTION 06 : WRITE API

  @UseGuards(JwtAuthGuard)
  @Put(':profileId')
  connectProfileHeroImage(
    @Req() req: RequestShape,
    @Param('profileId') profileIdParam: string,
    @Body() body: ConnectProfileHeroBody
  ) {
    const userId = this.getAuthUserId(req)
    const profileId = this.parseProfileId(profileIdParam)

    return this.profileHeroService.connectProfileHeroImage(
      userId,
      profileId,
      {
        channelCode: this.requireChannelCode(body.channelCode),
        imageAssetId: body.imageAssetId ?? null,
        externalUrl: body.externalUrl ?? null,
        title: body.title ?? null,
        description: body.description ?? null,
        linkUrl: body.linkUrl ?? null,
        sortOrder: body.sortOrder ?? null
      }
    )
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':profileId/reorder')
  reorderProfileHeroImages(
    @Req() req: RequestShape,
    @Param('profileId') profileIdParam: string,
    @Body() body: ReorderProfileHeroBody
  ) {
    const userId = this.getAuthUserId(req)
    const profileId = this.parseProfileId(profileIdParam)

    return this.profileHeroService.reorderProfileHeroImages(
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
  @Patch(':profileId/:heroId')
  updateProfileHeroImageMeta(
    @Req() req: RequestShape,
    @Param('profileId') profileIdParam: string,
    @Param('heroId') heroIdParam: string,
    @Body() body: UpdateProfileHeroBody
  ) {
    const userId = this.getAuthUserId(req)
    const profileId = this.parseProfileId(profileIdParam)
    const heroId = this.parseHeroId(heroIdParam)

    return this.profileHeroService.updateProfileHeroImageMeta(
      userId,
      profileId,
      heroId,
      {
        channelCode: this.requireChannelCode(body.channelCode),
        title: body.title ?? null,
        description: body.description ?? null,
        linkUrl: body.linkUrl ?? null,
        sortOrder: body.sortOrder ?? null,
        isActive: body.isActive ?? null
      }
    )
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':profileId/:heroId')
  deleteProfileHeroImage(
    @Req() req: RequestShape,
    @Param('profileId') profileIdParam: string,
    @Param('heroId') heroIdParam: string,
    @Query('channelCode') channelCode?: string
  ) {
    const userId = this.getAuthUserId(req)
    const profileId = this.parseProfileId(profileIdParam)
    const heroId = this.parseHeroId(heroIdParam)
    const normalizedChannelCode =
      this.requireChannelCode(channelCode)

    return this.profileHeroService.deleteProfileHeroImage(
      userId,
      profileId,
      normalizedChannelCode,
      heroId
    )
  }
}
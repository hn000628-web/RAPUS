// FILE : backend/src/modules/business/profile-settings/profile-settings.controller.ts
// ROOT : backend/src/modules/business/profile-settings/profile-settings.controller.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE SETTINGS CONTROLLER
// CHANGE SUMMARY :
// - 존재하지 않는 service 메서드 호출 제거
// - industries / industry-subtypes 정적 GET route 유지
// - detail / core / industry / place / blocks / hours / avatar / hero read route 유지
// - core / channel / business / fields / blocks / hours write route 유지
// - 기존 테스트 userId=1 구조 유지

import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards
} from '@nestjs/common'

import { ProfileSettingsService } from './profile-settings.service'
import { JwtAuthGuard } from '../../auth/jwt.guard'

type AuthRequest = {
  user?: {
    id?: number
    userId?: number
    channelCode?: string
  }
}

// SECTION 01 : CONTROLLER

@Controller('business/profile-settings')
export class ProfileSettingsController {
  constructor(
    private readonly service: ProfileSettingsService
  ) {}

  // SECTION 02 : STATIC READ

  @Get('industries')
  getBusinessIndustryOptions(
    @Query('keyword') keyword?: string
  ) {
    return this.service.getBusinessIndustryOptions(keyword)
  }

  @Get('industry-subtypes')
  getBusinessIndustrySubtypeOptions(
    @Query('industryId') industryId?: string,
    @Query('keyword') keyword?: string
  ) {
    const normalizedIndustryId =
      typeof industryId === 'string' && industryId.trim()
        ? Number(industryId)
        : null

    return this.service.getBusinessIndustrySubtypeOptions(
      normalizedIndustryId,
      keyword
    )
  }

  // SECTION 03 : DETAIL READ

  @Get(':channelCode/detail')
  getProfileDetail(
    @Param('channelCode') channelCode: string
  ) {
    return this.service.getProfileDetailByChannelCode(channelCode)
  }

  @Get(':channelCode/summary')
  getProfileSummary(
    @Param('channelCode') channelCode: string
  ) {
    return this.service.getProfileDetailByChannelCode(channelCode)
  }

  // SECTION 04 : CORE READ

  @Get(':profileId')
  getProfile(
    @Param('profileId', ParseIntPipe) profileId: number
  ) {
    return this.service.getProfile(profileId)
  }

  @Get(':profileId/channel')
  getProfileChannel(
    @Param('profileId', ParseIntPipe) profileId: number
  ) {
    const profile = this.service.getProfile(profileId)

    return {
      id: profile.id,
      channelCode: profile.channelCode,
      channelURL: profile.channelURL,
      channelName: profile.channelName,
      profileType: profile.profileType
    }
  }

  @Get(':profileId/session')
  getProfileSession(
    @Param('profileId', ParseIntPipe) profileId: number
  ) {
    return null
  }

  @Get(':profileId/industry')
  getProfileIndustry(
    @Param('profileId', ParseIntPipe) profileId: number
  ) {
    return this.service.getIndustry(profileId)
  }

  @Get(':profileId/place')
  getProfilePlace(
    @Param('profileId', ParseIntPipe) profileId: number
  ) {
    return this.service.getPlaceMeta(profileId)
  }

  @Get(':profileId/blocks')
  getProfileBlocks(
    @Param('profileId', ParseIntPipe) profileId: number
  ) {
    return this.service.getProfileBlocks(profileId)
  }

  @Get(':profileId/hours')
  getProfileHours(
    @Param('profileId', ParseIntPipe) profileId: number
  ) {
    return this.service.getBusinessHoursRow(profileId)
  }

  @Get(':profileId/avatar')
  getProfileAvatar(
    @Param('profileId', ParseIntPipe) profileId: number
  ) {
    return this.service.getAvatar(profileId)
  }

  @Get(':profileId/hero')
  getProfileHeroImages(
    @Param('profileId', ParseIntPipe) profileId: number
  ) {
    return this.service.getHeroImages(profileId)
  }

  // SECTION 05 : WRITE

  @Patch(':profileId/core')
  @UseGuards(JwtAuthGuard)
  updateProfileCore(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Req() req: AuthRequest,
    @Body() body: {
      displayName?: string
    }
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? 0
    const channelCode = req.user?.channelCode ?? ''
    return this.service.updateProfileCore(userId, profileId, channelCode, body)
  }

  @Patch(':profileId/channel')
  @UseGuards(JwtAuthGuard)
  updateProfileChannel(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Req() req: AuthRequest,
    @Body() body: {
      channelName?: string | null
      channelURL?: string | null
      activityRegionId?: number | null
      feedRegionId?: number | null
      detailAddress?: string | null
    }
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? 0
    const channelCode = req.user?.channelCode ?? ''
    return this.service.updateProfileFields(userId, profileId, channelCode, body)
  }

  @Patch(':profileId/business')
  @UseGuards(JwtAuthGuard)
  updateProfileBusiness(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Req() req: AuthRequest,
    @Body() body: {
      detailAddress?: string | null
      primaryIndustryId?: number | null
      primaryIndustrySubtypeId?: number | null
      primaryIndustryCode?: string | null
      primaryIndustrySubtypeCode?: string | null
    }
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? 0
    const channelCode = req.user?.channelCode ?? ''
    return this.service.updateProfileFields(userId, profileId, channelCode, body)
  }

  @Patch(':profileId/fields')
  @UseGuards(JwtAuthGuard)
  updateProfileFields(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Req() req: AuthRequest,
    @Body() body: {
      detailAddress?: string | null
      primaryIndustryId?: number | null
      primaryIndustrySubtypeId?: number | null
      primaryIndustryCode?: string | null
      primaryIndustrySubtypeCode?: string | null
      channelName?: string | null
      channelURL?: string | null
      activityRegionId?: number | null
      feedRegionId?: number | null
    }
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? 0
    const channelCode = req.user?.channelCode ?? ''
    return this.service.updateProfileFields(userId, profileId, channelCode, body)
  }

  @Patch(':profileId/registration-number')
  @UseGuards(JwtAuthGuard)
  updateBusinessRegistrationNumber(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Req() req: AuthRequest,
    @Body() body: {
      channelCode?: string
      businessRegistrationNumber?: string | null
    }
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? 0
    const channelCode = body.channelCode?.trim() || req.user?.channelCode || ''

    return this.service.updateBusinessRegistrationNumber(
      userId,
      profileId,
      channelCode,
      {
        businessRegistrationNumber: body.businessRegistrationNumber
      }
    )
  }

  @Patch(':profileId/contact')
  @UseGuards(JwtAuthGuard)
  updateBusinessContactSettings(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Req() req: AuthRequest,
    @Body() body: {
      contactPhone?: string | null
      secondaryPhone?: string | null
      faxNumber?: string | null
      managerEmail?: string | null
    }
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? 0
    const channelCode = req.user?.channelCode ?? ''

    return this.service.updateContactSettings(
      userId,
      profileId,
      channelCode,
      body
    )
  }

  @Patch(':profileId/login-password')
  @UseGuards(JwtAuthGuard)
  updateBusinessLoginPassword(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Req() req: AuthRequest,
    @Body() body: {
      currentPassword?: string | null
      settlementApprovalPassword?: string | null
      newPassword?: string | null
      confirmNewPassword?: string | null
    }
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? 0
    const channelCode = req.user?.channelCode ?? ''

    return this.service.updateOperationPassword(
      userId,
      profileId,
      channelCode,
      body
    )
  }

  @Patch(':profileId/payment-password')
  @UseGuards(JwtAuthGuard)
  updateBusinessPaymentPassword(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Req() req: AuthRequest,
    @Body() body: {
      paymentPassword?: string | null
      confirmPaymentPassword?: string | null
    }
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? 0
    const channelCode = req.user?.channelCode ?? ''

    return this.service.updatePaymentPassword(
      userId,
      profileId,
      channelCode,
      body
    )
  }

  @Put(':profileId/blocks')
  @UseGuards(JwtAuthGuard)
  replaceProfileBlocks(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Req() req: AuthRequest,
    @Body() body: {
      blocks: Array<{
        blockType: string
        title?: string | null
        content?: string | null
        linkUrl?: string | null
        sortOrder: number
        isActive?: number | null
      }>
    }
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? 0
    return this.service.replaceProfileBlocks(
      userId,
      profileId,
      Array.isArray(body?.blocks) ? body.blocks : []
    )
  }

  @Patch(':profileId/hours')
  @UseGuards(JwtAuthGuard)
  updateProfileHours(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Req() req: AuthRequest,
    @Body() body: {
      weeklyHours: Array<{
        dayKey: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
        dayLabel: string
        isClosed: boolean
        openTime: string
        closeTime: string
      }>
    }
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? 0
    return this.service.updateProfileHours(userId, profileId, body)
  }
}

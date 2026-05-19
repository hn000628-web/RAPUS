// FILE: backend/src/modules/business/hours/business-hours.controller.ts
// ROOT: backend/src/modules/business/hours/business-hours.controller.ts
// STATUS: PRODUCTION READY
// ROLE: BUSINESS HOURS CONTROLLER
// CHANGE SUMMARY:
// - GET /api/business/hours
// - PATCH /api/business/hours
// - JwtAuthGuard 적용
// - 메뉴 API 패턴과 동일한 단일 리소스 구조

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
  BadRequestException
} from '@nestjs/common'

import { JwtAuthGuard } from '../../auth/jwt.guard'
import {
  BusinessHoursService,
  SaveBusinessHoursPayload,
  UpdateBusinessHoursPayload
} from './business-hours.service'

/* ==================================================
SECTION 01 : DTO
================================================== */

type UpdateBusinessHoursBodyDto = SaveBusinessHoursPayload
type UpdateBusinessHoursStatusBodyDto = UpdateBusinessHoursPayload

/* ==================================================
SECTION 02 : CONTROLLER
================================================== */

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessHoursController {

  constructor(
    private readonly service: BusinessHoursService
  ) {}

  /* ==================================================
  SECTION 03 : GET HOURS
  ================================================== */

  @Get('hours')
  async getHours(@Req() req: any) {
    return this.service.getHours(req.user)
  }

  /* ==================================================
  SECTION 04 : PATCH HOURS
  ================================================== */

  @Patch('hours')
  async saveHours(
    @Req() req: any,
    @Body() body: UpdateBusinessHoursBodyDto
  ) {

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('INVALID_HOURS_PAYLOAD')
    }

    return this.service.saveHours(req.user, body)
  }

  /* ==================================================
  SECTION 05 : PATCH HOURS STATUS
  ================================================== */

  @Get('profile/:channelCode/hours')
  async getBusinessHoursByChannel(
    @Req() req: any,
    @Param('channelCode') channelCode: string
  ) {
    if (!channelCode?.trim()) {
      throw new BadRequestException('CHANNEL_CODE_REQUIRED')
    }

    const profileId =
      Number(req?.user?.profileId || 0)

    if (!profileId) {
      throw new BadRequestException('PROFILE_ID_REQUIRED')
    }

    return this.service.getBusinessHours(
      profileId,
      channelCode.trim()
    )
  }

  @Patch('profile/:channelCode/hours')
  async updateBusinessHoursStatus(
    @Req() req: any,
    @Param('channelCode') channelCode: string,
    @Body() body: UpdateBusinessHoursStatusBodyDto
  ) {
    if (!channelCode?.trim()) {
      throw new BadRequestException('CHANNEL_CODE_REQUIRED')
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('INVALID_HOURS_UPDATE_PAYLOAD')
    }

    const profileId =
      Number(req?.user?.profileId || 0)

    if (!profileId) {
      throw new BadRequestException('PROFILE_ID_REQUIRED')
    }

    return this.service.updateBusinessHours(
      profileId,
      channelCode.trim(),
      body
    )
  }
}

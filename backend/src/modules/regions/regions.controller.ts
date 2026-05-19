/* ==================================================
FILE : backend/src/modules/regions/regions.controller.ts
SECTION CODE OUTPUT : REGIONS CONTROLLER (PRODUCTION FINAL SAFE)
ROOT : backend/src/modules/regions/regions.controller.ts
STATUS :
ROUTE COLLISION SAFE
NEST COMPATIBLE
PRODUCTION FINAL
================================================== */

/* ==================================================
SECTION 00 IMPORTS
================================================== */

import {
Controller,
Get,
Patch,
Body,
BadRequestException,
UseGuards,
Req,
Query,
Param
} from '@nestjs/common'

import {
RegionsService
} from './regions.service'

import {
JwtAuthGuard
} from '../auth/jwt.guard'

/* ==================================================
SECTION 01 TYPES
================================================== */

type AuthRequest = {
  user: {
    userId?: number
    sub?: number
    profileId: number
    profileType: 'GENERAL' | 'BUSINESS'
  }
}

/* ==================================================
SECTION 02 CONTROLLER
================================================== */

@Controller('regions')
export class RegionsController {

  constructor(
    private readonly regionsService: RegionsService
  ) {}

  /* ==================================================
  SECTION 03 AUTH HELPER
  ================================================== */

  private getUserId(req: AuthRequest) {

    const id =
      req.user?.userId ??
      req.user?.sub

    if (!id)
      throw new BadRequestException('user not found')

    return Number(id)
  }

  private getProfileId(req: AuthRequest) {

    const id = req.user?.profileId

    if (!id)
      throw new BadRequestException('profile not found')

    return Number(id)
  }

  /* ==================================================
  SECTION 04 ALL REGIONS (PUBLIC)
  ================================================== */

  @Get()
  async getAllRegions() {
    return this.regionsService.getAllDongRegions()
  }

  /* ==================================================
  SECTION 05 REGION SEARCH (PUBLIC)
  ================================================== */

  @Get('search')
  async searchRegions(
    @Query('q') query: string
  ) {

    const q = (query || '').trim()

    if (!q || q.length < 2) {
      return {
        ok: true,
        regions: []
      }
    }

    return this.regionsService.searchRegions(q)
  }

  /* ==================================================
  SECTION 06 GPS REGION (PUBLIC)
  ================================================== */

  @Get('gps')
  async findRegionByGps(
    @Query('lat') lat: string,
    @Query('lng') lng: string
  ) {

    const latitude = Number(lat)
    const longitude = Number(lng)

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException('invalid lat/lng')
    }

    return this.regionsService.findRegionByGps(
      latitude,
      longitude
    )
  }

  /* ==================================================
  SECTION 07 CURRENT REGION (AUTH)
  ================================================== */

  @UseGuards(JwtAuthGuard)
  @Get('current')
  async getCurrentRegion(@Req() req: AuthRequest) {

    const profileId =
      this.getProfileId(req)

    return this.regionsService.getCurrentRegion(
      profileId
    )
  }

  /* ==================================================
  SECTION 08 DETAIL ADDRESS (AUTH)
  ================================================== */

  @UseGuards(JwtAuthGuard)
  @Get('detail')
  async getDetailAddress(@Req() req: AuthRequest) {

    const profileId =
      this.getProfileId(req)

    return this.regionsService.getDetailAddress(
      profileId
    )
  }

  /* ==================================================
  SECTION 09 REGION BY ID (PUBLIC)
  🔥 FIX : REGEX 제거 + 내부 validation
  ================================================== */

  @Get(':id')
  async getRegionById(@Param('id') id: string) {

    // 🔥 문자열 차단 (search 충돌 방지)
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('regionId must be numeric')
    }

    const regionId = Number(id)

    if (regionId <= 0) {
      throw new BadRequestException('invalid regionId')
    }

    return this.regionsService.getRegionById(regionId)
  }

  /* ==================================================
  SECTION 10 PROFILE REGION UPDATE (AUTH)
  ================================================== */

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfileRegion(

    @Req() req: AuthRequest,

    @Body() body: {
      regionId: number
      detailAddress?: string
    }

  ) {

    const profileId =
      this.getProfileId(req)

    const regionId =
      Number(body.regionId)

    const detailAddress =
      body.detailAddress?.trim() || null

    if (
      Number.isNaN(regionId) ||
      regionId <= 0
    ) {
      throw new BadRequestException('regionId must be valid number')
    }

    if (
      detailAddress &&
      detailAddress.length > 200
    ) {
      throw new BadRequestException('detailAddress too long')
    }

    return this.regionsService.updateProfileRegion(
      profileId,
      regionId,
      detailAddress
    )
  }

  /* ==================================================
  SECTION 11 FEED REGION UPDATE (AUTH)
  ================================================== */

  @UseGuards(JwtAuthGuard)
  @Patch('feed')
  async updateFeedRegion(

    @Req() req: AuthRequest,

    @Body() body: {
      regionId: number
    }

  ) {

    const profileId =
      this.getProfileId(req)

    const regionId =
      Number(body.regionId)

    if (
      Number.isNaN(regionId) ||
      regionId <= 0
    ) {
      throw new BadRequestException(
        'regionId must be valid number'
      )
    }

    return this.regionsService.updateFeedRegion(
      profileId,
      regionId
    )
  }
}
// FILE : backend/src/modules/business/industry/business-industry.controller.ts
// ROOT : backend/src/modules/business/industry/business-industry.controller.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS INDUSTRY / BUSINESS TYPE SETTINGS CONTROLLER
// CHANGE SUMMARY :
// - BUSINESS 업종설정 전용 controller 유지
// - 비즈니스 타입 목록 조회 / 현재 비즈니스 타입 조회 / 비즈니스 타입 저장 엔드포인트 추가
// - 현재 업종 조회 / 업종 검색 / 서브업종 조회 / 업종 저장 엔드포인트 유지
// - controller → service only 구조 유지
// - business-profile 에서 업종 / 비즈니스 타입 책임 분리 유지

// SECTION 01 : IMPORT

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query
} from '@nestjs/common'

import {
  BusinessIndustryService
} from './business-industry.service'

// SECTION 02 : TYPE

type UpdateBusinessTypeBody = {
  profileId: number
  channelCode: string
  businessTypeCode: string
}

type UpdateBusinessIndustryBody = {
  profileId: number
  channelCode: string
  industryCode: string
  industrySubtypeCode?: string | null
}

// SECTION 03 : CONTROLLER

@Controller('business/industry')
export class BusinessIndustryController {
  // SECTION 04 : CONSTRUCTOR

  constructor(
    private readonly businessIndustryService: BusinessIndustryService
  ) {}

  // SECTION 05 : BUSINESS TYPES

  @Get('business-types')
  getBusinessTypes() {
    return this.businessIndustryService.getBusinessTypes()
  }

  // SECTION 06 : CURRENT BUSINESS TYPE

  @Get('business-type/current/:channelCode')
  getCurrentBusinessType(
    @Param('channelCode') channelCode: string
  ) {
    return this.businessIndustryService.getCurrentBusinessType(
      channelCode
    )
  }

  // SECTION 07 : UPDATE BUSINESS TYPE

  @Patch('business-type')
  updateBusinessType(
    @Body() body: UpdateBusinessTypeBody
  ) {
    return this.businessIndustryService.updateBusinessType({
      profileId: body.profileId,
      channelCode: body.channelCode,
      businessTypeCode: body.businessTypeCode
    })
  }

  // SECTION 08 : CURRENT INDUSTRY

  @Get('current/:channelCode')
  getCurrentBusinessIndustry(
    @Param('channelCode') channelCode: string
  ) {
    return this.businessIndustryService.getCurrentBusinessIndustry(
      channelCode
    )
  }

  // SECTION 09 : INDUSTRY SEARCH

  @Get('search')
  searchIndustries(
    @Query('keyword') keyword?: string
  ) {
    return this.businessIndustryService.searchIndustries(
      keyword
    )
  }

  // SECTION 10 : INDUSTRY SUBTYPES

  @Get('subtypes/:industryCode')
  getIndustrySubtypesByIndustryCode(
    @Param('industryCode') industryCode: string
  ) {
    return this.businessIndustryService.getIndustrySubtypesByIndustryCode(
      industryCode
    )
  }

  // SECTION 11 : UPDATE INDUSTRY

  @Patch()
  updateBusinessIndustry(
    @Body() body: UpdateBusinessIndustryBody
  ) {
    return this.businessIndustryService.updateBusinessIndustry({
      profileId: body.profileId,
      channelCode: body.channelCode,
      industryCode: body.industryCode,
      industrySubtypeCode: body.industrySubtypeCode ?? null
    })
  }
}
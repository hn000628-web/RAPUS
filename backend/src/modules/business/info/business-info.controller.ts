// FILE : backend/src/modules/business/info/business-info.controller.ts
// ROOT : backend/src/modules/business/info/business-info.controller.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS INFO TAB READ CONTROLLER
// CHANGE SUMMARY :
// - BUSINESS 안내 탭 전용 read controller 신규 생성
// - channelCode 기준 안내 정보 조회 endpoint 제공
// - controller → service only 구조 유지
// - BUSINESS API 경계 유지

import {
  Controller,
  Get,
  Param
} from '@nestjs/common'

import { BusinessInfoService } from './business-info.service'

// SECTION 01 : CONTROLLER

@Controller('business/profile-info')
export class BusinessInfoController {
  // SECTION 02 : CONSTRUCTOR

  constructor(
    private readonly businessInfoService: BusinessInfoService
  ) {}

  // SECTION 03 : READ

  @Get(':channelCode')
  getBusinessInfoByChannelCode(
    @Param('channelCode') channelCode: string
  ) {
    return this.businessInfoService.getBusinessInfoByChannelCode(
      channelCode
    )
  }
}
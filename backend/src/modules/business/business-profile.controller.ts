// FILE : backend/src/modules/business/business-profile.controller.ts
// ROOT : backend/src/modules/business/business-profile.controller.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS MAIN PROFILE DETAIL READ CONTROLLER
// CHANGE SUMMARY :
// - 롤백된 legacy read / write / media relation endpoint 전부 제거
// - business-profile.service.ts 현재 계약에 맞춰 summary / detail read 전용 controller로 재정렬
// - channelCode 기준 summary / detail 조회 엔드포인트만 유지
// - detail 응답 내부 hours payload 확장 구조를 controller 변경 없이 그대로 위임
// - controller → service only 구조 유지
// - BUSINESS API 경계 유지

import {
  Controller,
  Get,
  Param
} from '@nestjs/common'

import { BusinessProfileService } from './business-profile.service'

// SECTION 01 : CONTROLLER

@Controller('business/profile')
export class BusinessProfileController {
  // SECTION 02 : CONSTRUCTOR

  constructor(
    private readonly businessProfileService: BusinessProfileService
  ) {}

  // SECTION 03 : SUMMARY READ

  @Get(':channelCode/summary')
  getBusinessProfileSummaryByChannelCode(
    @Param('channelCode') channelCode: string
  ) {
    return this.businessProfileService.getBusinessProfileSummaryByChannelCode(
      channelCode
    )
  }

  // SECTION 04 : DETAIL READ

  @Get(':channelCode/detail')
  getBusinessProfileDetailByChannelCode(
    @Param('channelCode') channelCode: string
  ) {
    return this.businessProfileService.getBusinessProfileDetailByChannelCode(
      channelCode
    )
  }
}
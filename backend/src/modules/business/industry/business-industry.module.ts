// FILE : backend/src/modules/business/industry/business-industry.module.ts
// ROOT : backend/src/modules/business/industry/business-industry.module.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS INDUSTRY SETTINGS MODULE
// CHANGE SUMMARY :
// - BUSINESS 업종설정 전용 module 신규 생성
// - business-industry.controller.ts / business-industry.service.ts 등록
// - 업종설정 전용 모듈 경계 고정

// SECTION 01 : IMPORT

import { Module } from '@nestjs/common'

import { BusinessIndustryController } from './business-industry.controller'
import { BusinessIndustryService } from './business-industry.service'

// SECTION 02 : MODULE

@Module({
  controllers: [
    BusinessIndustryController
  ],
  providers: [
    BusinessIndustryService
  ],
  exports: [
    BusinessIndustryService
  ]
})
export class BusinessIndustryModule {}
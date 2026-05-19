// FILE : backend/src/modules/business/info/business-info.module.ts
// ROOT : backend/src/modules/business/info/business-info.module.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS INFO TAB MODULE
// CHANGE SUMMARY :
// - BUSINESS 안내 탭 전용 module 신규 생성
// - BusinessInfoController / BusinessInfoService 등록
// - BUSINESS 도메인 하위 read module 구조 분리

import { Module } from '@nestjs/common'

import { BusinessInfoController } from './business-info.controller'
import { BusinessInfoService } from './business-info.service'

// SECTION 01 : MODULE

@Module({
  controllers: [
    BusinessInfoController
  ],
  providers: [
    BusinessInfoService
  ],
  exports: [
    BusinessInfoService
  ]
})
export class BusinessInfoModule {}
// FILE : backend/src/modules/business/pos/table-settings/pos-table-settings.module.ts
// ROOT : backend/src/modules/business/pos/table-settings/pos-table-settings.module.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS TABLE SETTINGS MODULE
// CHANGE SUMMARY :
// - POS 테이블 설정 전용 Module 신규 생성
// - Controller / Service 등록
// - 상위 pos.module.ts에서 import 가능한 구조로 export

// SECTION 01 : IMPORT

import {
  Module
} from '@nestjs/common'

import {
  BusinessPosTableSettingsController
} from './pos-table-settings.controller'

import {
  BusinessPosTableSettingsService
} from './pos-table-settings.service'

// SECTION 02 : MODULE

@Module({
  controllers: [
    BusinessPosTableSettingsController
  ],
  providers: [
    BusinessPosTableSettingsService
  ],
  exports: [
    BusinessPosTableSettingsService
  ]
})
export class BusinessPosTableSettingsModule {}

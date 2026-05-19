// FILE : backend/src/modules/business/pos/order-types/order-types.module.ts
// ROOT : backend/src/modules/business/pos/order-types/order-types.module.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS ORDER TYPE SETTINGS MODULE
// CHANGE SUMMARY :
// - POS 주문유형 설정 Controller / Service Module 신규 생성
// - Business POS order-types 도메인 독립 모듈 구성

// SECTION 01 : IMPORT

import {
  Module
} from '@nestjs/common'

import {
  PosOrderTypesController
} from './order-types.controller'

import {
  PosOrderTypesService
} from './order-types.service'

// SECTION 02 : MODULE

@Module({
  controllers: [
    PosOrderTypesController
  ],
  providers: [
    PosOrderTypesService
  ],
  exports: [
    PosOrderTypesService
  ]
})
export class PosOrderTypesModule {}
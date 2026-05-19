// FILE : backend/src/modules/business/pos/orders/pos-orders.module.ts
// ROOT : backend/src/modules/business/pos/orders/pos-orders.module.ts
// STATUS : CREATE MODE
// ROLE : POS ORDER MODULE
// CHANGE SUMMARY :
// - POS 주문 등록 Module 신규 생성
// - PosOrdersController / PosOrdersService 연결
// - 상위 AppModule 또는 BusinessPosModule 등록 대상

// SECTION 01 : IMPORT

import { Module } from '@nestjs/common'

import { PosOrdersController } from './pos-orders.controller'
import { PosOrdersService } from './pos-orders.service'

// SECTION 02 : MODULE

@Module({
  controllers: [
    PosOrdersController
  ],
  providers: [
    PosOrdersService
  ],
  exports: [
    PosOrdersService
  ]
})
export class PosOrdersModule {}
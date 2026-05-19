// FILE: backend/src/modules/business/hours/business-hours.module.ts
// ROOT: backend/src/modules/business/hours/business-hours.module.ts
// STATUS: PRODUCTION READY
// ROLE: BUSINESS HOURS MODULE
// CHANGE SUMMARY:
// - BusinessHoursService / BusinessHoursController 등록
// - 독립 모듈 구조
// - 상위 BusinessModule에서 import 가능

import { Module } from '@nestjs/common'
import { BusinessHoursService } from './business-hours.service'
import { BusinessHoursController } from './business-hours.controller'

@Module({
  providers: [BusinessHoursService],
  controllers: [BusinessHoursController],
  exports: [BusinessHoursService] // 상위 모듈에서 재사용 가능
})
export class BusinessHoursModule {}
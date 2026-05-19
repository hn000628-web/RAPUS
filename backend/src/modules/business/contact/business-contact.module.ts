// FILE: backend/src/modules/business/contact/business-contact.module.ts
// ROOT: backend/src/modules/business/contact/business-contact.module.ts
// STATUS: CREATE / MODIFY
// ROLE: BUSINESS CONTACT FEATURE MODULE
// CHANGE SUMMARY:
// - 전용 business contact 기능 관리
// - controller/service 연결
// - DB repository 제공
// - platform architecture 기준: Controller → Service → DB

import { Module } from '@nestjs/common'
import { BusinessContactService } from './business-contact.service'
import { BusinessContactController } from './business-contact.controller'
import { DatabaseModule } from '../../../config/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [BusinessContactController],
  providers: [BusinessContactService],
  exports: [BusinessContactService],
})
export class BusinessContactModule {}
// FILE : backend/src/modules/business/media/business-media.module.ts
// ROOT : backend/src/modules/business/media/business-media.module.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS MEDIA MODULE
// CHANGE SUMMARY :
// - BUSINESS 전용 media module 유지
// - BusinessMediaController 등록 유지
// - BusinessMediaService 등록 및 export 유지
// - gallery / avatar / hero 등 BUSINESS 하위 도메인에서 공용 media service DI 가능 구조 유지
// - 기존 공용 media module 과 분리 유지

// SECTION 01 : IMPORT

import { Module } from '@nestjs/common'

import { BusinessMediaController } from './business-media.controller'
import { BusinessMediaService } from './business-media.service'

// SECTION 02 : MODULE

@Module({
  controllers: [
    BusinessMediaController
  ],
  providers: [
    BusinessMediaService
  ],
  exports: [
    BusinessMediaService
  ]
})
export class BusinessMediaModule {}
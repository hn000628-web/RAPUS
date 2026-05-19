// FILE : backend/src/modules/business/gallery/business-gallery.module.ts
// ROOT : backend/src/modules/business/gallery/business-gallery.module.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS GALLERY MODULE
// CHANGE SUMMARY :
// - BUSINESS 사진첩 전용 module 유지
// - business-gallery.controller.ts / business-gallery.service.ts 등록 유지
// - gallery relation 전용 모듈 경계 유지
// - BusinessGalleryService 에서 BusinessMediaService DI 가능하도록 BusinessMediaModule import 추가
// - 저장 책임은 business-media.service.ts, 연결 책임은 business-gallery.service.ts 구조 유지

// SECTION 01 : IMPORT

import { Module } from '@nestjs/common'

import { BusinessGalleryController } from './business-gallery.controller'
import { BusinessGalleryService } from './business-gallery.service'
import { BusinessMediaModule } from '../media/business-media.module'

// SECTION 02 : MODULE

@Module({
  imports: [
    BusinessMediaModule
  ],
  controllers: [
    BusinessGalleryController
  ],
  providers: [
    BusinessGalleryService
  ],
  exports: [
    BusinessGalleryService
  ]
})
export class BusinessGalleryModule {}
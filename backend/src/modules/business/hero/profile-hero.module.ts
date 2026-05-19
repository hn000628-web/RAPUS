// FILE : backend/src/modules/business/hero/profile-hero.module.ts
// ROOT : backend/src/modules/business/hero/profile-hero.module.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS PROFILE HERO MODULE
// CHANGE SUMMARY :
// - BUSINESS 커버/히어로 전용 module 생성
// - ProfileHeroController / ProfileHeroService 등록
// - business domain 분리 구조 유지
// - DB 접근은 service only 규칙 유지

import { Module } from '@nestjs/common'

import { ProfileHeroController } from './profile-hero.controller'
import { ProfileHeroService } from './profile-hero.service'

// SECTION 01 : MODULE

@Module({
  controllers: [
    ProfileHeroController
  ],
  providers: [
    ProfileHeroService
  ],
  exports: [
    ProfileHeroService
  ]
})
export class ProfileHeroModule {}
// FILE : backend/src/modules/profile/account/profile-account.module.ts
// ROOT : backend/src/modules/profile/account/profile-account.module.ts
// STATUS : CREATE MODE
// ROLE : PROFILE ACCOUNT API MODULE
// CHANGE SUMMARY :
// - ProfileAccountController / ProfileAccountService module 등록
// - /api/profile/account 전용 API 모듈 신규 생성
// - DB 직접 접근 없음

// SECTION 01 : IMPORT

import {
  Module
} from '@nestjs/common'

import {
  ProfileAccountController
} from './profile-account.controller'

import {
  ProfileAccountService
} from './profile-account.service'

// SECTION 02 : MODULE

@Module({
  controllers: [
    ProfileAccountController
  ],
  providers: [
    ProfileAccountService
  ],
  exports: [
    ProfileAccountService
  ]
})
export class ProfileAccountModule {}
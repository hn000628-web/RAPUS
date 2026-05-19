// FILE : backend/src/modules/business/posts/business-posts.module.ts
// ROOT : backend/src/modules/business/posts/business-posts.module.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POSTS MODULE
// CHANGE SUMMARY :
// - BUSINESS 전용 포스트 Module 신규 생성
// - BusinessPostsController 등록
// - BusinessPostsService 등록
// - BUSINESS posts API를 독립 모듈로 분리

// SECTION 01 : IMPORT

import {
  Module
} from '@nestjs/common'

import {
  BusinessPostsController
} from './business-posts.controller'

import {
  BusinessPostsService
} from './business-posts.service'

// SECTION 02 : MODULE

@Module({
  controllers: [
    BusinessPostsController
  ],
  providers: [
    BusinessPostsService
  ],
  exports: [
    BusinessPostsService
  ]
})
export class BusinessPostsModule {}
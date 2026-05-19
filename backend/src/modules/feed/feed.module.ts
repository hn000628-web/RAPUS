// FILE : backend/src/modules/feed/feed.module.ts
// ROOT : backend/src/modules/feed/feed.module.ts
// STATUS : CREATE MODE
// ROLE : FEED MODULE
// CHANGE SUMMARY :
// - PLACE 피드 READ API 등록용 FeedModule 생성
// - PlaceFeedController 등록
// - PlaceFeedService provider 등록
// - 로그인 / 비로그인 공통 READ 피드 구조
// - DB 직접 접근 없음
// - DB 스키마 변경 없음

// SECTION 01 : IMPORT

import {
  Module
} from '@nestjs/common'

import {
  PlaceFeedController
} from './place-feed.controller'

import {
  PlaceFeedService
} from './place-feed.service'

// SECTION 02 : MODULE

@Module({
  controllers: [
    PlaceFeedController
  ],
  providers: [
    PlaceFeedService
  ],
  exports: [
    PlaceFeedService
  ]
})
export class FeedModule {}

// SECTION 03 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- FeedModule 생성
- PlaceFeedController 등록
- PlaceFeedService 등록
- Controller / Service 외 추가 의존성 없음
- DB 직접 접근 없음
- JWT / getMe 사용 없음
- DB 스키마 변경 없음
*/
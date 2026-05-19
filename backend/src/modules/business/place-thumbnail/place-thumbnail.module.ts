// FILE : backend/src/modules/business/place-thumbnail/place-thumbnail.module.ts
// ROOT : backend/src/modules/business/place-thumbnail/place-thumbnail.module.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS PROFILE PLACE THUMBNAIL MODULE
// CHANGE SUMMARY :
// - BUSINESS 피드/플레이스 썸네일 전용 module 생성
// - ProfilePlaceThumbnailController 등록
// - ProfilePlaceThumbnailService 등록
// - BusinessModule에서 import 가능한 기능 단위 module 구성
// - DB 직접 접근 없음
// - Controller / Service 구조 변경 없음

import {
  Module
} from '@nestjs/common'

import {
  ProfilePlaceThumbnailController
} from './place-thumbnail.controller'

import {
  ProfilePlaceThumbnailService
} from './place-thumbnail.service'

// SECTION 01 : MODULE

@Module({
  controllers: [
    ProfilePlaceThumbnailController
  ],
  providers: [
    ProfilePlaceThumbnailService
  ]
})
export class ProfilePlaceThumbnailModule {}

// SECTION 02 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- place-thumbnail 전용 module 생성
- ProfilePlaceThumbnailController 등록
- ProfilePlaceThumbnailService 등록
- BusinessModule imports 등록 대상
- DB 직접 접근 없음
- API 경로 변경 없음
- Service 로직 변경 없음
- Controller 로직 변경 없음
*/
// FILE : backend/src/modules/feed/place-feed.controller.ts
// ROOT : backend/src/modules/feed/place-feed.controller.ts
// STATUS : CREATE MODE
// ROLE : PLACE FEED READ CONTROLLER
// CHANGE SUMMARY :
// - PLACE 피드 READ 전용 Controller 생성
// - GET /api/feed/place 엔드포인트 추가
// - 로그인 / 비로그인 공통 조회 구조
// - regionId / keyword / limit query 전달
// - Controller는 Service 호출만 수행
// - DB 직접 접근 없음

// SECTION 01 : IMPORT

import {
  Controller,
  Get,
  HttpCode,
  Param,
  Query
} from '@nestjs/common'

import {
  GetPlaceFeedInput,
  GetPlaceProductPreviewInput,
  GetPlaceRepresentativeImagesInput,
  PlaceFeedRepresentativeImagesResult,
  PlaceFeedProductPreviewResult,
  PlaceFeedResult,
  PlaceFeedService
} from './place-feed.service'

// SECTION 02 : TYPE

type PlaceFeedQuery = {
  regionId?: string
  keyword?: string
  limit?: string
  searchScope?: 'ALL' | 'POST' | 'PRODUCT' | string
}

type PlaceProductPreviewQuery = {
  limit?: string
}

type PlaceRepresentativeImagesQuery = {
  limit?: string
}

// SECTION 03 : CONTROLLER

@Controller('feed/place')
export class PlaceFeedController {
  constructor(
    private readonly placeFeedService: PlaceFeedService
  ) {}

  // SECTION 04 : GET PLACE FEED

  @Get()
  @HttpCode(200)
  async getPlaceFeed(
    @Query() query: PlaceFeedQuery
  ): Promise<PlaceFeedResult> {
    const input: GetPlaceFeedInput = {
      regionId: query.regionId,
      keyword: query.keyword,
      limit: query.limit,
      searchScope: query.searchScope
    }

    return this.placeFeedService.getPlaceFeed(input)
  }

  // SECTION 05 : GET PLACE PRODUCT PREVIEW

  @Get(':channelCode/products/preview')
  @HttpCode(200)
  async getPlaceProductPreview(
    @Param('channelCode') channelCode: string,
    @Query() query: PlaceProductPreviewQuery
  ): Promise<PlaceFeedProductPreviewResult> {
    const input: GetPlaceProductPreviewInput = {
      channelCode,
      limit: query.limit
    }

    return this.placeFeedService.getPlaceProductPreview(input)
  }

  // SECTION 06 : GET PLACE REPRESENTATIVE IMAGES

  @Get(':channelCode/representative-images')
  @HttpCode(200)
  async getPlaceRepresentativeImages(
    @Param('channelCode') channelCode: string,
    @Query() query: PlaceRepresentativeImagesQuery
  ): Promise<PlaceFeedRepresentativeImagesResult> {
    const input: GetPlaceRepresentativeImagesInput = {
      channelCode,
      limit: query.limit
    }

    return this.placeFeedService.getPlaceRepresentativeImages(input)
  }
}

// SECTION 07 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- GET /api/feed/place 구조
- 로그인 / 비로그인 공통 READ API
- Query 수신 후 Service 전달만 수행
- Controller DB 직접 접근 없음
- JWT / getMe 사용 없음
- 쓰기 기능 없음
- DB 스키마 변경 없음
*/

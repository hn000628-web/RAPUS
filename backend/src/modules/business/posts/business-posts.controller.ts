// FILE : backend/src/modules/business/posts/business-posts.controller.ts
// ROOT : backend/src/modules/business/posts/business-posts.controller.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS POSTS CONTROLLER
// CHANGE SUMMARY :
// - 기존 BUSINESS 전용 포스트 생성 Controller 유지
// - POST /api/business/posts 기존 구조 유지
// - GET /api/business/posts 조회 엔드포인트 추가
// - profileId + channelCode + postType + status query 전달
// - Controller는 Request 수신 / Service 호출 / Response 반환만 수행
// - DB 직접 접근 없음
// - 상품 페이지 PRODUCT 조회를 위한 Controller 라우트 연결

// SECTION 01 : IMPORT

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query
} from '@nestjs/common'

import {
  BusinessPostsService,
  CreateBusinessPostInput
} from './business-posts.service'

// SECTION 02 : TYPE

type BusinessPostCreateResponse = {
  ok: boolean
  post: {
    id: number
    profileId: number
    channelCode: string
    postType: string
    industryId: number
    industrySubtypeId: number
    industryCode: string
    industrySubtypeCode: string
    title: string
    content: string
    regionId: number | null
    priceAmount: number | null
    eventStartAt: string | null
    eventEndAt: string | null
    status: string
    mediaCount: number
  }
}

type BusinessPostListQuery = {
  profileId?: string
  channelCode?: string
  postType?: string
  status?: string
}

type BusinessPostListItem = {
  id: number
  profileId: number
  channelCode: string
  postType: string
  industryId: number | null
  industrySubtypeId: number | null
  industryCode: string | null
  industrySubtypeCode: string | null
  title: string
  content: string
  regionId: number | null
  priceAmount: number | null
  eventStartAt: string | null
  eventEndAt: string | null
  status: string
  mediaCount: number
  createdAt: string | null
  updatedAt: string | null
  images: Array<{
    id: number
    postId: number
    imageAssetId: number
    filePath: string | null
    imageUrl: string | null
    sortOrder: number
  }>
  imageUrl: string | null
  thumbnailUrl: string | null
}

type BusinessPostListResponse = {
  ok: boolean
  posts: BusinessPostListItem[]
}

// SECTION 03 : CONTROLLER

@Controller('business/posts')
export class BusinessPostsController {
  constructor(
    private readonly businessPostsService: BusinessPostsService
  ) {}

  // SECTION 04 : CREATE POST

  @Post()
  @HttpCode(201)
  async createPost(
    @Body() body: CreateBusinessPostInput
  ): Promise<BusinessPostCreateResponse> {
    const post =
      await this.businessPostsService.createPost(body)

    return {
      ok: true,
      post
    }
  }

  // SECTION 05 : GET POSTS

  @Get()
  @HttpCode(200)
  async getPosts(
    @Query() query: BusinessPostListQuery
  ): Promise<BusinessPostListResponse> {
    const posts =
      await this.businessPostsService.getPosts({
        profileId: query.profileId,
        channelCode: query.channelCode,
        postType: query.postType,
        status: query.status
      })

    return {
      ok: true,
      posts
    }
  }
}

// FILE : backend/src/modules/posts/posts.service.ts
// ROOT : backend/src/modules/posts/posts.service.ts
// STATUS : MODIFY MODE / DB SCHEMA SAFE / AUTH CONTEXT SAFE
// ROLE : POSTS SERVICE

// SECTION 01 : IMPORT

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common'

import path from 'path'
import Database from 'better-sqlite3'

import { CreatePostDto } from './create-post.dto'

// SECTION 02 : TYPE

type JwtUser = {
  sub?: number
  id?: number
  userId?: number
  pid?: number
  ptype?: 'GENERAL' | 'BUSINESS'
  profileId?: number
  profileType?: 'GENERAL' | 'BUSINESS'
  channelCode?: string
}

type ProfileRow = {
  id: number
  profileType: 'GENERAL' | 'BUSINESS'
  channelCode: string
  activityRegionId: number | null
  feedRegionId: number | null
}

type CategoryRow = {
  id: number
  code: string
}

type ImageAssetRow = {
  id: number
  channelCode: string
  usageType: string
}

type CreatedPostRow = {
  id: number
  profileId: number
  channelCode: string
  regionId: number
  contentType: 'LIFE' | 'PLACE'
  content: string | null
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'
  mediaCount: number
  latitude: number | null
  longitude: number | null
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED'
  createdAt: string
  updatedAt: string
}

type PostDetailImageRow = {
  postId: number
  content: string | null
  contentType: 'LIFE' | 'PLACE'
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED'
  regionId: number
  createdAt: string
  updatedAt: string
  displayName: string | null
  profileType: 'GENERAL' | 'BUSINESS'
  regionName: string | null
  categoryCode: string | null
  imageAssetId: number | null
  sortOrder: number | null
  filePath: string | null
}

type PostDetailResult = {
  id: number
  title: string
  content: string | null
  contentType: 'LIFE' | 'PLACE'
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED'
  regionId: number
  regionName: string | null
  category: string | null
  categoryCode: string | null
  createdAt: string
  updatedAt: string
  displayName: string | null
  profileType: 'GENERAL' | 'BUSINESS'
  images: Array<{
    imageAssetId: number
    sortOrder: number
    imageUrl: string
  }>
}

// SECTION 03 : CONSTANT

const DB_PATH = path.resolve(
  __dirname,
  '../../../data/prod.sqlite'
)

const GENERAL_PROFILE_TYPE = 'GENERAL'
const GENERAL_CONTENT_TYPE = 'LIFE'
const DEFAULT_VISIBILITY = 'PUBLIC'
const DEFAULT_STATUS = 'ACTIVE'

// SECTION 04 : SERVICE

@Injectable()
export class PostsService {
  private readonly db: Database.Database

  constructor() {
    this.db = new Database(DB_PATH)
    this.db.pragma('foreign_keys = ON')
  }

  // SECTION 05 : CREATE POST

  async createPost(
    user: JwtUser,
    dto: CreatePostDto
  ) {
    this.validateJwtUser(user)
    this.validateCreateDto(dto)

    const transaction = this.db.transaction(
      (payloadUser: JwtUser, payloadDto: CreatePostDto) => {
        const resolvedProfileId =
          payloadUser.pid ?? payloadUser.profileId

        if (!resolvedProfileId) {
          throw new UnauthorizedException(
            'INVALID_AUTH_CONTEXT'
          )
        }

        const profile = this.getGeneralProfileById(
          Number(resolvedProfileId)
        )

        const regionId = this.resolveRegionId(profile)

        const imageAssetIds = this.normalizeImageAssetIds(
          payloadDto.imageAssetIds
        )

        this.validateImageAssetsOwnership(
          profile.channelCode,
          imageAssetIds
        )

        const visibility =
          payloadDto.visibility ?? DEFAULT_VISIBILITY

        const mediaCount = imageAssetIds.length

        const insertPost = this.db.prepare(`
          INSERT INTO posts(
            profileId,
            channelCode,
            regionId,
            contentType,
            content,
            visibility,
            mediaCount,
            latitude,
            longitude,
            status,
            updatedAt
          )
          VALUES(
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            CURRENT_TIMESTAMP
          )
        `)

        const insertPostResult = insertPost.run(
          profile.id,
          profile.channelCode,
          regionId,
          GENERAL_CONTENT_TYPE,
          payloadDto.content.trim(),
          visibility,
          mediaCount,
          payloadDto.latitude ?? null,
          payloadDto.longitude ?? null,
          DEFAULT_STATUS
        )

        const postId = Number(insertPostResult.lastInsertRowid)

        this.insertPostImages(
          postId,
          imageAssetIds
        )

        this.insertPostCategory(
          postId,
          payloadDto.categoryCode
        )

        this.insertPostEngagements(postId)

        return this.getPostById(postId)
      }
    )

    try {
      const createdPost = transaction(user, dto)

      return {
        ok: true,
        post: createdPost
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error
      }

      console.error(error)

      throw new InternalServerErrorException(
        'POST_CREATE_FAILED'
      )
    }
  }

  // SECTION 06 : VALIDATION

  private validateJwtUser(user: JwtUser) {
    const resolvedUserId =
      user?.sub ?? user?.id ?? user?.userId

    const resolvedProfileId =
      user?.pid ?? user?.profileId

    const resolvedProfileType =
      user?.ptype ?? user?.profileType

    if (!resolvedUserId || !resolvedProfileId) {
      throw new UnauthorizedException(
        'INVALID_AUTH_CONTEXT'
      )
    }

    if (resolvedProfileType !== GENERAL_PROFILE_TYPE) {
      throw new UnauthorizedException(
        'GENERAL_PROFILE_ONLY'
      )
    }
  }

  private validateCreateDto(dto: CreatePostDto) {
    if (!dto) {
      throw new BadRequestException(
        'REQUEST_BODY_REQUIRED'
      )
    }

    if (
      typeof dto.content !== 'string' ||
      dto.content.trim() === ''
    ) {
      throw new BadRequestException(
        'CONTENT_REQUIRED'
      )
    }

    if (
      dto.visibility &&
      !['PUBLIC', 'FOLLOWERS', 'PRIVATE'].includes(dto.visibility)
    ) {
      throw new BadRequestException(
        'INVALID_VISIBILITY'
      )
    }

    if (
      dto.latitude !== undefined &&
      dto.latitude !== null &&
      (dto.latitude < -90 || dto.latitude > 90)
    ) {
      throw new BadRequestException(
        'INVALID_LATITUDE'
      )
    }

    if (
      dto.longitude !== undefined &&
      dto.longitude !== null &&
      (dto.longitude < -180 || dto.longitude > 180)
    ) {
      throw new BadRequestException(
        'INVALID_LONGITUDE'
      )
    }

    if (
      dto.categoryCode !== undefined &&
      dto.categoryCode !== null &&
      typeof dto.categoryCode !== 'string'
    ) {
      throw new BadRequestException(
        'INVALID_CATEGORY_CODE'
      )
    }

    if (
      dto.imageAssetIds !== undefined &&
      !Array.isArray(dto.imageAssetIds)
    ) {
      throw new BadRequestException(
        'INVALID_IMAGE_ASSET_IDS'
      )
    }
  }

  // SECTION 07 : PROFILE QUERY

  private getGeneralProfileById(
    profileId: number
  ): ProfileRow {
    const selectProfile = this.db.prepare(`
      SELECT
        id,
        profileType,
        channelCode,
        activityRegionId,
        feedRegionId
      FROM profiles
      WHERE id = ?
      LIMIT 1
    `)

    const profile = selectProfile.get(profileId) as
      | ProfileRow
      | undefined

    if (!profile) {
      throw new UnauthorizedException(
        'PROFILE_NOT_FOUND'
      )
    }

    if (profile.profileType !== GENERAL_PROFILE_TYPE) {
      throw new UnauthorizedException(
        'GENERAL_PROFILE_ONLY'
      )
    }

    return profile
  }

private resolveRegionId(
  profile: ProfileRow
): number | null {

  const regionId =
    profile.activityRegionId ??
    profile.feedRegionId

  /* 🔥 기존: region 없으면 에러 → 제거 */
  /* 🔥 변경: null 허용 */

  return regionId ?? null

}

  // SECTION 08 : IMAGE HELPERS

  private normalizeImageAssetIds(
    imageAssetIds?: number[]
  ): number[] {
    if (!imageAssetIds || imageAssetIds.length === 0) {
      return []
    }

    const normalized = imageAssetIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)

    const uniqueIds = Array.from(new Set(normalized))

    if (uniqueIds.length !== imageAssetIds.length) {
      throw new BadRequestException(
        'INVALID_OR_DUPLICATED_IMAGE_ASSET_IDS'
      )
    }

    return uniqueIds
  }

  private validateImageAssetsOwnership(
    channelCode: string,
    imageAssetIds: number[]
  ) {
    if (imageAssetIds.length === 0) {
      return
    }

    const selectAsset = this.db.prepare(`
      SELECT
        id,
        channelCode,
        usageType
      FROM image_assets
      WHERE id = ?
      LIMIT 1
    `)

    for (const imageAssetId of imageAssetIds) {
      const asset = selectAsset.get(imageAssetId) as
        | ImageAssetRow
        | undefined

      if (!asset) {
        throw new BadRequestException(
          `IMAGE_ASSET_NOT_FOUND:${imageAssetId}`
        )
      }

      if (asset.channelCode !== channelCode) {
        throw new BadRequestException(
          `IMAGE_ASSET_OWNER_MISMATCH:${imageAssetId}`
        )
      }

      if (asset.usageType !== 'post') {
        throw new BadRequestException(
          `IMAGE_ASSET_USAGE_INVALID:${imageAssetId}`
        )
      }
    }
  }

  private insertPostImages(
    postId: number,
    imageAssetIds: number[]
  ) {
    if (imageAssetIds.length === 0) {
      return
    }

    const insertPostImage = this.db.prepare(`
      INSERT INTO post_images(
        postId,
        imageAssetId,
        sortOrder
      )
      VALUES(
        ?,
        ?,
        ?
      )
    `)

    imageAssetIds.forEach((imageAssetId, index) => {
      insertPostImage.run(
        postId,
        imageAssetId,
        index + 1
      )
    })
  }

  // SECTION 09 : CATEGORY HELPERS

  private insertPostCategory(
    postId: number,
    categoryCode?: string
  ) {
    if (!categoryCode || categoryCode.trim() === '') {
      return
    }

    const selectCategory = this.db.prepare(`
      SELECT
        id,
        code
      FROM categories
      WHERE code = ?
      LIMIT 1
    `)

    const category = selectCategory.get(
      categoryCode.trim().toUpperCase()
    ) as CategoryRow | undefined

    if (!category) {
      throw new BadRequestException(
        'CATEGORY_NOT_FOUND'
      )
    }

    const insertPostCategory = this.db.prepare(`
      INSERT INTO post_categories(
        postId,
        categoryId
      )
      VALUES(
        ?,
        ?
      )
    `)

    insertPostCategory.run(
      postId,
      category.id
    )
  }

  // SECTION 10 : ENGAGEMENT INIT

  private insertPostEngagements(
    postId: number
  ) {
    const insertEngagement = this.db.prepare(`
      INSERT INTO post_engagements(
        postId,
        likeCount,
        commentCount,
        viewCount,
        shareCount,
        saveCount,
        score,
        createdAt,
        updatedAt
      )
      VALUES(
        ?,
        0,
        0,
        0,
        0,
        0,
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `)

    insertEngagement.run(postId)
  }

  /* ==================================================
  SECTION 11 : SELECT RESULT
  ================================================== */

  private getPostById(
    postId: number
  ): CreatedPostRow {
    const selectPost = this.db.prepare(`
      SELECT
        id,
        profileId,
        channelCode,
        regionId,
        contentType,
        content,
        visibility,
        mediaCount,
        latitude,
        longitude,
        status,
        createdAt,
        updatedAt
      FROM posts
      WHERE id = ?
      LIMIT 1
    `)

    const post = selectPost.get(postId) as
      | CreatedPostRow
      | undefined

    if (!post) {
      throw new InternalServerErrorException(
        'POST_READBACK_FAILED'
      )
    }

    return post
  }

/* ==================================================
SECTION 12 : GET MY POSTS (🔥 FIXED IMAGE URL)
================================================== */

async getMyPosts(user: JwtUser){

  const profileId =
    user?.pid ?? user?.profileId

  if(!profileId){
    throw new UnauthorizedException(
      'INVALID_AUTH_CONTEXT'
    )
  }

  const profile =
    this.getGeneralProfileById(profileId)

  const rows = this.db.prepare(`
    SELECT
      p.id,
      p.content,
      p.contentType,
      p.createdAt,
      pi.imageAssetId,
      ia.filePath
    FROM posts p
    LEFT JOIN post_images pi
      ON pi.postId = p.id
    LEFT JOIN image_assets ia
      ON ia.id = pi.imageAssetId
    WHERE p.channelCode = ?
      AND p.status = 'ACTIVE'
    ORDER BY p.createdAt DESC
  `).all(profile.channelCode)

  const map = new Map<number, any>()

  for(const row of rows){

    if(!map.has(row.id)){
      map.set(row.id,{
        id:row.id,
        content:row.content,
        contentType:row.contentType,
        createdAt:row.createdAt,
        images:[]
      })
    }

    if(row.imageAssetId){
      map.get(row.id).images.push({
        imageAssetId:row.imageAssetId,
        imageUrl:
          row.filePath
            ? `http://localhost:4000/media/${row.filePath}` // 🔥 핵심 수정
            : null
      })
    }

  }

  return {
    ok:true,
    posts:Array.from(map.values())
  }

}

  /* ==================================================
  SECTION 13 : GET POST DETAIL
  ================================================== */

  async getPostDetail(
    postId: number,
    user?: JwtUser
  ) {
    if (!Number.isInteger(postId) || postId <= 0) {
      throw new BadRequestException(
        'INVALID_POST_ID'
      )
    }

    const rows = this.db.prepare(`
      SELECT
        p.id AS postId,
        p.content,
        p.contentType,
        p.visibility,
        p.status,
        p.regionId,
        p.createdAt,
        p.updatedAt,
        pr.displayName,
        pr.profileType,
        r.name AS regionName,
        c.code AS categoryCode,
        pi.imageAssetId,
        pi.sortOrder,
        ia.filePath
      FROM posts p
      JOIN profiles pr
        ON pr.id = p.profileId
      LEFT JOIN regions r
        ON r.id = p.regionId
      LEFT JOIN post_categories pc
        ON pc.postId = p.id
      LEFT JOIN categories c
        ON c.id = pc.categoryId
      LEFT JOIN post_images pi
        ON pi.postId = p.id
      LEFT JOIN image_assets ia
        ON ia.id = pi.imageAssetId
      WHERE p.id = ?
      LIMIT 50
    `).all(postId) as PostDetailImageRow[]

    if (!rows.length) {
      throw new BadRequestException(
        'POST_NOT_FOUND'
      )
    }

    const first = rows[0]

    if (
      first.visibility === 'PRIVATE' &&
      user?.pid !== undefined &&
      user?.profileId !== undefined
    ) {
      const viewerProfileId =
        user.pid ?? user.profileId

      const ownerRow = this.db.prepare(`
        SELECT profileId
        FROM posts
        WHERE id = ?
        LIMIT 1
      `).get(postId) as { profileId: number } | undefined

      if (!ownerRow) {
        throw new BadRequestException(
          'POST_NOT_FOUND'
        )
      }

      if (viewerProfileId !== ownerRow.profileId) {
        throw new UnauthorizedException(
          'POST_ACCESS_DENIED'
        )
      }
    }

    const images = rows
      .filter((row) => !!row.imageAssetId && !!row.filePath)
      .sort((a, b) => {
        const aOrder = a.sortOrder ?? 0
        const bOrder = b.sortOrder ?? 0
        return aOrder - bOrder
      })
      .map((row) => ({
        imageAssetId: Number(row.imageAssetId),
        sortOrder: Number(row.sortOrder ?? 0),
        imageUrl: `http://localhost:4000/media/${row.filePath}`,
      }))

    const post: PostDetailResult = {
      id: first.postId,
      title:
        first.content && first.content.trim() !== ''
          ? first.content.slice(0, 40)
          : '(제목 없음)',
      content: first.content,
      contentType: first.contentType,
      visibility: first.visibility,
      status: first.status,
      regionId: first.regionId,
      regionName: first.regionName,
      category: first.categoryCode,
      categoryCode: first.categoryCode,
      createdAt: first.createdAt,
      updatedAt: first.updatedAt,
      displayName: first.displayName,
      profileType: first.profileType,
      images,
    }

    return {
      ok: true,
      post,
    }
  }

/* ==================================================
SECTION 14 : UPDATE POST (🔥 IMAGE VALIDATION FIX)
================================================== */

async updatePost(
  postId:number,
  channelCode:string,
  body:any
){

  if(!Number.isInteger(postId) || postId <= 0){
    throw new BadRequestException('INVALID_POST_ID')
  }

  if(typeof body?.content !== 'string' || body.content.trim() === ''){
    throw new BadRequestException('CONTENT_REQUIRED')
  }

  /* =========================
  🔥 IMAGE 필수 검증 (핵심 수정)
  ========================= */

  if(!Array.isArray(body.imageAssetIds)){
    throw new BadRequestException('IMAGE_ASSET_IDS_REQUIRED')
  }

  /* =========================
  POST 조회
  ========================= */

  const existing = this.db.prepare(`
    SELECT id, profileId, channelCode, regionId
    FROM posts
    WHERE id = ?
    LIMIT 1
  `).get(postId) as {
    id:number
    profileId:number
    channelCode:string
    regionId:number | null
  } | undefined

  if(!existing){
    throw new BadRequestException('POST_NOT_FOUND')
  }

  if(existing.channelCode !== channelCode){
    throw new UnauthorizedException('POST_ACCESS_DENIED')
  }

  /* =========================
  IMAGE 처리
  ========================= */

  const imageAssetIds = this.normalizeImageAssetIds(
    body.imageAssetIds
  )

  this.validateImageAssetsOwnership(
    channelCode,
    imageAssetIds
  )

  /* 기존 이미지 제거 */
  this.db.prepare(`
    DELETE FROM post_images
    WHERE postId = ?
  `).run(postId)

  /* 새 이미지 삽입 */
  this.insertPostImages(
    postId,
    imageAssetIds
  )

  /* =========================
  REGION 처리
  ========================= */

  const nextRegionId =
    body.regionId === undefined
      ? existing.regionId
      : body.regionId

  /* =========================
  UPDATE
  ========================= */

  this.db.prepare(`
    UPDATE posts
    SET content = ?,
        regionId = ?,
        mediaCount = ?,
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    body.content.trim(),
    nextRegionId,
    imageAssetIds.length,
    postId
  )

  return {
    ok:true
  }

}

/* ==================================================
SECTION 15 : DELETE POST
================================================== */

async deletePost(
  postId:number,
  channelCode:string
){

  if(!Number.isInteger(postId) || postId <= 0){
    throw new BadRequestException('INVALID_POST_ID')
  }

  const existing = this.db.prepare(`
    SELECT
      id,
      channelCode,
      status
    FROM posts
    WHERE id = ?
    LIMIT 1
  `).get(postId) as {
    id:number
    channelCode:string
    status:'ACTIVE'|'HIDDEN'|'DELETED'
  } | undefined

  if(!existing){
    throw new BadRequestException('POST_NOT_FOUND')
  }

  if(existing.channelCode !== channelCode){
    throw new UnauthorizedException('POST_ACCESS_DENIED')
  }

  this.db.prepare(`
    UPDATE posts
    SET status = 'DELETED',
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(postId)

  return {
    ok:true
  }

}

//=============================
// SECTION END
//=============================
}
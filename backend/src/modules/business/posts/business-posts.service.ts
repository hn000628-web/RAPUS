// FILE : backend/src/modules/business/posts/business-posts.service.ts
// ROOT : backend/src/modules/business/posts/business-posts.service.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS POSTS SERVICE
// CHANGE SUMMARY :
// - BUSINESS 전용 포스트 생성 Service 유지
// - profileId + channelCode 단일 귀속 검증 유지
// - BUSINESS profileType 검증 유지
// - profiles.primaryIndustry* 조회 유지
// - BUSINESS 프로필 업종 미설정 시 포스트 생성 차단 유지
// - posts.industryId / industrySubtypeId / industryCode / industrySubtypeCode snapshot 저장 유지
// - posts.title / priceAmount / eventStartAt / eventEndAt 저장 유지
// - 이미지 저장은 처리하지 않고 imageAssetIds를 post_images relation으로만 연결 유지
// - GET /api/business/posts 연결용 getPosts() 조회 Service 추가
// - PRODUCT / GENERAL / EVENT 조회 필터 지원
// - post_images + image_assets relation 기반 imageUrl / thumbnailUrl 반환 추가
// - DB 접근은 Service 내부에서만 수행

// SECTION 01 : IMPORT

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'

import db from '../../../config/database'

// SECTION 02 : TYPE

type BusinessPostType =
  | 'GENERAL'
  | 'PRODUCT'
  | 'EVENT'

type BusinessPostStatus =
  | 'ACTIVE'
  | 'DRAFT'

type BusinessPostListStatus =
  | 'ACTIVE'
  | 'DRAFT'
  | 'HIDDEN'
  | 'DELETED'

type BusinessProfileRow = {
  id: number
  channelCode: string
  profileType: 'BUSINESS'
  primaryIndustryId: number | null
  primaryIndustrySubtypeId: number | null
  primaryIndustryCode: string | null
  primaryIndustrySubtypeCode: string | null
}

type BusinessProfileWithIndustryRow =
  BusinessProfileRow & {
    primaryIndustryId: number
    primaryIndustrySubtypeId: number
    primaryIndustryCode: string
    primaryIndustrySubtypeCode: string
  }

type BusinessImageAssetRow = {
  id: number
  channelCode: string
  usageType: string
}

type BusinessPostRow = {
  id: number
  profileId: number
  channelCode: string
  regionId: number | null
  contentType: string
  postType: BusinessPostType
  industryId: number | null
  industrySubtypeId: number | null
  industryCode: string | null
  industrySubtypeCode: string | null
  title: string | null
  content: string | null
  priceAmount: number | null
  eventStartAt: string | null
  eventEndAt: string | null
  visibility: string | null
  mediaCount: number | null
  latitude: number | null
  longitude: number | null
  status: BusinessPostListStatus
  createdAt: string | null
  updatedAt: string | null
}

type BusinessPostImageRow = {
  id: number
  postId: number
  imageAssetId: number
  filePath: string | null
  sortOrder: number | null
}

export type CreateBusinessPostInput = {
  profileId: number | string
  channelCode: string
  title: string
  content: string
  postType?: BusinessPostType
  categoryCode?: BusinessPostType
  regionId?: number | string | null
  priceAmount?: number | string | null
  price?: number | string | null
  eventStartAt?: string | null
  eventEndAt?: string | null
  status?: BusinessPostStatus
  imageAssetIds?: Array<number | string>
}

export type CreatedBusinessPostResult = {
  id: number
  profileId: number
  channelCode: string
  postType: BusinessPostType
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
  status: BusinessPostStatus
  mediaCount: number
}

export type GetBusinessPostsInput = {
  profileId?: number | string
  channelCode?: string
  postType?: string | null
  status?: string | null
}

export type BusinessPostListImage = {
  id: number
  postId: number
  imageAssetId: number
  filePath: string | null
  imageUrl: string | null
  sortOrder: number
}

export type BusinessPostListItem = {
  id: number
  profileId: number
  channelCode: string
  postType: BusinessPostType
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
  status: BusinessPostListStatus
  mediaCount: number
  createdAt: string | null
  updatedAt: string | null
  images: BusinessPostListImage[]
  imageUrl: string | null
  thumbnailUrl: string | null
}

// SECTION 03 : CONSTANT

const BUSINESS_POST_TYPES: BusinessPostType[] = [
  'GENERAL',
  'PRODUCT',
  'EVENT'
]

const BUSINESS_POST_STATUSES: BusinessPostStatus[] = [
  'ACTIVE',
  'DRAFT'
]

const BUSINESS_POST_LIST_STATUSES: BusinessPostListStatus[] = [
  'ACTIVE',
  'DRAFT',
  'HIDDEN',
  'DELETED'
]

// SECTION 04 : SERVICE

@Injectable()
export class BusinessPostsService {
  // SECTION 05 : CREATE POST

  async createPost(
    input: CreateBusinessPostInput
  ): Promise<CreatedBusinessPostResult> {
    const profileId =
      this.normalizePositiveInteger(input.profileId)

    const channelCode =
      this.normalizeRequiredText(
        input.channelCode,
        'channelCode'
      )

    const title =
      this.normalizeRequiredText(
        input.title,
        'title'
      )

    const content =
      this.normalizeRequiredText(
        input.content,
        'content'
      )

    const postType =
      this.normalizePostType(
        input.postType || input.categoryCode
      )

    const status =
      this.normalizeStatus(input.status)

    const regionId =
      this.normalizeNullablePositiveInteger(input.regionId)

    const priceAmount =
      this.normalizePriceAmount(
        input.priceAmount ?? input.price
      )

    const eventStartAt =
      this.normalizeNullableDate(
        input.eventStartAt,
        'eventStartAt'
      )

    const eventEndAt =
      this.normalizeNullableDate(
        input.eventEndAt,
        'eventEndAt'
      )

    const imageAssetIds =
      this.normalizeImageAssetIds(input.imageAssetIds)

    this.validatePostTypePayload({
      postType,
      priceAmount,
      eventStartAt,
      eventEndAt
    })

    const profile =
      this.findBusinessProfile({
        profileId,
        channelCode
      })

    this.validateBusinessProfileIndustry(profile)

    this.validateImageAssets({
      channelCode: profile.channelCode,
      imageAssetIds
    })

    try {
      db.exec('BEGIN')

      const result = db.prepare(`
        INSERT INTO posts(
          profileId,
          channelCode,
          regionId,
          contentType,
          postType,
          industryId,
          industrySubtypeId,
          industryCode,
          industrySubtypeCode,
          title,
          content,
          priceAmount,
          eventStartAt,
          eventEndAt,
          visibility,
          mediaCount,
          status,
          createdAt,
          updatedAt
        )
        VALUES(
          ?,
          ?,
          ?,
          'PLACE',
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
          'PUBLIC',
          ?,
          ?,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `).run(
        profile.id,
        profile.channelCode,
        regionId,
        postType,
        profile.primaryIndustryId,
        profile.primaryIndustrySubtypeId,
        profile.primaryIndustryCode,
        profile.primaryIndustrySubtypeCode,
        title,
        content,
        priceAmount,
        eventStartAt,
        eventEndAt,
        imageAssetIds.length,
        status
      )

      const postId =
        Number(result.lastInsertRowid)

      this.insertPostImageRelations({
        postId,
        imageAssetIds
      })

      db.exec('COMMIT')

      return {
        id: postId,
        profileId: profile.id,
        channelCode: profile.channelCode,
        postType,
        industryId: profile.primaryIndustryId,
        industrySubtypeId: profile.primaryIndustrySubtypeId,
        industryCode: profile.primaryIndustryCode,
        industrySubtypeCode: profile.primaryIndustrySubtypeCode,
        title,
        content,
        regionId,
        priceAmount,
        eventStartAt,
        eventEndAt,
        status,
        mediaCount: imageAssetIds.length
      }
    } catch (error) {
      db.exec('ROLLBACK')

      console.error(
        '[BUSINESS POST CREATE ERROR]',
        error
      )

      throw new InternalServerErrorException(
        'business post create failed'
      )
    }
  }

  // SECTION 06 : GET POSTS

  async getPosts(
    input: GetBusinessPostsInput
  ): Promise<BusinessPostListItem[]> {
    const profileId =
      this.normalizePositiveInteger(input.profileId)

    const channelCode =
      this.normalizeRequiredText(
        input.channelCode,
        'channelCode'
      )

    const postType =
      this.normalizeNullablePostType(input.postType)

    const status =
      this.normalizeNullableListStatus(input.status) ?? 'ACTIVE'

    const profile =
      this.findBusinessProfile({
        profileId,
        channelCode
      })

    const rows =
      db.prepare(`
        SELECT
          id,
          profileId,
          channelCode,
          regionId,
          contentType,
          postType,
          industryId,
          industrySubtypeId,
          industryCode,
          industrySubtypeCode,
          title,
          content,
          priceAmount,
          eventStartAt,
          eventEndAt,
          visibility,
          mediaCount,
          latitude,
          longitude,
          status,
          createdAt,
          updatedAt
        FROM posts
        WHERE profileId = ?
          AND channelCode = ?
          AND contentType = 'PLACE'
          AND status = ?
          AND (
            ? IS NULL
            OR postType = ?
          )
        ORDER BY
          createdAt DESC,
          id DESC
        LIMIT 100
      `).all(
        profile.id,
        profile.channelCode,
        status,
        postType,
        postType
      ) as BusinessPostRow[]

    if (!Array.isArray(rows) || rows.length === 0) {
      return []
    }

    const postIds =
      rows.map((row) => row.id)

    const imageMap =
      this.getPostImageMap(postIds)

    return rows.map((row) => {
      const images =
        imageMap.get(row.id) ?? []

      const firstImage =
        images[0]?.imageUrl ?? null

      return {
        id: row.id,
        profileId: row.profileId,
        channelCode: row.channelCode,
        postType: row.postType,
        industryId: row.industryId,
        industrySubtypeId: row.industrySubtypeId,
        industryCode: row.industryCode,
        industrySubtypeCode: row.industrySubtypeCode,
        title: row.title ?? '',
        content: row.content ?? '',
        regionId: row.regionId,
        priceAmount: row.priceAmount,
        eventStartAt: row.eventStartAt,
        eventEndAt: row.eventEndAt,
        status: row.status,
        mediaCount: row.mediaCount ?? images.length,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        images,
        imageUrl: firstImage,
        thumbnailUrl: firstImage
      }
    })
  }

  // SECTION 07 : PROFILE VALIDATION

  private findBusinessProfile(params: {
    profileId: number
    channelCode: string
  }): BusinessProfileRow {
    const profile = db.prepare(`
      SELECT
        id,
        channelCode,
        profileType,
        primaryIndustryId,
        primaryIndustrySubtypeId,
        primaryIndustryCode,
        primaryIndustrySubtypeCode
      FROM profiles
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(
      params.profileId,
      params.channelCode
    ) as BusinessProfileRow | undefined

    if (!profile) {
      throw new BadRequestException(
        'invalid business profile context'
      )
    }

    return profile
  }

  private validateBusinessProfileIndustry(
    profile: BusinessProfileRow
  ): asserts profile is BusinessProfileWithIndustryRow {
    if (
      !profile.primaryIndustryId ||
      !profile.primaryIndustrySubtypeId ||
      !profile.primaryIndustryCode ||
      !profile.primaryIndustrySubtypeCode
    ) {
      throw new BadRequestException(
        'business profile industry required'
      )
    }
  }

  // SECTION 08 : IMAGE VALIDATION

  private validateImageAssets(params: {
    channelCode: string
    imageAssetIds: number[]
  }) {
    if (params.imageAssetIds.length === 0) {
      return
    }

    const findAsset = db.prepare(`
      SELECT
        id,
        channelCode,
        usageType
      FROM image_assets
      WHERE id = ?
        AND channelCode = ?
        AND usageType = 'post'
      LIMIT 1
    `)

    for (const imageAssetId of params.imageAssetIds) {
      const asset = findAsset.get(
        imageAssetId,
        params.channelCode
      ) as BusinessImageAssetRow | undefined

      if (!asset) {
        throw new BadRequestException(
          'invalid business post image asset'
        )
      }
    }
  }

  // SECTION 09 : POST IMAGE RELATION

  private insertPostImageRelations(params: {
    postId: number
    imageAssetIds: number[]
  }) {
    if (params.imageAssetIds.length === 0) {
      return
    }

    const insertRelation = db.prepare(`
      INSERT INTO post_images(
        postId,
        imageAssetId,
        sortOrder,
        createdAt
      )
      VALUES(
        ?,
        ?,
        ?,
        CURRENT_TIMESTAMP
      )
    `)

    params.imageAssetIds.forEach(
      (imageAssetId, index) => {
        insertRelation.run(
          params.postId,
          imageAssetId,
          index + 1
        )
      }
    )
  }

  private getPostImageMap(
    postIds: number[]
  ): Map<number, BusinessPostListImage[]> {
    const imageMap =
      new Map<number, BusinessPostListImage[]>()

    if (postIds.length === 0) {
      return imageMap
    }

    const placeholders =
      postIds.map(() => '?').join(',')

    const rows =
      db.prepare(`
        SELECT
          pi.id,
          pi.postId,
          pi.imageAssetId,
          ia.filePath AS filePath,
          pi.sortOrder
        FROM post_images pi
        LEFT JOIN image_assets ia
          ON ia.id = pi.imageAssetId
        WHERE pi.postId IN (${placeholders})
        ORDER BY
          pi.postId ASC,
          pi.sortOrder ASC,
          pi.id ASC
      `).all(
        ...postIds
      ) as BusinessPostImageRow[]

    for (const row of rows) {
      const imageUrl =
        this.buildMediaUrl(row.filePath)

      const image: BusinessPostListImage = {
        id: row.id,
        postId: row.postId,
        imageAssetId: row.imageAssetId,
        filePath: row.filePath,
        imageUrl,
        sortOrder: row.sortOrder ?? 0
      }

      const current =
        imageMap.get(row.postId) ?? []

      current.push(image)

      imageMap.set(
        row.postId,
        current
      )
    }

    return imageMap
  }

  // SECTION 10 : POST TYPE VALIDATION

  private normalizePostType(
    value: unknown
  ): BusinessPostType {
    if (
      typeof value === 'string' &&
      BUSINESS_POST_TYPES.includes(value as BusinessPostType)
    ) {
      return value as BusinessPostType
    }

    throw new BadRequestException(
      'invalid business postType'
    )
  }

  private normalizeNullablePostType(
    value: unknown
  ): BusinessPostType | null {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null
    }

    if (
      typeof value === 'string' &&
      BUSINESS_POST_TYPES.includes(value as BusinessPostType)
    ) {
      return value as BusinessPostType
    }

    throw new BadRequestException(
      'invalid business postType'
    )
  }

  private normalizeStatus(
    value: unknown
  ): BusinessPostStatus {
    if (!value) {
      return 'DRAFT'
    }

    if (
      typeof value === 'string' &&
      BUSINESS_POST_STATUSES.includes(value as BusinessPostStatus)
    ) {
      return value as BusinessPostStatus
    }

    throw new BadRequestException(
      'invalid business post status'
    )
  }

  private normalizeNullableListStatus(
    value: unknown
  ): BusinessPostListStatus | null {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null
    }

    if (
      typeof value === 'string' &&
      BUSINESS_POST_LIST_STATUSES.includes(value as BusinessPostListStatus)
    ) {
      return value as BusinessPostListStatus
    }

    throw new BadRequestException(
      'invalid business post status'
    )
  }

  private validatePostTypePayload(params: {
    postType: BusinessPostType
    priceAmount: number | null
    eventStartAt: string | null
    eventEndAt: string | null
  }) {
    if (
      params.postType !== 'PRODUCT' &&
      params.priceAmount !== null
    ) {
      throw new BadRequestException(
        'priceAmount is only allowed for PRODUCT'
      )
    }

    if (
      params.postType !== 'EVENT' &&
      (
        params.eventStartAt !== null ||
        params.eventEndAt !== null
      )
    ) {
      throw new BadRequestException(
        'event period is only allowed for EVENT'
      )
    }

    if (
      params.postType === 'EVENT' &&
      params.eventStartAt &&
      params.eventEndAt &&
      params.eventStartAt > params.eventEndAt
    ) {
      throw new BadRequestException(
        'eventStartAt must be before eventEndAt'
      )
    }
  }

  // SECTION 11 : NORMALIZE HELPER

  private normalizeRequiredText(
    value: unknown,
    fieldName: string
  ): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(
        `${fieldName} required`
      )
    }

    const trimmed =
      value.trim()

    if (!trimmed) {
      throw new BadRequestException(
        `${fieldName} required`
      )
    }

    return trimmed
  }

  private normalizePositiveInteger(
    value: unknown
  ): number {
    const num =
      typeof value === 'number'
        ? value
        : Number(value)

    if (
      !Number.isInteger(num) ||
      num <= 0
    ) {
      throw new BadRequestException(
        'invalid positive integer'
      )
    }

    return num
  }

  private normalizeNullablePositiveInteger(
    value: unknown
  ): number | null {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null
    }

    return this.normalizePositiveInteger(value)
  }

  private normalizePriceAmount(
    value: unknown
  ): number | null {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null
    }

    const normalized =
      typeof value === 'string'
        ? value.replace(/,/g, '').trim()
        : value

    const num =
      Number(normalized)

    if (
      !Number.isInteger(num) ||
      num < 0
    ) {
      throw new BadRequestException(
        'invalid priceAmount'
      )
    }

    return num
  }

  private normalizeNullableDate(
    value: unknown,
    fieldName: string
  ): string | null {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        `invalid ${fieldName}`
      )
    }

    const trimmed =
      value.trim()

    if (!trimmed) {
      return null
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new BadRequestException(
        `invalid ${fieldName}`
      )
    }

    return trimmed
  }

  private normalizeImageAssetIds(
    value: unknown
  ): number[] {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return []
    }

    const rawValues =
      Array.isArray(value)
        ? value
        : [value]

    const ids =
      rawValues
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)

    return Array.from(new Set(ids))
  }

  // SECTION 12 : URL HELPER

  private buildMediaUrl(
    filePath: string | null
  ): string | null {
    if (!filePath) {
      return null
    }

    const trimmed =
      filePath.trim()

    if (!trimmed) {
      return null
    }

    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
    ) {
      return trimmed
    }

    const baseUrl =
      (
        process.env.API_URL ||
        process.env.PUBLIC_API_URL ||
        'http://localhost:4000'
      ).replace(/\/+$/, '')

    if (trimmed.startsWith('/media/')) {
      return `${baseUrl}${trimmed}`
    }

    if (trimmed.startsWith('media/')) {
      return `${baseUrl}/${trimmed}`
    }

    if (trimmed.startsWith('/uploads/')) {
      return `${baseUrl}${trimmed.replace(/^\/uploads\//, '/media/')}`
    }

    if (trimmed.startsWith('uploads/')) {
      return `${baseUrl}/${trimmed.replace(/^uploads\//, 'media/')}`
    }

    return `${baseUrl}/media/${trimmed.replace(/^\/+/, '')}`
  }
}
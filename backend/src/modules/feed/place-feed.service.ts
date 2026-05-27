// FILE : backend/src/modules/feed/place-feed.service.ts
// ROOT : backend/src/modules/feed/place-feed.service.ts
// STATUS : CREATE MODE
// ROLE : PLACE FEED READ SERVICE
// CHANGE SUMMARY :
// - PLACE ??곕굡 ?袁⑸뻻 READ ?袁⑹뒠 Service ??밴쉐
// - 嚥≪뮄???/ ??쑬以덃뉩紐꾩뵥 ?⑤벏??鈺곌퀬???닌듼?
// - profiles 疫꿸퀣? BUSINESS ?袁⑥쨮??鈺곌퀬??
// - regionId 疫꿸퀣? activityRegionId / feedRegionId 筌띲끉臾?
// - regions / industries / industry_subtypes / image_assets 疫꿸퀣??DB筌?????
// - DB ??쎄텕筌?癰궰野???곸벉
// - JWT / getMe ??????곸벉
// - DB ?臾롫젏?? Service ????癒?퐣筌???묐뻬

// SECTION 01 : IMPORT

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'

import db from '../../config/database'

// SECTION 02 : TYPE

export type GetPlaceFeedInput = {
  regionId?: number | string | null
  keyword?: string | null
  limit?: number | string | null
  searchScope?: 'ALL' | 'POST' | 'PRODUCT' | string | null
}

export type GetPlaceProductPreviewInput = {
  channelCode?: string | null
  limit?: number | string | null
}

export type GetPlaceRepresentativeImagesInput = {
  channelCode?: string | null
  limit?: number | string | null
}

type PlaceFeedRow = {
  id: number
  channelCode: string
  placeFeedTypeCode: PlaceFeedTypeCode | null
  displayName: string | null
  bio: string | null
  activityRegionId: number | null
  feedRegionId: number | null
  regionName: string | null
  regionFullName: string | null
  industryName: string | null
  industrySubtypeName: string | null
  closedOverlayText: string | null
  keywordPostImageFilePath: string | null
  keywordPostTitle: string | null
  keywordPostPriceAmount: number | null
  keywordPostId: number | null
  heroFilePath: string | null
  avatarFilePath: string | null
  adSettingId: number | null
  adSlotNo: number | null
  adStartAt: string | null
  adEndAt: string | null
  adStatus: string | null
  isPlaceFeedEnabled: number | null
  adIsActive: number | null
  adIsExpired: number | null
  createdAt: string | null
  updatedAt: string | null
}

type PlaceFeedTypeCode =
  | 'NORMAL'
  | 'CLASSIC'
  | 'MARKET'
  | 'FOOD'
  | 'BEAUTY'
  | 'CULTURE'
  | 'STAY'
  | 'RENTCAR'

export type PlaceFeedItem = {
  channelCode: string
  placeFeedTypeCode: PlaceFeedTypeCode | null
  displayName: string
  bio: string
  imageUrl: string | null
  regionName: string | null
  regionFullName: string | null
  industryName: string | null
  industrySubtypeName: string | null
  closedOverlayText: string | null
  matchedProductTitle: string | null
  matchedProductPriceAmount: number | null
  matchedProductPostId: number | null
  distanceKm: number | null
  distanceLabel: string | null
  adSlotNo: number
  effectiveAdSlotNo: number
  adEndAt: string | null
}

export type PlaceFeedResult = {
  ok: boolean
  places: PlaceFeedItem[]
}

type PlaceFeedProductPreviewRow = {
  productId: number
  productCode: string
  productName: string | null
  basePrice: number | null
  categoryName: string | null
  menuStatus: string | null
  isSoldOut: number | null
  thumbnailFilePath: string | null
  linkedPostId: number | null
}

export type PlaceFeedProductPreviewItem = {
  productId: number
  productCode: string
  productName: string
  priceAmount: number | null
  priceLabel: string | null
  thumbnailUrl: string | null
  categoryName: string | null
  menuStatus: string | null
  isSoldOut: boolean
  matchedProductPostId: number | null
}

export type PlaceFeedProductPreviewResult = {
  ok: boolean
  channelCode: string
  items: PlaceFeedProductPreviewItem[]
}

type PlaceFeedRepresentativeImageRow = {
  filePath: string | null
  sourceType: 'PROFILE' | 'HERO' | 'FALLBACK'
}

export type PlaceFeedRepresentativeImageItem = {
  imageUrl: string
  sourceType: 'PROFILE' | 'HERO' | 'FALLBACK'
}

export type PlaceFeedRepresentativeImagesResult = {
  ok: boolean
  channelCode: string
  items: PlaceFeedRepresentativeImageItem[]
}

// SECTION 03 : CONSTANT

const DEFAULT_LIMIT =
  16

const MAX_LIMIT =
  16

const PREVIEW_DEFAULT_LIMIT =
  5

const PREVIEW_MAX_LIMIT =
  5

const REPRESENTATIVE_DEFAULT_LIMIT =
  6

const REPRESENTATIVE_MAX_LIMIT =
  6

const FETCH_POOL_LIMIT =
  100

// SECTION 04 : SERVICE

@Injectable()
export class PlaceFeedService {
  // SECTION 05 : GET PLACE FEED

  async getPlaceFeed(
    input: GetPlaceFeedInput
  ): Promise<PlaceFeedResult> {
    const regionId =
      this.normalizeNullablePositiveInteger(input.regionId)

    const keyword =
      this.normalizeNullableText(input.keyword)

    const limit =
      this.normalizeLimit(input.limit)

    const searchScope =
      this.normalizeSearchScope(input.searchScope)

    try {
      let rows =
        this.findPlaceRows({
          regionId,
          keyword,
          limit: FETCH_POOL_LIMIT,
          searchScope
        })

      if (
        regionId !== null &&
        rows.length === 0
      ) {
        rows =
          this.findPlaceRows({
            regionId: null,
            keyword,
            limit: FETCH_POOL_LIMIT,
            searchScope
          })
      }

      const places =
        this.buildPlaceFeedItems(rows, limit)

      return {
        ok: true,
        places
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }

      console.error(
        '[PLACE FEED LOAD ERROR]',
        error
      )

      throw new InternalServerErrorException(
        'place feed load failed'
      )
    }
  }

  // SECTION 06 : GET PLACE PRODUCT PREVIEW

  async getPlaceProductPreview(
    input: GetPlaceProductPreviewInput
  ): Promise<PlaceFeedProductPreviewResult> {
    const channelCode =
      this.normalizeChannelCode(input.channelCode)

    const limit =
      this.normalizePreviewLimit(input.limit)

    try {
      const rows =
        this.findPlaceProductPreviewRows({
          channelCode,
          limit
        })

      const items =
        rows.map((row) => ({
          productId: row.productId,
          productCode: row.productCode,
          productName: String(row.productName || '').trim() || '상품',
          priceAmount:
            typeof row.basePrice === 'number'
              ? row.basePrice
              : null,
          priceLabel:
            typeof row.basePrice === 'number'
              ? `${row.basePrice.toLocaleString()}원`
              : null,
          thumbnailUrl: this.buildMediaUrl(row.thumbnailFilePath),
          categoryName: row.categoryName,
          menuStatus: row.menuStatus,
          isSoldOut: Number(row.isSoldOut ?? 0) === 1,
          matchedProductPostId:
            typeof row.linkedPostId === 'number'
              ? row.linkedPostId
              : null
        }))

      return {
        ok: true,
        channelCode,
        items
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }

      console.error(
        '[PLACE PRODUCT PREVIEW LOAD ERROR]',
        error
      )

      throw new InternalServerErrorException(
        'place product preview load failed'
      )
    }
  }

  // SECTION 07 : GET PLACE REPRESENTATIVE IMAGES

  async getPlaceRepresentativeImages(
    input: GetPlaceRepresentativeImagesInput
  ): Promise<PlaceFeedRepresentativeImagesResult> {
    const channelCode =
      this.normalizeChannelCode(input.channelCode)

    const limit =
      this.normalizeRepresentativeLimit(input.limit)

    try {
      const rows =
        this.findPlaceRepresentativeImageRows({
          channelCode,
          limit
        })

      const dedupe =
        new Set<string>()
      const items: PlaceFeedRepresentativeImageItem[] =
        []

      for (const row of rows) {
        const imageUrl =
          this.buildMediaUrl(row.filePath)

        if (!imageUrl) {
          continue
        }

        if (dedupe.has(imageUrl)) {
          continue
        }

        dedupe.add(imageUrl)
        items.push({
          imageUrl,
          sourceType: row.sourceType
        })

        if (items.length >= limit) {
          break
        }
      }

      return {
        ok: true,
        channelCode,
        items
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }

      console.error(
        '[PLACE REPRESENTATIVE IMAGES LOAD ERROR]',
        error
      )

      throw new InternalServerErrorException(
        'place representative images load failed'
      )
    }
  }

  // SECTION 08 : DB QUERY

  private findPlaceRows(params: {
    regionId: number | null
    keyword: string | null
    limit: number
    searchScope: 'ALL' | 'POST' | 'PRODUCT'
  }): PlaceFeedRow[] {
    const keyword =
      params.keyword || null

    return db.prepare(`
      SELECT
        p.id,
        p.channelCode,
        p.placeFeedTypeCode,
        p.displayName,
        p.bio,
        p.activityRegionId,
        p.feedRegionId,

        r.name AS regionName,
        r.fullName AS regionFullName,

        i.name AS industryName,
        ist.name AS industrySubtypeName,
        CASE
          WHEN COALESCE(bhp.temporaryClosed, bhc.temporaryClosed, 0) = 1 THEN '?곸뾽醫낅즺 쨌 ?대Т'
          WHEN COALESCE(bhp.alwaysOpen, bhc.alwaysOpen, 0) = 1 THEN NULL
          WHEN strftime('%w', 'now', 'localtime') = '0' AND COALESCE(bhp.sun_isClosed, bhc.sun_isClosed, 0) = 1 THEN '?곸뾽醫낅즺 쨌 ?쇱슂???대Т'
          WHEN strftime('%w', 'now', 'localtime') = '1' AND COALESCE(bhp.mon_isClosed, bhc.mon_isClosed, 0) = 1 THEN '?곸뾽醫낅즺 쨌 ?붿슂???대Т'
          WHEN strftime('%w', 'now', 'localtime') = '2' AND COALESCE(bhp.tue_isClosed, bhc.tue_isClosed, 0) = 1 THEN '?곸뾽醫낅즺 쨌 ?붿슂???대Т'
          WHEN strftime('%w', 'now', 'localtime') = '3' AND COALESCE(bhp.wed_isClosed, bhc.wed_isClosed, 0) = 1 THEN '?곸뾽醫낅즺 쨌 ?섏슂???대Т'
          WHEN strftime('%w', 'now', 'localtime') = '4' AND COALESCE(bhp.thu_isClosed, bhc.thu_isClosed, 0) = 1 THEN '?곸뾽醫낅즺 쨌 紐⑹슂???대Т'
          WHEN strftime('%w', 'now', 'localtime') = '5' AND COALESCE(bhp.fri_isClosed, bhc.fri_isClosed, 0) = 1 THEN '?곸뾽醫낅즺 쨌 湲덉슂???대Т'
          WHEN strftime('%w', 'now', 'localtime') = '6' AND COALESCE(bhp.sat_isClosed, bhc.sat_isClosed, 0) = 1 THEN '?곸뾽醫낅즺 쨌 ?좎슂???대Т'
          ELSE NULL
        END AS closedOverlayText,

        (
          SELECT ia_thumb.filePath
          FROM pos_products pp
          LEFT JOIN pos_product_categories ppc
            ON ppc.id = pp.categoryId
            AND ppc.channelCode = pp.channelCode
            AND ppc.isActive = 1
          LEFT JOIN pos_product_thumbnails ppt
            ON ppt.productId = pp.id
            AND ppt.isActive = 1
          LEFT JOIN image_assets ia_thumb
            ON ia_thumb.id = ppt.imageAssetId
            AND ia_thumb.usageType = 'pos-product-thumbnail'
            AND ia_thumb.isActive = 1
          WHERE ? IS NOT NULL
            AND pp.profileId = p.id
            AND pp.channelCode = p.channelCode
            AND pp.isActive = 1
            AND pp.deletedAt IS NULL
            AND pp.menuStatus = 'ON_SALE'
            AND pp.showOnTableOrder = 1
            AND COALESCE(pp.isSoldOut, 0) = 0
            AND (
              instr(lower(COALESCE(pp.productName, '')), lower(?)) > 0
              OR instr(lower(COALESCE(pp.productDescription, '')), lower(?)) > 0
              OR instr(lower(COALESCE(ppc.categoryName, '')), lower(?)) > 0
            )
          ORDER BY
            COALESCE(pp.isRepresentative, 0) DESC,
            COALESCE(pp.isFeatured, 0) DESC,
            COALESCE(pp.sortOrder, 999999) ASC,
            pp.createdAt DESC,
            pp.id DESC
          LIMIT 1
        ) AS keywordPostImageFilePath,

        (
          SELECT pp.productName
          FROM pos_products pp
          LEFT JOIN pos_product_categories ppc
            ON ppc.id = pp.categoryId
            AND ppc.channelCode = pp.channelCode
            AND ppc.isActive = 1
          WHERE ? IS NOT NULL
            AND pp.profileId = p.id
            AND pp.channelCode = p.channelCode
            AND pp.isActive = 1
            AND pp.deletedAt IS NULL
            AND pp.menuStatus = 'ON_SALE'
            AND pp.showOnTableOrder = 1
            AND COALESCE(pp.isSoldOut, 0) = 0
            AND (
              instr(lower(COALESCE(pp.productName, '')), lower(?)) > 0
              OR instr(lower(COALESCE(pp.productDescription, '')), lower(?)) > 0
              OR instr(lower(COALESCE(ppc.categoryName, '')), lower(?)) > 0
            )
          ORDER BY
            CASE
              WHEN lower(COALESCE(pp.productName, '')) = lower(?) THEN 0
              WHEN instr(lower(COALESCE(pp.productName, '')), lower(?)) > 0 THEN 1
              ELSE 2
            END ASC,
            COALESCE(pp.isSoldOut, 0) ASC,
            COALESCE(pp.isRepresentative, 0) DESC,
            COALESCE(pp.isFeatured, 0) DESC,
            COALESCE(pp.sortOrder, 999999) ASC,
            pp.createdAt DESC,
            pp.id DESC
          LIMIT 1
        ) AS keywordPostTitle,

        (
          SELECT pp.basePrice
          FROM pos_products pp
          LEFT JOIN pos_product_categories ppc
            ON ppc.id = pp.categoryId
            AND ppc.channelCode = pp.channelCode
            AND ppc.isActive = 1
          WHERE ? IS NOT NULL
            AND pp.profileId = p.id
            AND pp.channelCode = p.channelCode
            AND pp.isActive = 1
            AND pp.deletedAt IS NULL
            AND pp.menuStatus = 'ON_SALE'
            AND pp.showOnTableOrder = 1
            AND COALESCE(pp.isSoldOut, 0) = 0
            AND (
              instr(lower(COALESCE(pp.productName, '')), lower(?)) > 0
              OR instr(lower(COALESCE(pp.productDescription, '')), lower(?)) > 0
              OR instr(lower(COALESCE(ppc.categoryName, '')), lower(?)) > 0
            )
          ORDER BY
            CASE
              WHEN lower(COALESCE(pp.productName, '')) = lower(?) THEN 0
              WHEN instr(lower(COALESCE(pp.productName, '')), lower(?)) > 0 THEN 1
              ELSE 2
            END ASC,
            COALESCE(pp.isSoldOut, 0) ASC,
            COALESCE(pp.isRepresentative, 0) DESC,
            COALESCE(pp.isFeatured, 0) DESC,
            COALESCE(pp.sortOrder, 999999) ASC,
            pp.createdAt DESC,
            pp.id DESC
          LIMIT 1
        ) AS keywordPostPriceAmount,

        (
          SELECT ppl.postId
          FROM pos_products pp
          LEFT JOIN pos_product_categories ppc
            ON ppc.id = pp.categoryId
            AND ppc.channelCode = pp.channelCode
            AND ppc.isActive = 1
          LEFT JOIN pos_product_post_links ppl
            ON ppl.posProductId = pp.id
            AND ppl.channelCode = pp.channelCode
            AND ppl.syncStatus = 'LINKED'
          WHERE ? IS NOT NULL
            AND pp.profileId = p.id
            AND pp.channelCode = p.channelCode
            AND pp.isActive = 1
            AND pp.deletedAt IS NULL
            AND pp.menuStatus = 'ON_SALE'
            AND pp.showOnTableOrder = 1
            AND COALESCE(pp.isSoldOut, 0) = 0
            AND (
              instr(lower(COALESCE(pp.productName, '')), lower(?)) > 0
              OR instr(lower(COALESCE(pp.productDescription, '')), lower(?)) > 0
              OR instr(lower(COALESCE(ppc.categoryName, '')), lower(?)) > 0
            )
          ORDER BY
            CASE
              WHEN lower(COALESCE(pp.productName, '')) = lower(?) THEN 0
              WHEN instr(lower(COALESCE(pp.productName, '')), lower(?)) > 0 THEN 1
              ELSE 2
            END ASC,
            COALESCE(pp.isSoldOut, 0) ASC,
            COALESCE(pp.isRepresentative, 0) DESC,
            COALESCE(pp.isFeatured, 0) DESC,
            COALESCE(pp.sortOrder, 999999) ASC,
            pp.createdAt DESC,
            pp.id DESC
          LIMIT 1
        ) AS keywordPostId,

        (
          SELECT ia.filePath
          FROM profile_hero_images ph
          LEFT JOIN image_assets ia
            ON ia.id = ph.imageAssetId
          WHERE ph.profileId = p.id
            AND ph.channelCode = p.channelCode
            AND (
              ph.isActive = 1
              OR ph.isActive IS NULL
            )
          ORDER BY
            ph.sortOrder ASC,
            ph.id ASC
          LIMIT 1
        ) AS heroFilePath,

        (
          SELECT ia.filePath
          FROM image_assets ia
          WHERE ia.channelCode = p.channelCode
            AND ia.usageType = 'avatar'
            AND (
              ia.isActive = 1
              OR ia.isActive IS NULL
            )
          ORDER BY
            ia.createdAt DESC,
            ia.id DESC
          LIMIT 1
        ) AS avatarFilePath,

        ad.id AS adSettingId,
        ad.adSlotNo AS adSlotNo,
        ad.adStartAt AS adStartAt,
        ad.adEndAt AS adEndAt,
        ad.adStatus AS adStatus,
        ad.isPlaceFeedEnabled AS isPlaceFeedEnabled,
        ad.isActive AS adIsActive,
        CASE
          WHEN ad.id IS NULL THEN 0
          WHEN COALESCE(ad.isActive, 0) != 1 THEN 1
          WHEN COALESCE(ad.isPlaceFeedEnabled, 1) != 1 THEN 1
          WHEN COALESCE(ad.adStatus, 'NONE') != 'ACTIVE' THEN 1
          WHEN ad.adSlotNo NOT BETWEEN 1 AND 16 THEN 1
          WHEN ad.adStartAt IS NOT NULL
            AND datetime(ad.adStartAt) > datetime('now', 'localtime') THEN 1
          WHEN ad.adEndAt IS NOT NULL
            AND datetime(ad.adEndAt) <= datetime('now', 'localtime') THEN 1
          ELSE 0
        END AS adIsExpired,

        p.createdAt,
        p.updatedAt
      FROM profiles p
      LEFT JOIN regions r
        ON r.id = COALESCE(
          p.activityRegionId,
          p.feedRegionId
        )
      LEFT JOIN industries i
        ON i.id = p.primaryIndustryId
      LEFT JOIN industry_subtypes ist
        ON ist.id = p.primaryIndustrySubtypeId
      LEFT JOIN business_hours bhp
        ON bhp.profileId = p.id
      LEFT JOIN (
        SELECT
          channelCode,
          MAX(COALESCE(temporaryClosed, 0)) AS temporaryClosed,
          MAX(COALESCE(alwaysOpen, 0)) AS alwaysOpen,
          MAX(COALESCE(mon_isClosed, 0)) AS mon_isClosed,
          MAX(COALESCE(tue_isClosed, 0)) AS tue_isClosed,
          MAX(COALESCE(wed_isClosed, 0)) AS wed_isClosed,
          MAX(COALESCE(thu_isClosed, 0)) AS thu_isClosed,
          MAX(COALESCE(fri_isClosed, 0)) AS fri_isClosed,
          MAX(COALESCE(sat_isClosed, 0)) AS sat_isClosed,
          MAX(COALESCE(sun_isClosed, 0)) AS sun_isClosed
        FROM business_hours
        WHERE channelCode IS NOT NULL
          AND channelCode != ''
        GROUP BY channelCode
      ) bhc
        ON bhc.channelCode = p.channelCode
      LEFT JOIN place_feed_ad_settings ad
        ON ad.id = (
          SELECT ad2.id
          FROM place_feed_ad_settings ad2
          WHERE ad2.profileId = p.id
            AND ad2.channelCode = p.channelCode
          ORDER BY
            COALESCE(ad2.updatedAt, ad2.createdAt) DESC,
            ad2.id DESC
          LIMIT 1
        )
      WHERE p.profileType = 'BUSINESS'
        AND p.businessTypeCode IN ('STORE', 'MOBILE_BIZ')
        AND (
          ? IS NULL
          OR p.activityRegionId = ?
          OR p.feedRegionId = ?
          OR (
            p.activityRegionId IS NULL
            AND p.feedRegionId IS NULL
          )
        )
        AND (
          ? IS NULL
          OR instr(lower(COALESCE(p.displayName, '')), lower(?)) > 0
          OR instr(lower(COALESCE(p.bio, '')), lower(?)) > 0
          OR instr(lower(COALESCE(r.name, '')), lower(?)) > 0
          OR instr(lower(COALESCE(r.fullName, '')), lower(?)) > 0
          OR instr(lower(COALESCE(i.name, '')), lower(?)) > 0
          OR instr(lower(COALESCE(ist.name, '')), lower(?)) > 0
          OR EXISTS (
            SELECT 1
            FROM posts bp
            WHERE bp.profileId = p.id
              AND bp.channelCode = p.channelCode
              AND bp.contentType = 'PLACE'
              AND bp.status = 'ACTIVE'
              AND (
                (? = 'ALL')
                OR (
                  ? = 'POST'
                  AND COALESCE(bp.postType, 'GENERAL') NOT IN ('PRODUCT', 'EVENT')
                )
                OR (
                  ? = 'PRODUCT'
                  AND COALESCE(bp.postType, 'GENERAL') IN ('PRODUCT', 'EVENT')
                )
              )
              AND (
                instr(lower(COALESCE(bp.content, '')), lower(?)) > 0
                OR instr(lower(COALESCE(bp.content, '')), lower(?)) > 0
              )
          )
          OR EXISTS (
            SELECT 1
            FROM pos_products pp
            LEFT JOIN pos_product_categories ppc
              ON ppc.id = pp.categoryId
              AND ppc.channelCode = pp.channelCode
              AND ppc.isActive = 1
            WHERE pp.profileId = p.id
              AND pp.channelCode = p.channelCode
              AND ? IN ('ALL', 'PRODUCT')
              AND pp.isActive = 1
              AND pp.deletedAt IS NULL
              AND pp.menuStatus = 'ON_SALE'
              AND pp.showOnTableOrder = 1
              AND COALESCE(pp.isSoldOut, 0) = 0
              AND (
                instr(lower(COALESCE(pp.productName, '')), lower(?)) > 0
                OR instr(lower(COALESCE(pp.productDescription, '')), lower(?)) > 0
                OR instr(lower(COALESCE(ppc.categoryName, '')), lower(?)) > 0
              )
          )
        )
      ORDER BY
        p.updatedAt DESC,
        p.createdAt DESC,
        p.id DESC
      LIMIT ?
    `).all(
      // keywordPostImageFilePath
      keyword,
      keyword,
      keyword,
      keyword,
      // keywordPostTitle
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      // keywordPostPriceAmount
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      // keywordPostId
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      // region filter
      params.regionId,
      params.regionId,
      params.regionId,
      // keyword root filter
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      params.searchScope,
      params.searchScope,
      params.searchScope,
      keyword,
      keyword,
      params.searchScope,
      // limit
      params.limit
    ) as PlaceFeedRow[]
  }

  private findPlaceProductPreviewRows(params: {
    channelCode: string
    limit: number
  }): PlaceFeedProductPreviewRow[] {
    return db.prepare(`
      SELECT
        pp.id AS productId,
        pp.productCode AS productCode,
        pp.productName AS productName,
        pp.basePrice AS basePrice,
        ppc.categoryName AS categoryName,
        pp.menuStatus AS menuStatus,
        COALESCE(pp.isSoldOut, 0) AS isSoldOut,
        ia.filePath AS thumbnailFilePath,
        ppl.postId AS linkedPostId
      FROM pos_products pp
      INNER JOIN profiles p
        ON p.id = pp.profileId
        AND p.channelCode = pp.channelCode
        AND p.profileType = 'BUSINESS'
      LEFT JOIN pos_product_categories ppc
        ON ppc.id = pp.categoryId
        AND ppc.channelCode = pp.channelCode
        AND ppc.isActive = 1
      LEFT JOIN pos_product_thumbnails ppt
        ON ppt.productId = pp.id
        AND ppt.isActive = 1
      LEFT JOIN image_assets ia
        ON ia.id = ppt.imageAssetId
        AND ia.isActive = 1
        AND ia.usageType = 'pos-product-thumbnail'
      LEFT JOIN pos_product_post_links ppl
        ON ppl.posProductId = pp.id
        AND ppl.channelCode = pp.channelCode
        AND ppl.syncStatus = 'LINKED'
      WHERE pp.channelCode = ?
        AND pp.isActive = 1
        AND pp.deletedAt IS NULL
        AND pp.showOnTableOrder = 1
        AND COALESCE(pp.isSoldOut, 0) = 0
        AND COALESCE(pp.menuStatus, 'ON_SALE') = 'ON_SALE'
      ORDER BY
        CASE
          WHEN lower(COALESCE(ppc.categoryName, '')) = '메인 메뉴' THEN 0
          WHEN lower(COALESCE(ppc.categoryName, '')) = 'main menu' THEN 0
          ELSE 1
        END ASC,
        COALESCE(pp.isRepresentative, 0) DESC,
        COALESCE(pp.isFeatured, 0) DESC,
        CASE WHEN ia.filePath IS NULL OR trim(ia.filePath) = '' THEN 1 ELSE 0 END ASC,
        COALESCE(pp.sortOrder, 999999) ASC,
        pp.createdAt DESC,
        pp.id DESC
      LIMIT ?
    `).all(
      params.channelCode,
      params.limit
    ) as PlaceFeedProductPreviewRow[]
  }

  private findPlaceRepresentativeImageRows(params: {
    channelCode: string
    limit: number
  }): PlaceFeedRepresentativeImageRow[] {
    const heroLimit =
      Math.max(0, params.limit - 1)

    return db.prepare(`
      WITH target_profile AS (
        SELECT p.id, p.channelCode
        FROM profiles p
        WHERE p.channelCode = ?
          AND p.profileType = 'BUSINESS'
        ORDER BY p.id ASC
        LIMIT 1
      ),
      profile_image AS (
        SELECT
          ia.filePath AS filePath,
          'PROFILE' AS sourceType
        FROM target_profile tp
        JOIN image_assets ia
          ON ia.channelCode = tp.channelCode
        WHERE ia.usageType = 'avatar'
          AND COALESCE(ia.isActive, 1) = 1
        ORDER BY ia.createdAt DESC, ia.id DESC
        LIMIT 1
      ),
      hero_images AS (
        SELECT
          ia.filePath AS filePath,
          'HERO' AS sourceType
        FROM target_profile tp
        JOIN profile_hero_images ph
          ON ph.profileId = tp.id
          AND ph.channelCode = tp.channelCode
        JOIN image_assets ia
          ON ia.id = ph.imageAssetId
        WHERE COALESCE(ph.isActive, 1) = 1
          AND COALESCE(ia.isActive, 1) = 1
        ORDER BY ph.sortOrder ASC, ph.id ASC
        LIMIT ?
      )
      SELECT filePath, sourceType FROM profile_image
      UNION ALL
      SELECT filePath, sourceType FROM hero_images
    `).all(
      params.channelCode,
      heroLimit
    ) as PlaceFeedRepresentativeImageRow[]
  }

  // SECTION 09 : MAPPER

  private mapPlaceRowToItem(
    row: PlaceFeedRow,
    effectiveAdSlotNo: number = 0
  ): PlaceFeedItem {
    const hasMatchedProduct =
      Boolean(row.keywordPostTitle) ||
      typeof row.keywordPostPriceAmount === 'number' ||
      typeof row.keywordPostId === 'number'

    const prioritizedImagePath =
      hasMatchedProduct
        ? (
            row.keywordPostImageFilePath ||
            row.avatarFilePath ||
            row.heroFilePath
          )
        : (
            row.avatarFilePath ||
            row.heroFilePath
          )

    return {
      channelCode: row.channelCode,
      placeFeedTypeCode: row.placeFeedTypeCode ?? null,
      displayName: row.displayName || '?대쫫 ?놁쓬',
      bio: row.bio || '',
      imageUrl:
        this.buildMediaUrl(
          prioritizedImagePath
        ),
      regionName: row.regionName,
      regionFullName: row.regionFullName,
      industryName: row.industryName,
      industrySubtypeName: row.industrySubtypeName,
      closedOverlayText: row.closedOverlayText,
      matchedProductTitle: row.keywordPostTitle ?? null,
      matchedProductPriceAmount:
        typeof row.keywordPostPriceAmount === 'number'
          ? row.keywordPostPriceAmount
          : null,
      matchedProductPostId:
        typeof row.keywordPostId === 'number'
          ? row.keywordPostId
          : null,
      distanceKm: null,
      distanceLabel: null,
      adSlotNo: effectiveAdSlotNo,
      effectiveAdSlotNo,
      adEndAt: row.adEndAt
    }
  }

  private buildPlaceFeedItems(
    rows: PlaceFeedRow[],
    limit: number
  ): PlaceFeedItem[] {
    const normalizedLimit =
      Math.max(0, Math.min(limit, MAX_LIMIT))

    if (normalizedLimit === 0) {
      return []
    }

    const decoratedRows =
      rows.map((row) => {
        const effectiveAdSlotNo =
          this.resolveEffectiveAdSlotNo(row)

        return {
          row,
          effectiveAdSlotNo,
          item: this.mapPlaceRowToItem(
            row,
            effectiveAdSlotNo
          )
        }
      })

    const fixedAdItems =
      decoratedRows
        .filter((entry) => entry.effectiveAdSlotNo > 0)
        .sort((left, right) =>
          left.effectiveAdSlotNo - right.effectiveAdSlotNo
        )

    const randomItems =
      this.shufflePlaceItems(
        decoratedRows
          .filter((entry) => entry.effectiveAdSlotNo === 0)
          .map((entry) => entry.item)
      )

    const slots:
      Array<PlaceFeedItem | null> =
      Array.from(
        {
          length: normalizedLimit
        },
        () => null
      )

    const usedChannelCodes =
      new Set<string>()

    for (const entry of fixedAdItems) {
      const slotIndex =
        entry.effectiveAdSlotNo - 1

      if (
        slotIndex < 0 ||
        slotIndex >= slots.length ||
        slots[slotIndex] !== null
      ) {
        continue
      }

      slots[slotIndex] = entry.item
      usedChannelCodes.add(entry.item.channelCode)
    }

    let nextSlotIndex = 0

    for (const item of randomItems) {
      if (usedChannelCodes.has(item.channelCode)) {
        continue
      }

      while (
        nextSlotIndex < slots.length &&
        slots[nextSlotIndex] !== null
      ) {
        nextSlotIndex += 1
      }

      if (nextSlotIndex >= slots.length) {
        break
      }

      slots[nextSlotIndex] = item
      usedChannelCodes.add(item.channelCode)
    }

    return slots.filter(
      (
        item
      ): item is PlaceFeedItem => item !== null
    )
  }

  private resolveEffectiveAdSlotNo(
    row: PlaceFeedRow
  ): number {
    if (
      row.adSettingId === null ||
      row.adSlotNo === null ||
      row.adIsActive !== 1
    ) {
      return 0
    }

    if (
      row.isPlaceFeedEnabled !== 1 ||
      row.adStatus !== 'ACTIVE'
    ) {
      return 0
    }

    if (
      row.adSlotNo < 1 ||
      row.adSlotNo > MAX_LIMIT
    ) {
      return 0
    }

    if (row.adIsExpired === 1) {
      return 0
    }

    return row.adSlotNo
  }

  private shufflePlaceItems(
    items: PlaceFeedItem[]
  ): PlaceFeedItem[] {
    const nextItems =
      [...items]

    for (
      let index = nextItems.length - 1;
      index > 0;
      index -= 1
    ) {
      const swapIndex =
        Math.floor(
          Math.random() * (index + 1)
        )

      const currentItem =
        nextItems[index]

      nextItems[index] =
        nextItems[swapIndex]
      nextItems[swapIndex] = currentItem
    }

    return nextItems
  }

  // SECTION 10 : URL HELPER

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

  // SECTION 11 : NORMALIZE HELPER

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

    const normalized =
      typeof value === 'number'
        ? value
        : Number(value)

    if (
      !Number.isInteger(normalized) ||
      normalized <= 0
    ) {
      throw new BadRequestException(
        'invalid regionId'
      )
    }

    return normalized
  }

  private normalizeNullableText(
    value: unknown
  ): string | null {
    if (
      value === undefined ||
      value === null
    ) {
      return null
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        'invalid keyword'
      )
    }

    const trimmed =
      value.trim()

    return trimmed || null
  }

  private normalizeLimit(
    value: unknown
  ): number {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return DEFAULT_LIMIT
    }

    const normalized =
      typeof value === 'number'
        ? value
        : Number(value)

    if (
      !Number.isInteger(normalized) ||
      normalized <= 0
    ) {
      return DEFAULT_LIMIT
    }

    return Math.min(
      normalized,
      MAX_LIMIT
    )
  }

  private normalizeSearchScope(
    value: unknown
  ): 'ALL' | 'POST' | 'PRODUCT' {
    if (value === undefined || value === null || value === '') {
      return 'ALL'
    }

    if (typeof value !== 'string') {
      return 'ALL'
    }

    const normalized = value.trim().toUpperCase()

    if (normalized === 'POST') {
      return 'POST'
    }

    if (normalized === 'PRODUCT') {
      return 'PRODUCT'
    }

    return 'ALL'
  }

  private normalizeChannelCode(
    value: unknown
  ): string {
    if (
      value === undefined ||
      value === null
    ) {
      throw new BadRequestException(
        'invalid channelCode'
      )
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        'invalid channelCode'
      )
    }

    const trimmed =
      value.trim()

    if (!trimmed) {
      throw new BadRequestException(
        'invalid channelCode'
      )
    }

    return trimmed
  }

  private normalizePreviewLimit(
    value: unknown
  ): number {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return PREVIEW_DEFAULT_LIMIT
    }

    const normalized =
      typeof value === 'number'
        ? value
        : Number(value)

    if (
      !Number.isInteger(normalized) ||
      normalized <= 0
    ) {
      return PREVIEW_DEFAULT_LIMIT
    }

    return Math.min(
      normalized,
      PREVIEW_MAX_LIMIT
    )
  }

  private normalizeRepresentativeLimit(
    value: unknown
  ): number {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return REPRESENTATIVE_DEFAULT_LIMIT
    }

    const normalized =
      typeof value === 'number'
        ? value
        : Number(value)

    if (
      !Number.isInteger(normalized) ||
      normalized <= 0
    ) {
      return REPRESENTATIVE_DEFAULT_LIMIT
    }

    return Math.min(
      normalized,
      REPRESENTATIVE_MAX_LIMIT
    )
  }
}

// SECTION 12 : VALIDATION

/*
VALIDATION:
- ??μ뵬 ???뵬 ???맜???곗뮆??
- PLACE ??곕굡 ?袁⑸뻻 Service ??밴쉐
- 嚥≪뮄???/ ??쑬以덃뉩紐꾩뵥 ?⑤벏??READ ?닌듼?
- profiles 餓λ쵐??BUSINESS 鈺곌퀬??
- regionId 疫꿸퀣? activityRegionId / feedRegionId 筌띲끉臾?
- hero ???筌왖 ?怨쀪퐨 / avatar fallback
- profileId ?⑤벀而??臾먮뼗 ??뽰뇚
- channelCode ?⑤벀而???명??獄쏆꼹??
- distanceKm / distanceLabel?? 1筌??袁⑸뻻 null 筌ｌ꼶??
- DB ??쎄텕筌?癰궰野???곸벉
- JWT / getMe ??????곸벉
- Controller ??곸벉
*/


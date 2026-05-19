// FILE : backend/src/modules/feed/place-feed.service.ts
// ROOT : backend/src/modules/feed/place-feed.service.ts
// STATUS : CREATE MODE
// ROLE : PLACE FEED READ SERVICE
// CHANGE SUMMARY :
// - PLACE ?쇰뱶 ?꾩떆 READ ?꾩슜 Service ?앹꽦
// - 濡쒓렇??/ 鍮꾨줈洹몄씤 怨듯넻 議고쉶 援ъ“
// - profiles 湲곗? BUSINESS ?꾨줈??議고쉶
// - regionId 湲곗? activityRegionId / feedRegionId 留ㅼ묶
// - regions / industries / industry_subtypes / image_assets 湲곗〈 DB留??ъ슜
// - DB ?ㅽ궎留?蹂寃??놁쓬
// - JWT / getMe ?ъ슜 ?놁쓬
// - DB ?묎렐? Service ?대??먯꽌留??섑뻾

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
}

type PlaceFeedRow = {
  id: number
  channelCode: string
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

export type PlaceFeedItem = {
  channelCode: string
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

// SECTION 03 : CONSTANT

const DEFAULT_LIMIT =
  16

const MAX_LIMIT =
  16

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

    try {
      let rows =
        this.findPlaceRows({
          regionId,
          keyword,
          limit: FETCH_POOL_LIMIT
        })

      if (
        regionId !== null &&
        rows.length === 0
      ) {
        rows =
          this.findPlaceRows({
            regionId: null,
            keyword,
            limit: FETCH_POOL_LIMIT
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

  // SECTION 06 : DB QUERY

  private findPlaceRows(params: {
    regionId: number | null
    keyword: string | null
    limit: number
  }): PlaceFeedRow[] {
    const keyword =
      params.keyword || null

    return db.prepare(`
      SELECT
        p.id,
        p.channelCode,
        p.displayName,
        p.bio,
        p.activityRegionId,
        p.feedRegionId,

        r.name AS regionName,
        r.fullName AS regionFullName,

        i.name AS industryName,
        ist.name AS industrySubtypeName,
        CASE
          WHEN COALESCE(bhp.temporaryClosed, bhc.temporaryClosed, 0) = 1 THEN '영업종료 · 휴무'
          WHEN COALESCE(bhp.alwaysOpen, bhc.alwaysOpen, 0) = 1 THEN NULL
          WHEN strftime('%w', 'now', 'localtime') = '0' AND COALESCE(bhp.sun_isClosed, bhc.sun_isClosed, 0) = 1 THEN '영업종료 · 일요일 휴무'
          WHEN strftime('%w', 'now', 'localtime') = '1' AND COALESCE(bhp.mon_isClosed, bhc.mon_isClosed, 0) = 1 THEN '영업종료 · 월요일 휴무'
          WHEN strftime('%w', 'now', 'localtime') = '2' AND COALESCE(bhp.tue_isClosed, bhc.tue_isClosed, 0) = 1 THEN '영업종료 · 화요일 휴무'
          WHEN strftime('%w', 'now', 'localtime') = '3' AND COALESCE(bhp.wed_isClosed, bhc.wed_isClosed, 0) = 1 THEN '영업종료 · 수요일 휴무'
          WHEN strftime('%w', 'now', 'localtime') = '4' AND COALESCE(bhp.thu_isClosed, bhc.thu_isClosed, 0) = 1 THEN '영업종료 · 목요일 휴무'
          WHEN strftime('%w', 'now', 'localtime') = '5' AND COALESCE(bhp.fri_isClosed, bhc.fri_isClosed, 0) = 1 THEN '영업종료 · 금요일 휴무'
          WHEN strftime('%w', 'now', 'localtime') = '6' AND COALESCE(bhp.sat_isClosed, bhc.sat_isClosed, 0) = 1 THEN '영업종료 · 토요일 휴무'
          ELSE NULL
        END AS closedOverlayText,

        (
          SELECT ia_post.filePath
          FROM posts ps
          JOIN post_images pi
            ON pi.postId = ps.id
          JOIN image_assets ia_post
            ON ia_post.id = pi.imageAssetId
          WHERE ? IS NOT NULL
            AND ps.profileId = p.id
            AND ps.channelCode = p.channelCode
            AND ps.status = 'ACTIVE'
            AND (
              instr(lower(COALESCE(ps.title, '')), lower(?)) > 0
              OR instr(lower(COALESCE(ps.content, '')), lower(?)) > 0
            )
            AND (
              ia_post.isActive = 1
              OR ia_post.isActive IS NULL
            )
          ORDER BY
            ps.updatedAt DESC,
            ps.createdAt DESC,
            ps.id DESC,
            pi.sortOrder ASC,
            pi.id ASC
          LIMIT 1
        ) AS keywordPostImageFilePath,

        (
          SELECT ps.title
          FROM posts ps
          WHERE ? IS NOT NULL
            AND ps.profileId = p.id
            AND ps.channelCode = p.channelCode
            AND ps.status = 'ACTIVE'
            AND (
              instr(lower(COALESCE(ps.title, '')), lower(?)) > 0
              OR instr(lower(COALESCE(ps.content, '')), lower(?)) > 0
            )
          ORDER BY
            ps.updatedAt DESC,
            ps.createdAt DESC,
            ps.id DESC
          LIMIT 1
        ) AS keywordPostTitle,

        (
          SELECT ps.priceAmount
          FROM posts ps
          WHERE ? IS NOT NULL
            AND ps.profileId = p.id
            AND ps.channelCode = p.channelCode
            AND ps.status = 'ACTIVE'
            AND (
              instr(lower(COALESCE(ps.title, '')), lower(?)) > 0
              OR instr(lower(COALESCE(ps.content, '')), lower(?)) > 0
            )
          ORDER BY
            ps.updatedAt DESC,
            ps.createdAt DESC,
            ps.id DESC
          LIMIT 1
        ) AS keywordPostPriceAmount,

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
            FROM posts ps
            WHERE ps.profileId = p.id
              AND ps.channelCode = p.channelCode
              AND ps.status = 'ACTIVE'
              AND (
                instr(lower(COALESCE(ps.title, '')), lower(?)) > 0
                OR instr(lower(COALESCE(ps.content, '')), lower(?)) > 0
              )
          )
        )
      ORDER BY
        p.updatedAt DESC,
        p.createdAt DESC,
        p.id DESC
      LIMIT ?
    `).all(
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      params.regionId,
      params.regionId,
      params.regionId,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,

      params.limit
    ) as PlaceFeedRow[]
  }

  // SECTION 07 : MAPPER

  private mapPlaceRowToItem(
    row: PlaceFeedRow,
    effectiveAdSlotNo: number = 0
  ): PlaceFeedItem {
    return {
      channelCode: row.channelCode,
      displayName: row.displayName || '이름 없음',
      bio: row.bio || '',
      imageUrl:
        this.buildMediaUrl(
          row.keywordPostImageFilePath ||
          row.heroFilePath ||
          row.avatarFilePath
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

  // SECTION 08 : URL HELPER

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

  // SECTION 09 : NORMALIZE HELPER

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
}

// SECTION 10 : VALIDATION

/*
VALIDATION:
- ?⑥씪 ?뚯씪 ?듭퐫??異쒕젰
- PLACE ?쇰뱶 ?꾩떆 Service ?앹꽦
- 濡쒓렇??/ 鍮꾨줈洹몄씤 怨듯넻 READ 援ъ“
- profiles 以묒떖 BUSINESS 議고쉶
- regionId 湲곗? activityRegionId / feedRegionId 留ㅼ묶
- hero ?대?吏 ?곗꽑 / avatar fallback
- profileId 怨듦컻 ?묐떟 ?쒖쇅
- channelCode 怨듦컻 ?앸퀎??諛섑솚
- distanceKm / distanceLabel? 1李??꾩떆 null 泥섎━
- DB ?ㅽ궎留?蹂寃??놁쓬
- JWT / getMe ?ъ슜 ?놁쓬
- Controller ?놁쓬
*/

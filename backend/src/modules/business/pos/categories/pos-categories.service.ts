// FILE : backend/src/modules/business/pos/categories/pos-categories.service.ts
// ROOT : backend/src/modules/business/pos/categories/pos-categories.service.ts
// STATUS : NEW
// ROLE : BUSINESS POS CATEGORY SERVICE
// CHANGE SUMMARY :
// - /api/business/pos/categories 조회/일괄 저장
// - profileId + channelCode 단일 귀속 검증
// - 기본 카테고리 ensure

import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'

import db from '../../../../config/database'

import type {
  PosProductCategoriesResponse,
  PosProductCategoryCode,
  PosProductCategoryRow,
  SavePosProductCategoriesRequest,
  SavePosProductCategoryInput
} from './pos-categories.types'

type JwtUser = {
  profileId?: number
  profileType?: 'GENERAL' | 'BUSINESS'
  channelCode?: string
}

type BusinessProfileRow = {
  id: number
  channelCode: string
}

type NormalizedAgePolicy = {
  ageRestrictionType: string | null
  requiresAdultVerification: 0 | 1
  restrictedOrderChannel: string | null
}

const DEFAULT_POS_CATEGORIES: Array<{
  categoryCode: PosProductCategoryCode
  categoryName: string
  sortOrder: number
  isActive: 0 | 1
  isDefault: 0 | 1
  isDeletable: 0 | 1
  ageRestrictionType: string | null
  requiresAdultVerification: 0 | 1
  restrictedOrderChannel: string | null
}> = [
  {
    categoryCode: 'MAIN',
    categoryName: '메인 메뉴',
    sortOrder: 1,
    isActive: 1,
    isDefault: 1,
    isDeletable: 0,
    ageRestrictionType: null,
    requiresAdultVerification: 0,
    restrictedOrderChannel: null
  },
  {
    categoryCode: 'SUB',
    categoryName: '서브 메뉴',
    sortOrder: 2,
    isActive: 1,
    isDefault: 1,
    isDeletable: 1,
    ageRestrictionType: null,
    requiresAdultVerification: 0,
    restrictedOrderChannel: null
  },
  {
    categoryCode: 'DRINK',
    categoryName: '음료',
    sortOrder: 3,
    isActive: 1,
    isDefault: 1,
    isDeletable: 1,
    ageRestrictionType: null,
    requiresAdultVerification: 0,
    restrictedOrderChannel: null
  },
  {
    categoryCode: 'SIDE',
    categoryName: '사이드',
    sortOrder: 4,
    isActive: 1,
    isDefault: 1,
    isDeletable: 1,
    ageRestrictionType: null,
    requiresAdultVerification: 0,
    restrictedOrderChannel: null
  },
  {
    categoryCode: 'ALCOHOL',
    categoryName: '주류',
    sortOrder: 5,
    isActive: 1,
    isDefault: 1,
    isDeletable: 1,
    ageRestrictionType: 'ADULT_19',
    requiresAdultVerification: 1,
    restrictedOrderChannel: 'QR_ORDER'
  }
]

@Injectable()
export class PosCategoriesService {

  private normalizeFlag(value: boolean | number | undefined, fallback: 0 | 1): 0 | 1 {
    if (value === undefined || value === null) {
      return fallback
    }

    return value ? 1 : 0
  }

  private normalizeCode(code: string): string {
    const normalized = String(code || '').trim().toUpperCase()
    if (!normalized) {
      return 'CUSTOM'
    }

    const allowed = new Set(['MAIN', 'SUB', 'DRINK', 'SIDE', 'ALCOHOL', 'CUSTOM'])
    if (!allowed.has(normalized)) {
      if (/^CUSTOM[0-9]+$/.test(normalized)) {
        return normalized
      }

      return 'CUSTOM'
    }

    return normalized
  }

  private validateSortOrder(value: number): number {
    if (!Number.isFinite(value)) {
      throw new BadRequestException('INVALID_SORT_ORDER')
    }

    return Math.trunc(value)
  }

  private normalizeAgePolicy(
    categoryCode: string,
    rawAgeRestrictionType?: string | null,
    rawRequiresAdultVerification?: boolean | number,
    rawRestrictedOrderChannel?: string | null
  ): NormalizedAgePolicy {
    const normalizedCode = this.normalizeCode(categoryCode)

    if (normalizedCode === 'ALCOHOL') {
      return {
        ageRestrictionType: 'ADULT_19',
        requiresAdultVerification: 1,
        restrictedOrderChannel: 'QR_ORDER'
      }
    }

    const inputAgeRestrictionType = String(rawAgeRestrictionType || '')
      .trim()
      .toUpperCase()
    const inputRestrictedOrderChannel = String(rawRestrictedOrderChannel || '')
      .trim()
      .toUpperCase()

    const defaultPolicy =
      normalizedCode === 'ALCOHOL'
        ? {
            ageRestrictionType: 'ADULT_19' as const,
            requiresAdultVerification: 1 as const,
            restrictedOrderChannel: 'QR_ORDER' as const
          }
        : {
            ageRestrictionType: null,
            requiresAdultVerification: 0 as const,
            restrictedOrderChannel: null
          }

    const requiresAdultVerification = this.normalizeFlag(
      rawRequiresAdultVerification,
      defaultPolicy.requiresAdultVerification
    )

    let ageRestrictionType =
      inputAgeRestrictionType.length > 0
        ? inputAgeRestrictionType
        : defaultPolicy.ageRestrictionType

    if (requiresAdultVerification === 0) {
      ageRestrictionType = null
    }

    let restrictedOrderChannel =
      inputRestrictedOrderChannel.length > 0
        ? inputRestrictedOrderChannel
        : defaultPolicy.restrictedOrderChannel

    if (restrictedOrderChannel === 'NONE') {
      restrictedOrderChannel = null
    }

    if (requiresAdultVerification === 0) {
      restrictedOrderChannel = null
    }

    return {
      ageRestrictionType,
      requiresAdultVerification,
      restrictedOrderChannel
    }
  }

  private resolveProfileIdentity(
    user: JwtUser,
    bodyProfileId?: number,
    bodyChannelCode?: string
  ): BusinessProfileRow {
    const profileId = Number(bodyProfileId ?? user?.profileId ?? 0)
    const channelCode = String(bodyChannelCode ?? user?.channelCode ?? '').trim()

    if (!profileId || !channelCode) {
      throw new BadRequestException('PROFILE_IDENTITY_REQUIRED')
    }

    if (user?.profileType && user.profileType !== 'BUSINESS') {
      throw new UnauthorizedException('BUSINESS_PROFILE_REQUIRED')
    }

    const profile = db.prepare(`
      SELECT
        id,
        channelCode
      FROM profiles
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId, channelCode) as BusinessProfileRow | undefined

    if (!profile) {
      throw new UnauthorizedException('PROFILE_NOT_FOUND')
    }

    return profile
  }

  private listCategories(profileId: number, channelCode: string): PosProductCategoryRow[] {
    return db.prepare(`
      SELECT
        id,
        profileId,
        channelCode,
        categoryCode,
        categoryName,
        sortOrder,
        isActive,
        isDefault,
        isDeletable,
        ageRestrictionType,
        requiresAdultVerification,
        restrictedOrderChannel,
        createdAt,
        updatedAt
      FROM pos_product_categories
      WHERE profileId = ?
        AND channelCode = ?
      ORDER BY sortOrder ASC, id ASC
    `).all(profileId, channelCode) as PosProductCategoryRow[]
  }

  private ensureDefaultCategories(profileId: number, channelCode: string): void {
    const upsertDefault = db.prepare(`
      INSERT INTO pos_product_categories(
        profileId,
        channelCode,
        categoryCode,
        categoryName,
        sortOrder,
        isActive,
        isDefault,
        isDeletable,
        ageRestrictionType,
        requiresAdultVerification,
        restrictedOrderChannel,
        createdAt,
        updatedAt
      )
      VALUES(
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT(channelCode, categoryCode)
      DO UPDATE SET
        categoryName = excluded.categoryName,
        sortOrder = excluded.sortOrder,
        isDefault = excluded.isDefault,
        isDeletable = excluded.isDeletable,
        ageRestrictionType = CASE
          WHEN excluded.categoryCode = 'ALCOHOL' THEN 'ADULT_19'
          ELSE excluded.ageRestrictionType
        END,
        requiresAdultVerification = CASE
          WHEN excluded.categoryCode = 'ALCOHOL' THEN 1
          ELSE excluded.requiresAdultVerification
        END,
        restrictedOrderChannel = CASE
          WHEN excluded.categoryCode = 'ALCOHOL' THEN 'QR_ORDER'
          ELSE excluded.restrictedOrderChannel
        END,
        updatedAt = CURRENT_TIMESTAMP
      WHERE profileId = excluded.profileId
    `)

    const tx = db.transaction(() => {
      for (const category of DEFAULT_POS_CATEGORIES) {
        upsertDefault.run(
          profileId,
          channelCode,
          category.categoryCode,
          category.categoryName,
          category.sortOrder,
          category.isActive,
          category.isDefault,
          category.isDeletable,
          category.ageRestrictionType,
          category.requiresAdultVerification,
          category.restrictedOrderChannel
        )
      }
    })

    tx()
  }

  async getCategories(user: JwtUser): Promise<PosProductCategoriesResponse> {
    const profile = this.resolveProfileIdentity(user)

    this.ensureDefaultCategories(profile.id, profile.channelCode)

    const categories = this.listCategories(profile.id, profile.channelCode)

    return {
      success: true,
      categories
    }
  }

  async saveCategories(
    user: JwtUser,
    payload: SavePosProductCategoriesRequest
  ): Promise<PosProductCategoriesResponse> {
    if (!payload || !Array.isArray(payload.categories)) {
      throw new BadRequestException('INVALID_CATEGORIES_PAYLOAD')
    }

    const profile = this.resolveProfileIdentity(
      user,
      payload.profileId,
      payload.channelCode
    )

    this.ensureDefaultCategories(profile.id, profile.channelCode)

    const inputCategories = payload.categories

    for (const item of inputCategories) {
      if (!item || typeof item !== 'object') {
        throw new BadRequestException('INVALID_CATEGORY_ITEM')
      }

      const categoryName = String(item.categoryName || '').trim()
      if (!categoryName) {
        throw new BadRequestException('CATEGORY_NAME_REQUIRED')
      }

      this.validateSortOrder(Number(item.sortOrder))
    }

    const now = new Date().toISOString()

    const upsertCategory = db.prepare(`
      INSERT INTO pos_product_categories(
        profileId,
        channelCode,
        categoryCode,
        categoryName,
        sortOrder,
        isActive,
        isDefault,
        isDeletable,
        ageRestrictionType,
        requiresAdultVerification,
        restrictedOrderChannel,
        createdAt,
        updatedAt
      )
      VALUES(
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?
      )
      ON CONFLICT(channelCode, categoryCode)
      DO UPDATE SET
        categoryName = excluded.categoryName,
        sortOrder = excluded.sortOrder,
        isActive = excluded.isActive,
        isDefault = excluded.isDefault,
        isDeletable = excluded.isDeletable,
        ageRestrictionType = excluded.ageRestrictionType,
        requiresAdultVerification = excluded.requiresAdultVerification,
        restrictedOrderChannel = excluded.restrictedOrderChannel,
        updatedAt = excluded.updatedAt
      WHERE profileId = excluded.profileId
    `)

    const updateInactiveByCode = db.prepare(`
      UPDATE pos_product_categories
      SET isActive = 0,
          updatedAt = ?
      WHERE profileId = ?
        AND channelCode = ?
        AND categoryCode = ?
    `)

    const tx = db.transaction(() => {
      const requestedCodeSet = new Set<string>()

      for (const rawItem of inputCategories) {
        const item = rawItem as SavePosProductCategoryInput
        const normalizedCode = this.normalizeCode(item.categoryCode)
        const categoryName = String(item.categoryName || '').trim()

        const normalizedSortOrder = this.validateSortOrder(Number(item.sortOrder))
        const normalizedIsActive = this.normalizeFlag(item.isActive, 1)

        let normalizedIsDefault = this.normalizeFlag(item.isDefault, 0)
        let normalizedIsDeletable = this.normalizeFlag(item.isDeletable, 1)
        const normalizedAgePolicy = this.normalizeAgePolicy(
          normalizedCode,
          item.ageRestrictionType,
          item.requiresAdultVerification,
          item.restrictedOrderChannel
        )

        if (normalizedCode === 'MAIN') {
          normalizedIsDefault = 1
          normalizedIsDeletable = 0
        }

        if (['SUB', 'DRINK', 'SIDE', 'ALCOHOL'].includes(normalizedCode)) {
          normalizedIsDefault = 1
        }

        requestedCodeSet.add(normalizedCode)

        upsertCategory.run(
          profile.id,
          profile.channelCode,
          normalizedCode,
          categoryName,
          normalizedSortOrder,
          normalizedIsActive,
          normalizedIsDefault,
          normalizedIsDeletable,
          normalizedAgePolicy.ageRestrictionType,
          normalizedAgePolicy.requiresAdultVerification,
          normalizedAgePolicy.restrictedOrderChannel,
          now
        )
      }

      for (const required of DEFAULT_POS_CATEGORIES) {
        if (requestedCodeSet.has(required.categoryCode)) {
          continue
        }

        updateInactiveByCode.run(
          now,
          profile.id,
          profile.channelCode,
          required.categoryCode
        )
      }

      const deactivateMissingCustom = db.prepare(`
        UPDATE pos_product_categories
        SET isActive = 0,
            updatedAt = ?
        WHERE profileId = ?
          AND channelCode = ?
          AND categoryCode NOT IN (${Array.from(requestedCodeSet)
            .map(() => '?')
            .join(',') || "'__NONE__'"})
      `)

      deactivateMissingCustom.run(
        now,
        profile.id,
        profile.channelCode,
        ...Array.from(requestedCodeSet)
      )
    })

    tx()

    const categories = this.listCategories(profile.id, profile.channelCode)

    return {
      success: true,
      categories
    }
  }
}

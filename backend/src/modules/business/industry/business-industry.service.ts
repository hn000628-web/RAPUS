// FILE : backend/src/modules/business/industry/business-industry.service.ts
// ROOT : backend/src/modules/business/industry/business-industry.service.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS INDUSTRY / BUSINESS TYPE SETTINGS SERVICE
// CHANGE SUMMARY :
// - BUSINESS 업종설정 전용 service 유지
// - business_types 조회 / 현재 비즈니스 타입 조회 / 비즈니스 타입 저장 로직 추가
// - profiles.businessTypeId / businessTypeCode 저장 구조 추가
// - GENERAL = NULL / BUSINESS = NORMAL | STORE | SHOPPING_MALL | FREELANCER | MOBILE_BIZ 구조 유지
// - profileId + channelCode + BUSINESS 컨텍스트 동시 검증 유지
// - industries / industry_subtypes 기준 검색 / 조회 / 저장 로직 유지
// - profiles.primaryIndustry* 칼럼 저장 구조 유지
// - controller → service → db 구조 유지

// SECTION 01 : IMPORT

import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'

import db from '../../../config/database'

// SECTION 02 : TYPE

type BusinessProfileContextRow = {
  id: number
  channelCode: string
  profileType: 'BUSINESS'
  businessTypeId: number | null
  businessTypeCode: string | null
  primaryIndustryId: number | null
  primaryIndustrySubtypeId: number | null
  primaryIndustryCode: string | null
  primaryIndustrySubtypeCode: string | null
}

type BusinessTypeRow = {
  id: number
  code: BusinessTypeCode
  name: string
  description: string | null
  sortOrder: number | null
}

type IndustryRow = {
  id: number
  code: string
  name: string
  description: string | null
  sortOrder: number | null
}

type IndustrySubtypeRow = {
  id: number
  industryId: number
  industryCode: string
  code: string
  name: string | null
  nameEn: string | null
  nameKo: string | null
  searchKeywords: string | null
  sortOrder: number | null
}

type CurrentBusinessIndustryPayload = {
  ok: true
  profileId: number
  channelCode: string
  current: {
    businessTypeId: number | null
    businessTypeCode: string | null
    businessTypeName: string | null
    industryId: number | null
    industryCode: string | null
    industryName: string | null
    industrySubtypeId: number | null
    industrySubtypeCode: string | null
    industrySubtypeName: string | null
  }
}

type BusinessTypeItem = {
  businessTypeId: number
  businessTypeCode: BusinessTypeCode
  businessTypeName: string
  description: string | null
  sortOrder: number
}

type BusinessTypeListPayload = {
  ok: true
  items: BusinessTypeItem[]
}

type CurrentBusinessTypePayload = {
  ok: true
  profileId: number
  channelCode: string
  current: {
    businessTypeId: number | null
    businessTypeCode: string | null
    businessTypeName: string | null
    description: string | null
  }
}

type BusinessIndustrySearchItem = {
  industryId: number
  industryCode: string
  industryName: string
  description: string | null
  sortOrder: number
}

type BusinessIndustrySearchPayload = {
  ok: true
  keyword: string
  items: BusinessIndustrySearchItem[]
}

type BusinessIndustrySubtypeItem = {
  subtypeId: number
  subtypeCode: string
  subtypeName: string | null
  subtypeNameEn: string | null
  subtypeNameKo: string | null
  searchKeywords: string | null
  sortOrder: number
}

type BusinessIndustrySubtypePayload = {
  ok: true
  industryCode: string
  industryId: number
  industryName: string
  items: BusinessIndustrySubtypeItem[]
}

type UpdateBusinessIndustryParams = {
  profileId: number
  channelCode: string
  industryCode: string
  industrySubtypeCode?: string | null
}

type UpdateBusinessIndustryPayload = {
  ok: true
  profileId: number
  channelCode: string
  industryId: number
  industryCode: string
  industrySubtypeId: number | null
  industrySubtypeCode: string | null
}

type UpdateBusinessTypeParams = {
  profileId: number
  channelCode: string
  businessTypeCode: string
}

type UpdateBusinessTypePayload = {
  ok: true
  profileId: number
  channelCode: string
  businessTypeId: number
  businessTypeCode: BusinessTypeCode
}

type BusinessTypeCode =
  | 'NORMAL'
  | 'STORE'
  | 'SHOPPING_MALL'
  | 'FREELANCER'
  | 'MOBILE_BIZ'

// SECTION 03 : SERVICE

@Injectable()
export class BusinessIndustryService {
  // SECTION 04 : NORMALIZE

  private normalizeRequiredProfileId(
    profileId: number
  ): number {
    const normalizedProfileId =
      Number(profileId)

    if (
      !Number.isInteger(normalizedProfileId) ||
      normalizedProfileId <= 0
    ) {
      throw new BadRequestException('profileId invalid')
    }

    return normalizedProfileId
  }

  private normalizeRequiredChannelCode(
    channelCode: string
  ): string {
    if (typeof channelCode !== 'string') {
      throw new BadRequestException('channelCode missing')
    }

    const normalizedChannelCode =
      channelCode.trim()

    if (!normalizedChannelCode) {
      throw new BadRequestException('channelCode missing')
    }

    return normalizedChannelCode
  }

  private normalizeRequiredBusinessTypeCode(
    businessTypeCode: string
  ): BusinessTypeCode {
    if (typeof businessTypeCode !== 'string') {
      throw new BadRequestException('businessTypeCode missing')
    }

    const normalizedBusinessTypeCode =
      businessTypeCode.trim().toUpperCase()

    if (
      normalizedBusinessTypeCode !== 'NORMAL' &&
      normalizedBusinessTypeCode !== 'STORE' &&
      normalizedBusinessTypeCode !== 'SHOPPING_MALL' &&
      normalizedBusinessTypeCode !== 'FREELANCER' &&
      normalizedBusinessTypeCode !== 'MOBILE_BIZ'
    ) {
      throw new BadRequestException('businessTypeCode invalid')
    }

    return normalizedBusinessTypeCode
  }

  private normalizeRequiredIndustryCode(
    industryCode: string
  ): string {
    if (typeof industryCode !== 'string') {
      throw new BadRequestException('industryCode missing')
    }

    const normalizedIndustryCode =
      industryCode.trim().toUpperCase()

    if (!normalizedIndustryCode) {
      throw new BadRequestException('industryCode missing')
    }

    return normalizedIndustryCode
  }

  private normalizeOptionalIndustrySubtypeCode(
    industrySubtypeCode?: string | null
  ): string | null {
    if (typeof industrySubtypeCode !== 'string') {
      return null
    }

    const normalizedIndustrySubtypeCode =
      industrySubtypeCode.trim().toUpperCase()

    if (!normalizedIndustrySubtypeCode) {
      return null
    }

    return normalizedIndustrySubtypeCode
  }

  private normalizeSearchKeyword(
    keyword?: string
  ): string {
    if (typeof keyword !== 'string') {
      return ''
    }

    return keyword.trim()
  }

  // SECTION 05 : CONTEXT ASSERT

  private getRequiredBusinessProfileContext(
    profileId: number,
    channelCode: string
  ): BusinessProfileContextRow {
    const normalizedProfileId =
      this.normalizeRequiredProfileId(profileId)

    const normalizedChannelCode =
      this.normalizeRequiredChannelCode(channelCode)

    const row = db.prepare(`
      SELECT
        id,
        channelCode,
        profileType,
        businessTypeId,
        businessTypeCode,
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
      normalizedProfileId,
      normalizedChannelCode
    ) as BusinessProfileContextRow | undefined

    if (!row) {
      throw new NotFoundException('business profile context not found')
    }

    return row
  }

  private getRequiredBusinessProfileByChannelCode(
    channelCode: string
  ): BusinessProfileContextRow {
    const normalizedChannelCode =
      this.normalizeRequiredChannelCode(channelCode)

    const row = db.prepare(`
      SELECT
        id,
        channelCode,
        profileType,
        businessTypeId,
        businessTypeCode,
        primaryIndustryId,
        primaryIndustrySubtypeId,
        primaryIndustryCode,
        primaryIndustrySubtypeCode
      FROM profiles
      WHERE channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(
      normalizedChannelCode
    ) as BusinessProfileContextRow | undefined

    if (!row) {
      throw new NotFoundException('business profile not found')
    }

    return row
  }

  private getRequiredBusinessTypeByCode(
    businessTypeCode: string
  ): BusinessTypeRow {
    const normalizedBusinessTypeCode =
      this.normalizeRequiredBusinessTypeCode(
        businessTypeCode
      )

    const row = db.prepare(`
      SELECT
        id,
        code,
        name,
        description,
        sortOrder
      FROM business_types
      WHERE code = ?
        AND COALESCE(isActive, 1) = 1
      LIMIT 1
    `).get(
      normalizedBusinessTypeCode
    ) as BusinessTypeRow | undefined

    if (!row) {
      throw new NotFoundException('business type not found')
    }

    return row
  }

  private getOptionalBusinessTypeByProfile(
    profile: BusinessProfileContextRow
  ): BusinessTypeRow | null {
    if (!profile.businessTypeId && !profile.businessTypeCode) {
      return null
    }

    const row = db.prepare(`
      SELECT
        id,
        code,
        name,
        description,
        sortOrder
      FROM business_types
      WHERE (
          id = ?
          OR code = ?
        )
        AND COALESCE(isActive, 1) = 1
      LIMIT 1
    `).get(
      profile.businessTypeId,
      profile.businessTypeCode
    ) as BusinessTypeRow | undefined

    return row ?? null
  }

  private getRequiredIndustryByCode(
    industryCode: string
  ): IndustryRow {
    const normalizedIndustryCode =
      this.normalizeRequiredIndustryCode(industryCode)

    const row = db.prepare(`
      SELECT
        id,
        code,
        name,
        description,
        sortOrder
      FROM industries
      WHERE code = ?
        AND COALESCE(isActive, 1) = 1
      LIMIT 1
    `).get(
      normalizedIndustryCode
    ) as IndustryRow | undefined

    if (!row) {
      throw new NotFoundException('industry not found')
    }

    return row
  }

  private getOptionalIndustrySubtypeByCode(
    industrySubtypeCode?: string | null
  ): IndustrySubtypeRow | null {
    const normalizedIndustrySubtypeCode =
      this.normalizeOptionalIndustrySubtypeCode(
        industrySubtypeCode
      )

    if (!normalizedIndustrySubtypeCode) {
      return null
    }

    const row = db.prepare(`
      SELECT
        s.id,
        s.industryId,
        i.code AS industryCode,
        s.code,
        s.name,
        s.name_en AS nameEn,
        s.name_ko AS nameKo,
        s.searchKeywords,
        s.sortOrder
      FROM industry_subtypes s
      INNER JOIN industries i
        ON i.id = s.industryId
      WHERE s.code = ?
        AND COALESCE(s.isActive, 1) = 1
      LIMIT 1
    `).get(
      normalizedIndustrySubtypeCode
    ) as IndustrySubtypeRow | undefined

    if (!row) {
      throw new NotFoundException('industry subtype not found')
    }

    return row
  }

  // SECTION 06 : BUSINESS TYPE READ

  getBusinessTypes(): BusinessTypeListPayload {
    const rows = db.prepare(`
      SELECT
        id,
        code,
        name,
        description,
        sortOrder
      FROM business_types
      WHERE COALESCE(isActive, 1) = 1
      ORDER BY sortOrder ASC, id ASC
    `).all() as BusinessTypeRow[]

    return {
      ok: true,
      items: rows.map((row) => ({
        businessTypeId: row.id,
        businessTypeCode: row.code,
        businessTypeName: row.name,
        description: row.description,
        sortOrder: Number(row.sortOrder ?? 0)
      }))
    }
  }

  getCurrentBusinessType(
    channelCode: string
  ): CurrentBusinessTypePayload {
    const profile =
      this.getRequiredBusinessProfileByChannelCode(channelCode)

    const businessType =
      this.getOptionalBusinessTypeByProfile(profile)

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      current: {
        businessTypeId:
          businessType?.id ??
          profile.businessTypeId ??
          null,
        businessTypeCode:
          businessType?.code ??
          profile.businessTypeCode ??
          null,
        businessTypeName:
          businessType?.name ??
          null,
        description:
          businessType?.description ??
          null
      }
    }
  }

  // SECTION 07 : CURRENT INDUSTRY

  getCurrentBusinessIndustry(
    channelCode: string
  ): CurrentBusinessIndustryPayload {
    const profile =
      this.getRequiredBusinessProfileByChannelCode(channelCode)

    const current = db.prepare(`
      SELECT
        p.businessTypeId AS businessTypeId,
        p.businessTypeCode AS businessTypeCode,
        bt.name AS businessTypeName,
        p.primaryIndustryId AS industryId,
        p.primaryIndustryCode AS industryCode,
        i.name AS industryName,
        p.primaryIndustrySubtypeId AS industrySubtypeId,
        p.primaryIndustrySubtypeCode AS industrySubtypeCode,
        s.name AS industrySubtypeName
      FROM profiles p
      LEFT JOIN business_types bt
        ON bt.id = p.businessTypeId
      LEFT JOIN industries i
        ON i.id = p.primaryIndustryId
      LEFT JOIN industry_subtypes s
        ON s.id = p.primaryIndustrySubtypeId
      WHERE p.id = ?
        AND p.channelCode = ?
        AND p.profileType = 'BUSINESS'
      LIMIT 1
    `).get(
      profile.id,
      profile.channelCode
    ) as {
      businessTypeId: number | null
      businessTypeCode: string | null
      businessTypeName: string | null
      industryId: number | null
      industryCode: string | null
      industryName: string | null
      industrySubtypeId: number | null
      industrySubtypeCode: string | null
      industrySubtypeName: string | null
    } | undefined

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      current: {
        businessTypeId:
          current?.businessTypeId ??
          null,
        businessTypeCode:
          current?.businessTypeCode ??
          null,
        businessTypeName:
          current?.businessTypeName ??
          null,
        industryId:
          current?.industryId ??
          null,
        industryCode:
          current?.industryCode ??
          null,
        industryName:
          current?.industryName ??
          null,
        industrySubtypeId:
          current?.industrySubtypeId ??
          null,
        industrySubtypeCode:
          current?.industrySubtypeCode ??
          null,
        industrySubtypeName:
          current?.industrySubtypeName ??
          null
      }
    }
  }

  // SECTION 08 : INDUSTRY SEARCH

  searchIndustries(
    keyword?: string
  ): BusinessIndustrySearchPayload {
    const normalizedKeyword =
      this.normalizeSearchKeyword(keyword)

    const likeKeyword =
      `%${normalizedKeyword}%`

    const rows = normalizedKeyword
      ? db.prepare(`
          SELECT
            id,
            code,
            name,
            description,
            sortOrder
          FROM industries
          WHERE COALESCE(isActive, 1) = 1
            AND (
              code LIKE ?
              OR name LIKE ?
              OR COALESCE(description, '') LIKE ?
            )
          ORDER BY sortOrder ASC, id ASC
          LIMIT 30
        `).all(
          likeKeyword,
          likeKeyword,
          likeKeyword
        ) as IndustryRow[]
      : db.prepare(`
          SELECT
            id,
            code,
            name,
            description,
            sortOrder
          FROM industries
          WHERE COALESCE(isActive, 1) = 1
          ORDER BY sortOrder ASC, id ASC
          LIMIT 30
        `).all() as IndustryRow[]

    return {
      ok: true,
      keyword: normalizedKeyword,
      items: rows.map((row) => ({
        industryId: row.id,
        industryCode: row.code,
        industryName: row.name,
        description: row.description,
        sortOrder: Number(row.sortOrder ?? 0)
      }))
    }
  }

  // SECTION 09 : INDUSTRY SUBTYPES

  getIndustrySubtypesByIndustryCode(
    industryCode: string
  ): BusinessIndustrySubtypePayload {
    const industry =
      this.getRequiredIndustryByCode(industryCode)

    const rows = db.prepare(`
      SELECT
        s.id,
        s.industryId,
        i.code AS industryCode,
        s.code,
        s.name,
        s.name_en AS nameEn,
        s.name_ko AS nameKo,
        s.searchKeywords,
        s.sortOrder
      FROM industry_subtypes s
      INNER JOIN industries i
        ON i.id = s.industryId
      WHERE s.industryId = ?
        AND COALESCE(s.isActive, 1) = 1
      ORDER BY s.sortOrder ASC, s.id ASC
    `).all(
      industry.id
    ) as IndustrySubtypeRow[]

    return {
      ok: true,
      industryCode: industry.code,
      industryId: industry.id,
      industryName: industry.name,
      items: rows.map((row) => ({
        subtypeId: row.id,
        subtypeCode: row.code,
        subtypeName: row.name,
        subtypeNameEn: row.nameEn,
        subtypeNameKo: row.nameKo,
        searchKeywords: row.searchKeywords,
        sortOrder: Number(row.sortOrder ?? 0)
      }))
    }
  }

  // SECTION 10 : UPDATE BUSINESS TYPE

  updateBusinessType(
    params: UpdateBusinessTypeParams
  ): UpdateBusinessTypePayload {
    const profile =
      this.getRequiredBusinessProfileContext(
        params.profileId,
        params.channelCode
      )

    const businessType =
      this.getRequiredBusinessTypeByCode(
        params.businessTypeCode
      )

    db.prepare(`
      UPDATE profiles
      SET
        businessTypeId = ?,
        businessTypeCode = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
    `).run(
      businessType.id,
      businessType.code,
      profile.id,
      profile.channelCode
    )

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      businessTypeId: businessType.id,
      businessTypeCode: businessType.code
    }
  }

  // SECTION 11 : UPDATE INDUSTRY

  updateBusinessIndustry(
    params: UpdateBusinessIndustryParams
  ): UpdateBusinessIndustryPayload {
    const profile =
      this.getRequiredBusinessProfileContext(
        params.profileId,
        params.channelCode
      )

    const industry =
      this.getRequiredIndustryByCode(
        params.industryCode
      )

    const subtype =
      this.getOptionalIndustrySubtypeByCode(
        params.industrySubtypeCode
      )

    if (
      subtype &&
      subtype.industryId !== industry.id
    ) {
      throw new BadRequestException(
        'industry subtype mismatch'
      )
    }

    db.prepare(`
      UPDATE profiles
      SET
        primaryIndustryId = ?,
        primaryIndustrySubtypeId = ?,
        primaryIndustryCode = ?,
        primaryIndustrySubtypeCode = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
    `).run(
      industry.id,
      subtype?.id ?? null,
      industry.code,
      subtype?.code ?? null,
      profile.id,
      profile.channelCode
    )

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      industryId: industry.id,
      industryCode: industry.code,
      industrySubtypeId: subtype?.id ?? null,
      industrySubtypeCode: subtype?.code ?? null
    }
  }
}

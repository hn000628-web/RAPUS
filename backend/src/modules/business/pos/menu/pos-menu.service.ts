// FILE : backend/src/modules/business/pos/menu/pos-menu.service.ts
// ROOT : backend/src/modules/business/pos/menu/pos-menu.service.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS MENU SERVICE
// CHANGE SUMMARY :
// - POS 메뉴 / 상품 생성, 조회, 수정, 비활성화 Service 신규 생성
// - pos_products / pos_product_categories DB 연결
// - channelCode + profileId 단일 귀속 검증 적용
// - categoryId / categoryCode 기반 카테고리 소유 검증 적용
// - Controller 직접 DB 접근 없이 Service에서만 DB 접근
// - isFeatured는 현재 DB 컬럼 부재로 저장 제외

import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'

import { randomBytes } from 'crypto'
import db from '../../../../config/database'

// SECTION 02 : TYPE
type PosMenuContextInput = {
  channelCode?: string
  profileId?: number | string
}

type PosMenuCreateInput = PosMenuContextInput & {
  categoryId?: number | string | null
  categoryCode?: string | null
  productName?: string
  productDescription?: string | null
  basePrice?: number | string
  price?: number | string
  productKind?: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  saleStatus?: 'ON' | 'OFF'
  isActive?: number | boolean
  isSoldOut?: number | boolean
  isRepresentative?: number | boolean
  showOnTableOrder?: number | boolean
  allowNormalOrder?: number | boolean
  allowReservationOrder?: number | boolean
  allowDineIn?: number | boolean
  allowTakeout?: number | boolean
  allowDelivery?: number | boolean
  menuStatus?: 'ON_SALE' | 'STOPPED'
  sortOrder?: number | string
  thumbnailImageAssetId?: number | string | null
  dailySalesLimit?: number | string | null
  options?: PosMenuOptionInput[]
}

type PosMenuUpdateInput = PosMenuContextInput & {
  categoryId?: number | string | null
  categoryCode?: string | null
  productName?: string
  productDescription?: string | null
  basePrice?: number | string
  price?: number | string
  productKind?: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  saleStatus?: 'ON' | 'OFF'
  isActive?: number | boolean
  isSoldOut?: number | boolean
  isRepresentative?: number | boolean
  showOnTableOrder?: number | boolean
  allowNormalOrder?: number | boolean
  allowReservationOrder?: number | boolean
  allowDineIn?: number | boolean
  allowTakeout?: number | boolean
  allowDelivery?: number | boolean
  menuStatus?: 'ON_SALE' | 'STOPPED'
  sortOrder?: number | string
  thumbnailImageAssetId?: number | string | null
  dailySalesLimit?: number | string | null
  options?: PosMenuOptionInput[]
}

type PosMenuOptionInput = {
  title?: string
  priceText?: string
  enabled?: number | boolean
  optionValueType?: 'BASE' | 'CUSTOM'
  optionName?: string
  optionType?: 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM'
  isRequired?: number | boolean
  isMultiple?: number | boolean
  minSelectCount?: number | string
  maxSelectCount?: number | string
  sortOrder?: number | string
  values?: PosMenuOptionValueInput[]
}

type PosMenuOptionValueInput = {
  optionValueName?: string
  priceDelta?: number | string
  isDefault?: number | boolean
  isActive?: number | boolean
  optionValueType?: 'BASE' | 'CUSTOM'
  isVisible?: number | boolean
  sortOrder?: number | string
}

type PosProductRow = {
  id: number
  profileId: number
  channelCode: string
  productCode: string | null
  productType: string
  productKind: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  categoryId: number | null
  categoryCode: string | null
  categoryName: string | null
  productName: string
  productDescription: string | null
  basePrice: number
  currency: string
  isActive: number
  isSoldOut: number
  isRepresentative: number
  showOnTableOrder: number
  allowNormalOrder: number
  allowReservationOrder: number
  allowDineIn: number
  allowTakeout: number
  allowDelivery: number
  menuStatus: 'ON_SALE' | 'STOPPED'
  sortOrder: number
  dailySalesLimit: number | null
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

type PosProductOptionRow = {
  id: number
  productCode: string | null
  optionName: string
  optionType: 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM'
  isRequired: number
  isMultiple: number
  minSelectCount: number
  maxSelectCount: number
  isActive: number
  sortOrder: number
}

type PosProductOptionValueRow = {
  id: number
  optionId: number
  productCode: string | null
  optionValueName: string
  priceDelta: number
  isDefault: number
  isActive: number
  optionValueType: 'BASE' | 'CUSTOM'
  isVisible: number
  sortOrder: number
}

type PosCategoryRow = {
  id: number
  profileId: number
  channelCode: string
  categoryCode: string
  categoryName: string
  sortOrder: number
  isActive: number
  deletedAt: string | null
}

type BusinessProfileRow = {
  id: number
  channelCode: string
  profileType: string
}

type PosProductThumbnailRow = {
  imageAssetId: number
  productCode: string | null
  fileName: string
  filePath: string
  mimeType: string | null
  width: number | null
  height: number | null
}

type NormalizedCreateInput = {
  profileId: number
  channelCode: string
  categoryId: number | null
  productName: string
  productDescription: string | null
  basePrice: number
  productKind: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  isActive: number
  isSoldOut: number
  isRepresentative: number
  showOnTableOrder: number
  allowNormalOrder: number
  allowReservationOrder: number
  allowDineIn: number
  allowTakeout: number
  allowDelivery: number
  menuStatus: 'ON_SALE' | 'STOPPED'
  sortOrder: number
  thumbnailImageAssetId: number | null
  dailySalesLimit: number | null
  options: NormalizedPosMenuOptionInput[]
}

type NormalizedUpdateInput = {
  profileId: number
  channelCode: string
  categoryId?: number | null
  productName?: string
  productDescription?: string | null
  basePrice?: number
  productKind?: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  isActive?: number
  isSoldOut?: number
  isRepresentative?: number
  showOnTableOrder?: number
  allowNormalOrder?: number
  allowReservationOrder?: number
  allowDineIn?: number
  allowTakeout?: number
  allowDelivery?: number
  menuStatus?: 'ON_SALE' | 'STOPPED'
  sortOrder?: number
  thumbnailImageAssetId?: number | null
  dailySalesLimit?: number | null
  options?: NormalizedPosMenuOptionInput[]
}

type NormalizedPosMenuOptionInput = {
  optionName: string
  optionType: 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM'
  isRequired: number
  isMultiple: number
  minSelectCount: number
  maxSelectCount: number
  isActive: number
  sortOrder: number
  values: Array<{
    optionValueName: string
    priceDelta: number
    isDefault: number
    isActive: number
    optionValueType: 'BASE' | 'CUSTOM'
    isVisible: number
    sortOrder: number
  }>
}

// SECTION 03 : UTIL
function toPositiveInteger(
  value: number | string | undefined,
  fieldName: string
): number {
  const numericValue = Number(value)

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer`)
  }

  return numericValue
}

function toOptionalPositiveInteger(
  value: number | string | null | undefined,
  fieldName: string
): number | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return toPositiveInteger(
    value,
    fieldName
  )
}

function toOptionalNonNegativeInteger(
  value: number | string | null | undefined,
  fieldName: string
): number | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const numericValue = Number(value)

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    throw new BadRequestException(`${fieldName} must be a non-negative integer`)
  }

  return numericValue
}

function toNonNegativeInteger(
  value: number | string | undefined,
  fieldName: string,
  defaultValue: number
): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  const numericValue = Number(value)

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    throw new BadRequestException(`${fieldName} must be a non-negative integer`)
  }

  return numericValue
}

function toFlag(
  value: number | boolean | undefined,
  defaultValue: number
): number {
  if (value === undefined || value === null) {
    return defaultValue
  }

  if (value === true || value === 1) {
    return 1
  }

  if (value === false || value === 0) {
    return 0
  }

  throw new BadRequestException('flag value must be 0 or 1')
}

function normalizeMenuStatus(
  value: unknown
): 'ON_SALE' | 'STOPPED' | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (value === 'ON_SALE' || value === 'STOPPED') {
    return value
  }

  throw new BadRequestException('menuStatus must be ON_SALE or STOPPED')
}

function normalizeCategoryCode(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null
  }

  const upperValue = value.trim().toUpperCase()

  if (upperValue.length < 1) {
    return null
  }

  if (upperValue === 'MAIN') {
    return 'MAIN'
  }

  if (upperValue === 'MAIN_MENU') {
    return 'MAIN'
  }

  if (upperValue === 'MAIN_PRODUCT') {
    return 'MAIN'
  }

  if (upperValue === 'SUB') {
    return 'SUB'
  }

  if (upperValue === 'SUB_MENU') {
    return 'SUB'
  }

  if (upperValue === 'DRINK') {
    return 'DRINK'
  }

  if (upperValue === 'SIDE') {
    return 'SIDE'
  }

  if (upperValue === 'ALCOHOL') {
    return 'ALCOHOL'
  }

  return upperValue
}

function determineProductKind(
  categoryCode: string | null,
  productKind?: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
): 'MAIN_PRODUCT' | 'SUB_PRODUCT' {
  if (productKind === 'MAIN_PRODUCT' || productKind === 'SUB_PRODUCT') {
    return productKind
  }

  if (categoryCode === 'MAIN') {
    return 'MAIN_PRODUCT'
  }

  return 'SUB_PRODUCT'
}

function generateProductCode(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const bytes = randomBytes(7)

  return Array.from(bytes)
    .map((byte) => alphabet[byte % alphabet.length])
    .join('')
}

function isProductCodeUniqueError(error: any): boolean {
  const message = String(error?.message ?? '')

  return (
    message.includes('pos_products.channelCode, pos_products.productCode') ||
    message.includes('idx_pos_products_channel_product_code_unique')
  )
}

function isProductNameUniqueError(error: any): boolean {
  const message = String(error?.message ?? '')

  return message.includes('pos_products.profileId, pos_products.channelCode, pos_products.productName')
}

function assertProductCode(
  productCode: string | null
): string {
  if (!productCode || !/^[A-Z0-9]{7}$/.test(productCode)) {
    throw new InternalServerErrorException('productCode is invalid')
  }

  return productCode
}

function mapProductRow(
  row: PosProductRow,
  optionGroups: Array<{
    id: number
    optionName: string
    optionType: 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM'
    productCode: string | null
    isRequired: boolean
    isMultiple: boolean
    minSelectCount: number
    maxSelectCount: number
    isActive: boolean
    sortOrder: number
    values: Array<{
      id: number
      productCode: string | null
      optionValueName: string
      priceDelta: number
      isDefault: boolean
      isActive: boolean
      optionValueType: 'BASE' | 'CUSTOM'
      isVisible: boolean
      sortOrder: number
    }>
  }>,
  thumbnail: PosProductThumbnailRow | null
) {
  return {
    id: row.id,
    profileId: row.profileId,
    channelCode: row.channelCode,
    productCode: row.productCode,
    productType: row.productType,
    productKind: row.productKind,
    categoryId: row.categoryId,
    categoryCode: row.categoryCode,
    categoryName: row.categoryName,
    productName: row.productName,
    productDescription: row.productDescription,
    basePrice: row.basePrice,
    currency: row.currency,
    isActive: row.isActive === 1,
    isSoldOut: row.isSoldOut === 1,
    isRepresentative: row.isRepresentative === 1,
    showOnTableOrder: row.showOnTableOrder === 1,
    allowNormalOrder: row.allowNormalOrder === 1,
    allowReservationOrder: row.allowReservationOrder === 1,
    allowDineIn: row.allowDineIn === 1,
    allowTakeout: row.allowTakeout === 1,
    allowDelivery: row.allowDelivery === 1,
    menuStatus: row.menuStatus,
    saleStatus: row.isActive === 1 && row.isSoldOut === 0 ? 'ON' : 'OFF',
    sortOrder: row.sortOrder,
    dailySalesLimit: row.dailySalesLimit,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    options: optionGroups,
    thumbnail: thumbnail
      ? {
          imageAssetId: thumbnail.imageAssetId,
          productCode: thumbnail.productCode,
          fileName: thumbnail.fileName,
          filePath: thumbnail.filePath,
          mimeType: thumbnail.mimeType,
          width: thumbnail.width,
          height: thumbnail.height
        }
      : null
  }
}

// SECTION 04 : SERVICE
@Injectable()
export class PosMenuService {
  // SECTION 05 : CONTEXT
  private normalizeContext(
    input: PosMenuContextInput
  ) {
    const channelCode = String(input.channelCode ?? '').trim()
    const profileId = toPositiveInteger(
      input.profileId,
      'profileId'
    )

    if (!channelCode) {
      throw new BadRequestException('channelCode is required')
    }

    return {
      channelCode,
      profileId
    }
  }

  private assertBusinessProfile(
    profileId: number,
    channelCode: string
  ) {
    const row = db.prepare(`
      SELECT
        id,
        channelCode,
        profileType
      FROM profiles
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(
      profileId,
      channelCode
    ) as BusinessProfileRow | undefined

    if (!row) {
      throw new BadRequestException('business profile context is invalid')
    }

    return row
  }

  private findCategoryById(
    profileId: number,
    channelCode: string,
    categoryId: number
  ) {
    const row = db.prepare(`
      SELECT
        id,
        profileId,
        channelCode,
        categoryCode,
        categoryName,
        sortOrder,
        isActive,
        deletedAt
      FROM pos_product_categories
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND deletedAt IS NULL
      LIMIT 1
    `).get(
      categoryId,
      profileId,
      channelCode
    ) as PosCategoryRow | undefined

    if (!row) {
      throw new BadRequestException('category does not belong to this profile')
    }

    return row
  }

  private findCategoryByCode(
    profileId: number,
    channelCode: string,
    categoryCode: string
  ) {
    const row = db.prepare(`
      SELECT
        id,
        profileId,
        channelCode,
        categoryCode,
        categoryName,
        sortOrder,
        isActive,
        deletedAt
      FROM pos_product_categories
      WHERE profileId = ?
        AND channelCode = ?
        AND categoryCode = ?
        AND deletedAt IS NULL
      LIMIT 1
    `).get(
      profileId,
      channelCode,
      categoryCode
    ) as PosCategoryRow | undefined

    if (!row) {
      throw new BadRequestException('categoryCode does not belong to this profile')
    }

    return row
  }

  private resolveCategory(
    profileId: number,
    channelCode: string,
    categoryIdInput?: number | string | null,
    categoryCodeInput?: string | null
  ) {
    const categoryId = toOptionalPositiveInteger(
      categoryIdInput,
      'categoryId'
    )

    if (categoryId) {
      return this.findCategoryById(
        profileId,
        channelCode,
        categoryId
      )
    }

    const categoryCode = normalizeCategoryCode(categoryCodeInput)

    if (categoryCode) {
      return this.findCategoryByCode(
        profileId,
        channelCode,
        categoryCode
      )
    }

    return null
  }

  private getProductByIdOrThrow(
    id: number,
    profileId: number,
    channelCode: string
  ) {
    const row = db.prepare(`
      SELECT
        p.id,
        p.profileId,
        p.channelCode,
        p.productCode,
        p.productType,
        p.productKind,
        p.categoryId,
        c.categoryCode,
        c.categoryName,
        p.productName,
        p.productDescription,
        p.basePrice,
        p.currency,
        p.isActive,
        p.isSoldOut,
        p.isRepresentative,
        p.showOnTableOrder,
        p.allowNormalOrder,
        p.allowReservationOrder,
        p.allowDineIn,
        p.allowTakeout,
        p.allowDelivery,
        p.menuStatus,
        p.sortOrder,
        p.dailySalesLimit,
        p.createdAt,
        p.updatedAt,
        p.deletedAt
      FROM pos_products p
      LEFT JOIN pos_product_categories c
        ON c.id = p.categoryId
      WHERE p.id = ?
        AND p.profileId = ?
        AND p.channelCode = ?
        AND p.deletedAt IS NULL
      LIMIT 1
    `).get(
      id,
      profileId,
      channelCode
    ) as PosProductRow | undefined

    if (!row) {
      throw new NotFoundException('pos menu product not found')
    }

    return row
  }

  private normalizeOptionsInput(
    optionsInput: PosMenuOptionInput[] | undefined
  ): NormalizedPosMenuOptionInput[] {
    if (!Array.isArray(optionsInput)) {
      return []
    }

    const parsePriceText = (value: unknown): number => {
      if (typeof value === 'number') {
        return toNonNegativeInteger(value, 'priceDelta', 0)
      }

      const rawText = String(value ?? '').trim()
      if (!rawText) {
        return 0
      }

      const digitsOnly = rawText.replace(/[^\d]/g, '')
      if (!digitsOnly) {
        return 0
      }

      return toNonNegativeInteger(digitsOnly, 'priceDelta', 0)
    }

    const hasPreviewOptionShape = optionsInput.some((row) => (
      row.title !== undefined
      || row.priceText !== undefined
      || row.enabled !== undefined
      || row.optionValueType !== undefined
    ))

    if (hasPreviewOptionShape) {
      const previewValues = optionsInput
        .map((row, index) => {
          const optionValueName = String(row.title ?? '').trim()
          if (!optionValueName) {
            return null
          }

          const optionValueType =
            row.optionValueType === 'BASE' || row.optionValueType === 'CUSTOM'
              ? row.optionValueType
              : 'CUSTOM'

          return {
            optionValueName,
            priceDelta: parsePriceText(row.priceText),
            isDefault: optionValueType === 'BASE' ? 1 : 0,
            isActive: toFlag(row.enabled, 1),
            optionValueType,
            isVisible: 1,
            sortOrder: toNonNegativeInteger(index, 'optionValueSortOrder', index)
          }
        })
        .filter((row): row is {
          optionValueName: string
          priceDelta: number
          isDefault: number
          isActive: number
          optionValueType: 'BASE' | 'CUSTOM'
          isVisible: number
          sortOrder: number
        } => row !== null)

      if (previewValues.length < 1) {
        return []
      }

      return [
        {
          optionName: previewValues[0]?.optionValueName ?? '기본 옵션',
          optionType: 'CUSTOM',
          isRequired: 0,
          isMultiple: 1,
          minSelectCount: 0,
          maxSelectCount: 99,
          isActive: 1,
          sortOrder: 0,
          values: previewValues
        }
      ]
    }

    return optionsInput.map((group, groupIndex) => {
      const optionName = String(group.optionName ?? '').trim() || '기본 옵션'
      const optionType = group.optionType ?? 'CUSTOM'

      if (!['SIZE', 'TEMPERATURE', 'ADDON', 'CHOICE', 'CUSTOM'].includes(optionType)) {
        throw new BadRequestException('optionType is invalid')
      }

      const valuesInput = Array.isArray(group.values) ? group.values : []

      const values = valuesInput.map((value, valueIndex) => {
        const optionValueName = String(value.optionValueName ?? '').trim()
        if (!optionValueName) {
          throw new BadRequestException('optionValueName is required')
        }

        const optionValueType =
          value.optionValueType === 'BASE' || value.optionValueType === 'CUSTOM'
            ? value.optionValueType
            : toFlag(value.isDefault, 0) === 1
              ? 'BASE'
              : 'CUSTOM'

        return {
          optionValueName,
          priceDelta: toNonNegativeInteger(value.priceDelta, 'priceDelta', 0),
          isDefault: toFlag(value.isDefault, optionValueType === 'BASE' ? 1 : 0),
          isActive: toFlag(value.isActive, 1),
          optionValueType,
          isVisible: toFlag(value.isVisible, 1),
          sortOrder: toNonNegativeInteger(value.sortOrder, 'optionValueSortOrder', valueIndex)
        }
      })

      return {
        optionName,
        optionType: optionType as 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM',
        isRequired: toFlag(group.isRequired, 0),
        isMultiple: toFlag(group.isMultiple, 1),
        minSelectCount: toNonNegativeInteger(group.minSelectCount, 'minSelectCount', 0),
        maxSelectCount: toNonNegativeInteger(group.maxSelectCount, 'maxSelectCount', 99),
        isActive: 1,
        sortOrder: toNonNegativeInteger(group.sortOrder, 'optionSortOrder', groupIndex),
        values
      }
    })
  }

  private getOptionGroupsByProduct(
    profileId: number,
    channelCode: string,
    productId: number,
    productCode?: string | null
  ) {
    const optionRows = db.prepare(`
      SELECT
        id,
        productCode,
        optionName,
        optionType,
        isRequired,
        isMultiple,
        minSelectCount,
        maxSelectCount,
        isActive,
        sortOrder
      FROM pos_product_options
      WHERE profileId = ?
        AND channelCode = ?
        AND (
          productId = ?
          OR (
            ? IS NOT NULL
            AND productCode = ?
          )
        )
        AND deletedAt IS NULL
      ORDER BY sortOrder ASC, id ASC
    `).all(
      profileId,
      channelCode,
      productId,
      productCode ?? null,
      productCode ?? null
    ) as PosProductOptionRow[]

    if (optionRows.length < 1) {
      return []
    }

    const optionIds = optionRows.map((row) => row.id)
    const placeholders = optionIds.map(() => '?').join(', ')
    const valueRows = db.prepare(`
      SELECT
        id,
        optionId,
        productCode,
        optionValueName,
        priceDelta,
        isDefault,
        isActive,
        optionValueType,
        isVisible,
        sortOrder
      FROM pos_product_option_values
      WHERE profileId = ?
        AND channelCode = ?
        AND optionId IN (${placeholders})
        AND deletedAt IS NULL
      ORDER BY sortOrder ASC, id ASC
    `).all(profileId, channelCode, ...optionIds) as PosProductOptionValueRow[]

    const valuesByOptionId = new Map<number, PosProductOptionValueRow[]>()
    valueRows.forEach((row) => {
      const existing = valuesByOptionId.get(row.optionId) ?? []
      existing.push(row)
      valuesByOptionId.set(row.optionId, existing)
    })

    return optionRows.map((row) => ({
      id: row.id,
      productCode: row.productCode,
      optionName: row.optionName,
      optionType: row.optionType,
      isRequired: row.isRequired === 1,
      isMultiple: row.isMultiple === 1,
      minSelectCount: row.minSelectCount,
      maxSelectCount: row.maxSelectCount,
      isActive: row.isActive === 1,
      sortOrder: row.sortOrder,
      values: (valuesByOptionId.get(row.id) ?? []).map((value) => ({
        id: value.id,
        productCode: value.productCode,
        optionValueName: value.optionValueName,
        priceDelta: value.priceDelta,
        isDefault: value.isDefault === 1,
        isActive: value.isActive === 1,
        optionValueType: value.optionValueType,
        isVisible: value.isVisible === 1,
        sortOrder: value.sortOrder
      }))
    }))
  }

  private replaceProductOptions(
    profileId: number,
    channelCode: string,
    productId: number,
    productCode: string,
    optionGroups: NormalizedPosMenuOptionInput[]
  ) {
    const tx = db.transaction(() => {
      db.prepare(`
        DELETE FROM pos_product_option_values
        WHERE profileId = ?
          AND channelCode = ?
          AND optionId IN (
            SELECT id
            FROM pos_product_options
            WHERE profileId = ?
              AND channelCode = ?
              AND (
                productId = ?
                OR productCode = ?
              )
          )
      `).run(
        profileId,
        channelCode,
        profileId,
        channelCode,
        productId,
        productCode
      )

      db.prepare(`
        DELETE FROM pos_product_options
        WHERE profileId = ?
          AND channelCode = ?
          AND (
            productId = ?
            OR productCode = ?
          )
      `).run(profileId, channelCode, productId, productCode)

      if (optionGroups.length < 1) {
        return
      }

      const insertOption = db.prepare(`
        INSERT INTO pos_product_options(
          profileId,
          channelCode,
          productId,
          productCode,
          optionName,
          optionType,
          isRequired,
          isMultiple,
          minSelectCount,
          maxSelectCount,
          isActive,
          sortOrder,
          createdAt,
          updatedAt
        )
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `)

      const insertValue = db.prepare(`
        INSERT INTO pos_product_option_values(
          profileId,
          channelCode,
          optionId,
          productCode,
          optionValueName,
          priceDelta,
          isDefault,
          isActive,
          optionValueType,
          isVisible,
          sortOrder,
          createdAt,
          updatedAt
        )
        VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `)

      optionGroups.forEach((group) => {
        const optionResult = insertOption.run(
          profileId,
          channelCode,
          productId,
          productCode,
          group.optionName,
          group.optionType,
          group.isRequired,
          group.isMultiple,
          group.minSelectCount,
          group.maxSelectCount,
          group.isActive,
          group.sortOrder
        )

        const optionId = Number(optionResult.lastInsertRowid)

        group.values.forEach((value) => {
          insertValue.run(
            profileId,
            channelCode,
            optionId,
            productCode,
            value.optionValueName,
            value.priceDelta,
            value.isDefault,
            value.isActive,
            value.optionValueType,
            value.isVisible,
            value.sortOrder
          )
        })
      })
    })

    tx()
  }

  private getProductThumbnail(
    profileId: number,
    channelCode: string,
    productId: number
  ): PosProductThumbnailRow | null {
    const row = db.prepare(`
      SELECT
        t.imageAssetId,
        t.productCode,
        a.fileName,
        a.filePath,
        a.mimeType,
        a.width,
        a.height
      FROM pos_product_thumbnails t
      INNER JOIN image_assets a
        ON a.id = t.imageAssetId
      WHERE t.profileId = ?
        AND t.channelCode = ?
        AND t.productId = ?
        AND (
          t.productCode IS NULL
          OR t.productCode = (
            SELECT p.productCode
            FROM pos_products p
            WHERE p.id = t.productId
            LIMIT 1
          )
        )
        AND t.isActive = 1
      ORDER BY
        t.sortOrder ASC,
        t.id DESC
      LIMIT 1
    `).get(
      profileId,
      channelCode,
      productId
    ) as PosProductThumbnailRow | undefined

    return row ?? null
  }

  private assertPosProductThumbnailAsset(
    profileId: number,
    channelCode: string,
    imageAssetId: number
  ) {
    const row = db.prepare(`
      SELECT
        a.id
      FROM image_assets a
      INNER JOIN profiles p
        ON p.channelCode = a.channelCode
      WHERE a.id = ?
        AND a.channelCode = ?
        AND a.usageType = 'pos-product-thumbnail'
        AND COALESCE(a.isActive, 1) = 1
        AND p.id = ?
        AND p.profileType = 'BUSINESS'
      LIMIT 1
    `).get(
      imageAssetId,
      channelCode,
      profileId
    ) as { id?: number } | undefined

    if (!row?.id) {
      throw new BadRequestException('thumbnailImageAssetId is invalid')
    }
  }

  private replaceProductThumbnail(
    profileId: number,
    channelCode: string,
    productId: number,
    productCode: string,
    imageAssetId: number
  ) {
    this.assertPosProductThumbnailAsset(
      profileId,
      channelCode,
      imageAssetId
    )

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE pos_product_thumbnails
        SET
          isActive = 0,
          updatedAt = CURRENT_TIMESTAMP
        WHERE profileId = ?
          AND channelCode = ?
          AND (
            productId = ?
            OR productCode = ?
          )
          AND isActive = 1
      `).run(
        profileId,
        channelCode,
        productId,
        productCode
      )

      db.prepare(`
        INSERT INTO pos_product_thumbnails(
          profileId,
          channelCode,
          productId,
          productCode,
          imageAssetId,
          sortOrder,
          isActive,
          createdAt,
          updatedAt
        )
        VALUES(?,?,?,?,?,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `).run(
        profileId,
        channelCode,
        productId,
        productCode,
        imageAssetId
      )
    })

    tx()
  }

  // SECTION 06 : NORMALIZE
  private normalizeCreateInput(
    input: PosMenuCreateInput
  ): NormalizedCreateInput {
    const context = this.normalizeContext(input)

    this.assertBusinessProfile(
      context.profileId,
      context.channelCode
    )

    const productName = String(input.productName ?? '').trim()

    if (!productName) {
      throw new BadRequestException('productName is required')
    }

    const basePrice = toNonNegativeInteger(
      input.basePrice ?? input.price,
      'basePrice',
      0
    )

    const category = this.resolveCategory(
      context.profileId,
      context.channelCode,
      input.categoryId,
      input.categoryCode
    )

    const productKind = determineProductKind(
      category?.categoryCode ?? null,
      input.productKind
    )

    const saleStatus = input.saleStatus ?? 'ON'

    if (saleStatus !== 'ON' && saleStatus !== 'OFF') {
      throw new BadRequestException('saleStatus must be ON or OFF')
    }

    const requestedMenuStatus = normalizeMenuStatus(input.menuStatus)
    const derivedStatus =
      requestedMenuStatus ??
      (saleStatus === 'OFF' ? 'STOPPED' : 'ON_SALE')

    const isActive =
      derivedStatus === 'ON_SALE'
        ? 1
        : toFlag(input.isActive, 0)

    const isSoldOut =
      derivedStatus === 'ON_SALE'
        ? 0
        : toFlag(input.isSoldOut, 1)

    const sortOrder = toNonNegativeInteger(
      input.sortOrder,
      'sortOrder',
      0
    )

    return {
      profileId: context.profileId,
      channelCode: context.channelCode,
      categoryId: category?.id ?? null,
      productName,
      productDescription: input.productDescription?.trim() || null,
      basePrice,
      productKind,
      isActive,
      isSoldOut,
      isRepresentative: toFlag(input.isRepresentative, 0),
      showOnTableOrder: toFlag(input.showOnTableOrder, 1),
      allowNormalOrder: toFlag(input.allowNormalOrder, 1),
      allowReservationOrder: toFlag(input.allowReservationOrder, 0),
      allowDineIn: toFlag(input.allowDineIn, 1),
      allowTakeout: toFlag(input.allowTakeout, 1),
      allowDelivery: toFlag(input.allowDelivery, 1),
      menuStatus: derivedStatus,
      sortOrder,
      thumbnailImageAssetId: toOptionalPositiveInteger(
        input.thumbnailImageAssetId ?? undefined,
        'thumbnailImageAssetId'
      ) ?? null,
      dailySalesLimit: toOptionalNonNegativeInteger(
        input.dailySalesLimit,
        'dailySalesLimit'
      ),
      options: this.normalizeOptionsInput(input.options)
    }
  }

  private normalizeUpdateInput(
    input: PosMenuUpdateInput
  ): NormalizedUpdateInput {
    const context = this.normalizeContext(input)

    this.assertBusinessProfile(
      context.profileId,
      context.channelCode
    )

    const normalized: NormalizedUpdateInput = {
      profileId: context.profileId,
      channelCode: context.channelCode
    }

    if (input.productName !== undefined) {
      const productName = String(input.productName).trim()

      if (!productName) {
        throw new BadRequestException('productName is required')
      }

      normalized.productName = productName
    }

    if (input.productDescription !== undefined) {
      normalized.productDescription =
        input.productDescription?.trim() || null
    }

    if (input.basePrice !== undefined || input.price !== undefined) {
      normalized.basePrice = toNonNegativeInteger(
        input.basePrice ?? input.price,
        'basePrice',
        0
      )
    }

    if (
      input.categoryId !== undefined ||
      input.categoryCode !== undefined
    ) {
      const category = this.resolveCategory(
        context.profileId,
        context.channelCode,
        input.categoryId,
        input.categoryCode
      )

      normalized.categoryId = category?.id ?? null

      if (input.productKind === undefined) {
        normalized.productKind = determineProductKind(
          category?.categoryCode ?? null
        )
      }
    }

    if (input.productKind !== undefined) {
      normalized.productKind = determineProductKind(
        null,
        input.productKind
      )
    }

    if (input.saleStatus !== undefined) {
      if (input.saleStatus !== 'ON' && input.saleStatus !== 'OFF') {
        throw new BadRequestException('saleStatus must be ON or OFF')
      }

      if (input.saleStatus === 'ON') {
        normalized.isActive = 1
        normalized.isSoldOut = 0
        normalized.menuStatus = 'ON_SALE'
      } else {
        normalized.isActive = 0
        normalized.isSoldOut = 1
        normalized.menuStatus = 'STOPPED'
      }
    }

    if (input.isActive !== undefined) {
      normalized.isActive = toFlag(
        input.isActive,
        1
      )
    }

    if (input.isSoldOut !== undefined) {
      normalized.isSoldOut = toFlag(
        input.isSoldOut,
        0
      )
    }

    if (input.menuStatus !== undefined) {
      const menuStatus = normalizeMenuStatus(input.menuStatus)
      if (menuStatus) {
        normalized.menuStatus = menuStatus
        if (menuStatus === 'ON_SALE') {
          normalized.isActive = 1
          normalized.isSoldOut = 0
        } else {
          normalized.isActive = 0
          normalized.isSoldOut = 1
        }
      }
    }

    if (input.isRepresentative !== undefined) {
      normalized.isRepresentative = toFlag(input.isRepresentative, 0)
    }

    if (input.showOnTableOrder !== undefined) {
      normalized.showOnTableOrder = toFlag(input.showOnTableOrder, 1)
    }

    if (input.allowNormalOrder !== undefined) {
      normalized.allowNormalOrder = toFlag(input.allowNormalOrder, 1)
    }

    if (input.allowReservationOrder !== undefined) {
      normalized.allowReservationOrder = toFlag(input.allowReservationOrder, 0)
    }

    if (input.allowDineIn !== undefined) {
      normalized.allowDineIn = toFlag(input.allowDineIn, 1)
    }

    if (input.allowTakeout !== undefined) {
      normalized.allowTakeout = toFlag(input.allowTakeout, 1)
    }

    if (input.allowDelivery !== undefined) {
      normalized.allowDelivery = toFlag(input.allowDelivery, 1)
    }

    if (input.dailySalesLimit !== undefined) {
      normalized.dailySalesLimit = toOptionalNonNegativeInteger(
        input.dailySalesLimit,
        'dailySalesLimit'
      )
    }

    if (input.sortOrder !== undefined) {
      normalized.sortOrder = toNonNegativeInteger(
        input.sortOrder,
        'sortOrder',
        0
      )
    }

    if (
      input.thumbnailImageAssetId !== undefined &&
      input.thumbnailImageAssetId !== null &&
      input.thumbnailImageAssetId !== ''
    ) {
      normalized.thumbnailImageAssetId = toPositiveInteger(
        input.thumbnailImageAssetId,
        'thumbnailImageAssetId'
      )
    }

    if (input.options !== undefined) {
      normalized.options = this.normalizeOptionsInput(input.options)
    }

    return normalized
  }

  // SECTION 07 : QUERY
  findMenus(
    input: PosMenuContextInput
  ) {
    const context = this.normalizeContext(input)

    this.assertBusinessProfile(
      context.profileId,
      context.channelCode
    )

    const rows = db.prepare(`
      SELECT
        p.id,
        p.profileId,
        p.channelCode,
        p.productCode,
        p.productType,
        p.productKind,
        p.categoryId,
        c.categoryCode,
        c.categoryName,
        p.productName,
        p.productDescription,
        p.basePrice,
        p.currency,
        p.isActive,
        p.isSoldOut,
        p.isRepresentative,
        p.showOnTableOrder,
        p.allowNormalOrder,
        p.allowReservationOrder,
        p.allowDineIn,
        p.allowTakeout,
        p.allowDelivery,
        p.menuStatus,
        p.sortOrder,
        p.dailySalesLimit,
        p.createdAt,
        p.updatedAt,
        p.deletedAt
      FROM pos_products p
      LEFT JOIN pos_product_categories c
        ON c.id = p.categoryId
      WHERE p.profileId = ?
        AND p.channelCode = ?
        AND p.deletedAt IS NULL
      ORDER BY
        p.sortOrder ASC,
        p.id ASC
    `).all(
      context.profileId,
      context.channelCode
    ) as PosProductRow[]

    return {
      items: rows.map((row) =>
        mapProductRow(
          row,
          this.getOptionGroupsByProduct(
            context.profileId,
            context.channelCode,
            row.id,
            row.productCode
          ),
          this.getProductThumbnail(
            context.profileId,
            context.channelCode,
            row.id
          )
        )
      )
    }
  }

  findMenuById(
    idInput: number | string,
    input: PosMenuContextInput
  ) {
    const id = toPositiveInteger(
      idInput,
      'id'
    )

    const context = this.normalizeContext(input)

    this.assertBusinessProfile(
      context.profileId,
      context.channelCode
    )

    const row = this.getProductByIdOrThrow(
      id,
      context.profileId,
      context.channelCode
    )

    return {
      item: mapProductRow(
        row,
        this.getOptionGroupsByProduct(
          context.profileId,
          context.channelCode,
          row.id,
          row.productCode
        ),
        this.getProductThumbnail(
          context.profileId,
          context.channelCode,
          row.id
        )
      )
    }
  }

  // SECTION 08 : MUTATION
  createMenu(
    input: PosMenuCreateInput
  ) {
    const normalized = this.normalizeCreateInput(input)

    try {
      const insertProduct = db.prepare(`
        INSERT INTO pos_products(
          profileId,
          channelCode,
          productCode,
          productType,
          productKind,
          categoryId,
          productName,
          productDescription,
          basePrice,
          currency,
          isActive,
          isSoldOut,
          isRepresentative,
          showOnTableOrder,
          allowNormalOrder,
          allowReservationOrder,
          allowDineIn,
          allowTakeout,
          allowDelivery,
          menuStatus,
          sortOrder,
          dailySalesLimit,
          createdAt,
          updatedAt
        )
        VALUES(
          ?,
          ?,
          ?,
          'PRODUCT',
          ?,
          ?,
          ?,
          ?,
          ?,
          'KRW',
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
          ?,
          ?,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `)

      let result: { lastInsertRowid: number | bigint } | null = null
      let productCode = ''

      for (let attempt = 1; attempt <= 10; attempt += 1) {
        productCode = generateProductCode()

        try {
          result = insertProduct.run(
            normalized.profileId,
            normalized.channelCode,
            productCode,
            normalized.productKind,
            normalized.categoryId,
            normalized.productName,
            normalized.productDescription,
            normalized.basePrice,
            normalized.isActive,
            normalized.isSoldOut,
            normalized.isRepresentative,
            normalized.showOnTableOrder,
            normalized.allowNormalOrder,
            normalized.allowReservationOrder,
            normalized.allowDineIn,
            normalized.allowTakeout,
            normalized.allowDelivery,
            normalized.menuStatus,
            normalized.sortOrder,
            normalized.dailySalesLimit
          )
          break
        } catch (error: any) {
          if (isProductCodeUniqueError(error) && attempt < 10) {
            continue
          }

          throw error
        }
      }

      if (!result) {
        throw new InternalServerErrorException('failed to generate productCode')
      }

      this.replaceProductOptions(
        normalized.profileId,
        normalized.channelCode,
        Number(result.lastInsertRowid),
        productCode,
        normalized.options
      )

      if (normalized.thumbnailImageAssetId) {
        this.replaceProductThumbnail(
          normalized.profileId,
          normalized.channelCode,
          Number(result.lastInsertRowid),
          productCode,
          normalized.thumbnailImageAssetId
        )
      }

      const createdRow = this.getProductByIdOrThrow(
        Number(result.lastInsertRowid),
        normalized.profileId,
        normalized.channelCode
      )

      return {
        item: mapProductRow(
          createdRow,
          this.getOptionGroupsByProduct(
            normalized.profileId,
            normalized.channelCode,
            createdRow.id,
            createdRow.productCode
          ),
          this.getProductThumbnail(
            normalized.profileId,
            normalized.channelCode,
            createdRow.id
          )
        )
      }
    } catch (error: any) {
      if (
        isProductNameUniqueError(error)
      ) {
        throw new ConflictException('productName already exists in this profile')
      }

      if (isProductCodeUniqueError(error)) {
        throw new InternalServerErrorException('failed to generate productCode')
      }

      throw error
    }
  }

  updateMenu(
    idInput: number | string,
    input: PosMenuUpdateInput
  ) {
    const id = toPositiveInteger(
      idInput,
      'id'
    )

    const normalized = this.normalizeUpdateInput(input)

    const existingRow = this.getProductByIdOrThrow(
      id,
      normalized.profileId,
      normalized.channelCode
    )

    const setClauses: string[] = []
    const values: Array<string | number | null> = []

    if (normalized.categoryId !== undefined) {
      setClauses.push('categoryId = ?')
      values.push(normalized.categoryId)
    }

    if (normalized.productName !== undefined) {
      setClauses.push('productName = ?')
      values.push(normalized.productName)
    }

    if (normalized.productDescription !== undefined) {
      setClauses.push('productDescription = ?')
      values.push(normalized.productDescription)
    }

    if (normalized.basePrice !== undefined) {
      setClauses.push('basePrice = ?')
      values.push(normalized.basePrice)
    }

    if (normalized.productKind !== undefined) {
      setClauses.push('productKind = ?')
      values.push(normalized.productKind)
    }

    if (normalized.isActive !== undefined) {
      setClauses.push('isActive = ?')
      values.push(normalized.isActive)
    }

    if (normalized.isSoldOut !== undefined) {
      setClauses.push('isSoldOut = ?')
      values.push(normalized.isSoldOut)
    }

    if (normalized.isRepresentative !== undefined) {
      setClauses.push('isRepresentative = ?')
      values.push(normalized.isRepresentative)
    }

    if (normalized.showOnTableOrder !== undefined) {
      setClauses.push('showOnTableOrder = ?')
      values.push(normalized.showOnTableOrder)
    }

    if (normalized.allowNormalOrder !== undefined) {
      setClauses.push('allowNormalOrder = ?')
      values.push(normalized.allowNormalOrder)
    }

    if (normalized.allowReservationOrder !== undefined) {
      setClauses.push('allowReservationOrder = ?')
      values.push(normalized.allowReservationOrder)
    }

    if (normalized.allowDineIn !== undefined) {
      setClauses.push('allowDineIn = ?')
      values.push(normalized.allowDineIn)
    }

    if (normalized.allowTakeout !== undefined) {
      setClauses.push('allowTakeout = ?')
      values.push(normalized.allowTakeout)
    }

    if (normalized.allowDelivery !== undefined) {
      setClauses.push('allowDelivery = ?')
      values.push(normalized.allowDelivery)
    }

    if (normalized.menuStatus !== undefined) {
      setClauses.push('menuStatus = ?')
      values.push(normalized.menuStatus)
    }

    if (normalized.dailySalesLimit !== undefined) {
      setClauses.push('dailySalesLimit = ?')
      values.push(normalized.dailySalesLimit)
    }

    if (normalized.sortOrder !== undefined) {
      setClauses.push('sortOrder = ?')
      values.push(normalized.sortOrder)
    }

    if (
      setClauses.length < 1 &&
      normalized.options === undefined &&
      normalized.thumbnailImageAssetId === undefined
    ) {
      const currentRow = this.getProductByIdOrThrow(
        id,
        normalized.profileId,
        normalized.channelCode
      )

      return {
        item: mapProductRow(
          currentRow,
          this.getOptionGroupsByProduct(
            normalized.profileId,
            normalized.channelCode,
            currentRow.id,
            currentRow.productCode
          ),
          this.getProductThumbnail(
            normalized.profileId,
            normalized.channelCode,
            currentRow.id
          )
        )
      }
    }

    setClauses.push('updatedAt = CURRENT_TIMESTAMP')

    try {
      db.prepare(`
        UPDATE pos_products
        SET ${setClauses.join(', ')}
        WHERE id = ?
          AND profileId = ?
          AND channelCode = ?
          AND deletedAt IS NULL
      `).run(
        ...values,
        id,
        normalized.profileId,
        normalized.channelCode
      )

      if (normalized.options !== undefined) {
        this.replaceProductOptions(
          normalized.profileId,
          normalized.channelCode,
          id,
          assertProductCode(existingRow.productCode),
          normalized.options
        )
      }

      if (typeof normalized.thumbnailImageAssetId === 'number') {
        this.replaceProductThumbnail(
          normalized.profileId,
          normalized.channelCode,
          id,
          assertProductCode(existingRow.productCode),
          normalized.thumbnailImageAssetId
        )
      }

      const updatedRow = this.getProductByIdOrThrow(
        id,
        normalized.profileId,
        normalized.channelCode
      )

      return {
        item: mapProductRow(
          updatedRow,
          this.getOptionGroupsByProduct(
            normalized.profileId,
            normalized.channelCode,
            updatedRow.id,
            updatedRow.productCode
          ),
          this.getProductThumbnail(
            normalized.profileId,
            normalized.channelCode,
            updatedRow.id
          )
        )
      }
    } catch (error: any) {
      if (
        typeof error?.message === 'string' &&
        error.message.includes('UNIQUE')
      ) {
        throw new ConflictException('productName already exists in this profile')
      }

      throw error
    }
  }

  deactivateMenu(
    idInput: number | string,
    input: PosMenuContextInput
  ) {
    const id = toPositiveInteger(
      idInput,
      'id'
    )

    const context = this.normalizeContext(input)

    this.assertBusinessProfile(
      context.profileId,
      context.channelCode
    )

    this.getProductByIdOrThrow(
      id,
      context.profileId,
      context.channelCode
    )

    db.prepare(`
      UPDATE pos_products
      SET
        isActive = 0,
        deletedAt = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND deletedAt IS NULL
    `).run(
      id,
      context.profileId,
      context.channelCode
    )

    return {
      deleted: true
    }
  }
}

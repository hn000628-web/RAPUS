// FILE : backend/src/modules/business/pos/order-types/order-types.service.ts
// ROOT : backend/src/modules/business/pos/order-types/order-types.service.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS ORDER TYPE SETTINGS SERVICE
// CHANGE SUMMARY :
// - pos_order_type_configs 조회/저장 Service 신규 생성
// - profileId + channelCode 단일 귀속 검증
// - QR 단독 코드 차단 / QR_ORDER 고정
// - displayTitle 파생 응답 처리
// - DB 접근은 Service 내부에서만 수행

// SECTION 01 : IMPORT

import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'

import db from '../../../../config/database'

// SECTION 02 : TYPE

export type PosOrderTypeCode =
  | 'TABLE'
  | 'RESERVATION'
  | 'DELIVERY'
  | 'PICKUP'
  | 'QR_ORDER'
  | 'KIOSK'

type PosOrderTypeDefault = {
  orderTypeCode: PosOrderTypeCode
  defaultTitle: string
  description: string
  isEnabled: number
  sortOrder: number
}

type PosOrderTypeRow = {
  id: number
  profileId: number
  channelCode: string
  orderTypeCode: PosOrderTypeCode
  defaultTitle: string
  customTitle: string | null
  description: string | null
  isEnabled: number
  isFixed: number
  sortOrder: number
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

export type PosOrderTypeResponseItem = {
  code: PosOrderTypeCode
  defaultTitle: string
  customTitle: string
  displayTitle: string
  description: string
  isEnabled: boolean
  sortOrder: number
}

export type PosOrderTypeListResponse = {
  items: PosOrderTypeResponseItem[]
}

export type UpdatePosOrderTypeItem = {
  code: string
  customTitle?: string | null
  isEnabled?: boolean
  sortOrder?: number
}

export type UpdatePosOrderTypesRequest = {
  items: UpdatePosOrderTypeItem[]
}

type BusinessContext = {
  profileId: number
  channelCode: string
}

// SECTION 03 : CONSTANT

const ORDER_TYPE_CODES: PosOrderTypeCode[] = [
  'TABLE',
  'RESERVATION',
  'DELIVERY',
  'PICKUP',
  'QR_ORDER',
  'KIOSK'
]

const DEFAULT_ORDER_TYPES: PosOrderTypeDefault[] = [
  {
    orderTypeCode: 'TABLE',
    defaultTitle: '테이블 주문',
    description: '매장 내 테이블 주문을 사용합니다.',
    isEnabled: 1,
    sortOrder: 1
  },
  {
    orderTypeCode: 'RESERVATION',
    defaultTitle: '예약 주문',
    description: '예약 기반 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 2
  },
  {
    orderTypeCode: 'DELIVERY',
    defaultTitle: '배달 주문',
    description: '배달 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 3
  },
  {
    orderTypeCode: 'PICKUP',
    defaultTitle: '픽업 주문',
    description: '픽업 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 4
  },
  {
    orderTypeCode: 'QR_ORDER',
    defaultTitle: 'QR 주문',
    description: '테이블 QR 주문 접수를 사용합니다.',
    isEnabled: 1,
    sortOrder: 5
  },
  {
    orderTypeCode: 'KIOSK',
    defaultTitle: '키오스크 주문',
    description: '키오스크 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 6
  }
]

// SECTION 04 : SERVICE

@Injectable()
export class PosOrderTypesService {

  // SECTION 05 : PUBLIC METHOD

  getOrderTypes(
    profileIdInput: string | number | undefined,
    channelCodeInput: string | undefined
  ): PosOrderTypeListResponse {

    const context =
      this.resolveBusinessContext(
        profileIdInput,
        channelCodeInput
      )

    this.ensureDefaultOrderTypeConfigs(
      context
    )

    const rows =
      this.findRows(
        context
      )

    return {
      items: rows.map((row) => {
        return this.mapRowToResponseItem(row)
      })
    }

  }

  updateOrderTypes(
    profileIdInput: string | number | undefined,
    channelCodeInput: string | undefined,
    payload: UpdatePosOrderTypesRequest
  ): PosOrderTypeListResponse {

    const context =
      this.resolveBusinessContext(
        profileIdInput,
        channelCodeInput
      )

    if (!payload || !Array.isArray(payload.items)) {
      throw new BadRequestException('items array is required')
    }

    this.ensureDefaultOrderTypeConfigs(
      context
    )

    const updateStatement =
      db.prepare(`
        UPDATE pos_order_type_configs
        SET
          customTitle = ?,
          isEnabled = ?,
          sortOrder = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE profileId = ?
          AND channelCode = ?
          AND orderTypeCode = ?
          AND deletedAt IS NULL
      `)

    const transaction =
      db.transaction((items: UpdatePosOrderTypeItem[]) => {

        for (const item of items) {
          const code =
            this.normalizeOrderTypeCode(
              item.code
            )

          const currentRow =
            this.findOneRow(
              context,
              code
            )

          if (!currentRow) {
            throw new NotFoundException(`order type not found: ${code}`)
          }

          const customTitle =
            this.normalizeCustomTitle(
              item.customTitle
            )

          const isEnabled =
            typeof item.isEnabled === 'boolean'
              ? item.isEnabled ? 1 : 0
              : currentRow.isEnabled

          const sortOrder =
            this.normalizeSortOrder(
              item.sortOrder,
              currentRow.sortOrder
            )

          updateStatement.run(
            customTitle,
            isEnabled,
            sortOrder,
            context.profileId,
            context.channelCode,
            code
          )
        }

      })

    transaction(
      payload.items
    )

    const rows =
      this.findRows(
        context
      )

    return {
      items: rows.map((row) => {
        return this.mapRowToResponseItem(row)
      })
    }

  }

  // SECTION 06 : CONTEXT FUNCTION

  private resolveBusinessContext(
    profileIdInput: string | number | undefined,
    channelCodeInput: string | undefined
  ): BusinessContext {

    const profileId =
      this.normalizeProfileId(
        profileIdInput
      )

    const channelCode =
      this.normalizeChannelCode(
        channelCodeInput
      )

    const row =
      db.prepare(`
        SELECT
          id,
          channelCode
        FROM profiles
        WHERE id = ?
          AND channelCode = ?
          AND profileType = 'BUSINESS'
        LIMIT 1
      `).get(
        profileId,
        channelCode
      ) as { id?: number; channelCode?: string } | undefined

    if (!row?.id || !row?.channelCode) {
      throw new NotFoundException('business profile context not found')
    }

    return {
      profileId: row.id,
      channelCode: row.channelCode
    }

  }

  // SECTION 07 : DEFAULT DATA FUNCTION

  private ensureDefaultOrderTypeConfigs(
    context: BusinessContext
  ): void {

    const insertStatement =
      db.prepare(`
        INSERT OR IGNORE INTO pos_order_type_configs(
          profileId,
          channelCode,
          orderTypeCode,
          defaultTitle,
          customTitle,
          description,
          isEnabled,
          isFixed,
          sortOrder
        )
        VALUES(?,?,?,?,?,?,?,?,?)
      `)

    const transaction =
      db.transaction(() => {

        for (const item of DEFAULT_ORDER_TYPES) {
          insertStatement.run(
            context.profileId,
            context.channelCode,
            item.orderTypeCode,
            item.defaultTitle,
            null,
            item.description,
            item.isEnabled,
            1,
            item.sortOrder
          )
        }

      })

    transaction()

  }

  // SECTION 08 : QUERY FUNCTION

  private findRows(
    context: BusinessContext
  ): PosOrderTypeRow[] {

    return db.prepare(`
      SELECT
        id,
        profileId,
        channelCode,
        orderTypeCode,
        defaultTitle,
        customTitle,
        description,
        isEnabled,
        isFixed,
        sortOrder,
        createdAt,
        updatedAt,
        deletedAt
      FROM pos_order_type_configs
      WHERE profileId = ?
        AND channelCode = ?
        AND deletedAt IS NULL
      ORDER BY sortOrder ASC, id ASC
    `).all(
      context.profileId,
      context.channelCode
    ) as PosOrderTypeRow[]

  }

  private findOneRow(
    context: BusinessContext,
    code: PosOrderTypeCode
  ): PosOrderTypeRow | undefined {

    return db.prepare(`
      SELECT
        id,
        profileId,
        channelCode,
        orderTypeCode,
        defaultTitle,
        customTitle,
        description,
        isEnabled,
        isFixed,
        sortOrder,
        createdAt,
        updatedAt,
        deletedAt
      FROM pos_order_type_configs
      WHERE profileId = ?
        AND channelCode = ?
        AND orderTypeCode = ?
        AND deletedAt IS NULL
      LIMIT 1
    `).get(
      context.profileId,
      context.channelCode,
      code
    ) as PosOrderTypeRow | undefined

  }

  // SECTION 09 : MAPPING FUNCTION

  private mapRowToResponseItem(
    row: PosOrderTypeRow
  ): PosOrderTypeResponseItem {

    const customTitle =
      row.customTitle?.trim() ?? ''

    const displayTitle =
      customTitle.length > 0
        ? customTitle
        : row.defaultTitle

    return {
      code: row.orderTypeCode,
      defaultTitle: row.defaultTitle,
      customTitle,
      displayTitle,
      description: row.description ?? '',
      isEnabled: row.isEnabled === 1,
      sortOrder: row.sortOrder
    }

  }

  // SECTION 10 : VALIDATION FUNCTION

  private normalizeProfileId(
    value: string | number | undefined
  ): number {

    const profileId =
      typeof value === 'number'
        ? value
        : Number(value)

    if (!Number.isInteger(profileId) || profileId <= 0) {
      throw new BadRequestException('valid profileId is required')
    }

    return profileId

  }

  private normalizeChannelCode(
    value: string | undefined
  ): string {

    const channelCode =
      value?.trim() ?? ''

    if (channelCode.length !== 13) {
      throw new BadRequestException('valid channelCode is required')
    }

    return channelCode

  }

  private normalizeOrderTypeCode(
    value: string
  ): PosOrderTypeCode {

    const code =
      value?.trim() ?? ''

    if (code === 'QR') {
      throw new BadRequestException('QR is not allowed. Use QR_ORDER.')
    }

    if (!ORDER_TYPE_CODES.includes(code as PosOrderTypeCode)) {
      throw new BadRequestException(`invalid orderTypeCode: ${code}`)
    }

    return code as PosOrderTypeCode

  }

  private normalizeCustomTitle(
    value: string | null | undefined
  ): string | null {

    if (typeof value !== 'string') {
      return null
    }

    const trimmed =
      value.trim()

    if (trimmed.length === 0) {
      return null
    }

    if (trimmed.length > 24) {
      throw new BadRequestException('customTitle max length is 24')
    }

    return trimmed

  }

  private normalizeSortOrder(
    value: number | undefined,
    fallback: number
  ): number {

    if (typeof value === 'undefined') {
      return fallback
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException('sortOrder must be a positive integer')
    }

    return value

  }

}
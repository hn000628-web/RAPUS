// FILE : backend/src/modules/business/pos/cooking/cooking.service.ts
// ROOT : backend/src/modules/business/pos/cooking/cooking.service.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS COOKING RUNTIME SERVICE

import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'

import db from '../../../../config/database'
import {
  CookingPriorityLevel,
  CookingQueryDto,
  CookingStatus
} from './dto/cooking-query.dto'
import {
  CreateCookingTicketDto
} from './dto/create-cooking-ticket.dto'
import {
  UpdateCookingStatusDto
} from './dto/update-cooking-status.dto'

type BusinessProfileRow = {
  id: number
  channelCode: string
}

type CookingTicketRow = {
  id: number
  providerProfileId: number
  providerChannelCode: string
  orderId: number
  orderCode: string
  orderItemId: number
  locationId: number | null
  locationNameSnapshot: string | null
  productNameSnapshot: string
  quantity: number
  optionSummarySnapshot: string | null
  requestMemoSnapshot: string | null
  cookingStatus: CookingStatus
  priorityLevel: CookingPriorityLevel
  cookStaffCode: string | null
  cookStaffNameSnapshot: string | null
  orderedAt: string | null
  cookingStartedAt: string | null
  cookingCompletedAt: string | null
  elapsedMinutes: number | null
  isActive: number
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

type MissingCookingTicketOrderItemRow = {
  orderId: number
  orderCode: string
  orderItemId: number
  locationId: number | null
  locationNameSnapshot: string | null
  productNameSnapshot: string
  quantity: number
  optionSummarySnapshot: string | null
  orderedAt: string | null
}

type CookingTicketOrderContextRow = {
  orderId: number
  orderCode: string
  providerProfileId: number
  providerChannelCode: string
  orderSource: string
  orderFlowType: string
  locationId: number | null
  paymentStatus: string
}

export type CookingTicketResponse = {
  id: number
  profileId: number
  channelCode: string
  orderId: number
  orderCode: string
  orderItemId: number
  locationId: number | null
  locationNameSnapshot: string | null
  productNameSnapshot: string
  quantity: number
  optionSummarySnapshot: string | null
  requestMemoSnapshot: string | null
  cookingStatus: CookingStatus
  priorityLevel: CookingPriorityLevel
  cookStaffCode: string | null
  cookStaffNameSnapshot: string | null
  orderedAt: string | null
  cookingStartedAt: string | null
  cookingCompletedAt: string | null
  elapsedMinutes: number | null
  isActive: number
  createdAt: string
  updatedAt: string | null
}

export type CookingTicketListResponse = {
  tickets: CookingTicketResponse[]
}

@Injectable()
export class CookingService {
  getCookingTickets(
    query: CookingQueryDto
  ): CookingTicketListResponse {
    const profileId =
      this.normalizePositiveInteger(query.profileId, 'profileId')
    const channelCode =
      this.normalizeRequiredString(query.channelCode, 'channelCode')
    const normalizedStatus =
      this.normalizeQueryCookingStatus(query.cookingStatus)
    const isActive =
      this.normalizeActiveFilter(query.isActive)

    this.assertBusinessProfile(profileId, channelCode)
    this.syncMissingCookingTickets(profileId, channelCode)

    const rows =
      normalizedStatus === 'ALL'
        ? db.prepare(`
            SELECT
              id,
              providerProfileId,
              providerChannelCode,
              orderId,
              orderCode,
              orderItemId,
              locationId,
              locationNameSnapshot,
              productNameSnapshot,
              quantity,
              optionSummarySnapshot,
              requestMemoSnapshot,
              cookingStatus,
              priorityLevel,
              cookStaffCode,
              cookStaffNameSnapshot,
              orderedAt,
              cookingStartedAt,
              cookingCompletedAt,
              elapsedMinutes,
              isActive,
              createdAt,
              updatedAt,
              deletedAt
            FROM pos_order_cooking_tickets
            WHERE providerProfileId = ?
              AND providerChannelCode = ?
              AND isActive = ?
              AND deletedAt IS NULL
            ORDER BY createdAt ASC, id ASC
          `).all(
          profileId,
          channelCode,
          isActive
        ) as CookingTicketRow[]
        : db.prepare(`
            SELECT
              id,
              providerProfileId,
              providerChannelCode,
              orderId,
              orderCode,
              orderItemId,
              locationId,
              locationNameSnapshot,
              productNameSnapshot,
              quantity,
              optionSummarySnapshot,
              requestMemoSnapshot,
              cookingStatus,
              priorityLevel,
              cookStaffCode,
              cookStaffNameSnapshot,
              orderedAt,
              cookingStartedAt,
              cookingCompletedAt,
              elapsedMinutes,
              isActive,
              createdAt,
              updatedAt,
              deletedAt
            FROM pos_order_cooking_tickets
            WHERE providerProfileId = ?
              AND providerChannelCode = ?
              AND cookingStatus = ?
              AND isActive = ?
              AND deletedAt IS NULL
            ORDER BY createdAt ASC, id ASC
          `).all(
          profileId,
          channelCode,
          normalizedStatus,
          isActive
        ) as CookingTicketRow[]

    return {
      tickets: rows.map((row) => this.mapRowToResponse(row))
    }
  }

  private syncMissingCookingTickets(
    profileId: number,
    channelCode: string
  ): void {
    const missingRows = db.prepare(`
      SELECT
        o.id AS orderId,
        o.orderCode AS orderCode,
        i.id AS orderItemId,
        o.locationId AS locationId,
        l.locationName AS locationNameSnapshot,
        i.productNameSnapshot AS productNameSnapshot,
        i.quantity AS quantity,
        (
          SELECT group_concat(
            oo.optionValueNameSnapshot || ' x' || oo.quantity,
            ', '
          )
          FROM pos_order_item_options oo
          WHERE oo.orderItemId = i.id
        ) AS optionSummarySnapshot,
        o.createdAt AS orderedAt
      FROM pos_orders o
      INNER JOIN pos_order_items i
        ON i.orderId = o.id
      LEFT JOIN pos_locations l
        ON l.id = o.locationId
      WHERE o.providerProfileId = ?
        AND o.providerChannelCode = ?
        AND o.isActive = 1
        AND i.providerChannelCode = ?
        AND NOT EXISTS (
          SELECT 1
          FROM pos_order_cooking_tickets t
          WHERE t.providerProfileId = ?
            AND t.providerChannelCode = ?
            AND t.orderId = o.id
            AND t.orderItemId = i.id
            AND t.deletedAt IS NULL
        )
      ORDER BY o.id ASC, i.id ASC
    `).all(
      profileId,
      channelCode,
      channelCode,
      profileId,
      channelCode
    ) as MissingCookingTicketOrderItemRow[]

    if (missingRows.length < 1) {
      return
    }

    const insertStmt = db.prepare(`
      INSERT INTO pos_order_cooking_tickets(
        providerProfileId,
        providerChannelCode,
        orderId,
        orderCode,
        orderItemId,
        locationId,
        locationNameSnapshot,
        productNameSnapshot,
        quantity,
        optionSummarySnapshot,
        requestMemoSnapshot,
        cookingStatus,
        priorityLevel,
        orderedAt,
        isActive,
        createdAt,
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
        NULL,
        'WAITING',
        'NORMAL',
        ?,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `)

    const insertMany = db.transaction((rows: MissingCookingTicketOrderItemRow[]) => {
      for (const row of rows) {
        insertStmt.run(
          profileId,
          channelCode,
          row.orderId,
          row.orderCode,
          row.orderItemId,
          row.locationId,
          this.normalizeNullableString(row.locationNameSnapshot),
          row.productNameSnapshot,
          Math.max(1, Number(row.quantity || 1)),
          this.normalizeNullableString(row.optionSummarySnapshot),
          this.normalizeNullableString(row.orderedAt)
        )
      }
    })

    insertMany(missingRows)
  }

  createCookingTicket(
    input: CreateCookingTicketDto
  ): CookingTicketResponse {
    const profileId =
      this.normalizePositiveInteger(input.profileId, 'profileId')
    const channelCode =
      this.normalizeRequiredString(input.channelCode, 'channelCode')

    this.assertBusinessProfile(profileId, channelCode)

    const orderId =
      this.normalizePositiveInteger(input.orderId, 'orderId')
    const orderItemId =
      this.normalizePositiveInteger(input.orderItemId, 'orderItemId')
    const orderCode =
      this.normalizeOrderCode(input.orderCode)
    const productNameSnapshot =
      this.normalizeRequiredString(input.productNameSnapshot, 'productNameSnapshot')
    const quantity =
      this.normalizePositiveInteger(input.quantity, 'quantity')
    const priorityLevel =
      this.normalizePriorityLevel(input.priorityLevel)
    const locationId =
      this.normalizeNullablePositiveInteger(input.locationId, 'locationId')

    const result = db.prepare(`
      INSERT INTO pos_order_cooking_tickets(
        providerProfileId,
        providerChannelCode,
        orderId,
        orderCode,
        orderItemId,
        locationId,
        locationNameSnapshot,
        productNameSnapshot,
        quantity,
        optionSummarySnapshot,
        requestMemoSnapshot,
        cookingStatus,
        priorityLevel,
        cookStaffCode,
        cookStaffNameSnapshot,
        orderedAt,
        isActive,
        createdAt,
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
        ?,
        'WAITING',
        ?,
        ?,
        ?,
        COALESCE(?, CURRENT_TIMESTAMP),
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `).run(
      profileId,
      channelCode,
      orderId,
      orderCode,
      orderItemId,
      locationId,
      this.normalizeNullableString(input.locationNameSnapshot),
      productNameSnapshot,
      quantity,
      this.normalizeNullableString(input.optionSummarySnapshot),
      this.normalizeNullableString(input.requestMemoSnapshot),
      priorityLevel,
      this.normalizeNullableString(input.cookStaffCode),
      this.normalizeNullableString(input.cookStaffNameSnapshot),
      this.normalizeNullableString(input.orderedAt)
    )

    const ticketId =
      Number(result.lastInsertRowid)

    return this.findTicketOrFail(ticketId, profileId, channelCode)
  }

  updateCookingStatus(
    ticketId: number,
    input: UpdateCookingStatusDto
  ): CookingTicketResponse {
    const normalizedTicketId =
      this.normalizePositiveInteger(ticketId, 'ticketId')
    const profileId =
      this.normalizePositiveInteger(input.profileId, 'profileId')
    const channelCode =
      this.normalizeRequiredString(input.channelCode, 'channelCode')
    const nextStatus =
      this.normalizeCookingStatus(input.cookingStatus)

    this.assertBusinessProfile(profileId, channelCode)

    const ticket =
      this.findTicketOrFail(normalizedTicketId, profileId, channelCode)

    if (ticket.cookingStatus === nextStatus) {
      return ticket
    }

    this.assertStatusTransition(ticket.cookingStatus, nextStatus)

    db.prepare(`
      UPDATE pos_order_cooking_tickets
      SET
        cookingStatus = ?,
        cookStaffCode = ?,
        cookStaffNameSnapshot = ?,
        cookingStartedAt = CASE
          WHEN ? IN ('COOKING', 'DONE') THEN COALESCE(cookingStartedAt, CURRENT_TIMESTAMP)
          ELSE cookingStartedAt
        END,
        cookingCompletedAt = CASE
          WHEN ? = 'DONE' THEN CURRENT_TIMESTAMP
          ELSE cookingCompletedAt
        END,
        elapsedMinutes = CASE
          WHEN ? = 'DONE' THEN CAST(
            MAX(
              0,
              ROUND(
                (
                  julianday(CURRENT_TIMESTAMP) -
                  julianday(COALESCE(cookingStartedAt, CURRENT_TIMESTAMP))
                ) * 24 * 60
              )
            ) AS INTEGER
          )
          ELSE elapsedMinutes
        END,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND providerProfileId = ?
        AND providerChannelCode = ?
        AND isActive = 1
        AND deletedAt IS NULL
    `).run(
      nextStatus,
      this.normalizeNullableString(input.cookStaffCode),
      this.normalizeNullableString(input.cookStaffNameSnapshot),
      nextStatus,
      nextStatus,
      nextStatus,
      normalizedTicketId,
      profileId,
      channelCode
    )

    const updatedTicket =
      this.findTicketOrFail(normalizedTicketId, profileId, channelCode)

    if (nextStatus === 'DONE') {
      this.moveTableToCleaningIfPaidAndCookingDone(updatedTicket)
    }

    return updatedTicket
  }

  private moveTableToCleaningIfPaidAndCookingDone(
    ticket: CookingTicketResponse
  ): void {
    if (!ticket.locationId || ticket.locationId <= 0) {
      return
    }

    const orderContext =
      this.findOrderContextForCookingTicket(ticket)

    if (!orderContext || orderContext.paymentStatus !== 'PAID') {
      return
    }

    if (!this.isTableOrder(orderContext)) {
      return
    }

    if (!this.areAllCookingTicketsFinished(orderContext.orderId, orderContext.providerChannelCode)) {
      return
    }

    db.prepare(`
      UPDATE pos_locations
      SET
        resourceStatus = 'CLEANING',
        lastStatusChangedAt = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND deletedAt IS NULL
    `).run(
      orderContext.locationId,
      orderContext.providerProfileId,
      orderContext.providerChannelCode
    )
  }

  private findOrderContextForCookingTicket(
    ticket: CookingTicketResponse
  ): CookingTicketOrderContextRow | null {
    const row = db.prepare(`
      SELECT
        id AS orderId,
        orderCode,
        providerProfileId,
        providerChannelCode,
        orderSource,
        orderFlowType,
        locationId,
        paymentStatus
      FROM pos_orders
      WHERE id = ?
        AND providerProfileId = ?
        AND providerChannelCode = ?
        AND isActive = 1
      LIMIT 1
    `).get(
      ticket.orderId,
      ticket.profileId,
      ticket.channelCode
    ) as CookingTicketOrderContextRow | undefined

    return row ?? null
  }

  private areAllCookingTicketsFinished(
    orderId: number,
    channelCode: string
  ): boolean {
    const row = db.prepare(`
      SELECT
        COUNT(*) AS totalCount,
        SUM(
          CASE
            WHEN cookingStatus IN ('DONE', 'CANCELED') THEN 1
            ELSE 0
          END
        ) AS finishedCount
      FROM pos_order_cooking_tickets
      WHERE orderId = ?
        AND providerChannelCode = ?
        AND isActive = 1
        AND deletedAt IS NULL
    `).get(
      orderId,
      channelCode
    ) as { totalCount: number, finishedCount: number | null } | undefined

    const totalCount =
      Number(row?.totalCount ?? 0)
    const finishedCount =
      Number(row?.finishedCount ?? 0)

    return totalCount > 0 && finishedCount === totalCount
  }

  private isTableOrder(
    order: CookingTicketOrderContextRow
  ): boolean {
    return (
      order.orderFlowType === 'IN_STORE' ||
      order.orderSource === 'POS' ||
      order.orderSource === 'TABLE_ORDER' ||
      order.orderSource === 'QR_ORDER'
    )
  }

  private findTicketOrFail(
    ticketId: number,
    profileId: number,
    channelCode: string
  ): CookingTicketResponse {
    const row = db.prepare(`
      SELECT
        id,
        providerProfileId,
        providerChannelCode,
        orderId,
        orderCode,
        orderItemId,
        locationId,
        locationNameSnapshot,
        productNameSnapshot,
        quantity,
        optionSummarySnapshot,
        requestMemoSnapshot,
        cookingStatus,
        priorityLevel,
        cookStaffCode,
        cookStaffNameSnapshot,
        orderedAt,
        cookingStartedAt,
        cookingCompletedAt,
        elapsedMinutes,
        isActive,
        createdAt,
        updatedAt,
        deletedAt
      FROM pos_order_cooking_tickets
      WHERE id = ?
        AND providerProfileId = ?
        AND providerChannelCode = ?
        AND isActive = 1
        AND deletedAt IS NULL
      LIMIT 1
    `).get(
      ticketId,
      profileId,
      channelCode
    ) as CookingTicketRow | undefined

    if (!row) {
      throw new NotFoundException('Cooking ticket not found')
    }

    return this.mapRowToResponse(row)
  }

  private mapRowToResponse(
    row: CookingTicketRow
  ): CookingTicketResponse {
    const elapsedMinutes =
      this.resolveElapsedMinutesByOrderStart(row)

    return {
      id: row.id,
      profileId: row.providerProfileId,
      channelCode: row.providerChannelCode,
      orderId: row.orderId,
      orderCode: row.orderCode,
      orderItemId: row.orderItemId,
      locationId: row.locationId,
      locationNameSnapshot: row.locationNameSnapshot,
      productNameSnapshot: row.productNameSnapshot,
      quantity: row.quantity,
      optionSummarySnapshot: row.optionSummarySnapshot,
      requestMemoSnapshot: row.requestMemoSnapshot,
      cookingStatus: row.cookingStatus,
      priorityLevel: row.priorityLevel,
      cookStaffCode: row.cookStaffCode,
      cookStaffNameSnapshot: row.cookStaffNameSnapshot,
      orderedAt: row.orderedAt,
      cookingStartedAt: row.cookingStartedAt,
      cookingCompletedAt: row.cookingCompletedAt,
      elapsedMinutes,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }

  private resolveElapsedMinutesByOrderStart(
    row: CookingTicketRow
  ): number | null {
    if (!row.orderedAt) {
      return row.elapsedMinutes ?? null
    }

    if (row.cookingStatus === 'DONE' || row.cookingStatus === 'CANCELED') {
      if (typeof row.elapsedMinutes === 'number' && row.elapsedMinutes >= 0) {
        return row.elapsedMinutes
      }

      if (row.cookingCompletedAt) {
        const completedElapsed =
          this.calculateElapsedMinutes(row.orderedAt, row.cookingCompletedAt)

        if (typeof completedElapsed === 'number') {
          return completedElapsed
        }
      }
    }

    return this.calculateElapsedMinutes(
      row.orderedAt,
      new Date().toISOString()
    )
  }

  private assertBusinessProfile(
    profileId: number,
    channelCode: string
  ): BusinessProfileRow {
    const row = db.prepare(`
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
    ) as BusinessProfileRow | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found')
    }

    return row
  }

  private assertStatusTransition(
    currentStatus: CookingStatus,
    nextStatus: CookingStatus
  ): void {
    if (currentStatus === nextStatus) {
      return
    }

    const allowed =
      (currentStatus === 'WAITING' && (nextStatus === 'COOKING' || nextStatus === 'DONE' || nextStatus === 'CANCELED')) ||
      (currentStatus === 'COOKING' && (nextStatus === 'DONE' || nextStatus === 'CANCELED'))

    if (!allowed) {
      throw new BadRequestException('Invalid cooking status transition')
    }
  }

  private normalizePositiveInteger(
    value: unknown,
    fieldName: string
  ): number {
    const normalized =
      typeof value === 'string'
        ? Number.parseInt(value, 10)
        : value

    if (
      typeof normalized !== 'number' ||
      !Number.isInteger(normalized) ||
      normalized <= 0
    ) {
      throw new BadRequestException(`${fieldName} must be positive integer`)
    }

    return normalized
  }

  private normalizeRequiredString(
    value: unknown,
    fieldName: string
  ): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} is required`)
    }

    const normalized = value.trim()

    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required`)
    }

    return normalized
  }

  private normalizeNullableString(
    value: unknown
  ): string | null {
    if (typeof value !== 'string') {
      return null
    }

    const normalized = value.trim()

    return normalized.length > 0
      ? normalized
      : null
  }

  private normalizeNullablePositiveInteger(
    value: unknown,
    fieldName: string
  ): number | null {
    if (value === null || value === undefined) {
      return null
    }

    return this.normalizePositiveInteger(value, fieldName)
  }

  private normalizeOrderCode(
    value: unknown
  ): string {
    const orderCode =
      this.normalizeRequiredString(value, 'orderCode').toUpperCase()

    if (orderCode.length !== 12) {
      throw new BadRequestException('orderCode must be 12 characters')
    }

    return orderCode
  }

  private normalizePriorityLevel(
    value: unknown
  ): CookingPriorityLevel {
    const normalized =
      this.normalizeNullableString(value)?.toUpperCase() ?? 'NORMAL'

    if (
      normalized !== 'LOW' &&
      normalized !== 'NORMAL' &&
      normalized !== 'HIGH' &&
      normalized !== 'URGENT'
    ) {
      throw new BadRequestException('priorityLevel is invalid')
    }

    return normalized
  }

  private normalizeCookingStatus(
    value: unknown
  ): CookingStatus {
    const normalized =
      this.normalizeRequiredString(value, 'cookingStatus').toUpperCase()

    if (
      normalized !== 'WAITING' &&
      normalized !== 'COOKING' &&
      normalized !== 'DONE' &&
      normalized !== 'CANCELED'
    ) {
      throw new BadRequestException('cookingStatus is invalid')
    }

    return normalized
  }

  private normalizeQueryCookingStatus(
    value: unknown
  ): CookingStatus | 'ALL' {
    if (value === null || value === undefined) {
      return 'ALL'
    }

    const normalized = String(value).trim().toUpperCase()

    if (normalized === 'ALL') {
      return 'ALL'
    }

    return this.normalizeCookingStatus(normalized)
  }

  private normalizeActiveFilter(
    value: unknown
  ): 0 | 1 {
    if (value === null || value === undefined || value === '') {
      return 1
    }

    const normalized =
      typeof value === 'string'
        ? Number.parseInt(value, 10)
        : value

    if (normalized !== 0 && normalized !== 1) {
      throw new BadRequestException('isActive must be 0 or 1')
    }

    return normalized
  }

  private calculateElapsedMinutes(
    orderedAt: string | null,
    currentIso: string
  ): number | null {
    if (!orderedAt) {
      return null
    }

    const orderedDate =
      this.parseDbUtcTimestamp(orderedAt)
    const currentDate =
      this.parseDbUtcTimestamp(currentIso)

    if (
      !orderedDate ||
      !currentDate
    ) {
      return null
    }

    const diffMs =
      currentDate.getTime() - orderedDate.getTime()

    if (diffMs < 0) {
      return 0
    }

    return Math.floor(diffMs / 60000)
  }

  private parseDbUtcTimestamp(
    value: string | null | undefined
  ): Date | null {
    const rawValue =
      String(value ?? '').trim()

    if (!rawValue) {
      return null
    }

    const normalizedValue =
      rawValue.includes('T')
        ? rawValue
        : rawValue.replace(' ', 'T')

    const hasTimezone =
      normalizedValue.endsWith('Z') ||
      /[+-]\d{2}:\d{2}$/.test(normalizedValue)

    const date =
      new Date(hasTimezone ? normalizedValue : `${normalizedValue}Z`)

    return Number.isNaN(date.getTime())
      ? null
      : date
  }
}

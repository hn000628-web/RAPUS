// FILE : backend/src/modules/business/pos/table-settings/pos-table-settings.service.ts
// ROOT : backend/src/modules/business/pos/table-settings/pos-table-settings.service.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS TABLE SETTINGS SERVICE
// CHANGE SUMMARY :
// - POS 테이블 설정 전용 Service 신규 생성
// - pos_locations 기반 테이블 목록 / 생성 / 수정 / soft delete 처리
// - QR 연결 / QR 해제 / 정렬 저장 처리
// - profileId + channelCode + BUSINESS 검증 적용
// - DB 접근은 Service 내부에서만 수행

// SECTION 01 : IMPORT

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { randomInt } from 'crypto'

import db from '../../../../config/database'

// SECTION 02 : TYPE

export type QrStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'

export type PosResourceType =
  | 'TABLE'
  | 'ROOM'
  | 'SPACE'
  | 'SEAT'
  | 'BOOTH'

export type PosResourceStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_USE'
  | 'WAITING'
  | 'CHECKIN_READY'
  | 'CHECKOUT_PENDING'
  | 'CLEANING'
  | 'CLEAN_DONE'
  | 'MAINTENANCE'
  | 'DISABLED'

export type BusinessPosTableSettingRow = {
  id: number
  profileId: number
  channelCode: string
  locationType: string
  locationName: string
  locationGroupName: string | null
  capacity: number | null
  tableOptionName: string | null
  tableTypeCode: string | null
  floor: string | null
  zone: string | null
  floorSortOrder: number | null
  zoneSortOrder: number | null
  layoutX: number | null
  layoutY: number | null
  layoutWidth: number | null
  layoutHeight: number | null
  layoutRotate: number | null
  layoutShape: string | null
  defaultPrice: number | null
  resourceStatus: PosResourceStatus
  lastStatusChangedAt: string | null
  tableCode: string | null
  qrStatus: QrStatus
  qrBaseUrl: string | null
  qrRoutePath: string | null
  tableOrderUrl: string | null
  qrCodeValue: string | null
  qrGeneratedAt: string | null
  qrConnectedAt: string | null
  qrDisconnectedAt: string | null
  isActive: number
  sortOrder: number
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

export type BusinessPosTableSettingResponse = {
  id: number
  profileId: number
  channelCode: string
  locationType: string
  resourceType: PosResourceType
  tableName: string
  zoneName: string
  tableOptionName: string
  tableTypeCode: string
  floor: string
  zone: string
  floorSortOrder: number
  zoneSortOrder: number
  layoutX: number
  layoutY: number
  layoutWidth: number
  layoutHeight: number
  layoutRotate: number
  layoutShape: string
  defaultPrice: number
  resourceStatus: PosResourceStatus
  lastStatusChangedAt: string | null
  tableCode: string | null
  capacity: number | null
  qrStatus: QrStatus
  tableOrderUrl: string | null
  qrCodeValue: string | null
  sortOrder: number
  isActive: number
  createdAt: string
  updatedAt: string | null
}

export type BusinessPosTableSettingsListResponse = {
  tables: BusinessPosTableSettingResponse[]
}

export type CreateBusinessPosTableSettingInput = {
  profileId: number
  channelCode: string
  tableName: string
  zoneName: string
  tableOptionName: string
  tableTypeCode?: string
  floor?: string
  zone?: string
  floorSortOrder?: number
  zoneSortOrder?: number
  layoutX?: number
  layoutY?: number
  layoutWidth?: number
  layoutHeight?: number
  layoutRotate?: number
  layoutShape?: string
  resourceType?: PosResourceType
  defaultPrice?: number | string | null
  capacity?: number | null
  sortOrder?: number
}

export type UpdateBusinessPosTableSettingInput = {
  profileId: number
  channelCode: string
  tableName?: string
  zoneName?: string
  tableOptionName?: string
  tableTypeCode?: string
  floor?: string
  zone?: string
  floorSortOrder?: number
  zoneSortOrder?: number
  layoutX?: number
  layoutY?: number
  layoutWidth?: number
  layoutHeight?: number
  layoutRotate?: number
  layoutShape?: string
  resourceType?: PosResourceType
  defaultPrice?: number | string | null
  capacity?: number | null
  sortOrder?: number
  isActive?: number
}

export type DeleteBusinessPosTableSettingInput = {
  profileId: number
  channelCode: string
}

export type ConnectBusinessPosTableQrInput = {
  profileId: number
  channelCode: string
  qrCodeValue: string
}

export type DisconnectBusinessPosTableQrInput = {
  profileId: number
  channelCode: string
}

export type UpdateBusinessPosTableSortOrderItem = {
  locationId: number
  sortOrder: number
}

export type UpdateBusinessPosTableSortOrderInput = {
  profileId: number
  channelCode: string
  items: UpdateBusinessPosTableSortOrderItem[]
}

export type UpdateBusinessPosResourceStatusInput = {
  profileId: number
  channelCode: string
  resourceStatus: PosResourceStatus
}

type BusinessProfileRow = {
  id: number
  channelCode: string
  profileType: 'BUSINESS'
}

type SqliteErrorLike = {
  message?: string
}

// SECTION 03 : CONSTANT

const LOCATION_TYPE_TABLE = 'TABLE'
const RESOURCE_TYPE_TO_LOCATION_TYPE: Record<PosResourceType, string> = {
  TABLE: 'TABLE',
  ROOM: 'ROOM',
  SPACE: 'CUSTOM',
  SEAT: 'SEAT',
  BOOTH: 'BOOTH'
}
const LOCATION_TYPE_TO_RESOURCE_TYPE: Record<string, PosResourceType> = {
  TABLE: 'TABLE',
  ROOM: 'ROOM',
  CUSTOM: 'SPACE',
  SEAT: 'SEAT',
  BOOTH: 'BOOTH'
}
const TABLE_CODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const TABLE_CODE_LENGTH = 3
const TABLE_CODE_MAX_RETRY = 20
const POS_RESOURCE_STATUS_VALUES: PosResourceStatus[] = [
  'AVAILABLE',
  'RESERVED',
  'IN_USE',
  'WAITING',
  'CHECKIN_READY',
  'CHECKOUT_PENDING',
  'CLEANING',
  'CLEAN_DONE',
  'MAINTENANCE',
  'DISABLED'
]

// SECTION 04 : SERVICE

@Injectable()
export class BusinessPosTableSettingsService {

  // SECTION 05 : PUBLIC READ FUNCTION

  findAll(
    profileId: number,
    channelCode: string,
    resourceType?: PosResourceType | 'ALL',
    floor?: string,
    zone?: string
  ): BusinessPosTableSettingsListResponse {

    this.assertBusinessProfile(
      profileId,
      channelCode
    )

    this.backfillLegacyTableQrData(
      profileId,
      channelCode
    )

    this.syncPaidTableOrdersToCleaning(
      profileId,
      channelCode
    )

    const normalizedResourceType =
      this.normalizeFilterResourceType(resourceType)
    const normalizedFloor =
      this.normalizeOptionalTextFilter(floor)
    const normalizedZone =
      this.normalizeOptionalTextFilter(zone)
    const whereClauses = [
      'profileId = ?',
      'channelCode = ?',
      'deletedAt IS NULL'
    ]
    const params: unknown[] = [
      profileId,
      channelCode
    ]

    if (normalizedResourceType === 'ALL') {
      whereClauses.push(`locationType IN ('TABLE', 'ROOM', 'CUSTOM', 'SEAT', 'BOOTH')`)
    } else {
      whereClauses.push('locationType = ?')
      params.push(this.resourceTypeToLocationType(normalizedResourceType))
    }

    if (normalizedFloor) {
      whereClauses.push('floor = ?')
      params.push(normalizedFloor)
    }

    if (normalizedZone) {
      whereClauses.push('zone = ?')
      params.push(normalizedZone)
    }

    const rows =
      db.prepare(`
        SELECT
          id,
          profileId,
          channelCode,
          locationType,
          locationName,
          locationGroupName,
          capacity,
          tableOptionName,
          tableTypeCode,
          floor,
          zone,
          floorSortOrder,
          zoneSortOrder,
          layoutX,
          layoutY,
          layoutWidth,
          layoutHeight,
          layoutRotate,
          layoutShape,
          defaultPrice,
          resourceStatus,
          lastStatusChangedAt,
          tableCode,
          qrStatus,
          qrBaseUrl,
          qrRoutePath,
          tableOrderUrl,
          qrCodeValue,
          qrGeneratedAt,
          qrConnectedAt,
          qrDisconnectedAt,
          isActive,
          sortOrder,
          createdAt,
          updatedAt,
          deletedAt
        FROM pos_locations
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY floorSortOrder ASC, zoneSortOrder ASC, sortOrder ASC, id ASC
      `).all(...params) as BusinessPosTableSettingRow[]

    return {
      tables: rows.map((row) => this.mapRowToResponse(row))
    }

  }

  // SECTION 06 : PUBLIC CREATE FUNCTION

  create(
    input: CreateBusinessPosTableSettingInput
  ): BusinessPosTableSettingResponse {

    this.assertBusinessProfile(
      input.profileId,
      input.channelCode
    )

    this.backfillLegacyTableQrData(
      input.profileId,
      input.channelCode
    )

    const requestedTableName =
      this.requireTrimmedText(
        input.tableName,
        'tableName'
      )

    const tableName =
      requestedTableName

    const zoneName =
      this.requireTrimmedText(
        input.zoneName,
        'zoneName'
      )

    const tableOptionName =
      this.requireTrimmedText(
        input.tableOptionName,
        'tableOptionName'
      )
    const tableTypeCode =
      this.normalizeTableTypeCode(input.tableTypeCode)
    const floor =
      this.normalizeLocationText(input.floor, 'floor', '1층')
    const zone =
      this.normalizeLocationText(input.zone, 'zone', '홀')
    const floorSortOrder =
      this.normalizeLocationSortOrder(input.floorSortOrder)
    const zoneSortOrder =
      this.normalizeLocationSortOrder(input.zoneSortOrder)
    const layoutX =
      this.normalizeLayoutInteger(input.layoutX, 0, 'layoutX')
    const layoutY =
      this.normalizeLayoutInteger(input.layoutY, 0, 'layoutY')
    const layoutWidth =
      this.normalizeLayoutPositiveInteger(input.layoutWidth, 180, 'layoutWidth')
    const layoutHeight =
      this.normalizeLayoutPositiveInteger(input.layoutHeight, 140, 'layoutHeight')
    const layoutRotate =
      this.normalizeLayoutInteger(input.layoutRotate, 0, 'layoutRotate')
    const layoutShape =
      this.normalizeLayoutShape(input.layoutShape)

    const capacity =
      this.normalizeCapacity(input.capacity)

    const defaultPrice =
      this.normalizeDefaultPrice(input.defaultPrice)

    const sortOrder =
      this.normalizeSortOrder(input.sortOrder)

    const resourceType =
      this.normalizeResourceType(input.resourceType)

    const locationType =
      this.resourceTypeToLocationType(resourceType)

    this.assertCreatePayloadDoesNotIncludeTableCode(input)

    const tableCode =
      this.createAvailableTableCode(
        input.profileId,
        input.channelCode
      )

    const qrBaseUrl =
      this.getTableQrBaseUrl()

    const qrRoutePath =
      `/order/qr/${input.channelCode}/table/${tableCode}`

    const tableOrderUrl =
      `${qrBaseUrl}${qrRoutePath}`

    const qrCodeValue =
      tableOrderUrl

    try {

      const result =
        db.prepare(`
          INSERT INTO pos_locations(
            profileId,
            channelCode,
            locationType,
            locationName,
            locationGroupName,
            capacity,
            tableOptionName,
            tableTypeCode,
            floor,
            zone,
            floorSortOrder,
            zoneSortOrder,
            layoutX,
            layoutY,
            layoutWidth,
            layoutHeight,
            layoutRotate,
            layoutShape,
            defaultPrice,
            tableCode,
            qrStatus,
            qrBaseUrl,
            qrRoutePath,
            tableOrderUrl,
            qrCodeValue,
            qrGeneratedAt,
            qrConnectedAt,
            qrDisconnectedAt,
            isActive,
            sortOrder,
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
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'CONNECTED',
            ?,
            ?,
            ?,
            ?,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            NULL,
            1,
            ?,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `).run(
          input.profileId,
          input.channelCode,
          locationType,
          tableName,
          zoneName,
          capacity,
          tableOptionName,
          tableTypeCode,
          floor,
          zone,
          floorSortOrder,
          zoneSortOrder,
          layoutX,
          layoutY,
          layoutWidth,
          layoutHeight,
          layoutRotate,
          layoutShape,
          defaultPrice,
          tableCode,
          qrBaseUrl,
          qrRoutePath,
          tableOrderUrl,
          qrCodeValue,
          sortOrder
        )

      const locationId =
        Number(result.lastInsertRowid)

      return this.findTableByIdOrFail(
        locationId,
        input.profileId,
        input.channelCode
      )

    } catch (error) {

      this.handleSqliteError(error)

    }

  }

  // SECTION 07 : PUBLIC UPDATE FUNCTION

  update(
    locationId: number,
    input: UpdateBusinessPosTableSettingInput
  ): BusinessPosTableSettingResponse {

    this.assertBusinessProfile(
      input.profileId,
      input.channelCode
    )

    const targetRow =
      this.findOwnedTableLocationOrFail(
      locationId,
      input.profileId,
      input.channelCode
    )

    this.assertTableCodeImmutable(targetRow.tableCode, input)

    const setClauses: string[] = []
    const params: unknown[] = []

    if (input.tableName !== undefined) {
      setClauses.push('locationName = ?')
      params.push(
        this.requireTrimmedText(
          input.tableName,
          'tableName'
        )
      )
    }

    if (input.zoneName !== undefined) {
      setClauses.push('locationGroupName = ?')
      params.push(
        this.requireTrimmedText(
          input.zoneName,
          'zoneName'
        )
      )
    }

    if (input.tableOptionName !== undefined) {
      setClauses.push('tableOptionName = ?')
      params.push(
        this.requireTrimmedText(
          input.tableOptionName,
          'tableOptionName'
        )
      )
    }

    if (input.tableTypeCode !== undefined) {
      setClauses.push('tableTypeCode = ?')
      params.push(
        this.normalizeTableTypeCode(input.tableTypeCode)
      )
    }

    if (input.floor !== undefined) {
      setClauses.push('floor = ?')
      params.push(
        this.normalizeLocationText(input.floor, 'floor', '1층')
      )
    }

    if (input.zone !== undefined) {
      setClauses.push('zone = ?')
      params.push(
        this.normalizeLocationText(input.zone, 'zone', '홀')
      )
    }

    if (input.floorSortOrder !== undefined) {
      setClauses.push('floorSortOrder = ?')
      params.push(
        this.normalizeLocationSortOrder(input.floorSortOrder)
      )
    }

    if (input.zoneSortOrder !== undefined) {
      setClauses.push('zoneSortOrder = ?')
      params.push(
        this.normalizeLocationSortOrder(input.zoneSortOrder)
      )
    }

    if (input.layoutX !== undefined) {
      setClauses.push('layoutX = ?')
      params.push(
        this.normalizeLayoutInteger(input.layoutX, 0, 'layoutX')
      )
    }

    if (input.layoutY !== undefined) {
      setClauses.push('layoutY = ?')
      params.push(
        this.normalizeLayoutInteger(input.layoutY, 0, 'layoutY')
      )
    }

    if (input.layoutWidth !== undefined) {
      setClauses.push('layoutWidth = ?')
      params.push(
        this.normalizeLayoutPositiveInteger(input.layoutWidth, 180, 'layoutWidth')
      )
    }

    if (input.layoutHeight !== undefined) {
      setClauses.push('layoutHeight = ?')
      params.push(
        this.normalizeLayoutPositiveInteger(input.layoutHeight, 140, 'layoutHeight')
      )
    }

    if (input.layoutRotate !== undefined) {
      setClauses.push('layoutRotate = ?')
      params.push(
        this.normalizeLayoutInteger(input.layoutRotate, 0, 'layoutRotate')
      )
    }

    if (input.layoutShape !== undefined) {
      setClauses.push('layoutShape = ?')
      params.push(
        this.normalizeLayoutShape(input.layoutShape)
      )
    }

    if (input.defaultPrice !== undefined) {
      setClauses.push('defaultPrice = ?')
      params.push(
        this.normalizeDefaultPrice(input.defaultPrice)
      )
    }

    if (input.capacity !== undefined) {
      setClauses.push('capacity = ?')
      params.push(
        this.normalizeCapacity(input.capacity)
      )
    }

    if (input.sortOrder !== undefined) {
      setClauses.push('sortOrder = ?')
      params.push(
        this.normalizeSortOrder(input.sortOrder)
      )
    }

    if (input.isActive !== undefined) {
      setClauses.push('isActive = ?')
      params.push(
        this.normalizeActiveValue(input.isActive)
      )
    }

    if (input.resourceType !== undefined) {
      setClauses.push('locationType = ?')
      params.push(
        this.resourceTypeToLocationType(
          this.normalizeResourceType(input.resourceType)
        )
      )
    }

    if (setClauses.length === 0) {
      throw new BadRequestException('No update fields provided')
    }

    setClauses.push('updatedAt = CURRENT_TIMESTAMP')

    try {

      db.prepare(`
        UPDATE pos_locations
        SET ${setClauses.join(', ')}
        WHERE id = ?
          AND profileId = ?
          AND channelCode = ?
          AND locationType = ?
          AND deletedAt IS NULL
      `).run(
        ...params,
        locationId,
        input.profileId,
        input.channelCode,
        targetRow.locationType
      )

      return this.findTableByIdOrFail(
        locationId,
        input.profileId,
        input.channelCode
      )

    } catch (error) {

      this.handleSqliteError(error)

    }

  }

  // SECTION 08 : PUBLIC DELETE FUNCTION

  softDelete(
    locationId: number,
    input: DeleteBusinessPosTableSettingInput
  ): { success: true } {

    this.assertBusinessProfile(
      input.profileId,
      input.channelCode
    )

    const targetRow =
      this.findOwnedTableLocationOrFail(
      locationId,
      input.profileId,
      input.channelCode
    )

    db.prepare(`
      UPDATE pos_locations
      SET
        isActive = 0,
        deletedAt = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND locationType = ?
        AND deletedAt IS NULL
    `).run(
      locationId,
      input.profileId,
      input.channelCode,
      targetRow.locationType
    )

    return {
      success: true
    }

  }

  // SECTION 09 : PUBLIC QR FUNCTION

  connectQr(
    locationId: number,
    input: ConnectBusinessPosTableQrInput
  ): BusinessPosTableSettingResponse {

    this.assertBusinessProfile(
      input.profileId,
      input.channelCode
    )

    const targetRow =
      this.findOwnedTableLocationOrFail(
      locationId,
      input.profileId,
      input.channelCode
    )

    if (!targetRow.tableOrderUrl || !targetRow.qrCodeValue) {
      throw new BadRequestException('QR URL is not generated')
    }

    const qrCodeValue =
      this.requireTrimmedText(
        input.qrCodeValue,
        'qrCodeValue'
      )

    db.prepare(`
      UPDATE pos_locations
      SET
        qrStatus = 'CONNECTED',
        qrCodeValue = ?,
        qrConnectedAt = CURRENT_TIMESTAMP,
        qrDisconnectedAt = NULL,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND locationType = ?
        AND deletedAt IS NULL
    `).run(
      qrCodeValue,
      locationId,
      input.profileId,
      input.channelCode,
      targetRow.locationType
    )

    return this.findTableByIdOrFail(
      locationId,
      input.profileId,
      input.channelCode
    )

  }

  disconnectQr(
    locationId: number,
    input: DisconnectBusinessPosTableQrInput
  ): BusinessPosTableSettingResponse {

    this.assertBusinessProfile(
      input.profileId,
      input.channelCode
    )

    const targetRow =
      this.findOwnedTableLocationOrFail(
      locationId,
      input.profileId,
      input.channelCode
    )

    db.prepare(`
      UPDATE pos_locations
      SET
        qrStatus = 'DISCONNECTED',
        qrDisconnectedAt = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND locationType = ?
        AND deletedAt IS NULL
    `).run(
      locationId,
      input.profileId,
      input.channelCode,
      targetRow.locationType
    )

    return this.findTableByIdOrFail(
      locationId,
      input.profileId,
      input.channelCode
    )

  }

  // SECTION 10 : PUBLIC SORT FUNCTION

  updateSortOrder(
    input: UpdateBusinessPosTableSortOrderInput
  ): { success: true } {

    this.assertBusinessProfile(
      input.profileId,
      input.channelCode
    )

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException('items is required')
    }

    for (const item of input.items) {

      this.normalizePositiveId(
        item.locationId,
        'locationId'
      )

      this.normalizeSortOrder(
        item.sortOrder
      )

      this.findOwnedTableLocationOrFail(
        item.locationId,
        input.profileId,
        input.channelCode
      )

    }

    const updateSortOrderTransaction =
      db.transaction((items: UpdateBusinessPosTableSortOrderItem[]) => {

        const updateStatement =
          db.prepare(`
            UPDATE pos_locations
            SET
              sortOrder = ?,
              updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
              AND profileId = ?
              AND channelCode = ?
              AND locationType = ?
              AND deletedAt IS NULL
          `)

        for (const item of items) {
          const targetLocation =
            this.findOwnedTableLocationOrFail(
              item.locationId,
              input.profileId,
              input.channelCode
            )

          updateStatement.run(
            item.sortOrder,
            item.locationId,
            input.profileId,
            input.channelCode,
            targetLocation.locationType
          )

        }

      })

    updateSortOrderTransaction(input.items)

    return {
      success: true
    }

  }

  updateResourceStatus(
    locationId: number,
    input: UpdateBusinessPosResourceStatusInput
  ): {
    success: true
    locationId: number
    resourceStatus: PosResourceStatus
    lastStatusChangedAt: string | null
  } {

    this.assertBusinessProfile(
      input.profileId,
      input.channelCode
    )

    const targetRow =
      this.findOwnedTableLocationOrFail(
      locationId,
      input.profileId,
      input.channelCode
    )

    const resourceStatus =
      this.normalizeResourceStatus(input.resourceStatus)

    this.assertResourceStatusTransition(
      targetRow.resourceStatus,
      resourceStatus
    )

    db.prepare(`
      UPDATE pos_locations
      SET
        resourceStatus = ?,
        lastStatusChangedAt = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND locationType = ?
        AND deletedAt IS NULL
    `).run(
      resourceStatus,
      locationId,
      input.profileId,
      input.channelCode,
      targetRow.locationType
    )

    const nextRow =
      this.findOwnedTableLocationOrFail(
        locationId,
        input.profileId,
        input.channelCode
      )

    return {
      success: true,
      locationId: nextRow.id,
      resourceStatus: nextRow.resourceStatus,
      lastStatusChangedAt: nextRow.lastStatusChangedAt
    }

  }

  private assertResourceStatusTransition(
    currentStatus: PosResourceStatus,
    nextStatus: PosResourceStatus
  ): void {
    if (currentStatus === nextStatus) {
      return
    }

    const allowed =
      (currentStatus === 'CHECKOUT_PENDING' && nextStatus === 'AVAILABLE') ||
      (currentStatus === 'CLEANING' && nextStatus === 'AVAILABLE') ||
      (currentStatus === 'CLEAN_DONE' && nextStatus === 'AVAILABLE')

    if (!allowed) {
      throw new BadRequestException('resourceStatus transition is invalid')
    }
  }

  private syncPaidTableOrdersToCleaning(
    profileId: number,
    channelCode: string
  ): void {
    db.prepare(`
      UPDATE pos_locations
      SET
        resourceStatus = 'CLEANING',
        lastStatusChangedAt = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
      WHERE profileId = ?
        AND channelCode = ?
        AND locationType IN ('TABLE', 'ROOM', 'CUSTOM', 'SEAT', 'BOOTH')
        AND deletedAt IS NULL
        AND resourceStatus NOT IN ('CLEANING', 'MAINTENANCE', 'DISABLED')
        AND NOT EXISTS (
          SELECT 1
          FROM pos_orders active_order
          WHERE active_order.locationId = pos_locations.id
            AND active_order.providerProfileId = pos_locations.profileId
            AND active_order.providerChannelCode = pos_locations.channelCode
            AND active_order.paymentStatus = 'UNPAID'
            AND active_order.isActive = 1
        )
        AND EXISTS (
          SELECT 1
          FROM pos_orders paid_order
          WHERE paid_order.locationId = pos_locations.id
            AND paid_order.providerProfileId = pos_locations.profileId
            AND paid_order.providerChannelCode = pos_locations.channelCode
            AND paid_order.paymentStatus = 'PAID'
            AND (
              paid_order.orderFlowType = 'IN_STORE'
              OR paid_order.orderSource IN ('POS', 'TABLE_ORDER', 'QR_ORDER')
            )
            AND EXISTS (
              SELECT 1
              FROM pos_order_cooking_tickets done_ticket
              WHERE done_ticket.orderId = paid_order.id
                AND done_ticket.providerChannelCode = paid_order.providerChannelCode
                AND done_ticket.isActive = 1
                AND done_ticket.deletedAt IS NULL
            )
            AND NOT EXISTS (
              SELECT 1
              FROM pos_order_cooking_tickets open_ticket
              WHERE open_ticket.orderId = paid_order.id
                AND open_ticket.providerChannelCode = paid_order.providerChannelCode
                AND open_ticket.isActive = 1
                AND open_ticket.deletedAt IS NULL
                AND open_ticket.cookingStatus NOT IN ('DONE', 'CANCELED')
            )
            AND (
              pos_locations.lastStatusChangedAt IS NULL
              OR datetime(pos_locations.lastStatusChangedAt) < datetime(paid_order.updatedAt)
            )
        )
    `).run(
      profileId,
      channelCode
    )
  }

  // SECTION 11 : PRIVATE PROFILE FUNCTION

  private assertBusinessProfile(
    profileId: number,
    channelCode: string
  ): BusinessProfileRow {

    this.normalizePositiveId(
      profileId,
      'profileId'
    )

    const nextChannelCode =
      this.requireTrimmedText(
        channelCode,
        'channelCode'
      )

    const row =
      db.prepare(`
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
        nextChannelCode
      ) as BusinessProfileRow | undefined

    if (!row) {
      throw new NotFoundException('Business profile not found')
    }

    return row

  }

  // SECTION 12 : PRIVATE LOCATION FUNCTION

  private findOwnedTableLocationOrFail(
    locationId: number,
    profileId: number,
    channelCode: string
  ): BusinessPosTableSettingRow {

    this.normalizePositiveId(
      locationId,
      'locationId'
    )

    const row =
      db.prepare(`
        SELECT
          id,
          profileId,
          channelCode,
          locationType,
          locationName,
          locationGroupName,
          capacity,
          tableOptionName,
          tableTypeCode,
          floor,
          zone,
          floorSortOrder,
          zoneSortOrder,
          layoutX,
          layoutY,
          layoutWidth,
          layoutHeight,
          layoutRotate,
          layoutShape,
          defaultPrice,
          resourceStatus,
          lastStatusChangedAt,
          tableCode,
          qrStatus,
          qrBaseUrl,
          qrRoutePath,
          tableOrderUrl,
          qrCodeValue,
          qrGeneratedAt,
          qrConnectedAt,
          qrDisconnectedAt,
          isActive,
          sortOrder,
          createdAt,
          updatedAt,
          deletedAt
        FROM pos_locations
        WHERE id = ?
          AND profileId = ?
          AND channelCode = ?
          AND locationType IN ('TABLE', 'ROOM', 'CUSTOM', 'SEAT', 'BOOTH')
          AND deletedAt IS NULL
        LIMIT 1
      `).get(
        locationId,
        profileId,
        channelCode
      ) as BusinessPosTableSettingRow | undefined

    if (!row) {
      throw new NotFoundException('POS table setting not found')
    }

    return row

  }

  private findTableByIdOrFail(
    locationId: number,
    profileId: number,
    channelCode: string
  ): BusinessPosTableSettingResponse {

    const row =
      this.findOwnedTableLocationOrFail(
        locationId,
        profileId,
        channelCode
      )

    return this.mapRowToResponse(row)

  }

  // SECTION 13 : PRIVATE NORMALIZE FUNCTION

  private requireTrimmedText(
    value: string,
    fieldName: string
  ): string {

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be string`)
    }

    const trimmedValue =
      value.trim()

    if (!trimmedValue) {
      throw new BadRequestException(`${fieldName} is required`)
    }

    return trimmedValue

  }

  private normalizePositiveId(
    value: number,
    fieldName: string
  ): number {

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} must be positive integer`)
    }

    return value

  }

  private normalizeCapacity(
    value: number | null | undefined
  ): number | null {

    if (value === undefined || value === null) {
      return null
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException('capacity must be positive integer')
    }

    return value

  }

  private normalizeSortOrder(
    value: number | undefined
  ): number {

    if (value === undefined) {
      return 0
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException('sortOrder must be zero or positive integer')
    }

    return value

  }

  private normalizeLocationText(
    value: string | undefined,
    fieldName: string,
    fallbackValue: string
  ): string {
    if (value === undefined || value === null) {
      return fallbackValue
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be string`)
    }

    const trimmedValue =
      value.trim()

    return trimmedValue || fallbackValue
  }

  private normalizeOptionalTextFilter(
    value: string | undefined
  ): string | null {
    if (value === undefined || value === null) {
      return null
    }

    const trimmedValue =
      String(value).trim()

    return trimmedValue || null
  }

  private normalizeLocationSortOrder(
    value: number | undefined
  ): number {
    if (value === undefined || value === null) {
      return 1
    }

    if (!Number.isInteger(value)) {
      throw new BadRequestException('location sort order must be integer')
    }

    return value
  }

  private normalizeLayoutInteger(
    value: number | undefined,
    fallbackValue: number,
    fieldName: string
  ): number {
    if (value === undefined || value === null) {
      return fallbackValue
    }

    if (!Number.isInteger(value)) {
      throw new BadRequestException(`${fieldName} must be integer`)
    }

    return value
  }

  private normalizeLayoutPositiveInteger(
    value: number | undefined,
    fallbackValue: number,
    fieldName: string
  ): number {
    if (value === undefined || value === null) {
      return fallbackValue
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${fieldName} must be positive integer`)
    }

    return value
  }

  private normalizeLayoutShape(
    value: string | null | undefined
  ): string {
    if (value === undefined || value === null) {
      return 'RECT'
    }

    const normalizedValue =
      String(value).trim().toUpperCase()

    if (!normalizedValue) {
      return 'RECT'
    }

    if (!['RECT', 'ROUND', 'ROOM'].includes(normalizedValue)) {
      throw new BadRequestException('layoutShape is invalid')
    }

    return normalizedValue
  }

  private normalizeActiveValue(
    value: number
  ): number {

    if (value !== 0 && value !== 1) {
      throw new BadRequestException('isActive must be 0 or 1')
    }

    return value

  }

  private normalizeDefaultPrice(
    value: number | string | null | undefined
  ): number {
    if (value === undefined || value === null || value === '') {
      return 0
    }

    const numericValue =
      typeof value === 'number'
        ? value
        : Number(String(value).trim())

    if (!Number.isFinite(numericValue) || Number.isNaN(numericValue)) {
      return 0
    }

    const normalized =
      Math.floor(numericValue)

    if (normalized < 0) {
      throw new BadRequestException('defaultPrice must be zero or positive integer')
    }

    return normalized
  }

  private normalizeTableTypeCode(
    value: string | null | undefined
  ): string {
    const normalizedValue =
      String(value ?? '').trim().toUpperCase()

    if (!normalizedValue) {
      return 'STANDARD'
    }

    return normalizedValue
  }

  private assertCreatePayloadDoesNotIncludeTableCode(
    input: CreateBusinessPosTableSettingInput
  ): void {
    const requestedTableCode =
      (input as CreateBusinessPosTableSettingInput & { tableCode?: unknown }).tableCode

    if (requestedTableCode === undefined || requestedTableCode === null) {
      return
    }

    const normalized =
      String(requestedTableCode).trim()

    if (!normalized) {
      return
    }

    throw new BadRequestException('테이블 코드는 생성 시 서버에서 자동 생성됩니다.')
  }

  private assertTableCodeImmutable(
    existingTableCode: string | null,
    input: UpdateBusinessPosTableSettingInput
  ): void {
    const requestedTableCodeRaw =
      (input as UpdateBusinessPosTableSettingInput & { tableCode?: unknown }).tableCode

    if (requestedTableCodeRaw === undefined || requestedTableCodeRaw === null) {
      return
    }

    const requestedTableCode =
      String(requestedTableCodeRaw).trim().toUpperCase()

    const persistedTableCode =
      String(existingTableCode ?? '').trim().toUpperCase()

    if (!requestedTableCode) {
      throw new BadRequestException('테이블 코드는 생성 후 변경할 수 없습니다.')
    }

    if (requestedTableCode !== persistedTableCode) {
      throw new BadRequestException('테이블 코드는 생성 후 변경할 수 없습니다.')
    }
  }

  private normalizeResourceStatus(
    value: PosResourceStatus
  ): PosResourceStatus {
    const normalizedValue =
      String(value || '').trim().toUpperCase() as PosResourceStatus

    if (!POS_RESOURCE_STATUS_VALUES.includes(normalizedValue)) {
      throw new BadRequestException('resourceStatus is invalid')
    }

    return normalizedValue
  }

  // SECTION 14 : PRIVATE MAP FUNCTION

  private mapRowToResponse(
    row: BusinessPosTableSettingRow
  ): BusinessPosTableSettingResponse {

    return {
      id: row.id,
      profileId: row.profileId,
      channelCode: row.channelCode,
      locationType: row.locationType,
      resourceType: this.locationTypeToResourceType(row.locationType),
      tableName: row.locationName,
      zoneName: row.locationGroupName ?? '',
      tableOptionName: row.tableOptionName ?? '',
      tableTypeCode: this.normalizeTableTypeCode(row.tableTypeCode),
      floor: row.floor?.trim() || '1층',
      zone: row.zone?.trim() || '홀',
      floorSortOrder: Number(row.floorSortOrder ?? 1),
      zoneSortOrder: Number(row.zoneSortOrder ?? 1),
      layoutX: Number(row.layoutX ?? 0),
      layoutY: Number(row.layoutY ?? 0),
      layoutWidth: Number(row.layoutWidth ?? 180),
      layoutHeight: Number(row.layoutHeight ?? 140),
      layoutRotate: Number(row.layoutRotate ?? 0),
      layoutShape: this.normalizeLayoutShape(row.layoutShape),
      defaultPrice: Number(row.defaultPrice ?? 0),
      resourceStatus: row.resourceStatus,
      lastStatusChangedAt: row.lastStatusChangedAt,
      tableCode: row.tableCode,
      capacity: row.capacity,
      qrStatus: row.qrStatus,
      tableOrderUrl: row.tableOrderUrl,
      qrCodeValue: row.qrCodeValue,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }

  }

  private getTableQrBaseUrl(): string {

    const baseUrl =
      process.env.TABLE_QR_BASE_URL?.trim()

    if (baseUrl) {
      return baseUrl.replace(/\/$/, '')
    }

    return 'https://rapus.kr'

  }

  private createRandomTableCode(): string {

    let code = ''

    for (let index = 0; index < TABLE_CODE_LENGTH; index += 1) {
      const randomIndex = randomInt(0, TABLE_CODE_CHARSET.length)
      code += TABLE_CODE_CHARSET[randomIndex]
    }

    return code.toUpperCase()

  }

  private createAvailableTableCode(
    profileId: number,
    channelCode: string
  ): string {

    for (let attempt = 0; attempt < TABLE_CODE_MAX_RETRY; attempt += 1) {

      const candidate =
        this.createRandomTableCode()

      const existsRow =
        db.prepare(`
          SELECT id
          FROM pos_locations
          WHERE profileId = ?
            AND channelCode = ?
            AND tableCode = ?
          LIMIT 1
        `).get(
          profileId,
          channelCode,
          candidate
        ) as { id?: number } | undefined

      if (!existsRow?.id) {
        return candidate
      }

    }

    throw new ConflictException('Available POS table code not found')

  }

  private backfillLegacyTableQrData(
    profileId: number,
    channelCode: string
  ): void {

    const qrBaseUrl =
      this.getTableQrBaseUrl()

    const rows =
      db.prepare(`
        SELECT
          id,
          tableCode,
          qrRoutePath,
          tableOrderUrl,
          qrCodeValue,
          qrGeneratedAt
        FROM pos_locations
        WHERE profileId = ?
          AND channelCode = ?
          AND locationType = ?
          AND (
            tableCode IS NULL
            OR qrRoutePath = '/order/qr/' || channelCode || '/table/' || id
            OR tableOrderUrl LIKE '%/table/' || id
            OR qrCodeValue LIKE '%/table/' || id
          )
      `).all(
        profileId,
        channelCode,
        LOCATION_TYPE_TABLE
      ) as Array<{
        id: number
        tableCode: string | null
        qrRoutePath: string | null
        tableOrderUrl: string | null
        qrCodeValue: string | null
        qrGeneratedAt: string | null
      }>

    if (rows.length === 0) {
      return
    }

    const updateStatement =
      db.prepare(`
        UPDATE pos_locations
        SET
          tableCode = ?,
          qrBaseUrl = ?,
          qrRoutePath = ?,
          tableOrderUrl = ?,
          qrCodeValue = ?,
          qrGeneratedAt = COALESCE(qrGeneratedAt, CURRENT_TIMESTAMP),
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `)

    for (const row of rows) {
      const nextTableCode =
        row.tableCode && this.isValidTableCode(row.tableCode)
          ? row.tableCode
          : this.createAvailableTableCode(profileId, channelCode)

      const nextQrRoutePath =
        `/order/qr/${channelCode}/table/${nextTableCode}`

      const nextTableOrderUrl =
        `${qrBaseUrl}${nextQrRoutePath}`

      updateStatement.run(
        nextTableCode,
        qrBaseUrl,
        nextQrRoutePath,
        nextTableOrderUrl,
        nextTableOrderUrl,
        row.id
      )
    }

  }

  private isValidTableCode(
    value: string
  ): boolean {

    return /^[A-Z0-9]{3}$/.test(value.trim().toUpperCase())

  }

  // SECTION 15 : PRIVATE ERROR FUNCTION

  private handleSqliteError(
    error: unknown
  ): never {

    const sqliteError =
      error as SqliteErrorLike

    if (sqliteError.message?.includes('UNIQUE')) {
      if (sqliteError.message?.includes('tableCode')) {
        throw new ConflictException('POS table code already exists')
      }
    }

    throw error

  }

  private normalizeResourceType(
    resourceType: PosResourceType | undefined
  ): PosResourceType {
    if (!resourceType) {
      return 'TABLE'
    }

    if (
      resourceType !== 'TABLE' &&
      resourceType !== 'ROOM' &&
      resourceType !== 'SPACE' &&
      resourceType !== 'SEAT' &&
      resourceType !== 'BOOTH'
    ) {
      throw new BadRequestException('resourceType is invalid')
    }

    return resourceType
  }

  private normalizeFilterResourceType(
    resourceType: PosResourceType | 'ALL' | undefined
  ): PosResourceType | 'ALL' {
    if (!resourceType) {
      return 'TABLE'
    }

    if (resourceType === 'ALL') {
      return resourceType
    }

    return this.normalizeResourceType(resourceType)
  }

  private resourceTypeToLocationType(
    resourceType: PosResourceType
  ): string {
    return RESOURCE_TYPE_TO_LOCATION_TYPE[resourceType] || LOCATION_TYPE_TABLE
  }

  private locationTypeToResourceType(
    locationType: string
  ): PosResourceType {
    return LOCATION_TYPE_TO_RESOURCE_TYPE[
      String(locationType || '').trim().toUpperCase()
    ] || 'TABLE'
  }

}

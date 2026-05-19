/* ==================================================
SECTION CODE OUTPUT : ADMIN SERVICE
FILE : backend/src/admin/admin.service.ts
================================================== */

import { Injectable } from '@nestjs/common'
import Database from 'better-sqlite3'

import { UsersService } from './users/users.service'
import { CreateUserDto } from './dto/create-user.dto'

type DeletedPosTableLocationItem = {
  id: number
  profileId: number
  channelCode: string
  locationType: string
  locationName: string
  locationGroupName: string | null
  tableOptionName: string | null
  tableOrderUrl: string | null
  qrStatus: string | null
  isActive: number
  orderCount: number
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
}

type DeletedPosTableLocationsResponse = {
  count: number
  items: DeletedPosTableLocationItem[]
}

type OrphanImageAssetItem = {
  id: number
  channelCode: string
  usageType: string
  fileName: string
  filePath: string
  mimeType: string | null
  fileSize: number | null
  isActive: number
  createdAt: string | null
  avatarRefCount: number
  heroRefCount: number
  galleryRefCount: number
  postRefCount: number
  placeThumbRefCount: number
}

type OrphanImageAssetsResponse = {
  count: number
  items: OrphanImageAssetItem[]
}

type InactiveRowItem = {
  tableName: string
  id: number
  displayName: string | null
  channelCode: string | null
  isActive: number
  deletedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  referenceCount: number
  canHardDelete: boolean
  protectReason: string | null
}

type InactiveRowTableGroup = {
  tableName: string
  count: number
  deletableCount: number
  protectedCount: number
  items: InactiveRowItem[]
}

type InactiveRowsResponse = {
  count: number
  tables: InactiveRowTableGroup[]
}

type InactiveRowsCleanResult = {
  tableName: string
  deletedCount: number
  skippedCount: number
}

type InactiveRowsCleanResponse = {
  success: true
  deletedCount: number
  skippedCount: number
  results: InactiveRowsCleanResult[]
}

type CleanupIssueType =
  | 'DUPLICATE'
  | 'ORPHAN'
  | 'INACTIVE'
  | 'SOFT_DELETED'

type CleanupIssueItem = {
  issueId: string
  issueType: CleanupIssueType
  tableName: string
  targetId: number | string
  displayName: string | null
  channelCode: string | null
  description: string
  referenceCount: number
  canHardDelete: boolean
  protectReason: string | null
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
}

type CleanupIssuesSummary = {
  totalCount: number
  deletableCount: number
  protectedCount: number
  duplicateCount: number
  orphanCount: number
  inactiveCount: number
  softDeletedCount: number
  posInactiveOrderCount: number
  posOrphanOrderItemCount: number
  posOrphanOrderItemOptionCount: number
  posInvalidProductRelationCount: number
  posInvalidLocationRelationCount: number
}

type CleanupIssuesResponse = {
  summary: CleanupIssuesSummary
  issues: CleanupIssueItem[]
}

type CleanupIssuesCleanResult = {
  issueType: string
  tableName: string
  targetId: number | string
  deleted: boolean
  skipped: boolean
  reason: string | null
}

type CleanupIssuesCleanResponse = {
  success: true
  deletedCount: number
  skippedCount: number
  results: CleanupIssuesCleanResult[]
}

type PosLocationReferenceStats = {
  totalCount: number
  blockingCount: number
}

type ClearDevPosInactiveOrdersResponse = {
  ok: true
  deletedOrders: number
  deletedOrderItems: number
  deletedOrderItemOptions: number
}

const INACTIVE_CLEANUP_TABLES = [
  'pos_locations',
  'pos_product_categories',
  'pos_menu_configs',
  'categories',
  'industries',
  'industry_subtypes',
  'business_types',
  'image_assets'
] as const

const INACTIVE_PROTECTED_TABLES = [
  'users',
  'profiles',
  'profile_sessions',
  'posts',
  'post_comments',
  'post_engagements',
  'orders',
  'payments',
  'pos_orders',
  'pos_order_items',
  'pos_order_item_options',
  'reports',
  'audit_logs',
  'notifications',
  'messages'
] as const


/* ==================================================
SECTION 01 : ADMIN SERVICE
================================================== */

@Injectable()

export class AdminService {

  private db: Database

  constructor(
    private readonly usersService: UsersService
  ) {

    // 🔥 SQLite 연결
    this.db = new Database('data/prod.sqlite')

  }


  /* ==================================================
  SECTION 02 : USER CREATE
  ================================================== */

  async createUser(dto: CreateUserDto) {
    return this.usersService.createUser(dto)
  }


  /* ==================================================
  SECTION 03 : DUPLICATE PROFILE BLOCKS
  ================================================== */

  async findDuplicateProfileBlocks() {

    return this.db.prepare(`
      SELECT
        profileId,
        sortOrder,
        COUNT(*) as count
      FROM profile_blocks
      GROUP BY profileId, sortOrder
      HAVING COUNT(*) > 1
    `).all()

  }


  /* ==================================================
  SECTION 04 : CLEAN DUPLICATES
  ================================================== */

  async cleanDuplicateProfileBlocks() {

    this.db.exec(`
      DELETE FROM profile_blocks
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM profile_blocks
        GROUP BY profileId, sortOrder
      )
    `)

    return { success: true }

  }

  /* ==================================================
  SECTION 05 : POS DELETED TABLE LOCATIONS
  ================================================== */

  async findDeletedPosTableLocations(): Promise<DeletedPosTableLocationsResponse> {

    const rows = this.db.prepare(`
      SELECT
        pl.id,
        pl.profileId,
        pl.channelCode,
        pl.locationType,
        pl.locationName,
        pl.locationGroupName,
        pl.tableOptionName,
        pl.tableOrderUrl,
        pl.qrStatus,
        pl.isActive,
        pl.createdAt,
        pl.updatedAt,
        pl.deletedAt,
        (
          SELECT COUNT(*)
          FROM pos_orders po
          WHERE po.locationId = pl.id
        ) AS orderCount
      FROM pos_locations pl
      WHERE pl.locationType = 'TABLE'
        AND (
          pl.deletedAt IS NOT NULL
          OR pl.isActive = 0
        )
      ORDER BY pl.deletedAt DESC, pl.id DESC
    `).all() as DeletedPosTableLocationItem[]

    return {
      count: rows.length,
      items: rows
    }

  }

  /* ==================================================
  SECTION 06 : CLEAN POS DELETED TABLE LOCATIONS
  ================================================== */

  async cleanDeletedPosTableLocations() {

    const result = this.db.prepare(`
      DELETE FROM pos_locations
      WHERE locationType = 'TABLE'
        AND (
          deletedAt IS NOT NULL
          OR isActive = 0
        )
        AND NOT EXISTS (
          SELECT 1
          FROM pos_orders
          WHERE pos_orders.locationId = pos_locations.id
        )
    `).run()

    return {
      success: true,
      deletedCount: Number(result.changes || 0)
    }

  }

  /* ==================================================
  SECTION 07 : ORPHAN IMAGE ASSETS SCAN
  ================================================== */

  async findOrphanImageAssets(): Promise<OrphanImageAssetsResponse> {
    const hasPlaceThumbnailsTable =
      this.tableExists('profile_place_thumbnails')

    const placeThumbSelectSql =
      hasPlaceThumbnailsTable
        ? `(
          SELECT COUNT(*)
          FROM profile_place_thumbnails ppt
          WHERE ppt.imageAssetId = ia.id
        ) AS placeThumbRefCount`
        : '0 AS placeThumbRefCount'

    const placeThumbWhereSql =
      hasPlaceThumbnailsTable
        ? `
        AND NOT EXISTS (
          SELECT 1
          FROM profile_place_thumbnails ppt
          WHERE ppt.imageAssetId = ia.id
        )`
        : ''

    const rows = this.db.prepare(`
      SELECT
        ia.id,
        ia.channelCode,
        ia.usageType,
        ia.fileName,
        ia.filePath,
        ia.mimeType,
        ia.fileSize,
        ia.isActive,
        ia.createdAt,
        (
          SELECT COUNT(*)
          FROM profile_avatars pa
          WHERE pa.imageAssetId = ia.id
        ) AS avatarRefCount,
        (
          SELECT COUNT(*)
          FROM profile_hero_images phi
          WHERE phi.imageAssetId = ia.id
        ) AS heroRefCount,
        (
          SELECT COUNT(*)
          FROM profile_gallery_images pgi
          WHERE pgi.imageAssetId = ia.id
        ) AS galleryRefCount,
        (
          SELECT COUNT(*)
          FROM post_images pi
          WHERE pi.imageAssetId = ia.id
        ) AS postRefCount,
        ${placeThumbSelectSql}
      FROM image_assets ia
      WHERE NOT EXISTS (
          SELECT 1
          FROM profile_avatars pa
          WHERE pa.imageAssetId = ia.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM profile_hero_images phi
          WHERE phi.imageAssetId = ia.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM profile_gallery_images pgi
          WHERE pgi.imageAssetId = ia.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM post_images pi
          WHERE pi.imageAssetId = ia.id
        )
        ${placeThumbWhereSql}
      ORDER BY ia.createdAt DESC, ia.id DESC
    `).all() as OrphanImageAssetItem[]

    return {
      count: rows.length,
      items: rows
    }

  }

  /* ==================================================
  SECTION 08 : INACTIVE ROWS SCAN
  ================================================== */

  async findInactiveRows(): Promise<InactiveRowsResponse> {

    const groups: InactiveRowTableGroup[] = []

    for (const tableName of INACTIVE_CLEANUP_TABLES) {

      const rows =
        this.getInactiveRowsForTable(tableName)

      if (rows.length === 0) {
        continue
      }

      const deletableCount =
        rows.filter((row) => row.canHardDelete).length

      groups.push({
        tableName,
        count: rows.length,
        deletableCount,
        protectedCount: rows.length - deletableCount,
        items: rows
      })

    }

    return {
      count: groups.reduce((sum, group) => sum + group.count, 0),
      tables: groups
    }

  }

  /* ==================================================
  SECTION 09 : INACTIVE ROWS CLEAN
  ================================================== */

  async cleanInactiveRows(): Promise<InactiveRowsCleanResponse> {

    const scanned =
      await this.findInactiveRows()

    const results: InactiveRowsCleanResult[] = []
    let totalDeletedCount = 0
    let totalSkippedCount = 0

    for (const group of scanned.tables) {

      let deletedCount = 0
      let skippedCount = 0

      for (const item of group.items) {

        if (!item.canHardDelete) {
          skippedCount += 1
          continue
        }

        const deleted = this.deleteInactiveRow(
          group.tableName,
          item.id
        )

        if (deleted) {
          deletedCount += 1
        } else {
          skippedCount += 1
        }

      }

      results.push({
        tableName: group.tableName,
        deletedCount,
        skippedCount
      })

      totalDeletedCount += deletedCount
      totalSkippedCount += skippedCount

    }

    return {
      success: true,
      deletedCount: totalDeletedCount,
      skippedCount: totalSkippedCount,
      results
    }

  }

  /* ==================================================
  SECTION 10 : CLEANUP ISSUES DASHBOARD
  ================================================== */

  async findCleanupIssues(): Promise<CleanupIssuesResponse> {

    const duplicateIssues =
      await this.findDuplicateProfileBlockIssues()

    const deletedPosIssues =
      await this.findDeletedPosLocationIssues()

    const orphanAssetIssues =
      await this.findOrphanImageAssetIssues()

    const inactiveIssues =
      await this.findInactiveRowIssues()

    const posInactiveOrderIssues =
      await this.findPosInactiveOrderIssues()

    const posOrphanOrderItemIssues =
      await this.findPosOrphanOrderItemIssues()

    const posOrphanOrderItemOptionIssues =
      await this.findPosOrphanOrderItemOptionIssues()

    const posInvalidProductRelationIssues =
      await this.findPosInvalidProductRelationIssues()

    const posInvalidLocationRelationIssues =
      await this.findPosInvalidLocationRelationIssues()

    const profileDeliveryAddressSoftDeletedIssues =
      await this.findProfileDeliveryAddressSoftDeletedIssues()

    const merged = [
      ...duplicateIssues,
      ...deletedPosIssues,
      ...orphanAssetIssues,
      ...inactiveIssues,
      ...posInactiveOrderIssues,
      ...posOrphanOrderItemIssues,
      ...posOrphanOrderItemOptionIssues,
      ...posInvalidProductRelationIssues,
      ...posInvalidLocationRelationIssues,
      ...profileDeliveryAddressSoftDeletedIssues
    ]

    const issuesMap =
      new Map<string, CleanupIssueItem>()

    for (const issue of merged) {
      if (!issuesMap.has(issue.issueId)) {
        issuesMap.set(issue.issueId, issue)
      }
    }

    const issues =
      Array.from(issuesMap.values())

    const summary: CleanupIssuesSummary = {
      totalCount: issues.length,
      deletableCount: issues.filter((item) => item.canHardDelete).length,
      protectedCount: issues.filter((item) => !item.canHardDelete).length,
      duplicateCount: issues.filter((item) => item.issueType === 'DUPLICATE').length,
      orphanCount: issues.filter((item) => item.issueType === 'ORPHAN').length,
      inactiveCount: issues.filter((item) => item.issueType === 'INACTIVE').length,
      softDeletedCount: issues.filter((item) => item.issueType === 'SOFT_DELETED').length,
      posInactiveOrderCount: posInactiveOrderIssues.length,
      posOrphanOrderItemCount: posOrphanOrderItemIssues.length,
      posOrphanOrderItemOptionCount: posOrphanOrderItemOptionIssues.length,
      posInvalidProductRelationCount: posInvalidProductRelationIssues.length,
      posInvalidLocationRelationCount: posInvalidLocationRelationIssues.length
    }

    return {
      summary,
      issues
    }

  }

  async cleanDeletableIssues(): Promise<CleanupIssuesCleanResponse> {

    const scanned =
      await this.findCleanupIssues()

    const results: CleanupIssuesCleanResult[] = []
    let deletedCount = 0
    let skippedCount = 0
    let duplicateCleanExecuted = false

    for (const issue of scanned.issues) {

      if (!issue.canHardDelete) {
        skippedCount += 1
        results.push({
          issueType: issue.issueType,
          tableName: issue.tableName,
          targetId: issue.targetId,
          deleted: false,
          skipped: true,
          reason: issue.protectReason ?? 'protected'
        })
        continue
      }

      if (issue.issueType === 'DUPLICATE' && issue.tableName === 'profile_blocks') {
        if (!duplicateCleanExecuted) {
          await this.cleanDuplicateProfileBlocks()
          duplicateCleanExecuted = true
        }

        deletedCount += 1
        results.push({
          issueType: issue.issueType,
          tableName: issue.tableName,
          targetId: issue.targetId,
          deleted: true,
          skipped: false,
          reason: null
        })
        continue
      }

      const decision =
        this.canHardDeleteIssue(issue)

      if (!decision.canHardDelete) {
        skippedCount += 1
        results.push({
          issueType: issue.issueType,
          tableName: issue.tableName,
          targetId: issue.targetId,
          deleted: false,
          skipped: true,
          reason: decision.protectReason ?? 'protected'
        })
        continue
      }

      const deleted =
        this.deleteIssue(issue)

      if (deleted) {
        deletedCount += 1
      } else {
        skippedCount += 1
      }

      results.push({
        issueType: issue.issueType,
        tableName: issue.tableName,
        targetId: issue.targetId,
        deleted,
        skipped: !deleted,
        reason: deleted ? null : 'delete skipped'
      })

    }

    return {
      success: true,
      deletedCount,
      skippedCount,
      results
    }

  }

  async clearDevPosInactiveOrders(): Promise<ClearDevPosInactiveOrdersResponse> {
    const clearTransaction = this.db.transaction(() => {
      const inactiveOrders = this.db.prepare(`
        SELECT id
        FROM pos_orders
        WHERE isActive = 0
          AND paymentStatus = 'UNPAID'
      `).all() as Array<{ id: number }>

      const orderIds =
        inactiveOrders.map((row) => Number(row.id)).filter((id) => Number.isInteger(id) && id > 0)

      if (orderIds.length < 1) {
        return {
          ok: true as const,
          deletedOrders: 0,
          deletedOrderItems: 0,
          deletedOrderItemOptions: 0
        }
      }

      const orderIdPlaceholders =
        orderIds.map(() => '?').join(',')

      const orderItems = this.db.prepare(`
        SELECT id
        FROM pos_order_items
        WHERE orderId IN (${orderIdPlaceholders})
      `).all(...orderIds) as Array<{ id: number }>

      const orderItemIds =
        orderItems.map((row) => Number(row.id)).filter((id) => Number.isInteger(id) && id > 0)

      let deletedOrderItemOptions = 0
      if (orderItemIds.length > 0) {
        const orderItemIdPlaceholders =
          orderItemIds.map(() => '?').join(',')

        const optionsDeleteResult = this.db.prepare(`
          DELETE FROM pos_order_item_options
          WHERE orderItemId IN (${orderItemIdPlaceholders})
        `).run(...orderItemIds)

        deletedOrderItemOptions = Number(optionsDeleteResult.changes || 0)
      }

      const itemsDeleteResult = this.db.prepare(`
        DELETE FROM pos_order_items
        WHERE orderId IN (${orderIdPlaceholders})
      `).run(...orderIds)

      const ordersDeleteResult = this.db.prepare(`
        DELETE FROM pos_orders
        WHERE id IN (${orderIdPlaceholders})
          AND isActive = 0
          AND paymentStatus = 'UNPAID'
      `).run(...orderIds)

      return {
        ok: true as const,
        deletedOrders: Number(ordersDeleteResult.changes || 0),
        deletedOrderItems: Number(itemsDeleteResult.changes || 0),
        deletedOrderItemOptions
      }
    })

    return clearTransaction()
  }

  /* ==================================================
  SECTION 11 : ISSUE HELPER
  ================================================== */

  private async findDuplicateProfileBlockIssues(): Promise<CleanupIssueItem[]> {
    const duplicateGroups = await this.findDuplicateProfileBlocks() as Array<{
      profileId: number
      sortOrder: number
      count: number
    }>

    return duplicateGroups.map((group) => ({
      issueId: `DUPLICATE:profile_blocks:${group.profileId}:${group.sortOrder}`,
      issueType: 'DUPLICATE',
      tableName: 'profile_blocks',
      targetId: `${group.profileId}:${group.sortOrder}`,
      displayName: `profileId=${group.profileId}, slot=${group.sortOrder}`,
      channelCode: null,
      description: `duplicate profile_blocks count=${group.count}`,
      referenceCount: group.count,
      canHardDelete: true,
      protectReason: null,
      createdAt: null,
      updatedAt: null,
      deletedAt: null
    }))
  }

  private async findDeletedPosLocationIssues(): Promise<CleanupIssueItem[]> {
    const scanned = await this.findDeletedPosTableLocations()

    return scanned.items.map((item) => {
      const issueType: CleanupIssueType =
        item.deletedAt ? 'SOFT_DELETED' : 'INACTIVE'

      const referenceStats =
        this.getPosLocationReferenceStats(item.id)

      const canHardDelete =
        referenceStats.blockingCount === 0

      const protectReason =
        canHardDelete
          ? null
          : 'referenced by non-finalized pos_orders'

      return {
        issueId: `${issueType}:pos_locations:${item.id}`,
        issueType,
        tableName: 'pos_locations',
        targetId: item.id,
        displayName: item.locationName,
        channelCode: item.channelCode,
        description: `TABLE location (${item.locationGroupName ?? '-'} / ${item.tableOptionName ?? '-'})`,
        referenceCount: referenceStats.totalCount,
        canHardDelete,
        protectReason,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt
      }
    })
  }

  private async findOrphanImageAssetIssues(): Promise<CleanupIssueItem[]> {
    const scanned = await this.findOrphanImageAssets()

    return scanned.items.map((item) => ({
      issueId: `ORPHAN:image_assets:${item.id}`,
      issueType: 'ORPHAN',
      tableName: 'image_assets',
      targetId: item.id,
      displayName: item.fileName,
      channelCode: item.channelCode,
      description: `orphan media asset (${item.usageType})`,
      referenceCount: 0,
      canHardDelete: false,
      protectReason: 'media file cleanup requires separate media cleanup policy',
      createdAt: item.createdAt,
      updatedAt: null,
      deletedAt: null
    }))
  }

  private async findInactiveRowIssues(): Promise<CleanupIssueItem[]> {
    const scanned = await this.findInactiveRows()
    const issues: CleanupIssueItem[] = []

    for (const group of scanned.tables) {
      for (const item of group.items) {
        if (group.tableName === 'pos_locations' || group.tableName === 'image_assets') {
          continue
        }

        issues.push({
          issueId: `INACTIVE:${group.tableName}:${item.id}`,
          issueType: 'INACTIVE',
          tableName: group.tableName,
          targetId: item.id,
          displayName: item.displayName,
          channelCode: item.channelCode,
          description: 'inactive row detected',
          referenceCount: item.referenceCount,
          canHardDelete: item.canHardDelete,
          protectReason: item.protectReason,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          deletedAt: item.deletedAt
        })
      }
    }

    return issues
  }

  private async findPosInactiveOrderIssues(): Promise<CleanupIssueItem[]> {
    const rows = this.db.prepare(`
      SELECT
        o.id,
        o.orderCode,
        o.providerChannelCode,
        o.createdAt,
        o.updatedAt
      FROM pos_orders o
      WHERE o.isActive = 0
      ORDER BY o.id DESC
    `).all() as Array<{
      id: number
      orderCode: string | null
      providerChannelCode: string | null
      createdAt: string | null
      updatedAt: string | null
    }>

    return rows.map((row) => ({
      issueId: `INACTIVE:pos_orders:${row.id}`,
      issueType: 'INACTIVE',
      tableName: 'pos_orders',
      targetId: row.id,
      displayName: row.orderCode ?? `order:${row.id}`,
      channelCode: row.providerChannelCode ?? null,
      description: 'isActive=0 주문 이력입니다. 결제/계산 대상에서는 제외되지만 이력 보존 대상입니다.',
      referenceCount: 0,
      canHardDelete: false,
      protectReason: 'POS inactive history',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: null
    }))
  }

  private async findPosOrphanOrderItemIssues(): Promise<CleanupIssueItem[]> {
    const rows = this.db.prepare(`
      SELECT
        i.id,
        i.orderCode,
        i.providerChannelCode,
        i.createdAt
      FROM pos_order_items i
      LEFT JOIN pos_orders o
        ON o.id = i.orderId
      WHERE o.id IS NULL
      ORDER BY i.id DESC
    `).all() as Array<{
      id: number
      orderCode: string | null
      providerChannelCode: string | null
      createdAt: string | null
    }>

    return rows.map((row) => ({
      issueId: `ORPHAN:pos_order_items:${row.id}`,
      issueType: 'ORPHAN',
      tableName: 'pos_order_items',
      targetId: row.id,
      displayName: row.orderCode ?? `order_item:${row.id}`,
      channelCode: row.providerChannelCode ?? null,
      description: '부모 pos_orders row가 없는 주문 상세입니다.',
      referenceCount: 0,
      canHardDelete: true,
      protectReason: null,
      createdAt: row.createdAt,
      updatedAt: null,
      deletedAt: null
    }))
  }

  private async findPosOrphanOrderItemOptionIssues(): Promise<CleanupIssueItem[]> {
    const rows = this.db.prepare(`
      SELECT
        opt.id,
        opt.providerChannelCode,
        opt.createdAt
      FROM pos_order_item_options opt
      LEFT JOIN pos_order_items i
        ON i.id = opt.orderItemId
      WHERE i.id IS NULL
      ORDER BY opt.id DESC
    `).all() as Array<{
      id: number
      providerChannelCode: string | null
      createdAt: string | null
    }>

    return rows.map((row) => ({
      issueId: `ORPHAN:pos_order_item_options:${row.id}`,
      issueType: 'ORPHAN',
      tableName: 'pos_order_item_options',
      targetId: row.id,
      displayName: `order_item_option:${row.id}`,
      channelCode: row.providerChannelCode ?? null,
      description: '부모 pos_order_items row가 없는 주문 옵션 상세입니다.',
      referenceCount: 0,
      canHardDelete: true,
      protectReason: null,
      createdAt: row.createdAt,
      updatedAt: null,
      deletedAt: null
    }))
  }

  private async findPosInvalidProductRelationIssues(): Promise<CleanupIssueItem[]> {
    const rows = this.db.prepare(`
      SELECT
        p.id,
        p.productName,
        p.channelCode,
        p.createdAt,
        p.updatedAt
      FROM pos_products p
      LEFT JOIN pos_product_categories c
        ON c.id = p.categoryId
      WHERE p.categoryId IS NOT NULL
        AND c.id IS NULL
      ORDER BY p.id DESC
    `).all() as Array<{
      id: number
      productName: string | null
      channelCode: string | null
      createdAt: string | null
      updatedAt: string | null
    }>

    return rows.map((row) => ({
      issueId: `ORPHAN:pos_products:${row.id}`,
      issueType: 'ORPHAN',
      tableName: 'pos_products',
      targetId: row.id,
      displayName: row.productName ?? `product:${row.id}`,
      channelCode: row.channelCode ?? null,
      description: 'categoryId가 존재하지만 연결된 pos_product_categories가 없습니다. 수동 검토 권장.',
      referenceCount: 0,
      canHardDelete: false,
      protectReason: 'manual review required for invalid product-category relation',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: null
    }))
  }

  private async findPosInvalidLocationRelationIssues(): Promise<CleanupIssueItem[]> {
    const rows = this.db.prepare(`
      SELECT
        l.id,
        l.locationName,
        l.channelCode,
        l.createdAt,
        l.updatedAt,
        l.deletedAt
      FROM pos_locations l
      LEFT JOIN profiles p
        ON p.id = l.profileId
      WHERE p.id IS NULL
      ORDER BY l.id DESC
    `).all() as Array<{
      id: number
      locationName: string | null
      channelCode: string | null
      createdAt: string | null
      updatedAt: string | null
      deletedAt: string | null
    }>

    return rows.map((row) => ({
      issueId: `ORPHAN:pos_locations:${row.id}:invalid_profile`,
      issueType: 'ORPHAN',
      tableName: 'pos_locations',
      targetId: row.id,
      displayName: row.locationName ?? `location:${row.id}`,
      channelCode: row.channelCode ?? null,
      description: 'profileId가 존재하지 않는 POS 위치 row입니다.',
      referenceCount: 0,
      canHardDelete: true,
      protectReason: null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt
    }))
  }

  private async findProfileDeliveryAddressSoftDeletedIssues(): Promise<CleanupIssueItem[]> {
    if (!this.tableExists('profile_delivery_addresses')) {
      return []
    }

    const rows = this.db.prepare(`
      SELECT
        id,
        profileId,
        channelCode,
        label,
        deliveryAddress,
        isActive,
        createdAt,
        updatedAt
      FROM profile_delivery_addresses
      WHERE COALESCE(isActive, 1) = 0
      ORDER BY id DESC
    `).all() as Array<{
      id: number
      profileId: number | null
      channelCode: string | null
      label: string | null
      deliveryAddress: string | null
      isActive: number | null
      createdAt: string | null
      updatedAt: string | null
    }>

    return rows.map((row) => {
      const label =
        (row.label || '').trim()
      const deliveryAddress =
        (row.deliveryAddress || '').trim()

      const displayName =
        label.length > 0
          ? label
          : deliveryAddress.length > 0
            ? deliveryAddress
            : `delivery_address:${row.id}`

      const descriptionParts: string[] = [
        '배송주소 soft deleted row입니다. 개인정보/주문 연결 가능성이 있어 hard delete 보호 대상입니다.'
      ]

      if (row.profileId !== null && row.profileId !== undefined) {
        descriptionParts.push(`profileId=${row.profileId}`)
      }

      if (row.channelCode) {
        descriptionParts.push(`channelCode=${row.channelCode}`)
      }

      if (label.length > 0) {
        descriptionParts.push(`label=${label}`)
      }

      if (deliveryAddress.length > 0) {
        descriptionParts.push(`address=${deliveryAddress}`)
      }

      descriptionParts.push(`isActive=${Number(row.isActive ?? 0)}`)

      return {
        issueId: `SOFT_DELETED:profile_delivery_addresses:${row.id}`,
        issueType: 'SOFT_DELETED' as const,
        tableName: 'profile_delivery_addresses',
        targetId: row.id,
        displayName,
        channelCode: row.channelCode ?? null,
        description: descriptionParts.join(' / '),
        referenceCount: 0,
        canHardDelete: false,
        protectReason: 'profile delivery address history is protected from hard delete',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: null
      }
    })
  }

  private canHardDeleteIssue(issue: CleanupIssueItem): {
    canHardDelete: boolean
    protectReason: string | null
  } {
    if (!issue.canHardDelete) {
      return {
        canHardDelete: false,
        protectReason: issue.protectReason ?? 'protected'
      }
    }

    if (issue.tableName === 'image_assets') {
      return {
        canHardDelete: false,
        protectReason: 'media file cleanup requires separate media cleanup policy'
      }
    }

    if (issue.tableName === 'pos_orders') {
      return {
        canHardDelete: false,
        protectReason: 'protected transaction table'
      }
    }

    if (issue.tableName === 'pos_order_items') {
      if (issue.issueType === 'ORPHAN') {
        return {
          canHardDelete: true,
          protectReason: null
        }
      }

      return {
        canHardDelete: false,
        protectReason: 'protected transaction table'
      }
    }

    if (issue.tableName === 'pos_order_item_options') {
      if (issue.issueType === 'ORPHAN') {
        return {
          canHardDelete: true,
          protectReason: null
        }
      }

      return {
        canHardDelete: false,
        protectReason: 'protected transaction table'
      }
    }

    if (
      issue.tableName === 'users' ||
      issue.tableName === 'profiles'
    ) {
      return {
        canHardDelete: false,
        protectReason: 'protected table'
      }
    }

    return {
      canHardDelete: true,
      protectReason: null
    }
  }

  private deleteIssue(issue: CleanupIssueItem): boolean {
    if (typeof issue.targetId !== 'number') {
      return false
    }

    if (issue.tableName === 'pos_locations') {
      if (issue.issueType === 'ORPHAN') {
        const invalidProfileRow = this.db.prepare(`
          SELECT COUNT(*) AS count
          FROM profiles
          WHERE id = (
            SELECT profileId
            FROM pos_locations
            WHERE id = ?
          )
        `).get(issue.targetId) as { count?: number } | undefined

        if (Number(invalidProfileRow?.count || 0) > 0) {
          return false
        }
      }

      const referenceStats =
        this.getPosLocationReferenceStats(issue.targetId)

      if (referenceStats.blockingCount > 0) {
        return false
      }

      this.detachPosOrdersFromLocation(issue.targetId)
    }

    if (issue.tableName === 'pos_order_items') {
      const result = this.db.prepare(`
        DELETE FROM pos_order_items
        WHERE id = ?
          AND NOT EXISTS (
            SELECT 1
            FROM pos_orders
            WHERE pos_orders.id = pos_order_items.orderId
          )
      `).run(issue.targetId)

      return Number(result.changes || 0) > 0
    }

    if (issue.tableName === 'pos_order_item_options') {
      const result = this.db.prepare(`
        DELETE FROM pos_order_item_options
        WHERE id = ?
          AND NOT EXISTS (
            SELECT 1
            FROM pos_order_items
            WHERE pos_order_items.id = pos_order_item_options.orderItemId
          )
      `).run(issue.targetId)

      return Number(result.changes || 0) > 0
    }

    return this.deleteInactiveRow(issue.tableName, issue.targetId)
  }

  /* ==================================================
  SECTION 12 : INACTIVE ROWS HELPER
  ================================================== */

  private tableExists(tableName: string): boolean {
    const row = this.db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
      LIMIT 1
    `).get(tableName) as { name?: string } | undefined

    return Boolean(row?.name)
  }

  private tableHasColumn(tableName: string, columnName: string): boolean {
    const columns = this.db.prepare(
      `PRAGMA table_info(${tableName})`
    ).all() as Array<{ name?: string }>

    return columns.some((column) => column.name === columnName)
  }

  private getInactiveRowsForTable(tableName: string): InactiveRowItem[] {
    if (!INACTIVE_CLEANUP_TABLES.includes(tableName as (typeof INACTIVE_CLEANUP_TABLES)[number])) {
      return []
    }

    if (!this.tableExists(tableName) || !this.tableHasColumn(tableName, 'isActive')) {
      return []
    }

    const hasDeletedAt = this.tableHasColumn(tableName, 'deletedAt')
    const hasCreatedAt = this.tableHasColumn(tableName, 'createdAt')
    const hasUpdatedAt = this.tableHasColumn(tableName, 'updatedAt')

    const displayColumnCandidates = ['locationName', 'name', 'displayName', 'title', 'code', 'fileName'] as const
    const channelColumnCandidates = ['channelCode', 'providerChannelCode', 'authorChannelCode', 'actorChannelCode'] as const

    const displayColumn = displayColumnCandidates.find((column) => this.tableHasColumn(tableName, column))
    const channelColumn = channelColumnCandidates.find((column) => this.tableHasColumn(tableName, column))

    const sql = `
      SELECT
        id,
        ${displayColumn ? `${displayColumn} AS displayName` : 'NULL AS displayName'},
        ${channelColumn ? `${channelColumn} AS channelCode` : 'NULL AS channelCode'},
        isActive,
        ${hasDeletedAt ? 'deletedAt' : 'NULL AS deletedAt'},
        ${hasCreatedAt ? 'createdAt' : 'NULL AS createdAt'},
        ${hasUpdatedAt ? 'updatedAt' : 'NULL AS updatedAt'}
      FROM ${tableName}
      WHERE isActive = 0
      ORDER BY id DESC
    `

    const rows = this.db.prepare(sql).all() as Array<{
      id: number
      displayName?: string | null
      channelCode?: string | null
      isActive: number
      deletedAt?: string | null
      createdAt?: string | null
      updatedAt?: string | null
    }>

    return rows.map((row) => {
      const decision = this.canHardDeleteInactiveRow(tableName, row.id)

      return {
        tableName,
        id: row.id,
        displayName: row.displayName ?? null,
        channelCode: row.channelCode ?? null,
        isActive: Number(row.isActive || 0),
        deletedAt: row.deletedAt ?? null,
        createdAt: row.createdAt ?? null,
        updatedAt: row.updatedAt ?? null,
        referenceCount: decision.referenceCount,
        canHardDelete: decision.canHardDelete,
        protectReason: decision.protectReason
      }
    })
  }

  private canHardDeleteInactiveRow(
    tableName: string,
    id: number
  ): {
    canHardDelete: boolean
    referenceCount: number
    protectReason: string | null
  } {
    if (INACTIVE_PROTECTED_TABLES.includes(tableName as (typeof INACTIVE_PROTECTED_TABLES)[number])) {
      return {
        canHardDelete: false,
        referenceCount: 0,
        protectReason: 'protected audit/transaction/auth table'
      }
    }

    if (tableName === 'image_assets') {
      return {
        canHardDelete: false,
        referenceCount: 0,
        protectReason: 'media file cleanup requires separate media cleanup policy'
      }
    }

    if (tableName === 'pos_locations') {
      const referenceStats =
        this.getPosLocationReferenceStats(id)

      return {
        canHardDelete: referenceStats.blockingCount === 0,
        referenceCount: referenceStats.totalCount,
        protectReason:
          referenceStats.blockingCount > 0
            ? 'referenced by non-finalized pos_orders'
            : null
      }
    }

    if (tableName === 'pos_product_categories') {
      const row = this.db.prepare(`
        SELECT COUNT(*) AS count
        FROM pos_products
        WHERE categoryId = ?
      `).get(id) as { count?: number } | undefined

      const referenceCount = Number(row?.count || 0)

      return {
        canHardDelete: referenceCount === 0,
        referenceCount,
        protectReason: referenceCount > 0 ? 'referenced by pos_products' : null
      }
    }

    if (tableName === 'pos_menu_configs') {
      return {
        canHardDelete: false,
        referenceCount: 0,
        protectReason: 'menu config cleanup policy not enabled'
      }
    }

    return {
      canHardDelete: false,
      referenceCount: 0,
      protectReason: 'master table cleanup policy not enabled'
    }
  }

  private deleteInactiveRow(
    tableName: string,
    id: number
  ): boolean {
    if (!INACTIVE_CLEANUP_TABLES.includes(tableName as (typeof INACTIVE_CLEANUP_TABLES)[number])) {
      return false
    }

    if (tableName === 'pos_locations') {
      const referenceStats =
        this.getPosLocationReferenceStats(id)

      if (referenceStats.blockingCount > 0) {
        return false
      }

      this.detachPosOrdersFromLocation(id)
    }

    const result = this.db.prepare(`
      DELETE FROM ${tableName}
      WHERE id = ?
        AND isActive = 0
    `).run(id)

    return Number(result.changes || 0) > 0
  }

  private getPosLocationReferenceStats(
    locationId: number
  ): PosLocationReferenceStats {
    const row = this.db.prepare(`
      SELECT
        COUNT(*) AS totalCount,
        SUM(
          CASE
            WHEN COALESCE(paymentStatus, '') = 'PAID' THEN 0
            ELSE 1
          END
        ) AS blockingCount
      FROM pos_orders
      WHERE locationId = ?
    `).get(locationId) as {
      totalCount?: number
      blockingCount?: number
    } | undefined

    return {
      totalCount: Number(row?.totalCount || 0),
      blockingCount: Number(row?.blockingCount || 0)
    }
  }

  private detachPosOrdersFromLocation(
    locationId: number
  ) {
    this.db.prepare(`
      UPDATE pos_orders
      SET locationId = NULL
      WHERE locationId = ?
        AND COALESCE(paymentStatus, '') = 'PAID'
    `).run(locationId)
  }


  /* ==================================================
  SECTION 13 : FULL CLEANUP
  ================================================== */

  async fullCleanup() {

    // 1. 중복 제거
    await this.cleanDuplicateProfileBlocks()

    // 2. orphan 조회
    const orphans = this.db.prepare(`
      SELECT ia.id
      FROM image_assets ia
      LEFT JOIN profile_avatars pa ON pa.imageAssetId = ia.id
      LEFT JOIN profile_hero_images ph ON ph.imageAssetId = ia.id
      LEFT JOIN post_images pi ON pi.imageAssetId = ia.id
      WHERE pa.id IS NULL
      AND ph.id IS NULL
      AND pi.id IS NULL
    `).all()

    // 3. 삭제
    const deleteStmt =
      this.db.prepare(`DELETE FROM image_assets WHERE id = ?`)

    for (const row of orphans) {
      deleteStmt.run(row.id)
    }

    return {
      success: true,
      deleted: orphans.length
    }

  }

}

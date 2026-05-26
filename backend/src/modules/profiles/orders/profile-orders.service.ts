import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import db from '../../../config/database'
import {
  ProfileCartItem,
  ProfileOrderDetail,
  ProfileOrderItem,
  ProfileOrdersContext,
  ProfileOrdersSummary
} from './profile-orders.types'

type AuthUser = {
  id?: number
  userId?: number
  profileId?: number
  profileType?: 'GENERAL' | 'BUSINESS'
  channelCode?: string
}

@Injectable()
export class ProfileOrdersService {
  private toInt(value: unknown, fallback = 0): number {
    const n = Number(value)
    if (!Number.isFinite(n)) {
      return fallback
    }
    return Math.max(0, Math.trunc(n))
  }

  private getContext(user?: AuthUser): ProfileOrdersContext {
    const userId = this.toInt(user?.id ?? user?.userId)
    const profileId = this.toInt(user?.profileId)
    const profileType = String(user?.profileType ?? '').trim().toUpperCase()
    const channelCode = String(user?.channelCode ?? '').trim().toUpperCase()

    if (!userId || !profileId || !channelCode) {
      throw new UnauthorizedException('invalid auth context')
    }

    if (profileType !== 'GENERAL') {
      throw new ForbiddenException('GENERAL profile only')
    }

    const profile = db.prepare(
      `
        SELECT id, userId, profileType, channelCode
        FROM profiles
        WHERE id = ?
          AND userId = ?
          AND channelCode = ?
          AND profileType = 'GENERAL'
        LIMIT 1
      `
    ).get(profileId, userId, channelCode) as
      | { id: number; userId: number; profileType: 'GENERAL'; channelCode: string }
      | undefined

    if (!profile?.id) {
      throw new ForbiddenException('GENERAL profile context not found')
    }

    return {
      userId: profile.userId,
      profileId: profile.id,
      profileType: profile.profileType,
      channelCode: profile.channelCode
    }
  }

  getMyOrdersSummary(user?: AuthUser): { ok: true; summary: ProfileOrdersSummary } {
    const context = this.getContext(user)

    const cartRow = db.prepare(
      `
        SELECT COUNT(*) AS count
        FROM cart_items
        WHERE customerChannelCode = ?
          AND cartStatus = 'ACTIVE'
      `
    ).get(context.channelCode) as { count?: number } | undefined

    const orderRow = db.prepare(
      `
        SELECT
          COUNT(*) AS totalCount,
          SUM(
            CASE
              WHEN UPPER(orderStatus) IN (
                'CREATED',
                'PENDING',
                'PAID',
                'ACCEPTED',
                'COOKING',
                'DELIVERING',
                'CONFIRMED',
                'PREPARING',
                'READY'
              )
              THEN 1
              ELSE 0
            END
          ) AS activeCount,
          SUM(
            CASE
              WHEN UPPER(orderStatus) = 'COMPLETED'
              THEN 1
              ELSE 0
            END
          ) AS completedCount
        FROM pos_orders
        WHERE customerChannelCode = ?
          AND COALESCE(isActive, 1) = 1
      `
    ).get(context.channelCode) as
      | { totalCount?: number; activeCount?: number; completedCount?: number }
      | undefined

    const cartItemCount = this.toInt(cartRow?.count, 0)
    const orderCount = this.toInt(orderRow?.totalCount, 0)
    const activeOrderCount = this.toInt(orderRow?.activeCount, 0)
    const completedOrderCount = this.toInt(orderRow?.completedCount, 0)

    return {
      ok: true,
      summary: {
        totalCount: cartItemCount + orderCount,
        cartItemCount,
        orderCount,
        activeOrderCount,
        completedOrderCount
      }
    }
  }

  getMyCartItems(user?: AuthUser): { ok: true; items: ProfileCartItem[] } {
    const context = this.getContext(user)

    const rows = db.prepare(
      `
        SELECT
          ci.id,
          ci.cartCode,
          ci.cartItemCode,
          ci.providerChannelCode,
          COALESCE(pp.channelName, pp.displayName, ci.providerChannelCode) AS providerName,
          COALESCE(ci.sourceType, 'POS_PRODUCT') AS sourceType,
          COALESCE(ci.orderFlowType, 'DELIVERY') AS orderFlowType,
          ci.productNameSnapshot,
          (
            SELECT ia.filePath
            FROM pos_product_thumbnails t
            INNER JOIN image_assets ia
              ON ia.id = t.imageAssetId
            WHERE t.productId = ci.productId
              AND COALESCE(t.isActive, 1) = 1
            ORDER BY COALESCE(t.sortOrder, 999999) ASC, t.id ASC
            LIMIT 1
          ) AS thumbnailFilePath,
          COALESCE(ci.quantity, 0) AS quantity,
          COALESCE(ci.lineTotalAmount, 0) AS lineTotalAmount,
          ci.createdAt
        FROM cart_items ci
        LEFT JOIN profiles pp
          ON pp.channelCode = ci.providerChannelCode
        WHERE ci.customerChannelCode = ?
          AND ci.cartStatus = 'ACTIVE'
        ORDER BY ci.createdAt DESC, ci.id DESC
      `
    ).all(context.channelCode) as Array<{
      id: number
      cartCode: string | null
      cartItemCode: string | null
      providerChannelCode: string
      providerName: string
      sourceType: 'POS_PRODUCT' | 'MARKET_PRODUCT'
      orderFlowType: string
      productNameSnapshot: string
      thumbnailFilePath: string | null
      quantity: number
      lineTotalAmount: number
      createdAt: string | null
    }>

    return {
      ok: true,
      items: rows.map((row) => ({
        id: row.id,
        cartCode: row.cartCode ?? null,
        cartItemCode: row.cartItemCode ?? null,
        providerChannelCode: row.providerChannelCode,
        providerName: row.providerName,
        thumbnailFilePath: row.thumbnailFilePath ?? null,
        sourceType: row.sourceType,
        orderFlowType: row.orderFlowType,
        productNameSnapshot: row.productNameSnapshot,
        quantity: this.toInt(row.quantity, 0),
        lineTotalAmount: this.toInt(row.lineTotalAmount, 0),
        createdAt: row.createdAt ?? null
      }))
    }
  }

  getMyOrders(user?: AuthUser): { ok: true; items: ProfileOrderItem[] } {
    const context = this.getContext(user)

    const rows = db.prepare(
      `
        SELECT
          o.id,
          o.orderCode,
          o.providerChannelCode,
          COALESCE(pp.channelName, pp.displayName, o.providerChannelCode) AS providerName,
          COALESCE(
            (
              SELECT poi.sourceType
              FROM pos_order_items poi
              WHERE poi.orderId = o.id
              ORDER BY poi.id ASC
              LIMIT 1
            ),
            'POS_PRODUCT'
          ) AS sourceType,
          o.orderFlowType,
          o.orderStatus,
          COALESCE(o.totalAmount, 0) AS totalAmount,
          o.createdAt,
          COALESCE(
            (
              SELECT GROUP_CONCAT(itemLabel, ', ')
              FROM (
                SELECT (poi.productNameSnapshot || ' x' || poi.quantity) AS itemLabel
                FROM pos_order_items poi
                WHERE poi.orderId = o.id
                ORDER BY poi.sortOrder ASC, poi.id ASC
                LIMIT 2
              )
            ),
            ''
          ) AS itemSummary
        FROM pos_orders o
        LEFT JOIN profiles pp
          ON pp.channelCode = o.providerChannelCode
        WHERE o.customerChannelCode = ?
          AND COALESCE(o.isActive, 1) = 1
        ORDER BY o.createdAt DESC, o.id DESC
      `
    ).all(context.channelCode) as Array<{
      id: number
      orderCode: string
      providerChannelCode: string
      providerName: string
      sourceType: 'POS_PRODUCT' | 'MARKET_PRODUCT'
      orderFlowType: string
      orderStatus: string
      totalAmount: number
      createdAt: string | null
      itemSummary: string
    }>

    return {
      ok: true,
      items: rows.map((row) => ({
        id: row.id,
        orderCode: row.orderCode,
        providerChannelCode: row.providerChannelCode,
        providerName: row.providerName,
        sourceType: row.sourceType,
        orderFlowType: row.orderFlowType,
        orderStatus: row.orderStatus,
        totalAmount: this.toInt(row.totalAmount, 0),
        createdAt: row.createdAt ?? null,
        itemSummary: row.itemSummary ?? ''
      }))
    }
  }

  getMyOrderDetail(user: AuthUser | undefined, orderId: number): { ok: true; item: ProfileOrderDetail } {
    const context = this.getContext(user)
    const normalizedOrderId = this.toInt(orderId, 0)

    if (!normalizedOrderId) {
      throw new NotFoundException('order not found')
    }

    const row = db.prepare(
      `
        SELECT
          o.id,
          o.orderCode,
          o.providerChannelCode,
          COALESCE(pp.channelName, pp.displayName, o.providerChannelCode) AS providerName,
          COALESCE(
            (
              SELECT poi.sourceType
              FROM pos_order_items poi
              WHERE poi.orderId = o.id
              ORDER BY poi.id ASC
              LIMIT 1
            ),
            'POS_PRODUCT'
          ) AS sourceType,
          o.orderFlowType,
          o.orderStatus,
          COALESCE(o.totalAmount, 0) AS totalAmount,
          o.createdAt
        FROM pos_orders o
        LEFT JOIN profiles pp
          ON pp.channelCode = o.providerChannelCode
        WHERE o.id = ?
          AND o.customerChannelCode = ?
          AND COALESCE(o.isActive, 1) = 1
        LIMIT 1
      `
    ).get(normalizedOrderId, context.channelCode) as
      | {
          id: number
          orderCode: string
          providerChannelCode: string
          providerName: string
          sourceType: 'POS_PRODUCT' | 'MARKET_PRODUCT'
          orderFlowType: string
          orderStatus: string
          totalAmount: number
          createdAt: string | null
        }
      | undefined

    if (!row?.id) {
      throw new NotFoundException('order not found')
    }

    const itemRows = db.prepare(
      `
        SELECT
          id,
          productNameSnapshot,
          COALESCE(unitPriceSnapshot, 0) AS unitPrice,
          COALESCE(quantity, 0) AS quantity,
          COALESCE(lineTotalAmount, 0) AS lineTotalAmount
        FROM pos_order_items
        WHERE orderId = ?
        ORDER BY sortOrder ASC, id ASC
      `
    ).all(row.id) as Array<{
      id: number
      productNameSnapshot: string
      unitPrice: number
      quantity: number
      lineTotalAmount: number
    }>

    const optionRows = db.prepare(
      `
        SELECT
          o.orderItemId,
          o.optionNameSnapshot,
          COALESCE(o.quantity, 0) AS quantity,
          COALESCE(o.priceDeltaSnapshot, 0) AS priceDeltaSnapshot
        FROM pos_order_item_options o
        INNER JOIN pos_order_items i
          ON i.id = o.orderItemId
        WHERE i.orderId = ?
        ORDER BY o.orderItemId ASC, o.id ASC
      `
    ).all(row.id) as Array<{
      orderItemId: number
      optionNameSnapshot: string
      quantity: number
      priceDeltaSnapshot: number
    }>

    const optionsByItemId = new Map<number, Array<{
      optionName: string
      optionQuantity: number
      optionPrice: number
    }>>()

    optionRows.forEach((option) => {
      const list = optionsByItemId.get(option.orderItemId) ?? []
      list.push({
        optionName: option.optionNameSnapshot || '-',
        optionQuantity: this.toInt(option.quantity, 0),
        optionPrice: this.toInt(option.priceDeltaSnapshot, 0)
      })
      optionsByItemId.set(option.orderItemId, list)
    })

    return {
      ok: true,
      item: {
        id: row.id,
        orderCode: row.orderCode,
        providerChannelCode: row.providerChannelCode,
        providerName: row.providerName,
        storeName: row.providerName,
        sourceType: row.sourceType,
        orderFlowType: row.orderFlowType,
        orderStatus: row.orderStatus,
        totalAmount: this.toInt(row.totalAmount, 0),
        createdAt: row.createdAt ?? null,
        orderedAt: row.createdAt ?? null,
        items: itemRows.map((item) => ({
          id: item.id,
          itemName: item.productNameSnapshot,
          unitPrice: this.toInt(item.unitPrice, 0),
          productNameSnapshot: item.productNameSnapshot,
          quantity: this.toInt(item.quantity, 0),
          lineTotal: this.toInt(item.lineTotalAmount, 0),
          options: optionsByItemId.get(item.id) ?? [],
          lineTotalAmount: this.toInt(item.lineTotalAmount, 0)
        }))
      }
    }
  }
}

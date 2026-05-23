import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import db from '../../../../../config/database'

import {
  CancelCustomerOrderDto,
  CreateCustomerOrderDto,
  CreateCustomerOrderItemDto,
  CustomerOrderBootstrapQueryDto,
  CustomerOrderDetailQueryDto,
} from './customer-pos-order.dto'
import {
  CustomerOrderBootstrapResponse,
  CustomerOrderCalculationResult,
  CustomerOrderDetailResponse,
  CustomerOrderFlowType,
  CustomerOrderResponse,
  CustomerOrderSource,
  ValidatedOrderProduct,
} from './customer-pos-order.types'

type ProviderProfileRow = {
  id: number
  channelCode: string
  displayName: string | null
}

type PosLocationRow = {
  id: number
  locationName: string
  floor: string | null
  zone: string | null
  resourceStatus: string | null
}

type PosProductRow = {
  id: number
  productId: string | null
  productCode: string | null
  sourceType: 'POS_PRODUCT' | 'MARKET_PRODUCT'
  primaryScanCodeType: string | null
  primaryScanCodeValue: string | null
  primaryQrCodeValue: string | null
  primaryScanCodeSource: string | null
  externalBarcodeFormat: string | null
  productName: string
  productDescription: string | null
  basePrice: number
  categoryId: number | null
  categoryName: string | null
  menuStatus: string
  isSoldOut: number
  showOnTableOrder: number
  allowDineIn: number
  allowTakeout: number
  allowDelivery: number
  productKind: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  thumbnailFilePath: string | null
}

type OptionRow = {
  id: number
  optionName: string
  optionType: string
  isRequired: number
  isMultiple: number
  minSelectCount: number
  maxSelectCount: number
}

type OptionValueRow = {
  id: number
  optionId: number
  optionValueName: string
  priceDelta: number
  isDefault: number
  isVisible: number
  isQuantityEnabled: number
  isQuantityLimitEnabled: number
  minOptionQuantity: number
  maxOptionQuantity: number | null
  defaultOptionQuantity: number
}

type InsertResult = {
  lastInsertRowid: number | bigint
}

const CUSTOMER_ORDER_SOURCE_SET =
  new Set<CustomerOrderSource>([
    'TABLE_ORDER',
    'QR_ORDER',
    'ONLINE',
  ])

const CUSTOMER_ORDER_FLOW_TYPE_SET =
  new Set<CustomerOrderFlowType>([
    'IN_STORE',
    'PICKUP',
    'DELIVERY',
    'RESERVATION',
    'ROOM_SERVICE',
  ])

const ORDER_CODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const ORDER_CODE_LENGTH = 12

@Injectable()
export class CustomerPosOrderService {
  private readonly hasOrderItemRequestMemoSnapshotColumn =
    this.tableHasColumn('pos_order_items', 'requestMemoSnapshot')

  getCustomerOrderBootstrap(
    query: CustomerOrderBootstrapQueryDto
  ): CustomerOrderBootstrapResponse {
    const provider = this.findProviderProfileOrThrow(
      query.providerChannelCode
    )

    const location =
      this.findLocationOrThrow(
        provider.channelCode,
        query.locationId,
        query.tableCode
      )

    const flowType = query.orderFlowType
      ?? 'IN_STORE'

    if (!CUSTOMER_ORDER_FLOW_TYPE_SET.has(flowType)) {
      throw new BadRequestException('orderFlowType이 올바르지 않습니다.')
    }

    const categories = db.prepare(`
      SELECT
        id,
        categoryCode,
        categoryName,
        sortOrder
      FROM pos_product_categories
      WHERE channelCode = ?
        AND deletedAt IS NULL
        AND isActive = 1
      ORDER BY sortOrder ASC, id ASC
    `).all(provider.channelCode) as Array<{
      id: number
      categoryCode: string
      categoryName: string
      sortOrder: number
    }>

    const products = db.prepare(`
      SELECT
        p.id,
        p.productId,
        p.productCode,
        p.sourceType,
        (
          SELECT s.scanCodeType
          FROM pos_product_scan_codes s
          WHERE s.channelCode = p.channelCode
            AND s.productCode = p.productCode
            AND s.isPrimary = 1
            AND s.isActive = 1
            AND s.deletedAt IS NULL
          ORDER BY
            CASE s.scanCodeType
              WHEN 'RAPUS_QR' THEN 1
              WHEN 'RAPUS_BARCODE' THEN 2
              WHEN 'EXTERNAL_BARCODE' THEN 3
              WHEN 'INTERNAL' THEN 4
              ELSE 5
            END ASC,
            s.id DESC
          LIMIT 1
        ) AS primaryScanCodeType,
        (
          SELECT s.scanCodeValue
          FROM pos_product_scan_codes s
          WHERE s.channelCode = p.channelCode
            AND s.productCode = p.productCode
            AND s.isPrimary = 1
            AND s.isActive = 1
            AND s.deletedAt IS NULL
          ORDER BY
            CASE s.scanCodeType
              WHEN 'RAPUS_QR' THEN 1
              WHEN 'RAPUS_BARCODE' THEN 2
              WHEN 'EXTERNAL_BARCODE' THEN 3
              WHEN 'INTERNAL' THEN 4
              ELSE 5
            END ASC,
            s.id DESC
          LIMIT 1
        ) AS primaryScanCodeValue,
        (
          SELECT s.scanCodeValue
          FROM pos_product_scan_codes s
          WHERE s.channelCode = p.channelCode
            AND s.productCode = p.productCode
            AND s.scanCodeType = 'RAPUS_QR'
            AND s.isActive = 1
            AND s.deletedAt IS NULL
          ORDER BY s.id DESC
          LIMIT 1
        ) AS primaryQrCodeValue,
        (
          SELECT s.scanCodeSource
          FROM pos_product_scan_codes s
          WHERE s.channelCode = p.channelCode
            AND s.productCode = p.productCode
            AND s.isPrimary = 1
            AND s.isActive = 1
            AND s.deletedAt IS NULL
          ORDER BY
            CASE s.scanCodeType
              WHEN 'RAPUS_QR' THEN 1
              WHEN 'RAPUS_BARCODE' THEN 2
              WHEN 'EXTERNAL_BARCODE' THEN 3
              WHEN 'INTERNAL' THEN 4
              ELSE 5
            END ASC,
            s.id DESC
          LIMIT 1
        ) AS primaryScanCodeSource,
        (
          SELECT s.externalBarcodeFormat
          FROM pos_product_scan_codes s
          WHERE s.channelCode = p.channelCode
            AND s.productCode = p.productCode
            AND s.isPrimary = 1
            AND s.isActive = 1
            AND s.deletedAt IS NULL
          ORDER BY
            CASE s.scanCodeType
              WHEN 'RAPUS_QR' THEN 1
              WHEN 'RAPUS_BARCODE' THEN 2
              WHEN 'EXTERNAL_BARCODE' THEN 3
              WHEN 'INTERNAL' THEN 4
              ELSE 5
            END ASC,
            s.id DESC
          LIMIT 1
        ) AS externalBarcodeFormat,
        p.productName,
        p.productDescription,
        p.basePrice,
        p.categoryId,
        c.categoryName,
        p.menuStatus,
        p.isSoldOut,
        p.showOnTableOrder,
        p.allowDineIn,
        p.allowTakeout,
        p.allowDelivery,
        p.productKind,
        (
          SELECT a.filePath
          FROM pos_product_thumbnails t
          INNER JOIN image_assets a
            ON a.id = t.imageAssetId
          WHERE t.channelCode = p.channelCode
            AND t.productId = p.id
            AND t.isActive = 1
          ORDER BY t.sortOrder ASC, t.id DESC
          LIMIT 1
        ) AS thumbnailFilePath
      FROM pos_products p
      LEFT JOIN pos_product_categories c
        ON c.id = p.categoryId
      WHERE p.channelCode = ?
        AND p.deletedAt IS NULL
        AND p.isActive = 1
        AND p.menuStatus = 'ON_SALE'
        AND p.isSoldOut = 0
        AND p.showOnTableOrder = 1
      ORDER BY p.sortOrder ASC, p.id ASC
    `).all(provider.channelCode) as PosProductRow[]

    const filteredProducts =
      products.filter((product) =>
        this.isProductAllowedByFlowType(product, flowType)
      )

    const productIds =
      filteredProducts.map((product) => product.id)

    const optionRows =
      productIds.length < 1
        ? []
        : db.prepare(`
            SELECT
              id,
              productId,
              optionName,
              optionType,
              isRequired,
              isMultiple,
              minSelectCount,
              maxSelectCount
            FROM pos_product_options
            WHERE channelCode = ?
              AND isActive = 1
              AND deletedAt IS NULL
              AND productId IN (${productIds.map(() => '?').join(', ')})
            ORDER BY sortOrder ASC, id ASC
          `).all(provider.channelCode, ...productIds) as (OptionRow & { productId: number })[]

    const optionIds =
      optionRows.map((option) => option.id)

    const optionValueRows =
      optionIds.length < 1
        ? []
        : db.prepare(`
            SELECT
              id,
              optionId,
              optionValueName,
              priceDelta,
              isDefault,
              isVisible,
              isQuantityEnabled,
              isQuantityLimitEnabled,
              minOptionQuantity,
              maxOptionQuantity,
              defaultOptionQuantity
            FROM pos_product_option_values
            WHERE channelCode = ?
              AND isActive = 1
              AND isVisible = 1
              AND deletedAt IS NULL
              AND optionId IN (${optionIds.map(() => '?').join(', ')})
            ORDER BY sortOrder ASC, id ASC
          `).all(provider.channelCode, ...optionIds) as OptionValueRow[]

    const optionValuesByOptionId =
      optionValueRows.reduce<Map<number, OptionValueRow[]>>((map, row) => {
        const current = map.get(row.optionId) ?? []
        current.push(row)
        map.set(row.optionId, current)
        return map
      }, new Map())

    const optionsByProductId =
      optionRows.reduce<Map<number, OptionRow[]>>((map, row) => {
        const current = map.get(row.productId) ?? []
        current.push(row)
        map.set(row.productId, current)
        return map
      }, new Map())

    return {
      provider: {
        profileId: provider.id,
        channelCode: provider.channelCode,
        displayName: provider.displayName,
      },
      location: location
        ? {
            id: location.id,
            locationName: location.locationName,
            floor: location.floor ?? '',
            zone: location.zone ?? '',
            resourceStatus: location.resourceStatus ?? 'AVAILABLE',
          }
        : null,
      categories,
      products: filteredProducts.map((product) => ({
        ...product,
        productDbId: product.id,
        primaryBarcodeValue: product.primaryScanCodeValue,
        primaryBarcodeType: product.primaryScanCodeType,
        externalBarcodeFormat: product.externalBarcodeFormat,
        itemNumber: null,
        thumbnail: product.thumbnailFilePath
          ? {
              filePath: product.thumbnailFilePath,
            }
          : null,
        options: (optionsByProductId.get(product.id) ?? []).map((option) => ({
          id: option.id,
          optionName: option.optionName,
          optionType: option.optionType,
          isRequired: option.isRequired,
          isMultiple: option.isMultiple,
          minSelectCount: option.minSelectCount,
          maxSelectCount: option.maxSelectCount,
          values: (optionValuesByOptionId.get(option.id) ?? []).map((value) => ({
            id: value.id,
            optionValueName: value.optionValueName,
            priceDelta: value.priceDelta,
            isDefault: value.isDefault,
            isVisible: value.isVisible,
            isQuantityEnabled: value.isQuantityEnabled,
            isQuantityLimitEnabled: value.isQuantityLimitEnabled,
            minOptionQuantity: value.minOptionQuantity,
            maxOptionQuantity: value.maxOptionQuantity,
            defaultOptionQuantity: value.defaultOptionQuantity,
          })),
        })),
      })),
    }
  }

  createCustomerOrder(
    dto: CreateCustomerOrderDto,
    authContext?: { profileId?: number | null, channelCode?: string | null }
  ): {
    order: CustomerOrderResponse
    items: unknown[]
    fulfillment: unknown
  } {
    const provider =
      this.findProviderProfileOrThrow(dto.providerChannelCode)

    const orderFlowType = dto.orderFlowType
    if (!CUSTOMER_ORDER_FLOW_TYPE_SET.has(orderFlowType)) {
      throw new BadRequestException('orderFlowType이 올바르지 않습니다.')
    }
    if (!CUSTOMER_ORDER_SOURCE_SET.has(dto.orderSource)) {
      throw new BadRequestException('orderSource가 올바르지 않습니다.')
    }

    const location =
      this.findLocationOrThrow(
        provider.channelCode,
        dto.locationId,
        dto.tableCode
      )

    if (!Array.isArray(dto.items) || dto.items.length < 1) {
      throw new BadRequestException('items는 1개 이상이어야 합니다.')
    }

    const customerProfileId =
      this.normalizePositiveInteger(dto.customerProfileId)
      ?? this.normalizePositiveInteger(authContext?.profileId)
      ?? null
    const customerChannelCode =
      this.normalizeNullableString(dto.customerChannelCode)
      ?? this.normalizeNullableString(authContext?.channelCode)
      ?? null

    const validatedItems =
      this.validateProductsAndOptions(
        provider.channelCode,
        orderFlowType,
        dto.items
      )

    const totals =
      this.calculateOrderTotals(validatedItems)

    const createOrderTransaction = db.transaction(() => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const orderDate = this.getOrderDateToken()
        const orderSequence =
          this.getNextOrderSequence(provider.channelCode, orderDate)
        const orderCode =
          this.generateOrderCode(orderDate, orderSequence)
        const revisionCode =
          this.generateRevisionCode(provider.channelCode)

        try {
          const orderResult = db.prepare(`
            INSERT INTO pos_orders(
              orderCode,
              revisionCode,
              revisionNo,
              orderDate,
              orderYear,
              orderMonth,
              orderDay,
              orderSequence,
              providerProfileId,
              providerChannelCode,
              customerProfileId,
              customerChannelCode,
              orderSource,
              orderFlowType,
              locationId,
              locationNameSnapshot,
              orderStatus,
              paymentStatus,
              subtotalAmount,
              discountAmount,
              taxAmount,
              totalAmount,
              isActive,
              memo,
              updatedAt
            )
            VALUES(
              ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
              'CREATED', 'UNPAID', ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP
            )
          `).run(
            orderCode,
            revisionCode,
            orderDate.raw,
            orderDate.year,
            orderDate.month,
            orderDate.day,
            orderSequence,
            provider.id,
            provider.channelCode,
            customerProfileId,
            customerChannelCode,
            dto.orderSource,
            orderFlowType,
            location?.id ?? null,
            location?.locationName ?? dto.tableCode ?? null,
            totals.subtotalAmount,
            totals.discountAmount,
            totals.taxAmount,
            totals.totalAmount,
            this.normalizeNullableString(dto.memo),
          ) as InsertResult

          const orderId = Number(orderResult.lastInsertRowid)

          const insertedItems: unknown[] = []
          const orderedCartItemCodes: string[] = []
          const cookingPayload: Array<{
            orderItemId: number
            productNameSnapshot: string
            quantity: number
            optionSummarySnapshot: string | null
            requestMemoSnapshot: string | null
          }> = []

          for (let index = 0; index < validatedItems.length; index += 1) {
            const item = validatedItems[index]

            const itemInsertResult = this.hasOrderItemRequestMemoSnapshotColumn
              ? db.prepare(`
                  INSERT INTO pos_order_items(
                    orderId,
                    orderCode,
                    revisionCode,
                    revisionNo,
                    providerChannelCode,
                    posProductId,
                    productCode,
                    productId,
                    sourceType,
                    cartCode,
                    cartItemCode,
                    optionSignature,
                    fulfillmentType,
                    fulfillmentSignature,
                    productTypeSnapshot,
                    productKindSnapshot,
                    categoryNameSnapshot,
                    productNameSnapshot,
                    unitPriceSnapshot,
                    quantity,
                    lineTotalAmount,
                    requestMemoSnapshot,
                    sortOrder
                  )
                  VALUES(?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PRODUCT', ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  orderId,
                  orderCode,
                  revisionCode,
                  provider.channelCode,
                  item.posProductId,
                  item.productCode,
                  item.productId,
                  item.sourceType,
                  item.cartCode,
                  item.cartItemCode,
                  item.optionSignature,
                  this.toFulfillmentType(dto.orderSource, dto.orderFlowType),
                  this.buildFulfillmentSignature(dto.orderFlowType, provider.channelCode),
                  item.productKindSnapshot,
                  item.categoryNameSnapshot,
                  item.productNameSnapshot,
                  item.unitPriceSnapshot,
                  item.quantity,
                  item.lineTotalAmount,
                  item.requestMemoSnapshot,
                  index + 1,
                ) as InsertResult
              : db.prepare(`
                  INSERT INTO pos_order_items(
                    orderId,
                    orderCode,
                    revisionCode,
                    revisionNo,
                    providerChannelCode,
                    posProductId,
                    productCode,
                    productId,
                    sourceType,
                    cartCode,
                    cartItemCode,
                    optionSignature,
                    fulfillmentType,
                    fulfillmentSignature,
                    productTypeSnapshot,
                    productKindSnapshot,
                    categoryNameSnapshot,
                    productNameSnapshot,
                    unitPriceSnapshot,
                    quantity,
                    lineTotalAmount,
                    sortOrder
                  )
                  VALUES(?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PRODUCT', ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  orderId,
                  orderCode,
                  revisionCode,
                  provider.channelCode,
                  item.posProductId,
                  item.productCode,
                  item.productId,
                  item.sourceType,
                  item.cartCode,
                  item.cartItemCode,
                  item.optionSignature,
                  this.toFulfillmentType(dto.orderSource, dto.orderFlowType),
                  this.buildFulfillmentSignature(dto.orderFlowType, provider.channelCode),
                  item.productKindSnapshot,
                  item.categoryNameSnapshot,
                  item.productNameSnapshot,
                  item.unitPriceSnapshot,
                  item.quantity,
                  item.lineTotalAmount,
                  index + 1,
                ) as InsertResult

            const orderItemId = Number(itemInsertResult.lastInsertRowid)

            const insertedOptions: unknown[] = []
            for (const option of item.options) {
              const optionResult = db.prepare(`
                INSERT INTO pos_order_item_options(
                  orderItemId,
                  providerChannelCode,
                  productOptionId,
                  productOptionValueId,
                  optionNameSnapshot,
                  optionTypeSnapshot,
                  optionValueNameSnapshot,
                  priceDeltaSnapshot,
                  quantity,
                  lineOptionAmount
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                orderItemId,
                provider.channelCode,
                option.productOptionId,
                option.productOptionValueId,
                option.optionNameSnapshot,
                option.optionTypeSnapshot,
                option.optionValueNameSnapshot,
                option.priceDeltaSnapshot,
                option.quantity,
                option.lineOptionAmount,
              ) as InsertResult

              insertedOptions.push({
                id: Number(optionResult.lastInsertRowid),
                ...option,
              })
            }

            insertedItems.push({
              id: orderItemId,
              ...item,
              options: insertedOptions,
            })

            if (item.cartItemCode) {
              orderedCartItemCodes.push(item.cartItemCode)
            }

            cookingPayload.push({
              orderItemId,
              productNameSnapshot: item.productNameSnapshot,
              quantity: item.quantity,
              optionSummarySnapshot: item.options.length > 0
                ? item.options.map((option) => `${option.optionNameSnapshot}:${option.optionValueNameSnapshot}`).join(', ')
                : null,
              requestMemoSnapshot: item.requestMemoSnapshot,
            })
          }

          const fulfillmentType =
            this.toFulfillmentType(dto.orderSource, dto.orderFlowType)

          db.prepare(`
            INSERT INTO pos_order_fulfillment_details(
              orderId,
              orderCode,
              revisionCode,
              providerProfileId,
              providerChannelCode,
              fulfillmentType,
              locationId,
              sourceLabelSnapshot,
              deliveryAddress,
              deliveryDetailAddress,
              deliveryPhone,
              deliveryMemo,
              pickupExpectedAt,
              reservationExpectedAt,
              qrCodeValue,
              customerRequestMemo
            )
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            orderId,
            orderCode,
            revisionCode,
            provider.id,
            provider.channelCode,
            fulfillmentType,
            location?.id ?? null,
            location?.locationName ?? dto.tableCode ?? null,
            this.normalizeNullableString(dto.fulfillment?.deliveryAddress),
            this.normalizeNullableString(dto.fulfillment?.deliveryDetailAddress),
            this.normalizeNullableString(dto.fulfillment?.deliveryPhone ?? dto.customerPhone),
            this.normalizeNullableString(dto.fulfillment?.deliveryMemo),
            this.normalizeNullableString(dto.fulfillment?.pickupExpectedAt),
            this.normalizeNullableString(dto.fulfillment?.reservationExpectedAt),
            this.normalizeNullableString(dto.fulfillment?.qrCodeValue),
            this.normalizeNullableString(
              dto.fulfillment?.customerRequestMemo ?? dto.memo
            ),
          )

          if (orderedCartItemCodes.length > 0) {
            const placeholders = orderedCartItemCodes.map(() => '?').join(', ')
            db.prepare(`
              UPDATE cart_items
              SET
                cartStatus = 'ORDERED',
                orderCode = ?,
                updatedAt = CURRENT_TIMESTAMP
              WHERE providerChannelCode = ?
                AND cartItemCode IN (${placeholders})
                AND cartStatus = 'ACTIVE'
            `).run(
              orderCode,
              provider.channelCode,
              ...orderedCartItemCodes
            )
          }

          this.insertStatusEvent({
            orderId,
            orderCode,
            revisionCode,
            providerProfileId: provider.id,
            providerChannelCode: provider.channelCode,
            fromStatus: null,
            toStatus: 'CREATED',
            changedByType: 'CUSTOMER',
            changedByProfileId: customerProfileId,
            reason: null,
          })

          this.createCookingTickets({
            providerProfileId: provider.id,
            providerChannelCode: provider.channelCode,
            orderId,
            orderCode,
            locationId: location?.id ?? null,
            locationNameSnapshot: location?.locationName ?? null,
            items: cookingPayload,
          })

          const order = db.prepare(`
            SELECT
              id,
              orderCode,
              revisionCode,
              revisionNo,
              providerChannelCode,
              customerChannelCode,
              orderStatus,
              paymentStatus,
              subtotalAmount,
              discountAmount,
              taxAmount,
              totalAmount,
              createdAt
            FROM pos_orders
            WHERE id = ?
            LIMIT 1
          `).get(orderId)

          return {
            order: this.mapOrderResponse(order),
            items: insertedItems,
            fulfillment: {
              fulfillmentType,
              locationId: location?.id ?? null,
              sourceLabelSnapshot: location?.locationName ?? dto.tableCode ?? null,
              deliveryAddress: this.normalizeNullableString(dto.fulfillment?.deliveryAddress),
              deliveryDetailAddress: this.normalizeNullableString(dto.fulfillment?.deliveryDetailAddress),
              deliveryPhone: this.normalizeNullableString(dto.fulfillment?.deliveryPhone ?? dto.customerPhone),
              deliveryMemo: this.normalizeNullableString(dto.fulfillment?.deliveryMemo),
              pickupExpectedAt: this.normalizeNullableString(dto.fulfillment?.pickupExpectedAt),
              reservationExpectedAt: this.normalizeNullableString(dto.fulfillment?.reservationExpectedAt),
              qrCodeValue: this.normalizeNullableString(dto.fulfillment?.qrCodeValue),
              customerRequestMemo: this.normalizeNullableString(dto.fulfillment?.customerRequestMemo ?? dto.memo),
            },
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes('UNIQUE constraint failed: pos_orders.providerChannelCode, pos_orders.orderCode, pos_orders.revisionNo')
          ) {
            continue
          }
          if (
            error instanceof Error &&
            error.message.includes('UNIQUE constraint failed: pos_orders.providerChannelCode, pos_orders.revisionCode')
          ) {
            continue
          }
          throw error
        }
      }

      throw new InternalServerErrorException('주문코드 생성 재시도 횟수를 초과했습니다.')
    })

    try {
      return createOrderTransaction() as {
        order: CustomerOrderResponse
        items: unknown[]
        fulfillment: unknown
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error
      }
      throw new InternalServerErrorException('주문 생성 중 오류가 발생했습니다.')
    }
  }

  getCustomerOrderDetail(
    orderCode: string,
    query: CustomerOrderDetailQueryDto
  ): CustomerOrderDetailResponse {
    const providerChannelCode =
      this.normalizeRequiredString(query.providerChannelCode, 'providerChannelCode가 필요합니다.')
    const normalizedOrderCode =
      this.normalizeRequiredString(orderCode, 'orderCode가 필요합니다.')
    const revisionCode =
      this.normalizeNullableString(query.revisionCode)
    const customerChannelCode =
      this.normalizeNullableString(query.customerChannelCode)

    const order = revisionCode
      ? db.prepare(`
          SELECT *
          FROM pos_orders
          WHERE providerChannelCode = ?
            AND orderCode = ?
            AND revisionCode = ?
          ORDER BY revisionNo DESC
          LIMIT 1
        `).get(providerChannelCode, normalizedOrderCode, revisionCode)
      : db.prepare(`
          SELECT *
          FROM pos_orders
          WHERE providerChannelCode = ?
            AND orderCode = ?
          ORDER BY revisionNo DESC
          LIMIT 1
        `).get(providerChannelCode, normalizedOrderCode)

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.')
    }

    if (
      customerChannelCode &&
      order.customerChannelCode !== customerChannelCode
    ) {
      throw new NotFoundException('주문을 찾을 수 없습니다.')
    }

    const items = this.hasOrderItemRequestMemoSnapshotColumn
      ? db.prepare(`
          SELECT
            id,
            posProductId,
            productCode,
            productId,
            sourceType,
            cartCode,
            cartItemCode,
            optionSignature,
            fulfillmentType,
            fulfillmentSignature,
            productNameSnapshot,
            unitPriceSnapshot,
            quantity,
            lineTotalAmount,
            requestMemoSnapshot
          FROM pos_order_items
          WHERE orderId = ?
          ORDER BY sortOrder ASC, id ASC
        `).all(order.id) as Array<{
          id: number
          posProductId: number
          productNameSnapshot: string
          unitPriceSnapshot: number
          quantity: number
          lineTotalAmount: number
          requestMemoSnapshot: string | null
        }>
      : db.prepare(`
          SELECT
          id,
          posProductId,
          productCode,
          productId,
          sourceType,
          cartCode,
          cartItemCode,
          optionSignature,
          fulfillmentType,
          fulfillmentSignature,
          productNameSnapshot,
          unitPriceSnapshot,
          quantity,
          lineTotalAmount,
            NULL AS requestMemoSnapshot
          FROM pos_order_items
          WHERE orderId = ?
          ORDER BY sortOrder ASC, id ASC
        `).all(order.id) as Array<{
      id: number
      posProductId: number
      productNameSnapshot: string
      unitPriceSnapshot: number
      quantity: number
      lineTotalAmount: number
      requestMemoSnapshot: string | null
    }>

    const itemIds = items.map((item) => item.id)
    const optionRows =
      itemIds.length < 1
        ? []
        : db.prepare(`
            SELECT
              id,
              orderItemId,
              productOptionId,
              productOptionValueId,
              optionNameSnapshot,
              optionValueNameSnapshot,
              quantity,
              lineOptionAmount
            FROM pos_order_item_options
            WHERE orderItemId IN (${itemIds.map(() => '?').join(', ')})
            ORDER BY id ASC
          `).all(...itemIds) as Array<{
            id: number
            orderItemId: number
            productOptionId: number | null
            productOptionValueId: number | null
            optionNameSnapshot: string
            optionValueNameSnapshot: string
            quantity: number
            lineOptionAmount: number
          }>

    const optionRowsByItemId =
      optionRows.reduce<Map<number, typeof optionRows>>((map, row) => {
        const current = map.get(row.orderItemId) ?? []
        current.push(row)
        map.set(row.orderItemId, current)
        return map
      }, new Map())

    const fulfillment = db.prepare(`
      SELECT
        id,
        fulfillmentType,
        locationId,
        sourceLabelSnapshot,
        deliveryAddress,
        deliveryDetailAddress,
        deliveryPhone,
        deliveryMemo,
        pickupExpectedAt,
        reservationExpectedAt,
        qrCodeValue,
        customerRequestMemo
      FROM pos_order_fulfillment_details
      WHERE orderId = ?
      LIMIT 1
    `).get(order.id)

    const statusEvents = db.prepare(`
      SELECT
        id,
        fromStatus,
        toStatus,
        changedByType,
        reason,
        createdAt
      FROM pos_order_status_events
      WHERE orderId = ?
      ORDER BY id ASC
    `).all(order.id)

    return {
      order: this.mapOrderResponse(order),
      items: items.map((item) => ({
        ...item,
        options: optionRowsByItemId.get(item.id) ?? [],
      })),
      fulfillment: fulfillment ?? null,
      statusEvents,
    }
  }

  cancelCustomerOrder(
    orderCode: string,
    dto: CancelCustomerOrderDto,
    authContext?: { channelCode?: string | null, profileId?: number | null }
  ): { ok: true, orderStatus: 'CANCELLED' } {
    const providerChannelCode =
      this.normalizeRequiredString(dto.providerChannelCode, 'providerChannelCode가 필요합니다.')
    const normalizedOrderCode =
      this.normalizeRequiredString(orderCode, 'orderCode가 필요합니다.')
    const revisionCode =
      this.normalizeNullableString(dto.revisionCode)
    const customerChannelCode =
      this.normalizeNullableString(dto.customerChannelCode)
      ?? this.normalizeNullableString(authContext?.channelCode)
      ?? null

    const targetOrder = revisionCode
      ? db.prepare(`
          SELECT *
          FROM pos_orders
          WHERE providerChannelCode = ?
            AND orderCode = ?
            AND revisionCode = ?
          LIMIT 1
        `).get(providerChannelCode, normalizedOrderCode, revisionCode)
      : db.prepare(`
          SELECT *
          FROM pos_orders
          WHERE providerChannelCode = ?
            AND orderCode = ?
          ORDER BY revisionNo DESC
          LIMIT 1
        `).get(providerChannelCode, normalizedOrderCode)

    if (!targetOrder) {
      throw new NotFoundException('주문을 찾을 수 없습니다.')
    }

    if (
      customerChannelCode &&
      targetOrder.customerChannelCode &&
      targetOrder.customerChannelCode !== customerChannelCode
    ) {
      throw new NotFoundException('주문을 찾을 수 없습니다.')
    }

    if (targetOrder.orderStatus !== 'CREATED') {
      throw new ConflictException('현재 주문 상태에서는 고객 취소가 불가능합니다.')
    }

    const cancelOrderTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE pos_orders
        SET
          orderStatus = 'CANCELLED',
          canceledAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(targetOrder.id)

      this.insertStatusEvent({
        orderId: targetOrder.id,
        orderCode: targetOrder.orderCode,
        revisionCode: targetOrder.revisionCode,
        providerProfileId: targetOrder.providerProfileId,
        providerChannelCode: targetOrder.providerChannelCode,
        fromStatus: targetOrder.orderStatus,
        toStatus: 'CANCELLED',
        changedByType: 'CUSTOMER',
        changedByProfileId: this.normalizePositiveInteger(authContext?.profileId) ?? null,
        reason: this.normalizeNullableString(dto.reason),
      })
    })

    cancelOrderTransaction()

    return {
      ok: true,
      orderStatus: 'CANCELLED',
    }
  }

  private findProviderProfileOrThrow(
    providerChannelCode: string
  ): ProviderProfileRow {
    const normalizedChannelCode =
      this.normalizeRequiredString(providerChannelCode, 'providerChannelCode가 필요합니다.')

    const row = db.prepare(`
      SELECT
        id,
        channelCode,
        displayName
      FROM profiles
      WHERE profileType = 'BUSINESS'
        AND channelCode = ?
      LIMIT 1
    `).get(normalizedChannelCode) as ProviderProfileRow | undefined

    if (!row) {
      throw new NotFoundException('사업자 프로필을 찾을 수 없습니다.')
    }

    return row
  }

  private findLocationOrThrow(
    providerChannelCode: string,
    locationId?: number,
    tableCode?: string
  ): PosLocationRow | null {
    const normalizedLocationId =
      this.normalizePositiveInteger(locationId)
    const normalizedTableCode =
      this.normalizeNullableString(tableCode)

    if (!normalizedLocationId && !normalizedTableCode) {
      return null
    }

    const row = normalizedLocationId
      ? db.prepare(`
          SELECT
            id,
            locationName,
            floor,
            zone,
            resourceStatus
          FROM pos_locations
          WHERE id = ?
            AND channelCode = ?
            AND deletedAt IS NULL
          LIMIT 1
        `).get(normalizedLocationId, providerChannelCode)
      : db.prepare(`
          SELECT
            id,
            locationName,
            floor,
            zone,
            resourceStatus
          FROM pos_locations
          WHERE tableCode = ?
            AND channelCode = ?
            AND deletedAt IS NULL
          LIMIT 1
        `).get(normalizedTableCode, providerChannelCode)

    if (!row) {
      throw new NotFoundException('테이블/위치 정보를 찾을 수 없습니다.')
    }

    return row as PosLocationRow
  }

  private validateProductsAndOptions(
    providerChannelCode: string,
    orderFlowType: CustomerOrderFlowType,
    items: CreateCustomerOrderItemDto[]
  ): ValidatedOrderProduct[] {
    const validatedItems: ValidatedOrderProduct[] = []

    for (const item of items) {
      const quantity =
        this.normalizePositiveInteger(item.quantity)
      if (!quantity) {
        throw new BadRequestException('상품 수량은 1 이상이어야 합니다.')
      }

      const productId =
        this.normalizePositiveInteger(item.posProductId)
      if (!productId) {
        throw new BadRequestException('유효한 상품 ID가 필요합니다.')
      }

      const product = db.prepare(`
        SELECT
          p.id,
          p.productCode,
          p.productName,
          p.productDescription,
          p.basePrice,
          p.categoryId,
          c.categoryName,
          p.menuStatus,
          p.isSoldOut,
          p.showOnTableOrder,
          p.allowDineIn,
          p.allowTakeout,
          p.allowDelivery,
          p.productKind
        FROM pos_products p
        LEFT JOIN pos_product_categories c
          ON c.id = p.categoryId
        WHERE p.id = ?
          AND p.channelCode = ?
          AND p.deletedAt IS NULL
          AND p.isActive = 1
          AND p.menuStatus = 'ON_SALE'
          AND p.isSoldOut = 0
          AND p.showOnTableOrder = 1
        LIMIT 1
      `).get(productId, providerChannelCode) as PosProductRow | undefined

      if (!product) {
        throw new BadRequestException(`주문 가능한 상품이 아닙니다. (productId=${productId})`)
      }

      if (!this.isProductAllowedByFlowType(product, orderFlowType)) {
        throw new BadRequestException(`주문 흐름에서 허용되지 않은 상품입니다. (productId=${productId})`)
      }

      const optionRows = db.prepare(`
        SELECT
          id,
          optionName,
          optionType,
          isRequired,
          isMultiple,
          minSelectCount,
          maxSelectCount
        FROM pos_product_options
        WHERE channelCode = ?
          AND productId = ?
          AND isActive = 1
          AND deletedAt IS NULL
        ORDER BY sortOrder ASC, id ASC
      `).all(providerChannelCode, productId) as OptionRow[]

      const selectedOptions =
        Array.isArray(item.options) ? item.options : []

      const selectedByOptionId =
        selectedOptions.reduce<Map<number, typeof selectedOptions>>((map, selected) => {
          const optionId = this.normalizePositiveInteger(selected.productOptionId)
          if (!optionId) {
            throw new BadRequestException('옵션 ID가 올바르지 않습니다.')
          }
          const optionValueId = this.normalizePositiveInteger(selected.productOptionValueId)
          if (!optionValueId) {
            throw new BadRequestException('옵션 값 ID가 올바르지 않습니다.')
          }
          const list = map.get(optionId) ?? []
          list.push(selected)
          map.set(optionId, list)
          return map
        }, new Map())

      const validatedOptions: ValidatedOrderProduct['options'] = []

      for (const option of optionRows) {
        const selectedForOption =
          selectedByOptionId.get(option.id) ?? []

        const selectedCount = selectedForOption.length
        const minSelectCount = Math.max(0, Number(option.minSelectCount ?? 0))
        const maxSelectCount = Math.max(0, Number(option.maxSelectCount ?? 0))

        if (option.isRequired === 1 && selectedCount < 1) {
          throw new BadRequestException(`필수 옵션이 누락되었습니다. (${option.optionName})`)
        }
        if (selectedCount < minSelectCount) {
          throw new BadRequestException(`최소 선택 수량을 만족해야 합니다. (${option.optionName})`)
        }
        if (maxSelectCount > 0 && selectedCount > maxSelectCount) {
          throw new BadRequestException(`최대 선택 수량을 초과했습니다. (${option.optionName})`)
        }
        if (option.isMultiple === 0 && selectedCount > 1) {
          throw new BadRequestException(`단일 선택 옵션입니다. (${option.optionName})`)
        }

        for (const selected of selectedForOption) {
          const optionValueId = Number(selected.productOptionValueId)
          const optionValue = db.prepare(`
            SELECT
              id,
              optionId,
              optionValueName,
              priceDelta,
              isDefault,
              isVisible,
              isQuantityEnabled,
              isQuantityLimitEnabled,
              minOptionQuantity,
              maxOptionQuantity,
              defaultOptionQuantity
            FROM pos_product_option_values
            WHERE id = ?
              AND optionId = ?
              AND channelCode = ?
              AND isActive = 1
              AND isVisible = 1
              AND deletedAt IS NULL
            LIMIT 1
          `).get(
            optionValueId,
            option.id,
            providerChannelCode
          ) as OptionValueRow | undefined

          if (!optionValue) {
            throw new BadRequestException(`옵션 값이 유효하지 않습니다. (${option.optionName})`)
          }

          const optionQuantity =
            this.normalizePositiveInteger(selected.quantity) ?? quantity
          const minOptionQuantity = Math.max(1, Number(optionValue.minOptionQuantity ?? 1))
          const maxOptionQuantity =
            optionValue.isQuantityLimitEnabled !== 1 ||
            optionValue.maxOptionQuantity === null ||
            optionValue.maxOptionQuantity === undefined
              ? null
              : Math.max(1, Number(optionValue.maxOptionQuantity))

          if (optionValue.isQuantityEnabled !== 1 && optionQuantity !== 1) {
            throw new BadRequestException(`option quantity is not enabled. (${optionValue.optionValueName})`)
          }
          if (optionQuantity < minOptionQuantity) {
            throw new BadRequestException(`option quantity is below minimum. (${optionValue.optionValueName})`)
          }
          if (maxOptionQuantity !== null && optionQuantity > maxOptionQuantity) {
            throw new BadRequestException(`option quantity exceeds maximum. (${optionValue.optionValueName})`)
          }

          validatedOptions.push({
            productOptionId: option.id,
            productOptionValueId: optionValue.id,
            optionNameSnapshot: option.optionName,
            optionTypeSnapshot: option.optionType,
            optionValueNameSnapshot: optionValue.optionValueName,
            priceDeltaSnapshot: optionValue.priceDelta,
            quantity: optionQuantity,
            lineOptionAmount: optionValue.priceDelta * optionQuantity,
          })
        }
      }

      for (const optionId of selectedByOptionId.keys()) {
        const exists = optionRows.some((option) => option.id === optionId)
        if (!exists) {
          throw new BadRequestException(`상품에 속하지 않은 옵션입니다. (${optionId})`)
        }
      }

      const optionAmount = validatedOptions.reduce(
        (sum, option) => sum + option.lineOptionAmount,
        0
      )
      const productAmount = product.basePrice * quantity
      const optionSignature = this.buildOptionSignature(validatedOptions)

      validatedItems.push({
        posProductId: product.id,
        productCode: product.productCode,
        productId: product.productId,
        sourceType: product.sourceType === 'MARKET_PRODUCT' ? 'MARKET_PRODUCT' : 'POS_PRODUCT',
        cartCode: this.normalizeNullableString(item.cartCode),
        cartItemCode: this.normalizeNullableString(item.cartItemCode),
        optionSignature,
        productKindSnapshot: product.productKind,
        categoryNameSnapshot: product.categoryName,
        productNameSnapshot: product.productName,
        unitPriceSnapshot: product.basePrice,
        quantity,
        lineTotalAmount: productAmount + optionAmount,
        requestMemoSnapshot: this.normalizeNullableString(item.requestMemo),
        options: validatedOptions,
      })
    }

    return validatedItems
  }

  private calculateOrderTotals(
    validatedItems: ValidatedOrderProduct[]
  ): CustomerOrderCalculationResult {
    const subtotalAmount = validatedItems.reduce(
      (sum, item) => sum + item.lineTotalAmount,
      0
    )
    const discountAmount = 0
    const taxAmount = 0
    const totalAmount = subtotalAmount - discountAmount + taxAmount
    return {
      subtotalAmount,
      discountAmount,
      taxAmount,
      totalAmount,
    }
  }

  private generateOrderCode(
    orderDate: { year: number, month: number, day: number },
    orderSequence: number
  ): string {
    if (orderSequence < 1 || orderSequence > 9999) {
      throw new InternalServerErrorException('orderSequence 범위를 초과했습니다.')
    }

    const yy = String(orderDate.year % 100).padStart(2, '0')
    const mm = String(orderDate.month).padStart(2, '0')
    const dd = String(orderDate.day).padStart(2, '0')
    const seq = String(orderSequence).padStart(4, '0')
    const orderCode = `OC${yy}${mm}${dd}${seq}`

    if (!/^OC[0-9]{10}$/.test(orderCode) || orderCode.length !== ORDER_CODE_LENGTH) {
      throw new InternalServerErrorException('orderCode 생성 규칙이 올바르지 않습니다.')
    }

    return orderCode
  }

  private generateRevisionCode(
    providerChannelCode: string
  ): string {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const code = this.randomCode(ORDER_CODE_LENGTH)
      const exists = db.prepare(`
        SELECT id
        FROM pos_orders
        WHERE providerChannelCode = ?
          AND revisionCode = ?
        LIMIT 1
      `).get(providerChannelCode, code) as { id?: number } | undefined

      if (!exists?.id) {
        return code
      }
    }
    throw new InternalServerErrorException('revisionCode 생성에 실패했습니다.')
  }

  private getNextOrderSequence(
    providerChannelCode: string,
    orderDate: { raw: string }
  ): number {
    const row = db.prepare(`
      SELECT COALESCE(MAX(orderSequence), 0) AS maxSequence
      FROM pos_orders
      WHERE providerChannelCode = ?
        AND orderDate = ?
    `).get(
      providerChannelCode,
      orderDate.raw
    ) as { maxSequence: number } | undefined

    return Number(row?.maxSequence ?? 0) + 1
  }

  private createCookingTickets(input: {
    providerProfileId: number
    providerChannelCode: string
    orderId: number
    orderCode: string
    locationId: number | null
    locationNameSnapshot: string | null
    items: Array<{
      orderItemId: number
      productNameSnapshot: string
      quantity: number
      optionSummarySnapshot: string | null
      requestMemoSnapshot: string | null
    }>
  }): void {
    for (const item of input.items) {
      db.prepare(`
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
          updatedAt
        )
        VALUES(
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING', 'NORMAL',
          CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP
        )
      `).run(
        input.providerProfileId,
        input.providerChannelCode,
        input.orderId,
        input.orderCode,
        item.orderItemId,
        input.locationId,
        input.locationNameSnapshot,
        item.productNameSnapshot,
        item.quantity,
        item.optionSummarySnapshot,
        item.requestMemoSnapshot
      )
    }
  }

  private insertStatusEvent(input: {
    orderId: number
    orderCode: string
    revisionCode: string | null
    providerProfileId: number
    providerChannelCode: string
    fromStatus: string | null
    toStatus: string
    changedByType: 'CUSTOMER'
    changedByProfileId: number | null
    reason: string | null
  }): void {
    db.prepare(`
      INSERT INTO pos_order_status_events(
        orderId,
        orderCode,
        revisionCode,
        providerProfileId,
        providerChannelCode,
        fromStatus,
        toStatus,
        changedByType,
        changedByProfileId,
        reason
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.orderId,
      input.orderCode,
      input.revisionCode,
      input.providerProfileId,
      input.providerChannelCode,
      input.fromStatus,
      input.toStatus,
      input.changedByType,
      input.changedByProfileId,
      input.reason
    )
  }

  private mapOrderResponse(
    row: any
  ): CustomerOrderResponse {
    return {
      id: Number(row.id),
      orderCode: String(row.orderCode),
      revisionCode: String(row.revisionCode),
      revisionNo: Number(row.revisionNo),
      providerChannelCode: String(row.providerChannelCode),
      customerChannelCode: this.normalizeNullableString(row.customerChannelCode),
      orderStatus: row.orderStatus,
      paymentStatus: row.paymentStatus,
      subtotalAmount: Number(row.subtotalAmount ?? 0),
      discountAmount: Number(row.discountAmount ?? 0),
      taxAmount: Number(row.taxAmount ?? 0),
      totalAmount: Number(row.totalAmount ?? 0),
      createdAt: String(row.createdAt),
    }
  }

  private tableHasColumn(
    tableName: string,
    columnName: string
  ): boolean {
    const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
    return rows.some((row) => row.name === columnName)
  }

  private toFulfillmentType(
    orderSource: CustomerOrderSource,
    orderFlowType: CustomerOrderFlowType
  ): string {
    if (orderSource === 'QR_ORDER') {
      return 'QR_ORDER'
    }
    if (orderFlowType === 'DELIVERY') {
      return 'DELIVERY'
    }
    if (orderFlowType === 'PICKUP') {
      return 'PICKUP'
    }
    if (orderFlowType === 'RESERVATION') {
      return 'RESERVATION'
    }
    if (orderFlowType === 'ROOM_SERVICE') {
      return 'ROOM_SERVICE'
    }
    return 'TABLE'
  }

  private isProductAllowedByFlowType(
    product: Pick<PosProductRow, 'allowDineIn' | 'allowTakeout' | 'allowDelivery'>,
    orderFlowType: CustomerOrderFlowType
  ): boolean {
    if (orderFlowType === 'IN_STORE' || orderFlowType === 'RESERVATION' || orderFlowType === 'ROOM_SERVICE') {
      return product.allowDineIn === 1
    }
    if (orderFlowType === 'PICKUP') {
      return product.allowTakeout === 1
    }
    if (orderFlowType === 'DELIVERY') {
      return product.allowDelivery === 1
    }
    return false
  }

  private randomCode(length: number): string {
    let output = ''
    for (let index = 0; index < length; index += 1) {
      const randomIndex = Math.floor(Math.random() * ORDER_CODE_CHARSET.length)
      output += ORDER_CODE_CHARSET[randomIndex]
    }
    return output
  }

  private buildOptionSignature(
    options: ValidatedOrderProduct['options']
  ): string {
    if (options.length < 1) {
      return 'NO_OPTIONS'
    }

    const tokens = options
      .map((option) => `${option.productOptionId}:${option.productOptionValueId}`)
      .sort()

    return tokens.length > 0
      ? tokens.join(',')
      : 'NO_OPTIONS'
  }

  private buildFulfillmentSignature(
    orderFlowType: CustomerOrderFlowType,
    providerChannelCode: string
  ): string {
    if (orderFlowType === 'DELIVERY') {
      return 'DELIVERY:DEFAULT'
    }
    if (orderFlowType === 'PICKUP') {
      return `PICKUP:${providerChannelCode}`
    }
    if (orderFlowType === 'IN_STORE') {
      return `IN_STORE:${providerChannelCode}`
    }
    if (orderFlowType === 'RESERVATION') {
      return 'RESERVATION:DEFAULT'
    }
    if (orderFlowType === 'ROOM_SERVICE') {
      return 'ROOM_SERVICE:DEFAULT'
    }
    return 'DEFAULT_FULFILLMENT'
  }

  private getOrderDateToken(): {
    raw: string
    year: number
    month: number
    day: number
  } {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    return {
      raw: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      year,
      month,
      day,
    }
  }

  private normalizePositiveInteger(
    value: unknown
  ): number | null {
    if (
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value > 0
    ) {
      return value
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10)
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed
      }
    }
    return null
  }

  private normalizeNullableString(
    value: unknown
  ): string | null {
    if (typeof value !== 'string') {
      return null
    }
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : null
  }

  private normalizeRequiredString(
    value: unknown,
    errorMessage: string
  ): string {
    const normalized = this.normalizeNullableString(value)
    if (!normalized) {
      throw new BadRequestException(errorMessage)
    }
    return normalized
  }
}

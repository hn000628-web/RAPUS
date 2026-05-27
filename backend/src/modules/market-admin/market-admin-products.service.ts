import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import db from '../../config/database';

type BooleanLike = boolean | number | string | undefined | null;

type PublicProductQuery = {
  channelCode?: string;
  page?: string;
  pageSize?: string;
  keyword?: string;
  category?: string;
};

type MarketProductQuery = {
  channelCode?: string;
};

export type MarketProductStockStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'SOLD_OUT';

export type MarketProductChangeType =
  | 'PRICE'
  | 'STOCK'
  | 'STATUS'
  | 'DISPLAY'
  | 'EVENT'
  | 'SYNC';

type BusinessProfileRow = {
  id: number;
  channelCode: string;
};

type CountRow = {
  count: number;
};

type MasterProductRow = {
  id: number;
  productCode: string;
  productName: string;
  brandName: string | null;
  categoryName: string | null;
  scanCodeValue: string | null;
  thumbnailUrl: string | null;
};

type PublicProductRow = MasterProductRow & {
  isRegistered: number;
};

type PublicProductItem = MasterProductRow & {
  isRegistered: boolean;
};

type MarketProductRow = {
  id: number;
  profileId: number;
  channelCode: string;
  sourceProductId: number;
  productCode: string;
  barcode: string | null;
  productNameSnapshot: string;
  brandNameSnapshot: string | null;
  categoryNameSnapshot: string | null;
  purchasePrice: number;
  salePrice: number;
  eventPrice: number | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  stockQuantity: number;
  safetyStockQuantity: number;
  stockStatus: MarketProductStockStatus;
  isOnSale: number;
  isDisplayed: number;
  isEventActive: number;
  isSoldOut: number;
  lastSyncedAt: string | null;
  priceUpdatedAt: string | null;
  stockUpdatedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type MarketProductHistoryRow = {
  id: number;
  marketProductId: number;
  channelCode: string;
  productCode: string;
  changeType: MarketProductChangeType;
  beforeValue: string | null;
  afterValue: string | null;
  changedByProfileId: number | null;
  changeMemo: string | null;
  createdAt: string | null;
};

type ImportMarketProductInput = {
  channelCode?: string;
  productCode?: string;
  purchasePrice?: number | string;
  salePrice?: number | string;
  eventPrice?: number | string | null;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  stockQuantity?: number | string;
  safetyStockQuantity?: number | string;
  isOnSale?: BooleanLike;
  isDisplayed?: BooleanLike;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type UpdatePricingInput = {
  channelCode?: string;
  purchasePrice?: number | string;
  salePrice?: number | string;
  eventPrice?: number | string | null;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  isEventActive?: BooleanLike;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type UpdateStockInput = {
  channelCode?: string;
  stockQuantity?: number | string;
  safetyStockQuantity?: number | string;
  isSoldOut?: BooleanLike;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type UpdateStatusInput = {
  channelCode?: string;
  isOnSale?: BooleanLike;
  isDisplayed?: BooleanLike;
  isSoldOut?: BooleanLike;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type PublicProductListResponse = {
  items: PublicProductItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type MarketProductSummary = {
  totalProducts: number;
  soldOutProducts: number;
  lowStockProducts: number;
  eventProducts: number;
  onSaleProducts: number;
};

type MarketDashboardSummary = {
  totalProducts: number;
  soldOutProducts: number;
  lowStockProducts: number;
  eventProducts: number;
  activeProducts: number;
};

type MarketProductListResponse = {
  items: MarketProductRow[];
  summary: MarketProductSummary;
};

@Injectable()
export class MarketAdminProductsService {
  getDashboardSummary(query: MarketProductQuery): MarketDashboardSummary {
    const channelCode = this.normalizeChannelCode(query.channelCode);
    this.getBusinessProfileByChannelCode(channelCode);
    const summary = this.getMarketProductSummary(channelCode);

    return {
      totalProducts: summary.totalProducts,
      soldOutProducts: summary.soldOutProducts,
      lowStockProducts: summary.lowStockProducts,
      eventProducts: summary.eventProducts,
      activeProducts: summary.onSaleProducts,
    };
  }

  getPublicProducts(query: PublicProductQuery): PublicProductListResponse {
    const channelCode = this.normalizeChannelCode(query.channelCode);
    const page = this.normalizePage(query.page);
    const pageSize = this.normalizePageSize(query.pageSize);
    const offset = (page - 1) * pageSize;
    const filters = this.buildPublicProductFilters(query);

    const totalCount = this.getCount(
      `
      SELECT COUNT(*) AS count
      FROM master_products mp
      ${filters.where}
      `,
      filters.values,
    );

    const items = db
      .prepare(
        `
        SELECT
          mp.id AS id,
          mp.productCode AS productCode,
          mp.productName AS productName,
          mp.brandName AS brandName,
          mp.categoryName AS categoryName,
          COALESCE(
            (
              SELECT mpsc.scanCodeValue
              FROM master_product_scan_codes mpsc
              WHERE mpsc.masterProductId = mp.id
                AND mpsc.isActive = 1
                AND mpsc.deletedAt IS NULL
              ORDER BY mpsc.isPrimary DESC, mpsc.id ASC
              LIMIT 1
            ),
            (
              SELECT mpb.gtin
              FROM master_product_barcodes mpb
              WHERE mpb.masterProductId = mp.id
              ORDER BY mpb.isPrimary DESC, mpb.id ASC
              LIMIT 1
            )
          ) AS scanCodeValue,
          CASE
            WHEN ia.filePath IS NOT NULL AND ia.filePath LIKE '/%' THEN ia.filePath
            WHEN ia.filePath IS NOT NULL THEN '/media/' || ia.filePath
            ELSE NULL
          END AS thumbnailUrl,
          CASE
            WHEN mcp.id IS NULL THEN 0
            ELSE 1
          END AS isRegistered
        FROM master_products mp
        LEFT JOIN image_assets ia
          ON ia.id = mp.thumbnailImageAssetId
          AND ia.isActive = 1
        LEFT JOIN market_products mcp
          ON mcp.channelCode = ?
          AND mcp.productCode = mp.productCode
          AND mcp.isDeleted = 0
          AND mcp.deletedAt IS NULL
        ${filters.where}
        ORDER BY mp.id DESC
        LIMIT ?
        OFFSET ?
        `,
      )
      .all(channelCode, ...filters.values, pageSize, offset) as PublicProductRow[];

    return {
      items: items.map((item) => ({
        ...item,
        isRegistered: item.isRegistered === 1,
      })),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
  }

  getMarketProducts(query: MarketProductQuery): MarketProductListResponse {
    const channelCode = this.normalizeChannelCode(query.channelCode);
    this.getBusinessProfileByChannelCode(channelCode);

    const items = db
      .prepare(
        `
        SELECT
          id,
          profileId,
          channelCode,
          COALESCE(masterProductId, 0) AS sourceProductId,
          productCode,
          barcode,
          productName AS productNameSnapshot,
          supplierName AS brandNameSnapshot,
          NULL AS categoryNameSnapshot,
          0 AS purchasePrice,
          salePrice,
          NULL AS eventPrice,
          NULL AS eventStartAt,
          NULL AS eventEndAt,
          currentStock AS stockQuantity,
          COALESCE(safeStock, 0) AS safetyStockQuantity,
          CASE
            WHEN isSoldOut = 1 OR currentStock = 0 THEN 'SOLD_OUT'
            WHEN currentStock <= COALESCE(safeStock, 0) THEN 'LOW_STOCK'
            ELSE 'IN_STOCK'
          END AS stockStatus,
          isActive AS isOnSale,
          CASE WHEN isHidden = 1 THEN 0 ELSE 1 END AS isDisplayed,
          CASE WHEN displayStatus = 'EVENT_ONLY' THEN 1 ELSE 0 END AS isEventActive,
          isSoldOut,
          updatedAt AS lastSyncedAt,
          updatedAt AS priceUpdatedAt,
          updatedAt AS stockUpdatedAt,
          createdAt,
          updatedAt
        FROM market_products
        WHERE channelCode = ?
          AND isDeleted = 0
          AND deletedAt IS NULL
        ORDER BY updatedAt DESC, id DESC
        `,
      )
      .all(channelCode) as MarketProductRow[];

    return {
      items,
      summary: this.getMarketProductSummary(channelCode),
    };
  }

  importProduct(input: ImportMarketProductInput): MarketProductRow {
    const channelCode = this.normalizeChannelCode(input.channelCode);
    const productCode = this.normalizeProductCode(input.productCode);
    const profile = this.getBusinessProfileByChannelCode(channelCode);
    const masterProduct = this.getMasterProductByProductCode(productCode);

    const duplicate = db
      .prepare(
        `
        SELECT id
        FROM market_products
        WHERE channelCode = ?
          AND productCode = ?
          AND isDeleted = 0
          AND deletedAt IS NULL
        LIMIT 1
        `,
      )
      .get(channelCode, productCode) as { id: number } | undefined;

    if (duplicate) {
      throw new ConflictException('이미 이 채널에 등록된 상품입니다.');
    }

    const salePrice = this.normalizeMoney(input.salePrice, 0, 'salePrice');
    const eventPrice = this.normalizeNullableMoney(input.eventPrice, 'eventPrice');
    const stockQuantity = this.normalizeQuantity(input.stockQuantity, 0, 'stockQuantity');
    const safetyStockQuantity = this.normalizeQuantity(
      input.safetyStockQuantity,
      0,
      'safetyStockQuantity',
    );
    const isSoldOut = stockQuantity === 0 ? 1 : 0;
    const now = this.now();

    const result = db
      .prepare(
        `
        INSERT INTO market_products(
          profileId,
          channelCode,
          masterProductId,
          productCode,
          barcode,
          productName,
          supplierName,
          salePrice,
          currentStock,
          safeStock,
          isActive,
          isHidden,
          isSoldOut,
          displayStatus,
          approvalStatus,
          updatedAt
        )
        VALUES(
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `,
      )
      .run(
        profile.id,
        channelCode,
        masterProduct.id,
        productCode,
        masterProduct.scanCodeValue,
        masterProduct.productName,
        masterProduct.brandName,
        salePrice,
        stockQuantity,
        safetyStockQuantity,
        this.normalizeBoolean(input.isOnSale, true),
        this.normalizeBoolean(input.isDisplayed, true) === 1 ? 0 : 1,
        isSoldOut,
        eventPrice === null ? 'VISIBLE' : 'EVENT_ONLY',
        masterProduct.scanCodeValue ? 'MATCHED' : 'MANUAL',
        now,
      );

    const created = this.getMarketProductById(
      String(result.lastInsertRowid),
      channelCode,
    );

    return created;
  }

  updatePricing(id: string, input: UpdatePricingInput): MarketProductRow {
    const channelCode = this.normalizeChannelCode(input.channelCode);
    const current = this.getMarketProductById(id, channelCode);
    const salePrice = this.normalizeMoney(input.salePrice, current.salePrice, 'salePrice');
    const now = this.now();

    db.prepare(
      `
      UPDATE market_products
      SET
        salePrice = ?,
        updatedAt = ?
      WHERE id = ?
        AND channelCode = ?
        AND isDeleted = 0
        AND deletedAt IS NULL
      `,
    ).run(
      salePrice,
      now,
      current.id,
      channelCode,
    );

    const updated = this.getMarketProductById(id, channelCode);
    return updated;
  }

  updateStock(id: string, input: UpdateStockInput): MarketProductRow {
    const channelCode = this.normalizeChannelCode(input.channelCode);
    const current = this.getMarketProductById(id, channelCode);
    const stockQuantity = this.normalizeQuantity(
      input.stockQuantity,
      current.stockQuantity,
      'stockQuantity',
    );
    const safetyStockQuantity = this.normalizeQuantity(
      input.safetyStockQuantity,
      current.safetyStockQuantity,
      'safetyStockQuantity',
    );
    const isSoldOut = this.normalizeBoolean(
      input.isSoldOut,
      stockQuantity === 0,
    );
    const now = this.now();

    db.prepare(
      `
      UPDATE market_products
      SET
        currentStock = ?,
        safeStock = ?,
        isSoldOut = ?,
        updatedAt = ?
      WHERE id = ?
        AND channelCode = ?
        AND isDeleted = 0
        AND deletedAt IS NULL
      `,
    ).run(
      stockQuantity,
      safetyStockQuantity,
      isSoldOut,
      now,
      current.id,
      channelCode,
    );

    const updated = this.getMarketProductById(id, channelCode);
    return updated;
  }

  updateStatus(id: string, input: UpdateStatusInput): MarketProductRow {
    const channelCode = this.normalizeChannelCode(input.channelCode);
    const current = this.getMarketProductById(id, channelCode);
    const isOnSale = this.normalizeBoolean(input.isOnSale, current.isOnSale === 1);
    const isDisplayed = this.normalizeBoolean(
      input.isDisplayed,
      current.isDisplayed === 1,
    );
    const isSoldOut = this.normalizeBoolean(input.isSoldOut, current.isSoldOut === 1);
    const now = this.now();

    db.prepare(
      `
      UPDATE market_products
      SET
        isActive = ?,
        isHidden = ?,
        isSoldOut = ?,
        updatedAt = ?
      WHERE id = ?
        AND channelCode = ?
        AND isDeleted = 0
        AND deletedAt IS NULL
      `,
    ).run(
      isOnSale,
      isDisplayed === 1 ? 0 : 1,
      isSoldOut,
      now,
      current.id,
      channelCode,
    );

    const updated = this.getMarketProductById(id, channelCode);
    return updated;
  }

  getHistory(id: string, query: MarketProductQuery): { items: MarketProductHistoryRow[] } {
    const channelCode = this.normalizeChannelCode(query.channelCode);
    const product = this.getMarketProductById(id, channelCode);
    const items = db
      .prepare(
        `
        SELECT
          id,
          marketProductId,
          channelCode,
          productCode,
          changeType,
          beforeValue,
          afterValue,
          changedByProfileId,
          changeMemo,
          createdAt
        FROM market_channel_product_history
        WHERE marketProductId = ?
          AND channelCode = ?
        ORDER BY id DESC
        `,
      )
      .all(product.id, channelCode) as MarketProductHistoryRow[];

    return { items };
  }

  private getBusinessProfileByChannelCode(channelCode: string): BusinessProfileRow {
    const profile = db
      .prepare(
        `
        SELECT id, channelCode
        FROM profiles
        WHERE channelCode = ?
          AND profileType = 'BUSINESS'
        LIMIT 1
        `,
      )
      .get(channelCode) as BusinessProfileRow | undefined;

    if (!profile) {
      throw new NotFoundException('business profile not found');
    }

    return profile;
  }

  private getMasterProductByProductCode(productCode: string): MasterProductRow {
    const product = db
      .prepare(
        `
        SELECT
          id,
          productCode,
          productName,
          brandName,
          categoryName,
          NULL AS scanCodeValue,
          NULL AS thumbnailUrl
        FROM master_products
        WHERE productCode = ?
          AND isActive = 1
          AND deletedAt IS NULL
        LIMIT 1
        `,
      )
      .get(productCode) as MasterProductRow | undefined;

    if (!product) {
      throw new NotFoundException('master product not found');
    }

    return product;
  }

  private getMarketProductById(id: string, channelCode: string): MarketProductRow {
    const productId = this.normalizeId(id, 'id');
    const product = db
      .prepare(
        `
        SELECT
          id,
          profileId,
          channelCode,
          COALESCE(masterProductId, 0) AS sourceProductId,
          productCode,
          barcode,
          productName AS productNameSnapshot,
          supplierName AS brandNameSnapshot,
          NULL AS categoryNameSnapshot,
          0 AS purchasePrice,
          salePrice,
          NULL AS eventPrice,
          NULL AS eventStartAt,
          NULL AS eventEndAt,
          currentStock AS stockQuantity,
          COALESCE(safeStock, 0) AS safetyStockQuantity,
          CASE
            WHEN isSoldOut = 1 OR currentStock = 0 THEN 'SOLD_OUT'
            WHEN currentStock <= COALESCE(safeStock, 0) THEN 'LOW_STOCK'
            ELSE 'IN_STOCK'
          END AS stockStatus,
          isActive AS isOnSale,
          CASE WHEN isHidden = 1 THEN 0 ELSE 1 END AS isDisplayed,
          CASE WHEN displayStatus = 'EVENT_ONLY' THEN 1 ELSE 0 END AS isEventActive,
          isSoldOut,
          updatedAt AS lastSyncedAt,
          updatedAt AS priceUpdatedAt,
          updatedAt AS stockUpdatedAt,
          createdAt,
          updatedAt
        FROM market_products
        WHERE id = ?
          AND channelCode = ?
          AND isDeleted = 0
          AND deletedAt IS NULL
        LIMIT 1
        `,
      )
      .get(productId, channelCode) as MarketProductRow | undefined;

    if (!product) {
      throw new NotFoundException('market product not found');
    }

    return product;
  }

  private getMarketProductSummary(channelCode: string): MarketProductSummary {
    const row = db
      .prepare(
        `
        SELECT
          COUNT(*) AS totalProducts,
          SUM(CASE WHEN isSoldOut = 1 THEN 1 ELSE 0 END) AS soldOutProducts,
          SUM(CASE WHEN currentStock <= COALESCE(safeStock, 0) AND currentStock > 0 THEN 1 ELSE 0 END) AS lowStockProducts,
          SUM(CASE WHEN displayStatus = 'EVENT_ONLY' THEN 1 ELSE 0 END) AS eventProducts,
          SUM(CASE WHEN isActive = 1 AND isHidden = 0 AND isSoldOut = 0 THEN 1 ELSE 0 END) AS onSaleProducts
        FROM market_products
        WHERE channelCode = ?
          AND isDeleted = 0
          AND deletedAt IS NULL
        `,
      )
      .get(channelCode) as {
        totalProducts: number | null;
        soldOutProducts: number | null;
        lowStockProducts: number | null;
        eventProducts: number | null;
        onSaleProducts: number | null;
      };

    return {
      totalProducts: row.totalProducts ?? 0,
      soldOutProducts: row.soldOutProducts ?? 0,
      lowStockProducts: row.lowStockProducts ?? 0,
      eventProducts: row.eventProducts ?? 0,
      onSaleProducts: row.onSaleProducts ?? 0,
    };
  }

  private insertHistory(params: {
    marketProduct: MarketProductRow;
    changeType: MarketProductChangeType;
    beforeValue: string | null;
    afterValue: string | null;
    changedByProfileId: number | null;
    changeMemo: string | null;
  }) {
    db.prepare(
      `
      INSERT INTO market_channel_product_history(
        marketProductId,
        channelCode,
        productCode,
        changeType,
        beforeValue,
        afterValue,
        changedByProfileId,
        changeMemo
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      params.marketProduct.id,
      params.marketProduct.channelCode,
      params.marketProduct.productCode,
      params.changeType,
      params.beforeValue,
      params.afterValue,
      params.changedByProfileId,
      params.changeMemo,
    );
  }

  private buildPublicProductFilters(query: PublicProductQuery): {
    where: string;
    values: string[];
  } {
    const clauses = ['mp.isActive = 1', 'mp.deletedAt IS NULL'];
    const values: string[] = [];
    const keyword = this.normalizeNullableString(query.keyword);
    const category = this.normalizeNullableString(query.category);

    if (keyword) {
      clauses.push(
        `(
          mp.productName LIKE ?
          OR COALESCE(mp.brandName, '') LIKE ?
          OR EXISTS (
            SELECT 1
            FROM master_product_scan_codes mpsc
            WHERE mpsc.masterProductId = mp.id
              AND mpsc.isActive = 1
              AND mpsc.deletedAt IS NULL
              AND mpsc.scanCodeValue LIKE ?
          )
          OR EXISTS (
            SELECT 1
            FROM master_product_barcodes mpb
            WHERE mpb.masterProductId = mp.id
              AND mpb.gtin LIKE ?
          )
        )`,
      );
      values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (category && category !== '전체') {
      clauses.push('mp.categoryName = ?');
      values.push(category);
    }

    return {
      where: `WHERE ${clauses.join(' AND ')}`,
      values,
    };
  }

  private getCount(sql: string, values: string[]): number {
    const row = db.prepare(sql).get(...values) as CountRow | undefined;
    return row?.count ?? 0;
  }

  private normalizeChannelCode(value: string | undefined): string {
    const normalized = this.normalizeNullableString(value);

    if (!normalized || !/^[A-Z][A-Z0-9]{12}$/.test(normalized)) {
      throw new BadRequestException('channelCode is invalid');
    }

    return normalized;
  }

  private normalizeProductCode(value: string | undefined): string {
    const normalized = this.normalizeNullableString(value);

    if (!normalized || !/^RPB\d{13}$|^RPN[A-Z]{2}\d{9}$/.test(normalized)) {
      throw new BadRequestException('productCode is invalid');
    }

    return normalized;
  }

  private normalizeId(value: string, fieldName: string): number {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(`${fieldName} is invalid`);
    }

    return id;
  }

  private normalizeNullableId(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return this.normalizeId(String(value), 'changedByProfileId');
  }

  private normalizeMoney(
    value: number | string | undefined,
    fallback: number,
    fieldName: string,
  ): number {
    if (value === undefined || value === '') {
      return fallback;
    }

    const normalized = Number(value);

    if (!Number.isInteger(normalized) || normalized < 0) {
      throw new BadRequestException(`${fieldName} must be a non-negative integer`);
    }

    return normalized;
  }

  private normalizeNullableMoney(
    value: number | string | null | undefined,
    fieldName: string,
  ): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return this.normalizeMoney(value, 0, fieldName);
  }

  private normalizeQuantity(
    value: number | string | undefined,
    fallback: number,
    fieldName: string,
  ): number {
    return this.normalizeMoney(value, fallback, fieldName);
  }

  private normalizeBoolean(value: BooleanLike, fallback: boolean): number {
    if (value === undefined || value === null || value === '') {
      return fallback ? 1 : 0;
    }

    if (value === true || value === 1 || value === '1' || value === 'true') {
      return 1;
    }

    if (value === false || value === 0 || value === '0' || value === 'false') {
      return 0;
    }

    throw new BadRequestException('boolean value is invalid');
  }

  private normalizeNullableString(value: string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizePage(value: string | undefined): number {
    const page = Number(value ?? 1);
    return Number.isInteger(page) && page > 0 ? page : 1;
  }

  private normalizePageSize(value: string | undefined): number {
    const pageSize = Number(value ?? 8);

    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      return 8;
    }

    return Math.min(pageSize, 30);
  }

  private resolveStockStatus(
    stockQuantity: number,
    safetyStockQuantity: number,
    isSoldOut: number,
  ): MarketProductStockStatus {
    if (isSoldOut === 1 || stockQuantity === 0) {
      return 'SOLD_OUT';
    }

    if (stockQuantity <= safetyStockQuantity) {
      return 'LOW_STOCK';
    }

    return 'IN_STOCK';
  }

  private stringifyPricing(product: MarketProductRow): string {
    return this.stringifyHistoryValue({
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      eventPrice: product.eventPrice,
      eventStartAt: product.eventStartAt,
      eventEndAt: product.eventEndAt,
      isEventActive: product.isEventActive,
    });
  }

  private stringifyStock(product: MarketProductRow): string {
    return this.stringifyHistoryValue({
      stockQuantity: product.stockQuantity,
      safetyStockQuantity: product.safetyStockQuantity,
      stockStatus: product.stockStatus,
      isSoldOut: product.isSoldOut,
    });
  }

  private stringifyStatus(product: MarketProductRow): string {
    return this.stringifyHistoryValue({
      isOnSale: product.isOnSale,
      isDisplayed: product.isDisplayed,
      isSoldOut: product.isSoldOut,
      stockStatus: product.stockStatus,
    });
  }

  private stringifyHistoryValue(value: Record<string, unknown>): string {
    return JSON.stringify(value);
  }

  private now(): string {
    return new Date().toISOString();
  }
}

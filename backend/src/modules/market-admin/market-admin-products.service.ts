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

type MarketProductListResponse = {
  items: MarketProductRow[];
  summary: MarketProductSummary;
};

@Injectable()
export class MarketAdminProductsService {
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
        LEFT JOIN market_channel_products mcp
          ON mcp.channelCode = ?
          AND mcp.productCode = mp.productCode
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
          sourceProductId,
          productCode,
          productNameSnapshot,
          brandNameSnapshot,
          categoryNameSnapshot,
          purchasePrice,
          salePrice,
          eventPrice,
          eventStartAt,
          eventEndAt,
          stockQuantity,
          safetyStockQuantity,
          stockStatus,
          isOnSale,
          isDisplayed,
          isEventActive,
          isSoldOut,
          lastSyncedAt,
          priceUpdatedAt,
          stockUpdatedAt,
          createdAt,
          updatedAt
        FROM market_channel_products
        WHERE channelCode = ?
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
        FROM market_channel_products
        WHERE channelCode = ?
          AND productCode = ?
          AND deletedAt IS NULL
        LIMIT 1
        `,
      )
      .get(channelCode, productCode) as { id: number } | undefined;

    if (duplicate) {
      throw new ConflictException('이미 이 채널에 등록된 상품입니다.');
    }

    const purchasePrice = this.normalizeMoney(input.purchasePrice, 0, 'purchasePrice');
    const salePrice = this.normalizeMoney(input.salePrice, 0, 'salePrice');
    const eventPrice = this.normalizeNullableMoney(input.eventPrice, 'eventPrice');
    const stockQuantity = this.normalizeQuantity(input.stockQuantity, 0, 'stockQuantity');
    const safetyStockQuantity = this.normalizeQuantity(
      input.safetyStockQuantity,
      0,
      'safetyStockQuantity',
    );
    const isSoldOut = stockQuantity === 0 ? 1 : 0;
    const stockStatus = this.resolveStockStatus(stockQuantity, safetyStockQuantity, isSoldOut);
    const now = this.now();

    const result = db
      .prepare(
        `
        INSERT INTO market_channel_products(
          profileId,
          channelCode,
          sourceProductId,
          productCode,
          productNameSnapshot,
          brandNameSnapshot,
          categoryNameSnapshot,
          purchasePrice,
          salePrice,
          eventPrice,
          eventStartAt,
          eventEndAt,
          stockQuantity,
          safetyStockQuantity,
          stockStatus,
          isOnSale,
          isDisplayed,
          isEventActive,
          isSoldOut,
          lastSyncedAt,
          priceUpdatedAt,
          stockUpdatedAt,
          updatedAt
        )
        VALUES(
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `,
      )
      .run(
        profile.id,
        channelCode,
        masterProduct.id,
        productCode,
        masterProduct.productName,
        masterProduct.brandName,
        masterProduct.categoryName,
        purchasePrice,
        salePrice,
        eventPrice,
        this.normalizeNullableString(input.eventStartAt),
        this.normalizeNullableString(input.eventEndAt),
        stockQuantity,
        safetyStockQuantity,
        stockStatus,
        this.normalizeBoolean(input.isOnSale, true),
        this.normalizeBoolean(input.isDisplayed, true),
        eventPrice === null ? 0 : 1,
        isSoldOut,
        now,
        now,
        now,
        now,
      );

    const created = this.getMarketProductById(
      String(result.lastInsertRowid),
      channelCode,
    );

    this.insertHistory({
      marketProduct: created,
      changeType: 'SYNC',
      beforeValue: null,
      afterValue: this.stringifyHistoryValue({
        productCode,
        sourceProductId: masterProduct.id,
        salePrice,
        stockQuantity,
      }),
      changedByProfileId: this.normalizeNullableId(input.changedByProfileId),
      changeMemo: input.changeMemo ?? '공용 프로덕트 목록에서 등록',
    });

    return created;
  }

  updatePricing(id: string, input: UpdatePricingInput): MarketProductRow {
    const channelCode = this.normalizeChannelCode(input.channelCode);
    const current = this.getMarketProductById(id, channelCode);
    const purchasePrice = this.normalizeMoney(
      input.purchasePrice,
      current.purchasePrice,
      'purchasePrice',
    );
    const salePrice = this.normalizeMoney(input.salePrice, current.salePrice, 'salePrice');
    const eventPrice = this.normalizeNullableMoney(input.eventPrice, 'eventPrice');
    const isEventActive = this.normalizeBoolean(
      input.isEventActive,
      eventPrice !== null,
    );
    const now = this.now();

    db.prepare(
      `
      UPDATE market_channel_products
      SET
        purchasePrice = ?,
        salePrice = ?,
        eventPrice = ?,
        eventStartAt = ?,
        eventEndAt = ?,
        isEventActive = ?,
        priceUpdatedAt = ?,
        updatedAt = ?
      WHERE id = ?
        AND channelCode = ?
        AND deletedAt IS NULL
      `,
    ).run(
      purchasePrice,
      salePrice,
      eventPrice,
      this.normalizeNullableString(input.eventStartAt),
      this.normalizeNullableString(input.eventEndAt),
      isEventActive,
      now,
      now,
      current.id,
      channelCode,
    );

    const updated = this.getMarketProductById(id, channelCode);
    this.insertHistory({
      marketProduct: updated,
      changeType: 'PRICE',
      beforeValue: this.stringifyPricing(current),
      afterValue: this.stringifyPricing(updated),
      changedByProfileId: this.normalizeNullableId(input.changedByProfileId),
      changeMemo: input.changeMemo ?? null,
    });

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
    const stockStatus = this.resolveStockStatus(
      stockQuantity,
      safetyStockQuantity,
      isSoldOut,
    );
    const now = this.now();

    db.prepare(
      `
      UPDATE market_channel_products
      SET
        stockQuantity = ?,
        safetyStockQuantity = ?,
        stockStatus = ?,
        isSoldOut = ?,
        stockUpdatedAt = ?,
        updatedAt = ?
      WHERE id = ?
        AND channelCode = ?
        AND deletedAt IS NULL
      `,
    ).run(
      stockQuantity,
      safetyStockQuantity,
      stockStatus,
      isSoldOut,
      now,
      now,
      current.id,
      channelCode,
    );

    const updated = this.getMarketProductById(id, channelCode);
    this.insertHistory({
      marketProduct: updated,
      changeType: 'STOCK',
      beforeValue: this.stringifyStock(current),
      afterValue: this.stringifyStock(updated),
      changedByProfileId: this.normalizeNullableId(input.changedByProfileId),
      changeMemo: input.changeMemo ?? null,
    });

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
    const stockStatus = this.resolveStockStatus(
      current.stockQuantity,
      current.safetyStockQuantity,
      isSoldOut,
    );
    const now = this.now();

    db.prepare(
      `
      UPDATE market_channel_products
      SET
        isOnSale = ?,
        isDisplayed = ?,
        isSoldOut = ?,
        stockStatus = ?,
        updatedAt = ?
      WHERE id = ?
        AND channelCode = ?
        AND deletedAt IS NULL
      `,
    ).run(
      isOnSale,
      isDisplayed,
      isSoldOut,
      stockStatus,
      now,
      current.id,
      channelCode,
    );

    const updated = this.getMarketProductById(id, channelCode);
    this.insertHistory({
      marketProduct: updated,
      changeType: 'STATUS',
      beforeValue: this.stringifyStatus(current),
      afterValue: this.stringifyStatus(updated),
      changedByProfileId: this.normalizeNullableId(input.changedByProfileId),
      changeMemo: input.changeMemo ?? null,
    });

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
          NULL AS thumbnailUrl
        FROM master_products
        WHERE productCode = ?
          AND isActive = 1
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
          sourceProductId,
          productCode,
          productNameSnapshot,
          brandNameSnapshot,
          categoryNameSnapshot,
          purchasePrice,
          salePrice,
          eventPrice,
          eventStartAt,
          eventEndAt,
          stockQuantity,
          safetyStockQuantity,
          stockStatus,
          isOnSale,
          isDisplayed,
          isEventActive,
          isSoldOut,
          lastSyncedAt,
          priceUpdatedAt,
          stockUpdatedAt,
          createdAt,
          updatedAt
        FROM market_channel_products
        WHERE id = ?
          AND channelCode = ?
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
          SUM(CASE WHEN stockStatus = 'LOW_STOCK' THEN 1 ELSE 0 END) AS lowStockProducts,
          SUM(CASE WHEN isEventActive = 1 THEN 1 ELSE 0 END) AS eventProducts,
          SUM(CASE WHEN isOnSale = 1 THEN 1 ELSE 0 END) AS onSaleProducts
        FROM market_channel_products
        WHERE channelCode = ?
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
    const clauses = ['mp.isActive = 1'];
    const values: string[] = [];
    const keyword = this.normalizeNullableString(query.keyword);
    const category = this.normalizeNullableString(query.category);

    if (keyword) {
      clauses.push(
        `(mp.productName LIKE ? OR mp.productCode LIKE ? OR COALESCE(mp.brandName, '') LIKE ?)`,
      );
      values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
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

    if (!normalized || !/^[A-Z0-9]{12}$/.test(normalized)) {
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

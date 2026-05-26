/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import db from '../../config/database';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
const SYSTEM_MASTER_CHANNEL_CODE = 'SYSTEM_MASTER';
const MASTER_PRODUCT_THUMBNAIL_USAGE_TYPE = 'BARCODE_PRODUCT_THUMBNAIL';
const ALLOWED_THUMBNAIL_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;

type CreateMasterProductFromBarcodeInput = {
  gtin: string;
  productName?: string;
  categoryCode?: string;
  categoryName?: string;
  approvalStatus?: 'DRAFT' | 'APPROVED' | 'REJECTED';
  isActive?: boolean;
};

type MasterBarcodeRow = {
  id: number;
  gtin: string;
  rawProductName: string | null;
  productNameKo: string | null;
  normalizedProductName: string | null;
  brandName: string | null;
  manufacturerName: string | null;
  categoryCode: string | null;
  categoryName: string | null;
  unitLabel: string | null;
  specInfo: string | null;
  isAdultProduct: number;
  isActive: number;
};

type ExistingRelationRow = {
  masterProductId: number;
  productCode: string;
};

type ConnectFromBarcodesResult = {
  createdCount: number;
  linkedCount: number;
  skippedCount: number;
  failedCount: number;
};

type MasterProductsSummary = {
  totalProducts: number;
  connectedBarcodeCount: number;
  thumbnailRegisteredCount: number;
  approvedCount: number;
  pendingReviewCount: number;
  unlinkedBarcodeCount: number;
};

type MasterProductListItem = {
  id: number;
  productCode: string;
  productName: string;
  normalizedProductName: string | null;
  brandName: string | null;
  manufacturerName: string | null;
  categoryCode: string | null;
  categoryName: string | null;
  unitLabel: string | null;
  specInfo: string | null;
  thumbnailImageAssetId: number | null;
  thumbnailUrl: string | null;
  approvalStatus: string;
  isActive: number;
  gtin: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type MasterProductListResult = {
  items: MasterProductListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type MissingThumbnailProductRow = {
  id: number;
  productCode: string;
  gtin: string | null;
  productName: string;
  normalizedProductName: string | null;
  brandName: string | null;
  manufacturerName: string | null;
  categoryName: string | null;
  specInfo: string | null;
  approvalStatus: string;
  thumbnailImageAssetId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type MissingThumbnailProductsResult = {
  items: MissingThumbnailProductRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type CountRow = {
  count: number;
};

type ThumbnailAssetInsertResult = {
  imageAssetId: number;
  filePath: string;
  publicUrl: string;
  fullPath: string;
};

type UpdateMasterProductThumbnailResult = {
  success: true;
  thumbnailImageAssetId: number;
  filePath: string;
};

@Injectable()
export class MasterProductsService {
  getProductDetail(productIdRaw: string): MasterProductListItem {
    const productId = this.requireProductId(productIdRaw);
    const product = db
      .prepare(
        `
        SELECT
          p.id AS id,
          p.productCode AS productCode,
          p.productName AS productName,
          p.normalizedProductName AS normalizedProductName,
          p.brandName AS brandName,
          p.manufacturerName AS manufacturerName,
          p.categoryCode AS categoryCode,
          p.categoryName AS categoryName,
          p.unitLabel AS unitLabel,
          p.specInfo AS specInfo,
          p.thumbnailImageAssetId AS thumbnailImageAssetId,
          CASE
            WHEN ia.filePath IS NOT NULL AND ia.filePath LIKE '/%' THEN ia.filePath
            WHEN ia.filePath IS NOT NULL THEN '/media/' || ia.filePath
            ELSE NULL
          END AS thumbnailUrl,
          p.approvalStatus AS approvalStatus,
          p.isActive AS isActive,
          mpb.gtin AS gtin,
          p.createdAt AS createdAt,
          p.updatedAt AS updatedAt
        FROM master_products p
        LEFT JOIN master_product_barcodes mpb
          ON mpb.masterProductId = p.id
          AND mpb.isPrimary = 1
        LEFT JOIN image_assets ia
          ON ia.id = p.thumbnailImageAssetId
          AND ia.isActive = 1
        WHERE p.id = ?
        LIMIT 1
      `,
      )
      .get(productId) as MasterProductListItem | undefined;

    if (!product) {
      throw new NotFoundException('master product not found');
    }

    return product;
  }

  getProductList(params: {
    page?: string;
    pageSize?: string;
    keyword?: string;
    category?: string;
    status?: string;
  }): MasterProductListResult {
    const page = this.normalizePageNumber(params.page);
    const pageSize = this.normalizeListPageSize(params.pageSize);
    const offset = (page - 1) * pageSize;
    const filters = this.buildProductListFilters(params);
    const totalCount = this.getProductListCount(filters.where, filters.values);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const items = db
      .prepare(
        `
        SELECT
          p.id AS id,
          p.productCode AS productCode,
          p.productName AS productName,
          p.normalizedProductName AS normalizedProductName,
          p.brandName AS brandName,
          p.manufacturerName AS manufacturerName,
          p.categoryCode AS categoryCode,
          p.categoryName AS categoryName,
          p.unitLabel AS unitLabel,
          p.specInfo AS specInfo,
          p.thumbnailImageAssetId AS thumbnailImageAssetId,
          CASE
            WHEN ia.filePath IS NOT NULL AND ia.filePath LIKE '/%' THEN ia.filePath
            WHEN ia.filePath IS NOT NULL THEN '/media/' || ia.filePath
            ELSE NULL
          END AS thumbnailUrl,
          p.approvalStatus AS approvalStatus,
          p.isActive AS isActive,
          mpb.gtin AS gtin,
          p.createdAt AS createdAt,
          p.updatedAt AS updatedAt
        FROM master_products p
        LEFT JOIN master_product_barcodes mpb
          ON mpb.masterProductId = p.id
          AND mpb.isPrimary = 1
        LEFT JOIN image_assets ia
          ON ia.id = p.thumbnailImageAssetId
          AND ia.isActive = 1
        ${filters.where}
        ORDER BY p.id DESC
        LIMIT ?
        OFFSET ?
      `,
      )
      .all(...filters.values, pageSize, offset) as MasterProductListItem[];

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages,
    };
  }

  getSummary(): MasterProductsSummary {
    return {
      totalProducts: this.getCount(
        'SELECT COUNT(*) AS count FROM master_products',
      ),
      connectedBarcodeCount: this.getCount(`
        SELECT COUNT(DISTINCT gtin) AS count
        FROM master_product_barcodes
      `),
      thumbnailRegisteredCount: this.getCount(`
        SELECT COUNT(*) AS count
        FROM master_products
        WHERE thumbnailImageAssetId IS NOT NULL
      `),
      approvedCount: this.getCount(`
        SELECT COUNT(*) AS count
        FROM master_products
        WHERE approvalStatus = 'APPROVED'
      `),
      pendingReviewCount: this.getCount(`
        SELECT COUNT(*) AS count
        FROM master_products
        WHERE approvalStatus = 'DRAFT'
      `),
      unlinkedBarcodeCount: this.getCount(`
        SELECT COUNT(*) AS count
        FROM master_barcodes mb
        LEFT JOIN master_product_barcodes mpb
          ON mpb.gtin = mb.gtin
        WHERE mpb.id IS NULL
      `),
    };
  }

  getMissingThumbnailProducts(
    pageRaw?: string | number,
    pageSizeRaw?: string | number,
  ): MissingThumbnailProductsResult {
    const page = this.normalizePageNumber(pageRaw);
    const pageSize = this.normalizePageSize(pageSizeRaw);
    const offset = (page - 1) * pageSize;
    const totalCount = this.getCount(`
      SELECT COUNT(*) AS count
      FROM master_products
      WHERE thumbnailImageAssetId IS NULL
    `);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const items = db
      .prepare(
        `
        SELECT
          id,
          productCode,
          gtin,
          productName,
          normalizedProductName,
          brandName,
          manufacturerName,
          categoryName,
          specInfo,
          approvalStatus,
          thumbnailImageAssetId,
          createdAt,
          updatedAt
        FROM (
          SELECT
            mp.id AS id,
            mp.productCode AS productCode,
            mpb.gtin AS gtin,
            mp.productName AS productName,
            mp.normalizedProductName AS normalizedProductName,
            mp.brandName AS brandName,
            mp.manufacturerName AS manufacturerName,
            mp.categoryName AS categoryName,
            mp.specInfo AS specInfo,
            mp.approvalStatus AS approvalStatus,
            mp.thumbnailImageAssetId AS thumbnailImageAssetId,
            mp.createdAt AS createdAt,
            mp.updatedAt AS updatedAt
          FROM master_products mp
          LEFT JOIN master_product_barcodes mpb
            ON mpb.masterProductId = mp.id
          WHERE mp.thumbnailImageAssetId IS NULL
          ORDER BY mpb.isPrimary DESC, mpb.id ASC
        )
        GROUP BY id
        ORDER BY id DESC
        LIMIT ?
        OFFSET ?
      `,
      )
      .all(pageSize, offset) as MissingThumbnailProductRow[];

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages,
    };
  }

  async updateThumbnail(
    productIdRaw: string,
    thumbnailFile?: Express.Multer.File,
  ): Promise<UpdateMasterProductThumbnailResult> {
    const productId = this.requireProductId(productIdRaw);

    if (!thumbnailFile) {
      throw new BadRequestException('thumbnail file required');
    }

    const existing = db
      .prepare(
        `
        SELECT id
        FROM master_products
        WHERE id = ?
        LIMIT 1
      `,
      )
      .get(productId) as { id: number } | undefined;

    if (!existing) {
      throw new NotFoundException('master product not found');
    }

    let imageAsset: ThumbnailAssetInsertResult | null = null;

    try {
      db.exec('BEGIN');

      imageAsset = await this.saveThumbnailAsset(thumbnailFile);

      const updateResult = db
        .prepare(
          `
        UPDATE master_products
        SET
          thumbnailImageAssetId = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        )
        .run(imageAsset.imageAssetId, productId);

      if (updateResult.changes !== 1) {
        throw new NotFoundException('master product not found');
      }

      db.exec('COMMIT');

      return {
        success: true,
        thumbnailImageAssetId: imageAsset.imageAssetId,
        filePath: imageAsset.publicUrl,
      };
    } catch (error) {
      this.rollbackQuietly();

      if (imageAsset?.fullPath && fs.existsSync(imageAsset.fullPath)) {
        fs.unlinkSync(imageAsset.fullPath);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'master product thumbnail update failed',
      );
    }
  }

  connectFromBarcodes(): ConnectFromBarcodesResult {
    const rows = db
      .prepare(
        `
      SELECT
        mb.id,
        mb.gtin,
        mb.rawProductName,
        mb.productNameKo,
        mb.normalizedProductName,
        mb.brandName,
        mb.manufacturerName,
        mb.categoryCode,
        mb.categoryName,
        mb.unitLabel,
        mb.specInfo,
        mb.isAdultProduct,
        mb.isActive
      FROM master_barcodes mb
      LEFT JOIN master_product_barcodes mpb
        ON mpb.gtin = mb.gtin
      WHERE mpb.id IS NULL
        AND mb.isActive = 1
      ORDER BY mb.id ASC
    `,
      )
      .all() as MasterBarcodeRow[];

    const result: ConnectFromBarcodesResult = {
      createdCount: 0,
      linkedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    };

    const transaction = db.transaction((barcodeRow: MasterBarcodeRow) => {
      const productName = this.resolveBarcodeProductName(barcodeRow);
      if (!productName) {
        return 'skipped' as const;
      }

      const productCode = this.generateUniqueProductCode();

      const inserted = db
        .prepare(
          `
        INSERT INTO master_products(
          productCode,
          productName,
          normalizedProductName,
          brandName,
          manufacturerName,
          categoryCode,
          categoryName,
          unitLabel,
          specInfo,
          isAdultProduct,
          isActive,
          approvalStatus,
          createdAt,
          updatedAt
        )
        VALUES(
          @productCode,
          @productName,
          @normalizedProductName,
          @brandName,
          @manufacturerName,
          @categoryCode,
          @categoryName,
          @unitLabel,
          @specInfo,
          @isAdultProduct,
          @isActive,
          'DRAFT',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
        )
        .run({
          productCode,
          productName,
          normalizedProductName:
            barcodeRow.normalizedProductName ?? productName,
          brandName: barcodeRow.brandName ?? null,
          manufacturerName: barcodeRow.manufacturerName ?? null,
          categoryCode: barcodeRow.categoryCode ?? null,
          categoryName: barcodeRow.categoryName ?? null,
          unitLabel: barcodeRow.unitLabel ?? null,
          specInfo: barcodeRow.specInfo ?? null,
          isAdultProduct: barcodeRow.isAdultProduct ? 1 : 0,
          isActive: barcodeRow.isActive === 0 ? 0 : 1,
        });

      const masterProductId = Number(inserted.lastInsertRowid);

      db.prepare(
        `
        INSERT INTO master_product_barcodes(
          masterProductId,
          masterBarcodeId,
          gtin,
          productCode,
          isPrimary,
          createdAt
        )
        VALUES(?,?,?,?,1,CURRENT_TIMESTAMP)
      `,
      ).run(masterProductId, barcodeRow.id, barcodeRow.gtin, productCode);

      return 'linked' as const;
    });

    for (const row of rows) {
      try {
        const status = transaction(row);
        if (status === 'linked') {
          result.createdCount += 1;
          result.linkedCount += 1;
        } else {
          result.skippedCount += 1;
        }
      } catch {
        result.failedCount += 1;
      }
    }

    return result;
  }

  createFromBarcode(input: CreateMasterProductFromBarcodeInput) {
    const gtin = this.normalizeGtin(input.gtin);

    const barcodeRow = db
      .prepare(
        `
      SELECT
        id,
        gtin,
        rawProductName,
        productNameKo,
        normalizedProductName,
        brandName,
        manufacturerName,
        categoryCode,
        categoryName,
        unitLabel,
        specInfo,
        isAdultProduct,
        isActive
      FROM master_barcodes
      WHERE gtin = ?
      LIMIT 1
    `,
      )
      .get(gtin) as MasterBarcodeRow | undefined;

    if (!barcodeRow) {
      throw new NotFoundException('MASTER_BARCODE_NOT_FOUND');
    }

    const existingRelation = db
      .prepare(
        `
      SELECT
        mp.id AS masterProductId,
        mp.productCode AS productCode
      FROM master_product_barcodes mpb
      INNER JOIN master_products mp
        ON mp.id = mpb.masterProductId
      WHERE mpb.gtin = ?
      LIMIT 1
    `,
      )
      .get(gtin) as ExistingRelationRow | undefined;

    if (existingRelation) {
      return {
        success: true,
        created: false,
        productCode: existingRelation.productCode,
        masterProductId: existingRelation.masterProductId,
        gtin,
      };
    }

    const productCode = this.generateUniqueProductCode();
    const productName =
      String(input.productName ?? '').trim() ||
      String(barcodeRow.productNameKo ?? '').trim() ||
      String(barcodeRow.rawProductName ?? '').trim() ||
      String(barcodeRow.normalizedProductName ?? '').trim() ||
      `BARCODE-${gtin}`;

    const approvalStatus = input.approvalStatus ?? 'DRAFT';
    const isActive = input.isActive === false ? 0 : 1;

    const transaction = db.transaction(() => {
      const insertMasterProduct = db
        .prepare(
          `
        INSERT INTO master_products(
          productCode,
          productName,
          normalizedProductName,
          brandName,
          manufacturerName,
          categoryCode,
          categoryName,
          unitLabel,
          specInfo,
          isAdultProduct,
          isActive,
          approvalStatus,
          createdAt,
          updatedAt
        )
        VALUES(
          @productCode,
          @productName,
          @normalizedProductName,
          @brandName,
          @manufacturerName,
          @categoryCode,
          @categoryName,
          @unitLabel,
          @specInfo,
          @isAdultProduct,
          @isActive,
          @approvalStatus,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
        )
        .run({
          productCode,
          productName,
          normalizedProductName: barcodeRow.normalizedProductName ?? null,
          brandName: barcodeRow.brandName ?? null,
          manufacturerName: barcodeRow.manufacturerName ?? null,
          categoryCode: input.categoryCode ?? barcodeRow.categoryCode ?? null,
          categoryName: input.categoryName ?? barcodeRow.categoryName ?? null,
          unitLabel: barcodeRow.unitLabel ?? null,
          specInfo: barcodeRow.specInfo ?? null,
          isAdultProduct: barcodeRow.isAdultProduct ? 1 : 0,
          isActive,
          approvalStatus,
        });

      const masterProductId = Number(insertMasterProduct.lastInsertRowid);

      db.prepare(
        `
        INSERT INTO master_product_barcodes(
          masterProductId,
          masterBarcodeId,
          gtin,
          productCode,
          isPrimary,
          createdAt
        )
        VALUES(?,?,?,?,1,CURRENT_TIMESTAMP)
      `,
      ).run(masterProductId, barcodeRow.id, gtin, productCode);

      return {
        masterProductId,
        productCode,
      };
    });

    const result = transaction();

    return {
      success: true,
      created: true,
      gtin,
      productCode: result.productCode,
      masterProductId: result.masterProductId,
    };
  }

  private normalizeGtin(gtinRaw: string): string {
    const gtin = String(gtinRaw ?? '').trim();
    if (!/^\d{13}$/.test(gtin)) {
      throw new BadRequestException('GTIN_13_REQUIRED');
    }
    return gtin;
  }

  private getCount(sql: string): number {
    const row = db.prepare(sql).get() as CountRow | undefined;
    return Number(row?.count ?? 0);
  }

  private getProductListCount(where: string, values: unknown[]): number {
    const row = db
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM master_products p
        LEFT JOIN master_product_barcodes mpb
          ON mpb.masterProductId = p.id
          AND mpb.isPrimary = 1
        ${where}
      `,
      )
      .get(...values) as CountRow | undefined;

    return Number(row?.count ?? 0);
  }

  private buildProductListFilters(params: {
    keyword?: string;
    category?: string;
    status?: string;
  }): {
    where: string;
    values: unknown[];
  } {
    const conditions: string[] = [];
    const values: unknown[] = [];
    const keyword = String(params.keyword ?? '').trim();
    const category = String(params.category ?? '').trim();
    const status = String(params.status ?? '').trim();

    if (keyword) {
      conditions.push(`
        (
          p.productName LIKE ?
          OR p.productCode LIKE ?
          OR p.brandName LIKE ?
          OR p.manufacturerName LIKE ?
          OR mpb.gtin LIKE ?
        )
      `);
      const likeKeyword = `%${keyword}%`;
      values.push(
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
      );
    }

    if (category) {
      conditions.push('(p.categoryName = ? OR p.categoryCode = ?)');
      values.push(category, category);
    }

    if (status) {
      if (status === 'ACTIVE') {
        conditions.push('p.isActive = 1');
      } else if (status === 'INACTIVE') {
        conditions.push('p.isActive = 0');
      } else {
        conditions.push('p.approvalStatus = ?');
        values.push(status);
      }
    }

    return {
      where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }

  private requireProductId(value: string): number {
    const id = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('productId invalid');
    }
    return id;
  }

  private async saveThumbnailAsset(
    file: Express.Multer.File,
  ): Promise<ThumbnailAssetInsertResult> {
    this.validateThumbnailFile(file);

    const directory = path.join(
      UPLOAD_ROOT,
      SYSTEM_MASTER_CHANNEL_CODE,
      'master-products',
    );

    fs.mkdirSync(directory, { recursive: true });

    const fileName = `master_product_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.webp`;
    const fullPath = path.join(directory, fileName);
    const transformed = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 1024,
        height: 1024,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    fs.writeFileSync(fullPath, transformed.data);

    const filePath = `${SYSTEM_MASTER_CHANNEL_CODE}/master-products/${fileName}`;
    const publicUrl = `/media/${filePath}`;
    const checksum = crypto
      .createHash('sha256')
      .update(transformed.data)
      .digest('hex');
    const result = db
      .prepare(
        `
        INSERT INTO image_assets(
          channelCode,
          usageType,
          fileName,
          filePath,
          mimeType,
          fileSize,
          width,
          height,
          storageProvider,
          checksum,
          createdAt
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
          'LOCAL',
          ?,
          CURRENT_TIMESTAMP
        )
      `,
      )
      .run(
        SYSTEM_MASTER_CHANNEL_CODE,
        MASTER_PRODUCT_THUMBNAIL_USAGE_TYPE,
        fileName,
        filePath,
        'image/webp',
        transformed.data.length,
        transformed.info.width || null,
        transformed.info.height || null,
        checksum,
      );

    return {
      imageAssetId: Number(result.lastInsertRowid),
      filePath,
      publicUrl,
      fullPath,
    };
  }

  private validateThumbnailFile(file: Express.Multer.File): void {
    if (!file?.buffer) {
      throw new BadRequestException('thumbnail file invalid');
    }

    if (!ALLOWED_THUMBNAIL_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('thumbnail mime invalid');
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      throw new BadRequestException('thumbnail file too large');
    }
  }

  private rollbackQuietly(): void {
    try {
      db.exec('ROLLBACK');
    } catch {
      return;
    }
  }

  private normalizePageNumber(pageRaw?: string | number): number {
    const page = Number(pageRaw ?? 1);
    if (!Number.isFinite(page) || page < 1) {
      return 1;
    }
    return Math.floor(page);
  }

  private normalizePageSize(pageSizeRaw?: string | number): number {
    const pageSize = Number(pageSizeRaw ?? 20);
    if (!Number.isFinite(pageSize) || pageSize < 1) {
      return 20;
    }
    return Math.min(Math.floor(pageSize), 20);
  }

  private normalizeListPageSize(pageSizeRaw?: string | number): number {
    const pageSize = Number(pageSizeRaw ?? 20);
    if (!Number.isFinite(pageSize) || pageSize < 1) {
      return 20;
    }
    return Math.min(Math.floor(pageSize), 100);
  }

  private resolveBarcodeProductName(
    barcodeRow: MasterBarcodeRow,
  ): string | null {
    const productName =
      String(barcodeRow.productNameKo ?? '').trim() ||
      String(barcodeRow.rawProductName ?? '').trim() ||
      String(barcodeRow.normalizedProductName ?? '').trim();

    return productName || null;
  }

  private generateUniqueProductCode(): string {
    for (let i = 0; i < 10; i += 1) {
      const candidate = this.generateProductCode();
      const exists = db
        .prepare(
          `
        SELECT id
        FROM master_products
        WHERE productCode = ?
        LIMIT 1
      `,
        )
        .get(candidate) as { id?: number } | undefined;

      if (!exists?.id) {
        return candidate;
      }
    }

    throw new BadRequestException('PRODUCT_CODE_GENERATION_FAILED');
  }

  private generateProductCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'RP';
    for (let i = 0; i < 10; i += 1) {
      const idx = Math.floor(Math.random() * chars.length);
      code += chars[idx];
    }
    return code;
  }
}

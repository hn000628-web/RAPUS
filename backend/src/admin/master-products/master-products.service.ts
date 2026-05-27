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
import * as zlib from 'zlib';
import sharp from 'sharp';
import db from '../../config/database';
import {
  BarcodeParserResult,
  BarcodeParserService,
} from '../../modules/barcode-parser/barcode-parser.service';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
const SYSTEM_MASTER_CHANNEL_CODE = 'SYSTEM_MASTER';
const MASTER_PRODUCT_THUMBNAIL_USAGE_TYPE = 'BARCODE_PRODUCT_THUMBNAIL';
const ALLOWED_THUMBNAIL_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_BATCH_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_BATCH_IMAGE_TYPES = [
  'main',
  'detail',
  'event',
  'promotion',
  'extra',
] as const;
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;
const MAX_BATCH_ZIP_SIZE = 50 * 1024 * 1024;
const MAX_BATCH_IMAGE_COUNT = 100;

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

type IntegratedProductSearchInput = {
  productCode?: string;
  scanCodeValue?: string;
  semanticProductCode?: string;
  keyword?: string;
};

type IntegratedMasterProduct = {
  id: number;
  productCode: string;
  productName: string;
  brandName: string | null;
  manufacturerName: string | null;
  supplierName: string | null;
  categoryCode: string | null;
  categoryName: string | null;
  thumbnailImageAssetId: number | null;
  thumbnailUrl: string | null;
  gtin: string | null;
  approvalStatus: string;
  isActive: number;
};

type IntegratedMarketProduct = {
  id: number;
  profileId: number;
  channelCode: string;
  masterProductId: number | null;
  productCode: string;
  barcode: string | null;
  productName: string;
  salePrice: number;
  currentStock: number;
  isActive: number;
  isHidden: number;
  isSoldOut: number;
  displayStatus: string | null;
  eventCode: string | null;
};

type IntegratedPosProduct = {
  id: number;
  profileId: number;
  channelCode: string;
  masterProductId: number | null;
  productId: string | null;
  productCode: string | null;
  productName: string;
  basePrice: number;
  sourceType: string | null;
  isActive: number | null;
  isSoldOut: number | null;
  menuStatus: string | null;
};

type IntegratedEventProduct = {
  eventCode: string;
  channelCode: string;
  eventTitle: string;
  eventType: string;
  eventStatus: string;
  eventStartAt: string | null;
  eventEndAt: string | null;
  linkedProductCount: number;
};

type IntegratedQrProduct = {
  id: number;
  channelCode: string;
  productCode: string;
  scanCodeType: string;
  scanCodeValue: string;
  scanCodeSource: string | null;
  isPrimary: number | null;
  isActive: number | null;
};

type IntegratedProductSearchResult = {
  masterProduct: IntegratedMasterProduct | null;
  marketProducts: IntegratedMarketProduct[];
  posProducts: IntegratedPosProduct[];
  linkedEvents: IntegratedEventProduct[];
  linkedQrProducts: IntegratedQrProduct[];
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

type ThumbnailBatchUploadResult = {
  success: true;
  totalFiles: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  successFiles: BatchThumbnailFileReport[];
  skippedFiles: BatchThumbnailFileIssue[];
  failedFiles: BatchThumbnailFileIssue[];
};

type ZipImageEntry = {
  fileName: string;
  data: Buffer | null;
  skipReason?: BatchThumbnailSkipReason;
};

type BatchImageType = (typeof ALLOWED_BATCH_IMAGE_TYPES)[number];

type ParsedBatchThumbnailFileName = {
  scanCodeValue: string;
  imageNo: number;
  imageType: BatchImageType;
  extension: string;
};

type MasterProductLookupRow = {
  id: number;
  productCode: string;
};

type BatchThumbnailSkipReason =
  | 'INVALID_FILENAME'
  | 'INVALID_EXTENSION'
  | 'SCAN_CODE_NOT_FOUND'
  | 'INVALID_BARCODE_FILENAME'
  | 'DUPLICATE_MAIN_IMAGE'
  | 'HIDDEN_SYSTEM_FILE'
  | 'IMAGE_LIMIT_EXCEEDED'
  | 'BROKEN_ZIP_ENTRY';

type BatchThumbnailFileIssue = {
  fileName: string;
  reason: BatchThumbnailSkipReason | 'IMAGE_PROCESS_FAILED';
  productCode: string | null;
  scanCodeValue: string | null;
  uploadStatus: 'SKIPPED' | 'FAILED';
  linkedThumbnail: string | null;
  createdAt: string;
};

type BatchThumbnailFileReport = {
  fileName: string;
  productCode: string | null;
  scanCodeValue: string | null;
  uploadStatus: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  reason: string | null;
  linkedThumbnail: string | null;
  createdAt: string;
};

type BatchThumbnailParseResult =
  | {
      ok: true;
      value: ParsedBatchThumbnailFileName;
    }
  | {
      ok: false;
      reason: BatchThumbnailSkipReason;
    };

@Injectable()
export class MasterProductsService {
  constructor(private readonly barcodeParserService: BarcodeParserService) {}

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

  searchIntegratedProducts(
    input: IntegratedProductSearchInput,
  ): IntegratedProductSearchResult {
    const productCodes = this.resolveIntegratedSearchProductCodes(input);

    if (productCodes.length === 0) {
      return {
        masterProduct: null,
        marketProducts: [],
        posProducts: [],
        linkedEvents: [],
        linkedQrProducts: [],
      };
    }

    return {
      masterProduct: this.findIntegratedMasterProduct(productCodes[0]),
      marketProducts: this.findIntegratedMarketProducts(productCodes),
      posProducts: this.findIntegratedPosProducts(productCodes),
      linkedEvents: this.findIntegratedEventProducts(productCodes),
      linkedQrProducts: this.findIntegratedQrProducts(productCodes),
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

  async uploadThumbnailBatch(
    zipFile?: Express.Multer.File,
    imageFiles: Express.Multer.File[] = [],
  ): Promise<ThumbnailBatchUploadResult> {
    this.validateBatchUploadInputs(zipFile, imageFiles);

    const entries = [
      ...(zipFile ? this.extractZipImageEntries(zipFile.buffer) : []),
      ...this.extractUploadedImageEntries(imageFiles),
    ];
    const result: ThumbnailBatchUploadResult = {
      success: true,
      totalFiles: entries.length,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      successFiles: [],
      skippedFiles: [],
      failedFiles: [],
    };

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];

      if (index >= MAX_BATCH_IMAGE_COUNT) {
        this.addBatchSkippedFile(result, entry.fileName, 'IMAGE_LIMIT_EXCEEDED');
        continue;
      }

      if (entry.skipReason) {
        this.addBatchSkippedFile(result, entry.fileName, entry.skipReason);
        continue;
      }

      const parsed = this.parseBatchThumbnailFileName(entry.fileName);
      if (!parsed.ok) {
        this.addBatchSkippedFile(result, entry.fileName, parsed.reason);
        continue;
      }

      if (!entry.data?.length) {
        this.addBatchSkippedFile(result, entry.fileName, 'BROKEN_ZIP_ENTRY');
        continue;
      }

      const product = this.findMasterProductForBatchThumbnail(parsed.value);
      if (!product) {
        this.addBatchSkippedFile(result, entry.fileName, 'SCAN_CODE_NOT_FOUND');
        continue;
      }

      if (this.hasActivePrimaryThumbnail(product.id)) {
        this.addBatchSkippedFile(result, entry.fileName, 'DUPLICATE_MAIN_IMAGE');
        continue;
      }

      let imageAsset: ThumbnailAssetInsertResult | null = null;

      try {
        db.exec('BEGIN');

        imageAsset = await this.saveBatchThumbnailAsset(
          entry.data,
          product.productCode,
          parsed.value.imageNo,
          parsed.value.imageType,
        );

        this.connectMasterProductThumbnail({
          masterProductId: product.id,
          imageAssetId: imageAsset.imageAssetId,
          imageNo: parsed.value.imageNo,
          imageType: parsed.value.imageType,
        });

        db.exec('COMMIT');
        result.successCount += 1;
        result.successFiles.push({
          fileName: entry.fileName,
          productCode: product.productCode,
          scanCodeValue: parsed.value.scanCodeValue,
          uploadStatus: 'SUCCESS',
          reason: null,
          linkedThumbnail: imageAsset.publicUrl,
          createdAt: new Date().toISOString(),
        });
      } catch {
        this.rollbackQuietly();

        if (imageAsset?.fullPath && fs.existsSync(imageAsset.fullPath)) {
          fs.unlinkSync(imageAsset.fullPath);
        }

        this.addBatchFailedFile(result, entry.fileName, 'IMAGE_PROCESS_FAILED');
      }
    }

    return result;
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

      const parsedProductCode =
        this.barcodeParserService.parseScanCodeValue(barcodeRow.gtin);
      const productCode = parsedProductCode.productCode;

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
          semanticProductCode,
          primaryScanCodeValue,
          semanticTypePrefix,
          semanticItemCode,
          barcodeParserType,
          barcodeParserVersion,
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
          @semanticProductCode,
          @primaryScanCodeValue,
          @semanticTypePrefix,
          @semanticItemCode,
          @barcodeParserType,
          @barcodeParserVersion,
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
          semanticProductCode: parsedProductCode.semanticProductCode,
          primaryScanCodeValue: parsedProductCode.scanCodeValue,
          semanticTypePrefix: parsedProductCode.semanticTypePrefix,
          semanticItemCode: parsedProductCode.semanticItemCode,
          barcodeParserType: parsedProductCode.parserType,
          barcodeParserVersion: parsedProductCode.parserVersion,
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

      this.insertPrimaryMasterScanCode(masterProductId, parsedProductCode);

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

    const parsedProductCode = this.barcodeParserService.parseScanCodeValue(gtin);
    const productCode = parsedProductCode.productCode;
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
          semanticProductCode,
          primaryScanCodeValue,
          semanticTypePrefix,
          semanticItemCode,
          barcodeParserType,
          barcodeParserVersion,
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
          @semanticProductCode,
          @primaryScanCodeValue,
          @semanticTypePrefix,
          @semanticItemCode,
          @barcodeParserType,
          @barcodeParserVersion,
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
          semanticProductCode: parsedProductCode.semanticProductCode,
          primaryScanCodeValue: parsedProductCode.scanCodeValue,
          semanticTypePrefix: parsedProductCode.semanticTypePrefix,
          semanticItemCode: parsedProductCode.semanticItemCode,
          barcodeParserType: parsedProductCode.parserType,
          barcodeParserVersion: parsedProductCode.parserVersion,
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

      this.insertPrimaryMasterScanCode(masterProductId, parsedProductCode);

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

  private resolveIntegratedSearchProductCodes(
    input: IntegratedProductSearchInput,
  ): string[] {
    const productCode = this.normalizeOptionalProductCode(input.productCode);
    if (productCode) {
      return [productCode];
    }

    const scanCodeValue = this.normalizeOptionalScanCodeValue(
      input.scanCodeValue,
    );
    if (scanCodeValue) {
      const productCodeByScanCode =
        this.findProductCodeByScanCodeValue(scanCodeValue);
      return productCodeByScanCode ? [productCodeByScanCode] : [];
    }

    const semanticProductCode = String(input.semanticProductCode ?? '')
      .trim()
      .toUpperCase();
    if (semanticProductCode) {
      const productCodeBySemantic =
        this.findProductCodeBySemanticProductCode(semanticProductCode);
      return productCodeBySemantic ? [productCodeBySemantic] : [];
    }

    const keyword = String(input.keyword ?? '').trim();
    if (!keyword) {
      throw new BadRequestException(
        'productCode, scanCodeValue, semanticProductCode or keyword required',
      );
    }

    const likeKeyword = `%${keyword}%`;
    const rows = db
      .prepare(
        `
        SELECT DISTINCT productCode
        FROM (
          SELECT p.productCode AS productCode
          FROM master_products p
          LEFT JOIN master_product_scan_codes mpsc
            ON mpsc.productCode = p.productCode
            AND mpsc.deletedAt IS NULL
          LEFT JOIN master_product_barcodes mpb
            ON mpb.masterProductId = p.id
            AND mpb.isPrimary = 1
          WHERE p.productCode LIKE ?
            OR p.productName LIKE ?
            OR p.brandName LIKE ?
            OR p.manufacturerName LIKE ?
            OR p.supplierName LIKE ?
            OR p.categoryCode LIKE ?
            OR p.semanticProductCode LIKE ?
            OR mpsc.scanCodeValue LIKE ?
            OR mpb.gtin LIKE ?
            OR EXISTS (
              SELECT 1
              FROM semantic_item_registry sir
              WHERE sir.itemCode = p.semanticItemCode
                AND (
                  sir.itemName LIKE ?
                  OR sir.aliases LIKE ?
                )
            )

          UNION

          SELECT productCode
          FROM market_products
          WHERE productCode IS NOT NULL
            AND (
              productCode LIKE ?
              OR productName LIKE ?
              OR barcode LIKE ?
              OR supplierName LIKE ?
              OR eventCode LIKE ?
            )

          UNION

          SELECT productCode
          FROM pos_products
          WHERE productCode IS NOT NULL
            AND (
              productCode LIKE ?
              OR productName LIKE ?
              OR productId LIKE ?
            )
        )
        WHERE productCode IS NOT NULL
        LIMIT 50
      `,
      )
      .all(
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
        likeKeyword,
      ) as { productCode: string }[];

    return rows.map((row) => row.productCode);
  }

  private findProductCodeByScanCodeValue(scanCodeValue: string): string | null {
    const scanCodeRow = db
      .prepare(
        `
        SELECT mp.productCode AS productCode
        FROM master_product_scan_codes mpsc
        JOIN master_products mp
          ON mp.id = mpsc.masterProductId
          OR mp.productCode = mpsc.productCode
        WHERE mpsc.scanCodeValue = ?
          AND mpsc.deletedAt IS NULL
        ORDER BY mpsc.isPrimary DESC, mpsc.id DESC
        LIMIT 1
      `,
      )
      .get(scanCodeValue) as { productCode: string } | undefined;

    if (scanCodeRow?.productCode) {
      return scanCodeRow.productCode;
    }

    const barcodeRow = db
      .prepare(
        `
        SELECT mp.productCode AS productCode
        FROM master_barcodes mb
        JOIN master_product_barcodes mpb
          ON mpb.masterBarcodeId = mb.id
        JOIN master_products mp
          ON mp.id = mpb.masterProductId
          OR mp.productCode = mpb.productCode
        WHERE mb.gtin = ?
          AND COALESCE(mb.isActive, 1) = 1
        ORDER BY mpb.isPrimary DESC, mpb.id DESC
        LIMIT 1
      `,
      )
      .get(scanCodeValue) as { productCode: string } | undefined;

    return barcodeRow?.productCode ?? null;
  }

  private findProductCodeBySemanticProductCode(
    semanticProductCode: string,
  ): string | null {
    const row = db
      .prepare(
        `
        SELECT productCode
        FROM master_products
        WHERE semanticProductCode = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      )
      .get(semanticProductCode) as { productCode: string } | undefined;

    return row?.productCode ?? null;
  }

  private findIntegratedMasterProduct(
    productCode: string,
  ): IntegratedMasterProduct | null {
    const row = db
      .prepare(
        `
        SELECT
          p.id AS id,
          p.productCode AS productCode,
          p.productName AS productName,
          p.brandName AS brandName,
          p.manufacturerName AS manufacturerName,
          p.supplierName AS supplierName,
          p.categoryCode AS categoryCode,
          p.categoryName AS categoryName,
          p.thumbnailImageAssetId AS thumbnailImageAssetId,
          CASE
            WHEN ia.filePath IS NOT NULL AND ia.filePath LIKE '/%' THEN ia.filePath
            WHEN ia.filePath IS NOT NULL THEN '/media/' || ia.filePath
            ELSE NULL
          END AS thumbnailUrl,
          COALESCE(mpsc.scanCodeValue, mpb.gtin) AS gtin,
          p.approvalStatus AS approvalStatus,
          p.isActive AS isActive
        FROM master_products p
        LEFT JOIN image_assets ia
          ON ia.id = p.thumbnailImageAssetId
          AND ia.isActive = 1
        LEFT JOIN master_product_scan_codes mpsc
          ON mpsc.productCode = p.productCode
          AND mpsc.isPrimary = 1
          AND mpsc.deletedAt IS NULL
        LEFT JOIN master_product_barcodes mpb
          ON mpb.masterProductId = p.id
          AND mpb.isPrimary = 1
        WHERE p.productCode = ?
        LIMIT 1
      `,
      )
      .get(productCode) as IntegratedMasterProduct | undefined;

    return row ?? null;
  }

  private findIntegratedMarketProducts(
    productCodes: string[],
  ): IntegratedMarketProduct[] {
    const { clause, values } = this.buildProductCodeInClause(productCodes);
    return db
      .prepare(
        `
        SELECT
          id,
          profileId,
          channelCode,
          masterProductId,
          productCode,
          barcode,
          productName,
          salePrice,
          currentStock,
          isActive,
          isHidden,
          isSoldOut,
          displayStatus,
          eventCode
        FROM market_products
        WHERE productCode IN (${clause})
          AND COALESCE(isDeleted, 0) = 0
        ORDER BY channelCode ASC, id DESC
      `,
      )
      .all(...values) as IntegratedMarketProduct[];
  }

  private findIntegratedPosProducts(
    productCodes: string[],
  ): IntegratedPosProduct[] {
    const { clause, values } = this.buildProductCodeInClause(productCodes);
    return db
      .prepare(
        `
        SELECT
          id,
          profileId,
          channelCode,
          masterProductId,
          productId,
          productCode,
          productName,
          basePrice,
          sourceType,
          isActive,
          isSoldOut,
          menuStatus
        FROM pos_products
        WHERE productCode IN (${clause})
          AND deletedAt IS NULL
        ORDER BY channelCode ASC, sortOrder ASC, id DESC
      `,
      )
      .all(...values) as IntegratedPosProduct[];
  }

  private findIntegratedEventProducts(
    productCodes: string[],
  ): IntegratedEventProduct[] {
    const { clause, values } = this.buildProductCodeInClause(productCodes);
    return db
      .prepare(
        `
        SELECT
          em.eventCode AS eventCode,
          em.channelCode AS channelCode,
          em.eventTitle AS eventTitle,
          em.eventType AS eventType,
          em.eventStatus AS eventStatus,
          em.eventStartAt AS eventStartAt,
          em.eventEndAt AS eventEndAt,
          COUNT(mp.id) AS linkedProductCount
        FROM market_event_masters em
        JOIN market_products mp
          ON mp.channelCode = em.channelCode
          AND mp.eventCode = em.eventCode
          AND COALESCE(mp.isDeleted, 0) = 0
        WHERE mp.productCode IN (${clause})
        GROUP BY
          em.eventCode,
          em.channelCode,
          em.eventTitle,
          em.eventType,
          em.eventStatus,
          em.eventStartAt,
          em.eventEndAt
        ORDER BY em.eventStartAt DESC, em.id DESC
      `,
      )
      .all(...values) as IntegratedEventProduct[];
  }

  private findIntegratedQrProducts(
    productCodes: string[],
  ): IntegratedQrProduct[] {
    const { clause, values } = this.buildProductCodeInClause(productCodes);
    return db
      .prepare(
        `
        SELECT
          id,
          channelCode,
          productCode,
          scanCodeType,
          scanCodeValue,
          scanCodeSource,
          isPrimary,
          isActive
        FROM pos_product_scan_codes
        WHERE productCode IN (${clause})
          AND deletedAt IS NULL
          AND (
            scanCodeType = 'RAPUS_QR'
            OR scanCodeValue LIKE 'RAPUS:PRODUCT:%'
          )
        ORDER BY isPrimary DESC, id DESC
      `,
      )
      .all(...values) as IntegratedQrProduct[];
  }

  private buildProductCodeInClause(productCodes: string[]): {
    clause: string;
    values: string[];
  } {
    const values = productCodes
      .map((productCode) => productCode.trim().toUpperCase())
      .filter((productCode) =>
        this.barcodeParserService.isRapusProductCode(productCode),
      );

    if (values.length === 0) {
      throw new BadRequestException('productCode invalid');
    }

    return {
      clause: values.map(() => '?').join(', '),
      values,
    };
  }

  private normalizeOptionalProductCode(value?: string): string | null {
    const productCode = String(value ?? '').trim().toUpperCase();

    if (!productCode) {
      return null;
    }

    if (!this.barcodeParserService.isRapusProductCode(productCode)) {
      throw new BadRequestException('productCode invalid');
    }

    return productCode;
  }

  private normalizeOptionalScanCodeValue(value?: string): string | null {
    const scanCodeValue = String(value ?? '').trim().replace(/\D/g, '');

    if (!scanCodeValue) {
      return null;
    }

    if (!/^\d{8,14}$/.test(scanCodeValue)) {
      throw new BadRequestException('scanCodeValue invalid');
    }

    return scanCodeValue;
  }

  private requireProductId(value: string): number {
    const id = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('productId invalid');
    }
    return id;
  }

  private validateBatchZipFile(
    file?: Express.Multer.File,
  ): asserts file is Express.Multer.File {
    if (!file?.buffer) {
      throw new BadRequestException('zipFile required');
    }

    const fileName = String(file.originalname ?? '').toLowerCase();
    if (!fileName.endsWith('.zip')) {
      throw new BadRequestException('zip file required');
    }

    if (file.size > MAX_BATCH_ZIP_SIZE) {
      throw new BadRequestException('zip file too large');
    }
  }

  private validateBatchUploadInputs(
    zipFile?: Express.Multer.File,
    imageFiles: Express.Multer.File[] = [],
  ): void {
    if (!zipFile?.buffer && imageFiles.length === 0) {
      throw new BadRequestException('zipFile or imageFiles required');
    }

    if (zipFile) {
      this.validateBatchZipFile(zipFile);
    }

    if (imageFiles.length > MAX_BATCH_IMAGE_COUNT) {
      throw new BadRequestException('image file count exceeded');
    }

    const totalImageSize = imageFiles.reduce((sum, file) => {
      return sum + (file.size ?? file.buffer?.length ?? 0);
    }, 0);

    if (totalImageSize > MAX_BATCH_ZIP_SIZE) {
      throw new BadRequestException('image files are too large');
    }
  }

  private extractUploadedImageEntries(
    imageFiles: Express.Multer.File[],
  ): ZipImageEntry[] {
    return imageFiles.map((file) => {
      const fileName = String(file.originalname ?? '').trim().replace(/\s+/g, '');
      const extension = path.extname(fileName).replace('.', '').toLowerCase();

      if (!ALLOWED_BATCH_IMAGE_EXTENSIONS.includes(extension)) {
        return {
          fileName: fileName || 'UNKNOWN_FILE',
          data: null,
          skipReason: 'INVALID_EXTENSION',
        };
      }

      return {
        fileName,
        data: file.buffer ?? null,
      };
    });
  }

  private extractZipImageEntries(zipBuffer: Buffer): ZipImageEntry[] {
    const eocdOffset = this.findEndOfCentralDirectoryOffset(zipBuffer);
    if (eocdOffset < 0) {
      throw new BadRequestException('zip file invalid');
    }

    const centralDirectorySize = zipBuffer.readUInt32LE(eocdOffset + 12);
    const centralDirectoryOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
    const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

    if (
      centralDirectoryOffset < 0 ||
      centralDirectoryEnd > zipBuffer.length ||
      centralDirectoryOffset >= centralDirectoryEnd
    ) {
      throw new BadRequestException('zip central directory invalid');
    }

    const entries: ZipImageEntry[] = [];
    let offset = centralDirectoryOffset;

    while (offset < centralDirectoryEnd) {
      if (zipBuffer.readUInt32LE(offset) !== 0x02014b50) {
        break;
      }

      const compressionMethod = zipBuffer.readUInt16LE(offset + 10);
      const compressedSize = zipBuffer.readUInt32LE(offset + 20);
      const fileNameLength = zipBuffer.readUInt16LE(offset + 28);
      const extraLength = zipBuffer.readUInt16LE(offset + 30);
      const commentLength = zipBuffer.readUInt16LE(offset + 32);
      const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42);
      const fileName = zipBuffer
        .subarray(offset + 46, offset + 46 + fileNameLength)
        .toString('utf8');
      const normalizedFileName = this.normalizeBatchZipEntryName(fileName);

      offset += 46 + fileNameLength + extraLength + commentLength;

      if (!normalizedFileName || normalizedFileName.endsWith('/')) {
        continue;
      }

      if (this.isHiddenSystemZipEntry(normalizedFileName)) {
        entries.push({
          fileName: normalizedFileName,
          data: null,
          skipReason: 'HIDDEN_SYSTEM_FILE',
        });
        continue;
      }

      const extension = path
        .extname(normalizedFileName)
        .replace('.', '')
        .toLowerCase();
      if (!ALLOWED_BATCH_IMAGE_EXTENSIONS.includes(extension)) {
        entries.push({
          fileName: normalizedFileName,
          data: null,
          skipReason: 'INVALID_EXTENSION',
        });
        continue;
      }

      try {
        const localData = this.extractZipEntryData({
          zipBuffer,
          localHeaderOffset,
          compressedSize,
          compressionMethod,
        });

        entries.push({
          fileName: normalizedFileName,
          data: localData,
        });
      } catch {
        entries.push({
          fileName: normalizedFileName,
          data: null,
          skipReason: 'BROKEN_ZIP_ENTRY',
        });
      }
    }

    return entries;
  }

  private findEndOfCentralDirectoryOffset(zipBuffer: Buffer): number {
    if (zipBuffer.length < 22) {
      return -1;
    }

    const minimumOffset = Math.max(0, zipBuffer.length - 65557);

    for (let offset = zipBuffer.length - 22; offset >= minimumOffset; offset -= 1) {
      if (zipBuffer.readUInt32LE(offset) === 0x06054b50) {
        return offset;
      }
    }

    return -1;
  }

  private extractZipEntryData(params: {
    zipBuffer: Buffer;
    localHeaderOffset: number;
    compressedSize: number;
    compressionMethod: number;
  }): Buffer {
    const { zipBuffer, localHeaderOffset, compressedSize, compressionMethod } =
      params;

    if (
      localHeaderOffset < 0 ||
      localHeaderOffset + 30 > zipBuffer.length ||
      zipBuffer.readUInt32LE(localHeaderOffset) !== 0x04034b50
    ) {
      throw new BadRequestException('zip local header invalid');
    }

    const fileNameLength = zipBuffer.readUInt16LE(localHeaderOffset + 26);
    const extraLength = zipBuffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > zipBuffer.length) {
      throw new BadRequestException('zip entry invalid');
    }

    const compressedData = zipBuffer.subarray(dataStart, dataEnd);

    if (compressionMethod === 0) {
      return Buffer.from(compressedData);
    }

    if (compressionMethod === 8) {
      return zlib.inflateRawSync(compressedData);
    }

    throw new BadRequestException('zip compression unsupported');
  }

  private normalizeBatchZipEntryName(fileName: string): string {
    return fileName.trim().replace(/\\/g, '/');
  }

  private isHiddenSystemZipEntry(fileName: string): boolean {
    const parts = fileName.split('/').filter(Boolean);
    const baseName = parts.at(-1) ?? '';

    return (
      parts.includes('__MACOSX') ||
      baseName === '.DS_Store' ||
      baseName.startsWith('._')
    );
  }

  private parseBatchThumbnailFileName(
    fileName: string,
  ): BatchThumbnailParseResult {
    const baseName = path.basename(fileName).trim().replace(/\s+/g, '');
    const extension = path.extname(baseName).replace('.', '').toLowerCase();

    if (!ALLOWED_BATCH_IMAGE_EXTENSIONS.includes(extension)) {
      return {
        ok: false,
        reason: 'INVALID_EXTENSION',
      };
    }

    const nameWithoutExtension = baseName.slice(
      0,
      baseName.length - extension.length - 1,
    );
    const scanCodeValue = nameWithoutExtension.replace(/\D/g, '');

    if (!/^\d{8,14}$/.test(scanCodeValue)) {
      return {
        ok: false,
        reason: 'INVALID_BARCODE_FILENAME',
      };
    }

    return {
      ok: true,
      value: {
        scanCodeValue,
        imageNo: 1,
        imageType: 'main',
        extension,
      },
    };
  }

  private isAllowedBatchImageType(value: string): value is BatchImageType {
    return ALLOWED_BATCH_IMAGE_TYPES.includes(value as BatchImageType);
  }

  private findMasterProductForBatchThumbnail(
    parsed: ParsedBatchThumbnailFileName,
  ): MasterProductLookupRow | null {
    const productByScanCode = db
      .prepare(
        `
        SELECT
          mp.id AS id,
          mp.productCode AS productCode
        FROM master_product_scan_codes mpsc
        INNER JOIN master_products mp
          ON mp.id = mpsc.masterProductId
          OR mp.productCode = mpsc.productCode
        WHERE mpsc.scanCodeValue = ?
          AND mpsc.isActive = 1
          AND mpsc.deletedAt IS NULL
        LIMIT 1
      `,
      )
      .get(parsed.scanCodeValue) as MasterProductLookupRow | undefined;

    if (productByScanCode) {
      return productByScanCode;
    }

    const productByBarcode = db
      .prepare(
        `
        SELECT
          mp.id AS id,
          mp.productCode AS productCode
        FROM master_barcodes mb
        INNER JOIN master_product_barcodes mpb
          ON mpb.masterBarcodeId = mb.id
          OR mpb.gtin = mb.gtin
        INNER JOIN master_products mp
          ON mp.id = mpb.masterProductId
        WHERE mb.gtin = ?
        LIMIT 1
      `,
      )
      .get(parsed.scanCodeValue) as MasterProductLookupRow | undefined;

    return productByBarcode ?? null;
  }

  private hasActivePrimaryThumbnail(masterProductId: number): boolean {
    const row = db
      .prepare(
        `
        SELECT
          id
        FROM master_product_thumbnails
        WHERE masterProductId = ?
          AND isPrimary = 1
          AND isActive = 1
        LIMIT 1
      `,
      )
      .get(masterProductId) as { id: number } | undefined;

    return Boolean(row);
  }

  private async saveBatchThumbnailAsset(
    imageBuffer: Buffer,
    productCode: string,
    imageNo: number,
    imageType: BatchImageType,
  ): Promise<ThumbnailAssetInsertResult> {
    if (!imageBuffer.length) {
      throw new BadRequestException('thumbnail image invalid');
    }

    const directory = path.join(
      UPLOAD_ROOT,
      SYSTEM_MASTER_CHANNEL_CODE,
      'products',
      'master',
    );

    fs.mkdirSync(directory, { recursive: true });

    const fileName = `${productCode}_${imageNo}_${imageType}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.webp`;
    const fullPath = path.join(directory, fileName);
    const transformed = await sharp(imageBuffer)
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

    const filePath = `${SYSTEM_MASTER_CHANNEL_CODE}/products/master/${fileName}`;
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

  private connectMasterProductThumbnail(params: {
    masterProductId: number;
    imageAssetId: number;
    imageNo: number;
    imageType: BatchImageType;
  }): void {
    const isPrimary = params.imageNo === 1 && params.imageType === 'main';

    db.prepare(
      `
      UPDATE master_product_thumbnails
      SET
        isActive = 0,
        updatedAt = CURRENT_TIMESTAMP
      WHERE masterProductId = ?
        AND sortOrder = ?
        AND isActive = 1
    `,
    ).run(params.masterProductId, params.imageNo);

    if (isPrimary) {
      db.prepare(
        `
        UPDATE master_product_thumbnails
        SET
          isPrimary = 0,
          isActive = 0,
          updatedAt = CURRENT_TIMESTAMP
        WHERE masterProductId = ?
          AND isPrimary = 1
      `,
      ).run(params.masterProductId);
    }

    db.prepare(
      `
      INSERT INTO master_product_thumbnails(
        masterProductId,
        imageAssetId,
        sortOrder,
        isPrimary,
        isActive,
        createdAt,
        updatedAt
      )
      VALUES(?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `,
    ).run(
      params.masterProductId,
      params.imageAssetId,
      params.imageNo,
      isPrimary ? 1 : 0,
    );

    if (isPrimary) {
      db.prepare(
        `
        UPDATE master_products
        SET
          thumbnailImageAssetId = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(params.imageAssetId, params.masterProductId);
    }
  }

  private addBatchSkippedFile(
    result: ThumbnailBatchUploadResult,
    fileName: string,
    reason: BatchThumbnailSkipReason,
  ): void {
    const reportTokens = this.extractBatchThumbnailReportTokens(fileName);

    result.skippedCount += 1;
    result.skippedFiles.push({
      fileName,
      reason,
      productCode: reportTokens.productCode,
      scanCodeValue: reportTokens.scanCodeValue,
      uploadStatus: 'SKIPPED',
      linkedThumbnail: null,
      createdAt: new Date().toISOString(),
    });
  }

  private addBatchFailedFile(
    result: ThumbnailBatchUploadResult,
    fileName: string,
    reason: 'IMAGE_PROCESS_FAILED',
  ): void {
    const reportTokens = this.extractBatchThumbnailReportTokens(fileName);

    result.failedCount += 1;
    result.failedFiles.push({
      fileName,
      reason,
      productCode: reportTokens.productCode,
      scanCodeValue: reportTokens.scanCodeValue,
      uploadStatus: 'FAILED',
      linkedThumbnail: null,
      createdAt: new Date().toISOString(),
    });
  }

  private extractBatchThumbnailReportTokens(fileName: string): {
    productCode: string | null;
    scanCodeValue: string | null;
  } {
    const baseName = path.basename(fileName).trim().replace(/\s+/g, '');
    const extension = path.extname(baseName);
    const nameWithoutExtension = extension
      ? baseName.slice(0, baseName.length - extension.length)
      : baseName;
    const scanCodeValue = nameWithoutExtension.replace(/\D/g, '');

    return {
      productCode: null,
      scanCodeValue: scanCodeValue || null,
    };
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

  private insertPrimaryMasterScanCode(
    masterProductId: number,
    parsed: BarcodeParserResult,
  ) {
    db.prepare(
      `
      INSERT OR IGNORE INTO master_product_scan_codes(
        masterProductId,
        productCode,
        scanCodeType,
        scanCodeValue,
        scanCodeSource,
        externalBarcodeFormat,
        isPrimary,
        isActive,
        createdAt,
        updatedAt
      )
      VALUES(?,?,?,?,?,?,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `,
    ).run(
      masterProductId,
      parsed.productCode,
      parsed.parserType === 'EAN13_BARCODE'
        ? 'EXTERNAL_BARCODE'
        : 'CUSTOM',
      parsed.scanCodeValue,
      parsed.parserType === 'EAN13_BARCODE'
        ? 'MANUFACTURER'
        : 'CUSTOM',
      parsed.parserType === 'EAN13_BARCODE' ? 'EAN13' : null,
    );
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

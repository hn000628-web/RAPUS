import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

import db from '../../config/database';
import {
  BarcodeParserResult,
  BarcodeParserService,
} from '../barcode-parser/barcode-parser.service';

export type StockNormalizeMemo =
  | 'NEGATIVE_STOCK_NORMALIZED_TO_ZERO'
  | 'INVALID_STOCK_VALUE'
  | 'STOCK_UPDATE_SKIPPED'
  | null;

export type StockNormalizationResult = {
  rawStockQuantity: string | null;
  normalizedStockQuantity: number | null;
  stockNormalizeMemo: StockNormalizeMemo;
};

type MarketProductEventStatus =
  | 'NONE'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'ENDED';

type NormalizeStockOptions = {
  skipStockUpdate?: boolean;
};

type BusinessProfileRow = {
  id: number;
  channelCode: string;
};

type MasterProductMatchRow = {
  masterProductId: number;
  productCode: string;
  productName: string;
  brandName: string | null;
  categoryName: string | null;
  semanticProductCode: string | null;
  categoryType: string | null;
  parserType: BarcodeParserResult['parserType'] | null;
  thumbnailUrl: string | null;
};

type ImportRowRecord = Record<string, string | number | boolean | null | undefined>;

type NormalizedImportRow = {
  rowNo: number;
  productName: string | null;
  spec: string | null;
  scanCodeValue: string | null;
  supplierName: string | null;
  purchasePrice: number;
  salePrice: number;
  eventGroupName: string | null;
  eventPurchasePrice: number | null;
  eventPrice: number | null;
  eventCode: string | null;
  eventTitle: string | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  eventStatus: MarketProductEventStatus;
  stock: StockNormalizationResult;
  stockAmount: number;
  safetyStockQuantity: number;
  dailySalesQuantity: number;
  boxQuantity: number;
  abcGrade: string | null;
  categoryLarge: string | null;
  categoryMedium: string | null;
  categorySmall: string | null;
  volume: string | null;
  unitPrice: string | null;
  purchasePriceChangedAt: string | null;
  salePriceChangedAt: string | null;
  lastPurchasedAt: string | null;
  lastStockCheckedAt: string | null;
  registeredAt: string | null;
  modifiedAt: string | null;
  description: string | null;
  origin: string | null;
  shelfNo: string | null;
  duplicateScanCode: boolean;
  matchedProduct: MasterProductMatchRow | null;
};

type ImportPreviewRow = {
  id: number;
  rowNo: number;
  productName: string | null;
  brandName: string | null;
  scanCodeValue: string | null;
  productCode: string | null;
  semanticProductCode: string | null;
  categoryType: string | null;
  parserType: BarcodeParserResult['parserType'] | null;
  parserStatus: 'PARSER_SUCCESS' | 'SEMANTIC_REGISTRY_MATCHED' | 'RAW_UNKNOWN' | 'PARSER_FAILED';
  masterLinkStatus: 'LINKED' | 'CREATE_REQUIRED' | 'PARSER_FAILED';
  imageLinkStatus: 'LINKED' | 'MISSING';
  thumbnailUrl: string | null;
  salePrice: number;
  eventCode: string | null;
  eventTitle: string | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  eventStatus: MarketProductEventStatus;
  normalizedStockQuantity: number | null;
  stockNormalizeMemo: StockNormalizeMemo;
  mappedProductCode: string | null;
  rowStatus: string;
  displayStatus: 'MATCHED' | 'NEW_PRODUCT_REQUIRED' | 'MISSING_BARCODE' | 'STOCK_WARNING' | 'DUPLICATE_SCAN_CODE';
  errorMessage: string | null;
};

type ImportPreviewResponse = {
  batchId: number;
  summary: {
    totalRows: number;
    matchedRows: number;
    newProductRows: number;
    errorRows: number;
    duplicateRows: number;
  };
  rows: ImportPreviewRow[];
};

type ImportConfirmResponse = {
  batchId: number;
  mode: ImportConfirmMode;
  createdProducts: number;
  updatedProducts: number;
  skippedRows: number;
  failedRows: number;
};

type ImportApplyResponse = {
  success: true;
  uploadMode: ImportUploadMode;
  totalCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  soldOutCount: number;
  restoredCount: number;
};

type ApplyImportPreviewInput = {
  channelCode?: string;
  batchId?: number | string;
  uploadMode?: string;
  previewRows?: unknown[];
};

export type ImportUploadMode =
  | 'FULL_SYNC'
  | 'PARTIAL_UPDATE';

export type ImportConfirmMode =
  | 'AUTO_MATCH'
  | 'CREATE_ONLY'
  | 'UPDATE_EXISTING'
  | 'STOCK_ONLY'
  | 'PRICE_ONLY';

type ImportConfirmSkipReason =
  | 'SKIPPED_BY_CREATE_ONLY_MATCHED_ROW'
  | 'SKIPPED_BY_UPDATE_EXISTING_UNMATCHED_ROW'
  | 'SKIPPED_BY_STOCK_ONLY_UNMATCHED_ROW'
  | 'SKIPPED_BY_PRICE_ONLY_UNMATCHED_ROW'
  | 'SKIPPED_INVALID_STOCK_VALUE';

type MarketProductStockRow = {
  id: number;
  channelCode: string;
  productCode: string;
  stockQuantity: number;
  safetyStockQuantity: number;
  isSoldOut: number;
};

type ImportRowForConfirm = {
  id: number;
  profileId: number;
  channelCode: string;
  rawProductName: string | null;
  rawSpec: string | null;
  rawBarcode: string | null;
  rawSupplierName: string | null;
  rawPurchasePrice: string | null;
  rawSalePrice: string | null;
  rawEventGroupName: string | null;
  rawEventPurchasePrice: string | null;
  rawEventSalePrice: string | null;
  rawEventCode: string | null;
  rawEventTitle: string | null;
  rawEventStartAt: string | null;
  rawEventEndAt: string | null;
  rawStockAmount: string | null;
  rawSafetyStockQuantity: string | null;
  rawDailySalesQuantity: string | null;
  rawBoxQuantity: string | null;
  rawAbcGrade: string | null;
  rawCategoryLarge: string | null;
  rawCategoryMedium: string | null;
  rawCategorySmall: string | null;
  rawVolume: string | null;
  rawDescription: string | null;
  rawOrigin: string | null;
  rawShelfNo: string | null;
  mappedProductCode: string | null;
  mappedScanCodeValue: string | null;
  mappedMasterProductId: number | null;
  mappedMarketProductId: number | null;
  normalizedStockQuantity: number | null;
  stockNormalizeMemo: StockNormalizeMemo;
  rowStatus: string;
};

@Injectable()
export class MarketAdminCsvImportService {
  constructor(private readonly barcodeParserService: BarcodeParserService) {}

  previewImportFile(params: {
    channelCode?: string;
    file?: Express.Multer.File;
  }): ImportPreviewResponse {
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const file = this.requireImportFile(params.file);
    const profile = this.getBusinessProfileByChannelCode(channelCode);
    const storedFilePath = this.storeImportFile(channelCode, file);
    const rows = this.parseImportFile(file);

    if (rows.length === 0) {
      throw new BadRequestException('IMPORT_FILE_EMPTY');
    }

    const seenScanCodes = new Set<string>();
    const normalizedRows = rows.map((row, index) => {
      const normalized = this.normalizeImportRow(row, index + 1);
      normalized.duplicateScanCode =
        normalized.scanCodeValue !== null && seenScanCodes.has(normalized.scanCodeValue);

      if (normalized.scanCodeValue) {
        seenScanCodes.add(normalized.scanCodeValue);
        normalized.matchedProduct = this.findMasterProductByScanCode(
          normalized.scanCodeValue,
        );
      }

      return normalized;
    });

    const transaction = db.transaction(() => {
      const batchId = this.insertImportBatch({
        profileId: profile.id,
        channelCode,
        file,
        storedFilePath,
        totalRowCount: normalizedRows.length,
      });

      const previewRows = normalizedRows.map((row) => {
        const preview = this.resolvePreviewRow(row);
        const importRowId = this.insertImportRow({
          batchId,
          profileId: profile.id,
          channelCode,
          row,
          preview,
        });

        return {
          ...preview,
          id: importRowId,
        };
      });

      this.updateBatchCounts(batchId, previewRows);

      return {
        batchId,
        summary: this.buildPreviewSummary(previewRows),
        rows: previewRows,
      };
    });

    return transaction() as ImportPreviewResponse;
  }

  confirmImportBatch(params: {
    batchId: string;
    channelCode?: string;
    mode?: string;
  }): ImportConfirmResponse {
    const batchId = this.normalizeId(params.batchId, 'batchId');
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const mode = this.normalizeConfirmMode(params.mode);
    this.getBusinessProfileByChannelCode(channelCode);

    const rows = db
      .prepare(
        `
        SELECT *
        FROM market_product_import_rows
        WHERE batchId = ?
          AND channelCode = ?
        ORDER BY rowNo ASC
        `,
      )
      .all(batchId, channelCode) as ImportRowForConfirm[];

    if (rows.length === 0) {
      throw new NotFoundException('import batch rows not found');
    }

    const transaction = db.transaction(() => {
      let createdProducts = 0;
      let updatedProducts = 0;
      let skippedRows = 0;
      let failedRows = 0;

      for (const row of rows) {
        if (row.rowStatus === 'FAILED' || row.rowStatus === 'SKIPPED') {
          skippedRows += 1;
          continue;
        }

        try {
          const processPolicy = this.resolveConfirmProcessPolicy(row, mode);

          if (!processPolicy.shouldProcess) {
            skippedRows += 1;
            this.markImportRowSkipped(row.id, processPolicy.reason);
            continue;
          }

          const masterProduct = this.ensureMasterProductForImportRow(row);
          const marketResult = this.upsertMarketProductFromImportRow(
            row,
            masterProduct,
            mode,
          );

          if (marketResult.wasCreated) {
            createdProducts += 1;
          } else {
            updatedProducts += 1;
          }

          db.prepare(
            `
            UPDATE market_product_import_rows
            SET
              mappedProductCode = ?,
              mappedMasterProductId = ?,
              mappedMarketProductId = ?,
              rowStatus = ?,
              errorMessage = NULL,
              processedAt = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
          ).run(
            masterProduct.productCode,
            masterProduct.masterProductId,
            marketResult.marketProductId,
            marketResult.wasCreated ? 'CREATED' : 'UPDATED',
            row.id,
          );
        } catch (error) {
          failedRows += 1;
          db.prepare(
            `
            UPDATE market_product_import_rows
            SET
              rowStatus = 'FAILED',
              errorMessage = ?,
              processedAt = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
          ).run(error instanceof Error ? error.message : 'IMPORT_ROW_FAILED', row.id);
        }
      }

      db.prepare(
        `
        UPDATE market_product_import_batches
        SET
          importStatus = ?,
          successRowCount = ?,
          failedRowCount = ?,
          completedAt = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
      ).run(
        failedRows > 0 ? 'PARTIAL_FAILED' : 'COMPLETED',
        createdProducts + updatedProducts,
        failedRows,
        batchId,
      );

      return {
        batchId,
        mode,
        createdProducts,
        updatedProducts,
        skippedRows,
        failedRows,
      };
    });

    return transaction() as ImportConfirmResponse;
  }

  applyImportPreviewToMarketProducts(
    input: ApplyImportPreviewInput,
  ): ImportApplyResponse {
    const channelCode = this.normalizeChannelCode(input.channelCode);
    const batchId = this.normalizeId(String(input.batchId ?? ''), 'batchId');
    const uploadMode = this.normalizeUploadMode(input.uploadMode);
    this.getBusinessProfileByChannelCode(channelCode);

    const rows = db
      .prepare(
        `
        SELECT *
        FROM market_product_import_rows
        WHERE batchId = ?
          AND channelCode = ?
        ORDER BY rowNo ASC
        `,
      )
      .all(batchId, channelCode) as ImportRowForConfirm[];

    if (rows.length === 0) {
      throw new NotFoundException('import batch rows not found');
    }

    const transaction = db.transaction(() => {
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let restoredCount = 0;
      let soldOutCount = 0;
      const uploadedScanCodes = new Set<string>();

      for (const row of rows) {
        const rowScanCode = this.normalizeScanCode(
          row.mappedScanCodeValue ?? row.rawBarcode,
        );

        if (rowScanCode) {
          uploadedScanCodes.add(rowScanCode);
        }

        if (!row.rawProductName && !row.rawBarcode) {
          skippedCount += 1;
          this.markImportRowSkipped(row.id, 'SKIPPED_EMPTY_IMPORT_ROW');
          continue;
        }

        try {
          const masterProduct = this.ensureMasterProductForImportRow(row);
          const result = this.upsertOwnerMarketProductFromImportRow(
            row,
            masterProduct,
          );

          if (result.wasCreated) {
            createdCount += 1;
          } else {
            updatedCount += 1;
          }

          if (result.wasRestored) {
            restoredCount += 1;
          }

          db.prepare(
            `
            UPDATE market_product_import_rows
            SET
              mappedProductCode = ?,
              mappedMasterProductId = ?,
              rowStatus = ?,
              errorMessage = NULL,
              processedAt = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
          ).run(
            masterProduct.productCode,
            masterProduct.masterProductId,
            result.wasCreated ? 'CREATED' : 'UPDATED',
            row.id,
          );
        } catch (error) {
          skippedCount += 1;
          this.markImportRowSkipped(
            row.id,
            error instanceof Error ? error.message : 'SKIPPED_IMPORT_APPLY_FAILED',
          );
        }
      }

      if (uploadMode === 'FULL_SYNC') {
        soldOutCount = this.markMissingMarketProductsSoldOut(
          channelCode,
          uploadedScanCodes,
        );
      }

      return {
        success: true,
        uploadMode,
        totalCount: rows.length,
        createdCount,
        updatedCount,
        skippedCount,
        soldOutCount,
        restoredCount,
      };
    });

    return transaction() as ImportApplyResponse;
  }

  normalizeStockQuantity(
    rawStockQuantity: string | number | null | undefined,
    options: NormalizeStockOptions = {},
  ): StockNormalizationResult {
    const rawValue = this.normalizeRawStockQuantity(rawStockQuantity);

    if (options.skipStockUpdate) {
      return {
        rawStockQuantity: rawValue,
        normalizedStockQuantity: null,
        stockNormalizeMemo: 'STOCK_UPDATE_SKIPPED',
      };
    }

    if (rawValue === null) {
      return {
        rawStockQuantity: rawValue,
        normalizedStockQuantity: null,
        stockNormalizeMemo: 'INVALID_STOCK_VALUE',
      };
    }

    const numericStock = Number(rawValue);

    if (!Number.isFinite(numericStock) || !Number.isInteger(numericStock)) {
      return {
        rawStockQuantity: rawValue,
        normalizedStockQuantity: null,
        stockNormalizeMemo: 'INVALID_STOCK_VALUE',
      };
    }

    if (numericStock < 0) {
      return {
        rawStockQuantity: rawValue,
        normalizedStockQuantity: 0,
        stockNormalizeMemo: 'NEGATIVE_STOCK_NORMALIZED_TO_ZERO',
      };
    }

    return {
      rawStockQuantity: rawValue,
      normalizedStockQuantity: numericStock,
      stockNormalizeMemo: null,
    };
  }

  saveImportRowStockNormalization(params: {
    importRowId: number;
    normalizedStockQuantity: number | null;
    stockNormalizeMemo: StockNormalizeMemo;
  }): void {
    db.prepare(
      `
      UPDATE market_product_import_rows
      SET
        normalizedStockQuantity = ?,
        stockNormalizeMemo = ?
      WHERE id = ?
      `,
    ).run(
      params.normalizedStockQuantity,
      params.stockNormalizeMemo,
      params.importRowId,
    );
  }

  applyNormalizedStockToMarketProduct(params: {
    marketProductId: number;
    channelCode: string;
    normalizedStockQuantity: number | null;
  }): MarketProductStockRow {
    const current = this.getMarketProductStockRow(
      params.marketProductId,
      params.channelCode,
    );

    if (params.normalizedStockQuantity === null) {
      return current;
    }

    const stockQuantity = this.assertNonNegativeStock(
      params.normalizedStockQuantity,
    );
    const isSoldOut = stockQuantity === 0 ? 1 : 0;
    const stockStatus = this.resolveStockStatus(
      stockQuantity,
      current.safetyStockQuantity,
      isSoldOut,
    );
    const now = new Date().toISOString();

    db.prepare(
      `
      UPDATE market_channel_products
      SET
        stockQuantity = ?,
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
      stockStatus,
      isSoldOut,
      now,
      now,
      current.id,
      current.channelCode,
    );

    return this.getMarketProductStockRow(current.id, current.channelCode);
  }

  private requireImportFile(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('IMPORT_FILE_REQUIRED');
    }

    const extension = extname(file.originalname).toLowerCase();

    if (!['.csv', '.xlsx'].includes(extension)) {
      throw new BadRequestException('IMPORT_FILE_TYPE_NOT_SUPPORTED');
    }

    return file;
  }

  private parseImportFile(file: Express.Multer.File): ImportRowRecord[] {
    const extension = extname(file.originalname).toLowerCase();

    if (extension === '.csv') {
      const csvText = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
      return parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as ImportRowRecord[];
    }

    const workbook = XLSX.read(file.buffer, {
      type: 'buffer',
      cellDates: false,
    });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return [];
    }

    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json<ImportRowRecord>(sheet, {
      defval: '',
    });
  }

  private storeImportFile(channelCode: string, file: Express.Multer.File): string {
    const uploadDir = join(process.cwd(), 'uploads', channelCode, 'imports');
    mkdirSync(uploadDir, { recursive: true });

    const safeExtension = extname(file.originalname).toLowerCase();
    const storedFileName = `${Date.now()}-${randomUUID()}${safeExtension}`;
    const storedPath = join(uploadDir, storedFileName);
    writeFileSync(storedPath, file.buffer);

    return `uploads/${channelCode}/imports/${storedFileName}`;
  }

  private normalizeImportRow(
    row: ImportRowRecord,
    rowNo: number,
  ): NormalizedImportRow {
    const rawStockQuantity = this.pickValue(row, [
      '재고',
      'stockQuantity',
      'stock',
      'inventory',
    ]);
    const eventCode = this.normalizeEventCode(
      this.pickValue(row, ['행사코드', '이벤트코드', 'eventCode']),
    );
    const eventStartAt = this.normalizeDateText(
      this.pickValue(row, ['행사시작', '행사시작일', 'eventStartAt']),
    );
    const eventEndAt = this.normalizeDateText(
      this.pickValue(row, ['행사종료', '행사종료일', 'eventEndAt']),
    );

    return {
      rowNo,
      productName: this.pickValue(row, ['상품명', '품명', '상품명칭', 'productName', 'name']),
      spec: this.pickValue(row, ['규격', 'spec', 'specText']),
      scanCodeValue: this.normalizeScanCode(
        this.pickValue(row, ['바코드', 'barcode', 'scanCode', 'scanCodeValue', 'GTIN', 'gtin']),
      ),
      supplierName: this.pickValue(row, ['공급사', 'supplier', 'supplierName']),
      purchasePrice: this.normalizeMoney(this.pickValue(row, ['매입가', 'purchasePrice']), 0),
      salePrice: this.normalizeMoney(this.pickValue(row, ['판매가', 'salePrice', 'price']), 0),
      eventGroupName: this.pickValue(row, ['특매그룹속성', 'eventGroupName']),
      eventPurchasePrice: this.normalizeNullableMoney(
        this.pickValue(row, ['특매매입가', 'eventPurchasePrice']),
      ),
      eventPrice: this.normalizeNullableMoney(this.pickValue(row, ['특매판매가', 'eventPrice'])),
      eventCode,
      eventTitle: this.pickValue(row, ['행사명', '이벤트명', 'eventTitle']),
      eventStartAt,
      eventEndAt,
      eventStatus: this.resolveEventStatus(eventCode, eventStartAt, eventEndAt),
      stock: this.normalizeStockQuantity(rawStockQuantity),
      stockAmount: this.normalizeMoney(this.pickValue(row, ['재고액', 'stockAmount']), 0),
      safetyStockQuantity: this.normalizeMoney(
        this.pickValue(row, ['최소재고', 'safetyStockQuantity']),
        0,
      ),
      dailySalesQuantity: this.normalizeMoney(
        this.pickValue(row, ['일매출량', 'dailySalesQuantity']),
        0,
      ),
      boxQuantity: this.normalizeMoney(this.pickValue(row, ['박스입수', 'boxQuantity']), 0),
      abcGrade: this.pickValue(row, ['ABC', 'abcGrade']),
      categoryLarge: this.pickValue(row, ['대', '대분류', 'categoryLarge']),
      categoryMedium: this.pickValue(row, ['중', '중분류', 'categoryMedium']),
      categorySmall: this.pickValue(row, ['소', '소분류', 'categorySmall']),
      volume: this.pickValue(row, ['용량', 'volume', 'volumeText']),
      unitPrice: this.pickValue(row, ['단위가격', 'unitPrice']),
      purchasePriceChangedAt: this.pickValue(row, ['매입가변경일시', 'purchasePriceChangedAt']),
      salePriceChangedAt: this.pickValue(row, ['판매가변경일시', 'salePriceChangedAt']),
      lastPurchasedAt: this.pickValue(row, ['최근매입일시', 'lastPurchasedAt']),
      lastStockCheckedAt: this.pickValue(row, ['최근실사일시', 'lastStockCheckedAt']),
      registeredAt: this.pickValue(row, ['등록일시', 'registeredAt']),
      modifiedAt: this.pickValue(row, ['수정일시', 'modifiedAt']),
      description: this.pickValue(row, ['상품설명', 'description']),
      origin: this.pickValue(row, ['원산지', 'origin']),
      shelfNo: this.pickValue(row, ['매대', 'shelfNo']),
      duplicateScanCode: false,
      matchedProduct: null,
    };
  }

  private resolvePreviewRow(row: NormalizedImportRow): Omit<ImportPreviewRow, 'id'> {
    const parserPreview = this.resolveParserPreviewMetadata(row);

    if (!row.scanCodeValue) {
      return {
        rowNo: row.rowNo,
        productName: row.productName,
        brandName: row.supplierName,
        scanCodeValue: null,
        productCode: null,
        semanticProductCode: null,
        categoryType: null,
        parserType: null,
        parserStatus: 'PARSER_FAILED',
        masterLinkStatus: 'PARSER_FAILED',
        imageLinkStatus: 'MISSING',
        thumbnailUrl: null,
        salePrice: row.salePrice,
        eventCode: row.eventCode,
        eventTitle: row.eventTitle,
        eventStartAt: row.eventStartAt,
        eventEndAt: row.eventEndAt,
        eventStatus: row.eventStatus,
        normalizedStockQuantity: row.stock.normalizedStockQuantity,
        stockNormalizeMemo: row.stock.stockNormalizeMemo,
        mappedProductCode: null,
        rowStatus: 'FAILED',
        displayStatus: 'MISSING_BARCODE',
        errorMessage: '바코드가 없습니다.',
      };
    }

    if (row.duplicateScanCode) {
      return {
        rowNo: row.rowNo,
        productName: row.productName,
        brandName: row.supplierName,
        scanCodeValue: row.scanCodeValue,
        ...parserPreview,
        salePrice: row.salePrice,
        eventCode: row.eventCode,
        eventTitle: row.eventTitle,
        eventStartAt: row.eventStartAt,
        eventEndAt: row.eventEndAt,
        eventStatus: row.eventStatus,
        normalizedStockQuantity: row.stock.normalizedStockQuantity,
        stockNormalizeMemo: row.stock.stockNormalizeMemo,
        mappedProductCode: null,
        rowStatus: 'SKIPPED',
        displayStatus: 'DUPLICATE_SCAN_CODE',
        errorMessage: '업로드 파일 안에서 중복된 바코드입니다.',
      };
    }

    if (row.matchedProduct) {
      return {
        rowNo: row.rowNo,
        productName: row.productName,
        brandName: row.supplierName ?? row.matchedProduct.brandName,
        scanCodeValue: row.scanCodeValue,
        productCode: row.matchedProduct.productCode,
        semanticProductCode: row.matchedProduct.semanticProductCode,
        categoryType: row.matchedProduct.categoryType,
        parserType: row.matchedProduct.parserType,
        parserStatus: this.resolveParserStatus(row.matchedProduct.parserType),
        masterLinkStatus: 'LINKED',
        imageLinkStatus: row.matchedProduct.thumbnailUrl ? 'LINKED' : 'MISSING',
        thumbnailUrl: row.matchedProduct.thumbnailUrl,
        salePrice: row.salePrice,
        eventCode: row.eventCode,
        eventTitle: row.eventTitle,
        eventStartAt: row.eventStartAt,
        eventEndAt: row.eventEndAt,
        eventStatus: row.eventStatus,
        normalizedStockQuantity: row.stock.normalizedStockQuantity,
        stockNormalizeMemo: row.stock.stockNormalizeMemo,
        mappedProductCode: row.matchedProduct.productCode,
        rowStatus: 'MAPPED',
        displayStatus:
          row.stock.stockNormalizeMemo === null ? 'MATCHED' : 'STOCK_WARNING',
        errorMessage: row.stock.stockNormalizeMemo,
      };
    }

    return {
      rowNo: row.rowNo,
      productName: row.productName,
      brandName: row.supplierName,
      scanCodeValue: row.scanCodeValue,
      ...parserPreview,
      salePrice: row.salePrice,
      eventCode: row.eventCode,
      eventTitle: row.eventTitle,
      eventStartAt: row.eventStartAt,
      eventEndAt: row.eventEndAt,
      eventStatus: row.eventStatus,
      normalizedStockQuantity: row.stock.normalizedStockQuantity,
      stockNormalizeMemo: row.stock.stockNormalizeMemo,
      mappedProductCode: null,
      rowStatus: 'READY',
      displayStatus: 'NEW_PRODUCT_REQUIRED',
      errorMessage: row.stock.stockNormalizeMemo,
    };
  }

  private resolveParserPreviewMetadata(
    row: NormalizedImportRow,
  ): Pick<
    ImportPreviewRow,
    | 'semanticProductCode'
    | 'productCode'
    | 'categoryType'
    | 'parserType'
    | 'parserStatus'
    | 'masterLinkStatus'
    | 'imageLinkStatus'
    | 'thumbnailUrl'
  > {
    if (!row.scanCodeValue) {
      return {
        semanticProductCode: null,
        productCode: null,
        categoryType: null,
        parserType: null,
        parserStatus: 'PARSER_FAILED',
        masterLinkStatus: 'PARSER_FAILED',
        imageLinkStatus: 'MISSING',
        thumbnailUrl: null,
      };
    }

    if (row.matchedProduct) {
      return {
        semanticProductCode: row.matchedProduct.semanticProductCode,
        productCode: row.matchedProduct.productCode,
        categoryType: row.matchedProduct.categoryType,
        parserType: row.matchedProduct.parserType,
        parserStatus: this.resolveParserStatus(row.matchedProduct.parserType),
        masterLinkStatus: 'LINKED',
        imageLinkStatus: row.matchedProduct.thumbnailUrl ? 'LINKED' : 'MISSING',
        thumbnailUrl: row.matchedProduct.thumbnailUrl,
      };
    }

    try {
      const parsed = this.barcodeParserService.parseScanCodeValue(row.scanCodeValue);

      return {
        semanticProductCode: parsed.semanticProductCode,
        productCode: parsed.productCode,
        categoryType: this.resolveParserCategoryType(parsed),
        parserType: parsed.parserType,
        parserStatus: this.resolveParserStatus(parsed.parserType),
        masterLinkStatus:
          parsed.parserType === 'RAW_UNKNOWN' ? 'PARSER_FAILED' : 'CREATE_REQUIRED',
        imageLinkStatus: 'MISSING',
        thumbnailUrl: null,
      };
    } catch {
      return {
        semanticProductCode: null,
        productCode: null,
        categoryType: null,
        parserType: null,
        parserStatus: 'PARSER_FAILED',
        masterLinkStatus: 'PARSER_FAILED',
        imageLinkStatus: 'MISSING',
        thumbnailUrl: null,
      };
    }
  }

  private resolveParserStatus(
    parserType: BarcodeParserResult['parserType'] | null,
  ): ImportPreviewRow['parserStatus'] {
    if (parserType === 'SEMANTIC_BARCODE') {
      return 'SEMANTIC_REGISTRY_MATCHED';
    }

    if (parserType === 'RAW_UNKNOWN') {
      return 'RAW_UNKNOWN';
    }

    if (parserType === 'EAN13_BARCODE') {
      return 'PARSER_SUCCESS';
    }

    return 'PARSER_FAILED';
  }

  private resolveParserCategoryType(parsed: BarcodeParserResult): string | null {
    const categoryType = parsed.parsedMetadata.categoryType;

    return typeof categoryType === 'string' && categoryType.trim()
      ? categoryType.trim()
      : null;
  }

  private insertImportBatch(params: {
    profileId: number;
    channelCode: string;
    file: Express.Multer.File;
    storedFilePath: string;
    totalRowCount: number;
  }): number {
    const result = db
      .prepare(
        `
        INSERT INTO market_product_import_batches(
          profileId,
          channelCode,
          sourceSystem,
          originalFileName,
          storedFilePath,
          mimeType,
          fileEncoding,
          totalRowCount,
          importStatus,
          importedAt
        )
        VALUES(?, ?, 'TOGETHER_POS', ?, ?, ?, 'UTF-8', ?, 'READY', CURRENT_TIMESTAMP)
        `,
      )
      .run(
        params.profileId,
        params.channelCode,
        params.file.originalname,
        params.storedFilePath,
        params.file.mimetype,
        params.totalRowCount,
      );

    return Number(result.lastInsertRowid);
  }

  private insertImportRow(params: {
    batchId: number;
    profileId: number;
    channelCode: string;
    row: NormalizedImportRow;
    preview: Omit<ImportPreviewRow, 'id'>;
  }): number {
    const result = db
      .prepare(
        `
        INSERT INTO market_product_import_rows(
          batchId,
          profileId,
          channelCode,
          rowNo,
          rawProductName,
          rawSpec,
          rawBarcode,
          rawSupplierName,
          rawPurchasePrice,
          rawSalePrice,
          rawEventGroupName,
          rawEventPurchasePrice,
          rawEventSalePrice,
          rawStockQuantity,
          rawStockAmount,
          rawSafetyStockQuantity,
          rawDailySalesQuantity,
          rawBoxQuantity,
          rawAbcGrade,
          rawCategoryLarge,
          rawCategoryMedium,
          rawCategorySmall,
          rawVolume,
          rawUnitPrice,
          rawPurchasePriceChangedAt,
          rawSalePriceChangedAt,
          rawLastPurchasedAt,
          rawLastStockCheckedAt,
          rawRegisteredAt,
          rawModifiedAt,
          rawDescription,
          rawOrigin,
          rawShelfNo,
          rawEventCode,
          rawEventTitle,
          rawEventStartAt,
          rawEventEndAt,
          mappedProductCode,
          mappedScanCodeValue,
          mappedMasterProductId,
          normalizedStockQuantity,
          stockNormalizeMemo,
          rowStatus,
          errorMessage
        )
        VALUES(
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
        `,
      )
      .run(
        params.batchId,
        params.profileId,
        params.channelCode,
        params.row.rowNo,
        params.row.productName,
        params.row.spec,
        params.row.scanCodeValue,
        params.row.supplierName,
        String(params.row.purchasePrice),
        String(params.row.salePrice),
        params.row.eventGroupName,
        params.row.eventPurchasePrice === null ? null : String(params.row.eventPurchasePrice),
        params.row.eventPrice === null ? null : String(params.row.eventPrice),
        params.row.stock.rawStockQuantity,
        String(params.row.stockAmount),
        String(params.row.safetyStockQuantity),
        String(params.row.dailySalesQuantity),
        String(params.row.boxQuantity),
        params.row.abcGrade,
        params.row.categoryLarge,
        params.row.categoryMedium,
        params.row.categorySmall,
        params.row.volume,
        params.row.unitPrice,
        params.row.purchasePriceChangedAt,
        params.row.salePriceChangedAt,
        params.row.lastPurchasedAt,
        params.row.lastStockCheckedAt,
        params.row.registeredAt,
        params.row.modifiedAt,
        params.row.description,
        params.row.origin,
        params.row.shelfNo,
        params.row.eventCode,
        params.row.eventTitle,
        params.row.eventStartAt,
        params.row.eventEndAt,
        params.preview.mappedProductCode,
        params.row.scanCodeValue,
        params.row.matchedProduct?.masterProductId ?? null,
        params.preview.normalizedStockQuantity,
        params.preview.stockNormalizeMemo,
        params.preview.rowStatus,
        params.preview.errorMessage,
      );

    return Number(result.lastInsertRowid);
  }

  private updateBatchCounts(batchId: number, rows: ImportPreviewRow[]): void {
    const failedRowCount = rows.filter((row) => row.rowStatus === 'FAILED').length;
    const successRowCount = rows.length - failedRowCount;

    db.prepare(
      `
      UPDATE market_product_import_batches
      SET
        successRowCount = ?,
        failedRowCount = ?,
        importStatus = ?
      WHERE id = ?
      `,
    ).run(
      successRowCount,
      failedRowCount,
      failedRowCount > 0 ? 'PARTIAL_FAILED' : 'PROCESSING',
      batchId,
    );
  }

  private buildPreviewSummary(rows: ImportPreviewRow[]): ImportPreviewResponse['summary'] {
    return {
      totalRows: rows.length,
      matchedRows: rows.filter((row) => row.displayStatus === 'MATCHED').length,
      newProductRows: rows.filter((row) => row.displayStatus === 'NEW_PRODUCT_REQUIRED').length,
      errorRows: rows.filter((row) => row.rowStatus === 'FAILED').length,
      duplicateRows: rows.filter((row) => row.displayStatus === 'DUPLICATE_SCAN_CODE').length,
    };
  }

  private ensureMasterProductForImportRow(row: ImportRowForConfirm): MasterProductMatchRow {
    if (row.mappedMasterProductId && row.mappedProductCode) {
      const mappedScanCodeValue = this.normalizeScanCode(
        row.mappedScanCodeValue ?? row.rawBarcode,
      );

      if (mappedScanCodeValue) {
        this.ensureMasterProductScanCodeRelation({
          masterProductId: row.mappedMasterProductId,
          productCode: row.mappedProductCode,
          scanCodeValue: mappedScanCodeValue,
        });
      }

      return {
        masterProductId: row.mappedMasterProductId,
        productCode: row.mappedProductCode,
        productName: row.rawProductName ?? '상품명 미등록',
        brandName: row.rawSupplierName,
        categoryName: this.resolveCategoryName(row),
        semanticProductCode: null,
        categoryType: null,
        parserType: null,
        thumbnailUrl: null,
      };
    }

    const scanCodeValue = row.mappedScanCodeValue;

    if (!scanCodeValue) {
      throw new BadRequestException('SCAN_CODE_REQUIRED');
    }

    const existing = this.findMasterProductByScanCode(scanCodeValue);

    if (existing) {
      this.ensureMasterProductScanCodeRelation({
        masterProductId: existing.masterProductId,
        productCode: existing.productCode,
        scanCodeValue,
      });

      return existing;
    }

    const parsedProductCode =
      this.barcodeParserService.parseScanCodeValue(scanCodeValue);
    const productCode = parsedProductCode.productCode;
    const productName = row.rawProductName?.trim() || '상품명 미등록';
    const categoryName = this.resolveCategoryName(row);

    const result = db
      .prepare(
        `
        INSERT INTO master_products(
          productCode,
          semanticProductCode,
          primaryScanCodeValue,
          productName,
          brandName,
          supplierName,
          specText,
          categoryLarge,
          categoryMedium,
          categorySmall,
          categoryName,
          semanticTypePrefix,
          semanticItemCode,
          barcodeParserType,
          barcodeParserVersion,
          volumeText,
          description,
          origin,
          sourceSystem,
          isActive,
          approvalStatus,
          updatedAt
        )
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TOGETHER_POS', 1, ?, CURRENT_TIMESTAMP)
        `,
      )
      .run(
        productCode,
        parsedProductCode.semanticProductCode,
        parsedProductCode.scanCodeValue,
        productName,
        row.rawSupplierName,
        row.rawSupplierName,
        row.rawSpec,
        row.rawCategoryLarge,
        row.rawCategoryMedium,
        row.rawCategorySmall,
        categoryName,
        parsedProductCode.semanticTypePrefix,
        parsedProductCode.semanticItemCode,
        parsedProductCode.parserType,
        parsedProductCode.parserVersion,
        row.rawVolume,
        row.rawDescription,
        row.rawOrigin,
        this.resolveMasterAutoImportApprovalStatus(),
      );

    const masterProductId = Number(result.lastInsertRowid);

    this.ensureMasterProductScanCodeRelation({
      masterProductId,
      productCode,
      scanCodeValue,
      parsedProductCode,
    });

    return {
      masterProductId,
      productCode,
      productName,
      brandName: row.rawSupplierName,
      categoryName,
      semanticProductCode: parsedProductCode.semanticProductCode,
      categoryType: this.resolveParserCategoryType(parsedProductCode),
      parserType: parsedProductCode.parserType,
      thumbnailUrl: null,
    };
  }

  private ensureMasterProductScanCodeRelation(params: {
    masterProductId: number;
    productCode: string;
    scanCodeValue: string;
    parsedProductCode?: BarcodeParserResult;
  }): void {
    const parsedProductCode =
      params.parsedProductCode ??
      this.barcodeParserService.parseScanCodeValue(params.scanCodeValue);
    const scanCodeValue = parsedProductCode.scanCodeValue;

    const existing = db
      .prepare(
        `
        SELECT
          id,
          masterProductId,
          productCode,
          isActive
        FROM master_product_scan_codes
        WHERE scanCodeValue = ?
          AND deletedAt IS NULL
        LIMIT 1
        `,
      )
      .get(scanCodeValue) as
      | {
          id: number;
          masterProductId: number;
          productCode: string;
          isActive: number;
        }
      | undefined;

    if (existing) {
      if (
        existing.masterProductId !== params.masterProductId ||
        existing.productCode !== params.productCode
      ) {
        throw new BadRequestException('SCAN_CODE_ALREADY_LINKED');
      }

      if (existing.isActive !== 1) {
        db.prepare(
          `
          UPDATE master_product_scan_codes
          SET
            isActive = 1,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
          `,
        ).run(existing.id);
      }

      return;
    }

    db.prepare(
      `
      INSERT INTO master_product_scan_codes(
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
      VALUES(?, ?, ?, ?, ?, ?, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
    ).run(
      params.masterProductId,
      params.productCode,
      parsedProductCode.parserType === 'EAN13_BARCODE'
        ? 'EXTERNAL_BARCODE'
        : 'CUSTOM',
      scanCodeValue,
      parsedProductCode.parserType === 'EAN13_BARCODE'
        ? 'MERCHANT'
        : 'CUSTOM',
      parsedProductCode.parserType === 'EAN13_BARCODE'
        ? this.resolveExternalBarcodeFormat(scanCodeValue)
        : null,
    );
  }

  private resolveConfirmProcessPolicy(
    row: ImportRowForConfirm,
    mode: ImportConfirmMode,
  ): { shouldProcess: boolean; reason: ImportConfirmSkipReason | null } {
    if (mode === 'AUTO_MATCH') {
      return {
        shouldProcess: true,
        reason: null,
      };
    }

    if (mode === 'CREATE_ONLY') {
      return {
        shouldProcess: row.mappedProductCode === null,
        reason: 'SKIPPED_BY_CREATE_ONLY_MATCHED_ROW',
      };
    }

    const hasExistingMarketProduct = this.hasExistingMarketProductForImportRow(row);

    if (mode === 'UPDATE_EXISTING') {
      return {
        shouldProcess: row.mappedProductCode !== null && hasExistingMarketProduct,
        reason: 'SKIPPED_BY_UPDATE_EXISTING_UNMATCHED_ROW',
      };
    }

    if (mode === 'STOCK_ONLY') {
      if (row.stockNormalizeMemo === 'INVALID_STOCK_VALUE') {
        return {
          shouldProcess: false,
          reason: 'SKIPPED_INVALID_STOCK_VALUE',
        };
      }

      return {
        shouldProcess: row.mappedProductCode !== null && hasExistingMarketProduct,
        reason: 'SKIPPED_BY_STOCK_ONLY_UNMATCHED_ROW',
      };
    }

    return {
      shouldProcess: row.mappedProductCode !== null && hasExistingMarketProduct,
      reason: 'SKIPPED_BY_PRICE_ONLY_UNMATCHED_ROW',
    };
  }

  private hasExistingMarketProductForImportRow(row: ImportRowForConfirm): boolean {
    if (!row.mappedProductCode) {
      return false;
    }

    const existing = db
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
      .get(row.channelCode, row.mappedProductCode) as { id: number } | undefined;

    return existing !== undefined;
  }

  private markImportRowSkipped(rowId: number, reason: string | null): void {
    db.prepare(
      `
      UPDATE market_product_import_rows
      SET
        rowStatus = 'SKIPPED',
        errorMessage = ?,
        processedAt = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
    ).run(reason, rowId);
  }

  private upsertMarketProductFromImportRow(
    row: ImportRowForConfirm,
    masterProduct: MasterProductMatchRow,
    mode: ImportConfirmMode,
  ): { marketProductId: number; wasCreated: boolean } {
    const existing = db
      .prepare(
        `
        SELECT id, stockQuantity
        FROM market_channel_products
        WHERE channelCode = ?
          AND productCode = ?
          AND deletedAt IS NULL
        LIMIT 1
        `,
      )
      .get(row.channelCode, masterProduct.productCode) as
      | { id: number; stockQuantity: number }
      | undefined;

    const salePrice = this.normalizeMoney(row.rawSalePrice, 0);
    const purchasePrice = this.normalizeMoney(row.rawPurchasePrice, 0);
    const eventPrice = this.normalizeNullableMoney(row.rawEventSalePrice);
    const eventPurchasePrice = this.normalizeNullableMoney(row.rawEventPurchasePrice);
    const stockQuantity = row.normalizedStockQuantity;
    const safetyStockQuantity = this.normalizeMoney(row.rawSafetyStockQuantity, 0);
    const resolvedStockQuantity = stockQuantity ?? existing?.stockQuantity ?? 0;
    const isSoldOut = resolvedStockQuantity === 0 ? 1 : 0;
    const stockStatus = this.resolveStockStatus(
      resolvedStockQuantity,
      safetyStockQuantity,
      isSoldOut,
    );

    if (existing) {
      this.updateExistingMarketProductFromImportRow({
        row,
        masterProduct,
        existingId: existing.id,
        mode,
        purchasePrice,
        salePrice,
        eventPrice,
        eventPurchasePrice,
        stockQuantity,
        stockAmount: this.normalizeMoney(row.rawStockAmount, 0),
        safetyStockQuantity,
        dailySalesQuantity: this.normalizeMoney(row.rawDailySalesQuantity, 0),
        boxQuantity: this.normalizeMoney(row.rawBoxQuantity, 0),
        stockStatus,
        isSoldOut,
      });

      this.insertHistory(existing.id, row.channelCode, masterProduct.productCode, {
        changeType: 'SYNC',
        beforeValue: JSON.stringify({ stockQuantity: existing.stockQuantity }),
        afterValue: JSON.stringify({ mode, salePrice, stockQuantity }),
        changeMemo: `CSV/엑셀 일괄 업데이트:${mode}`,
      });

      return {
        marketProductId: existing.id,
        wasCreated: false,
      };
    }

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
          eventPurchasePrice,
          eventGroupName,
          stockQuantity,
          stockAmount,
          safetyStockQuantity,
          dailySalesQuantity,
          boxQuantity,
          abcGrade,
          shelfNo,
          stockStatus,
          isOnSale,
          isDisplayed,
          isEventActive,
          isSoldOut,
          lastImportedBatchId,
          lastImportedRowId,
          lastSyncedAt,
          priceUpdatedAt,
          stockUpdatedAt,
          updatedAt
        )
        VALUES(
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          1, 1, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        `,
      )
      .run(
        row.profileId,
        row.channelCode,
        masterProduct.masterProductId,
        masterProduct.productCode,
        masterProduct.productName,
        masterProduct.brandName,
        masterProduct.categoryName,
        purchasePrice,
        salePrice,
        eventPrice,
        eventPurchasePrice,
        row.rawEventGroupName,
        resolvedStockQuantity,
        this.normalizeMoney(row.rawStockAmount, 0),
        safetyStockQuantity,
        this.normalizeMoney(row.rawDailySalesQuantity, 0),
        this.normalizeMoney(row.rawBoxQuantity, 0),
        row.rawAbcGrade,
        row.rawShelfNo,
        stockStatus,
        eventPrice === null ? 0 : 1,
        isSoldOut,
        row.id,
        row.id,
      );

    const marketProductId = Number(result.lastInsertRowid);
    this.insertHistory(marketProductId, row.channelCode, masterProduct.productCode, {
      changeType: 'SYNC',
      beforeValue: null,
      afterValue: JSON.stringify({ salePrice, stockQuantity: resolvedStockQuantity }),
      changeMemo: 'CSV/엑셀 일괄 등록',
    });

    return {
      marketProductId,
      wasCreated: true,
    };
  }

  private upsertOwnerMarketProductFromImportRow(
    row: ImportRowForConfirm,
    masterProduct: MasterProductMatchRow,
  ): { marketProductId: number; wasCreated: boolean; wasRestored: boolean } {
    const barcode = this.normalizeScanCode(row.rawBarcode);
    const existing = this.findOwnerMarketProduct(row.channelCode, barcode, masterProduct.productCode);
    const salePrice = this.normalizeMoney(row.rawSalePrice, 0);
    const currentStock = row.normalizedStockQuantity ?? existing?.currentStock ?? 0;
    const isSoldOut = currentStock <= 0 ? 1 : 0;
    const approvalStatus = row.mappedProductCode ? 'MATCHED' : 'AUTO_IMPORTED';
    const eventCode = this.normalizeEventCode(row.rawEventCode);
    const eventStartAt = this.normalizeDateText(row.rawEventStartAt);
    const eventEndAt = this.normalizeDateText(row.rawEventEndAt);
    const eventStatus = this.resolveEventStatus(eventCode, eventStartAt, eventEndAt);
    const displayStatus = eventStatus === 'ACTIVE' ? 'EVENT_ONLY' : 'VISIBLE';

    if (existing) {
      const wasRestored =
        currentStock > 0 &&
        (existing.currentStock <= 0 || existing.isSoldOut === 1);

      db.prepare(
        `
        UPDATE market_products
        SET
          masterProductId = ?,
          masterBarcodeId = ?,
          productCode = ?,
          barcode = ?,
          productName = ?,
          supplierName = ?,
          salePrice = ?,
          currentStock = ?,
          safeStock = ?,
          isActive = 1,
          isSoldOut = ?,
          displayStatus = ?,
          eventCode = ?,
          eventTitle = ?,
          eventStartAt = ?,
          eventEndAt = ?,
          eventStatus = ?,
          approvalStatus = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND channelCode = ?
          AND isDeleted = 0
          AND deletedAt IS NULL
        `,
      ).run(
        masterProduct.masterProductId,
        this.findMasterBarcodeId(barcode),
        masterProduct.productCode,
        barcode,
        masterProduct.productName,
        masterProduct.brandName,
        salePrice,
        currentStock,
        this.normalizeMoney(row.rawSafetyStockQuantity, 0),
        isSoldOut,
        displayStatus,
        eventCode,
        row.rawEventTitle,
        eventStartAt,
        eventEndAt,
        eventStatus,
        approvalStatus,
        existing.id,
        row.channelCode,
      );

      return {
        marketProductId: existing.id,
        wasCreated: false,
        wasRestored,
      };
    }

    const result = db.prepare(
      `
      INSERT INTO market_products(
        profileId,
        channelCode,
        masterProductId,
        masterBarcodeId,
        productCode,
        barcode,
        productName,
        supplierName,
        salePrice,
        currentStock,
        safeStock,
        isActive,
        isSoldOut,
        displayStatus,
        eventCode,
        eventTitle,
        eventStartAt,
        eventEndAt,
        eventStatus,
        approvalStatus,
        updatedAt
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
    ).run(
      row.profileId,
      row.channelCode,
      masterProduct.masterProductId,
      this.findMasterBarcodeId(barcode),
      masterProduct.productCode,
      barcode,
      masterProduct.productName,
      masterProduct.brandName,
      salePrice,
      currentStock,
      this.normalizeMoney(row.rawSafetyStockQuantity, 0),
      isSoldOut,
      displayStatus,
      eventCode,
      row.rawEventTitle,
      eventStartAt,
      eventEndAt,
      eventStatus,
      approvalStatus,
    );

    return {
      marketProductId: Number(result.lastInsertRowid),
      wasCreated: true,
      wasRestored: false,
    };
  }

  private findOwnerMarketProduct(
    channelCode: string,
    barcode: string | null,
    productCode: string,
  ): { id: number; currentStock: number; isSoldOut: number } | null {
    if (barcode) {
      const row = db
        .prepare(
          `
          SELECT id, currentStock, isSoldOut
          FROM market_products
          WHERE channelCode = ?
            AND barcode = ?
            AND isDeleted = 0
            AND deletedAt IS NULL
          LIMIT 1
          `,
        )
        .get(channelCode, barcode) as
        | { id: number; currentStock: number; isSoldOut: number }
        | undefined;

      if (row) {
        return row;
      }
    }

    return (
      (db
        .prepare(
          `
          SELECT id, currentStock, isSoldOut
          FROM market_products
          WHERE channelCode = ?
            AND productCode = ?
            AND isDeleted = 0
            AND deletedAt IS NULL
          LIMIT 1
          `,
        )
        .get(channelCode, productCode) as
        | { id: number; currentStock: number; isSoldOut: number }
        | undefined) ??
      null
    );
  }

  private findMasterBarcodeId(barcode: string | null): number | null {
    if (!barcode) {
      return null;
    }

    const row = db
      .prepare(
        `
        SELECT id
        FROM master_barcodes
        WHERE gtin = ?
          AND isActive = 1
        LIMIT 1
        `,
      )
      .get(barcode) as { id: number } | undefined;

    return row?.id ?? null;
  }

  private markMissingMarketProductsSoldOut(
    channelCode: string,
    uploadedScanCodes: Set<string>,
  ): number {
    if (uploadedScanCodes.size === 0) {
      return 0;
    }

    const placeholders =
      Array.from(uploadedScanCodes).map(() => '?').join(', ');

    const result = db
      .prepare(
        `
        UPDATE market_products
        SET
          currentStock = 0,
          isSoldOut = 1,
          updatedAt = CURRENT_TIMESTAMP
        WHERE channelCode = ?
          AND isDeleted = 0
          AND deletedAt IS NULL
          AND (
            barcode IS NULL
            OR barcode NOT IN (${placeholders})
          )
          AND (
            currentStock != 0
            OR isSoldOut != 1
          )
        `,
      )
      .run(channelCode, ...Array.from(uploadedScanCodes));

    return result.changes;
  }

  private findMasterProductByScanCode(scanCodeValue: string): MasterProductMatchRow | null {
    const row = db
      .prepare(
        `
        SELECT
          mp.id AS masterProductId,
          mp.productCode AS productCode,
          mp.productName AS productName,
          mp.brandName AS brandName,
          mp.categoryName AS categoryName,
          mp.semanticProductCode AS semanticProductCode,
          COALESCE(mp.categoryCode, mp.categoryLarge, mp.categoryName) AS categoryType,
          mp.barcodeParserType AS parserType,
          CASE
            WHEN ia.filePath IS NOT NULL AND ia.filePath LIKE '/%' THEN ia.filePath
            WHEN ia.filePath IS NOT NULL THEN '/media/' || ia.filePath
            ELSE NULL
          END AS thumbnailUrl
        FROM master_product_scan_codes mpsc
        INNER JOIN master_products mp
          ON mp.id = mpsc.masterProductId
        LEFT JOIN master_product_thumbnails mpt
          ON mpt.masterProductId = mp.id
          AND mpt.isPrimary = 1
          AND mpt.isActive = 1
        LEFT JOIN image_assets ia
          ON ia.id = COALESCE(mp.thumbnailImageAssetId, mpt.imageAssetId)
          AND ia.isActive = 1
        WHERE mpsc.scanCodeValue = ?
          AND mpsc.isActive = 1
          AND mpsc.deletedAt IS NULL
          AND mp.isActive = 1
          AND mp.deletedAt IS NULL
        LIMIT 1
        `,
      )
      .get(scanCodeValue) as MasterProductMatchRow | undefined;

    if (row) {
      return row;
    }

    return (
      (db
        .prepare(
          `
          SELECT
            mp.id AS masterProductId,
            mp.productCode AS productCode,
            mp.productName AS productName,
            mp.brandName AS brandName,
            mp.categoryName AS categoryName,
            mp.semanticProductCode AS semanticProductCode,
            COALESCE(mp.categoryCode, mp.categoryLarge, mp.categoryName) AS categoryType,
            mp.barcodeParserType AS parserType,
            CASE
              WHEN ia.filePath IS NOT NULL AND ia.filePath LIKE '/%' THEN ia.filePath
              WHEN ia.filePath IS NOT NULL THEN '/media/' || ia.filePath
              ELSE NULL
            END AS thumbnailUrl
          FROM master_product_barcodes mpb
          INNER JOIN master_products mp
            ON mp.id = mpb.masterProductId
          LEFT JOIN master_product_thumbnails mpt
            ON mpt.masterProductId = mp.id
            AND mpt.isPrimary = 1
            AND mpt.isActive = 1
          LEFT JOIN image_assets ia
            ON ia.id = COALESCE(mp.thumbnailImageAssetId, mpt.imageAssetId)
            AND ia.isActive = 1
          WHERE mpb.gtin = ?
            AND mp.isActive = 1
            AND mp.deletedAt IS NULL
          LIMIT 1
          `,
        )
        .get(scanCodeValue) as MasterProductMatchRow | undefined) ?? null
    );
  }

  private updateExistingMarketProductFromImportRow(params: {
    row: ImportRowForConfirm;
    masterProduct: MasterProductMatchRow;
    existingId: number;
    mode: ImportConfirmMode;
    purchasePrice: number;
    salePrice: number;
    eventPrice: number | null;
    eventPurchasePrice: number | null;
    stockQuantity: number | null;
    stockAmount: number;
    safetyStockQuantity: number;
    dailySalesQuantity: number;
    boxQuantity: number;
    stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'SOLD_OUT';
    isSoldOut: number;
  }): void {
    const shouldUpdateStock =
      params.mode === 'AUTO_MATCH' ||
      params.mode === 'UPDATE_EXISTING' ||
      params.mode === 'STOCK_ONLY';
    const shouldUpdatePrice =
      params.mode === 'AUTO_MATCH' ||
      params.mode === 'UPDATE_EXISTING' ||
      params.mode === 'PRICE_ONLY';
    const shouldUpdateFullMetadata =
      params.mode === 'AUTO_MATCH' ||
      params.mode === 'UPDATE_EXISTING';

    db.prepare(
      `
      UPDATE market_channel_products
      SET
        productNameSnapshot = CASE WHEN ? = 1 THEN ? ELSE productNameSnapshot END,
        brandNameSnapshot = CASE WHEN ? = 1 THEN ? ELSE brandNameSnapshot END,
        categoryNameSnapshot = CASE WHEN ? = 1 THEN ? ELSE categoryNameSnapshot END,
        purchasePrice = CASE WHEN ? = 1 THEN ? ELSE purchasePrice END,
        salePrice = CASE WHEN ? = 1 THEN ? ELSE salePrice END,
        eventPrice = CASE WHEN ? = 1 THEN ? ELSE eventPrice END,
        eventPurchasePrice = CASE WHEN ? = 1 THEN ? ELSE eventPurchasePrice END,
        eventGroupName = CASE WHEN ? = 1 THEN ? ELSE eventGroupName END,
        stockQuantity = CASE
          WHEN ? = 1 AND ? IS NOT NULL THEN ?
          ELSE stockQuantity
        END,
        stockAmount = CASE WHEN ? = 1 THEN ? ELSE stockAmount END,
        safetyStockQuantity = CASE WHEN ? = 1 THEN ? ELSE safetyStockQuantity END,
        dailySalesQuantity = CASE WHEN ? = 1 THEN ? ELSE dailySalesQuantity END,
        boxQuantity = CASE WHEN ? = 1 THEN ? ELSE boxQuantity END,
        abcGrade = CASE WHEN ? = 1 THEN ? ELSE abcGrade END,
        shelfNo = CASE WHEN ? = 1 THEN ? ELSE shelfNo END,
        stockStatus = CASE
          WHEN ? = 1 AND ? IS NOT NULL THEN ?
          ELSE stockStatus
        END,
        isSoldOut = CASE
          WHEN ? = 1 AND ? IS NOT NULL THEN ?
          ELSE isSoldOut
        END,
        isEventActive = CASE WHEN ? = 1 THEN ? ELSE isEventActive END,
        lastImportedBatchId = ?,
        lastImportedRowId = ?,
        lastSyncedAt = CURRENT_TIMESTAMP,
        priceUpdatedAt = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE priceUpdatedAt END,
        stockUpdatedAt = CASE
          WHEN ? = 1 AND ? IS NOT NULL THEN CURRENT_TIMESTAMP
          ELSE stockUpdatedAt
        END,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
      `,
    ).run(
      shouldUpdateFullMetadata ? 1 : 0,
      params.masterProduct.productName,
      shouldUpdateFullMetadata ? 1 : 0,
      params.masterProduct.brandName,
      shouldUpdateFullMetadata ? 1 : 0,
      params.masterProduct.categoryName,
      shouldUpdatePrice ? 1 : 0,
      params.purchasePrice,
      shouldUpdatePrice ? 1 : 0,
      params.salePrice,
      shouldUpdatePrice ? 1 : 0,
      params.eventPrice,
      shouldUpdatePrice ? 1 : 0,
      params.eventPurchasePrice,
      shouldUpdatePrice ? 1 : 0,
      params.row.rawEventGroupName,
      shouldUpdateStock ? 1 : 0,
      params.stockQuantity,
      params.stockQuantity,
      shouldUpdateStock ? 1 : 0,
      params.stockAmount,
      shouldUpdateStock ? 1 : 0,
      params.safetyStockQuantity,
      shouldUpdateStock ? 1 : 0,
      params.dailySalesQuantity,
      shouldUpdateStock ? 1 : 0,
      params.boxQuantity,
      shouldUpdateFullMetadata ? 1 : 0,
      params.row.rawAbcGrade,
      shouldUpdateFullMetadata ? 1 : 0,
      params.row.rawShelfNo,
      shouldUpdateStock ? 1 : 0,
      params.stockQuantity,
      params.stockStatus,
      shouldUpdateStock ? 1 : 0,
      params.stockQuantity,
      params.isSoldOut,
      shouldUpdatePrice ? 1 : 0,
      params.eventPrice === null ? 0 : 1,
      params.row.id,
      params.row.id,
      shouldUpdatePrice ? 1 : 0,
      shouldUpdateStock ? 1 : 0,
      params.stockQuantity,
      params.existingId,
      params.row.channelCode,
    );
  }

  private insertHistory(
    marketProductId: number,
    channelCode: string,
    productCode: string,
    params: {
      changeType: 'SYNC';
      beforeValue: string | null;
      afterValue: string | null;
      changeMemo: string;
    },
  ): void {
    db.prepare(
      `
      INSERT INTO market_channel_product_history(
        marketProductId,
        channelCode,
        productCode,
        changeType,
        beforeValue,
        afterValue,
        changeMemo
      )
      VALUES(?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      marketProductId,
      channelCode,
      productCode,
      params.changeType,
      params.beforeValue,
      params.afterValue,
      params.changeMemo,
    );
  }

  private pickValue(row: ImportRowRecord, keys: string[]): string | null {
    for (const key of keys) {
      const value = row[key];

      if (value !== null && value !== undefined && String(value).trim().length > 0) {
        return String(value).trim();
      }
    }

    return null;
  }

  private normalizeScanCode(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\s/g, '').trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeEventCode(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\s/g, '').trim().toUpperCase();
    return normalized.length === 12 ? normalized : null;
  }

  private normalizeDateText(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      const parsedDate = XLSX.SSF.parse_date_code(value);

      if (!parsedDate) {
        return null;
      }

      return [
        String(parsedDate.y).padStart(4, '0'),
        String(parsedDate.m).padStart(2, '0'),
        String(parsedDate.d).padStart(2, '0'),
      ].join('-');
    }

    const trimmed = String(value).trim();

    if (trimmed.length === 0) {
      return null;
    }

    const dateOnly = trimmed
      .replace(/[.]/g, '-')
      .replace(/[\\/]/g, '-')
      .replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, '');
    const matchedDate = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (!matchedDate) {
      return trimmed;
    }

    return [
      matchedDate[1],
      matchedDate[2].padStart(2, '0'),
      matchedDate[3].padStart(2, '0'),
    ].join('-');
  }

  private resolveEventStatus(
    eventCode: string | null,
    eventStartAt: string | null,
    eventEndAt: string | null,
  ): MarketProductEventStatus {
    if (!eventCode) {
      return 'NONE';
    }

    const now = Date.now();
    const startTime = this.parseEventDateTime(eventStartAt, 'start');
    const endTime = this.parseEventDateTime(eventEndAt, 'end');

    if (startTime !== null && now < startTime) {
      return 'SCHEDULED';
    }

    if (endTime !== null && now > endTime) {
      return 'ENDED';
    }

    return 'ACTIVE';
  }

  private parseEventDateTime(
    value: string | null,
    boundary: 'start' | 'end',
  ): number | null {
    if (!value) {
      return null;
    }

    const dateExpression =
      boundary === 'start' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00+09:00`
        : boundary === 'end' && /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? `${value}T23:59:59+09:00`
          : value;
    const parsed = Date.parse(dateExpression);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeRawStockQuantity(
    rawStockQuantity: string | number | null | undefined,
  ): string | null {
    if (rawStockQuantity === null || rawStockQuantity === undefined) {
      return null;
    }

    const normalized = String(rawStockQuantity).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeMoney(value: string | number | null | undefined, fallback: number): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    const normalized = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(normalized) && normalized >= 0 ? Math.floor(normalized) : fallback;
  }

  private normalizeNullableMoney(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(normalized) && normalized >= 0 ? Math.floor(normalized) : null;
  }

  private resolveCategoryName(row: ImportRowForConfirm): string | null {
    return row.rawCategorySmall ?? row.rawCategoryMedium ?? row.rawCategoryLarge;
  }

  private resolveExternalBarcodeFormat(scanCodeValue: string): string {
    if (/^\d{13}$/.test(scanCodeValue)) {
      return 'GTIN13';
    }

    if (/^\d{8}$/.test(scanCodeValue)) {
      return 'INTERNAL_8';
    }

    return 'UNKNOWN';
  }

  private resolveMasterAutoImportApprovalStatus(): 'AUTO_IMPORTED' | 'DRAFT' {
    const row = db
      .prepare(
        `
        SELECT sql
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'master_products'
        LIMIT 1
        `,
      )
      .get() as { sql: string } | undefined;

    return row?.sql.includes('AUTO_IMPORTED') ? 'AUTO_IMPORTED' : 'DRAFT';
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

  private getMarketProductStockRow(
    marketProductId: number,
    channelCode: string,
  ): MarketProductStockRow {
    const row = db
      .prepare(
        `
        SELECT
          id,
          channelCode,
          productCode,
          stockQuantity,
          safetyStockQuantity,
          isSoldOut
        FROM market_channel_products
        WHERE id = ?
          AND channelCode = ?
          AND deletedAt IS NULL
        LIMIT 1
        `,
      )
      .get(marketProductId, channelCode) as MarketProductStockRow | undefined;

    if (!row) {
      throw new NotFoundException('market product not found');
    }

    return row;
  }

  private assertNonNegativeStock(stockQuantity: number): number {
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      throw new Error('normalizedStockQuantity must be a non-negative integer');
    }

    return stockQuantity;
  }

  private resolveStockStatus(
    stockQuantity: number,
    safetyStockQuantity: number,
    isSoldOut: number,
  ): 'IN_STOCK' | 'LOW_STOCK' | 'SOLD_OUT' {
    if (isSoldOut === 1 || stockQuantity === 0) {
      return 'SOLD_OUT';
    }

    if (stockQuantity <= safetyStockQuantity) {
      return 'LOW_STOCK';
    }

    return 'IN_STOCK';
  }

  private normalizeChannelCode(value: string | undefined): string {
    const normalized = value?.trim();

    if (!normalized || !/^[A-Z][A-Z0-9]{12}$/.test(normalized)) {
      throw new BadRequestException('channelCode is invalid');
    }

    return normalized;
  }

  private normalizeConfirmMode(value: string | undefined): ImportConfirmMode {
    const normalized = value?.trim().toUpperCase() || 'AUTO_MATCH';

    if (
      normalized === 'AUTO_MATCH' ||
      normalized === 'CREATE_ONLY' ||
      normalized === 'UPDATE_EXISTING' ||
      normalized === 'STOCK_ONLY' ||
      normalized === 'PRICE_ONLY'
    ) {
      return normalized;
    }

    throw new BadRequestException('confirm mode is invalid');
  }

  private normalizeUploadMode(value: string | undefined): ImportUploadMode {
    const normalized = value?.trim().toUpperCase() || 'FULL_SYNC';

    if (normalized === 'FULL_SYNC' || normalized === 'PARTIAL_UPDATE') {
      return normalized;
    }

    throw new BadRequestException('upload mode is invalid');
  }

  private normalizeId(value: string, fieldName: string): number {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(`${fieldName} is invalid`);
    }

    return id;
  }

  private generateUniqueProductCode(): string {
    for (let index = 0; index < 20; index += 1) {
      const productCode = randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
      const existing = db
        .prepare('SELECT id FROM master_products WHERE productCode = ? LIMIT 1')
        .get(productCode) as { id: number } | undefined;

      if (!existing) {
        return productCode;
      }
    }

    throw new Error('failed to generate productCode');
  }
}

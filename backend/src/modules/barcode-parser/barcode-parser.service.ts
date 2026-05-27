import { Injectable } from '@nestjs/common';
import db from '../../config/database';
import {
  SemanticItemRow,
  SemanticRegistryService,
} from '../semantic-registry/semantic-registry.service';

export type BarcodeParserResult = {
  scanCodeValue: string;
  productCode: string;
  semanticProductCode: string | null;
  semanticTypePrefix: string | null;
  semanticItemCode: string | null;
  parserType: 'EAN13_BARCODE' | 'SEMANTIC_BARCODE' | 'RAW_UNKNOWN';
  parserVersion: string;
  parsedMetadata: Record<string, unknown>;
};

const BARCODE_PARSER_VERSION = 'RAPUS_PRODUCT_CODE_V1';

@Injectable()
export class BarcodeParserService {
  constructor(
    private readonly semanticRegistryService: SemanticRegistryService,
  ) {}

  parseScanCodeValue(scanCodeValueRaw: string): BarcodeParserResult {
    const scanCodeValue = this.normalizeScanCodeValue(scanCodeValueRaw);
    const cached = this.findCachedResult(scanCodeValue);

    if (cached) {
      return cached;
    }

    const parsed = /^\d{13}$/.test(scanCodeValue)
      ? this.parseBarcodeProduct(scanCodeValue)
      : this.parseSemanticProduct(scanCodeValue);

    this.saveParseCache(parsed);
    return parsed;
  }

  isRapusProductCode(productCode: string | null | undefined): boolean {
    const normalizedProductCode = String(productCode ?? '').trim().toUpperCase();
    return (
      /^RPB\d{13}$/.test(normalizedProductCode) ||
      /^RPN[A-Z]{2}\d{9}$/.test(normalizedProductCode)
    );
  }

  private parseBarcodeProduct(scanCodeValue: string): BarcodeParserResult {
    return {
      scanCodeValue,
      productCode: `RPB${scanCodeValue}`,
      semanticProductCode: null,
      semanticTypePrefix: null,
      semanticItemCode: null,
      parserType: 'EAN13_BARCODE',
      parserVersion: BARCODE_PARSER_VERSION,
      parsedMetadata: {
        scanCodeValue,
        productCodePolicy: 'RPB_EAN13',
      },
    };
  }

  private parseSemanticProduct(scanCodeValue: string): BarcodeParserResult {
    const semanticItem =
      this.semanticRegistryService.findItemFromScanCode(scanCodeValue);

    if (!semanticItem) {
      return this.parseUnknownProduct(scanCodeValue);
    }

    const semanticTypePrefix = 'NO';
    const semanticItemCode = semanticItem.itemCode;
    const semanticProductCode = `${semanticTypePrefix}${semanticItemCode}`;
    const serial = this.nextSemanticSerial(semanticTypePrefix, semanticItemCode);
    const productCode =
      `RPN${semanticTypePrefix}${semanticItemCode}${serial}`;

    return {
      scanCodeValue,
      productCode,
      semanticProductCode,
      semanticTypePrefix,
      semanticItemCode,
      parserType: 'SEMANTIC_BARCODE',
      parserVersion: BARCODE_PARSER_VERSION,
      parsedMetadata: this.buildSemanticMetadata(semanticItem, serial),
    };
  }

  private parseUnknownProduct(scanCodeValue: string): BarcodeParserResult {
    const semanticTypePrefix = 'UN';
    const semanticItemCode = '000';
    const semanticProductCode = `RAW_UNKNOWN_${scanCodeValue}`;
    const serial = this.nextSemanticSerial(semanticTypePrefix, semanticItemCode);
    const productCode =
      `RPN${semanticTypePrefix}${semanticItemCode}${serial}`;

    return {
      scanCodeValue,
      productCode,
      semanticProductCode,
      semanticTypePrefix,
      semanticItemCode,
      parserType: 'RAW_UNKNOWN',
      parserVersion: BARCODE_PARSER_VERSION,
      parsedMetadata: {
        scanCodeValue,
        reason: 'SEMANTIC_ITEM_NOT_FOUND',
      },
    };
  }

  private buildSemanticMetadata(
    semanticItem: SemanticItemRow,
    serial: string,
  ): Record<string, unknown> {
    return {
      itemCode: semanticItem.itemCode,
      itemName: semanticItem.itemName,
      categoryType: semanticItem.categoryType,
      aliases: semanticItem.aliases,
      isWeightProduct: semanticItem.isWeightProduct === 1,
      isSeasonal: semanticItem.isSeasonal === 1,
      serial,
    };
  }

  private nextSemanticSerial(prefixCode: string, itemCode: string): string {
    const row = db
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM master_products
        WHERE semanticTypePrefix = ?
          AND semanticItemCode = ?
      `,
      )
      .get(prefixCode, itemCode) as { count?: number } | undefined;

    return String(Number(row?.count ?? 0) + 1).padStart(6, '0');
  }

  private findCachedResult(scanCodeValue: string): BarcodeParserResult | null {
    const row = db
      .prepare(
        `
        SELECT
          scanCodeValue,
          semanticProductCode,
          parsedMetadata,
          parserType,
          parserVersion
        FROM barcode_parse_cache
        WHERE scanCodeValue = ?
          AND parserVersion = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      )
      .get(scanCodeValue, BARCODE_PARSER_VERSION) as
      | {
          scanCodeValue: string;
          semanticProductCode: string | null;
          parsedMetadata: string | null;
          parserType: BarcodeParserResult['parserType'];
          parserVersion: string;
        }
      | undefined;

    if (!row) {
      return null;
    }

    const metadata = this.parseMetadata(row.parsedMetadata);
    const productCode = String(metadata.productCode ?? '');

    if (!this.isRapusProductCode(productCode)) {
      return null;
    }

    return {
      scanCodeValue: row.scanCodeValue,
      productCode,
      semanticProductCode: row.semanticProductCode,
      semanticTypePrefix:
        typeof metadata.semanticTypePrefix === 'string'
          ? metadata.semanticTypePrefix
          : null,
      semanticItemCode:
        typeof metadata.semanticItemCode === 'string'
          ? metadata.semanticItemCode
          : null,
      parserType: row.parserType,
      parserVersion: row.parserVersion,
      parsedMetadata: metadata,
    };
  }

  private saveParseCache(parsed: BarcodeParserResult) {
    db.prepare(
      `
      INSERT INTO barcode_parse_cache(
        scanCodeValue,
        semanticProductCode,
        parsedMetadata,
        parserType,
        parserVersion,
        parsedAt
      )
      VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)
    `,
    ).run(
      parsed.scanCodeValue,
      parsed.semanticProductCode,
      JSON.stringify({
        ...parsed.parsedMetadata,
        productCode: parsed.productCode,
        semanticTypePrefix: parsed.semanticTypePrefix,
        semanticItemCode: parsed.semanticItemCode,
      }),
      parsed.parserType,
      parsed.parserVersion,
    );
  }

  private parseMetadata(value: string | null): Record<string, unknown> {
    if (!value) {
      return {};
    }

    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private normalizeScanCodeValue(value: string): string {
    const scanCodeValue = String(value ?? '').trim().replace(/\D/g, '');

    if (!scanCodeValue) {
      throw new Error('SCAN_CODE_REQUIRED');
    }

    return scanCodeValue;
  }
}

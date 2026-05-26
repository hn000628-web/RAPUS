// SECTION 01 : IMPORT

import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

import rawDb from '../../../config/database';
import { CreateMasterBarcodeDto } from './dto/create-master-barcode.dto';

// SECTION 02 : TYPE

type ImageAssetInsertResult = {
  imageAssetId: number;
  filePath: string;
  publicUrl: string;
  fullPath: string;
};

type CreateMasterBarcodeResult = {
  success: true;
  masterBarcodeId: number;
  gtin: string;
  thumbnailUrl: string | null;
};

type MasterBarcodeRow = {
  id: number;
  gtin: string;
  sourceThumbnailUrl: string | null;
};

type DbRunResult = {
  lastInsertRowid: number | bigint;
};

type DbStatement = {
  get: (...params: unknown[]) => unknown;
  run: (...params: unknown[]) => DbRunResult;
};

type AppDb = {
  prepare: (sql: string) => DbStatement;
  exec: (sql: string) => void;
};

const db = rawDb as unknown as AppDb;
// SECTION 03 : CONSTANT

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

const SYSTEM_MASTER_CHANNEL_CODE = 'SYSTEM_MASTER';

const BARCODE_THUMBNAIL_USAGE_TYPE = 'pos-product-thumbnail';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;

// SECTION 04 : SERVICE

@Injectable()
export class AdminBarcodesService {
  // SECTION 05 : CREATE MASTER BARCODE

  async createMasterBarcode(
    dto: CreateMasterBarcodeDto,
    thumbnailFile?: Express.Multer.File,
  ): Promise<CreateMasterBarcodeResult> {
    const gtin = this.requireGtin(dto.gtin);

    const productNameKo = this.requireProductNameKo(dto.productNameKo);

    const exists = db
      .prepare(
        `
      SELECT
        id
      FROM master_barcodes
      WHERE gtin = ?
      LIMIT 1
    `,
      )
      .get(gtin) as { id: number } | undefined;

    if (exists) {
      throw new ConflictException('gtin already exists');
    }

    let imageAsset: ImageAssetInsertResult | null = null;

    try {
      db.exec('BEGIN');

      if (thumbnailFile) {
        imageAsset = await this.saveThumbnailAsset(thumbnailFile);
      }

      const thumbnailUrl = imageAsset ? imageAsset.publicUrl : null;

      const insertResult = db
        .prepare(
          `
        INSERT INTO master_barcodes(
          gtin,
          barcodeType,
          productCategoryName,
          rawProductName,
          productNameKo,
          brandName,
          companyInfo,
          originInfo,
          packageInfo,
          specInfo,
          netWeight,
          productShape,
          productNumber,
          sourceThumbnailUrl,
          sourceType,
          isActive,
          rawPayload,
          createdAt,
          updatedAt
        )
        VALUES(
          ?,
          'EAN13',
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
          'MANUAL',
          1,
          ?,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
        )
        .run(
          gtin,
          this.normalizeText(dto.productCategoryName),
          productNameKo,
          productNameKo,
          this.normalizeText(dto.brandName),
          this.normalizeText(dto.companyInfo),
          this.normalizeText(dto.originInfo),
          this.normalizeText(dto.packageInfo),
          this.normalizeText(dto.specInfo),
          this.normalizeText(dto.netWeight),
          this.normalizeText(dto.productShape),
          this.normalizeText(dto.productNumber),
          thumbnailUrl,
          JSON.stringify({
            gtin,
            productCategoryName: this.normalizeText(dto.productCategoryName),
            productNameKo,
            brandName: this.normalizeText(dto.brandName),
            companyInfo: this.normalizeText(dto.companyInfo),
            originInfo: this.normalizeText(dto.originInfo),
            packageInfo: this.normalizeText(dto.packageInfo),
            specInfo: this.normalizeText(dto.specInfo),
            netWeight: this.normalizeText(dto.netWeight),
            productShape: this.normalizeText(dto.productShape),
            productNumber: this.normalizeText(dto.productNumber),
            sourceThumbnailUrl: thumbnailUrl,
            sourceType: 'MANUAL',
          }),
        );

      db.exec('COMMIT');

      return {
        success: true,
        masterBarcodeId: Number(insertResult.lastInsertRowid),
        gtin,
        thumbnailUrl,
      };
    } catch (error) {
      this.rollbackQuietly();

      if (imageAsset?.fullPath && fs.existsSync(imageAsset.fullPath)) {
        fs.unlinkSync(imageAsset.fullPath);
      }

      console.error('[ADMIN MASTER BARCODE CREATE ERROR]', error);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('master barcode create failed');
    }
  }

  // SECTION 06 : UPDATE MASTER BARCODE

  async updateMasterBarcode(
    idRaw: string,
    dto: CreateMasterBarcodeDto,
    thumbnailFile?: Express.Multer.File,
  ): Promise<CreateMasterBarcodeResult> {
    const id = this.requireId(idRaw);

    const gtin = this.requireGtin(dto.gtin);

    const productNameKo = this.requireProductNameKo(dto.productNameKo);

    const existing = db
      .prepare(
        `
      SELECT
        id,
        gtin,
        sourceThumbnailUrl
      FROM master_barcodes
      WHERE id = ?
      LIMIT 1
    `,
      )
      .get(id) as MasterBarcodeRow | undefined;

    if (!existing) {
      throw new NotFoundException('master barcode not found');
    }

    const gtinOwner = db
      .prepare(
        `
      SELECT
        id
      FROM master_barcodes
      WHERE gtin = ?
        AND id <> ?
      LIMIT 1
    `,
      )
      .get(gtin, id) as { id: number } | undefined;

    if (gtinOwner) {
      throw new ConflictException('gtin already exists');
    }

    let imageAsset: ImageAssetInsertResult | null = null;

    try {
      db.exec('BEGIN');

      if (thumbnailFile) {
        imageAsset = await this.saveThumbnailAsset(thumbnailFile);
      }

      const thumbnailUrl = imageAsset
        ? imageAsset.publicUrl
        : existing.sourceThumbnailUrl;

      db.prepare(
        `
        UPDATE master_barcodes
        SET
          gtin = ?,
          barcodeType = 'EAN13',
          productCategoryName = ?,
          rawProductName = ?,
          productNameKo = ?,
          normalizedProductName = ?,
          brandName = ?,
          companyInfo = ?,
          originInfo = ?,
          packageInfo = ?,
          specInfo = ?,
          netWeight = ?,
          productShape = ?,
          productNumber = ?,
          sourceThumbnailUrl = ?,
          sourceType = 'MANUAL',
          rawPayload = ?,
          isActive = 1,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(
        gtin,
        this.normalizeText(dto.productCategoryName),
        productNameKo,
        productNameKo,
        productNameKo,
        this.normalizeText(dto.brandName),
        this.normalizeText(dto.companyInfo),
        this.normalizeText(dto.originInfo),
        this.normalizeText(dto.packageInfo),
        this.normalizeText(dto.specInfo),
        this.normalizeText(dto.netWeight),
        this.normalizeText(dto.productShape),
        this.normalizeText(dto.productNumber),
        thumbnailUrl,
        JSON.stringify({
          gtin,
          productCategoryName: this.normalizeText(dto.productCategoryName),
          productNameKo,
          brandName: this.normalizeText(dto.brandName),
          companyInfo: this.normalizeText(dto.companyInfo),
          originInfo: this.normalizeText(dto.originInfo),
          packageInfo: this.normalizeText(dto.packageInfo),
          specInfo: this.normalizeText(dto.specInfo),
          netWeight: this.normalizeText(dto.netWeight),
          productShape: this.normalizeText(dto.productShape),
          productNumber: this.normalizeText(dto.productNumber),
          sourceThumbnailUrl: thumbnailUrl,
          sourceType: 'MANUAL',
        }),
        id,
      );

      db.exec('COMMIT');

      return {
        success: true,
        masterBarcodeId: id,
        gtin,
        thumbnailUrl,
      };
    } catch (error) {
      this.rollbackQuietly();

      console.error('[ADMIN MASTER BARCODE UPDATE ERROR]', error);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('master barcode update failed');
    }
  }

  // SECTION 06 : VALIDATION

  private requireId(value?: string): number {
    const id = Number.parseInt(String(value ?? ''), 10);

    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('id invalid');
    }

    return id;
  }

  private requireGtin(value?: string): string {
    const normalized = this.normalizeText(value);

    if (!normalized) {
      throw new BadRequestException('gtin required');
    }

    if (!/^\d{13}$/.test(normalized)) {
      throw new BadRequestException('gtin must be 13 digits');
    }

    return normalized;
  }

  private requireProductNameKo(value?: string): string {
    const normalized = this.normalizeText(value);

    if (!normalized) {
      throw new BadRequestException('productNameKo required');
    }

    return normalized;
  }

  private normalizeText(value?: string): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  // SECTION 07 : THUMBNAIL

  private async saveThumbnailAsset(
    file: Express.Multer.File,
  ): Promise<ImageAssetInsertResult> {
    this.validateThumbnailFile(file);

    const directory = path.join(
      UPLOAD_ROOT,
      SYSTEM_MASTER_CHANNEL_CODE,
      'barcodes',
    );

    fs.mkdirSync(directory, { recursive: true });

    const fileName = `master_barcode_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.webp`;

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

    const filePath = `${SYSTEM_MASTER_CHANNEL_CODE}/barcodes/${fileName}`;

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
        BARCODE_THUMBNAIL_USAGE_TYPE,
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

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('thumbnail mime invalid');
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      throw new BadRequestException('thumbnail file too large');
    }
  }

  // SECTION 08 : DB

  private rollbackQuietly(): void {
    try {
      db.exec('ROLLBACK');
    } catch {
      return;
    }
  }
}

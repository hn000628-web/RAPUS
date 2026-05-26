/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import db from '../../config/database';

type MasterBarcodeSourceType = 'CSV' | 'API' | 'MANUAL';
type CsvRow = Record<string, string>;
type UploadFileKind = 'CSV' | 'EXCEL';

type CreateMasterBarcodeInput = {
  gtin: string;
  barcodeType?: string;
  rawProductName?: string;
  normalizedProductName?: string;
  brandName?: string;
  manufacturerName?: string;
  categoryName?: string;
  categoryCode?: string;
  originInfo?: string;
  specInfo?: string;
  unitLabel?: string;
  packageInfo?: string;
  sourceThumbnailUrl?: string;
  sourceType?: MasterBarcodeSourceType;
  rawPayload?: string;
  isActive?: boolean;
  isAdultProduct?: boolean;
};

type MasterBarcodeRow = {
  id: number;
  gtin: string;
  barcodeType: string | null;
  productCategoryCode: string | null;
  productCategoryName: string | null;
  rawProductName: string | null;
  productNameKo: string | null;
  productNameEn: string | null;
  otherProductName: string | null;
  itemName: string | null;
  modelName: string | null;
  productNumber: string | null;
  companyInfo: string | null;
  importType: string | null;
  normalizedProductName: string | null;
  brandName: string | null;
  brandOwnerName: string | null;
  manufacturerName: string | null;
  categoryName: string | null;
  categoryCode: string | null;
  originInfo: string | null;
  specInfo: string | null;
  unitLabel: string | null;
  packageInfo: string | null;
  packageQuantity: number | null;
  netWeight: string | null;
  grossWeight: string | null;
  widthCm: string | null;
  depthCm: string | null;
  heightCm: string | null;
  taxType: string | null;
  productShape: string | null;
  packageMaterial: string | null;
  recycleLabel: string | null;
  isAdultProduct: number;
  isChildProduct: number;
  storageNotice: string | null;
  marketingText: string | null;
  ingredientText: string | null;
  sourceThumbnailUrl: string | null;
  sourceType: string;
  rawPayload: string | null;
  isActive: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type LinkedMasterProductRow = {
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
  isAdultProduct: number;
  isActive: number;
  approvalStatus: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type MasterBarcodeFoodDetailsRow = {
  id: number;
  masterBarcodeId: number;
  gtin: string;
  nutritionText: string | null;
  foodIngredientText: string | null;
  cookingTimeText: string | null;
  foodType: string | null;
  gmoNotice: string | null;
  babyDietAdReview: string | null;
  reportNumber: string | null;
  allergyText: string | null;
  facilityAllergyText: string | null;
  certificationText: string | null;
  cookingMethodText: string | null;
  additionalFoodTypeText: string | null;
  storageMethod: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type FindMasterBarcodeResponse = {
  found: boolean;
  barcode: MasterBarcodeRow | null;
  masterProduct: LinkedMasterProductRow | null;
  foodDetails: MasterBarcodeFoodDetailsRow | null;
};

type CsvUploadResult = {
  totalCount: number;
  successCount: number;
  failedCount: number;
  duplicateCount: number;
  policy: 'UPDATE_DUPLICATE';
};

type MasterBarcodeSummaryResponse = {
  totalCount: number;
  validCount: number;
  duplicateSuspectCount: number;
  errorCount: number;
  unlinkedCount: number;
};

type MasterBarcodeSearchItem = {
  id: number;
  gtin: string;
  rawProductName: string | null;
  productNameKo: string | null;
  brandName: string | null;
  brandOwnerName: string | null;
  manufacturerName: string | null;
  companyInfo: string | null;
  originInfo: string | null;
  packageInfo: string | null;
  specInfo: string | null;
  netWeight: string | null;
  productShape: string | null;
  productNumber: string | null;
  productCategoryName: string | null;
  sourceThumbnailUrl: string | null;
  createdAt: string | null;
};

type MasterBarcodeSearchResponse = {
  items: MasterBarcodeSearchItem[];
  totalCount: number;
};

@Injectable()
export class MasterBarcodesService {
  search(queryRaw: string, limitRaw?: string): MasterBarcodeSearchResponse {
    const query = String(queryRaw ?? '').trim();
    if (query.length === 0) {
      return { items: [], totalCount: 0 };
    }

    const parsedLimit = Number.parseInt(String(limitRaw ?? ''), 10);
    const limit = Number.isNaN(parsedLimit)
      ? 20
      : Math.min(Math.max(parsedLimit, 1), 50);

    if (/^\d{13}$/.test(query)) {
      const exactItems = db
        .prepare(
          `
        SELECT
          id,
          gtin,
          rawProductName,
          productNameKo,
          brandName,
          brandOwnerName,
          manufacturerName,
          companyInfo,
          originInfo,
          packageInfo,
          specInfo,
          netWeight,
          productShape,
          productNumber,
          productCategoryName,
          sourceThumbnailUrl,
          createdAt
        FROM master_barcodes
        WHERE gtin = ?
        ORDER BY datetime(createdAt) DESC
        LIMIT ?
      `,
        )
        .all(query, limit) as MasterBarcodeSearchItem[];

      return {
        items: exactItems,
        totalCount: exactItems.length,
      };
    }

    const likeQuery = `%${query}%`;
    const whereClause = `
      rawProductName LIKE @likeQuery
      OR productNameKo LIKE @likeQuery
      OR productNameEn LIKE @likeQuery
      OR brandName LIKE @likeQuery
      OR brandOwnerName LIKE @likeQuery
      OR manufacturerName LIKE @likeQuery
      OR companyInfo LIKE @likeQuery
      OR productCategoryName LIKE @likeQuery
      OR gtin LIKE @likeQuery
    `;

    const items = db
      .prepare(
        `
      SELECT
        id,
        gtin,
        rawProductName,
        productNameKo,
        brandName,
        brandOwnerName,
        manufacturerName,
        companyInfo,
        originInfo,
        packageInfo,
        specInfo,
        netWeight,
        productShape,
        productNumber,
        productCategoryName,
        sourceThumbnailUrl,
        createdAt
      FROM master_barcodes
      WHERE ${whereClause}
      ORDER BY datetime(createdAt) DESC
      LIMIT @limit
    `,
      )
      .all({ likeQuery, limit }) as MasterBarcodeSearchItem[];

    const countRow = db
      .prepare(
        `
      SELECT COUNT(*) AS count
      FROM master_barcodes
      WHERE ${whereClause}
    `,
      )
      .get({ likeQuery }) as { count: number };

    return {
      items,
      totalCount: countRow.count ?? 0,
    };
  }

  getSummary(): MasterBarcodeSummaryResponse {
    const totalCountRow = db
      .prepare(
        `
      SELECT COUNT(*) AS count
      FROM master_barcodes
    `,
      )
      .get() as { count: number };

    const validCountRow = db
      .prepare(
        `
      SELECT COUNT(*) AS count
      FROM master_barcodes
      WHERE isActive = 1
        AND length(gtin) = 13
        AND gtin GLOB '[0-9]*'
    `,
      )
      .get() as { count: number };

    const duplicateSuspectCountRow = db
      .prepare(
        `
      SELECT COUNT(*) AS count
      FROM (
        SELECT rawProductName
        FROM master_barcodes
        WHERE rawProductName IS NOT NULL
          AND rawProductName <> ''
        GROUP BY rawProductName
        HAVING COUNT(*) > 1
      ) t
    `,
      )
      .get() as { count: number };

    const errorCountRow = db
      .prepare(
        `
      SELECT COUNT(*) AS count
      FROM master_barcodes
      WHERE gtin IS NULL
         OR length(gtin) <> 13
         OR gtin NOT GLOB '[0-9]*'
    `,
      )
      .get() as { count: number };

    const unlinkedCountRow = db
      .prepare(
        `
      SELECT COUNT(*) AS count
      FROM master_barcodes mb
      LEFT JOIN master_product_barcodes mpb
        ON mpb.gtin = mb.gtin
      WHERE mpb.id IS NULL
    `,
      )
      .get() as { count: number };

    return {
      totalCount: totalCountRow.count ?? 0,
      validCount: validCountRow.count ?? 0,
      duplicateSuspectCount: duplicateSuspectCountRow.count ?? 0,
      errorCount: errorCountRow.count ?? 0,
      unlinkedCount: unlinkedCountRow.count ?? 0,
    };
  }

  findByGtin(gtinRaw: string): FindMasterBarcodeResponse {
    const gtin = this.normalizeGtin(gtinRaw);

    const barcodeRow = db
      .prepare(
        `
      SELECT *
      FROM master_barcodes
      WHERE gtin = ?
      LIMIT 1
    `,
      )
      .get(gtin) as MasterBarcodeRow | undefined;

    if (!barcodeRow) {
      return {
        found: false,
        barcode: null,
        masterProduct: null,
        foodDetails: null,
      };
    }

    const masterProductRow = db
      .prepare(
        `
      SELECT mp.*
      FROM master_product_barcodes mpb
      INNER JOIN master_products mp
        ON mp.id = mpb.masterProductId
      WHERE mpb.gtin = ?
      LIMIT 1
    `,
      )
      .get(gtin) as LinkedMasterProductRow | undefined;

    const foodDetails = db
      .prepare(
        `
      SELECT *
      FROM master_barcode_food_details
      WHERE gtin = ?
      LIMIT 1
    `,
      )
      .get(gtin) as MasterBarcodeFoodDetailsRow | undefined;

    return {
      found: true,
      barcode: barcodeRow,
      masterProduct: masterProductRow ?? null,
      foodDetails: foodDetails ?? null,
    };
  }

  uploadCsv(file: Express.Multer.File): CsvUploadResult {
    if (!file) {
      throw new BadRequestException('BARCODE_UPLOAD_FILE_REQUIRED');
    }

    const { rows } = this.parseUploadRows(file);

    if (rows.length === 0) {
      return {
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        duplicateCount: 0,
        policy: 'UPDATE_DUPLICATE',
      };
    }

    if (!this.hasGtinHeader(rows[0])) {
      throw new BadRequestException('BARCODE_UPLOAD_GTIN_HEADER_REQUIRED');
    }

    const insertMaster = db.prepare(`
      INSERT INTO master_barcodes(
        gtin, barcodeType, productCategoryCode, productCategoryName,
        rawProductName, productNameKo, productNameEn, otherProductName, itemName, modelName,
        productNumber, companyInfo, importType, normalizedProductName, brandName, brandOwnerName,
        manufacturerName, categoryName, categoryCode, originInfo, specInfo, unitLabel, packageInfo,
        packageQuantity, netWeight, grossWeight, widthCm, depthCm, heightCm, taxType, productShape,
        packageMaterial, recycleLabel, isAdultProduct, isChildProduct, storageNotice, marketingText,
        ingredientText, sourceThumbnailUrl, sourceType, rawPayload, isActive, createdAt, updatedAt
      )
      VALUES(
        @gtin, 'EAN13', @productCategoryCode, @productCategoryName,
        @rawProductName, @productNameKo, @productNameEn, @otherProductName, @itemName, @modelName,
        @productNumber, @companyInfo, @importType, @normalizedProductName, @brandName, @brandOwnerName,
        @manufacturerName, @categoryName, @categoryCode, @originInfo, @specInfo, @unitLabel, @packageInfo,
        @packageQuantity, @netWeight, @grossWeight, @widthCm, @depthCm, @heightCm, @taxType, @productShape,
        @packageMaterial, @recycleLabel, @isAdultProduct, @isChildProduct, @storageNotice, @marketingText,
        @ingredientText, @sourceThumbnailUrl, 'CSV', @rawPayload, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    const updateMaster = db.prepare(`
      UPDATE master_barcodes
      SET
        productCategoryCode = COALESCE(@productCategoryCode, productCategoryCode),
        productCategoryName = COALESCE(@productCategoryName, productCategoryName),
        rawProductName = COALESCE(@rawProductName, rawProductName),
        productNameKo = COALESCE(@productNameKo, productNameKo),
        productNameEn = COALESCE(@productNameEn, productNameEn),
        otherProductName = COALESCE(@otherProductName, otherProductName),
        itemName = COALESCE(@itemName, itemName),
        modelName = COALESCE(@modelName, modelName),
        productNumber = COALESCE(@productNumber, productNumber),
        companyInfo = COALESCE(@companyInfo, companyInfo),
        importType = COALESCE(@importType, importType),
        normalizedProductName = COALESCE(@normalizedProductName, normalizedProductName),
        brandName = COALESCE(@brandName, brandName),
        brandOwnerName = COALESCE(@brandOwnerName, brandOwnerName),
        manufacturerName = COALESCE(@manufacturerName, manufacturerName),
        categoryName = COALESCE(@categoryName, categoryName),
        categoryCode = COALESCE(@categoryCode, categoryCode),
        originInfo = COALESCE(@originInfo, originInfo),
        specInfo = COALESCE(@specInfo, specInfo),
        unitLabel = COALESCE(@unitLabel, unitLabel),
        packageInfo = COALESCE(@packageInfo, packageInfo),
        packageQuantity = COALESCE(@packageQuantity, packageQuantity),
        netWeight = COALESCE(@netWeight, netWeight),
        grossWeight = COALESCE(@grossWeight, grossWeight),
        widthCm = COALESCE(@widthCm, widthCm),
        depthCm = COALESCE(@depthCm, depthCm),
        heightCm = COALESCE(@heightCm, heightCm),
        taxType = COALESCE(@taxType, taxType),
        productShape = COALESCE(@productShape, productShape),
        packageMaterial = COALESCE(@packageMaterial, packageMaterial),
        recycleLabel = COALESCE(@recycleLabel, recycleLabel),
        isAdultProduct = COALESCE(@isAdultProduct, isAdultProduct),
        isChildProduct = COALESCE(@isChildProduct, isChildProduct),
        storageNotice = COALESCE(@storageNotice, storageNotice),
        marketingText = COALESCE(@marketingText, marketingText),
        ingredientText = COALESCE(@ingredientText, ingredientText),
        sourceThumbnailUrl = COALESCE(@sourceThumbnailUrl, sourceThumbnailUrl),
        sourceType = 'CSV',
        rawPayload = @rawPayload,
        isActive = 1,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = @masterBarcodeId
    `);

    const upsertFood = db.prepare(`
      INSERT INTO master_barcode_food_details(
        masterBarcodeId, gtin, nutritionText, foodIngredientText, cookingTimeText, foodType, gmoNotice,
        babyDietAdReview, reportNumber, allergyText, facilityAllergyText, certificationText,
        cookingMethodText, additionalFoodTypeText, storageMethod, createdAt, updatedAt
      )
      VALUES(
        @masterBarcodeId, @gtin, @nutritionText, @foodIngredientText, @cookingTimeText, @foodType, @gmoNotice,
        @babyDietAdReview, @reportNumber, @allergyText, @facilityAllergyText, @certificationText,
        @cookingMethodText, @additionalFoodTypeText, @storageMethod, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT(masterBarcodeId)
      DO UPDATE SET
        nutritionText = COALESCE(excluded.nutritionText, nutritionText),
        foodIngredientText = COALESCE(excluded.foodIngredientText, foodIngredientText),
        cookingTimeText = COALESCE(excluded.cookingTimeText, cookingTimeText),
        foodType = COALESCE(excluded.foodType, foodType),
        gmoNotice = COALESCE(excluded.gmoNotice, gmoNotice),
        babyDietAdReview = COALESCE(excluded.babyDietAdReview, babyDietAdReview),
        reportNumber = COALESCE(excluded.reportNumber, reportNumber),
        allergyText = COALESCE(excluded.allergyText, allergyText),
        facilityAllergyText = COALESCE(excluded.facilityAllergyText, facilityAllergyText),
        certificationText = COALESCE(excluded.certificationText, certificationText),
        cookingMethodText = COALESCE(excluded.cookingMethodText, cookingMethodText),
        additionalFoodTypeText = COALESCE(excluded.additionalFoodTypeText, additionalFoodTypeText),
        storageMethod = COALESCE(excluded.storageMethod, storageMethod),
        updatedAt = CURRENT_TIMESTAMP
    `);

    let successCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;

    const tx = db.transaction((row: CsvRow) => {
      const gtin = this.extractGtin(row);
      if (!/^\d{13}$/.test(gtin)) {
        return 'failed' as const;
      }

      const productName = this.pickUploadProductName(row);
      const categoryName = this.resolveUploadCategoryName(row);
      const supplierName = this.pickValue(row, [
        '공급사',
        '브랜드명',
        '브랜드',
        'brandName',
        'brand',
      ]);
      const specInfo = this.pickValue(row, ['규격정보', '규격', 'specInfo']);
      const isAdultProductRaw = this.pickValue(row, ['성인용 상품 여부']);
      const isChildProductRaw = this.pickValue(row, ['어린이용 상품 여부']);
      const uploadParams = {
        gtin,
        productCategoryCode: this.pickValue(row, ['상품분류코드']),
        productCategoryName: categoryName,
        rawProductName: productName,
        productNameKo: productName,
        productNameEn: this.pickValue(row, ['상품명(영문)']),
        otherProductName: this.pickValue(row, ['상품명(기타)']),
        itemName: this.pickValue(row, ['품목명', '품명']),
        modelName: this.pickValue(row, ['모델명']),
        productNumber: this.pickValue(row, ['제품번호']),
        companyInfo: this.pickValue(row, ['회사정보', '회사명', 'companyName']),
        importType: this.pickValue(row, ['수입 상품 구분']),
        normalizedProductName: productName,
        brandName: supplierName,
        brandOwnerName: this.pickValue(row, ['브랜드 소유회사']),
        manufacturerName: this.pickValue(row, [
          '제조사',
          'manufacturerName',
          '공급사',
          '회사정보',
          '회사명',
          'manufacturer',
        ]),
        categoryName,
        categoryCode: this.pickValue(row, ['상품분류코드', 'categoryCode']),
        originInfo: this.pickValue(row, ['국가정보', 'originInfo']),
        specInfo,
        unitLabel: this.pickValue(row, ['상품 단위', 'unit']),
        packageInfo: this.pickValue(row, ['상품 구성', 'packageInfo']),
        packageQuantity: this.toInteger(
          this.pickValue(row, ['포장단위별 수량']),
        ),
        netWeight: this.pickValue(row, ['순중량(Net Weight)']),
        grossWeight: this.pickValue(row, ['총중량(Gross Weight)']),
        widthCm: this.pickValue(row, ['가로(cm)']),
        depthCm: this.pickValue(row, ['세로(cm)']),
        heightCm: this.pickValue(row, ['높이(cm)']),
        taxType: this.pickValue(row, ['과세형태']),
        productShape: this.pickValue(row, ['상품 형태']),
        packageMaterial: this.pickValue(row, ['상품 포장 재질']),
        recycleLabel: this.pickValue(row, ['분리배출표시']),
        isAdultProduct: isAdultProductRaw
          ? this.toBooleanInt(isAdultProductRaw)
          : null,
        isChildProduct: isChildProductRaw
          ? this.toBooleanInt(isChildProductRaw)
          : null,
        storageNotice: this.pickValue(row, ['보관 취급 주의사항']),
        marketingText: this.pickValue(row, ['마케팅 문구']),
        ingredientText: this.pickValue(row, ['원재료 전체텍스트']),
        sourceThumbnailUrl: this.pickValue(row, [
          '워터마크 1000 JPG',
          'thumbnailUrl',
        ]),
        rawPayload: JSON.stringify(row),
      };

      const exists = db
        .prepare(`SELECT id FROM master_barcodes WHERE gtin = ? LIMIT 1`)
        .get(gtin) as { id?: number } | undefined;

      const masterBarcodeId = exists?.id
        ? Number(exists.id)
        : Number(
            insertMaster.run({
              ...uploadParams,
              isAdultProduct: uploadParams.isAdultProduct ?? 0,
              isChildProduct: uploadParams.isChildProduct ?? 0,
            }).lastInsertRowid,
          );

      if (exists?.id) {
        updateMaster.run({
          masterBarcodeId,
          ...uploadParams,
        });
      }

      upsertFood.run({
        masterBarcodeId,
        gtin,
        nutritionText: this.pickValue(row, ['영양성분']),
        foodIngredientText: this.pickValue(row, ['재료(138847)']),
        cookingTimeText: this.pickValue(row, ['조리시간(138852)']),
        foodType: this.pickValue(row, ['식품의 유형(140714)']),
        gmoNotice: this.pickValue(row, [
          '유전자재조합식품의 경우 표시(140722)',
        ]),
        babyDietAdReview: this.pickValue(row, [
          '영유아식/체중조절식품 표시광고 사전심의필(140723)',
        ]),
        reportNumber: this.pickValue(row, ['품목보고번호(140731)']),
        allergyText: this.pickValue(row, ['알레르기(140803)']),
        facilityAllergyText: this.pickValue(row, [
          '제조시설 알레르기 성분 안내(140804)',
        ]),
        certificationText: this.pickValue(row, ['인증(140805)']),
        cookingMethodText: this.pickValue(row, ['조리법/음용법(140808)']),
        additionalFoodTypeText: this.pickValue(row, [
          '추가식품유형/개별표시(140809)',
        ]),
        storageMethod: this.pickValue(row, ['보관방식(140924)']),
      });

      return exists?.id ? ('duplicate' as const) : ('success' as const);
    });

    for (const row of rows) {
      try {
        const status = tx(row);
        if (status === 'success') {
          successCount += 1;
        } else if (status === 'duplicate') {
          duplicateCount += 1;
        } else {
          failedCount += 1;
        }
      } catch {
        failedCount += 1;
      }
    }

    return {
      totalCount: rows.length,
      successCount,
      failedCount,
      duplicateCount,
      policy: 'UPDATE_DUPLICATE',
    };
  }

  upsert(input: CreateMasterBarcodeInput): { success: true; gtin: string } {
    const gtin = this.normalizeGtin(input.gtin);
    const sourceType: MasterBarcodeSourceType = input.sourceType ?? 'MANUAL';
    const isActive = input.isActive === false ? 0 : 1;
    const isAdultProduct = input.isAdultProduct ? 1 : 0;

    db.prepare(
      `
      INSERT INTO master_barcodes(
        gtin, barcodeType, rawProductName, normalizedProductName, brandName, manufacturerName,
        categoryName, categoryCode, originInfo, specInfo, unitLabel, packageInfo, sourceThumbnailUrl,
        sourceType, rawPayload, isAdultProduct, isActive, createdAt, updatedAt
      )
      VALUES(
        @gtin, @barcodeType, @rawProductName, @normalizedProductName, @brandName, @manufacturerName,
        @categoryName, @categoryCode, @originInfo, @specInfo, @unitLabel, @packageInfo, @sourceThumbnailUrl,
        @sourceType, @rawPayload, @isAdultProduct, @isActive, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT(gtin)
      DO UPDATE SET
        barcodeType = excluded.barcodeType,
        rawProductName = excluded.rawProductName,
        normalizedProductName = excluded.normalizedProductName,
        brandName = excluded.brandName,
        manufacturerName = excluded.manufacturerName,
        categoryName = excluded.categoryName,
        categoryCode = excluded.categoryCode,
        originInfo = excluded.originInfo,
        specInfo = excluded.specInfo,
        unitLabel = excluded.unitLabel,
        packageInfo = excluded.packageInfo,
        sourceThumbnailUrl = excluded.sourceThumbnailUrl,
        sourceType = excluded.sourceType,
        rawPayload = excluded.rawPayload,
        isAdultProduct = excluded.isAdultProduct,
        isActive = excluded.isActive,
        updatedAt = CURRENT_TIMESTAMP
    `,
    ).run({
      gtin,
      barcodeType: input.barcodeType ?? 'EAN13',
      rawProductName: input.rawProductName ?? null,
      normalizedProductName: input.normalizedProductName ?? null,
      brandName: input.brandName ?? null,
      manufacturerName: input.manufacturerName ?? null,
      categoryName: input.categoryName ?? null,
      categoryCode: input.categoryCode ?? null,
      originInfo: input.originInfo ?? null,
      specInfo: input.specInfo ?? null,
      unitLabel: input.unitLabel ?? null,
      packageInfo: input.packageInfo ?? null,
      sourceThumbnailUrl: input.sourceThumbnailUrl ?? null,
      sourceType,
      rawPayload: input.rawPayload ?? null,
      isAdultProduct,
      isActive,
    });

    return { success: true, gtin };
  }

  private normalizeGtin(gtinRaw: string): string {
    const gtin = String(gtinRaw ?? '').trim();
    if (!/^\d{13}$/.test(gtin)) {
      throw new BadRequestException('GTIN_13_REQUIRED');
    }
    return gtin;
  }

  private parseUploadRows(file: Express.Multer.File): {
    kind: UploadFileKind;
    rows: CsvRow[];
  } {
    const extension = this.getUploadFileExtension(file.originalname);

    if (extension === 'csv') {
      const csvText = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
      const rows: CsvRow[] = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return { kind: 'CSV', rows };
    }

    if (extension === 'xlsx' || extension === 'xls') {
      const workbook = XLSX.read(file.buffer, {
        type: 'buffer',
        cellDates: false,
      });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return { kind: 'EXCEL', rows: [] };
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        raw: false,
      });

      return {
        kind: 'EXCEL',
        rows: rawRows.map((row) => this.normalizeUploadRow(row)),
      };
    }

    throw new BadRequestException('BARCODE_UPLOAD_FILE_TYPE_NOT_ALLOWED');
  }

  private getUploadFileExtension(originalName: string): string {
    const extension = String(originalName ?? '')
      .trim()
      .toLowerCase()
      .split('.')
      .pop();

    if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
      throw new BadRequestException('BARCODE_UPLOAD_FILE_TYPE_NOT_ALLOWED');
    }

    return extension;
  }

  private normalizeUploadRow(row: Record<string, unknown>): CsvRow {
    return Object.entries(row).reduce<CsvRow>((normalized, [key, value]) => {
      const normalizedKey = this.normalizeHeaderKey(key);
      if (!normalizedKey) {
        return normalized;
      }

      if (value === null || value === undefined) {
        if (!normalized[normalizedKey]) {
          normalized[normalizedKey] = '';
        }
        return normalized;
      }

      let normalizedValue = '';

      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        normalizedValue = String(value).trim();
      } else if (value instanceof Date) {
        normalizedValue = value.toISOString();
      } else {
        normalizedValue = JSON.stringify(value);
      }

      if (normalizedValue || !normalized[normalizedKey]) {
        normalized[normalizedKey] = normalizedValue;
      }

      return normalized;
    }, {});
  }

  private pickUploadProductName(row: CsvRow): string | null {
    return this.pickValue(row, [
      '상품명(대표)',
      '상품명(국문)',
      '상품명(한글)',
      '상품명',
      '제품명',
      '품명',
      'productName',
      'productNameKo',
      'name',
    ]);
  }

  private resolveUploadCategoryName(row: CsvRow): string | null {
    const standardCategoryName = this.pickValue(row, [
      '상품분류명',
      'categoryName',
      'category',
    ]);

    if (standardCategoryName) {
      return standardCategoryName;
    }

    const categoryParts = [
      this.pickValue(row, ['대']),
      this.pickValue(row, ['중']),
      this.pickValue(row, ['소']),
    ].filter((part): part is string => Boolean(part));

    return categoryParts.length > 0 ? categoryParts.join('>') : null;
  }

  private hasGtinHeader(row: CsvRow): boolean {
    const keys = Object.keys(row).map((key) => this.normalizeHeaderKey(key));
    return (
      keys.includes('GTIN') ||
      keys.includes('gtin') ||
      keys.includes('바코드') ||
      keys.includes('barcode') ||
      keys.includes('Barcode')
    );
  }

  private extractGtin(row: CsvRow): string {
    return (
      this.pickValue(row, ['GTIN', 'gtin', '바코드', 'barcode', 'Barcode']) ??
      ''
    )
      .replace(/[^0-9]/g, '')
      .trim();
  }

  private pickValue(row: CsvRow, keys: string[]): string | null {
    for (const key of keys) {
      const value = row[key] ?? row[this.normalizeHeaderKey(key)];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }
    return null;
  }

  private normalizeHeaderKey(key: string): string {
    return String(key ?? '')
      .replace(/^\uFEFF/, '')
      .replace(/[\s\r\n\t]+/g, '')
      .trim();
  }

  private toInteger(value: string | null): number | null {
    if (!value) {
      return null;
    }
    const numeric = value.replace(/[^0-9-]/g, '');
    if (!numeric) {
      return null;
    }
    const parsed = Number.parseInt(numeric, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private toBooleanInt(value: string | null): number {
    if (!value) {
      return 0;
    }
    const normalized = value.trim().toUpperCase();
    if (
      normalized === 'Y' ||
      normalized === 'YES' ||
      normalized === '1' ||
      normalized === 'TRUE'
    ) {
      return 1;
    }
    return 0;
  }
}

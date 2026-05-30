import { Injectable } from '@nestjs/common'
import db from '../../../config/database'

type ProductSearchRow = {
  productId: number
  productCode: string | null
  barcode: string | null
  productName: string | null
  brandName: string | null
  thumbnailPath: string | null
  categoryName: string | null
}

type MasterProductSearchRow = {
  productId: number
  productCode: string | null
  barcode: string | null
  productName: string | null
  brandName: string | null
  thumbnailPath: string | null
  categoryName: string | null
}

@Injectable()
export class BusinessProductsService {
  private buildMediaUrl(filePath?: string | null): string | null {
    if (!filePath) return null
    const trimmed = filePath.trim()
    if (!trimmed) return null
    if (/^(https?:|blob:)/.test(trimmed)) return trimmed

    const rawBaseUrl =
      process.env.MEDIA_BASE_URL?.trim() ||
      process.env.BACKEND_URL?.trim() ||
      `http://localhost:${process.env.PORT || 4000}`

    const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '')
    if (trimmed.startsWith('/media/')) return `${normalizedBaseUrl}${trimmed}`
    if (trimmed.startsWith('/uploads/')) {
      return `${normalizedBaseUrl}${trimmed.replace(/^\/uploads\//, '/media/')}`
    }
    if (trimmed.startsWith('/')) return `${normalizedBaseUrl}${trimmed}`
    return `${normalizedBaseUrl}/media/${trimmed.replace(/^\/+/, '')}`
  }

  searchProducts(keywordInput: string) {
    const keyword = String(keywordInput ?? '').trim()
    if (!keyword) return []

    const likeKeyword = `%${keyword}%`

    const posRows = db.prepare(
      `
      SELECT
        p.id AS productId,
        p.productCode AS productCode,
        (
          SELECT b.gtin
          FROM pos_product_barcodes b
          WHERE b.productCode = p.productCode
            AND COALESCE(b.isActive, 1) = 1
          ORDER BY b.id DESC
          LIMIT 1
        ) AS barcode,
        p.productName AS productName,
        COALESCE(NULLIF(mp.brandName, ''), '') AS brandName,
        (
          SELECT a.filePath
          FROM pos_product_thumbnails t
          INNER JOIN image_assets a
            ON a.id = t.imageAssetId
          WHERE t.productId = p.id
            AND t.channelCode = p.channelCode
            AND COALESCE(t.isActive, 1) = 1
          ORDER BY t.sortOrder ASC, t.id DESC
          LIMIT 1
        ) AS thumbnailPath,
        COALESCE(c.categoryName, '') AS categoryName
      FROM pos_products p
      LEFT JOIN master_products mp
        ON mp.productCode = p.productCode
      LEFT JOIN pos_product_categories c
        ON c.id = p.categoryId
      WHERE p.deletedAt IS NULL
        AND COALESCE(p.isActive, 1) = 1
        AND (
          EXISTS (
            SELECT 1
            FROM pos_product_barcodes b1
            WHERE b1.productCode = p.productCode
              AND b1.gtin = ?
              AND COALESCE(b1.isActive, 1) = 1
          )
          OR p.productCode = ?
          OR p.productName LIKE ?
          OR COALESCE(mp.brandName, '') LIKE ?
        )
      ORDER BY
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM pos_product_barcodes b2
            WHERE b2.productCode = p.productCode
              AND b2.gtin = ?
              AND COALESCE(b2.isActive, 1) = 1
          ) THEN 0
          WHEN p.productCode = ? THEN 1
          WHEN p.productName LIKE ? THEN 2
          ELSE 3
        END ASC,
        p.updatedAt DESC,
        p.id DESC
      LIMIT 30
      `
    ).all(
      keyword,
      keyword,
      likeKeyword,
      likeKeyword,
      keyword,
      keyword,
      likeKeyword
    ) as ProductSearchRow[]

    const masterRows = db.prepare(
      `
      SELECT
        mp.id AS productId,
        mp.productCode AS productCode,
        COALESCE(
          (
            SELECT msc.scanCodeValue
            FROM master_product_scan_codes msc
            WHERE msc.productCode = mp.productCode
              AND COALESCE(msc.isActive, 1) = 1
              AND msc.scanCodeType IN ('EXTERNAL_BARCODE', 'RAPUS_BARCODE', 'RAPUS_QR')
            ORDER BY msc.isPrimary DESC, msc.id DESC
            LIMIT 1
          ),
          mp.primaryScanCodeValue
        ) AS barcode,
        mp.productName AS productName,
        COALESCE(NULLIF(mp.brandName, ''), '') AS brandName,
        (
          SELECT a.filePath
          FROM image_assets a
          WHERE a.id = mp.thumbnailImageAssetId
          LIMIT 1
        ) AS thumbnailPath,
        COALESCE(mp.categoryName, '') AS categoryName
      FROM master_products mp
      WHERE mp.deletedAt IS NULL
        AND COALESCE(mp.isActive, 1) = 1
        AND (
          mp.primaryScanCodeValue = ?
          OR EXISTS (
            SELECT 1
            FROM master_product_scan_codes msc1
            WHERE msc1.productCode = mp.productCode
              AND msc1.scanCodeValue = ?
              AND COALESCE(msc1.isActive, 1) = 1
          )
          OR mp.productCode = ?
          OR mp.productName LIKE ?
          OR COALESCE(mp.brandName, '') LIKE ?
        )
      ORDER BY
        CASE
          WHEN mp.primaryScanCodeValue = ? THEN 0
          WHEN EXISTS (
            SELECT 1
            FROM master_product_scan_codes msc2
            WHERE msc2.productCode = mp.productCode
              AND msc2.scanCodeValue = ?
              AND COALESCE(msc2.isActive, 1) = 1
          ) THEN 0
          WHEN mp.productCode = ? THEN 1
          WHEN mp.productName LIKE ? THEN 2
          ELSE 3
        END ASC,
        mp.updatedAt DESC,
        mp.id DESC
      LIMIT 30
      `
    ).all(
      keyword,
      keyword,
      keyword,
      likeKeyword,
      likeKeyword,
      keyword,
      keyword,
      keyword,
      likeKeyword
    ) as MasterProductSearchRow[]

    const mergedByProductCode = new Map<string, ProductSearchRow>()

    for (const row of [...posRows, ...masterRows]) {
      const key = String(row.productCode || '').trim()
      if (!key || mergedByProductCode.has(key)) continue
      mergedByProductCode.set(key, row)
    }

    return Array.from(mergedByProductCode.values()).map((row) => ({
      productId: row.productId,
      productCode: row.productCode || '',
      barcode: row.barcode || '',
      productName: row.productName || '',
      brandName: row.brandName || '',
      thumbnailUrl: this.buildMediaUrl(row.thumbnailPath),
      categoryName: row.categoryName || ''
    }))
  }
}

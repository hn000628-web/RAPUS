import { BadRequestException, Injectable } from '@nestjs/common'
import db from '../../config/database'

type CreateGoodsReceiptItemInput = {
  goodsReceiptId: number
  masterProductId?: number
  manufacturerId?: number | null
  brandId?: number | null
  barcode: string
  packageType?: 'ITEM' | 'BOX' | 'CASE' | 'PALLET'
  receivedQuantity: number
}

@Injectable()
export class GoodsReceiptsService {
  createGoodsReceiptItem(input: CreateGoodsReceiptItemInput) {
    const goodsReceiptId = Number(input.goodsReceiptId)
    const receivedQuantity = Number(input.receivedQuantity)
    const barcode = String(input.barcode ?? '').trim()

    if (!Number.isInteger(goodsReceiptId) || goodsReceiptId <= 0) {
      throw new BadRequestException('invalid goodsReceiptId')
    }

    if (!barcode) {
      throw new BadRequestException('barcode required')
    }

    if (!Number.isFinite(receivedQuantity) || receivedQuantity <= 0) {
      throw new BadRequestException('receivedQuantity must be > 0')
    }

    const receipt = db
      .prepare(
        `
        SELECT id, receiverChannelCode
        FROM goods_receipts
        WHERE id = ?
        LIMIT 1
      `,
      )
      .get(goodsReceiptId) as
      | { id: number; receiverChannelCode: string }
      | undefined

    if (!receipt) {
      throw new BadRequestException('goods receipt not found')
    }

    const packageUnit = db
      .prepare(
        `
        SELECT
          masterProductId,
          manufacturerId,
          brandId,
          packageType,
          quantityPerUnit
        FROM product_package_units
        WHERE barcode = ?
          AND isActive = 1
        LIMIT 1
      `,
      )
      .get(barcode) as
      | {
          masterProductId: number
          manufacturerId: number | null
          brandId: number | null
          packageType: 'ITEM' | 'BOX' | 'CASE' | 'PALLET'
          quantityPerUnit: number
        }
      | undefined

    if (!packageUnit) {
      throw new BadRequestException('package unit not found by barcode')
    }

    if (
      input.masterProductId &&
      Number(input.masterProductId) !== Number(packageUnit.masterProductId)
    ) {
      throw new BadRequestException('masterProductId mismatch with barcode')
    }

    const resolvedMasterProductId = Number(
      input.masterProductId ?? packageUnit.masterProductId,
    )
    const resolvedManufacturerId =
      input.manufacturerId ?? packageUnit.manufacturerId ?? null
    const resolvedBrandId = input.brandId ?? packageUnit.brandId ?? null
    const resolvedPackageType = input.packageType ?? packageUnit.packageType

    const quantityPerUnit = Number(packageUnit.quantityPerUnit)
    if (!Number.isFinite(quantityPerUnit) || quantityPerUnit <= 0) {
      throw new BadRequestException('invalid quantityPerUnit')
    }

    const convertedItemQuantity = Math.trunc(receivedQuantity * quantityPerUnit)

    const transaction = db.transaction(() => {
      const insertReceiptItem = db.prepare(
        `
        INSERT INTO goods_receipt_items(
          goodsReceiptId,
          masterProductId,
          manufacturerId,
          brandId,
          barcode,
          packageType,
          receivedQuantity,
          convertedItemQuantity,
          createdAt
        )
        VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      `,
      )

      const receiptItemResult = insertReceiptItem.run(
        goodsReceiptId,
        resolvedMasterProductId,
        resolvedManufacturerId,
        resolvedBrandId,
        barcode,
        resolvedPackageType,
        receivedQuantity,
        convertedItemQuantity,
      )

      const goodsReceiptItemId = Number(receiptItemResult.lastInsertRowid)

      const latestMovement = db
        .prepare(
          `
          SELECT afterQuantity
          FROM inventory_movements
          WHERE channelCode = ?
            AND masterProductId = ?
          ORDER BY id DESC
          LIMIT 1
        `,
        )
        .get(receipt.receiverChannelCode, resolvedMasterProductId) as
        | { afterQuantity: number }
        | undefined

      const beforeQuantity = Number(latestMovement?.afterQuantity ?? 0)
      const afterQuantity = beforeQuantity + convertedItemQuantity

      db.prepare(
        `
        INSERT INTO inventory_movements(
          channelCode,
          masterProductId,
          movementType,
          quantity,
          beforeQuantity,
          afterQuantity,
          referenceType,
          referenceId,
          createdAt
        )
        VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      `,
      ).run(
        receipt.receiverChannelCode,
        resolvedMasterProductId,
        'INBOUND',
        convertedItemQuantity,
        beforeQuantity,
        afterQuantity,
        'GOODS_RECEIPT',
        goodsReceiptItemId,
      )

      return {
        goodsReceiptItemId,
        goodsReceiptId,
        channelCode: receipt.receiverChannelCode,
        barcode,
        packageType: resolvedPackageType,
        quantityPerUnit,
        receivedQuantity,
        convertedItemQuantity,
        inventoryMovement: {
          movementType: 'INBOUND',
          referenceType: 'GOODS_RECEIPT',
          quantity: convertedItemQuantity,
          beforeQuantity,
          afterQuantity,
        },
      }
    })

    return transaction()
  }
}


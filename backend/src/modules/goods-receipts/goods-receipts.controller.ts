import { Body, Controller, Post } from '@nestjs/common'
import { GoodsReceiptsService } from './goods-receipts.service'

@Controller('admin/goods-receipts')
export class GoodsReceiptsController {
  constructor(private readonly goodsReceiptsService: GoodsReceiptsService) {}

  @Post('items')
  createGoodsReceiptItem(
    @Body()
    body: {
      goodsReceiptId: number
      masterProductId?: number
      manufacturerId?: number | null
      brandId?: number | null
      barcode: string
      packageType?: 'ITEM' | 'BOX' | 'CASE' | 'PALLET'
      receivedQuantity: number
    },
  ) {
    return this.goodsReceiptsService.createGoodsReceiptItem(body)
  }
}


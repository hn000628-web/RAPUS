import { Controller, Get, Query } from '@nestjs/common'
import { BusinessProductsService } from './business-products.service'

@Controller('business/products')
export class BusinessProductsController {
  constructor(private readonly businessProductsService: BusinessProductsService) {}

  @Get('search')
  searchProducts(@Query('keyword') keyword?: string) {
    return this.businessProductsService.searchProducts(keyword ?? '')
  }
}


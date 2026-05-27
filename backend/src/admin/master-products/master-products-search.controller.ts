import { Controller, Get, Query } from '@nestjs/common';
import { MasterProductsService } from './master-products.service';

@Controller('master-products')
export class MasterProductsSearchController {
  constructor(private readonly masterProductsService: MasterProductsService) {}

  @Get('search')
  searchProducts(
    @Query('productCode') productCode?: string,
    @Query('scanCodeValue') scanCodeValue?: string,
    @Query('semanticProductCode') semanticProductCode?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.masterProductsService.searchIntegratedProducts({
      productCode,
      scanCodeValue,
      semanticProductCode,
      keyword,
    });
  }
}

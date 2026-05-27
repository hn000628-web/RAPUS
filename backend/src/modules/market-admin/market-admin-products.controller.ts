import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { MarketAdminProductsService } from './market-admin-products.service';

type MarketAdminProductQuery = {
  channelCode?: string;
  page?: string;
  pageSize?: string;
  keyword?: string;
  category?: string;
};

type ImportMarketProductBody = {
  channelCode?: string;
  productCode?: string;
  purchasePrice?: number | string;
  salePrice?: number | string;
  eventPrice?: number | string | null;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  stockQuantity?: number | string;
  safetyStockQuantity?: number | string;
  isOnSale?: boolean | number | string;
  isDisplayed?: boolean | number | string;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type UpdatePricingBody = {
  channelCode?: string;
  purchasePrice?: number | string;
  salePrice?: number | string;
  eventPrice?: number | string | null;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  isEventActive?: boolean | number | string;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type UpdateStockBody = {
  channelCode?: string;
  stockQuantity?: number | string;
  safetyStockQuantity?: number | string;
  isSoldOut?: boolean | number | string;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type UpdateStatusBody = {
  channelCode?: string;
  isOnSale?: boolean | number | string;
  isDisplayed?: boolean | number | string;
  isSoldOut?: boolean | number | string;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

@Controller('market-admin/products')
export class MarketAdminProductsController {
  constructor(
    private readonly marketAdminProductsService: MarketAdminProductsService,
  ) {}

  @Get('public')
  getPublicProducts(@Query() query: MarketAdminProductQuery) {
    return this.marketAdminProductsService.getPublicProducts(query);
  }

  @Get()
  getMarketProducts(@Query() query: MarketAdminProductQuery) {
    return this.marketAdminProductsService.getMarketProducts(query);
  }

  @Post('import')
  importProduct(@Body() body: ImportMarketProductBody) {
    return this.marketAdminProductsService.importProduct(body);
  }

  @Patch(':id/pricing')
  updatePricing(
    @Param('id') id: string,
    @Body() body: UpdatePricingBody,
  ) {
    return this.marketAdminProductsService.updatePricing(id, body);
  }

  @Patch(':id/stock')
  updateStock(
    @Param('id') id: string,
    @Body() body: UpdateStockBody,
  ) {
    return this.marketAdminProductsService.updateStock(id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusBody,
  ) {
    return this.marketAdminProductsService.updateStatus(id, body);
  }

  @Get(':id/history')
  getHistory(
    @Param('id') id: string,
    @Query() query: MarketAdminProductQuery,
  ) {
    return this.marketAdminProductsService.getHistory(id, query);
  }
}

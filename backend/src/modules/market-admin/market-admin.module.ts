import { Module } from '@nestjs/common';

import { MarketAdminProductsController } from './market-admin-products.controller';
import { MarketAdminProductsService } from './market-admin-products.service';

@Module({
  controllers: [MarketAdminProductsController],
  providers: [MarketAdminProductsService],
  exports: [MarketAdminProductsService],
})
export class MarketAdminModule {}

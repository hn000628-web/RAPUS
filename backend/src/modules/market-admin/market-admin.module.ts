import { Module } from '@nestjs/common';

import { BarcodeParserModule } from '../barcode-parser/barcode-parser.module';
import { MarketAdminBannersController } from './market-admin-banners.controller';
import { MarketAdminBannersService } from './market-admin-banners.service';
import { MarketAdminCsvImportService } from './market-admin-csv-import.service';
import {
  MarketAdminDashboardController,
  MarketAdminProductsController,
} from './market-admin-products.controller';
import { MarketAdminProductsService } from './market-admin-products.service';

@Module({
  imports: [BarcodeParserModule],
  controllers: [
    MarketAdminBannersController,
    MarketAdminDashboardController,
    MarketAdminProductsController,
  ],
  providers: [
    MarketAdminBannersService,
    MarketAdminCsvImportService,
    MarketAdminProductsService,
  ],
  exports: [
    MarketAdminBannersService,
    MarketAdminCsvImportService,
    MarketAdminProductsService,
  ],
})
export class MarketAdminModule {}

import { Module } from '@nestjs/common';

import { BarcodeParserModule } from '../barcode-parser/barcode-parser.module';
import { MarketAdminCsvImportService } from './market-admin-csv-import.service';
import {
  MarketAdminDashboardController,
  MarketAdminProductsController,
} from './market-admin-products.controller';
import { MarketAdminProductsService } from './market-admin-products.service';

@Module({
  imports: [BarcodeParserModule],
  controllers: [MarketAdminDashboardController, MarketAdminProductsController],
  providers: [MarketAdminCsvImportService, MarketAdminProductsService],
  exports: [MarketAdminCsvImportService, MarketAdminProductsService],
})
export class MarketAdminModule {}

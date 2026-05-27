import { Module } from '@nestjs/common';
import { BarcodeParserModule } from '../../modules/barcode-parser/barcode-parser.module';
import { MasterProductsController } from './master-products.controller';
import { MasterProductsSearchController } from './master-products-search.controller';
import { MasterProductsService } from './master-products.service';

@Module({
  imports: [BarcodeParserModule],
  controllers: [MasterProductsController, MasterProductsSearchController],
  providers: [MasterProductsService],
  exports: [MasterProductsService],
})
export class MasterProductsModule {}

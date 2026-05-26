import { Module } from '@nestjs/common';
import { MasterProductsController } from './master-products.controller';
import { MasterProductsService } from './master-products.service';

@Module({
  controllers: [MasterProductsController],
  providers: [MasterProductsService],
  exports: [MasterProductsService],
})
export class MasterProductsModule {}

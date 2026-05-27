import { Module } from '@nestjs/common';
import { MasterProductCategoriesController } from './master-product-categories.controller';
import { MasterProductCategoriesService } from './master-product-categories.service';

@Module({
  controllers: [MasterProductCategoriesController],
  providers: [MasterProductCategoriesService],
  exports: [MasterProductCategoriesService],
})
export class MasterProductCategoriesModule {}

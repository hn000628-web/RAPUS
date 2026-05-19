// FILE : backend/src/modules/business/category/business-category.module.ts
// ROOT : backend/src/modules/business//category/business-category.module.ts
// STATUS : PRODUCTION READY
// ROLE : BUSINESS CATEGORY MODULE
// CHANGE SUMMARY :
// - Service + Controller 통합
// - NestJS Module 정의

import { Module } from '@nestjs/common';
import { BusinessCategoryService } from './business-category.service';
import { BusinessCategoryController } from './business-category.controller';

@Module({
  controllers: [BusinessCategoryController],
  providers: [BusinessCategoryService],
  exports: [BusinessCategoryService],
})
export class BusinessCategoryModule {}
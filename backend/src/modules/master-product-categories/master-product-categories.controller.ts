import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { MasterProductCategoriesService } from './master-product-categories.service';

type MasterProductCategoryBody = {
  categoryCode?: string;
  categoryName?: string;
  parentCategoryId?: number | string | null;
  sortOrder?: number | string | null;
  isActive?: number | string | boolean | null;
  feedExposeType?: string | null;
};

@Controller('master-product-categories')
export class MasterProductCategoriesController {
  constructor(
    private readonly masterProductCategoriesService: MasterProductCategoriesService,
  ) {}

  @Get()
  getAll() {
    return this.masterProductCategoriesService.getAll();
  }

  @Post()
  create(@Body() body: MasterProductCategoryBody) {
    return this.masterProductCategoriesService.create(body);
  }

  @Patch(':categoryCode')
  update(
    @Param('categoryCode') categoryCode: string,
    @Body() body: MasterProductCategoryBody,
  ) {
    return this.masterProductCategoriesService.update(categoryCode, body);
  }
}

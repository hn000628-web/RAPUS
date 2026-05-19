// FILE : backend/src/modules/business/category/business-category.controller.ts
// ROOT : backend/src/modules/business/category/business-category.controller.ts
// STATUS : PRODUCTION READY
// ROLE : BUSINESS CATEGORY CONTROLLER

import { BadRequestException, Controller, Get, Param, Req } from '@nestjs/common'
import { BusinessCategoryService } from './business-category.service'
import type { Request } from 'express'

@Controller('business/profile')
export class BusinessCategoryController {
  constructor(private readonly service: BusinessCategoryService) {}

  @Get(':profileId/categories')
  async getCategories(
    @Param('profileId') profileId: number,
    @Req() req: Request
  ) {
    const channelCode = (req as Request & { user?: { channelCode?: string } }).user?.channelCode

    if (!channelCode) {
      throw new BadRequestException('channelCode missing')
    }

    return this.service.getCategories(profileId, channelCode)
  }
}

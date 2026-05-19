// FILE : backend/src/modules/business/pos/categories/pos-categories.controller.ts
// ROOT : backend/src/modules/business/pos/categories/pos-categories.controller.ts
// STATUS : NEW
// ROLE : BUSINESS POS CATEGORY CONTROLLER
// CHANGE SUMMARY :
// - GET /api/business/pos/categories
// - PUT /api/business/pos/categories

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards
} from '@nestjs/common'

import { JwtAuthGuard } from '../../../auth/jwt.guard'
import { PosCategoriesService } from './pos-categories.service'
import type { SavePosProductCategoriesRequest } from './pos-categories.types'

@Controller('business/pos/categories')
@UseGuards(JwtAuthGuard)
export class PosCategoriesController {

  constructor(
    private readonly service: PosCategoriesService
  ) {}

  @Get()
  async getCategories(@Req() req: any) {
    return this.service.getCategories(req.user)
  }

  @Put()
  async saveCategories(
    @Req() req: any,
    @Body() body: SavePosProductCategoriesRequest
  ) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('INVALID_POS_CATEGORIES_PAYLOAD')
    }

    return this.service.saveCategories(req.user, body)
  }
}

// FILE : backend/src/modules/business/pos/cooking/cooking.controller.ts
// ROOT : backend/src/modules/business/pos/cooking/cooking.controller.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS COOKING RUNTIME CONTROLLER

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common'

import {
  CookingService
} from './cooking.service'
import {
  CookingQueryDto
} from './dto/cooking-query.dto'
import {
  CreateCookingTicketDto
} from './dto/create-cooking-ticket.dto'
import {
  UpdateCookingStatusDto
} from './dto/update-cooking-status.dto'

@Controller('business/pos/cooking')
export class CookingController {
  constructor(
    private readonly cookingService: CookingService
  ) {}

  @Get('tickets')
  getCookingTickets(
    @Query() query: CookingQueryDto
  ) {
    return this.cookingService.getCookingTickets(query)
  }

  @Post('tickets')
  createCookingTicket(
    @Body() body: CreateCookingTicketDto
  ) {
    return this.cookingService.createCookingTicket(body)
  }

  @Patch('tickets/:id/status')
  updateCookingStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCookingStatusDto
  ) {
    return this.cookingService.updateCookingStatus(id, body)
  }
}

// FILE : backend/src/modules/business/pos/orders/pos-orders.controller.ts
// ROOT : backend/src/modules/business/pos/orders/pos-orders.controller.ts
// STATUS : CREATE MODE
// ROLE : POS ORDER CREATE CONTROLLER
// CHANGE SUMMARY :
// - POS 주문 등록 Controller 신규 생성
// - POST /api/business/pos/orders 엔드포인트 추가
// - Controller는 request 수신 후 Service 호출만 수행
// - DB 접근 / 비즈니스 로직 없음

// SECTION 01 : IMPORT

import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Patch,
} from '@nestjs/common'

import {
  CancelPosOrderDto,
  CancelPosOrderResponse,
  CompletePosPaymentDto,
  CompletePosPaymentResponse,
  CreatePosOrderDto,
  CreatePosOrderResponse,
  GetActivePosOrderDto,
  GetActivePosOrderResponse
} from './dto/create-pos-order.dto'
import { PosOrdersService } from './pos-orders.service'

// SECTION 02 : CONTROLLER

@Controller('business/pos/orders')
export class PosOrdersController {
  constructor(
    private readonly posOrdersService: PosOrdersService
  ) {}

  // SECTION 03 : CREATE ORDER

  @Post()
  createOrder(
    @Body() dto: CreatePosOrderDto
  ): CreatePosOrderResponse {
    return this.posOrdersService.createOrder(dto)
  }

  @Patch('cancel')
  cancelOrder(
    @Body() dto: CancelPosOrderDto
  ): CancelPosOrderResponse {
    return this.posOrdersService.cancelOrder(dto)
  }

  @Get('active')
  getActiveOrder(
    @Query() dto: GetActivePosOrderDto
  ): GetActivePosOrderResponse {
    return this.posOrdersService.getActiveOrder(dto)
  }

  @Post('pay')
  completePayment(
    @Body() dto: CompletePosPaymentDto
  ): CompletePosPaymentResponse {
    return this.posOrdersService.completePayment(dto)
  }
}

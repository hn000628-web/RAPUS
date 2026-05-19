// FILE : backend/src/modules/business/pos/order-types/order-types.controller.ts
// ROOT : backend/src/modules/business/pos/order-types/order-types.controller.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS ORDER TYPE SETTINGS CONTROLLER
// CHANGE SUMMARY :
// - POS 주문유형 설정 GET/PATCH Controller 신규 생성
// - Controller는 Request 수신 / Service 호출 / Response 반환만 수행
// - DB 접근 없음
// - profileId + channelCode는 Service에서 검증

// SECTION 01 : IMPORT

import {
  Body,
  Controller,
  Get,
  Patch,
  Query
} from '@nestjs/common'

import {
  PosOrderTypesService,
  UpdatePosOrderTypesRequest
} from './order-types.service'

// SECTION 02 : CONTROLLER

@Controller('business/pos/order-types')
export class PosOrderTypesController {

  constructor(
    private readonly orderTypesService: PosOrderTypesService
  ) {}

  // SECTION 03 : GET ROUTE

  @Get()
  getOrderTypes(
    @Query('profileId') profileId: string,
    @Query('channelCode') channelCode: string
  ) {

    return this.orderTypesService.getOrderTypes(
      profileId,
      channelCode
    )

  }

  // SECTION 04 : PATCH ROUTE

  @Patch()
  updateOrderTypes(
    @Query('profileId') profileId: string,
    @Query('channelCode') channelCode: string,
    @Body() body: UpdatePosOrderTypesRequest
  ) {

    return this.orderTypesService.updateOrderTypes(
      profileId,
      channelCode,
      body
    )

  }

}

// FILE : backend/src/modules/business/pos/order-dashboard/pos-order-dashboard.controller.ts
// ROOT : backend/src/modules/business/pos/order-dashboard/pos-order-dashboard.controller.ts
// STATUS : CREATE MODE
// ROLE : POS ORDER DASHBOARD CONTROLLER

// SECTION 01 : IMPORT

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query
} from '@nestjs/common'

import {
  PosOrderDashboardDetail,
  PosOrderDashboardResponse,
  PosOrderStatusUpdateInput
} from './pos-order-dashboard.types'
import { PosOrderDashboardService } from './pos-order-dashboard.service'

// SECTION 02 : CONTROLLER

@Controller('business/pos/order-dashboard')
export class PosOrderDashboardController {
  constructor(
    private readonly posOrderDashboardService: PosOrderDashboardService
  ) {}

  // SECTION 03 : LIST ROUTE

  @Get()
  getDashboard(
    @Query() query: Record<string, unknown>
  ): PosOrderDashboardResponse {
    return this.posOrderDashboardService.getDashboard(query)
  }

  // SECTION 04 : DETAIL ROUTE

  @Get(':orderId')
  getDetail(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Query('channelCode') channelCode: string
  ): PosOrderDashboardDetail {
    return this.posOrderDashboardService.getDetail(
      orderId,
      channelCode
    )
  }

  // SECTION 05 : STATUS ROUTE

  @Patch(':orderId/status')
  updateStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: PosOrderStatusUpdateInput
  ): PosOrderDashboardDetail {
    return this.posOrderDashboardService.updateStatus(
      orderId,
      body
    )
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'

import { JwtOptionalAuthGuard } from '../../../../auth/jwt-optional.guard'

import {
  CancelCustomerOrderDto,
  CreateCustomerOrderDto,
  CustomerOrderBootstrapQueryDto,
  CustomerOrderDetailQueryDto,
} from './customer-pos-order.dto'
import { CustomerPosOrderService } from './customer-pos-order.service'

@Controller('business/pos/customer/orders')
@UseGuards(JwtOptionalAuthGuard)
export class CustomerPosOrderController {
  constructor(
    private readonly customerPosOrderService: CustomerPosOrderService
  ) {}

  @Get('bootstrap')
  getBootstrap(
    @Query() query: CustomerOrderBootstrapQueryDto
  ) {
    return this.customerPosOrderService.getCustomerOrderBootstrap(query)
  }

  @Post()
  createOrder(
    @Body() dto: CreateCustomerOrderDto,
    @Req() req: any
  ) {
    return this.customerPosOrderService.createCustomerOrder(dto, {
      profileId: req?.user?.id ?? null,
      channelCode: req?.user?.channelCode ?? null,
    })
  }

  @Get(':orderCode')
  getOrderDetail(
    @Param('orderCode') orderCode: string,
    @Query() query: CustomerOrderDetailQueryDto
  ) {
    return this.customerPosOrderService.getCustomerOrderDetail(
      orderCode,
      query
    )
  }

  @Patch(':orderCode/cancel')
  cancelOrder(
    @Param('orderCode') orderCode: string,
    @Body() dto: CancelCustomerOrderDto,
    @Req() req: any
  ) {
    return this.customerPosOrderService.cancelCustomerOrder(orderCode, dto, {
      profileId: req?.user?.id ?? null,
      channelCode: req?.user?.channelCode ?? null,
    })
  }
}

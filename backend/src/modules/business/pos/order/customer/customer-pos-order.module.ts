import { Module } from '@nestjs/common'

import { CustomerPosOrderController } from './customer-pos-order.controller'
import { CustomerPosOrderService } from './customer-pos-order.service'

@Module({
  controllers: [CustomerPosOrderController],
  providers: [CustomerPosOrderService],
  exports: [CustomerPosOrderService],
})
export class CustomerPosOrderModule {}

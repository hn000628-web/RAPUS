import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ProfileOrdersService } from './profile-orders.service'

type AuthRequest = {
  user?: {
    id?: number
    userId?: number
    profileId?: number
    profileType?: 'GENERAL' | 'BUSINESS'
    channelCode?: string
  }
}

@UseGuards(AuthGuard('jwt'))
@Controller('profile/orders')
export class ProfileOrdersController {
  constructor(
    private readonly profileOrdersService: ProfileOrdersService
  ) {}

  @Get('summary')
  getSummary(@Req() req: AuthRequest) {
    return this.profileOrdersService.getMyOrdersSummary(req.user)
  }

  @Get('cart-items')
  getCartItems(@Req() req: AuthRequest) {
    return this.profileOrdersService.getMyCartItems(req.user)
  }

  @Get('orders')
  getOrders(@Req() req: AuthRequest) {
    return this.profileOrdersService.getMyOrders(req.user)
  }

  @Get(':orderId')
  getOrderDetail(
    @Req() req: AuthRequest,
    @Param('orderId', ParseIntPipe) orderId: number
  ) {
    return this.profileOrdersService.getMyOrderDetail(req.user, orderId)
  }
}


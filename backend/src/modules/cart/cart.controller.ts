import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { CartService } from './cart.service'

type AuthRequest = {
  user?: {
    profileId?: number
    channelCode?: string
  }
}

type AddCartItemBody = {
  providerChannelCode: string
  productDbId?: number
  productId?: string
  productCode: string
  sourceType?: 'POS_PRODUCT' | 'MARKET_PRODUCT'
  quantity: number
  orderFlowType: 'IN_STORE' | 'PICKUP' | 'DELIVERY' | 'RESERVATION' | 'SERVICE' | 'ROOM_SERVICE' | 'PARCEL'
  fulfillmentType?: 'IN_STORE' | 'PICKUP' | 'DELIVERY' | 'RESERVATION' | 'SERVICE' | 'ROOM_SERVICE' | 'PARCEL'
  requestMemo?: string
  options?: Array<{
    productOptionId?: number
    productOptionValueId?: number
    optionNameSnapshot?: string
    optionTypeSnapshot?: 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM'
    optionValueNameSnapshot?: string
    priceDeltaSnapshot?: number
    quantity?: number
  }>
}

type UpdateCartItemQuantityBody = {
  quantity: number
}

type UpdateCartItemMemoBody = {
  requestMemo: string | null
}

@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService
  ) {}

  @Post('items')
  addCartItem(
    @Req() req: AuthRequest,
    @Body() body: AddCartItemBody
  ) {
    return this.cartService.addCartItem(req.user, body)
  }

  @Get('items')
  getMyCartItems(
    @Req() req: AuthRequest,
    @Query('cartStatus') cartStatus?: string
  ) {
    return this.cartService.getMyCartItems(req.user, cartStatus)
  }

  @Patch('items/:cartItemId/quantity')
  updateCartItemQuantity(
    @Req() req: AuthRequest,
    @Param('cartItemId') cartItemId: string,
    @Body() body: UpdateCartItemQuantityBody
  ) {
    return this.cartService.updateCartItemQuantity(req.user, cartItemId, body.quantity)
  }

  @Patch('items/:cartItemId/memo')
  updateCartItemMemo(
    @Req() req: AuthRequest,
    @Param('cartItemId') cartItemId: string,
    @Body() body: UpdateCartItemMemoBody
  ) {
    return this.cartService.updateCartItemMemo(req.user, cartItemId, body.requestMemo)
  }

  @Delete('items/:cartItemId')
  deleteCartItem(
    @Req() req: AuthRequest,
    @Param('cartItemId') cartItemId: string
  ) {
    return this.cartService.deleteCartItem(req.user, cartItemId)
  }

  @Delete('items')
  clearCartItems(
    @Req() req: AuthRequest,
    @Query('providerChannelCode') providerChannelCode?: string
  ) {
    return this.cartService.clearCartItems(req.user, providerChannelCode)
  }

  @Get('count')
  getCartCount(
    @Req() req: AuthRequest
  ) {
    return this.cartService.getCartCount(req.user)
  }
}

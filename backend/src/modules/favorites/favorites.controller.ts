import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { FavoritesService } from './favorites.service'

type AuthRequest = {
  user?: {
    profileId?: number
    channelCode?: string
  }
}

type ToggleProfileFavoriteBody = {
  providerChannelCode: string
}

type ToggleProductFavoriteBody = {
  providerChannelCode: string
  productCode: string
}

type TogglePostRecommendationBody = {
  providerChannelCode: string
  postCode: string
}

@UseGuards(AuthGuard('jwt'))
@Controller('favorites')
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService
  ) {}

  @Post('profiles/toggle')
  toggleProfileFavorite(
    @Req() req: AuthRequest,
    @Body() body: ToggleProfileFavoriteBody
  ) {
    return this.favoritesService.toggleProfileFavorite(
      req.user,
      body.providerChannelCode
    )
  }

  @Post('products/toggle')
  toggleProductFavorite(
    @Req() req: AuthRequest,
    @Body() body: ToggleProductFavoriteBody
  ) {
    return this.favoritesService.toggleProductFavorite(
      req.user,
      body
    )
  }

  @Post('posts/recommend/toggle')
  togglePostRecommendation(
    @Req() req: AuthRequest,
    @Body() body: TogglePostRecommendationBody
  ) {
    return this.favoritesService.togglePostRecommendation(
      req.user,
      body
    )
  }

  @Get('profiles/me')
  getMyProfileFavorites(
    @Req() req: AuthRequest,
    @Query('status') status?: string
  ) {
    return this.favoritesService.getMyProfileFavorites(
      req.user,
      status
    )
  }

  @Get('products/me')
  getMyProductFavorites(
    @Req() req: AuthRequest,
    @Query('status') status?: string
  ) {
    return this.favoritesService.getMyProductFavorites(
      req.user,
      status
    )
  }

  @Get('posts/recommend/me')
  getMyPostRecommendations(
    @Req() req: AuthRequest,
    @Query('status') status?: string
  ) {
    return this.favoritesService.getMyPostRecommendations(
      req.user,
      status
    )
  }

  @Get('profiles/status')
  getProfileFavoriteStatus(
    @Req() req: AuthRequest,
    @Query('providerChannelCode') providerChannelCode: string
  ) {
    return this.favoritesService.getProfileFavoriteStatus(
      req.user,
      providerChannelCode
    )
  }

  @Get('products/status')
  getProductFavoriteStatus(
    @Req() req: AuthRequest,
    @Query('providerChannelCode') providerChannelCode: string,
    @Query('productCode') productCode: string
  ) {
    return this.favoritesService.getProductFavoriteStatus(
      req.user,
      {
        providerChannelCode,
        productCode
      }
    )
  }

  @Get('posts/recommend/status')
  getPostRecommendationStatus(
    @Req() req: AuthRequest,
    @Query('providerChannelCode') providerChannelCode: string,
    @Query('postCode') postCode: string
  ) {
    return this.favoritesService.getPostRecommendationStatus(
      req.user,
      {
        providerChannelCode,
        postCode
      }
    )
  }
}


import {
  Body,
  Controller,
  Get,
  Query,
  Put,
  Patch,
  Req,
  UseGuards,
  BadRequestException
} from '@nestjs/common'

import { JwtAuthGuard } from '../../auth/jwt.guard'
import { MenuService } from './menu.service'

// ==================================================
// SECTION 01 : DTO
// ==================================================

type SaveMenuItemDto = {
  menuType: 'INFO' | 'SUMMARY' | 'GENERAL' | 'GALLERY' | 'PRODUCT' | 'EVENT' | 'REVIEW'
  label?: string
  sortOrder?: number
  isEnabled?: boolean
}

type SaveMenusBodyDto = {
  profileId?: number
  channelCode?: string
  menus: SaveMenuItemDto[]
}

// ==================================================
// SECTION 02 : LEGACY CONTROLLER
// ==================================================

@Controller('business/menu')
export class MenuController {
  constructor(
    private readonly service: MenuService
  ){}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMenus(@Req() req: any) {
    return this.service.getMenus(req.user)
  }

  @Get('public')
  @UseGuards()
  async getMenusPublic(
    @Query('channelCode') channelCode?: string
  ) {
    if (!channelCode || String(channelCode).trim() === '') {
      throw new BadRequestException('CHANNEL_CODE_REQUIRED')
    }

    return this.service.getMenusByChannelCode(
      String(channelCode).trim()
    )
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async saveMenusLegacy(
    @Req() req: any,
    @Body() body: { menus: Array<{ postType: SaveMenuItemDto['menuType']; title?: string; sortOrder?: number; isActive?: boolean }> }
  ) {
    if (!body || !Array.isArray(body.menus)) {
      throw new BadRequestException('INVALID_MENUS_PAYLOAD')
    }

    return this.service.saveMenus(
      req.user,
      body.menus.map((menu) => ({
        menuType: menu.postType,
        label: menu.title,
        sortOrder: menu.sortOrder,
        isEnabled: menu.isActive
      }))
    )
  }
}

// ==================================================
// SECTION 03 : MENU CONFIG CONTROLLER
// ==================================================

@Controller('business/menu-config')
export class MenuConfigController {
  constructor(
    private readonly service: MenuService
  ){}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMenuConfig(@Req() req: any) {
    return this.service.getMenus(req.user)
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async patchMenuConfig(
    @Req() req: any,
    @Body() body: SaveMenusBodyDto
  ) {
    if (!body || !Array.isArray(body.menus)) {
      throw new BadRequestException('INVALID_MENUS_PAYLOAD')
    }

    return this.service.saveMenus(req.user, body.menus)
  }
}

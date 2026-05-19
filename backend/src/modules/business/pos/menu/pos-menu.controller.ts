// FILE : backend/src/modules/business/pos/menu/pos-menu.controller.ts
// ROOT : backend/src/modules/business/pos/menu/pos-menu.controller.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS MENU CONTROLLER
// CHANGE SUMMARY :
// - PosMenuController named export 보장
// - /api/business/pos/menu API Controller 구성
// - POS 메뉴 / 상품 목록 조회, 단건 조회, 생성, 수정, 비활성화 엔드포인트 구성
// - Controller는 Service 호출만 수행
// - DB 직접 접근 없음

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common'

import { PosMenuService } from './pos-menu.service'

// SECTION 02 : TYPE
type PosMenuQuery = {
  channelCode?: string
  profileId?: string
}

type PosMenuCreateBody = {
  channelCode?: string
  profileId?: number | string
  categoryId?: number | string | null
  categoryCode?: string | null
  productName?: string
  productDescription?: string | null
  basePrice?: number | string
  price?: number | string
  productKind?: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  saleStatus?: 'ON' | 'OFF'
  isActive?: number | boolean
  isSoldOut?: number | boolean
  isRepresentative?: number | boolean
  showOnTableOrder?: number | boolean
  allowNormalOrder?: number | boolean
  allowReservationOrder?: number | boolean
  allowDineIn?: number | boolean
  allowTakeout?: number | boolean
  allowDelivery?: number | boolean
  menuStatus?: 'ON_SALE' | 'STOPPED'
  sortOrder?: number | string
  thumbnailImageAssetId?: number | string | null
  dailySalesLimit?: number | string | null
  options?: Array<{
    title?: string
    priceText?: string
    enabled?: number | boolean
    optionValueType?: 'BASE' | 'CUSTOM'
    optionName?: string
    optionType?: 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM'
    isRequired?: number | boolean
    isMultiple?: number | boolean
    minSelectCount?: number | string
    maxSelectCount?: number | string
    sortOrder?: number | string
    values?: Array<{
      optionValueName?: string
      priceDelta?: number | string
      isDefault?: number | boolean
      isActive?: number | boolean
      optionValueType?: 'BASE' | 'CUSTOM'
      isVisible?: number | boolean
      sortOrder?: number | string
    }>
  }>
}

type PosMenuUpdateBody = {
  channelCode?: string
  profileId?: number | string
  categoryId?: number | string | null
  categoryCode?: string | null
  productName?: string
  productDescription?: string | null
  basePrice?: number | string
  price?: number | string
  productKind?: 'MAIN_PRODUCT' | 'SUB_PRODUCT'
  saleStatus?: 'ON' | 'OFF'
  isActive?: number | boolean
  isSoldOut?: number | boolean
  isRepresentative?: number | boolean
  showOnTableOrder?: number | boolean
  allowNormalOrder?: number | boolean
  allowReservationOrder?: number | boolean
  allowDineIn?: number | boolean
  allowTakeout?: number | boolean
  allowDelivery?: number | boolean
  menuStatus?: 'ON_SALE' | 'STOPPED'
  sortOrder?: number | string
  thumbnailImageAssetId?: number | string | null
  dailySalesLimit?: number | string | null
  options?: Array<{
    title?: string
    priceText?: string
    enabled?: number | boolean
    optionValueType?: 'BASE' | 'CUSTOM'
    optionName?: string
    optionType?: 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM'
    isRequired?: number | boolean
    isMultiple?: number | boolean
    minSelectCount?: number | string
    maxSelectCount?: number | string
    sortOrder?: number | string
    values?: Array<{
      optionValueName?: string
      priceDelta?: number | string
      isDefault?: number | boolean
      isActive?: number | boolean
      optionValueType?: 'BASE' | 'CUSTOM'
      isVisible?: number | boolean
      sortOrder?: number | string
    }>
  }>
}

type PosMenuDeleteBody = {
  channelCode?: string
  profileId?: number | string
}

// SECTION 03 : CONTROLLER
@Controller('business/pos/menu')
export class PosMenuController {
  constructor(
    private readonly posMenuService: PosMenuService
  ) {}

  // SECTION 04 : READ
  @Get()
  findMenus(
    @Query() query: PosMenuQuery
  ) {
    const result = this.posMenuService.findMenus({
      channelCode: query.channelCode,
      profileId: query.profileId
    })

    return {
      success: true,
      ...result
    }
  }

  @Get(':id')
  findMenuById(
    @Param('id') id: string,
    @Query() query: PosMenuQuery
  ) {
    const result = this.posMenuService.findMenuById(
      id,
      {
        channelCode: query.channelCode,
        profileId: query.profileId
      }
    )

    return {
      success: true,
      ...result
    }
  }

  // SECTION 05 : WRITE
  @Post()
  createMenu(
    @Body() body: PosMenuCreateBody
  ) {
    const result = this.posMenuService.createMenu(body)

    return {
      success: true,
      ...result
    }
  }

  @Patch(':id')
  updateMenu(
    @Param('id') id: string,
    @Body() body: PosMenuUpdateBody
  ) {
    const result = this.posMenuService.updateMenu(
      id,
      body
    )

    return {
      success: true,
      ...result
    }
  }

  @Delete(':id')
  deactivateMenu(
    @Param('id') id: string,
    @Query() query: PosMenuQuery,
    @Body() body: PosMenuDeleteBody
  ) {
    const result = this.posMenuService.deactivateMenu(
      id,
      {
        channelCode: body.channelCode ?? query.channelCode,
        profileId: body.profileId ?? query.profileId
      }
    )

    return {
      success: true,
      ...result
    }
  }
}

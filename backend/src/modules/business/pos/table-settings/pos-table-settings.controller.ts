// FILE : backend/src/modules/business/pos/table-settings/pos-table-settings.controller.ts
// ROOT : backend/src/modules/business/pos/table-settings/pos-table-settings.controller.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS TABLE SETTINGS CONTROLLER
// CHANGE SUMMARY :
// - POS 테이블 설정 전용 Controller 신규 생성
// - /api/business/pos/table-settings API 경로 생성
// - Controller는 요청 수신 후 Service 호출만 수행
// - DB 접근 없음

// SECTION 01 : IMPORT

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common'

import {
  BusinessPosTableSettingsListResponse,
  PosResourceType,
  BusinessPosTableSettingsService,
  BusinessPosTableSettingResponse,
  ConnectBusinessPosTableQrInput,
  CreateBusinessPosTableSettingInput,
  DeleteBusinessPosTableSettingInput,
  DisconnectBusinessPosTableQrInput,
  PosResourceStatus,
  UpdateBusinessPosResourceStatusInput,
  UpdateBusinessPosTableSettingInput,
  UpdateBusinessPosTableSortOrderInput
} from './pos-table-settings.service'

// SECTION 02 : CONTROLLER

@Controller('business/pos/table-settings')
export class BusinessPosTableSettingsController {

  constructor(
    private readonly businessPosTableSettingsService: BusinessPosTableSettingsService
  ) {}

  // SECTION 03 : READ ROUTE

  @Get()
  findAll(
    @Query('profileId', ParseIntPipe) profileId: number,
    @Query('channelCode') channelCode: string,
    @Query('resourceType') resourceType?: PosResourceType | 'ALL',
    @Query('floor') floor?: string,
    @Query('zone') zone?: string
  ): BusinessPosTableSettingsListResponse {

    return this.businessPosTableSettingsService.findAll(
      profileId,
      channelCode,
      resourceType,
      floor,
      zone
    )

  }

  // SECTION 04 : CREATE ROUTE

  @Post()
  create(
    @Body() body: CreateBusinessPosTableSettingInput
  ): BusinessPosTableSettingResponse {

    return this.businessPosTableSettingsService.create(body)

  }

  // SECTION 05 : UPDATE ROUTE

  @Patch(':locationId')
  update(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() body: UpdateBusinessPosTableSettingInput
  ): BusinessPosTableSettingResponse {

    return this.businessPosTableSettingsService.update(
      locationId,
      body
    )

  }

  // SECTION 06 : DELETE ROUTE

  @Delete(':locationId')
  softDelete(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() body: DeleteBusinessPosTableSettingInput
  ): { success: true } {

    return this.businessPosTableSettingsService.softDelete(
      locationId,
      body
    )

  }

  // SECTION 07 : QR ROUTE

  @Patch(':locationId/qr/connect')
  connectQr(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() body: ConnectBusinessPosTableQrInput
  ): BusinessPosTableSettingResponse {

    return this.businessPosTableSettingsService.connectQr(
      locationId,
      body
    )

  }

  @Patch(':locationId/qr/disconnect')
  disconnectQr(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() body: DisconnectBusinessPosTableQrInput
  ): BusinessPosTableSettingResponse {

    return this.businessPosTableSettingsService.disconnectQr(
      locationId,
      body
    )

  }

  // SECTION 08 : SORT ROUTE

  @Patch('sort-order')
  updateSortOrder(
    @Body() body: UpdateBusinessPosTableSortOrderInput
  ): { success: true } {

    return this.businessPosTableSettingsService.updateSortOrder(body)

  }

  // SECTION 09 : RESOURCE STATUS ROUTE

  @Patch(':locationId/status')
  updateResourceStatus(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() body: UpdateBusinessPosResourceStatusInput
  ): {
    success: true
    locationId: number
    resourceStatus: PosResourceStatus
    lastStatusChangedAt: string | null
  } {

    return this.businessPosTableSettingsService.updateResourceStatus(
      locationId,
      body
    )

  }

}

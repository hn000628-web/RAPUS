import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common'

import { CheckInRoomDto } from './dto/check-in-room.dto'
import { CheckOutRoomDto } from './dto/check-out-room.dto'
import { CompleteRoomCleaningDto } from './dto/complete-room-cleaning.dto'
import {
  PosRoomsService,
  GetPosRoomsResponse,
  CurrentRoomCheckInResponse,
  CreateRoomCheckInResponse,
  CheckOutRoomResponse,
  CompleteRoomCleaningResponse
} from './pos-rooms.service'

@Controller('business/pos')
export class PosRoomsController {
  constructor(
    private readonly posRoomsService: PosRoomsService
  ) {}

  @Get('rooms')
  getRooms(
    @Query('profileId', ParseIntPipe) profileId: number,
    @Query('channelCode') channelCode: string
  ): GetPosRoomsResponse {
    return this.posRoomsService.getRooms(profileId, channelCode)
  }

  @Get('rooms/:locationId/check-in/current')
  getCurrentCheckIn(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Query('profileId', ParseIntPipe) profileId: number,
    @Query('channelCode') channelCode: string
  ): CurrentRoomCheckInResponse {
    return this.posRoomsService.getCurrentCheckIn(
      locationId,
      profileId,
      channelCode
    )
  }

  @Post('rooms/:locationId/check-in')
  createCheckIn(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() body: CheckInRoomDto
  ): CreateRoomCheckInResponse {
    return this.posRoomsService.createCheckIn(locationId, body)
  }

  @Patch('rooms/check-ins/:checkInId/check-out')
  checkOut(
    @Param('checkInId', ParseIntPipe) checkInId: number,
    @Body() body: CheckOutRoomDto
  ): CheckOutRoomResponse {
    return this.posRoomsService.checkOut(checkInId, body)
  }

  @Patch('rooms/:locationId/cleaning/complete')
  completeCleaning(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() body: CompleteRoomCleaningDto
  ): CompleteRoomCleaningResponse {
    return this.posRoomsService.completeCleaning(locationId, body)
  }
}

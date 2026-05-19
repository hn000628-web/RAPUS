/* ==================================================
SECTION CODE OUTPUT : CHANNEL CONTROLLER
ROOT : backend/src/modules/channel/channel.controller.ts
STATUS : API ONLY, SERVICE CALL
================================================== */
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ChannelService } from './channel.service';

@Controller('profiles/channel')
export class ChannelController {
  constructor(private readonly service: ChannelService) {}

  @Post()
  async create(@Body() body: { profileId: number; channelName?: string }) {
    if (!body.profileId) throw new BadRequestException('profileId required');
    return this.service.createChannel(body.profileId, body.channelName);
  }
}
// modules/channel/channel.module.ts
import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';

@Module({
  controllers: [ChannelController],
  providers: [ChannelService],
  exports: [ChannelService], // 다른 모듈에서 필요하면 export
})
export class ChannelModule {}
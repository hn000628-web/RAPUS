import { Module } from '@nestjs/common';

import { MarketEventsController } from './market-events.controller';
import { MarketEventsService } from './market-events.service';

@Module({
  controllers: [MarketEventsController],
  providers: [MarketEventsService],
  exports: [MarketEventsService],
})
export class MarketEventsModule {}

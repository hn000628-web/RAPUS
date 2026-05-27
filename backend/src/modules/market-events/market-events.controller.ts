import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { MarketEventsService } from './market-events.service';

type MarketEventQuery = {
  channelCode?: string;
};

type MarketEventBody = {
  channelCode?: string;
  eventCode?: string;
  eventTitle?: string;
  eventDescription?: string | null;
  eventType?: string;
  eventStatus?: string;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  bannerImageAssetId?: number | string | null;
};

type MarketEventProductBody = {
  productCode?: string;
};

@Controller('market-events')
export class MarketEventsController {
  constructor(private readonly marketEventsService: MarketEventsService) {}

  @Get()
  getEvents(@Query() query: MarketEventQuery) {
    return this.marketEventsService.getEvents(query);
  }

  @Post()
  createEvent(@Body() body: MarketEventBody) {
    return this.marketEventsService.createEvent(body);
  }

  @Get(':eventCode')
  getEventDetail(@Param('eventCode') eventCode: string) {
    return this.marketEventsService.getEventDetail(eventCode);
  }

  @Patch(':eventCode')
  updateEvent(
    @Param('eventCode') eventCode: string,
    @Body() body: MarketEventBody,
  ) {
    return this.marketEventsService.updateEvent(eventCode, body);
  }

  @Post(':eventCode/products')
  connectEventProduct(
    @Param('eventCode') eventCode: string,
    @Body() body: MarketEventProductBody,
  ) {
    return this.marketEventsService.connectEventProduct(eventCode, body);
  }

  @Delete(':eventCode/products/:productCode')
  disconnectEventProduct(
    @Param('eventCode') eventCode: string,
    @Param('productCode') productCode: string,
  ) {
    return this.marketEventsService.disconnectEventProduct(
      eventCode,
      productCode,
    );
  }
}

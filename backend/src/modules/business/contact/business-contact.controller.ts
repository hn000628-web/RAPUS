import { Body, Controller, Get, Param, Patch } from '@nestjs/common'
import { BusinessContactService } from './business-contact.service'

type UpdateBusinessContactBody = {
  contactPhone: string | null
}

@Controller('business/contact')
export class BusinessContactController {
  constructor(private readonly businessContactService: BusinessContactService) {}

  @Get(':channelCode')
  getBusinessContactByChannelCode(@Param('channelCode') channelCode: string) {
    return this.businessContactService.getBusinessContactByChannelCode(channelCode)
  }

  @Patch(':channelCode')
  updateBusinessContact(
    @Param('channelCode') channelCode: string,
    @Body() body: UpdateBusinessContactBody
  ) {
    return this.businessContactService.updateBusinessContact(channelCode, body.contactPhone)
  }
}
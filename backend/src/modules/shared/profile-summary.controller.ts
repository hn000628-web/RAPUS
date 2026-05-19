import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common'
import { ProfileSummaryService, ProfileDetailPayload } from './profile-summary.service'

@Controller('profile-summary')
export class ProfileSummaryController {
  constructor(private readonly service: ProfileSummaryService) {}

  // channelCode 기준 단일 귀속 조회
  @Get('channel/:channelCode')
  getByChannelCode(@Param('channelCode') channelCode: string): ProfileDetailPayload {
    return this.service.getProfileByChannelCode(channelCode)
  }

  // profileId 기준 단일 귀속 조회
  @Get('id/:profileId')
  getByProfileId(@Param('profileId', ParseIntPipe) profileId: number): ProfileDetailPayload {
    return this.service.getProfileByProfileId(profileId)
  }

  // profileId + channelCode 기준 단일 귀속 확정 조회
  @Get('detail/:profileId/:channelCode')
  getByProfileIdAndChannelCode(
    @Param('profileId', ParseIntPipe) profileId: number,
    @Param('channelCode') channelCode: string
  ): ProfileDetailPayload {
    return this.service.getProfileByProfileIdAndChannelCode(profileId, channelCode)
  }
}
// FILE : backend/src/modules/business/avatar/profile-avatar.controller.ts
// ROOT : backend/src/modules/business/avatar/profile-avatar.controller.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE AVATAR CONTROLLER
// CHANGE SUMMARY :
// - ProfileAvatarService 신규 계약(profileId + channelCode object payload) 기준으로 controller 호출부 수정
// - avatar 조회 / 연결 / 삭제 모두 channelCode 동시 전달 구조로 정렬
// - controller → service only 구조 유지

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

import { ProfileAvatarService } from './profile-avatar.service'

// SECTION 01 : TYPE

type ConnectProfileAvatarBody = {
  channelCode: string
  imageAssetId: number
}

type DeleteProfileAvatarBody = {
  channelCode: string
}

// SECTION 02 : CONTROLLER

@Controller('business/profile/avatar')
export class ProfileAvatarController {
  constructor(
    private readonly service: ProfileAvatarService
  ) {}

  // SECTION 03 : GET

  @Get(':profileId')
  getProfileAvatar(
    @Param('profileId') profileId: string,
    @Query('channelCode') channelCode: string
  ) {
    return this.service.getProfileAvatar(
      Number(profileId),
      channelCode
    )
  }

  // SECTION 04 : CONNECT

  @Post(':profileId')
  connectProfileAvatar(
    @Param('profileId') profileId: string,
    @Body() body: ConnectProfileAvatarBody
  ) {
    return this.service.connectProfileAvatar({
      profileId: Number(profileId),
      channelCode: body.channelCode,
      imageAssetId: Number(body.imageAssetId)
    })
  }

  // SECTION 05 : DELETE

  @Delete(':profileId')
  deleteProfileAvatar(
    @Param('profileId') profileId: string,
    @Body() body: DeleteProfileAvatarBody
  ) {
    return this.service.deleteProfileAvatar({
      profileId: Number(profileId),
      channelCode: body.channelCode
    })
  }
}
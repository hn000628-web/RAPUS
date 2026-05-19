//////////////////////////////////////////////
// FILE: backend/src/common/utils/channel-profile-util.module.ts
// ROOT: backend/src/common/utils/channel-profile-util.module.ts
// STATUS: PRODUCTION READY
// ROLE: CHANNEL PROFILE UTIL MODULE
//////////////////////////////////////////////

import { Module } from '@nestjs/common'
import { ChannelProfileUtil } from './channel-profile-util'

@Module({
  providers: [ChannelProfileUtil],
  exports: [ChannelProfileUtil]
})
export class ChannelProfileUtilModule {}
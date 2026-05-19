// FILE : backend/src/modules/business/avatar/profile-avatar.module.ts
// ROOT : backend/src/modules/business/avatar/profile-avatar.module.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE AVATAR MODULE
// CHANGE SUMMARY :
// - DatabaseModule import 추가
// - ProfileAvatarController / ProfileAvatarService 등록 유지
// - BusinessMediaModule import 유지

import { Module } from '@nestjs/common'
import { ProfileAvatarController } from './profile-avatar.controller'
import { ProfileAvatarService } from './profile-avatar.service'
import { BusinessMediaModule } from '../media/business-media.module'
import { DatabaseModule } from '../../../config/database.module'

@Module({
  imports: [
    DatabaseModule,           // DatabaseModule 글로벌 provider
    BusinessMediaModule
  ],
  controllers: [ProfileAvatarController],
  providers: [ProfileAvatarService],
  exports: [ProfileAvatarService]
})
export class ProfileAvatarModule {}
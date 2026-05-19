// FILE : backend/src/modules/business/profile-settings/profile-settings.module.ts
// ROOT : backend/src/modules/business/profile-settings/profile-settings.module.ts
// STATUS : NEW FILE
// ROLE : BUSINESS PROFILE SETTINGS MODULE
// CHANGE SUMMARY :
// - profile-settings.controller & profile-settings.service 모듈화
// - settings page 전용 backend API 모듈

import { Module } from '@nestjs/common'
import { ProfileSettingsController } from './profile-settings.controller'
import { ProfileSettingsService } from './profile-settings.service'

@Module({
  controllers: [ProfileSettingsController],
  providers: [ProfileSettingsService]
})
export class ProfileSettingsModule {}
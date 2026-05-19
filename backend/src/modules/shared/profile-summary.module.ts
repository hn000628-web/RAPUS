// FILE: backend/src/modules/shared/profile-summary/profile-summary.module.ts
import { Module } from '@nestjs/common'
import { ProfileSummaryService } from './profile-summary.service'
import { ProfileSummaryController } from './profile-summary.controller'

@Module({
  providers: [ProfileSummaryService],
  controllers: [ProfileSummaryController],
  exports: [ProfileSummaryService]
})
export class ProfileSummaryModule {}
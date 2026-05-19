// FILE : backend/src/modules/business/summary/business-summary.module.ts
// ROOT : backend/src/modules/business/summary/business-summary.module.ts

import { Module } from '@nestjs/common'
import { BusinessSummaryController } from './profile-summary.controller'
import { BusinessSummaryService } from './profile-summary.service'

@Module({
controllers:[BusinessSummaryController],
providers:[BusinessSummaryService]
})

export class BusinessSummaryModule{}

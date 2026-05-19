// FILE : backend/src/modules/business/summary/business-summary.service.ts
// ROOT : backend/src/modules/business/summary/business-summary.service.ts

import {
Injectable,
BadRequestException
} from '@nestjs/common'

import db from '../../../config/database'

import {
BusinessSummaryRepository
} from './profile-summary.repository'

@Injectable()

export class BusinessSummaryService{

async getSummary(profileId:number){

const row =
BusinessSummaryRepository.getSummary(
db,
profileId
)

return{
ok:true,
summary:row?.bio ?? null
}

}

async updateSummary(
profileId:number,
summary:string|null
){

if(summary && summary.length > 300){
throw new BadRequestException('summary max 300')
}

BusinessSummaryRepository.updateSummary(
db,
profileId,
summary?.trim() || null
)

return{
ok:true
}

}

}

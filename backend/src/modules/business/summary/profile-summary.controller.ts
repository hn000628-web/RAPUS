// FILE : backend/src/modules/business/summary/business-summary.controller.ts
// ROOT : backend/src/modules/business/summary/business-summary.controller.ts

import{
Controller,
Get,
Patch,
Body,
UseGuards,
Req,
BadRequestException
}from'@nestjs/common'

import{
BusinessSummaryService
}from'./profile-summary.service'

import{
JwtAuthGuard
}from'../../auth/jwt.guard'

type AuthRequest={
user:{
profileId:number
profileType:'GENERAL'|'BUSINESS'
}
}

@Controller('business/summary')

export class BusinessSummaryController{

constructor(
private readonly service:BusinessSummaryService
){}

/* ==================================================
GET
================================================== */

@UseGuards(JwtAuthGuard)

@Get()

async getSummary(@Req()req:AuthRequest){

const profileId=req.user?.profileId

if(!profileId)
throw new BadRequestException('profile not found')

return this.service.getSummary(profileId)

}

/* ==================================================
UPDATE
================================================== */

@UseGuards(JwtAuthGuard)

@Patch()

async updateSummary(

@Req()req:AuthRequest,

@Body()body:{
summary:string|null
}

){

const profileId=req.user?.profileId

if(!profileId)
throw new BadRequestException('profile not found')

return this.service.updateSummary(
profileId,
body.summary
)

}

}

/* ==================================================
SECTION CODE OUTPUT : ACCOUNT CONTROLLER FINAL FIX
ROLE : ACCOUNT STATUS API
ROOT : backend/src/modules/account/account.controller.ts
STATUS : JWT PROFILE MATCHED
FIX :
profileId 전달 추가
멀티 프로필 구조 대응
================================================== */

import{
Controller,
Get,
UseGuards,
Req
}from'@nestjs/common'

import{AccountService}from'./account.service'

import{JwtAuthGuard}from'../auth/jwt.guard'

@UseGuards(JwtAuthGuard)

@Controller('account')

export class AccountController{

constructor(

private readonly accountService:AccountService

){}

@Get('status')

async getAccountStatus(

@Req()req:any

){

return this.accountService.getAccountStatus(

req.user.userId,
req.user.profileId

)

}

}
/* ==================================================
SECTION CODE OUTPUT : DEV LOGIN CONTROLLER
FILE : backend/src/admin/dev-login.controller.ts
ROLE : ADMIN DEV LOGIN API
================================================== */

import{
Controller,
Post,
Param,
BadRequestException
}from'@nestjs/common'

import{
DevLoginService
}from'./dev-login.service'

/* ==================================================
SECTION CONTROLLER
================================================== */

@Controller('api/admin/dev-login')

export class DevLoginController{

constructor(

private readonly devLoginService:DevLoginService

){}

/* ==================================================
DEV LOGIN
POST /api/admin/dev-login/:profileId
================================================== */

@Post(':profileId')

async devLogin(

@Param('profileId')
profileId:string

){

const id=Number(profileId)

if(Number.isNaN(id))
throw new BadRequestException(
'invalid profileId'
)

return this.devLoginService.devLogin(id)

}

}

/* ==================================================
SECTION END
================================================== */
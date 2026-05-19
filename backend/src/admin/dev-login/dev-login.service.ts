/* ==================================================
SECTION CODE OUTPUT : DEV LOGIN SERVICE
FILE : backend/src/admin/dev-login/dev-login.service.ts
================================================== */

import{
Injectable,
NotFoundException,
BadRequestException
}from'@nestjs/common'

import{
JwtService
}from'@nestjs/jwt'

import db from'../../config/database'

/* ==================================================
SECTION TYPE
================================================== */

type ProfileRow={
id:number
userId:number
profileType:'GENERAL'|'BUSINESS'
}

type UserRow={
id:number
email:string
status:'ACTIVE'|'INACTIVE'
type?:string
}

/* ==================================================
SERVICE
================================================== */

@Injectable()

export class DevLoginService{

constructor(
private readonly jwtService:JwtService
){}

/* ==================================================
DEV LOGIN
================================================== */

async devLogin(profileId:number){

if(!profileId||Number.isNaN(profileId))
throw new BadRequestException(
'invalid profileId'
)

/* PROFILE */

const profile=db.prepare(`
SELECT
id,
userId,
profileType
FROM profiles
WHERE id=?
`).get(profileId) as ProfileRow

if(!profile)
throw new NotFoundException(
'profile not found'
)

/* USER */

const user=db.prepare(`
SELECT
id,
email,
status,
type
FROM users
WHERE id=?
`).get(profile.userId) as UserRow

if(!user)
throw new NotFoundException(
'user not found'
)

if(user.status!=='ACTIVE')
throw new BadRequestException(
'user inactive'
)

/* SESSION */

db.prepare(`
INSERT OR REPLACE INTO profile_sessions(
userId,
profileId
)
VALUES(?,?)
`).run(
profile.userId,
profile.id
)

/* JWT */

const payload={

sub:user.id,

userId:user.id,

profileId:profile.id,

profileType:profile.profileType,

email:user.email,

role:'DEV'

}

const accessToken=
this.jwtService.sign(payload)

/* RETURN */

return{

ok:true,

accessToken,

profile:{
profileId:profile.id,
profileType:profile.profileType
}

}

}

}

/* ==================================================
SECTION END
================================================== */
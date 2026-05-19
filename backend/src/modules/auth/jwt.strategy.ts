/* ==================================================
FILE : backend/src/modules/auth/jwt.strategy.ts
SECTION CODE OUTPUT : JWT STRATEGY FINAL (DB MATCH)
ROLE : JWT VALIDATION → req.user STANDARD BINDING
ROOT : backend/src/modules/auth/jwt.strategy.ts
STATUS : PRODUCTION SAFE FINAL
FIX :

payload channelCode 추가
req.user.id 호환
ProfilesController auth binding fix
SESSION 구조 호환 준비

================================================== */

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import{

Injectable

}from'@nestjs/common'

import{

PassportStrategy

}from'@nestjs/passport'

import{

ExtractJwt,
Strategy

}from'passport-jwt'

/* ==================================================
SECTION 02 : TYPES
JWT RFC STANDARD PAYLOAD

sub = userId (JWT standard subject)

================================================== */

type JwtPayload={

sub:number

profileId:number

profileType:'GENERAL'|'BUSINESS'

channelCode:string

}

/* ==================================================
SECTION 03 : STRATEGY
JWT HEADER → TOKEN EXTRACT
================================================== */

@Injectable()

export class JwtStrategy
extends PassportStrategy(Strategy){

constructor(){

super({

jwtFromRequest:
ExtractJwt.fromAuthHeaderAsBearerToken(),

ignoreExpiration:false,

secretOrKey:
process.env.JWT_SECRET
||'secretKey'

})

}

/* ==================================================
SECTION 04 : VALIDATE

JWT → req.user STANDARD STRUCTURE

STANDARD STRUCTURE :

{

id:number
userId:number
profileId:number
profileType
channelCode

}

================================================== */

async validate(
payload:JwtPayload
){

return{

/* FRONTEND STANDARD */

id:
payload.sub,

/* BACKEND LEGACY SAFE */

userId:
payload.sub,

/* PROFILE */

profileId:
payload.profileId,

profileType:
payload.profileType,

channelCode:
payload.channelCode

}

}

}

/* ==================================================
SECTION END : JWT STRATEGY COMPLETE
================================================== */
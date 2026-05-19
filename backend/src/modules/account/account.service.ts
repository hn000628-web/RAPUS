/* ==================================================
SECTION CODE OUTPUT : ACCOUNT SERVICE FINAL STRUCTURE
ROLE : ACCOUNT AGGREGATION SERVICE
ROOT : backend/src/modules/account/account.service.ts
STATUS : JWT PROFILE MATCH VERSION
FIX :
JWT profileId 기준 조회
랜덤 profile 문제 완전 제거
멀티 프로필 구조 대응
Production 구조
================================================== */

import{
Injectable,
NotFoundException
}from'@nestjs/common'

import db from'../../config/database'

@Injectable()

export class AccountService{

async getAccountStatus(

userId:number,
profileId:number

){

/* ==============================
USER LOAD
============================== */

const user=

db.prepare(`

SELECT
id,
email,
accountType,
status

FROM users

WHERE id=?

`).get(userId)

if(!user)

throw new NotFoundException(
'User not found'
)

/* ==============================
PROFILE LOAD
JWT profileId 기준
============================== */

const profile=

db.prepare(`

SELECT
id,
userId,
profileType,
channelCode,
channelURL,
detailAddress

FROM profiles

WHERE id=?

`).get(profileId)

/* security check */

if(!profile || profile.userId!==userId){

throw new NotFoundException(
'Profile not found'
)

}

/* ==============================
BUSINESS LOAD
============================== */

let business:any=null

if(profile.profileType==="BUSINESS"){

business=

db.prepare(`

SELECT
businessName,
businessNumber,
taxType,
representativeName

FROM business_info

WHERE profileId=?

`).get(profile.id)

}

/* ==============================
RETURN
============================== */

return{

email:user.email,

userId:user.id,

accountType:profile.profileType,

status:user.status,

profile:{

profileId:profile.id,

profileType:profile.profileType,

channelCode:profile.channelCode || "",

channelURL:profile.channelURL || "",

region:profile.detailAddress || ""

},

business:business?{

businessName:business.businessName || "",

businessNumber:business.businessNumber || "",

taxType:business.taxType || "",

representativeName:business.representativeName || "",

verified:true

}:null

}

}

}
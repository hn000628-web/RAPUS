/* ==================================================
SECTION CODE OUTPUT : ACCOUNT TYPE
ROOT : frontend/types/account.ts
STATUS : SHARED TYPE
================================================== */

export type AccountStatus = {

email:string

userId:number

accountType:string

status:string

profile:{

profileId:number

profileType:string

channelCode:string

channelURL:string

region:string

}

business?:{

businessName:string

businessNumber:string

taxType:string

representativeName:string

verified:boolean

} | null

}
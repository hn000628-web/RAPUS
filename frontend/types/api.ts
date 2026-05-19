// FILE: frontend/types/api.ts

/* ==================================================
SECTION 01 : COMMON RESPONSE
================================================== */

export type ApiResponse<T>={
ok:boolean
data?:T
message?:string
}

/* ==================================================
SECTION 02 : PROFILE TYPES
================================================== */

export type ProfileType=

'GENERAL'|
'BUSINESS'

/* ==================================================
SECTION 03 : PROFILE BLOCK
================================================== */

export type ProfileBlock={

id:number

type:'TEXT'|'LINK'

title:string

content?:string|null

url?:string|null

description?:string|null

sortOrder:number

}

/* ==================================================
SECTION 04 : PROFILE DATA
================================================== */

export type ProfileData={

profileId:number

profileType:ProfileType

displayName?:string

bio?:string|null

regionName?:string|null

profileImage?:string|null

heroImages?:string[]

blocks?:ProfileBlock[]

}

/* ==================================================
SECTION 05 : PROFILE RESPONSE
================================================== */

export type ProfileResponse={

ok:boolean

profile:ProfileData

}

/* ==================================================
SECTION 06 : UPDATE DTO
================================================== */

export type ProfileUpdateBlock={

type:'TEXT'|'LINK'

title:string

content?:string|null

url?:string|null

description?:string|null

sortOrder:number

}

export type ProfileUpdateRequest={

displayName:string

bio?:string|null

blocks:ProfileUpdateBlock[]

}

/* ==================================================
SECTION 07 : ACTIVATE PROFILE DTO
================================================== */

export type ActivateProfileRequest={

profileType:ProfileType

}
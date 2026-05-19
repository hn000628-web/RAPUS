// ==================================================
// SECTION CODE OUTPUT : PROFILE DOMAIN API
// ROLE : PROFILE DOMAIN API LAYER
// ROOT : frontend/lib/profileApi.ts
// STATUS : PRODUCTION FINAL
// CONTRACT : BACKEND 100% MATCH
// STRUCTURE : MEDIA STORAGE + PROFILE RELATION
// ==================================================


/* ==================================================
SECTION 01 : IMPORT
================================================== */

import { apiFetch }
from '@/lib/api'

import type { Region }
from '@/types/region'


/* ==================================================
SECTION 02 : TYPES
================================================== */

export type Avatar={

id:number

profileId:number

imageAssetId:number|null

filePath:string|null

fileName?:string

mimeType?:string

fileSize?:number

createdAt?:string

imageUrl?:string|null

thumbUrl?:string|null

}


export type HeroImage={

id:number

imageAssetId?:number|null

imageUrl?:string|null

sortOrder?:number

title?:string|null

description?:string|null

linkUrl?:string|null

}


export type ProfileSession={

deviceId:string

status:string

createdAt:string

lastSeen:string

}


export type ProfileBlock={

id?:number

type:string

title?:string|null

content?:string|null

url?:string|null

description?:string|null

sortOrder:number

}


export type Profile={

profileId:number

userId:number

profileType:
'GENERAL'|
'BUSINESS'

displayName:string|null

bio:string|null

channelCode:string

channelName:string|null

channelURL:string|null

activityRegionId:number|null

feedRegionId:number|null

avatar:Avatar|null

heroImages:HeroImage[]

blocks:ProfileBlock[]

session:ProfileSession|null

regions:Region[]

activityRegion:Region|null

feedRegion:Region|null

primaryRegion:Region|null

}


/* ==================================================
SECTION 03 : RESPONSES
================================================== */

export type ProfileResponse={

ok:boolean

profile:Profile

}


export type UpdateProfileResponse={

ok:boolean

}


/* ==================================================
SECTION 04 : BASE
================================================== */

const PROFILE_BASE='profiles' // ※수정금지 / 수정시 로그인실패※


/* ==================================================
SECTION 05 : GET PROFILE
================================================== */

export async function getMyProfile():

Promise<ProfileResponse>{

return apiFetch<ProfileResponse>(
PROFILE_BASE
)

}

/* ==================================================
SECTION 05-1 : GET GALLERY
PROFILE DOMAIN READ ONLY
================================================== */

export async function getMyGallery(){

return apiFetch(

`${PROFILE_BASE}/gallery`

)

}

/* ==================================================
SECTION 06 : UPDATE PROFILE INFO
================================================== */

export async function updateProfileInfo(

data:{

displayName?:string|null

bio?:string|null

}

):Promise<UpdateProfileResponse>{

return apiFetch<UpdateProfileResponse>(

`${PROFILE_BASE}/info`,

{

method:'PATCH',

body:{

displayName:
data.displayName??null,

bio:
data.bio??null

}

}

)

}


/* ==================================================
SECTION 07 : AVATAR UPLOAD (FINAL SAFE)
MEDIA → STORAGE
PROFILE → RELATION
PATH SAFE
================================================== */

export async function uploadAvatar(

file:File

){

if(!(file instanceof File))
throw new Error('file required')

if(file.size<=0)
throw new Error('invalid file')

/* STEP 1 MEDIA UPLOAD */

const form=

new FormData()

form.append(
'file',
file
)

form.append(
'usageType',
'avatar'
)

const mediaRes:any=

await apiFetch(

'media/upload',

{

method:'POST',

body:form,

isForm:true

}

)

if(!mediaRes?.assetId)

throw new Error(
'avatar upload fail'
)

/* STEP 2 PROFILE RELATION */

return apiFetch(

`${PROFILE_BASE}/avatar`,

{

method:'PUT',

body:{

assetId:
mediaRes.assetId,

filePath:
mediaRes.filePath

}

}

)

}

/* ==================================================
SECTION 08 : DELETE AVATAR
PROFILE RELATION REMOVE
================================================== */

export async function deleteAvatar(){

return apiFetch(

`${PROFILE_BASE}/avatar`,

{

method:'DELETE'

}

)

}


/* ==================================================
SECTION 09 : HERO UPLOAD (FINAL SAFE)
MEDIA STORAGE ONLY
RELATION → BACKEND HERO CONNECT
PATH SAFE
================================================== */

export async function uploadHeroImages(

files:File[]

){

if(!files?.length)

throw new Error(
'files required'
)

const assetIds:number[]=[]

for(const file of files){

if(!(file instanceof File))
continue

if(file.size<=0)
continue

const form=

new FormData()

form.append(
'file',
file
)

form.append(
'usageType',
'hero'
)

const mediaRes:any=

await apiFetch(

'media/upload',

{

method:'POST',

body:form,

isForm:true

}

)

if(!mediaRes?.assetId)

throw new Error(
'hero upload fail'
)

assetIds.push(

mediaRes.assetId

)

}

return assetIds

}

/* ==================================================
SECTION 10 : CHANNEL UPDATE
================================================== */

export async function updateChannel(

data:{
channelName:string|null
channelURL?:string|null
}

){

return apiFetch(

`${PROFILE_BASE}/channel`,

{
method:'PUT',
body:{
channelName:data.channelName??null,
channelURL:data.channelURL??null
}
}

)

}

/* ==================================================
SECTION 11 : BLOCKS UPDATE
================================================== */

export async function updateProfileBlocks(

blocks:{
type:string
title:string
content?:string|null
url?:string|null
description?:string|null
sortOrder:number
}[]

){

return apiFetch(

`${PROFILE_BASE}/blocks`,

{
method:'PUT',
body:{ blocks }
}

)

}

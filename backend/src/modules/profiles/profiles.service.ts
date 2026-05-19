/* ==================================================
FILE : backend/src/modules/profiles/profiles.service.ts
================================================== */


import {

Injectable,
NotFoundException,
ForbiddenException,
BadRequestException

} from '@nestjs/common'

import { MediaService } from '../media/media.service'
import db from '../../config/database'

@Injectable()

export class ProfilesService{

/* ==================================================
SECTION 00-1 : DEPENDENCY INJECTION
================================================== */

constructor(
  private readonly mediaService: MediaService
){}   

/* ==================================================
SECTION 01 : SECURITY CORE (HARDENING)
================================================== */

private assertProfileOwnership(

userId:number,
profileId:number

){

if(!userId||!profileId)
throw new BadRequestException(
'auth invalid'
)

const row=db.prepare(`

SELECT id

FROM profiles

WHERE id=?
AND userId=?

`).get(

profileId,
userId

)

if(!row)

throw new ForbiddenException(
'Profile access denied'
)

}

private getChannelCode(

profileId:number

){

if(!profileId)
throw new BadRequestException(
'profileId missing'
)

const row=db.prepare(`

SELECT channelCode

FROM profiles

WHERE id=?

`).get(profileId) as any

if(!row||!row.channelCode)

throw new NotFoundException(
'Profile not found'
)

return row.channelCode

}

/* ==================================================
SECTION 02 : CORE PROFILE READ (HARDENING)
================================================== */

getProfile(profileId:number){

if(!profileId)
throw new BadRequestException(
'profileId missing'
)

return db.prepare(`

SELECT

id,
userId,
profileType,
displayName,
bio,
channelCode,
channelName,
channelURL,
contactPhone,
activityRegionId,
feedRegionId,
createdAt,
updatedAt

FROM profiles

WHERE id=?

`).get(profileId)

}

getRegion(regionId:number){

if(!regionId)
return null

return db.prepare(`

SELECT

id,
name,
fullName,
depth,
latitude,
longitude

FROM regions

WHERE id=?

`).get(regionId)

}

getChannel(profileId:number){

if(!profileId)
return null

return db.prepare(`

SELECT

channelCode,
channelName,
channelURL

FROM profiles

WHERE id=?

`).get(profileId)

}

/* ==================================================
SECTION 03 : MEDIA READ (TS ZERO ERROR FINAL)
RULE :
READ ONLY
TS SAFE
NULL SAFE
URL SAFE
FRONT CONTRACT MATCH
================================================== */

getAvatar(
profileId:number
){

if(!profileId)
return null

const avatar=db.prepare(`

SELECT

pa.id,
pa.profileId,
pa.imageAssetId,
pa.filePath,
pa.createdAt,

ia.fileName,
ia.filePath as imagePath,
ia.mimeType,
ia.fileSize

FROM profile_avatars pa

LEFT JOIN image_assets ia
ON ia.id=pa.imageAssetId

WHERE pa.profileId=?
AND pa.isActive=1

ORDER BY pa.id DESC

LIMIT 1

`).get(profileId) as any

if(!avatar)
return null

const baseUrl:string=

process.env.API_URL ||
'http://localhost:4000'

const imageUrl:string|null=

avatar.imagePath
? baseUrl+'/media/'+avatar.imagePath
: null

return{

id:
avatar.id ?? null,

profileId:
avatar.profileId ?? null,

imageAssetId:
avatar.imageAssetId ?? null,

filePath:
avatar.filePath ?? null,

fileName:
avatar.fileName ?? null,

mimeType:
avatar.mimeType ?? null,

fileSize:
avatar.fileSize ?? null,

createdAt:
avatar.createdAt ?? null,

imageUrl:
imageUrl

}

}


/* ==================================================
HERO IMAGES FINAL SAFE
================================================== */

getHeroImages(
profileId:number
){

if(!profileId)
return[]

const baseUrl:string=

process.env.API_URL ||
'http://localhost:4000'

type HeroRow={

id:number

profileId:number

imageAssetId:number|null

sortOrder:number|null

title:string|null

description:string|null

linkUrl:string|null

externalUrl:string|null

imagePath:string|null

}

const rows=db.prepare(`

SELECT

h.id,
h.profileId,
h.imageAssetId,
h.sortOrder,
h.title,
h.description,
h.linkUrl,
h.externalUrl,

ia.filePath as imagePath

FROM profile_hero_images h

LEFT JOIN image_assets ia
ON ia.id=h.imageAssetId

WHERE h.profileId=?
AND h.isActive=1

ORDER BY h.sortOrder ASC

`).all(profileId) as HeroRow[]

if(!Array.isArray(rows))
return[]

return rows.map((row:HeroRow)=>{

let imageUrl:string|null=null

/* asset image */

if(
row.imageAssetId &&
row.imagePath
){

imageUrl=

baseUrl+
'/media/'+
row.imagePath

}

/* external fallback */

else if(
row.externalUrl
){

imageUrl=
row.externalUrl

}

return{

id:
row.id ?? null,

imageAssetId:
row.imageAssetId ?? null,

imageUrl:
imageUrl,

sortOrder:
row.sortOrder ?? 0,

title:
row.title ?? null,

description:
row.description ?? null,

linkUrl:
row.linkUrl ?? null

}

})

}


/* ==================================================
IMAGE ASSET LOOKUP SAFE
================================================== */

getImageAsset(
assetId:number
){

if(!assetId)
return null

return db.prepare(`

SELECT

id,
fileName,
filePath,
mimeType,
fileSize,
createdAt

FROM image_assets

WHERE id=?

`).get(assetId)

}

/* ==================================================
SECTION 04 : AVATAR RELATION ONLY (DB SCHEMA MATCH FINAL)
RULE :
RELATION ONLY
CHANNEL CONSISTENCY
FILEPATH REQUIRED
MEDIA ASSET LINK SAFE
ORPHAN SAFE
PRODUCTION SAFE
================================================== */

async connectAvatar(

userId:number,
profileId:number,
assetId:number

){

this.assertProfileOwnership(

userId,
profileId

)

if(!assetId)

throw new BadRequestException(
'assetId required'
)

/* channelCode 확보 */

const channelCode=
this.getChannelCode(
profileId
)

/* asset 조회 */

const asset=db.prepare(`

SELECT

id,
filePath

FROM image_assets

WHERE id=?

`).get(assetId) as any

if(!asset)

throw new NotFoundException(
'image asset not found'
)

if(!asset.filePath)

throw new BadRequestException(
'asset filepath missing'
)

db.exec('BEGIN')

try{

/* 기존 avatar inactive */

db.prepare(`

UPDATE profile_avatars

SET isActive=0

WHERE profileId=?

`).run(profileId)

/* 새 avatar relation insert */

db.prepare(`

INSERT INTO profile_avatars(

profileId,
channelCode,
imageAssetId,
filePath,
isActive,
createdAt

)

VALUES(

?,
?,
?,
?,
1,
CURRENT_TIMESTAMP

)

`).run(

profileId,
channelCode,
assetId,
asset.filePath

)

/* asset active 처리 */

db.prepare(`

UPDATE image_assets

SET isActive=1

WHERE id=?

`).run(assetId)

db.exec('COMMIT')

}catch(error){

db.exec('ROLLBACK')

console.error(

'[AVATAR CONNECT FAIL]',
error

)

throw new BadRequestException(
'avatar relation failed'
)

}

return{

ok:true,
imageAssetId:assetId

}

}

/* ==================================================
SECTION 04-1 : HERO IMAGE RELATION FINAL
REPLACE LIST
ORDER SAFE
ORPHAN SAFE
================================================== */

async connectHeroImages(

userId:number,
profileId:number,
assetIds:number[]

){

this.assertProfileOwnership(
userId,
profileId
)

if(!Array.isArray(assetIds))

throw new BadRequestException(
'assetIds required'
)

/* sanitize */

const cleanIds=

assetIds

.map(id=>Number(id))

.filter(id=>

Number.isInteger(id)&&
id>0

)

/* unique */

const uniqueIds=

[...new Set(cleanIds)]

/* max 5 */

if(uniqueIds.length>5)

throw new BadRequestException(
'hero max 5'
)

try{

db.exec('BEGIN')

/* 기존 hero */

const old=db.prepare(`

SELECT imageAssetId

FROM profile_hero_images

WHERE profileId=?
AND isActive=1

`).all(profileId) as any[]

/* 기존 inactive */

db.prepare(`

UPDATE profile_hero_images

SET isActive=0,
updatedAt=CURRENT_TIMESTAMP

WHERE profileId=?

`).run(profileId)

/* insert safe */

let order=0

for(const assetId of uniqueIds){

/* 존재 확인 */

const exists=db.prepare(`

SELECT id
FROM image_assets
WHERE id=?

`).get(assetId)

if(!exists)
continue

db.prepare(`

INSERT INTO profile_hero_images(

profileId,
imageAssetId,
sortOrder,
isActive,
createdAt,
updatedAt

)

VALUES(

?,
?,
?,
1,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP

)

`).run(

profileId,
assetId,
order++

)

}

/* active 처리 */

if(uniqueIds.length){

db.prepare(`

UPDATE image_assets

SET isActive=1

WHERE id IN (

${uniqueIds.map(()=>'?').join(',')}

)

`).run(...uniqueIds)

}

/* removed */

const removed=

old
.map(o=>o.imageAssetId)
.filter(id=>

!uniqueIds.includes(id)

)

if(removed.length){

db.prepare(`

UPDATE image_assets

SET isActive=0

WHERE id IN (

${removed.map(()=>'?').join(',')}

)

`).run(...removed)

}

db.exec('COMMIT')

return{

ok:true,
count:uniqueIds.length

}

}catch(error){

db.exec('ROLLBACK')

console.error(
'[HERO CONNECT FAIL]',
error
)

throw new BadRequestException(
'hero update failed'
)

}
}

/* ==================================================
SECTION 04-2 : DELETE AVATAR (PROFILE DOMAIN CLEAN)
PROFILE DOMAIN DOES NOT DELETE MEDIA
MEDIA DOMAIN ONLY RESPONSIBLE
================================================== */

async deleteAvatar(

userId:number,
profileId:number

){

this.assertProfileOwnership(

userId,
profileId

)

const avatar=db.prepare(`

SELECT imageAssetId

FROM profile_avatars

WHERE profileId=?
AND isActive=1

ORDER BY id DESC
LIMIT 1

`).get(profileId) as any

if(!avatar)
return{

ok:true,
message:'no avatar'

}

// profile 연결만 비활성화

db.prepare(`

UPDATE profile_avatars

SET isActive=0

WHERE profileId=?

`).run(profileId)

// 실제 삭제는 Media Domain 담당

return{

ok:true,
message:'avatar unlink complete'

}

}

/* ==================================================
SECTION 04-3 : GALLERY RELATION FINAL
RULE :

MEDIA STORAGE ONLY → MEDIA DOMAIN
PROFILE ONLY RELATION
DUPLICATE ALLOWED
ORPHAN SAFE
TRANSACTION SAFE
POSTGRES / SQLITE SAFE
PRODUCTION SAFE
================================================== */

async connectGalleryImages(

userId:number,
profileId:number,
assetIds:number[]

){

this.assertProfileOwnership(
userId,
profileId
)

if(!Array.isArray(assetIds))
throw new BadRequestException(
'assetIds required'
)

/* sanitize */

const cleanIds=
assetIds
.map(id=>Number(id))
.filter(id=>
Number.isInteger(id)&&
id>0
)

/* unique input (요청 중복 제거만) */

const uniqueIds=
[...new Set(cleanIds)]

if(!uniqueIds.length)
throw new BadRequestException(
'assetIds empty'
)

/* channel */

const channelCode=
this.getChannelCode(
profileId
)

try{

db.exec('BEGIN')

let inserted=0

/* 🔥 현재 max sortOrder 조회 */

const maxRow=db.prepare(`

SELECT MAX(sortOrder) as max

FROM profile_gallery_images

WHERE profileId=?

`).get(profileId) as any

let nextOrder=(maxRow?.max ?? -1)+1

for(const assetId of uniqueIds){

/* asset 확인 */

const asset=db.prepare(`

SELECT
id,
filePath

FROM image_assets

WHERE id=?

`).get(assetId) as any

if(!asset)
continue

/* ==================================================
🔥 duplicate check 제거됨
같은 imageAssetId 여러 번 사용 허용
================================================== */

/* relation insert */

db.prepare(`

INSERT INTO profile_gallery_images(

profileId,
channelCode,
imageAssetId,
filePath,
sortOrder,
isActive,
createdAt

)

VALUES(

?,
?,
?,
?,
?,
1,
CURRENT_TIMESTAMP

)

`).run(

profileId,
channelCode,
assetId,
asset.filePath,
nextOrder++

)

inserted++

/* asset active */

db.prepare(`

UPDATE image_assets

SET isActive=1

WHERE id=?

`).run(assetId)

}

db.exec('COMMIT')

return{
ok:true,
count:inserted
}

}catch(error){

db.exec('ROLLBACK')

console.error(
'[GALLERY CONNECT FAIL]',
error
)

throw new BadRequestException(
'gallery connect fail'
)

}

}

/* ==================================================
SECTION 04-4 : GALLERY READ FINAL

READ ONLY

TS SAFE

NULL SAFE

URL SAFE

FRONT CONTRACT SAFE

POSTGRES / SQLITE SAFE

PRODUCTION SAFE
================================================== */

getGalleryImages(

profileId:number

){

if(!profileId)
return[]

const baseUrl:string=

process.env.API_URL ||
'http://localhost:4000'

const rows=db.prepare(`

SELECT

g.id,
g.profileId,
g.imageAssetId,
g.filePath,
g.sortOrder,
g.createdAt,

ia.fileName,
ia.mimeType,
ia.fileSize,
ia.filePath as imagePath

FROM profile_gallery_images g

LEFT JOIN image_assets ia

ON ia.id=g.imageAssetId

WHERE g.profileId=?
AND g.isActive=1

ORDER BY g.id DESC

`).all(profileId) as any[]

if(!Array.isArray(rows))
return[]

return rows.map(row=>{

let imageUrl:string|null=null

if(row.imagePath){

imageUrl=

baseUrl+
'/media/'+
row.imagePath

}

return{

id:
row.id ?? null,

profileId:
row.profileId ?? null,

imageAssetId:
row.imageAssetId ?? null,

filePath:
row.filePath ?? null,

fileName:
row.fileName ?? null,

mimeType:
row.mimeType ?? null,

fileSize:
row.fileSize ?? null,

sortOrder:
row.sortOrder ?? 0,

createdAt:
row.createdAt ?? null,

imageUrl:
imageUrl

}

})

}

/* ==================================================
SECTION 05 : PROFILE WRITE
================================================== */

async updateProfileInfo(

userId:number,
profileId:number,
displayName?:string,
bio?:string

){

this.assertProfileOwnership(
userId,
profileId
)

db.prepare(`

UPDATE profiles

SET

displayName=
COALESCE(?,displayName),

bio=
COALESCE(?,bio),

updatedAt=
CURRENT_TIMESTAMP

WHERE id=?

`).run(

displayName||null,
bio||null,
profileId

)

return{

ok:true

}

}

/* ==================================================
SECTION 06 : CHANNEL / REGION
================================================== */

getChannelRegions(channelCode:string){

if(!channelCode)
return[]

const rows=db.prepare(`

SELECT

r.id,
r.name,
r.fullName,
r.depth,
crs.isPrimary

FROM channel_region_settings crs

LEFT JOIN regions r

ON r.id=crs.regionId

WHERE crs.channelCode=?

`).all(channelCode)

return Array.isArray(rows)
? rows
: []

}

/* ==================================================
SECTION 06-1 : CHANNEL UPDATE (FRONT UNIFIED API)
================================================== */

async updateChannel(

userId:number,
profileId:number,
channelCode:string,
channelName:string|null,
channelURL:string|null

){

this.assertProfileOwnership(
userId,
profileId
)

const currentProfile = db.prepare(`
SELECT
id,
profileType,
channelCode,
channelName,
channelURL
FROM profiles
WHERE id=?
AND channelCode=?
AND profileType='GENERAL'
LIMIT 1
`).get(profileId, channelCode) as {
id:number
profileType:'GENERAL'
channelCode:string
channelName:string|null
channelURL:string|null
}|undefined

if(!currentProfile)
throw new ForbiddenException(
'Profile access denied'
)

const normalizedChannelName =
typeof channelName==='string'
? channelName.trim()
: ''

const nextChannelName =
normalizedChannelName.length>0
? normalizedChannelName
: null

const nextChannelURL =
`xxx.com/@${currentProfile.channelCode}`

/* UPDATE */

db.prepare(`

UPDATE profiles

SET

channelName=?,
channelURL=?,

updatedAt=
CURRENT_TIMESTAMP

WHERE id=?
AND channelCode=?
AND profileType='GENERAL'

`).run(

nextChannelName,
nextChannelURL,
profileId,
currentProfile.channelCode

)

return{

ok:true,
channelCode:currentProfile.channelCode,
channelName:nextChannelName,
channelURL:nextChannelURL

}

}

/* ==================================================
SECTION 07 : SESSION (HARDENING)
DB SCHEMA MATCH FIX
================================================== */

getActiveSession(profileId:number){

if(!profileId)
return null

return db.prepare(`

SELECT

deviceId,
status,
createdAt,
lastSeen

FROM profile_sessions

WHERE profileId=?
AND status='ACTIVE'

LIMIT 1

`).get(profileId)

}

/* ==================================================
SECTION 08 : BLOCKS (HARDENING)
================================================== */

getBlocks(profileId:number){

if(!profileId)
return[]

const rows=db.prepare(`

SELECT

id,
type,
title,
content,
url,
description,
sortOrder

FROM profile_blocks

WHERE profileId=?
AND isActive=1

ORDER BY sortOrder

`).all(profileId)

return Array.isArray(rows)
? rows
: []

}

/* ==================================================
SECTION 08-1 : BLOCKS WRITE (UPSERT SLOT FIX FINAL)
RULE :
SLOT BASED
NO DELETE
NO FULL RESET
UPSERT ONLY
SQLITE / POSTGRES SAFE
================================================== */

async updateBlocks(

userId:number,
profileId:number,
blocks:any[]

){

this.assertProfileOwnership(
userId,
profileId
)

if(!Array.isArray(blocks))
throw new BadRequestException(
'blocks required'
)

/* sanitize */

const clean = blocks.map((b:any,i:number)=>({

type: b.type === 'LINK' ? 'LINK' : 'TEXT',

title: b.title || '',

content: b.content ?? null,

url: b.url ?? null,

description: b.description ?? null,

sortOrder: i

}))

try{

db.exec('BEGIN')

/* 🔥 UPSERT 준비 */

const stmt = db.prepare(`

INSERT INTO profile_blocks(

profileId,
type,
title,
content,
url,
description,
sortOrder,
isActive,
createdAt,
updatedAt

)

VALUES(

?,
?,
?,
?,
?,
?,
?,
1,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP

)

ON CONFLICT(profileId, sortOrder)

DO UPDATE SET

type=excluded.type,
title=excluded.title,
content=excluded.content,
url=excluded.url,
description=excluded.description,
isActive=1,
updatedAt=CURRENT_TIMESTAMP

`)

/* 🔥 실행 */

for(const b of clean){

stmt.run(

profileId,
b.type,
b.title,
b.content,
b.url,
b.description,
b.sortOrder

)

}

/* 🔥 남은 슬롯 비활성화 */

db.prepare(`

UPDATE profile_blocks
SET isActive=0,
updatedAt=CURRENT_TIMESTAMP
WHERE profileId=?
AND sortOrder NOT IN (

${clean.map(()=>'?').join(',')}

)

`).run(

profileId,
...clean.map(b=>b.sortOrder)

)

db.exec('COMMIT')

return{
ok:true,
count:clean.length
}

}catch(e){

db.exec('ROLLBACK')

console.error('[BLOCK UPDATE FAIL]',e)

throw new BadRequestException(
'blocks update failed'
)

}

}

/* ==================================================
SECTION 09 : AGGREGATE (READ ONLY SAFE VERSION)
RULE :
READ METHOD NEVER MODIFY DB
REGION OPTIONAL (NULL ALLOWED)
================================================== */

async getMyProfile(

userId:number,
profileId:number

){

if(!userId||!profileId)
throw new BadRequestException(
'auth invalid'
)

this.assertProfileOwnership(
userId,
profileId
)

const profile=
this.getProfile(profileId)

if(!profile)

throw new NotFoundException(
'Profile not found'
)

/* SAFE LOAD */

let avatar:any=null
let heroes:any[]=[]
let blocks:any[]=[]
let session:any=null
let regions:any[]=[]
let activityRegion:any=null
let feedRegion:any=null

/* avatar */

try{

avatar=
this.getAvatar(profileId)

}catch{}

/* hero */

try{

heroes=
this.getHeroImages(profileId)

}catch{}

/* blocks */

try{

blocks=
this.getBlocks(profileId)

}catch{}

/* session */

try{

session=
this.getActiveSession(profileId)

}catch{}

/* regions */

try{

regions=
this.getChannelRegions(
profile.channelCode
)

}catch{}

/* activity region */

try{

if(profile.activityRegionId){

activityRegion=
this.getRegion(
profile.activityRegionId
)

}

}catch{}

/* feed region */

try{

if(profile.feedRegionId){

feedRegion=
this.getRegion(
profile.feedRegionId
)

}

}catch{}

/* FINAL */

return this.buildProfileResponse(

profile,

avatar,

heroes||[],

blocks||[],

session,

regions||[],

activityRegion,

feedRegion

)

}

/* ==================================================
SECTION 10 : RESPONSE BUILDER (CRASH SAFE)
================================================== */

buildProfileResponse(

profile:any,
avatar:any,
heroes:any,
blocks:any,
session:any,
regions:any,
activityRegion:any,
feedRegion:any

){

const safeHeroes=

Array.isArray(heroes)
? heroes
: []

const safeBlocks=

Array.isArray(blocks)
? blocks
: []

const safeRegions=

Array.isArray(regions)
? regions
: []

return{

ok:true,

profile:{

profileId:
profile?.id ?? null,

userId:
profile?.userId ?? null,

profileType:
profile?.profileType ?? null,

displayName:
profile?.displayName ?? null,

bio:
profile?.bio ?? null,

channelCode:
profile?.channelCode ?? null,

channelName:
profile?.channelName ?? null,

channelURL:
profile?.channelURL ?? null,

activityRegionId:
profile?.activityRegionId ?? null,

feedRegionId:
profile?.feedRegionId ?? null,

avatar:
avatar ?? null,

heroImages:
safeHeroes,

blocks:
safeBlocks,

session:
session ?? null,

regions:
safeRegions,

activityRegion:
activityRegion ?? null,

feedRegion:
feedRegion ?? null,

primaryRegion:

safeRegions.find(
(r:any)=>r?.isPrimary
)||null

}

}

}

/* ==================================================
SECTION 11 : INTERNAL HELPERS
================================================== */

deactivateAvatar(
profileId:number
){

if(!profileId)
return

db.prepare(`

UPDATE profile_avatars

SET isActive=0

WHERE profileId=?

`).run(profileId)

}

}

// FILE : backend/src/admin/media/admin-media.service.ts
// ROOT : backend/src/admin/media/admin-media.service.ts
// STATUS : ADMIN MEDIA STORAGE MAINTENANCE FINAL
// ROLE : ORPHAN MEDIA CLEAN SERVICE


// ==================================================
// SECTION 01 : IMPORT
// ==================================================

import {

Injectable

}from '@nestjs/common'

import db from '../../config/database'

import * as fs from 'fs'
import * as path from 'path'


// ==================================================
// SECTION 02 : CONSTANT
// ==================================================

const UPLOAD_ROOT=

path.resolve(

__dirname,
'../../../uploads'

)


// ==================================================
// SECTION 03 : TYPE
// ==================================================

type OrphanAsset={

id:number
channelCode:string
usageType:string
fileName:string
filePath:string
fileSize:number
createdAt:string

}


// ==================================================
// SECTION 04 : SERVICE
// ==================================================

@Injectable()

export class AdminMediaService{


// ==================================================
// SECTION 05 : GET ORPHAN MEDIA
// (ACTIVE FK 기준으로 수정)
// ==================================================

async getOrphanAssets():
Promise<OrphanAsset[]>
{

try{

const rows=db.prepare(`

SELECT

ia.id,
ia.channelCode,
ia.usageType,
ia.fileName,
ia.filePath,
ia.fileSize,
ia.createdAt

FROM image_assets ia

WHERE

NOT EXISTS(
SELECT 1
FROM profile_avatars
WHERE imageAssetId=ia.id
AND isActive=1
)

AND NOT EXISTS(
SELECT 1
FROM profile_hero_images
WHERE imageAssetId=ia.id
AND isActive=1
)

AND NOT EXISTS(
SELECT 1
FROM post_images
WHERE imageAssetId=ia.id
)

ORDER BY ia.createdAt DESC

`).all()

return rows as OrphanAsset[]

}catch(error){

console.error(
'[ADMIN ORPHAN QUERY ERROR]',
error
)

throw error

}

}


// ==================================================
// SECTION 06 : DELETE SINGLE ORPHAN
// FK SAFE DELETE
// ==================================================

async deleteOrphan(
assetId:number
){

try{

/* ACTIVE CHECK */

const ref=db.prepare(`

SELECT

(
SELECT COUNT(*)
FROM profile_avatars
WHERE imageAssetId=?
AND isActive=1
)

+

(
SELECT COUNT(*)
FROM profile_hero_images
WHERE imageAssetId=?
AND isActive=1
)

+

(
SELECT COUNT(*)
FROM post_images
WHERE imageAssetId=?
)

as refCount

`).get(
assetId,
assetId,
assetId
) as any


if(ref.refCount>0){

return{

success:false,
reason:'ACTIVE_REFERENCE_EXISTS'

}

}


/* GET FILE */

const asset=db.prepare(`

SELECT filePath

FROM image_assets

WHERE id=?

`).get(assetId) as any

if(!asset)
return


const fullPath=

path.join(
UPLOAD_ROOT,
asset.filePath
)


/* TRANSACTION */

db.exec('BEGIN')

try{

/* REMOVE FK ROWS */

db.prepare(`

DELETE FROM profile_avatars
WHERE imageAssetId=?

`).run(assetId)


db.prepare(`

DELETE FROM profile_hero_images
WHERE imageAssetId=?

`).run(assetId)


db.prepare(`

DELETE FROM post_images
WHERE imageAssetId=?

`).run(assetId)


/* DELETE ASSET */

db.prepare(`

DELETE FROM image_assets
WHERE id=?

`).run(assetId)

db.exec('COMMIT')

}catch(dbError){

db.exec('ROLLBACK')

throw dbError

}


/* FILE DELETE */

try{

if(

asset.filePath &&
fs.existsSync(fullPath)

){

fs.unlinkSync(fullPath)

}

}catch(fileError){

console.error(

'[ADMIN FILE DELETE ERROR]',
fileError

)

}


return{

success:true

}

}catch(error){

console.error(

'[ADMIN DELETE ORPHAN ERROR]',
{
assetId,
error
}

)

throw error

}

}

// ==================================================
// SECTION 07 : CLEAR ALL ORPHANS
// ==================================================

async clearOrphans(){

try{

const assets=db.prepare(`

SELECT ia.id

FROM image_assets ia

WHERE

NOT EXISTS(
SELECT 1 FROM profile_avatars
WHERE imageAssetId=ia.id
AND isActive=1
)

AND NOT EXISTS(
SELECT 1 FROM profile_hero_images
WHERE imageAssetId=ia.id
AND isActive=1
)

AND NOT EXISTS(
SELECT 1 FROM post_images
WHERE imageAssetId=ia.id
)

`).all() as any[]

let deleted=0

for(const asset of assets){

try{

const result=
await this.deleteOrphan(asset.id)

if(result?.success)
deleted++

}catch(error){

console.error(
'[ADMIN ORPHAN CLEAN FAIL]',
asset.id
)

}

}

return{

success:true,
deletedCount:deleted

}

}catch(error){

console.error(
'[ADMIN CLEAR ORPHAN ERROR]',
error
)

throw error

}

}


// ==================================================
// SECTION 08 : ORPHAN SUMMARY
// ==================================================

async getOrphanSummary(){

try{

const row=db.prepare(`

SELECT

COUNT(*) as totalFiles,

COALESCE(
SUM(fileSize),
0
) as totalSize

FROM image_assets ia

WHERE

NOT EXISTS(
SELECT 1 FROM profile_avatars
WHERE imageAssetId=ia.id
AND isActive=1
)

AND NOT EXISTS(
SELECT 1 FROM profile_hero_images
WHERE imageAssetId=ia.id
AND isActive=1
)

AND NOT EXISTS(
SELECT 1 FROM post_images
WHERE imageAssetId=ia.id
)

`).get() as any

return{

totalFiles:row.totalFiles,
totalSize:row.totalSize

}

}catch(error){

console.error(
'[ADMIN ORPHAN SUMMARY ERROR]',
error
)

throw error

}

}


}
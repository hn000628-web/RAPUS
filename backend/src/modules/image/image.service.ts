import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common'

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

import sharp from 'sharp'

import db from '../../config/database'

@Injectable()
export class ImageService {

/* ==================================================
SECTION 01 : HASH
DOMAIN : IMAGE INFRA
ROLE : SHA256 생성
================================================== */

private createHash(
buffer:Buffer
){

return crypto
.createHash('sha256')
.update(buffer)
.digest('hex')

}

/* ==================================================
SECTION 02 : VALIDATION
DOMAIN : IMAGE INFRA
ROLE : 파일 검증
================================================== */

private validateFile(
file:Express.Multer.File
){

if(!file?.buffer){

throw new BadRequestException(
'파일 없음'
)

}

const allowed=[

'image/jpeg',
'image/png',
'image/webp'

]

if(!allowed.includes(
file.mimetype
)){

throw new BadRequestException(
'허용되지 않은 타입'
)

}

if(
file.size > 10*1024*1024
){

throw new BadRequestException(
'파일 크기 초과'
)

}

}

/* ==================================================
SECTION 03 : STORAGE
DOMAIN : IMAGE INFRA
ROLE : 파일 저장
================================================== */

private getUploadDir(){

return path.join(

process.cwd(),

'uploads',

'assets'

)

}

private ensureDir(){

const dir=
this.getUploadDir()

fs.mkdirSync(
dir,
{recursive:true}
)

}

/* ==================================================
SECTION 04 : IMAGE WRITE
DOMAIN : IMAGE INFRA
ROLE : 이미지 업로드
================================================== */

async uploadImage(
file:Express.Multer.File
){

this.validateFile(file)

const hash=
this.createHash(
file.buffer
)

/* 중복 체크 */

const existing =
db.prepare(`
SELECT id,filePath
FROM image_assets
WHERE hash=?
`).get(hash) as
| {id:number,filePath:string}
| undefined

if(existing){

return{

imageAssetId:
existing.id,

imageUrl:
existing.filePath,

duplicated:true

}

}

/* metadata */

const meta=
await sharp(
file.buffer
).metadata()

/* 저장 */

this.ensureDir()

const filename=
`${hash}.webp`

const fullPath=
path.join(

this.getUploadDir(),

filename

)

await sharp(file.buffer)

.resize({

width:1280,

withoutEnlargement:true

})

.webp({

quality:80

})

.toFile(fullPath)

const filePath=
`/uploads/assets/${filename}`

const size=
fs.statSync(
fullPath
).size

/* DB 저장 */

const result=
db.prepare(`
INSERT INTO image_assets
(
hash,
filePath,
size,
width,
height
)
VALUES (?,?,?,?,?)
`).run(

hash,

filePath,

size,

meta.width ?? null,

meta.height ?? null

)

return{

imageAssetId:
Number(
result.lastInsertRowid
),

imageUrl:filePath,

duplicated:false

}

}

/* ==================================================
SECTION 05 : IMAGE READ
DOMAIN : IMAGE INFRA
ROLE : 단건 조회
================================================== */

getImageAsset(
imageAssetId:number
){

const asset=
db.prepare(`
SELECT *
FROM image_assets
WHERE id=?
`).get(
imageAssetId
)

if(!asset){

throw new NotFoundException(
'Image not found'
)

}

return asset

}

/* ==================================================
SECTION 06 : IMAGE DELETE
DOMAIN : IMAGE INFRA
ROLE : 이미지 삭제
================================================== */

deleteImageAsset(
imageAssetId:number
){

const asset=
db.prepare(`
SELECT filePath
FROM image_assets
WHERE id=?
`).get(
imageAssetId
) as
| {filePath:string}
| undefined

if(!asset){

throw new NotFoundException(
'Image not found'
)

}

/* 참조 확인 */

const ref=
db.prepare(`
SELECT COUNT(*) count
FROM photos
WHERE imageAssetId=?
`).get(
imageAssetId
) as {count:number}

/* 사용중이면 삭제 금지 */

if(ref.count>0){

throw new BadRequestException(
'사용중 이미지'
)

}

/* 파일 삭제 */

const fullPath=
path.join(

process.cwd(),

asset.filePath

)

if(
fs.existsSync(fullPath)
){

fs.unlinkSync(
fullPath
)

}

/* DB 삭제 */

db.prepare(`
DELETE FROM image_assets
WHERE id=?
`).run(
imageAssetId
)

return {ok:true}

}

}
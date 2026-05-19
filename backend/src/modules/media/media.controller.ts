/* ==================================================
FILE : backend/src/modules/media/media.controller.ts
ROLE : MEDIA DOMAIN ENTRY
STATUS :
MEDIA STORAGE ENTRY ONLY
PROFILE DOMAIN 분리
PRODUCTION SAFE
DB SCHEMA ALIGN COMPLETE
================================================== */


/* ==================================================
SECTION 01 IMPORT
================================================== */

import{

Controller,
Post,
Delete,
Body,
Req,
UseGuards,
UseInterceptors,
BadRequestException,
UploadedFile

}from'@nestjs/common'

import{

FileInterceptor

}from'@nestjs/platform-express'

import{

AuthGuard

}from'@nestjs/passport'

import { Request }
from 'express'

import { MediaService }
from './media.service'


/* ==================================================
SECTION 02 CONTROLLER
================================================== */

@Controller('media')

export class MediaController{

constructor(
private readonly mediaService:MediaService
){}


/* ==================================================
SECTION 03 AUTH HELPER
================================================== */

private getChannel(req:Request){

const user:any=req.user||{}

const channelCode =
user?.channelCode || null

if(!channelCode){
throw new BadRequestException('channelCode missing')
}

return channelCode

}


/* ==================================================
SECTION 04 IMAGE UPLOAD
POST /api/media/upload
MEDIA STORAGE ONLY
🔥 SINGLE FILE STRUCTURE (FIXED)
================================================== */

@UseGuards(AuthGuard('jwt'))

@Post('upload')

@UseInterceptors(
FileInterceptor('file') // 🔥 핵심 FIX
)

async uploadImage(

@UploadedFile()
file:Express.Multer.File,

@Body()
body:any,

@Req()
req:Request

){

/* =========================
VALIDATION
========================= */

if(!file){
throw new BadRequestException('file required')
}

const channelCode =
this.getChannel(req)

/* =========================
USAGE TYPE VALIDATION
========================= */

const usageType =
body?.usageType || 'post'

const allowed = [
'avatar',
'post',
'hero',
'gallery'
]

if(!allowed.includes(usageType)){
throw new BadRequestException('invalid usageType')
}

/* =========================
SERVICE CALL
========================= */

const result =
await this.mediaService.uploadImage({

file,
channelCode,
usageType

})

/* =========================
RESPONSE
========================= */

return{
ok:true,
assetId:result.assetId,
fileName:result.fileName,
filePath:result.filePath
}

}


/* ==================================================
SECTION 05 IMAGE DELETE
DELETE /api/media/image
MEDIA ONLY
================================================== */

@UseGuards(AuthGuard('jwt'))

@Delete('image')

async deleteImage(

@Body()
body:any,

@Req()
req:Request

){

if(!body?.assetId){
throw new BadRequestException('assetId required')
}

/* =========================
CHANNEL CHECK (SAFE)
========================= */

const channelCode =
this.getChannel(req)

/* =========================
DELETE
(현재 구조: service 내부 FK 체크)
========================= */

await this.mediaService.deleteImage(
Number(body.assetId)
)

return{
ok:true
}

}

}


/* ==================================================
END
================================================== */
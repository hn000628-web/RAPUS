/* ==================================================
FILE : backend/src/modules/profiles/profiles.controller.ts
ROLE : PROFILE DOMAIN ENTRY
STATUS :
DOMAIN CLEAN
MEDIA FULL SEPARATION
RELATION ONLY
PRODUCTION SAFE
================================================== */


/* ==================================================
SECTION 01 IMPORT
================================================== */

import{

Controller,
Get,
Patch,
Delete,
Put,
Body,
Req,
Param,
BadRequestException,
UseGuards

}from'@nestjs/common'

import{

AuthGuard

}from'@nestjs/passport'

import { Request } from 'express'

import {ProfilesService}
from './profiles.service'


/* ==================================================
SECTION 02 CONTROLLER
================================================== */

@Controller('profiles')

export class ProfilesController{

constructor(

private readonly profilesService:ProfilesService

){}


/* ==================================================
SECTION 03 AUTH HELPER
================================================== */

  private getAuth(req:Request){

const user:any=req.user||{}

const userId=

user?.id||
user?.userId||
user?.sub

  const profileId=
  user?.profileId
  const profileType = user?.profileType
  const channelCode = user?.channelCode

  if(!userId||!profileId||!channelCode)

throw new BadRequestException(
'auth missing'
)

  return{

  userId,
  profileId,
  profileType,
  channelCode

  }

}


/* ==================================================
SECTION 04 GET PROFILE
================================================== */

@UseGuards(AuthGuard('jwt'))

@Get()

getProfile(

@Req()req:Request

){

const{

userId,
profileId

}=this.getAuth(req)

return this.profilesService.getMyProfile(

userId,
profileId

)

}


/* ==================================================
SECTION 05 PATCH PROFILE INFO
================================================== */

@UseGuards(AuthGuard('jwt'))

@Patch('info')

updateProfile(

@Body()body:any,
@Req()req:Request

){

const{

userId,
profileId

}=this.getAuth(req)

return this.profilesService.updateProfileInfo(

userId,
profileId,

body?.displayName||null,
body?.bio||null

)

}


/* ==================================================
SECTION 06 AVATAR RELATION ONLY
MEDIA DOMAIN RETURNS assetId
FINAL FIX (HERO SAME STRUCTURE)
================================================== */

@UseGuards(AuthGuard('jwt'))

@Put('avatar')

connectAvatar(

@Body()body:any,

@Req()req:Request

){

const{

userId,
profileId

}=this.getAuth(req)

if(!body?.assetId)

throw new BadRequestException(
'assetId required'
)

/* filePath 제거 */

return this.profilesService.connectAvatar(

userId,
profileId,

body.assetId

)

}

/* ==================================================
SECTION 07 DELETE AVATAR RELATION
PROFILE ONLY UNLINK
MEDIA DELETE SEPARATE
================================================== */

@UseGuards(AuthGuard('jwt'))

@Delete('avatar')

deleteAvatar(

@Req()req:Request

){

const{

userId,
profileId

}=this.getAuth(req)

return this.profilesService.deleteAvatar(

userId,
profileId

)

}


/* ==================================================
SECTION 08 HERO RELATION ONLY
PROFILE DOMAIN DOES NOT HANDLE FILES
================================================== */

@UseGuards(AuthGuard('jwt'))

@Put('hero')

connectHero(

@Body()body:any,

@Req()req:Request

){

const{

userId,
profileId

}=this.getAuth(req)

if(!Array.isArray(body?.assetIds))

throw new BadRequestException(
'assetIds required'
)

return this.profilesService.connectHeroImages(

userId,
profileId,

body.assetIds

)

}

/* ==================================================
SECTION 08-1 GALLERY RELATION ONLY
PROFILE DOMAIN ONLY RELATION
MEDIA DOMAIN STORAGE ONLY
PRODUCTION SAFE
================================================== */

@UseGuards(AuthGuard('jwt'))

@Put('gallery')

connectGallery(

@Body()body:any,

@Req()req:Request

){

const{

userId,
profileId

}=this.getAuth(req)

if(!Array.isArray(body?.assetIds))

throw new BadRequestException(
'assetIds required'
)

return this.profilesService.connectGalleryImages(

userId,
profileId,

body.assetIds

)

}


/* ==================================================
SECTION 08-2 GET GALLERY
READ ONLY
PROFILE DOMAIN ONLY
JWT OWNERSHIP SAFE
PRODUCTION SAFE
================================================== */

@UseGuards(AuthGuard('jwt'))

@Get('gallery')

getGallery(

@Req()req:Request

){

const{

userId,
profileId

}=this.getAuth(req)

/* service ownership validated */

const gallery=

this.profilesService.getGalleryImages(

profileId

)

return{

ok:true,

gallery:
gallery||[]

}

}


/* ==================================================
SECTION 09 CHANNEL UPDATE
================================================== */

@UseGuards(AuthGuard('jwt'))

@Put('channel')

updateChannel(

@Body()body:any,
@Req()req:Request

){

  const{

  userId,
  profileId,
  channelCode

  }=this.getAuth(req)

  return this.profilesService.updateChannel(

  userId,
  profileId,
  channelCode,

  body?.channelName||null,
  body?.channelURL||null

)

}

/* ==================================================
SECTION 10 : BLOCKS UPDATE
================================================== */

@UseGuards(AuthGuard('jwt'))

@Put('blocks')

updateBlocks(

@Body()body:any,
@Req()req:Request

){

const{
userId,
profileId
}=this.getAuth(req)

if(!Array.isArray(body?.blocks))
throw new BadRequestException(
'blocks required'
)

return this.profilesService.updateBlocks(

userId,
profileId,
body.blocks

)

}



//============================================================
// SECTION END
//============================================================
}

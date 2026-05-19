// FILE : backend/src/admin/media/admin-media.controller.ts
// ROOT : backend/src/admin/media/admin-media.controller.ts
// STATUS : ADMIN MEDIA CONTROLLER FINAL
// ROLE : ORPHAN MEDIA ADMIN ROUTES

// SECTION 01 : IMPORT

import {

Controller,
Get,
Delete

}from '@nestjs/common'

import {

AdminMediaService

}from './admin-media.service'


// SECTION 02 : CONTROLLER

@Controller('admin/media')

export class AdminMediaController{


// SECTION 03 : CONSTRUCTOR

constructor(

private readonly adminMediaService:
AdminMediaService

){}


// SECTION 04 : ORPHAN SUMMARY

@Get('orphan/summary')

getOrphanSummary(){

return this.adminMediaService
.getOrphanSummary()

}


// SECTION 05 : GET ORPHANS

@Get('orphan')

getOrphans(){

return this.adminMediaService
.getOrphanAssets()

}


// SECTION 06 : CLEAR ALL ORPHANS

@Delete('orphan/clear')

clearOrphans(){

return this.adminMediaService
.clearOrphans()

}


}
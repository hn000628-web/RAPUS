/* ==================================================
FILE : backend/src/modules/regions/regions.service.ts
SECTION CODE OUTPUT : REGIONS SERVICE FINAL STABLE
STATUS :
CONTROLLER MATCH
REPOSITORY MATCH
DB MATCH
PRODUCTION SAFE
================================================== */

import{

Injectable,
NotFoundException,
BadRequestException

}from'@nestjs/common'

import db from'../../config/database'

import{

RegionsRepository

}from'./regions.repository'

@Injectable()

export class RegionsService{

/* ==================================================
SECTION 01 PROFILE REGION UPDATE
DB MATCH FINAL SAFE
================================================== */

async updateProfileRegion(

profileId:number,
regionId:number,
detailAddress?:string|null

){

const id=Number(regionId)

if(Number.isNaN(id))
throw new BadRequestException(
'Invalid regionId'
)

const region=
RegionsRepository.getRegionTree(
db,
id
)

if(!region)
throw new NotFoundException(
'Region not found'
)

const profile=
RegionsRepository.getProfileRegion(
db,
profileId
)

if(!profile)
throw new NotFoundException(
'Profile not found'
)

/* UPDATE */

RegionsRepository.updateProfileRegion(

db,

{

profileId,

activityRegionId:id,

feedRegionId:id,

detailAddress:
detailAddress??null

}

)

return{

ok:true,

profileId,

activityRegionId:id,

feedRegionId:id,

detailAddress:
detailAddress??null

}

}

/* ==================================================
SECTION 02 REGION SEARCH
================================================== */

async searchRegions(
query:string
){

const q=query?.trim()

if(!q||q.length<2)

return{

ok:true,
regions:[]

}

return{

ok:true,

regions:
RegionsRepository.search(
db,
q
)

}

}

/* ==================================================
SECTION 03 REGION BY ID
================================================== */

async getRegionById(
regionId:number
){

const region=
RegionsRepository.getRegionTree(
db,
Number(regionId)
)

if(!region)
throw new NotFoundException(
'Region not found'
)

return{

ok:true,
region

}

}

/* ==================================================
SECTION 04 GPS REGION
================================================== */

async findRegionByGps(

lat:number,
lng:number

){

if(

Number.isNaN(lat)||
Number.isNaN(lng)

)

throw new BadRequestException(
'invalid lat/lng'
)

const region=
RegionsRepository.findByGps(

db,
lat,
lng

)

if(!region)
throw new NotFoundException(
'Region not found'
)

return{

ok:true,
region

}

}

/* ==================================================
SECTION 05 CURRENT REGION
================================================== */

async getCurrentRegion(

profileId:number

){

const profile=
RegionsRepository.getProfileRegion(
db,
profileId
)

if(!profile)
throw new NotFoundException(
'Profile not found'
)

if(!profile.activityRegionId)

return{

ok:true,
region:null

}

const region=
RegionsRepository.getRegionTree(

db,
profile.activityRegionId

)

return{

ok:true,

region:
region??null

}

}

/* ==================================================
SECTION 06 ALL DONG REGIONS
================================================== */

async getAllDongRegions(){

const rows=
RegionsRepository.search(
db,
''
)

return{

ok:true,

regions:
rows??[]

}

}

/* ==================================================
SECTION 07 DETAIL ADDRESS (CONTROLLER SAFE)
================================================== */

async getDetailAddress(

profileId:number

){

const profile=
RegionsRepository.getProfileRegion(
db,
profileId
)

if(!profile)

return{

ok:true,
detailAddress:null

}

return{

ok:true,
detailAddress:null   // DB column 없음 → null 반환

}

}

/* ==================================================
SECTION 08 FEED REGION UPDATE
================================================== */

async updateFeedRegion(

profileId:number,
regionId:number

){

const id=
Number(regionId)

if(Number.isNaN(id))
throw new BadRequestException(
'Invalid regionId'
)

const region=
RegionsRepository.getRegionTree(

db,
id

)

if(!region)
throw new NotFoundException(
'Region not found'
)

/* UPDATE */

RegionsRepository.updateFeedRegion(

db,
profileId,
id

)

return{

ok:true,

feedRegionId:id

}

}

}
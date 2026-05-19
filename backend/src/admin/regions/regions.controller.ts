// FILE: backend/src/modules/admin/regions/regions.controller.ts

/* ==================================================
SECTION 00 IMPORT
================================================== */

import{
Controller,
Get,
Post,
Delete,
Query,
Param,
UploadedFile,
UseInterceptors,
BadRequestException,
InternalServerErrorException,
Res,
Headers
}from'@nestjs/common'

import{FileInterceptor}from'@nestjs/platform-express'

import{Response,Express}from'express'

import{RegionsService}from'./regions.service'

/* ==================================================
SECTION 01 CONTROLLER
DOMAIN : ADMIN REGIONS
ROLE : REGION ADMIN API
================================================== */

@Controller('admin/regions')

export class RegionsController{

constructor(
private readonly regionsService:RegionsService
){}

/* ==================================================
SECTION 02 VALIDATION
================================================== */

private parsePage(
page?:string
):number{

const parsed=
page?Number(page):1

if(
Number.isNaN(parsed)||
parsed<=0||
parsed>100000
)
throw new BadRequestException(
'invalid page'
)

return parsed

}

private parseLimit(
limit?:string
):number{

const parsed=
limit?Number(limit):50

if(
Number.isNaN(parsed)||
parsed<=0||
parsed>500
)
throw new BadRequestException(
'invalid limit'
)

return parsed

}

private parseRegionId(
id:string
):number{

const regionId=
Number(id)

if(
isNaN(regionId)||
regionId<=0
)
throw new BadRequestException(
'invalid region id'
)

return regionId

}

/* ==================================================
SECTION 03 REGION LIST
GET /api/admin/regions
================================================== */

@Get()

getRegions(

@Query('page')page?:string,
@Query('limit')limit?:string

){

return this.regionsService.getRegions(

this.parsePage(page),

this.parseLimit(limit)

)

}

/* ==================================================
SECTION 04 REGION TREE
GET /api/admin/regions/tree
================================================== */

@Get('tree')

getTree(){

try{

return this.regionsService
.getRegionsTree()

}catch(err){

console.error(
'REGION TREE ERROR',
err
)

throw new InternalServerErrorException(
'지역 트리 조회 실패'
)

}

}

/* ==================================================
SECTION 05 REGION PATH
GET /api/admin/regions/path/:id
================================================== */

@Get('path/:id')

getPath(

@Param('id')id:string

){

return this.regionsService
.getRegionPath(

this.parseRegionId(id)

)

}

/* ==================================================
SECTION 06 CSV IMPORT
POST /api/admin/regions/import
================================================== */

@Post('import')

@UseInterceptors(
FileInterceptor('file',{

limits:{
fileSize:
25*1024*1024
}

})
)

importCSV(

@UploadedFile()
file:Express.Multer.File

){

if(!file)
throw new BadRequestException(
'CSV 파일 필요'
)

/* EXTENSION CHECK */

if(
!file.originalname
.toLowerCase()
.endsWith('.csv')
)
throw new BadRequestException(
'CSV 파일만 허용'
)

/* MIME CHECK */

const allowed=[

'text/csv',
'application/vnd.ms-excel',
'application/csv'

]

if(
file.mimetype &&
!allowed.includes(file.mimetype)
)
throw new BadRequestException(
'잘못된 CSV MIME'
)

/* EMPTY CHECK */

if(
!file.buffer||
file.buffer.length===0
)
throw new BadRequestException(
'CSV empty'
)

/* SIZE SAFE */

if(
file.buffer.length>
25*1024*1024
)
throw new BadRequestException(
'파일 너무 큼'
)

try{

const result=
this.regionsService
.importRegions(file)

return{

ok:true,
imported:result.count

}

}catch(err){

console.error(
'REGION IMPORT ERROR',
err
)

throw new InternalServerErrorException(
'CSV Import 실패'
)

}

}

/* ==================================================
SECTION 07 CSV EXPORT
GET /api/admin/regions/export
================================================== */

@Get('export')

exportCSV(

@Res({passthrough:true})
res:Response

){

try{

const csv=
'\uFEFF'+
this.regionsService
.exportRegions()

const now=
new Date()

const filename=

`regions_backup_${
now.toISOString()
.slice(0,10)
}_${now.getTime()}
.csv`

res.setHeader(
'Content-Type',
'text/csv; charset=utf-8'
)

res.setHeader(
'Content-Disposition',
`attachment; filename="${filename}"`
)

res.setHeader(
'Cache-Control',
'no-store, no-cache, must-revalidate'
)

res.setHeader(
'Pragma',
'no-cache'
)

return csv

}catch(err){

console.error(
'CSV EXPORT ERROR',
err
)

throw new InternalServerErrorException(
'CSV Export 실패'
)

}

}

/* ==================================================
SECTION 08 REGION RESET (PROTECTED)
DELETE /api/admin/regions/reset
================================================== */

@Delete('reset')

resetRegions(

@Headers('x-admin-reset-token')
token?:string

){

/* PROTECTION */

if(
!token||
token!==
process.env.ADMIN_RESET_TOKEN
)
throw new BadRequestException(
'reset blocked'
)

try{

return this.regionsService
.resetRegions()

}catch(err){

console.error(
'REGION RESET ERROR',
err
)

throw new InternalServerErrorException(
'지역 초기화 실패'
)

}

}

/* ==================================================
SECTION END REGIONS CONTROLLER
================================================== */

}
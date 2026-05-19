/* ==================================================
FILE : backend/src/modules/admin/industry-subtypes/industry-subtypes.controller.ts
SECTION : INDUSTRY SUBTYPES CONTROLLER FINAL FIX (CODE RESTORED)
STATUS : CSV STRUCTURE MATCH + SERVICE ALIGN
ROOT : C:\Users\kjm\social-platform\backend\src\modules\admin\industry-subtypes\industry-subtypes.controller.ts
================================================== */

/* ==================================================
SECTION 00 IMPORT
================================================== */

import{

Controller,
Get,
Post,
Patch,
Delete,
Param,
Body,
Query,
BadRequestException,
InternalServerErrorException,
UseInterceptors,
UploadedFile

}from'@nestjs/common'

import{

FileInterceptor

}from'@nestjs/platform-express'

import{

IndustrySubtypesService

}from'./industry-subtypes.service'

import{

parse

}from'csv-parse/sync'

/* ==================================================
SECTION 01 CONTROLLER
================================================== */

@Controller('admin/industry-subtypes')

export class IndustrySubtypesController{

constructor(

private readonly industrySubtypesService:
IndustrySubtypesService

){}

/* ==================================================
SECTION 02 GET ALL
================================================== */

@Get()

getAll(

@Query('industryId')
industryId?:string

){

try{

if(industryId!==undefined){

const id=
Number(industryId)

if(Number.isNaN(id))
throw new BadRequestException(
'invalid industryId'
)

return this
.industrySubtypesService
.getByIndustry(id)

}

return this
.industrySubtypesService
.getAll()

}catch(err){

console.error(
'SUBTYPE LIST ERROR',
err
)

if(err instanceof BadRequestException)
throw err

throw new InternalServerErrorException(
'업종 세부 조회 실패'
)

}

}

/* ==================================================
SECTION 03 GET ONE
================================================== */

@Get(':id')

getOne(

@Param('id')
id:string

){

const subtypeId=
Number(id)

if(Number.isNaN(subtypeId))
throw new BadRequestException(
'invalid id'
)

return this
.industrySubtypesService
.getById(subtypeId)

}

/* ==================================================
SECTION 04 CREATE
================================================== */

@Post()

create(

@Body()
body:{

industryId:number
code:string
name:string
sortOrder?:number
isActive?:number

}

){

if(body.industryId==null)
throw new BadRequestException(
'industryId required'
)

if(!body.code)
throw new BadRequestException(
'code required'
)

if(!body.name)
throw new BadRequestException(
'name required'
)

return this
.industrySubtypesService
.create({

industryId:Number(body.industryId),

code:String(body.code),

name:String(body.name),

sortOrder:
body.sortOrder!=null
?Number(body.sortOrder)
:undefined,

isActive:
body.isActive!=null
?Number(body.isActive)
:undefined

})

}

/* ==================================================
SECTION 05 UPDATE
================================================== */

@Patch(':id')

update(

@Param('id')
id:string,

@Body()
body:{

industryId?:number
code?:string
name?:string
sortOrder?:number
isActive?:number

}

){

const subtypeId=
Number(id)

if(Number.isNaN(subtypeId))
throw new BadRequestException(
'invalid id'
)

return this
.industrySubtypesService
.update(

subtypeId,

{

industryId:
body.industryId!=null
?Number(body.industryId)
:undefined,

code:
body.code!=null
?String(body.code)
:undefined,

name:
body.name!=null
?String(body.name)
:undefined,

sortOrder:
body.sortOrder!=null
?Number(body.sortOrder)
:undefined,

isActive:
body.isActive!=null
?Number(body.isActive)
:undefined

}

)

}

/* ==================================================
SECTION 06 TOGGLE
================================================== */

@Patch('toggle/:id')

toggle(

@Param('id')
id:string

){

const subtypeId=
Number(id)

if(Number.isNaN(subtypeId))
throw new BadRequestException(
'invalid id'
)

return this
.industrySubtypesService
.toggle(subtypeId)

}

/* ==================================================
SECTION 07 DELETE
================================================== */

@Delete(':id')

delete(

@Param('id')
id:string

){

const subtypeId=
Number(id)

if(Number.isNaN(subtypeId))
throw new BadRequestException(
'invalid id'
)

return this
.industrySubtypesService
.delete(subtypeId)

}

/* ==================================================
SECTION 08 CSV IMPORT
================================================== */

@Post('import')

@UseInterceptors(

FileInterceptor('file')

)

importCSV(

@UploadedFile()
file:Express.Multer.File

){

if(!file)
throw new BadRequestException(
'file required'
)

try{

const text=
file.buffer.toString('utf8')

const rows=parse(

text,

{

columns:true,
skip_empty_lines:true,
trim:true

}

)

if(!rows?.length)
throw new BadRequestException(
'csv empty'
)

/*
CSV STRUCTURE:

industryId,code,name,sortOrder,isActive
*/

return this
.industrySubtypesService
.importCSV(rows)

}catch(err){

console.error(
'CSV IMPORT ERROR',
err
)

if(err instanceof BadRequestException)
throw err

throw new InternalServerErrorException(
'csv parse fail'
)

}

}

/* ==================================================
SECTION 09 RESET
================================================== */

@Delete('reset')
reset(){

return this
.industrySubtypesService
.reset()

}
}

/* ==================================================
SECTION END
================================================== */


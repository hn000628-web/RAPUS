/* ==================================================
SECTION 00 : IMPORT
================================================== */

import{

Controller,
Get,
Post,
Patch,
Delete,
Param,
Body,
ParseIntPipe

}from'@nestjs/common'

import{

IndustriesService

}from'./industries.service'

/* ==================================================
SECTION 01 : DTO
================================================== */

type CreateIndustryDto={

code:string

name:string

description?:string

}

type UpdateIndustryDto={

code?:string

name?:string

description?:string

isActive?:number

}

/* ==================================================
SECTION 02 : CONTROLLER
================================================== */

@Controller('admin/industries')

export class IndustriesController{

constructor(

private readonly industriesService:
IndustriesService

){}

/* ==================================================
GET ALL
================================================== */

@Get()

getAll(){

return this.industriesService
.getAll()

}

/* ==================================================
GET ONE
================================================== */

@Get(':id')

getOne(

@Param(
'id',
ParseIntPipe
)id:number

){

return this.industriesService
.getById(id)

}

/* ==================================================
CREATE
================================================== */

@Post()

create(

@Body()
body:CreateIndustryDto

){

return this.industriesService
.create({

code:body.code,

name:body.name,

description:body.description

})

}

/* ==================================================
UPDATE
================================================== */

@Patch(':id')

update(

@Param(
'id',
ParseIntPipe
)id:number,

@Body()
body:UpdateIndustryDto

){

return this.industriesService
.update(

id,

{

code:body.code,

name:body.name,

description:body.description,

isActive:body.isActive

}

)

}

/* ==================================================
DELETE
================================================== */

@Delete(':id')

delete(

@Param(
'id',
ParseIntPipe
)id:number

){

return this.industriesService
.delete(id)

}

/* ==================================================
TOGGLE
================================================== */

@Patch(':id/toggle')

toggle(

@Param(
'id',
ParseIntPipe
)id:number

){

return this.industriesService
.toggle(id)

}

/* ==================================================
END
================================================== */

}
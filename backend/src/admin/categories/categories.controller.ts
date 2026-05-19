/* ==================================================
FILE : backend/src/modules/admin/categories/categories.controller.ts
SECTION CODE OUTPUT : CATEGORIES CONTROLLER FINAL
STATUS : ADMIN CATEGORY DOMAIN FINAL SAFE
RULE :
main.ts → globalPrefix('api')
Controller → domain only

FINAL ROUTE :

GET    /api/admin/categories
GET    /api/admin/categories/:id
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
PATCH  /api/admin/categories/:id/toggle
DELETE /api/admin/categories/:id

================================================== */

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
BadRequestException,
InternalServerErrorException,
ParseIntPipe

}from'@nestjs/common'

import{

CategoriesService

}from'./categories.service'

/* ==================================================
SECTION 01 : DTO
================================================== */

type CreateCategoryDto={

name:string
code:string
type:string

}

type UpdateCategoryDto={

name?:string
code?:string
type?:string
isActive?:number

}

/* ==================================================
SECTION 02 : CONTROLLER
DOMAIN : ADMIN CATEGORIES
ROLE : CATEGORY MASTER ADMIN API
ROUTE ROOT : /api/admin/categories
================================================== */

@Controller('admin/categories')

export class CategoriesController{

constructor(

private readonly categoriesService:
CategoriesService

){}

/* ==================================================
SECTION 03 : GET ALL
================================================== */

@Get()

getAll(){

try{

return this.categoriesService
.getAll()

}catch(err){

console.error(
'CATEGORY LIST ERROR',
err
)

throw new InternalServerErrorException(
'카테고리 조회 실패'
)

}

}

/* ==================================================
SECTION 04 : GET ONE
================================================== */

@Get(':id')

getOne(

@Param(
'id',
ParseIntPipe
)
id:number

){

return this.categoriesService
.getById(id)

}

/* ==================================================
SECTION 05 : CREATE
================================================== */

@Post()

create(

@Body()
body:CreateCategoryDto

){

if(!body.name)

throw new BadRequestException(
'name required'
)

if(!body.code)

throw new BadRequestException(
'code required'
)

if(!body.type)

throw new BadRequestException(
'type required'
)

try{

return this.categoriesService
.create({

name:body.name,
code:body.code,
type:body.type

})

}catch(err){

console.error(
'CATEGORY CREATE ERROR',
err
)

throw new InternalServerErrorException(
'카테고리 생성 실패'
)

}

}

/* ==================================================
SECTION 06 : UPDATE
================================================== */

@Patch(':id')

update(

@Param(
'id',
ParseIntPipe
)
id:number,

@Body()
body:UpdateCategoryDto

){

return this.categoriesService.update(

id,

{

name:body.name,
code:body.code,
type:body.type,
isActive:body.isActive

}

)

}

/* ==================================================
SECTION 07 : TOGGLE ACTIVE
REST SAFE STRUCTURE
================================================== */

@Patch(':id/toggle')

toggle(

@Param(
'id',
ParseIntPipe
)
id:number

){

return this.categoriesService
.toggle(id)

}

/* ==================================================
SECTION 08 : DELETE
================================================== */

@Delete(':id')

delete(

@Param(
'id',
ParseIntPipe
)
id:number

){

return this.categoriesService
.delete(id)

}
}

/* ==================================================
SECTION END
================================================== */
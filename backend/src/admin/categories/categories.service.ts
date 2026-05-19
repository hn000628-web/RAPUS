/* ==================================================
SECTION 00 : IMPORT
================================================== */

import{
Injectable,
BadRequestException,
NotFoundException
}from'@nestjs/common'

import db from
'../../config/database'

/* ==================================================
SECTION 01 : TYPES
================================================== */

export type Category={

id:number

code:string

name:string

type:string

isActive:number

}

/* ==================================================
SECTION 02 : SERVICE
DOMAIN : ADMIN CATEGORIES
ROLE : CATEGORY MASTER CRUD
TABLE : categories
================================================== */

@Injectable()

export class CategoriesService{

/* ==================================================
SECTION 03 : GET ALL
================================================== */

getAll():Category[]{

return db.prepare(`

SELECT

id,
code,
name,
type,
isActive

FROM categories

ORDER BY
id ASC

`).all() as Category[]

}

/* ==================================================
SECTION 04 : GET ONE
================================================== */

getById(id:number):Category{

const category=db.prepare(`

SELECT

id,
code,
name,
type,
isActive

FROM categories

WHERE id=?

`).get(id) as Category

if(!category)
throw new NotFoundException(
'category not found'
)

return category

}

/* ==================================================
SECTION 05 : CREATE
================================================== */

create(data:{

name:string
code:string
type:string

}){

if(!data.name)
throw new BadRequestException(
'name required'
)

if(!data.code)
throw new BadRequestException(
'code required'
)

if(!data.type)
throw new BadRequestException(
'type required'
)

try{

const result=db.prepare(`

INSERT INTO categories(

code,
name,
type,
isActive

)

VALUES(

?,
?,
?,
1

)

`).run(

data.code,
data.name,
data.type

)

return{

id:Number(
result.lastInsertRowid
),

code:data.code,

name:data.name,

type:data.type,

isActive:1

}

}catch(err){

if(String(err).includes('UNIQUE'))
throw new BadRequestException(
'code exists'
)

throw err

}

}

/* ==================================================
SECTION 06 : UPDATE
================================================== */

update(

id:number,

data:{

name?:string
code?:string
type?:string
isActive?:number

}

){

const category=
this.getById(id)

const name=
data.name??category.name

const code=
data.code??category.code

const type=
data.type??category.type

const isActive=
data.isActive??category.isActive

db.prepare(`

UPDATE categories

SET

code=?,
name=?,
type=?,
isActive=?

WHERE id=?

`).run(

code,
name,
type,
isActive,
id

)

return this.getById(id)

}

/* ==================================================
SECTION 07 : DELETE
================================================== */

delete(id:number){

this.getById(id)

db.prepare(`

DELETE FROM categories

WHERE id=?

`).run(id)

return{

ok:true

}

}

/* ==================================================
SECTION 08 : TOGGLE ACTIVE
================================================== */

toggle(id:number){

const category=
this.getById(id)

const next=
category.isActive?0:1

db.prepare(`

UPDATE categories

SET isActive=?

WHERE id=?

`).run(

next,
id

)

return this.getById(id)

}

/* ==================================================
SECTION END : CATEGORIES SERVICE
================================================== */

}
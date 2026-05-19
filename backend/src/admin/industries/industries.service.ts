// FILE: C:\Users\kjm\social-platform\backend\src\admin\industries\industries.service.ts
// ROOT : C:\Users\kjm\social-platform\backend\src\admin\industries\industries.service.ts
// STATUS : INDUSTRIES SERVICE DB SCHEMA MATCH FINAL

/* ==================================================
SECTION 00 : IMPORT
================================================== */

import{
Injectable,
BadRequestException,
NotFoundException
}from'@nestjs/common'

import db from '../../config/database'

/* ==================================================
SECTION 01 : TYPES
================================================== */

export type Industry={

id:number
code:string
name:string
description:string|null
isActive:number
createdAt:string

}

/* ==================================================
SECTION 02 : SERVICE
DOMAIN : ADMIN INDUSTRIES
ROLE : INDUSTRY CRUD
TABLE : industries
================================================== */

@Injectable()

export class IndustriesService{

/* ==================================================
SECTION 03 : GET ALL
================================================== */

getAll():Industry[]{

return db.prepare(`

SELECT

id,
code,
name,
description,
isActive,
createdAt

FROM industries

ORDER BY id ASC

`).all() as Industry[]

}

/* ==================================================
SECTION 04 : GET ONE
================================================== */

getById(id:number):Industry{

const industry=db.prepare(`

SELECT

id,
code,
name,
description,
isActive,
createdAt

FROM industries

WHERE id=?

`).get(id) as Industry|undefined

if(!industry)
throw new NotFoundException(
'industry not found'
)

return industry

}

/* ==================================================
SECTION 05 : CREATE
================================================== */

create(data:{

code:string
name:string
description?:string

}){

const code=
data.code?.trim().toUpperCase()

const name=
data.name?.trim()

const description=
data.description?.trim()||''

if(!code)
throw new BadRequestException('code required')

if(!name)
throw new BadRequestException('name required')

try{

const result=db.prepare(`

INSERT INTO industries(

code,
name,
description,
isActive

)

VALUES(?,?,?,1)

`).run(

code,
name,
description

)

return this.getById(
Number(result.lastInsertRowid)
)

}catch(err){

if(String(err).includes('UNIQUE'))
throw new BadRequestException('code exists')

throw err

}

}

/* ==================================================
SECTION 06 : UPDATE
================================================== */

update(

id:number,

data:{
code?:string
name?:string
description?:string
isActive?:number
}

){

const industry=this.getById(id)

const code=
data.code!==undefined
?data.code.trim().toUpperCase()
:industry.code

const name=
data.name!==undefined
?data.name.trim()
:industry.name

const description=
data.description!==undefined
?data.description.trim()
:(industry.description||'')

const isActive=
data.isActive??industry.isActive

if(!code)
throw new BadRequestException('code required')

if(!name)
throw new BadRequestException('name required')

try{

db.prepare(`

UPDATE industries

SET

code=?,
name=?,
description=?,
isActive=?

WHERE id=?

`).run(

code,
name,
description,
isActive,
id

)

}catch(err){

if(String(err).includes('UNIQUE'))
throw new BadRequestException('code exists')

throw err

}

return this.getById(id)

}

/* ==================================================
SECTION 07 : DELETE
================================================== */

delete(id:number){

this.getById(id)

db.prepare(`

DELETE FROM industries

WHERE id=?

`).run(id)

return{
ok:true
}

}

/* ==================================================
SECTION 08 : TOGGLE
================================================== */

toggle(id:number){

const industry=this.getById(id)

const next=
industry.isActive?0:1

db.prepare(`

UPDATE industries

SET isActive=?

WHERE id=?

`).run(

next,
id

)

return this.getById(id)

}

}
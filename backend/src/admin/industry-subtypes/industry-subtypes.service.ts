/* ==================================================
FILE : backend/src/modules/admin/industry-subtypes/industry-subtypes.service.ts
ROLE : ADMIN INDUSTRY SUBTYPE SERVICE FINAL
STATUS : PRODUCTION SAFE FINAL
DB : industry_subtypes FK SAFE + CSV CODE IMPORT
FIX :

industryCode → industryId 변환
FK 검증 추가
duplicate 방지
reset 유지
================================================== */

/* ==================================================
SECTION 00 IMPORT
================================================== */

import{
Injectable,
BadRequestException,
NotFoundException
}from'@nestjs/common'

import db from'../../config/database'

/* ==================================================
SECTION 01 TYPES
================================================== */

export type IndustrySubtype={

id:number
industryId:number
code:string
name:string

name_en?:string
name_ko?:string

searchKeywords?:string

isActive:number
sortOrder:number

industryName?:string

createdAt?:string
updatedAt?:string

}

/* ==================================================
SECTION 02 SERVICE
================================================== */

@Injectable()

export class IndustrySubtypesService{

/* ==================================================
SECTION 03 BASE SELECT
================================================== */

private baseSelect=`

SELECT

s.id,
s.industryId,
s.code,
s.name,

s.name_en,
s.name_ko,

s.searchKeywords,

s.isActive,
s.sortOrder,

s.createdAt,
s.updatedAt,

COALESCE(
i.name,''
) industryName

FROM industry_subtypes s

LEFT JOIN industries i
ON s.industryId=i.id

`

/* ==================================================
SECTION 04 GET ALL
================================================== */

getAll(){

return{

ok:true,

subtypes:

db.prepare(`

${this.baseSelect}

ORDER BY
s.sortOrder ASC,
s.id DESC

`).all()

}

}

/* ==================================================
SECTION 05 GET BY INDUSTRY
================================================== */

getByIndustry(industryId:number){

return{

ok:true,

subtypes:

db.prepare(`

${this.baseSelect}

WHERE s.industryId=?

ORDER BY
s.sortOrder ASC,
s.id DESC

`).all(industryId)

}

}

/* ==================================================
SECTION 06 GET ONE
================================================== */

getById(id:number){

const row=

db.prepare(`

SELECT *
FROM industry_subtypes
WHERE id=?

`).get(id) as IndustrySubtype

if(!row)

throw new NotFoundException(
'industry subtype not found'
)

return row

}

/* ==================================================
SECTION 07 CREATE
================================================== */

create(data:any){

if(!data.industryId)
throw new BadRequestException('industryId required')

if(!data.code)
throw new BadRequestException('code required')

if(!data.name)
throw new BadRequestException('name required')

const industry=

db.prepare(`
SELECT id FROM industries WHERE id=?
`).get(data.industryId)

if(!industry)
throw new BadRequestException('industry not exists')

const code=
data.code.trim().toUpperCase()

const dup=

db.prepare(`
SELECT id
FROM industry_subtypes
WHERE industryId=?
AND UPPER(code)=UPPER(?)
`).get(data.industryId,code)

if(dup)
throw new BadRequestException('code exists')

const result=

db.prepare(`

INSERT INTO industry_subtypes(

industryId,
code,
name,
sortOrder,
isActive

)

VALUES(?,?,?,?,?)

`).run(

data.industryId,
code,
data.name.trim(),
data.sortOrder??0,
data.isActive??1

)

return{

ok:true,
subtype:this.getById(
Number(result.lastInsertRowid)
)

}

}

/* ==================================================
SECTION 08 UPDATE
================================================== */

update(id:number,data:any){

const prev=this.getById(id)

const industryId=
data.industryId??prev.industryId

const code=(data.code??prev.code)
.trim()
.toUpperCase()

const name=(data.name??prev.name)
.trim()

const sortOrder=
data.sortOrder??prev.sortOrder

const isActive=
data.isActive??prev.isActive

if(data.industryId){

const industry=

db.prepare(`
SELECT id FROM industries WHERE id=?
`).get(industryId)

if(!industry)
throw new BadRequestException('industry not exists')

}

const dup=

db.prepare(`
SELECT id
FROM industry_subtypes
WHERE industryId=?
AND UPPER(code)=UPPER(?)
AND id<>?
`).get(industryId,code,id)

if(dup)
throw new BadRequestException('code exists')

db.prepare(`

UPDATE industry_subtypes

SET

industryId=?,
code=?,
name=?,
sortOrder=?,
isActive=?,
updatedAt=CURRENT_TIMESTAMP

WHERE id=?

`).run(

industryId,
code,
name,
sortOrder,
isActive,
id

)

return{

ok:true,
subtype:this.getById(id)

}

}

/* ==================================================
SECTION 09 DELETE
================================================== */

delete(id:number){

this.getById(id)

db.prepare(`
DELETE FROM industry_subtypes
WHERE id=?
`).run(id)

return{
ok:true
}

}

/* ==================================================
SECTION 10 TOGGLE
================================================== */

toggle(id:number){

const row=this.getById(id)

const next=row.isActive?0:1

db.prepare(`

UPDATE industry_subtypes

SET
isActive=?,
updatedAt=CURRENT_TIMESTAMP

WHERE id=?

`).run(next,id)

return{

ok:true,
subtype:this.getById(id)

}

}

/* ==================================================
SECTION 11 CSV IMPORT FINAL (UPSERT SAFE VERSION)
industryId / industryCode 모두 지원
================================================== */

importCSV(rows:any[]){

if(!rows?.length)
throw new BadRequestException('csv empty')

let inserted=0
let updated=0
let skipped=0

const findIndustryByCode=

db.prepare(`

SELECT id
FROM industries
WHERE UPPER(code)=UPPER(?)

`)

const findIndustryById=

db.prepare(`

SELECT id
FROM industries
WHERE id=?

`)

const exists=

db.prepare(`

SELECT id
FROM industry_subtypes
WHERE industryId=?
AND UPPER(code)=UPPER(?)

`)

const insert=

db.prepare(`

INSERT INTO industry_subtypes(

industryId,
code,
name,
name_en,
name_ko,
sortOrder,
isActive,
updatedAt

)

VALUES(

?,
?,
?,
?,
?,
?,
?,
CURRENT_TIMESTAMP

)

`)

const update=

db.prepare(`

UPDATE industry_subtypes

SET

name=?,
name_en=?,
name_ko=?,
sortOrder=?,
isActive=?,
updatedAt=CURRENT_TIMESTAMP

WHERE id=?

`)

const trx=db.transaction((data:any[])=>{

for(const r of data){

let industryId=
Number(r.industryId)

const industryCode=
String(r.industryCode||'')
.trim()
.toUpperCase()

if(!industryId && industryCode){

const industry=
findIndustryByCode.get(industryCode)

if(industry)
industryId=industry.id

}

if(!industryId){

skipped++
continue

}

const industry=
findIndustryById.get(industryId)

if(!industry){

skipped++
continue

}

const code=
String(r.code||'')
.trim()
.toUpperCase()

const name=
String(r.name||'').trim()

const name_en=
String(r.name_en||'').trim()

const name_ko=
String(r.name_ko||'').trim()

let sortOrder=
Number(r.sortOrder??0)

let isActive=
Number(r.isActive??1)

if(!code||!name){

skipped++
continue

}

if(isNaN(sortOrder))
sortOrder=0

if(isNaN(isActive))
isActive=1

const row=

exists.get(
industryId,
code
)

if(row){

update.run(

name,
name_en,
name_ko,
sortOrder,
isActive,
row.id

)

updated++

}else{

insert.run(

industryId,
code,
name,
name_en,
name_ko,
sortOrder,
isActive

)

inserted++

}

}

})

trx(rows)

return{

ok:true,

result:{

total:rows.length,
inserted,
updated,
skipped

}

}

}

/* ==================================================
SECTION 12 RESET
================================================== */

reset(){

db.prepare(`
DELETE FROM industry_subtypes
`).run()

return{
ok:true
}

}

/* ==================================================
SECTION END
================================================== */

}
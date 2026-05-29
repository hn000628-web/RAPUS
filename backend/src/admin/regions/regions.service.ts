// FILE: C:\Users\kjm\social-platform\backend\modules\regions\regions.service.ts
// ROOT : C:\Users\kjm\social-platform\backend\modules\regions\regions.service.ts
// STATUS : PRODUCTION SAFE FINAL (DB DEPTH ALIGN + CSV SAFE IMPORT)

import { Injectable, BadRequestException } from '@nestjs/common'
import { Express } from 'express'
import db from '../../config/database'
import { parse } from 'csv-parse/sync'

@Injectable()
export class RegionsService {

// SECTION 01 : REGION TYPE RESOLVER

private resolveRegionType(depth:number){

if(depth===0) return 'COUNTRY'
if(depth===1) return 'PROVINCE'
if(depth===2) return 'CITY'
if(depth===3) return 'DISTRICT'
if(depth===4) return 'NEIGHBORHOOD'
if(depth===5) return 'NEIGHBORHOOD'

return 'NEIGHBORHOOD'

}

// SECTION 02 : SAFE NORMALIZER

private norm(v:any){

if(v===null || v===undefined)
return ''

if(typeof v==='number')
return String(BigInt(Math.trunc(v)))

return String(v).trim()

}

// SECTION 03 : SAFE NUMBER

private num(v:any){

const s=this.norm(v)

if(!s) return null

const n=Number(s)

if(Number.isNaN(n))
return null

return n

}

// SECTION 04 : REGION LIST

getRegions(page:number,limit:number){

const offset=(page-1)*limit

const regions=db.prepare(`

SELECT
id,
code,
COALESCE(addressMainCode, code) as addressMainCode,
countryCode,
name,
fullName,
regionType,
depth,
parentId,
path,
latitude,
longitude,
sortOrder,
isActive,
createdAt

FROM regions

ORDER BY depth,code

LIMIT ? OFFSET ?

`).all(limit,offset)

const total=db.prepare(`
SELECT COUNT(*) count FROM regions
`).get() as any

return{

regions,
total:total.count,
page,
limit

}

}

// SECTION 05 : REGION TREE

getRegionsTree(){

const rows=db.prepare(`

SELECT
id,
code,
COALESCE(addressMainCode, code) as addressMainCode,
name,
regionType,
depth,
parentId

FROM regions

ORDER BY depth,code

`).all()

const map=new Map()

const roots:any[]=[]

for(const r of rows){

const node={

id:r.id,
code:r.code,
name:r.name,
regionType:r.regionType,
depth:r.depth,
parentId:r.parentId,
children:[]

}

map.set(r.id,node)

}

for(const r of rows){

const node=map.get(r.id)

if(!r.parentId){

roots.push(node)
continue

}

const parent=map.get(r.parentId)

if(parent)
parent.children.push(node)

}

return roots

}

// SECTION 06 : REGION PATH

getRegionPath(regionId:number){

if(!regionId)
throw new BadRequestException('regionId required')

const path:any[]=[]

let current=db.prepare(`

SELECT id,name,parentId
FROM regions
WHERE id=?

`).get(regionId)

if(!current)
throw new BadRequestException('region not found')

while(current){

path.unshift({

id:current.id,
name:current.name

})

if(!current.parentId)
break

current=db.prepare(`

SELECT id,name,parentId
FROM regions
WHERE id=?

`).get(current.parentId)

}

return{path}

}

// SECTION 07 : CSV IMPORT (PRODUCTION SAFE FINAL)

importRegions(file:Express.Multer.File){

if(!file)
throw new BadRequestException('CSV required')

const csv=file.buffer.toString('utf-8')

let rows:any[]

try{

rows=parse(csv,{

columns:true,
skip_empty_lines:true,
trim:true,
bom:true,

relax_column_count:true,
relax_quotes:true

})

}catch(err){

throw new BadRequestException({

message:'CSV parse fail',
error:String(err)

})

}

if(!rows.length)
throw new BadRequestException('CSV empty')

/* CSV NORMALIZE (COLUMN SAFE) */

rows=rows.map(r=>({

code:
r.code ??
r.legalCode ??
r.addressMainCode ??
r.AddressMainCode ??
r.addressMainCode12 ??
r.mainAddressCode ??
r.code,

addressMainCode:
r.addressMainCode ??
r.AddressMainCode ??
r.addressMainCode12 ??
r.mainAddressCode ??
r.code,

mainAddressCode:
r.mainAddressCode ??
r.addressMainCode ??
r.AddressMainCode ??
r.addressMainCode12 ??
r.code,

countryCode:
r.countryCode ??
r.country ??
'KR',

name:
r.name ??
r.regionName ??
r.region ??
r['지역명'] ??
r.mainRegionName ??
r.roadAddress ??
r['도로명주소'] ??
r.mainAddressCode ??
r.addressMainCode ??
r.AddressMainCode ??
r.code,

fullName:
r.fullName ??
r.roadAddress ??
r.address ??
r['도로명주소'] ??
r.name ??
r.regionName,

regionType:
r.regionType ??
r.regionLevel,

depth:r.depth ?? r.level ?? r.depthLevel,

parentCode:r.parentCode,

path:r.path,

latitude:r.latitude,
longitude:r.longitude,

sortOrder:r.sortOrder,

isActive:r.isActive,

roadAddress:
r.roadAddress ??
r['도로명주소'] ??
r.fullName,

addressLevel:
r.addressLevel

}))

/* DEPTH SORT */

rows.sort((a,b)=>{

const da=Number(a.depth ?? 0)
const dbv=Number(b.depth ?? 0)

return da-dbv

})

/* VALIDATION */

const errors:any[]=[]
const codes=new Set<string>()

for(let i=0;i<rows.length;i++){

const r=rows[i]

const line=i+2

const code=this.norm(r.code)

if(!code){

errors.push({
line,
field:'code',
error:'required'
})

continue

}

if(codes.has(code)){

errors.push({
line,
field:'code',
error:'duplicate'
})

}

codes.add(code)

const name=this.norm(r.name)

const depthRaw=this.norm(r.depth)

if(depthRaw){
  const depth=Number(depthRaw)

  if(Number.isNaN(depth)){

  errors.push({
  line,
  field:'depth',
  error:'invalid'
  })

  }
  else if(depth<0 || depth>5){

  errors.push({
  line,
  field:'depth',
  error:'0~5 only'
  })

  }
}

const addressLevelRaw=this.norm(r.addressLevel)

if(addressLevelRaw){
const addressLevel=Number(addressLevelRaw)

if(
Number.isNaN(addressLevel)||
addressLevel<1||
addressLevel>5
){

errors.push({
line,
field:'addressLevel',
error:'1~5 only'
})

}
}

}

if(errors.length){

throw new BadRequestException({

message:'CSV validation failed',
errorCount:errors.length,
errors:errors.slice(0,30)

})

}

/* PREPARE */

const regionMap=new Map<string,number>()

const insert=db.prepare(`

INSERT OR IGNORE INTO regions(

code,
addressMainCode,
countryCode,
name,
fullName,
regionType,
depth,
parentId,
path,
latitude,
longitude,
sortOrder,
isActive

,mainAddressCode
,roadAddress
,addressLevel

)

VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)

`)

const updateParent=db.prepare(`

UPDATE regions
SET parentId=?
WHERE id=?

`)

/* TRANSACTION */

const trx=db.transaction(()=>{

for(const r of rows){

const code=this.norm(r.code)

if(!code) continue

if(regionMap.has(code))
continue

const name=this.norm(r.name)

let depth=this.num(r.depth)

if(depth===null)
depth=3

if(depth<0)
depth=0

if(depth>5)
depth=5

let regionType=this.norm(r.regionType)

if(
regionType!== 'COUNTRY' &&
regionType!== 'METRO' &&
regionType!== 'PROVINCE' &&
regionType!== 'CITY' &&
regionType!== 'DISTRICT' &&
regionType!== 'DONG' &&
regionType!== 'EUP' &&
regionType!== 'MYEON' &&
regionType!== 'RI' &&
regionType!== 'NEIGHBORHOOD'
){
regionType=''
}

if(!regionType)
regionType=this.resolveRegionType(depth)

const mainAddressCode=
(()=>{
const raw=this.norm(
  r.mainAddressCode ||
  r.addressMainCode12 ||
  code
)
return raw.length===12 ? raw : null
})()

const addressMainCode=
this.norm(
  r.addressMainCode ||
  r.addressMainCode12 ||
  code
)

const roadAddress=
this.norm(r.roadAddress||r.fullName||name)

let addressLevel=
this.num(r.addressLevel)

if(addressLevel===null){
addressLevel=Math.min(
5,
Math.max(1,depth+1)
)
}

if(addressLevel<1)
addressLevel=1

if(addressLevel>5)
addressLevel=5

insert.run(

code,
addressMainCode,

(this.norm(r.countryCode)||'KR')
.toUpperCase(),

name,

this.norm(r.fullName)||name,

regionType,

depth,

null,

this.norm(r.path)||code,

this.num(r.latitude),

this.num(r.longitude),

this.num(r.sortOrder)||0,

this.num(r.isActive)||1,

mainAddressCode,

roadAddress,

addressLevel

)

const row=db.prepare(`

SELECT id
FROM regions
WHERE code=?

`).get(code) as any

if(row)
regionMap.set(code,row.id)

}

/* PARENT RESOLVE */

for(const r of rows){

const parentCode=this.norm(r.parentCode)

if(!parentCode)
continue

const code=this.norm(r.code)

const parentId=regionMap.get(parentCode)

const id=regionMap.get(code)

if(!parentId){

errors.push({

code,
error:'parent missing'

})

continue

}

if(id)
updateParent.run(parentId,id)

}

})

try{

trx()

}catch(err){

throw new BadRequestException({

message:'CSV Import failed',
error:String(err)

})

}

/* PATH FIX */

db.exec(`

UPDATE regions

SET path=

CASE

WHEN parentId IS NULL
THEN code

ELSE(

SELECT p.path || '/' || regions.code
FROM regions p
WHERE p.id=regions.parentId

)

END

`)

return{

ok:true,
count:rows.length,
inserted:regionMap.size,
skipped:errors.length,
message:'CSV Import success',
warnings:errors.slice(0,20)

}

}

// SECTION 08 : EXPORT

exportRegions(){

const rows=db.prepare(`

SELECT

r.code,
r.addressMainCode,
r.countryCode,
r.name,
r.fullName,
r.regionType,
r.depth,
p.code parentCode,
r.path,
r.latitude,
r.longitude,
r.sortOrder,
r.isActive

FROM regions r

LEFT JOIN regions p
ON r.parentId=p.id

ORDER BY depth,code

`).all()

const header=
'code,addressMainCode,countryCode,name,fullName,regionType,depth,parentCode,path,latitude,longitude,sortOrder,isActive\n'

const csv=rows.map((r:any)=>[

r.code,
r.addressMainCode??r.code,
r.countryCode,
r.name,
r.fullName,
r.regionType,
r.depth,
r.parentCode??'',
r.path,
r.latitude??'',
r.longitude??'',
r.sortOrder??0,
r.isActive

].join(',')).join('\n')

return header+csv

}

// SECTION 09 : RESET

resetRegions(){

db.exec(`PRAGMA foreign_keys = OFF`)

db.exec(`DELETE FROM regions`)

db.exec(`PRAGMA foreign_keys = ON`)

return{ok:true}

}

}

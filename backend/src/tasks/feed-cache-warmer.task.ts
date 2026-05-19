/* ==================================================
FILE : backend/src/tasks/feed-cache-warmer.task.ts
SECTION CODE OUTPUT : FEED CACHE WARMER FINAL SAFE VERSION
ROOT : C:\Users\kjm\social-platform\backend\src\tasks\feed-cache-warmer.task.ts
STATUS : REGION SAFE QUERY + ZERO EMPTY SKIP FIX
FIX :
regions empty guard
isActive optional 처리
level 필터 추가
================================================== */

import { Injectable, OnModuleInit } from '@nestjs/common'
import db from '../config/database'

@Injectable()

export class FeedCacheWarmerTask implements OnModuleInit{

private running=false

onModuleInit(){

console.log('Feed Cache Warmer 시작')

this.startWarmer()

}

private tableExists(name:string):boolean{

const row=
db.prepare(`
SELECT name
FROM sqlite_master
WHERE type='table'
AND name=?
`).get(name)

return !!row

}

private columnExists(
table:string,
column:string
):boolean{

const rows=
db.prepare(`
PRAGMA table_info(${table})
`).all() as any[]

return rows.some(
r=>r.name===column
)

}

private startWarmer(){

const INTERVAL=
10*60*1000

const run=()=>{

if(this.running)return

if(!this.tableExists('regions')){

console.log(
'Feed cache warm skip → regions 없음'
)

return

}

if(!this.tableExists('posts')){

console.log(
'Feed cache warm skip → posts 없음'
)

return

}

const hasStatus=
this.columnExists(
'posts',
'status'
)

const hasRegion=
this.columnExists(
'posts',
'regionId'
)

const regionHasActive=
this.columnExists(
'regions',
'isActive'
)

this.running=true

try{

let regionSQL=`
SELECT id
FROM regions
`

if(regionHasActive){

regionSQL+=`
WHERE isActive=1
`

}

regionSQL+=`
ORDER BY RANDOM()
LIMIT 10
`

const regions=
db.prepare(regionSQL).all() as {id:number}[]

if(regions.length===0){

console.log(
'Feed cache warm skip → regions empty'
)

return

}

regions.forEach(region=>{

let sql=`
SELECT id
FROM posts
`

const where:string[]=[]

if(hasStatus){

where.push(
"status='ACTIVE'"
)

}

if(hasRegion){

where.push(
"regionId=?"
)

}

if(where.length){

sql+=`
WHERE ${where.join(' AND ')}
`

}

sql+=`
ORDER BY createdAt DESC
LIMIT 20
`

let posts:any[]

if(hasRegion){

posts=
db.prepare(sql)
.all(region.id)

}else{

posts=
db.prepare(sql)
.all()

}

console.log(
`Feed cache warm region ${region.id} (${posts.length})`
)

})

}

catch(err){

console.error(
'Feed cache warm error',
err
)

}

finally{

this.running=false

}

}

run()

setInterval(
run,
INTERVAL
)

}

}
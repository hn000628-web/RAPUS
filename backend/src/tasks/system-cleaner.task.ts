/* FILE: backend/src/tasks/system-cleaner.task.ts */
/* ROOT: C:\Users\kjm\social-platform\backend\src\tasks\system-cleaner.task.ts */

/* ==================================================
SYSTEM CLEANER TASK (MANUAL ADMIN ONLY FINAL)

ROLE :
ADMIN MEDIA CLEANER ONLY

POLICY :

AUTO RUN 금지
SCHEDULE 금지
SERVER START 금지

ADMIN API ONLY

STATUS : PRODUCTION SAFE MANUAL MODE
================================================== */

import { Injectable } from '@nestjs/common'
import db from '../config/database'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()

export class SystemCleanerTask{

/* =====================================
TABLE EXIST CHECK
===================================== */

private tableExists(name:string){

try{

const row=db.prepare(`

SELECT name
FROM sqlite_master
WHERE type='table'
AND name=?

`).get(name)

return !!row

}catch{

return false

}

}

/* =====================================
MANUAL CLEAN (ADMIN ONLY)
===================================== */

public cleanOrphanImages(){

console.log(
'Admin media cleanup 실행'
)

/* TABLE GUARD */

if(!this.tableExists("image_assets"))
return

if(!this.tableExists("post_images"))
return

if(!this.tableExists("photos"))
return

const uploadsPath=

path.join(
process.cwd(),
'uploads'
)

if(!fs.existsSync(uploadsPath))
return

try{

/* ORPHAN SEARCH */

const orphans=db.prepare(`

SELECT
ia.id,
ia.filePath

FROM image_assets ia

LEFT JOIN post_images pi
ON pi.imageAssetId=ia.id

LEFT JOIN photos ph
ON ph.imageAssetId=ia.id

WHERE

pi.imageAssetId IS NULL
AND ph.imageAssetId IS NULL

`).all() as{

id:number
filePath:string

}[]

if(orphans.length===0){

console.log(
'삭제할 orphan 없음'
)

return

}

/* DB DELETE */

const ids=

orphans.map(
o=>o.id
)

const tx=

db.transaction(()=>{

const stmt=db.prepare(`

DELETE FROM image_assets
WHERE id=?

`)

ids.forEach(id=>{

stmt.run(id)

})

})

tx()

/* FILE DELETE */

let deleted=0

orphans.forEach(asset=>{

const safePath=

asset.filePath.startsWith('/')
?asset.filePath.slice(1)
:asset.filePath

const absPath=

path.join(
process.cwd(),
safePath
)

try{

if(
fs.existsSync(absPath)
){

fs.unlinkSync(absPath)

deleted++

}

}catch{}

})

console.log(

`Admin cleanup 완료
DB ${ids.length}
FILE ${deleted}`

)

}catch(err){

console.log(
'Cleanup error',
err
)

}

}

}
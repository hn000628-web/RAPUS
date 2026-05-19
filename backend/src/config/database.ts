/* ==================================================
FILE : backend/src/config/database.ts
STATUS : DB ROOT ABSOLUTE FIX FINAL
ROLE : SINGLE DB PATH GUARANTEE
================================================== */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

/* ==================================================
SECTION 00 BACKEND ROOT FIX
RULE :
process.cwd 기준 고정
dist 영향 제거
================================================== */

const BACKEND_ROOT = process.cwd()

/* ==================================================
SECTION 01 DB DIR
================================================== */

const DB_DIR = path.join(

BACKEND_ROOT,

'data'

)

/* ==================================================
SECTION 02 FILE
================================================== */

const DB_FILE='prod.sqlite'

const DB_PATH = path.join(

DB_DIR,

DB_FILE

)

/* ==================================================
SECTION 03 DIR ENSURE
================================================== */

if(!fs.existsSync(DB_DIR)){

fs.mkdirSync(

DB_DIR,

{recursive:true}

)

console.log(
'DB DIR CREATED :',
DB_DIR
)

}

/* ==================================================
SECTION 04 INFO
================================================== */

console.log(
'BACKEND ROOT:',
BACKEND_ROOT
)

console.log(
'DB DIR:',
DB_DIR
)

console.log(
'DB FILE:',
DB_FILE
)

console.log(
'DB PATH:',
DB_PATH
)

/* ==================================================
SECTION 05 INSTANCE
================================================== */

const db=new Database(

DB_PATH,

{

fileMustExist:false,

timeout:5000,

verbose:(sql)=>{

if(process.env.DB_DEBUG==='true'){

console.log('SQL:',sql)

}

}

}

)

/* ==================================================
SECTION 06 SQLITE CONFIG
================================================== */

db.exec(`

PRAGMA foreign_keys=ON;

PRAGMA journal_mode=WAL;

PRAGMA synchronous=NORMAL;

PRAGMA wal_autocheckpoint=100;

PRAGMA temp_store=MEMORY;

PRAGMA cache_size=-20000;

PRAGMA busy_timeout=5000;

`)

/* ==================================================
SECTION 07 WAL SAFE
================================================== */

function checkpoint(){

try{

db.exec(
'PRAGMA wal_checkpoint(FULL)'
)

}catch{}

}

/* ==================================================
SECTION 08 SAFE EXIT
================================================== */

process.on('exit',()=>{

checkpoint()

})

process.on('SIGINT',()=>{

checkpoint()

process.exit()

})

process.on('SIGTERM',()=>{

checkpoint()

process.exit()

})

/* ==================================================
SECTION 09 RECOVERY
================================================== */

try{

db.exec(
'PRAGMA wal_checkpoint(TRUNCATE)'
)

}catch{}

/* ==================================================
SECTION 10 HEALTH
================================================== */

try{

db.prepare(
'SELECT 1'
).get()

console.log(
'DB CONNECTION OK'
)

}catch(err){

console.error(
'DB CONNECTION FAIL',
err
)

}

/* ==================================================
SECTION 11 EXPORT
================================================== */

export default db
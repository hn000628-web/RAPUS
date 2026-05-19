// FILE: backend/src/main.ts
// ROOT : backend/src/main.ts
// STATUS : PRODUCTION FINAL SAFE BOOTSTRAP
// ROLE : SERVER BOOT + DB INIT + STATIC MEDIA + SECURITY + CDN SAFE + ERROR LOGGING

import 'dotenv/config'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'

import * as path from 'path'
import * as fs from 'fs'
import * as express from 'express'

import helmet from 'helmet'

import { initDatabase } from './init/init-db'

import { GlobalExceptionFilter }
from './common/filters/global-exception.filter'

/* ======================================
PROCESS ERROR LOG (ABSOLUTE REQUIRED)
====================================== */

process.on(

'uncaughtException',

(error)=>{

console.error('\n===== UNCAUGHT EXCEPTION =====')

console.error(error)

console.error('==============================\n')

}

)

process.on(

'unhandledRejection',

(reason)=>{

console.error('\n===== UNHANDLED PROMISE =====')

console.error(reason)

console.error('=============================\n')

}

)

/* ======================================
BOOTSTRAP
====================================== */

async function bootstrap(){

/* ======================================
SECTION 01 DB INIT (ABSOLUTE FIRST)
====================================== */

await initDatabase()

console.log('DB INIT COMPLETE')

/* ======================================
SECTION 02 NEST START
====================================== */

const app=

await NestFactory.create<NestExpressApplication>(
AppModule,
{
bufferLogs:true
}
)

/* ======================================
SECTION 03 GLOBAL ERROR FILTER
====================================== */

app.useGlobalFilters(

new GlobalExceptionFilter()

)

/* ======================================
SECTION 04 TRUST PROXY (PRODUCTION SAFE)
====================================== */

app.set('trust proxy',1)

/* ======================================
SECTION 05 SECURITY HARDENING
MEDIA SAFE CONFIG
====================================== */

app.disable('x-powered-by')

app.use(

helmet({

contentSecurityPolicy:false,

crossOriginEmbedderPolicy:false,

crossOriginResourcePolicy:{

policy:'cross-origin'

},

referrerPolicy:{
policy:'no-referrer-when-downgrade'
}

})

)

/* ======================================
SECTION 06 CORS
====================================== */

app.enableCors({

origin:

process.env.FRONTEND_URL ||

'http://localhost:3000',

methods:[

'GET',
'POST',
'PUT',
'PATCH',
'DELETE',
'OPTIONS'

],

allowedHeaders:[

'Content-Type',
'Authorization'

],

credentials:true

})

/* ======================================
SECTION 07 BODY LIMIT
====================================== */

app.use(

express.json({

limit:'10mb'

})

)

app.use(

express.urlencoded({

limit:'10mb',

extended:true

})

)

/* ======================================
SECTION 08 MEDIA ROOT
====================================== */

const uploadRoot=

path.resolve(

__dirname,
'../uploads'

)

if(!fs.existsSync(uploadRoot)){

fs.mkdirSync(

uploadRoot,

{recursive:true}

)

console.log(
'UPLOAD ROOT CREATED :',
uploadRoot
)

}

/* ======================================
SECTION 09 MEDIA STATIC ROUTE
CDN SAFE STRUCTURE
====================================== */

app.use(

'/media',

express.static(

uploadRoot,

{

index:false,

etag:true,

lastModified:true,

maxAge:'365d',

setHeaders:(res,filePath)=>{

/* CORS */

res.setHeader(

'Access-Control-Allow-Origin',

'*'

)

/* CACHE */

res.setHeader(

'Cache-Control',

'public,max-age=31536000,immutable'

)

/* MIME FIX */

if(filePath.endsWith('.webp')){

res.setHeader(

'Content-Type',

'image/webp'

)

}

if(filePath.endsWith('.jpg')){

res.setHeader(

'Content-Type',

'image/jpeg'

)

}

if(filePath.endsWith('.png')){

res.setHeader(

'Content-Type',

'image/png'

)

}

}

}

)

)

console.log(

'MEDIA STATIC ACTIVE :',
uploadRoot

)

/* ======================================
SECTION 10 GLOBAL PREFIX
====================================== */

app.setGlobalPrefix(
'api'
)

/* ======================================
SECTION 11 PORT START
====================================== */

const port=

process.env.PORT ||

4000

await app.listen(port)

/* ======================================
SECTION 12 FINAL LOG
====================================== */

console.log(

'SERVER READY → http://localhost:'+port

)

console.log(

'API ROOT → http://localhost:'+port+'/api'

)

console.log(

'MEDIA URL → http://localhost:'+port+'/media'

)

console.log(

'ENV →',

process.env.NODE_ENV ||

'dev'

)

}

/* ======================================
SECTION 13 BOOT SAFE START
====================================== */

bootstrap()

.catch(err=>{

console.error(

'SERVER BOOT FAILED',

err

)

process.exit(1)

})
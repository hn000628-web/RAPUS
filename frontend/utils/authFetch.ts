/* ==================================================
SECTION CODE OUTPUT : AUTH FETCH FINAL SAFE
FILE : frontend/utils/authFetch.ts
ROLE : API FETCH + TOKEN + BFF ROUTE
STATUS : PRODUCTION FINAL SAFE
FIX :
- /api prefix 강제
- path 안전 처리
- header merge 안정화
================================================== */

/* ==================================================
SECTION 01 IMPORT
================================================== */

import{

getToken,
removeToken

}from'./auth'

/* ==================================================
SECTION 02 API BASE (BFF ONLY RULE)
================================================== */

const API_BASE='/api'

/* ==================================================
SECTION 03 AUTH FETCH
================================================== */

export async function authFetch(

path:string,

options:RequestInit={}

){

/* PATH SAFE */

const url =

path.startsWith('/')

?

API_BASE+path

:

API_BASE+'/'+path

/* TOKEN */

const token=
getToken()

/* HEADERS */

const headers:
Record<string,string>={}

/* 기존 headers */

if(options.headers){

Object.assign(

headers,

options.headers as Record<string,string>

)

}

/* Authorization */

if(token){

headers.Authorization=
`Bearer ${token}`

}

/* JSON SAFE */

if(

options.body &&

!headers['Content-Type'] &&

!(options.body instanceof FormData)

){

headers['Content-Type']=
'application/json'

}

/* FETCH */

const res=

await fetch(

url,

{
...options,
headers,
cache:'no-store'
}

)

/* AUTO LOGOUT */

if(res.status===401){

removeToken()

if(typeof window!=='undefined'){

window.location.href='/login'

}

throw new Error(
'UNAUTHORIZED'
)

}

return res

}

/* ==================================================
SECTION END
================================================== */
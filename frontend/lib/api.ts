// ==================================================
// SECTION CODE OUTPUT : BASE API FETCH
// ROLE : COMMON FETCH WRAPPER
// ROOT : frontend/lib/api.ts
// STATUS : PRODUCTION SAFE FINAL
// FIX : API PREFIX NORMALIZE + DOUBLE PREFIX BLOCK
// ==================================================


import {

buildApiUrl

} from './config'


// ==================================================
// SECTION 02 : TYPES
// ==================================================

export type ApiOptions={

method?:
'GET'|
'POST'|
'PATCH'|
'PUT'|
'DELETE'

body?:any

headers?:Record<string,string>

cache?:RequestCache

isForm?:boolean

}


// ==================================================
// SECTION 03 : TOKEN
// ==================================================

function getToken(){

if(typeof window==='undefined')
return null

return localStorage.getItem(
'accessToken'
)

}


// ==================================================
// SECTION 04 : URL BUILDER (FINAL CORRECT)
// ==================================================

function buildUrl(

url:string

){

if(url.startsWith('http'))
return url

return buildApiUrl(url)

}

// ==================================================
// SECTION 05 : BODY BUILDER
// ==================================================

function buildBody(

body:any,
isForm?:boolean

):BodyInit|undefined{

if(body===undefined)
return undefined

if(isForm)
return body as BodyInit

return JSON.stringify(body)

}


// ==================================================
// SECTION 06 : API FETCH
// ==================================================

export async function apiFetch<T=any>(

url:string,

options:ApiOptions={}

):Promise<T>{

const token=
getToken()

const headers:Record<string,string>={

...(options.isForm
?{}
:{
'Content-Type':
'application/json'
}),

...(options.headers||{})

}

if(token?.length){

headers.Authorization=

`Bearer ${token}`

}

let res:Response

try{

res=

await fetch(

buildUrl(url),

{

method:
options.method||'GET',

headers,

cache:
options.cache||'no-store',

body:
buildBody(
options.body,
options.isForm
)

}

)

}catch(error){

console.error(

'API NETWORK ERROR',

error

)

throw new Error(
'NETWORK ERROR'
)

}


// ==================================================
// SECTION 07 : AUTH FAIL (FIXED)
// ==================================================

if(res.status===401){

if(typeof window!=='undefined'){

localStorage.removeItem(
'accessToken'
)

/* redirect 제거 */

window.dispatchEvent(

new Event('auth-change')

)

}

throw new Error(
'Unauthorized'
)

}


// ==================================================
// SECTION 08 : RESPONSE PARSE
// ==================================================

let data:unknown=null

const text=

await res.text()

if(text){

try{

data=
JSON.parse(text)

}catch{

data=text

}

}


// ==================================================
// SECTION 09 : ERROR NORMALIZE
// ==================================================

if(!res.ok){

const err=

data as{

message?:string
error?:string

}

console.error(

'API ERROR',

{

url,

status:res.status,

data

}

)

throw new Error(

err?.message ||

err?.error ||

`API ERROR ${res.status}`

)

}


// ==================================================
// SECTION 10 : RETURN
// ==================================================

return data as T

}


// ==================================================
// SECTION END
// ==================================================

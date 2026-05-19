/* ==================================================
SECTION CODE OUTPUT : AUTH CORE FINAL SAFE
FILE : frontend/utils/auth.ts
ROLE : TOKEN STORAGE ONLY
STATUS : PRODUCTION SAFE
================================================== */


// SECTION 01 : TOKEN KEY

export const TOKEN_KEY=
'accessToken'


// SECTION 02 : SET TOKEN

export function setToken(

token:string

){

if(typeof window==='undefined')
return

localStorage.setItem(

TOKEN_KEY,

token

)

}


// SECTION 03 : GET TOKEN

export function getToken():

string|null{

if(typeof window==='undefined')
return null

return localStorage.getItem(

TOKEN_KEY

)

}


// SECTION 04 : REMOVE TOKEN

export function removeToken(){

if(typeof window==='undefined')
return

localStorage.removeItem(
TOKEN_KEY
)

localStorage.removeItem(
'userId'
)

localStorage.removeItem(
'profileType'
)

}


// SECTION 05 : AUTH STATE

export function isLoggedIn():

boolean{

return !!getToken()

}


/* ==================================================
SECTION END
================================================== */
// ==================================================
// SECTION CODE OUTPUT : FRONTEND CONFIG
// ROLE : API / MEDIA BASE URL CONFIG
// ROOT : frontend/lib/config.ts
// STATUS : PRODUCTION SAFE STRUCTURE
// FIX : PREFIX NORMALIZE + DOUBLE API BLOCK
// ==================================================


// ==================================================
// SECTION 01 : ENV BASE URL
// ==================================================

export const API_BASE_URL =

(
process.env.NEXT_PUBLIC_API_URL ||

'http://localhost:4000'

)
.replace(/\/$/,'')
.replace(/\/api$/,'')


// ==================================================
// SECTION 02 : API ROOT (BASE ONLY)
// ==================================================

export const API_ROOT =

API_BASE_URL


// ==================================================
// SECTION 03 : API PREFIX
// ==================================================

export const API_PREFIX =

'/api'


// ==================================================
// SECTION 04 : MEDIA ROOT
// ==================================================

export const MEDIA_ROOT =

API_BASE_URL + '/media'


// ==================================================
// SECTION 05 : CDN ROOT (FUTURE)
// ==================================================

export const CDN_ROOT =

process.env.NEXT_PUBLIC_CDN_URL ||

MEDIA_ROOT


// ==================================================
// SECTION 06 : TIMEOUT CONFIG
// ==================================================

export const API_TIMEOUT =

10000


// ==================================================
// SECTION 07 : DEFAULT HEADERS
// ==================================================

export const DEFAULT_HEADERS = {

'Content-Type':'application/json'

}


// ==================================================
// SECTION 08 : API URL BUILDER (FINAL SAFE)
// ==================================================

export function buildApiUrl(

path:string

){

if(!path)
return API_ROOT + API_PREFIX

let cleanPath=

path.startsWith('/')
?path
:'/'+path


/* remove existing api prefix */

cleanPath=

cleanPath.replace(
/^\/api/,
''
)


/* ensure single prefix */

cleanPath=

API_PREFIX + cleanPath


/* remove double slash */

cleanPath=

cleanPath.replace(
/\/{2,}/g,
'/'
)


return API_ROOT + cleanPath

}


// ==================================================
// SECTION 09 : MEDIA URL BUILDER
// ==================================================

export function buildMediaUrl(

filePath:string

){

if(!filePath)
return ''

const clean=

filePath
.trim()
.replace(/^\/api\/media\//,'')
.replace(/^api\/media\//,'')
.replace(/^\/media\//,'')
.replace(/^media\//,'')
.replace(/^\/uploads\//,'')
.replace(/^uploads\//,'')
.replace(/^\/+/,'')
.replace(/\/{2,}/g,'/')

return MEDIA_ROOT + '/' + clean

}


// ==================================================
// SECTION END
// ==================================================

// ==================================================
// SECTION CODE OUTPUT : MEDIA HELPER
// ROLE : MEDIA URL BUILDER / MEDIA UTIL
// ROOT : frontend/lib/media.ts
// STATUS : PRODUCTION SAFE FINAL
// ==================================================


// ==================================================
// SECTION 01 : IMPORT
// ==================================================

import{

MEDIA_ROOT,
CDN_ROOT

}from'./config'


// ==================================================
// SECTION 02 : TYPES
// ==================================================

export type MediaAsset={

id:number

filePath:string

usageType:
'avatar'|
'hero'|
'post'|
'gallery'

}


// ==================================================
// SECTION 03 : MEDIA URL BUILDER
// ==================================================

export function mediaUrl(

filePath?:string|null

){

if(!filePath)
return ''

if(filePath.startsWith('http'))
return filePath

const cleanPath =

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

return MEDIA_ROOT+'/'+cleanPath

}


// ==================================================
// SECTION 04 : CDN URL BUILDER (FUTURE)
// ==================================================

export function mediaCdnUrl(

filePath?:string|null

){

if(!filePath)
return ''

if(filePath.startsWith('http'))
return filePath

const cleanPath =

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

return CDN_ROOT+'/'+cleanPath

}


// ==================================================
// SECTION 05 : AVATAR FALLBACK
// ==================================================

export function avatarUrl(

filePath?:string|null

){

if(!filePath){

return '/images/default-avatar.webp'

}

return mediaUrl(filePath)

}


// ==================================================
// SECTION 06 : HERO FALLBACK
// ==================================================

export function heroUrl(

filePath?:string|null

){

if(!filePath){

return '/images/default-hero.webp'

}

return mediaUrl(filePath)

}


// ==================================================
// SECTION 07 : MULTI IMAGE MAP
// ==================================================

export function mediaList(

files?:(string|null)[]

){

if(!files)
return[]

return files
.filter(Boolean)
.map(mediaUrl)

}


// ==================================================
// SECTION 08 : FILE TYPE CHECK
// ==================================================

export function isImage(

mime?:string

){

if(!mime)
return false

return mime.startsWith(
'image/'
)

}


export function isVideo(

mime?:string

){

if(!mime)
return false

return mime.startsWith(
'video/'
)

}


// ==================================================
// SECTION 09 : USAGE TYPE CHECK
// ==================================================

export function isAvatar(

usageType?:string

){

return usageType==='avatar'

}

export function isPost(

usageType?:string

){

return usageType==='post'

}


// ==================================================
// SECTION END
// ==================================================

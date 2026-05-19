'use client'

/* ==================================================
SECTION CODE OUTPUT : PERSONAL PHOTOS
ROLE : PROFILE GALLERY VIEW
ROOT : frontend/components/profile/PersonalPhotos.tsx

STATUS : PRODUCTION SAFE FINAL

RULE :
API LAYER ONLY
RAW FETCH 금지
PROFILE DOMAIN API ONLY
MEDIA DOMAIN DIRECT ACCESS 금지
================================================== */


/* ==================================================
SECTION 01 IMPORT
================================================== */

import{

useEffect,
useState

}from'react'

import{

useRouter

}from'next/navigation'

import{

getMyProfile,
getMyGallery

}from'@/lib/profileApi'


/* ==================================================
SECTION 02 TYPES
================================================== */

type PhotoItem={

id:number
imageUrl:string
createdAt:string

}

type HeroMap=

Record<number,number>


/* ==================================================
SECTION 03 STYLES (TS SAFE POSITION)
================================================== */

const wrapperStyle:React.CSSProperties={

paddingTop:0

}

const gridStyle:React.CSSProperties={

display:'grid',

gridTemplateColumns:
'repeat(3,1fr)',

gap:8

}

const cardStyle:React.CSSProperties={

position:'relative',

width:'100%',

aspectRatio:'1/1',

overflow:'hidden'

}

const badgeStyle:React.CSSProperties={

position:'absolute',

bottom:6,

left:6,

padding:'4px 8px',

borderRadius:6,

background:
'rgba(24,119,242,0.9)',

color:'#fff',

fontSize:12,

fontWeight:600,

zIndex:10

}

const loadingStyle:React.CSSProperties={

padding:20

}

const emptyStyle:React.CSSProperties={

padding:20

}


/* ==================================================
SECTION 04 COMPONENT
================================================== */

export default function PersonalPhotos(){

const router=
useRouter()

const[photos,
setPhotos]=
useState<PhotoItem[]>([])

const[heroMap,
setHeroMap]=
useState<HeroMap>({})

const[profilePhotoId,
setProfilePhotoId]=
useState<number|null>(null)

const[loading,
setLoading]=
useState(true)


/* ==================================================
SECTION 05 LOAD DATA
================================================== */

useEffect(()=>{

const load=async()=>{

try{

setLoading(true)

const[

profileData,
galleryData

]=

await Promise.all([

getMyProfile(),
getMyGallery()

])

/* HERO MAP */

const heroes=

profileData?.
profile?.
heroImages || []

const map:HeroMap={}

heroes.forEach((h:any)=>{

if(h?.imageAssetId)

map[
h.imageAssetId
]=

h.sortOrder || 0

})

setHeroMap(map)

/* AVATAR */

setProfilePhotoId(

profileData?.
profile?.
avatar?.
imageAssetId

|| null

)

/* GALLERY */

const gallery=

galleryData?.
gallery || []

const normalized=

gallery.map((g:any)=>({

id:
g.imageAssetId,

imageUrl:
g.imageUrl,

createdAt:
g.createdAt||''

}))

setPhotos(normalized)

}catch(error){

console.error(
'gallery load fail',
error
)

setPhotos([])

}

finally{

setLoading(false)

}

}

load()

},[])


/* ==================================================
SECTION 06 ACTIONS
================================================== */

const openViewer=(

index:number

)=>{

router.push(

`/profile/general/photo/${photos[index].id}?index=${index}`

)

}


/* ==================================================
SECTION 07 RENDER
================================================== */

if(loading){

return(

<div style={loadingStyle}>

로딩중...

</div>

)

}

if(!photos.length){

return(

<div style={emptyStyle}>

업로드된 사진이 없습니다.

</div>

)

}

return(

<div style={wrapperStyle}>

<div style={gridStyle}>

{photos.map((photo,idx)=>{

const heroOrder=
heroMap[photo.id]

const isProfile=
profilePhotoId===photo.id

return(

<div
key={photo.id}
style={cardStyle}
>

{/* BADGE */}

{isProfile?

<div style={badgeStyle}>
프로필
</div>

:heroOrder!==undefined?

<div style={badgeStyle}>
대표 {heroOrder+1}
</div>

:null}


{/* IMAGE */}

<div

onClick={()=>
openViewer(idx)
}

style={{

width:'100%',

height:'100%',

backgroundImage:
`url('${photo.imageUrl}')`,

backgroundSize:'cover',

backgroundPosition:'center',

borderRadius:12,

cursor:'pointer'

}}

>

</div>

</div>

)

})}

</div>

</div>

)

}


/* ==================================================
SECTION END
================================================== */
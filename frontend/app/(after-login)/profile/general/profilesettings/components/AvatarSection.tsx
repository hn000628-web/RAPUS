'use client'

/* ==================================================
FILE : AvatarSection.tsx
ROOT : frontend/app/(after-login)/settings/profile/general/components/AvatarSection.tsx
STATUS : FINAL PRODUCTION STABLE
ROLE :
avatar 항상 표시
cache safe
thumb progressive
blur fallback
Next dev bug safe
no invisible state
================================================== */

import { useRouter } from 'next/navigation'

import {
useState,
useEffect
} from 'react'

import type { CSSProperties } from 'react'

/* ==================================================
SECTION 01 TYPE
================================================== */

type Props={

imageUrl:string | null

previewUrl?:string | null

editable?:boolean

blurData?:string

thumbUrl?:string

}

/* ==================================================
SECTION 02 COMPONENT
================================================== */

export default function AvatarSection({

imageUrl,
previewUrl,
editable=false,
blurData,
thumbUrl

}:Props){

const router=useRouter()

/* ==================================================
SECTION 03 STATE
================================================== */

const DEFAULT_AVATAR=
'/images/defaults/default-avatar.webp'

const [src,setSrc]=
useState(DEFAULT_AVATAR)

const [mainLoaded,setMainLoaded]=
useState(false)

const [thumbLoaded,setThumbLoaded]=
useState(false)

const [loading,setLoading]=
useState(true)

/* ==================================================
SECTION 04 SOURCE SELECT (SAFE)
================================================== */

useEffect(()=>{

let next=DEFAULT_AVATAR

if(previewUrl && previewUrl.trim()!==''){

next=previewUrl

}else
if(imageUrl && imageUrl.trim()!==''){

next=imageUrl

}

setSrc(next)

setMainLoaded(false)

setThumbLoaded(false)

setLoading(true)

},[
imageUrl,
previewUrl
])

/* ==================================================
SECTION 05 CLICK
================================================== */

function handleClick(){

if(!editable)
return

router.push(
'/profile/general/profilesettings/avatar'
)

}

/* ==================================================
SECTION 06 STYLE
================================================== */

const wrapperStyle:CSSProperties={

position:'absolute',

left:'50%',

bottom:-48,

transform:'translateX(-50%)',

width:104,

height:104,

borderRadius:'50%',

background:'#e5e7eb',

border:'4px solid #fff',

boxShadow:
'0 10px 30px rgba(0,0,0,0.15)',

overflow:'hidden',

cursor:
editable?'pointer':'default',

transition:'transform .15s'

}

/* main 항상 보이게 */

const mainStyle:CSSProperties={

position:'absolute',

width:'100%',

height:'100%',

objectFit:'cover',

opacity:1,

transition:'opacity .2s'

}

/* thumb는 main 로드 전만 */

const thumbStyle:CSSProperties={

position:'absolute',

width:'100%',

height:'100%',

objectFit:'cover',

opacity:
thumbLoaded && !mainLoaded
?1
:0,

transition:'opacity .25s'

}

const blurStyle:CSSProperties={

position:'absolute',

width:'100%',

height:'100%',

objectFit:'cover',

filter:'blur(18px)',

transform:'scale(1.25)',

opacity:
!thumbLoaded && !mainLoaded
?1
:0,

transition:'opacity .25s'

}

const skeletonStyle:CSSProperties={

position:'absolute',

width:'100%',

height:'100%',

background:
'linear-gradient(90deg,#eee,#f5f5f5,#eee)',

backgroundSize:'200% 100%',

animation:
'avatarShimmer 1.4s linear infinite',

opacity:
loading?1:0,

transition:'opacity .2s'

}

/* ==================================================
SECTION 07 RETURN
================================================== */

return(

<div

onClick={handleClick}

style={wrapperStyle}

>

{/* skeleton */}

<div style={skeletonStyle}/>

{/* blur */}

{

blurData && (

<img

src={blurData}

style={blurStyle}

/>

)

}

{/* thumb */}

{

thumbUrl && (

<img

src={thumbUrl}

onLoad={()=>{

setThumbLoaded(true)

}}

style={thumbStyle}

/>

)

}

{/* main */}

<img

src={src}

loading="eager"

decoding="async"

onLoad={()=>{

setMainLoaded(true)

setLoading(false)

}}

onError={()=>{

setSrc(DEFAULT_AVATAR)

setMainLoaded(true)

setLoading(false)

}}

style={mainStyle}

/>

<style jsx>{

`

@keyframes avatarShimmer{

0%{
background-position:-200% 0;
}

100%{
background-position:200% 0;
}

}

`

}</style>

</div>

)

}
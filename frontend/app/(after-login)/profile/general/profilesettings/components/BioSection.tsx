//FILE: frontend/app/(after-login)/settings/profile/general/BioSection.tsx
'use client'

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import {useState} from 'react'

/* ==================================================
SECTION 02 : TYPE
================================================== */

type Props={
bio:string
onChange:(value:string)=>void
}

/* ==================================================
SECTION 03 : COMPONENT
================================================== */

export default function BioSection({
bio,
onChange
}:Props){

/* ==================================================
SECTION 04 : STATE
================================================== */

const [focus,setFocus]=
useState(false)

/* ==================================================
SECTION 05 : EVENT
================================================== */

const handleChange=(
e:React.ChangeEvent<
HTMLTextAreaElement
>
)=>{

onChange(
e.target.value
)

}

/* ==================================================
SECTION 06 : UI
================================================== */

return(

<div
style={{

marginTop:24

}}
>

{/* LABEL */}

<div
style={{

fontSize:14,
fontWeight:600,
marginBottom:8,
color:'#333'

}}
>
소개
</div>

{/* TEXTAREA */}

<textarea

value={bio}

onChange={handleChange}

onFocus={()=>
setFocus(true)
}

onBlur={()=>
setFocus(false)
}

maxLength={300}

placeholder='자기소개를 입력하세요'

style={{

display:'block',

width:'100%',

minHeight:56,
height:96,

padding:'14px 16px',

borderRadius:12,

border:

focus
?'1px solid #2563eb'
:'1px solid #d1d5db',

fontSize:14,

resize:'vertical',

outline:'none',

transition:'0.15s',

background:'white',

lineHeight:1.4,

boxSizing:'border-box'   /* ← 핵심 수정 */

}}

/>

{/* COUNT */}

<div
style={{

fontSize:12,
color:'#9ca3af',
textAlign:'right',
marginTop:4

}}
>
{bio.length}/300
</div>

</div>

)

}
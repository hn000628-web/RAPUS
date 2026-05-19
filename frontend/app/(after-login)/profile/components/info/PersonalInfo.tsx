// FILE: frontend/app/(after-login)/profile/components/info/PersonalInfo.tsx

'use client'

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import React,{useMemo}from'react'

/* ==================================================
SECTION 02 : TYPES (DB SYNC)
================================================== */

type ProfileBlock={
id:number
type:'TEXT'|'LINK'
title:string
content?:string|null
url?:string|null
description?:string|null
sortOrder:number
}

type PersonalInfoProps={
bio?:string|null
sections?:ProfileBlock[]|null
}

/* ==================================================
SECTION 03 : COMPONENT
================================================== */

export default function PersonalInfo({bio,sections}:PersonalInfoProps){

const safeSections=sections??[]

const hasBio=!!bio&&bio.trim()!==''

/* ==================================================
SECTION 04 : SORT
================================================== */

const sortedSections=useMemo(()=>{

return safeSections
.slice()
.sort((a,b)=>a.sortOrder-b.sortOrder)

},[safeSections])

/* ==================================================
SECTION 05 : FILTER
================================================== */

const validSections=sortedSections.filter(s=>
s.title?.trim()||
s.content?.trim()||
s.url?.trim()||
s.description?.trim()
)

const hasSections=validSections.length>0

if(!hasBio&&!hasSections) return null

/* ==================================================
SECTION 06 : RENDER
================================================== */

return(

<div style={containerStyle}>

{/* ================= BIO ================= */}

{hasBio&&(
<Section title="소개">
<p style={textStyle}>{bio}</p>
</Section>
)}

{/* ================= BLOCKS ================= */}

{validSections.map(section=>(

<Section
key={section.id}
title={section.title?.trim()||'제목 없음'}
>

{/* TEXT */}
{section.type==='TEXT'&&section.content&&(
<p style={textStyle}>{section.content}</p>
)}

{/* LINK */}
{section.type==='LINK'&&(

<>

{section.url&&(
<a
href={section.url}
target="_blank"
rel="noopener noreferrer"
style={linkStyle}

onMouseEnter={(e)=>{
e.currentTarget.style.textDecoration='underline'
}}

onMouseLeave={(e)=>{
e.currentTarget.style.textDecoration='none'
}}

>
{section.url}
</a>
)}

{section.description&&(
<p style={textStyle}>{section.description}</p>
)}

</>

)}

</Section>

))}

</div>

)

}

/* ==================================================
SECTION 07 : SECTION COMPONENT
================================================== */

function Section({

title,
children

}:{
title:string
children:React.ReactNode
}){

return(

<div

style={sectionStyle}

onMouseEnter={(e)=>{
e.currentTarget.style.boxShadow='0 4px 10px rgba(0,0,0,0.08)'
}}

onMouseLeave={(e)=>{
e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.04)'
}}

>

<div style={titleStyle}>
{title}
</div>

{children}

</div>

)

}

/* ==================================================
SECTION 08 : STYLE
================================================== */

const containerStyle:React.CSSProperties={
display:'flex',
flexDirection:'column',
gap:16
}

/* 🔥 핵심 카드 UI */
const sectionStyle:React.CSSProperties={

background:'#fff',

padding:16,

borderRadius:12,

border:'1px solid #e4e6eb',

boxShadow:'0 1px 2px rgba(0,0,0,0.04)',

transition:'all 0.2s'

}

const titleStyle:React.CSSProperties={
fontSize:15,
fontWeight:700,
marginBottom:10
}

const textStyle:React.CSSProperties={
fontSize:14,
color:'#555',
lineHeight:1.6
}

const linkStyle:React.CSSProperties={
fontSize:13,
color:'#1877f2',
textDecoration:'none',
wordBreak:'break-all'
}
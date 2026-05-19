'use client'

import React,{
CSSProperties,
ReactNode,
useEffect
}from'react'

type ModalProps={

open:boolean

type:
'success'|
'error'|
'warning'|
'info'|
'confirm'

title:string

description?:string

confirmText?:string

onClose:()=>void

autoClose?:boolean

duration?:number

children?:ReactNode

footer?:ReactNode

hideDefaultButton?:boolean

showCloseButton?:boolean

hideIcon?:boolean

panelStyle?:CSSProperties

bodyStyle?:CSSProperties

}

export default function BaseModal({

open,
type,
title,
description,
confirmText='확인',
onClose,
autoClose=true,
duration=2000,
children,
footer,
hideDefaultButton=false,
showCloseButton=false,
hideIcon=false,
panelStyle,
bodyStyle

}:ModalProps){

useEffect(()=>{

if(!open) return

if(autoClose && type==='success'){

const timer=setTimeout(

onClose,
duration

)

return()=>clearTimeout(timer)

}

},[open,type,autoClose,duration,onClose])

if(!open)
return null

const colors:Record<string,string>={

success:'#22c55e',

error:'#ef4444',

warning:'#f59e0b',

info:'#3b82f6',

confirm:'#64748b'

}

return(

<div style={overlayStyle}>

<div style={{
...cardStyle,
...panelStyle
}}>

{showCloseButton&&(

<button

type="button"

onClick={onClose}

style={closeButtonStyle}

aria-label="Close modal"

>

×

</button>

)}

{!hideIcon&&(

<div style={iconStyle(colors[type])}>

{type==='error'?'!':
type==='warning'?'!':
type==='info'?'i':
'✓'}

</div>

)}

<div style={titleStyle}>
{title}
</div>

{description&&(

<div style={descStyle}>
{description}
</div>

)}

{children&&(

<div style={{
width:'100%',
...bodyStyle
}}>
{children}
</div>

)}

{footer}

{!hideDefaultButton&&(

<button

onClick={onClose}

style={buttonStyle}

>

{confirmText}

</button>

)}

</div>

</div>

)

}

/* ==================================================
STYLES (CSSProperties SAFE)
================================================== */

const overlayStyle:CSSProperties={

position:'fixed',

top:0,
left:0,
right:0,
bottom:0,

background:'rgba(0,0,0,0.45)',

display:'flex',

alignItems:'center',

justifyContent:'center',

zIndex:9999

}

const cardStyle:CSSProperties={

position:'relative',

width:320,

minHeight:220,

borderRadius:22,

padding:'32px 28px',

background:'#fff',

display:'flex',

flexDirection:'column',

gap:18,

alignItems:'center',

boxShadow:'0 30px 80px rgba(0,0,0,0.25)'

}

const closeButtonStyle:CSSProperties={

position:'absolute',

top:14,

right:14,

width:34,

height:34,

border:'1px solid #d1d5db',

borderRadius:10,

background:'#fff',

color:'#111827',

fontSize:22,

fontWeight:800,

lineHeight:1,

cursor:'pointer'

}

const iconStyle=(color:string):CSSProperties=>({

width:56,

height:56,

borderRadius:28,

background:color,

display:'flex',

alignItems:'center',

justifyContent:'center',

color:'#fff',

fontSize:26,

fontWeight:800

})

const titleStyle:CSSProperties={

fontSize:18,

fontWeight:700,

color:'#111',

textAlign:'center'

}

const descStyle:CSSProperties={

fontSize:14,

color:'#666',

textAlign:'center'

}

const buttonStyle:CSSProperties={

height:44,

padding:'0 20px',

borderRadius:12,

border:'none',

background:'#2563eb',

color:'#fff',

fontSize:15,

fontWeight:600,

cursor:'pointer'

}

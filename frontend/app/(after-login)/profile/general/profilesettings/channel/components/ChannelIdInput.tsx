// FILE: frontend/app/settings/profile/channel/components/ChannelIdInput.tsx

"use client"

/* ==================================================
SECTION CODE OUTPUT : CHANNEL ID INPUT
ROLE : CHANNEL ID INPUT UI ONLY
ROOT : frontend/app/settings/profile/channel/components/ChannelIdInput.tsx
STATUS : DISPLAYNAME FALLBACK SUPPORT
FIX :
displayName fallback
empty → auto nickname switch
SPACE → _
MAX LENGTH 30
IME SAFE INPUT
LIVE LENGTH
STRICT TS SAFE
================================================== */

/* ==================================================
SECTION 01 TYPE
================================================== */

type Props={

value:string | null

displayName:string

onChange:(

value:string | null

)=>void

}

/* ==================================================
SECTION 02 CONSTANT
================================================== */

const MAX_LENGTH=30

/* ==================================================
SECTION 03 EVENT WRAPPER
================================================== */

function handleInputChange(

e:React.ChangeEvent<HTMLInputElement>,

onChange:(value:string | null)=>void

){

let v=e.target.value

/* SPACE → _ */

v=v.replace(/\s+/g,"_")

/* __ 제거 */

v=v.replace(/_{2,}/g,"_")

/* MAX LIMIT SAFETY */

if(v.length>MAX_LENGTH){

v=v.slice(0,MAX_LENGTH)

}

/* EMPTY → NULL */

if(v.trim()===""){

onChange(null)

return

}

onChange(v)

}

/* ==================================================
SECTION 04 COMPONENT (FINAL INPUT CONTROL FIX)
================================================== */

export default function ChannelIdInput({

value,

displayName,

onChange

}:Props){

/* value only channelId */

const safeValue=

value ??

""

return(

<div style={{

background:"#edf2f7",

borderRadius:18,

padding:24,

display:"flex",

flexDirection:"column",

gap:14

}}>

<div style={{

fontSize:13,

color:"#64748b"

}}>

채널 ID (삭제시 닉네임 자동 적용)

</div>

<input

value={safeValue}

onChange={(e)=>handleInputChange(e,onChange)}

maxLength={MAX_LENGTH}

/* displayName은 placeholder만 */

placeholder={

displayName ||

"닉네임 자동 사용 (변경 가능)"

}

autoComplete="off"

spellCheck={false}

style={{

width:"100%",

height:52,

padding:"0 16px",

borderRadius:14,

border:"none",

background:"#dfe6ef",

fontSize:15,

fontWeight:500,

color:"#334155",

boxSizing:"border-box",

outline:"none"

}}

/>

<div style={{

fontSize:12,

color:"#64748b",

textAlign:"right"

}}>

{safeValue.length} / {MAX_LENGTH}

</div>

</div>

)

}
// FILE: frontend/app/(after-login)/settings/profile/channel/components/ChannelCodeBox.tsx

"use client"

/* ==================================================
SECTION CODE OUTPUT : CHANNEL CODE BOX FINAL
ROLE : CHANNEL CODE + URL MANAGEMENT
ROOT : frontend/app/(after-login)/settings/profile/channel/components/ChannelCodeBox.tsx
STATUS : CHANNEL CODE READ ONLY POLICY
FIX :
channelName 없으면 displayName 사용
기본 URL = /CODE/@닉네임
channelCode READ ONLY 정책 적용
create/delete UI 비활성 처리
STRICT TS SAFE
================================================== */

/* ==================================================
SECTION 01 IMPORT
================================================== */

import type { ChannelState } from "../page"

/* ==================================================
SECTION 02 TYPE
================================================== */

type Props={

channel:ChannelState

loading:boolean

copied:boolean

formatChannelCode:(code:string)=>string

handleCreate:()=>void

handleDelete:()=>void

handleCopy:()=>void

}

/* ==================================================
SECTION 03 COMPONENT
================================================== */

export default function ChannelCodeBox({

channel,

loading,

copied,

formatChannelCode,

handleCreate,

handleDelete,

handleCopy

}:Props){

/* ==================================================
SECTION 04 DISPLAY ID (FINAL POLICY)
================================================== */

const displayId=

channel.channelName ||

channel.displayName

/* ==================================================
SECTION 05 URL BUILD
================================================== */

const channelURL=

channel.channelCode

?

`xxx.com/${channel.channelCode}/@${displayId}`

:

"코드 생성 필요"

/* ==================================================
SECTION 06 RETURN
================================================== */

return(

<div style={{

background:"#edf2f7",

borderRadius:18,

padding:24,

display:"flex",

flexDirection:"column",

gap:16

}}>

<div style={{

fontSize:13,

color:"#64748b"

}}>

채널 코드 (내부 고정 ID)

</div>

<div style={{

fontSize:18,

fontWeight:600

}}>

{

channel.channelCode

?

formatChannelCode(channel.channelCode)

:

"채널 없음"

}

</div>

{/* ==================================================
SECTION 07 BUTTON BLOCK (DISABLED POLICY)
채널코드 생성/삭제 금지 정책으로 UI 숨김
================================================== */}

{

false && (

<div style={{

display:"grid",

gridTemplateColumns:"1fr 1fr",

gap:12

}}>

<button

onClick={handleCreate}

disabled={

true

}

style={{

height:48,

borderRadius:14,

border:"none",

fontWeight:600,

background:"#d1d5db",

color:"#6b7280",

cursor:"not-allowed",

transition:"0.2s"

}}

>

코드 생성

</button>

<button

onClick={handleDelete}

disabled={

true

}

style={{

height:48,

borderRadius:14,

border:"none",

fontWeight:600,

background:"#e5e7eb",

color:"#9ca3af",

cursor:"not-allowed"

}}

>

코드 삭제

</button>

</div>

)

}

<div style={{

fontSize:13,

color:"#64748b"

}}>

채널 URL

</div>

<div style={{

fontSize:15,

fontWeight:600

}}>

{channelURL}

</div>

<button

onClick={handleCopy}

disabled={!channel.channelCode}

style={{

height:48,

borderRadius:14,

border:"none",

fontWeight:600,

background:

channel.channelCode

?

"#22c55e"

:

"#d1d5db",

color:

channel.channelCode

?

"white"

:

"#6b7280",

cursor:

channel.channelCode

?

"pointer"

:

"not-allowed"

}}

>

URL 복사

</button>

{

copied && (

<div style={{

fontSize:13,

color:"#22c55e"

}}>

복사됨

</div>

)

}

</div>

)

}

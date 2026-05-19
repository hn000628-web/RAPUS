// FILE: frontend/app/settings/profile/channel/components/ChannelFooter.tsx

"use client"

/* ==================================================
SECTION CODE OUTPUT : CHANNEL FOOTER SAVE BUTTON
ROLE : CHANNEL SAVE BUTTON UI
ROOT : frontend/app/settings/profile/channel/components/ChannelFooter.tsx
STATUS : NULL CHANNEL ID SAVE SUPPORT
FIX :
channelId optional
null save allowed
validation remove
LOADING LOCK ONLY
STRICT TS SAFE
================================================== */

/* ==================================================
SECTION 01 TYPE
================================================== */

type Props={

channelId:string | null

loading:boolean

handleSave:()=>void

}

/* ==================================================
SECTION 02 COMPONENT
================================================== */

export default function ChannelFooter({

channelId,

loading,

handleSave

}:Props){

/* ==================================================
SECTION 03 STATE DERIVED
================================================== */

const disabled=

loading

/* ==================================================
SECTION 04 RETURN
================================================== */

return(

<>

<button

onClick={handleSave}

disabled={disabled}

style={{

height:52,

borderRadius:18,

border:"none",

fontSize:16,

fontWeight:700,

background:

disabled

?

"#d1d5db"

:

"#22c55e",

color:

disabled

?

"#6b7280"

:

"white",

cursor:

disabled

?

"not-allowed"

:

"pointer",

transition:"0.2s"

}}

>

{

loading

?

"저장중"

:

"설정 저장"

}

</button>

</>

)

}
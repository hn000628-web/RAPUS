// FILE: frontend/app/(after-login)/settings/profile/general/components/BasicAccountSection.tsx
'use client';

/* ==================================================
SECTION CODE OUTPUT : BASIC ACCOUNT SECTION
ROLE : PROFILE BASIC SETTINGS ONLY
ROOT : frontend/app/(after-login)/settings/profile/general/components/BasicAccountSection.tsx
FIX :
QR REMOVED (CHANNEL DOMAIN)
PROFILE ONLY POLICY
CHANNEL URL DISPLAY ONLY
STRICT TS SAFE
================================================== */

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';

type Props={

displayName:string

setDisplayName:(v:string)=>void

slug:string

setSlug:(v:string)=>void

regionName:string | null

channelCode:string | null

channelId:string | null

moveChannelManage:()=>void

};

export default function BasicAccountSection({

displayName,

setDisplayName,

slug,

setSlug,

regionName,

channelCode,

channelId,

moveChannelManage

}:Props){

const router=useRouter()

const INPUT_HEIGHT=48

const RADIUS=12

const BORDER='1px solid #e5e7eb'

const sectionStyle:CSSProperties={
marginBottom:24
}

const labelStyle:CSSProperties={
fontSize:14,
fontWeight:500
}

const inputStyle:CSSProperties={

width:'100%',

height:INPUT_HEIGHT,

padding:'0 16px',

marginTop:8,

borderRadius:RADIUS,

border:BORDER,

boxSizing:'border-box',

fontSize:14,

outline:'none'

}

const slugBox:CSSProperties={

...inputStyle,

display:'flex',

alignItems:'center',

justifyContent:'space-between',

padding:'0 8px 0 12px'

}

const slugLeft:CSSProperties={

display:'flex',

alignItems:'center',

flex:1

}

const prefixStyle:CSSProperties={

fontSize:14,

color:'#666',

marginRight:4,

whiteSpace:'nowrap'

}

const slugInput:CSSProperties={

flex:1,

border:'none',

height:'100%',

fontSize:14,

outline:'none',

padding:'0 12px'

}

const channelBtn:CSSProperties={

height:32,

padding:'0 14px',

border:'1px solid #d1d5db',

background:'#f9fafb',

borderRadius:8,

fontSize:13,

fontWeight:600,

cursor:'pointer',

whiteSpace:'nowrap'

}

/* CHANNEL POLICY */

const safeChannelCode=

channelCode && channelCode.trim()!==''

? channelCode

: null

const safeChannelName=

slug && slug.trim()!==''

? slug

: null

const displayChannelName=

safeChannelName ||

safeChannelCode ||

''

return(

<>

<div style={sectionStyle}>

<label style={labelStyle}>
닉네임
</label>

<input
type="text"
value={displayName}
onChange={(e)=>
setDisplayName(e.target.value)
}
style={inputStyle}
/>

</div>

<div style={sectionStyle}>

<label style={labelStyle}>
프로필 주소
</label>

<div style={slugBox}>

<div style={slugLeft}>

<span style={prefixStyle}>
xxx.com/@
</span>

<input

type="text"

value={displayChannelName}

onChange={(e)=>{

const v=e.target.value
.replace('@','')
.replace(/\s/g,'')

setSlug(v)

}}

style={slugInput}

placeholder="channel-name"

/>

</div>

<button

type="button"

onClick={moveChannelManage}

style={channelBtn}

>

채널관리

</button>

</div>

</div>

<div style={sectionStyle}>

<label style={labelStyle}>
지역설정
</label>

<div style={{

...inputStyle,

display:'flex',

alignItems:'center',

justifyContent:'space-between'

}}>

<span>

{regionName ?? '지역 미설정'}

</span>

<button

type="button"

onClick={()=>

router.push('/profile/general/profilesettings/region')

}

style={{

border:'none',

background:'transparent',

color:'#1877f2',

fontWeight:600,

cursor:'pointer'

}}

>

지역설정

</button>

</div>

</div>

</>

)

}
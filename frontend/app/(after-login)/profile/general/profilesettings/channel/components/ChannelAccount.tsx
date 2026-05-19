// FILE: frontend/app/settings/profile/channel/components/ChannelAccount.tsx

"use client"

type Props={

email:string

profileType:string

}

export default function ChannelAccount({

email,

profileType

}:Props){

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

계정

</div>

<input

value={`${email} (${profileType})`}

readOnly

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

lineHeight:"52px"

}}

/>

</div>

)

}
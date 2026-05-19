// FILE: frontend/app/settings/profile/channel/components/ChannelLayout.tsx

"use client"

type Props={

children:React.ReactNode

}

export default function ChannelLayout({

children

}:Props){

return(

<div style={{

minHeight:"100vh",

display:"flex",

justifyContent:"center",

alignItems:"center",

background:
"linear-gradient(135deg,#eef2f7,#d7dee8)"

}}>

<div style={{

width:420,

background:"#f4f6f9",

borderRadius:30,

padding:40,

boxShadow:
"0 20px 60px rgba(0,0,0,0.12)",

display:"flex",

flexDirection:"column",

gap:24

}}>

<h1 style={{

fontSize:30,

letterSpacing:2,

color:"#2f9aa3",

fontWeight:700,

textAlign:"center"

}}>

채널

</h1>

<div style={{

fontSize:13,

color:"#6b7a8c",

textAlign:"center"

}}>

채널 관리

</div>

{children}

</div>

</div>

)

}
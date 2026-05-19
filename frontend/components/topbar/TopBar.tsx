'use client'

import {
  useState,
  CSSProperties
} from 'react'

import {
  useRouter
} from 'next/navigation'

import ProfileMenu
from './ProfileMenu'

import ServiceMenu
from './ServiceMenu'

export default function TopBar(){

  const router=
  useRouter()

  const[openMenu,setOpenMenu]=
  useState(false)

  const[openService,setOpenService]=
  useState(false)

  const closeAll=()=>{

  setOpenMenu(false)

  setOpenService(false)

  }

  function goHome(){

  closeAll()

  router.push('/')

  }

  return(

  <>

  <div style={bar}>

  <div
  onClick={goHome}
  style={logo}
  >

  RAPUS

  </div>

  <div style={center}>

  </div>

  <div style={right}>

  <button
  onClick={()=>{

  setOpenService(!openService)

  setOpenMenu(false)

  }}
  style={iconStyle}
  aria-label="서비스 메뉴"
  >

  ◈

  </button>

  <button
  onClick={()=>{

  setOpenMenu(!openMenu)

  setOpenService(false)

  }}
  style={iconStyle}
  aria-label="프로필 메뉴"
  >

  ☰

  </button>

  {openService&&(

  <ServiceMenu
  onClose={closeAll}
  />

  )}

  {openMenu&&(

  <ProfileMenu
  onClose={closeAll}
  />

  )}

  </div>

  </div>
  </>

  )

}

const bar:CSSProperties={

position:'fixed',

top:0,

left:0,

right:0,

height:56,

background:'#fff',

display:'flex',

alignItems:'center',

justifyContent:'space-between',

padding:'0 16px',

zIndex:1000,

boxShadow:
'0 1px 6px rgba(0,0,0,0.06)'

}

const logo:CSSProperties={

fontWeight:900,

fontSize:22,

cursor:'pointer',

userSelect:'none',

letterSpacing:1,

lineHeight:1,

whiteSpace:'nowrap',

flexShrink:0

}

const center:CSSProperties={

display:'flex',

alignItems:'center'

}

const right:CSSProperties={

display:'flex',

gap:10,

alignItems:'center'

}

const iconStyle:CSSProperties={

border:'none',

background:'none',

fontSize:20,

cursor:'pointer',

padding:6,

borderRadius:8,

transition:'0.15s'

}

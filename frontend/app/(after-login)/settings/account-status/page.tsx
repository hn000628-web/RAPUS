'use client'

/* ==================================================
SECTION CODE OUTPUT : ACCOUNT STATUS PAGE FINAL
ROOT : frontend/app/(after-login)/settings/account-status/page.tsx
STATUS : RULE SAFE VERSION
FIX :
authFetch 제거
apiFetch 통일
/api prefix 제거
TS 오류 제거
================================================== */

/* ==================================================
SECTION 01 IMPORT
================================================== */

import { useEffect,useState } from 'react'

import { apiFetch }
from '@/lib/api'

import type { AccountStatus }
from '@/types/account'


/* ==================================================
SECTION 02 COMPONENT
================================================== */

export default function AccountStatusPage(){

const [account,setAccount]=
useState<AccountStatus|null>(null)

const [loading,setLoading]=
useState(true)


/* ==================================================
SECTION 03 LOAD
================================================== */

useEffect(()=>{

load()

},[])

async function load(){

try{

const data=
await apiFetch<AccountStatus>(

'account/status'

)

setAccount(data)

}catch{

setAccount(null)

}finally{

setLoading(false)

}

}


/* ==================================================
SECTION 04 UI
================================================== */

if(loading){

return(

<div style={{

padding:40,
textAlign:'center'

}}>

계정 정보 불러오는 중

</div>

)

}

if(!account){

return(

<div>

데이터 없음

</div>

)

}


/* ==================================================
SECTION 05 RETURN
================================================== */

return(

<div style={{

maxWidth:640,
margin:'0 auto',
padding:20

}}>

<div style={{

background:'white',
borderRadius:16,
padding:20,
boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
marginBottom:16

}}>

<h2 style={{

fontSize:20,
marginBottom:20

}}>

계정 정보

</h2>

<div style={{marginBottom:12}}>

<b>이메일 :</b> {account.email}

</div>

<div style={{marginBottom:12}}>

<b>채널코드 :</b> {account.profile.channelCode}

</div>

<div style={{marginBottom:12}}>

<b>계정 유형 :</b>

{

account.accountType==='BUSINESS'
?
' 비즈니스'
:
' 일반'

}

</div>

<div style={{marginBottom:12}}>

<b>상태 :</b> {account.status}

</div>

</div>

<div style={{

background:'white',
borderRadius:16,
padding:20,
boxShadow:'0 1px 3px rgba(0,0,0,0.08)'

}}>

<h2 style={{

fontSize:20,
marginBottom:20

}}>

보안 설정

</h2>

<div style={{

display:'flex',
justifyContent:'space-between',
marginBottom:16

}}>

<div>

비밀번호

</div>

<a href="/settings/account/security/password">

<button style={{

background:'#1877f2',
color:'white',
border:'none',
padding:'8px 14px',
borderRadius:8,
cursor:'pointer'

}}>

변경

</button>

</a>

</div>

<div style={{

display:'flex',
justifyContent:'space-between'

}}>

<div>

전화번호 (미등록)

</div>

<a href="/settings/account/security/phone">

<button style={{

background:'#22c55e',
color:'white',
border:'none',
padding:'8px 14px',
borderRadius:8,
cursor:'pointer'

}}>

등록

</button>

</a>

</div>

</div>

</div>

)

}

/* ==================================================
SECTION END
================================================== */
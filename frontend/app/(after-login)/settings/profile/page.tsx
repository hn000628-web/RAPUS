'use client'

/* ==================================================
SECTION CODE OUTPUT : PROFILE SETTINGS ROUTER FINAL
ROLE : PROFILE SETTINGS ROUTING
ROOT : frontend/app/(after-login)/settings/profile/page.tsx
STATUS : PRODUCTION SAFE VERSION
FIX :
direct fetch 제거
apiFetch 구조 통일
profiles 404 제거
routing 안정화
================================================== */


/* ==================================================
SECTION 01 IMPORT
================================================== */

import {useEffect}
from 'react'

import {useRouter}
from 'next/navigation'

import {
getToken,
removeToken
}
from '@/utils/auth'

import {
getMyProfile
}
from '@/lib/profileApi'


/* ==================================================
SECTION 02 COMPONENT
================================================== */

export default function ProfileSettingsRouter(){

const router=useRouter()

useEffect(()=>{

const token=
getToken()

if(!token){

router.replace('/')
return

}

let cancelled=false

const load=async()=>{

try{

/* PROFILE LOAD */

const data=
await getMyProfile()

if(cancelled)
return

/* RESPONSE CHECK */

if(!data?.ok){

router.replace(
'/profile/general/profilesettings'
)

return

}

/* PROFILE CHECK */

const profile=
data.profile||null

if(!profile){

router.replace(
'/settings/profile/general'
)

return

}

const type=

profile.profileType||
'GENERAL'


/* ==================================================
ROUTING
================================================== */

if(type==='BUSINESS'){

router.replace(
'/profile/business/settings'
)

return

}

/* DEFAULT */

router.replace(
'/settings/profile/general'
)

}catch(e){

console.error(
'PROFILE ROUTE FAIL',
e
)

/* ERROR FALLBACK */

router.replace(
'/settings/profile/general'
)

}

}

load()

return()=>{

cancelled=true

}

},[router])


/* ==================================================
SECTION END
================================================== */

return null

}
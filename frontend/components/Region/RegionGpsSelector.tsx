'use client'

// FILE : frontend/components/Region/RegionGpsSelector.tsx
// ROOT : frontend/components/Region/RegionGpsSelector.tsx
// ROLE : REGION GPS SELECTOR
// STATUS : PRODUCTION SAFE FINAL
// FIX :
// regionsApi 사용
// RegionContext sync 추가
// domain layer match
// backend contract safe
// global region state sync

// SECTION 01 : IMPORT

import type {

Region

}
from '@/types/region'

import {

getGpsRegion

}
from '@/lib/regionsApi'

import {

useRegion

}
from '@/components/Region/RegionContext'


// SECTION 02 : TYPE

type Props={

gpsLoading:boolean

setGpsLoading:(v:boolean)=>void

setSelectedRegion:(r:Region)=>void

setQuery:(v:string)=>void

}


// SECTION 03 : COMPONENT

export default function RegionGpsSelector({

gpsLoading,

setGpsLoading,

setSelectedRegion,

setQuery

}:Props){

const {

setRegion

}=useRegion()


// SECTION 04 : GPS HANDLER

async function handleGps(){

if(!navigator.geolocation){

alert('GPS not supported')

return

}

setGpsLoading(true)

navigator.geolocation.getCurrentPosition(

async pos=>{

try{

const lat=
pos.coords.latitude

const lng=
pos.coords.longitude


const data=

await getGpsRegion(

lat,
lng

)


if(data?.region){

const region:Region=

data.region


// local state

setSelectedRegion(
region
)

setQuery(

region.fullName

)


// global state

setRegion(
region
)

}

}catch(e){

console.error(

'GPS REGION ERROR',

e

)

}

setGpsLoading(false)

},

()=>{

alert('위치 권한 필요')

setGpsLoading(false)

}

)

}


// SECTION 05 : RETURN

return(

<button

onClick={handleGps}

disabled={gpsLoading}

style={{

width:'100%',

padding:12,

borderRadius:8,

border:'1px solid #ddd',

background:'#f5f5f5'

}}

>

{

gpsLoading

?'위치 찾는 중...'

:'현재 위치 사용'

}

</button>

)

}


// SECTION END
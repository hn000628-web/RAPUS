// FILE : frontend/context/RegionContext.tsx
// ROOT : frontend/context/RegionContext.tsx
// ROLE : REGION GLOBAL CONTEXT
// STATUS : PRODUCTION SAFE FINAL
// FIX :
// regionsApi 사용
// backend update sync 추가
// reload 구조 안정화
// region update API 연결
// domain state centralization

'use client'

// SECTION 01 : IMPORT

import {

createContext,
useContext,
useState,
useEffect

} from 'react'

import type {

Region

} from '@/types/region'

import {

getCurrentRegion,
updateMyRegion

}
from '@/lib/regionsApi'


// SECTION 02 : TYPE

type RegionContextType={

region:Region|null

setRegion:
(region:Region|null)=>void

reloadRegion:
()=>Promise<void>

updateRegion:
(region:Region|null)=>Promise<void>

}


// SECTION 03 : CONTEXT

const RegionContext=

createContext<
RegionContextType|null
>(null)


// SECTION 04 : PROVIDER

export function RegionProvider(

{children}:{

children:React.ReactNode

}

){

const[region,setRegion]=
useState<Region|null>(null)


// SECTION 05 : LOAD REGION

async function loadRegion(){

try{

const data=

await getCurrentRegion()

if(data?.region){

setRegion(
data.region
)

}

}catch(e){

console.error(

'region load fail',

e

)

}

}


// SECTION 06 : UPDATE REGION (DB + STATE)

async function updateRegion(

newRegion:Region|null

){

try{

await updateMyRegion(

newRegion?.id||null

)

setRegion(

newRegion

)

}catch(e){

console.error(

'region update fail',

e

)

}

}


// SECTION 07 : EFFECT

useEffect(()=>{

loadRegion()

},[])


// SECTION 08 : RELOAD

async function reloadRegion(){

await loadRegion()

}


// SECTION 09 : RETURN

return(

<RegionContext.Provider

value={{

region,

setRegion,

reloadRegion,

updateRegion

}}

>

{children}

</RegionContext.Provider>

)

}


// SECTION 10 : HOOK

export function useRegion(){

const ctx=

useContext(
RegionContext
)

if(!ctx){

throw new Error(

'useRegion must be used within RegionProvider'

)

}

return ctx

}


// SECTION END
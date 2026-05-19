'use client'

// FILE : frontend/components/Region/ProfileRegionContext.tsx
// ROLE : REGION CONTEXT WRAPPER (PROFILE)
// STATUS : PRODUCTION SAFE FINAL
// FIX :
// duplicate region state 제거
// RegionContext 사용
// direct fetch 제거
// import path 안정화
// domain single source 유지

// SECTION 01 : IMPORT

import {

createContext,
useContext

} from 'react'

import type {

Region

}
from '@/types/region'

import {

useRegion

}
from './RegionContext'


// SECTION 02 : TYPE

type ProfileRegionContextType={

profileRegion:Region|null

setProfileRegion:
(region:Region|null)=>Promise<void>

}


// SECTION 03 : CONTEXT

const ProfileRegionContext=

createContext<
ProfileRegionContextType|null
>(null)


// SECTION 04 : PROVIDER

export function ProfileRegionProvider(

{children}:{

children:React.ReactNode

}

){

const {

region,
updateRegion

}=useRegion()


return(

<ProfileRegionContext.Provider

value={{

profileRegion:region,

setProfileRegion:updateRegion

}}

>

{children}

</ProfileRegionContext.Provider>

)

}


// SECTION 05 : HOOK

export function useProfileRegion(){

const ctx=

useContext(
ProfileRegionContext
)

if(!ctx){

throw new Error(

'useProfileRegion must be used within ProfileRegionProvider'

)

}

return ctx

}


// SECTION END
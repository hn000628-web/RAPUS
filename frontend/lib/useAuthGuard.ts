// FILE : frontend/lib/useAuthGuard.ts
// ROLE : CLIENT AUTH GUARD

'use client'

import {useEffect}
from 'react'

import {useRouter}
from 'next/navigation'

import {getToken}
from '@/lib/authApi'

export function useAuthGuard(){

const router=
useRouter()

useEffect(()=>{

const token=
getToken()

if(!token){

router.replace('/')

}

},[router])

}
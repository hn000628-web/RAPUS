'use client'

import{
createContext,
useContext,
useEffect,
useState,
useMemo
}from'react'

import{
getMyProfile
}from'@/lib/profileApi'

/* ==================================================
SECTION 02 TYPES
================================================== */

// 🔥 내부 상태 타입
type Profile = {
  userId?:number
  profileId?:number
  profileType?:'GENERAL'|'BUSINESS'
  channelCode?:string
  displayName?:string
}

type AuthType={
  loading:boolean
  isLogin:boolean
  profile:Profile|null
  logout:()=>void
}

/* ==================================================
SECTION 03 CONTEXT
================================================== */

const AuthContext=
createContext<AuthType>({
  loading:true,
  isLogin:false,
  profile:null,
  logout:()=>{}
})

/* ==================================================
SECTION 04 PROVIDER
================================================== */

export function AuthProvider({
children
}:{children:React.ReactNode}){

const[loading,setLoading]=useState(true)
const[profile,setProfile]=useState<Profile|null>(null)
const[isLogin,setIsLogin]=useState(false)

/* =========================
LOAD AUTH
========================= */

useEffect(()=>{

let mounted=true

async function load(){

const token=
localStorage.getItem('accessToken')

if(!token){

if(!mounted)return

setProfile(null)
setIsLogin(false)
setLoading(false)

return
}

try{

const data=await getMyProfile()

if(!mounted)return

// 🔥 타입 분리 (핵심)
const p:any = data?.profile

const safeProfile:Profile={
  userId:p?.userId,
  profileId:p?.id, // API id → 내부 profileId
  profileType:p?.profileType,
  channelCode:p?.channelCode,
  displayName:p?.displayName ?? undefined // 🔥 null → undefined
}

setProfile(safeProfile)
setIsLogin(true)

}catch{

if(!mounted)return

setProfile(null)
setIsLogin(false)

}finally{

if(mounted){
setLoading(false)
}

}

}

load()

return()=>{
mounted=false
}

},[])

/* =========================
AUTH CHANGE SYNC
========================= */

useEffect(()=>{

async function onAuthChange(){

const token=
localStorage.getItem('accessToken')

if(!token){
setProfile(null)
setIsLogin(false)
return
}

try{

const data=await getMyProfile()

const p:any = data?.profile

const safeProfile:Profile={
  userId:p?.userId,
  profileId:p?.id,
  profileType:p?.profileType,
  channelCode:p?.channelCode,
  displayName:p?.displayName ?? undefined
}

setProfile(safeProfile)
setIsLogin(true)

}catch{
setProfile(null)
setIsLogin(false)
}

}

window.addEventListener('auth-change',onAuthChange)

return()=>{
window.removeEventListener('auth-change',onAuthChange)
}

},[])

/* =========================
LOGOUT
========================= */

const logout=()=>{

localStorage.removeItem('accessToken')

setProfile(null)
setIsLogin(false)

window.dispatchEvent(new Event('auth-change'))

}

/* =========================
CONTEXT VALUE
========================= */

const value=useMemo(()=>({
loading,
isLogin,
profile,
logout
}),[loading,isLogin,profile])

return(
<AuthContext.Provider value={value}>
{children}
</AuthContext.Provider>
)

}

/* ==================================================
SECTION 05 HOOK
================================================== */

export function useAuth(){
return useContext(AuthContext)
}
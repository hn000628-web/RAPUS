'use client'

import {useEffect,useState} from 'react'
import type{Region} from '@/types/region'

import RegionGpsSelector from '@/components/Region/RegionGpsSelector'
import RegionDbSelector from '@/components/Region/RegionDbSelector'
import {useRegion} from '@/components/Region/RegionContext'

import {
updateMyRegion,
clearMyRegion
} from '@/lib/regionsApi'

import {
getMyProfile
} from '@/lib/profileApi'

/* ==================================================
STYLE (🔥 레이아웃 + 필드 완전 통일)
================================================== */

const FIELD_HEIGHT = 56

const pageWrap:React.CSSProperties={
  width:'100%',
  minHeight:'100vh',
  background:'#f5f6f7'
}

const containerStyle:React.CSSProperties={
  width:'100%',
  maxWidth:720,
  margin:'0 auto',
  padding:'0px 20px'
}

const mainCardStyle:React.CSSProperties={
  background:'#fff',
  borderRadius:16,
  overflow:'hidden'
}

const innerStyle:React.CSSProperties={
  padding:'20px'
}

const boxStyle:React.CSSProperties={
  width:'100%',
  height:FIELD_HEIGHT,
  display:'flex',
  alignItems:'center',
  padding:'0 16px',
  border:'1px solid #d1d5db',
  borderRadius:14,
  fontSize:14,
  background:'#fff',
  boxSizing:'border-box'
}

const buttonStyle:React.CSSProperties={
  width:'100%',
  height:FIELD_HEIGHT,
  borderRadius:14,
  background:'#2563eb',
  color:'#fff',
  border:'none',
  fontWeight:600,
  fontSize:15,
  cursor:'pointer'
}

/* ==================================================
COMPONENT
================================================== */

export default function RegionSettingPage(){

const{setRegion}=useRegion()

const[currentRegion,setCurrentRegion]=useState<Region|null>(null)
const[selectedRegion,setSelectedRegion]=useState<Region|null>(null)

const[query,setQuery]=useState('')

const[loading,setLoading]=useState(false)
const[gpsLoading,setGpsLoading]=useState(false)

/* LOAD */

useEffect(()=>{

let mounted=true

async function load(){

try{

const data=await getMyProfile()

const region=data?.profile?.activityRegion || null

if(!mounted) return

setCurrentRegion(region)
setSelectedRegion(region)

setQuery(region?.fullName || '')

}catch(e){
console.error(e)
}

}

load()

return()=>{mounted=false}

},[])

/* SAVE */

async function handleSave(){

if(!selectedRegion){
alert('지역 선택 필요')
return
}

setLoading(true)

try{

await updateMyRegion(
selectedRegion.id,
null
)

setRegion(selectedRegion)
setCurrentRegion(selectedRegion)

alert('기본지역피드 설정 완료')
window.location.href='/home'

}catch(e){
console.error(e)
alert('저장 실패')
}

setLoading(false)

}

/* CLEAR */

async function handleClear(){

try{

await clearMyRegion()

setCurrentRegion(null)
setSelectedRegion(null)
setQuery('')

setRegion(null)

}catch(e){
console.error(e)
}

}

/* ==================================================
UI
================================================== */

return(

<div style={pageWrap}>

<div style={containerStyle}>

<div style={mainCardStyle}>

<div style={innerStyle}>

<h1 style={{
fontSize:20,
fontWeight:700,
marginBottom:20
}}>
기본지역피드 설정
</h1>

{/* CURRENT */}
<div style={{marginBottom:20}}>
<div style={{fontWeight:600,marginBottom:6}}>
현재 기본지역피드
</div>
<div style={boxStyle}>
{currentRegion?.fullName || '[지역 미설정]'}
</div>
</div>

{/* GPS */}
<div style={{marginBottom:20}}>
<RegionGpsSelector
gpsLoading={gpsLoading}
setGpsLoading={setGpsLoading}
setSelectedRegion={setSelectedRegion}
setQuery={setQuery}
/>
</div>

{/* SEARCH */}
<div style={{marginBottom:20}}>
<RegionDbSelector
query={query}
setQuery={setQuery}
selectedRegion={selectedRegion}
setSelectedRegion={setSelectedRegion}
/>
</div>

{/* SELECTED */}
<div style={{marginBottom:20}}>
<div style={{fontWeight:600,marginBottom:6}}>
선택된 기본지역
</div>
<div style={boxStyle}>
{selectedRegion?.fullName || '지역 선택 필요'}
</div>
</div>

{/* SAVE */}
<button
onClick={handleSave}
disabled={loading}
style={buttonStyle}
>
{loading?'저장 중...':'기본지역피드 설정 완료'}
</button>

{/* CLEAR */}
<div style={{marginTop:12}}>
<button
onClick={handleClear}
style={{
...buttonStyle,
background:'#9ca3af'
}}
>
기본지역피드 제거
</button>
</div>

</div>

</div>

</div>

</div>

)

}

'use client'

/* ==================================================
FILE : frontend/app/components/Region/RegionDbSelector.tsx
ROLE : REGION SEARCH AUTOCOMPLETE
STATUS : PRODUCTION FINAL STABLE
FIX :
validation error UI 제거
400 error 정상 처리
검색 상태 초기화 안정화
Region type 정합
API 규칙 준수
================================================== */


/* ==================================================
SECTION 01 IMPORT
================================================== */

import{
useEffect,
useRef,
useState
}from'react'

import type{
Region
}from'@/types/region'

import{
apiFetch
}from '@/lib/api'


/* ==================================================
SECTION 02 TYPES
================================================== */

type Props={

query:string

setQuery:(v:string)=>void

selectedRegion:Region|null

setSelectedRegion:(r:Region)=>void

}


/* ==================================================
SECTION 03 STYLE
================================================== */

const inputStyle={

width:'100%',

height:48,

padding:'0 14px',

border:'1px solid #ddd',

borderRadius:10,

fontSize:14,

boxSizing:'border-box' as const,

outline:'none'

}


/* ==================================================
SECTION 04 COMPONENT
================================================== */

export default function RegionDbSelector({

query,
setQuery,
selectedRegion,
setSelectedRegion

}:Props){

const[results,setResults]=
useState<Region[]>([])

const[showDropdown,setShowDropdown]=
useState(false)

const[loading,setLoading]=
useState(false)

const[error,setError]=
useState(false)

const[hoverId,setHoverId]=
useState<number|null>(null)

const searchRef=
useRef<HTMLDivElement>(null)


/* ==================================================
SECTION 05 OUTSIDE CLICK
================================================== */

useEffect(()=>{

const handleClickOutside=(e:any)=>{

if(

searchRef.current &&
!searchRef.current.contains(e.target)

){

setShowDropdown(false)

}

}

document.addEventListener(
'mousedown',
handleClickOutside
)

return()=>{

document.removeEventListener(
'mousedown',
handleClickOutside
)

}

},[])


/* ==================================================
SECTION 06 SEARCH
================================================== */

useEffect(()=>{

const q=query.trim()

/* 최소 글자 validation */

if(q.length<2){

setError(false)

setResults([])

setShowDropdown(false)

setLoading(false)

return

}

const timer=setTimeout(async()=>{

try{

setLoading(true)

setError(false)

const data=

await apiFetch<any>(

`regions/search?q=${encodeURIComponent(q)}`

)

/* RAW */

let raw:any[]=[]

if(Array.isArray(data))
raw=data

else if(Array.isArray(data?.regions))
raw=data.regions

else if(Array.isArray(data?.data))
raw=data.data


/* MAP */

const mapped:Region[]=

raw.map((r:any)=>{

const city=
r.city||''

const gu=
r.gu||''

const dong=
r.dong||''

const fullName=

r.fullName||

[city,gu,dong]

.filter(Boolean)

.join(' ')

const name=

r.name||

dong||

fullName

return{

id:r.id,

name,

city,

gu,

dong,

fullName,

detailAddress:
r.detailAddress??null

}

})


/* FILTER */

let filtered=mapped

if(selectedRegion){

filtered=

mapped.filter(

r=>r.id!==selectedRegion.id

)

}


/* RESULT */

setResults(filtered)

setShowDropdown(
filtered.length>0
)

setLoading(false)

}catch(err:any){

console.error(
'region search fail',
err
)

/* validation error는 UI 표시 안함 */

if(err?.status===400){

setError(false)

setResults([])

setShowDropdown(false)

setLoading(false)

return

}

/* 진짜 에러만 표시 */

setResults([])

setShowDropdown(false)

setError(true)

setLoading(false)

}

},250)


return()=>{

clearTimeout(timer)

}

},[query,selectedRegion])


/* ==================================================
SECTION 07 SELECT
================================================== */

const handleSelect=(region:Region)=>{

setSelectedRegion(region)

setQuery(region.fullName)

setShowDropdown(false)

}


/* ==================================================
SECTION 08 UI
================================================== */

return(

<div

ref={searchRef}

style={{

position:'relative',

width:'100%'

}}

>

<input

value={query}

onChange={e=>

setQuery(
e.target.value
)

}

placeholder="동 이름 2글자 이상 검색"

style={inputStyle}

/>


{loading&&(

<div

style={{

position:'absolute',

top:54,

left:0,

right:0,

background:'#fff',

border:'1px solid #ddd',

borderRadius:10,

padding:'10px',

fontSize:13,

zIndex:50

}}

>

검색중...

</div>

)}


{error&&(

<div

style={{

position:'absolute',

top:54,

left:0,

right:0,

background:'#fff',

border:'1px solid #ff8888',

borderRadius:10,

padding:'10px',

fontSize:13,

color:'#d33',

zIndex:50

}}

>

검색 오류

</div>

)}


{showDropdown &&
!loading &&
results.length>0 &&(

<div

style={{

position:'absolute',

top:54,

left:0,

right:0,

background:'#fff',

border:'1px solid #ddd',

borderRadius:10,

maxHeight:260,

overflowY:'auto',

zIndex:60

}}

>

{results.map(r=>(

<div

key={r.id}

onMouseDown={()=>
handleSelect(r)
}

onMouseEnter={()=>
setHoverId(r.id)
}

onMouseLeave={()=>
setHoverId(null)
}

style={{

padding:'12px 14px',

cursor:'pointer',

borderBottom:
'1px solid #f1f1f1',

background:

hoverId===r.id

?'#f7f9fc'

:'#fff'

}}

>

<div

style={{

fontSize:14,

fontWeight:600

}}

>

{r.fullName}

</div>

</div>

))}

</div>

)}

</div>

)

}
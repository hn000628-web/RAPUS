'use client'

import {
useEffect,
useRef,
useState
} from 'react'

import { useRouter } from 'next/navigation'

import {
getMyProfile,
uploadHeroImages
} from '@/lib/profileApi'

import { apiFetch } from '@/lib/api'
import BaseModal from '@/components/ui/modal/BaseModal'

import type { CSSProperties } from 'react'

/* ================================================== */

const MAX_FILES = 5

type HeroUI = {
  id:number
  imageAssetId:number
  sortOrder:number
  imageUrl:string
}

/* ================================================== */

export default function CoverUploadPage(){

const router = useRouter()

const fileInputRef = useRef<HTMLInputElement|null>(null)

const[existingHeroes,setExistingHeroes]=useState<HeroUI[]>([])
const[files,setFiles]=useState<File[]>([])
const[previewUrls,setPreviewUrls]=useState<string[]>([])
const[loading,setLoading]=useState(false)

const totalCount = existingHeroes.length + files.length
const remain = MAX_FILES - totalCount

/* ================================================== */
/* LOAD */
/* ================================================== */

useEffect(()=>{

const load=async()=>{

try{

const data = await getMyProfile()

const list = data?.profile?.heroImages || []

/* 🔥 핵심 FIX */
const sorted:HeroUI[] = list
  .filter((h:any)=>
    h?.id != null &&
    h?.imageAssetId != null
  )
  .map((h:any)=>({
    id: h.id,
    imageAssetId: h.imageAssetId as number,
    sortOrder: h.sortOrder || 0,
    imageUrl: h.imageUrl || ''
  }))
  .sort((a,b)=>a.sortOrder-b.sortOrder)

setExistingHeroes(sorted)

}catch(e){
console.error(e)
}

}

load()

},[])

/* ================================================== */
/* FILE */
/* ================================================== */

useEffect(()=>{

previewUrls.forEach(URL.revokeObjectURL)

const next = files.map(f=>URL.createObjectURL(f))
setPreviewUrls(next)

return()=>next.forEach(URL.revokeObjectURL)

},[files])

const openPicker=()=>fileInputRef.current?.click()

const handleFiles=(e:React.ChangeEvent<HTMLInputElement>)=>{

const list = e.target.files
? Array.from(e.target.files)
: []

setFiles(prev=>[
...prev,
...list
].slice(0, MAX_FILES - existingHeroes.length))

}

/* ================================================== */

const removeExisting=(idx:number)=>{
setExistingHeroes(prev=>prev.filter((_,i)=>i!==idx))
}

const removeAt=(idx:number)=>{
setFiles(prev=>prev.filter((_,i)=>i!==idx))
}

const clearAll=()=>{
setExistingHeroes([])
setFiles([])
}

/* ================================================== */

const [modal,setModal]=useState({
open:false,
type:'success' as 'success'|'error',
title:'',
description:''
})

const handleSubmit=async()=>{

if(loading) return

try{

setLoading(true)

let newIds:number[]=[]

if(files.length){
newIds = await uploadHeroImages(files)
}

const existingIds =
existingHeroes.map(h=>h.imageAssetId)

/* 🔥 undefined 완전 차단 */
const safeIds = [
...existingIds,
...newIds
].filter((id):id is number => typeof id === 'number')

await apiFetch('profiles/hero',{
method:'PUT',
body:{ assetIds:safeIds }
})

setModal({
open:true,
type:'success',
title:'완료',
description:'대표 이미지 저장 완료'
})

}catch(e){

setModal({
open:true,
type:'error',
title:'실패',
description:'업로드 실패'
})

}finally{
setLoading(false)
}

}

/* ================================================== */
/* UI */
/* ================================================== */

return(

<div style={pageWrap}>

<div style={containerStyle}>

<div style={cardStyle}>

<div style={innerStyle}>

<h1 style={titleStyle}>
대표 이미지 관리
</h1>

<input
ref={fileInputRef}
type="file"
multiple
accept="image/*"
onChange={handleFiles}
style={{display:'none'}}
/>

<div style={panelStyle}>

<div style={rowStyle}>

<button onClick={openPicker} style={btnStyle}>
+ 추가
</button>

<div style={{flex:1}}/>

{totalCount>0 && (
<button onClick={clearAll} style={btnStyle}>
전체삭제
</button>
)}

</div>

<div style={gridStyle}>

{[
...existingHeroes.map(h=>({
src:h.imageUrl,
isExisting:true
})),
...previewUrls.map(u=>({
src:u,
isExisting:false
}))
].map((item,idx)=>(
<div key={idx} style={thumbWrap}>

<div style={{
...thumb,
backgroundImage:`url('${item.src}')`
}}/>

{idx===0 && <div style={mainBadge}>대표</div>}

<button
onClick={()=>
item.isExisting
? removeExisting(idx)
: removeAt(idx-existingHeroes.length)
}
style={removeBtn}
>
×
</button>

</div>
))}

</div>

</div>

<div style={saveWrap}>

<button
onClick={handleSubmit}
disabled={loading}
style={{
...saveBtn,
opacity:loading?0.6:1,
cursor:loading?'not-allowed':'pointer'
}}
>
{loading?'저장중':'대표 이미지 저장'}
</button>

</div>

</div>

</div>

</div>

<BaseModal
open={modal.open}
type={modal.type}
title={modal.title}
description={modal.description}
onClose={()=>setModal({...modal,open:false})}
/>

</div>

)

}

/* ================================================== */
/* STYLE */
/* ================================================== */

const pageWrap:CSSProperties={
background:'#f5f6f7',
minHeight:'100vh'
}

const containerStyle:CSSProperties={
maxWidth:720,
margin:'0 auto',
padding:'0 20px'
}

const cardStyle:CSSProperties={
background:'#fff',
borderRadius:16,
overflow:'hidden'
}

const innerStyle:CSSProperties={
padding:'16px 20px'
}

const titleStyle:CSSProperties={
fontSize:20,
fontWeight:700,
marginBottom:20
}

const panelStyle:CSSProperties={
border:'2px dashed #cfd6dd',
borderRadius:14,
padding:16
}

const rowStyle:CSSProperties={
display:'flex',
gap:10,
alignItems:'center'
}

const btnStyle:CSSProperties={
padding:'10px 12px',
borderRadius:10,
border:'1px solid #e6e6e6',
background:'#fff',
fontSize:13,
cursor:'pointer'
}

const gridStyle:CSSProperties={
display:'grid',
gridTemplateColumns:'repeat(3,1fr)',
gap:12,
marginTop:16
}

const thumbWrap:CSSProperties={
position:'relative',
aspectRatio:'1/1'
}

const thumb:CSSProperties={
width:'100%',
height:'100%',
borderRadius:14,
backgroundSize:'cover',
backgroundPosition:'center'
}

const removeBtn:CSSProperties={
position:'absolute',
top:8,
right:8,
width:24,
height:24,
borderRadius:999,
background:'#000',
color:'#fff',
border:'none',
cursor:'pointer'
}

const mainBadge:CSSProperties={
position:'absolute',
inset:0,
background:'rgba(0,0,0,0.4)',
color:'#fff',
display:'flex',
alignItems:'center',
justifyContent:'center',
fontWeight:700
}

const saveWrap:CSSProperties={
marginTop:24
}

const saveBtn:CSSProperties={
width:'100%',
height:56,
borderRadius:14,
background:'#2563eb',
color:'#fff',
border:'none',
fontWeight:600
}
'use client'

import {
useEffect,
useRef,
useState
} from 'react'

import { useRouter } from 'next/navigation'
import BaseModal from '@/components/ui/modal/BaseModal'

import {
getMyProfile,
uploadAvatar
} from '@/lib/profileApi'

import { apiFetch } from '@/lib/api'
import type { CSSProperties } from 'react'

/* ================================================== */

const MAX_SIZE = 5 * 1024 * 1024

const ALLOWED_TYPES = [
'image/png',
'image/jpeg',
'image/webp'
]

const buildImageUrl = (path:string|null)=>{
if(!path) return null
return path + '?v=' + Date.now()
}

/* ================================================== */

export default function AvatarUploadPage(){

const router = useRouter()

const inputRef = useRef<HTMLInputElement|null>(null)
const objectUrlRef = useRef<string|null>(null)

const[file,setFile]=useState<File|null>(null)
const[preview,setPreview]=useState<string|null>(null)
const[current,setCurrent]=useState<string|null>(null)

const[loading,setLoading]=useState(false)
const[deleteMode,setDelete]=useState(false)

const[modal,setModal]=useState({
open:false,
type:'success' as 'success'|'error',
title:'',
description:''
})

/* 🔥 핵심 수정 */
const canSubmit =
!loading && (file || deleteMode || preview)

/* ================================================== */

const loadProfile = async()=>{
try{
const data = await getMyProfile()
const avatar = data?.profile?.avatar?.imageUrl || null

if(!avatar){
setCurrent(null)
setPreview(null)
return
}

const fullUrl = buildImageUrl(avatar)

setCurrent(fullUrl)
setPreview(fullUrl)

}catch{
setCurrent(null)
setPreview(null)
}
}

useEffect(()=>{
loadProfile()
return()=>{
if(objectUrlRef.current){
URL.revokeObjectURL(objectUrlRef.current)
}
}
},[])

/* ================================================== */

const pick=()=>inputRef.current?.click()

const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
const f=e.target.files?.[0]
if(!f) return

if(!ALLOWED_TYPES.includes(f.type)){
setModal({open:true,type:'error',title:'파일 오류',description:'png jpg webp만 가능'})
return
}

if(f.size>MAX_SIZE){
setModal({open:true,type:'error',title:'파일 오류',description:'5MB 이하'})
return
}

if(objectUrlRef.current){
URL.revokeObjectURL(objectUrlRef.current)
}

const url=URL.createObjectURL(f)

objectUrlRef.current=url

setFile(f)
setPreview(url)
setDelete(false)
}

const clear=()=>{
setFile(null)
setPreview(null)
setDelete(true)
}

/* ================================================== */

const submit=async()=>{

if(loading) return
setLoading(true)

try{

if(deleteMode){

await apiFetch('profiles/avatar',{method:'DELETE'})
await loadProfile()

setCurrent(null)
setPreview(null)
setDelete(false)

setModal({open:true,type:'success',title:'완료',description:'삭제 완료'})
return
}

if(file){

await uploadAvatar(file)
await loadProfile()

setFile(null)
setDelete(false)

setModal({open:true,type:'success',title:'완료',description:'저장 완료'})
}

}catch{

setPreview(current)

setModal({open:true,type:'error',title:'실패',description:'처리 실패'})

}finally{
setLoading(false)
}

}

const closeModal=()=>{
setModal({...modal,open:false})
router.replace('/profile/general/profilesettings')
}

/* ================================================== */
/* UI */
/* ================================================== */

return(

<div style={pageWrap}>

<div style={containerStyle}>

<div style={mainCardStyle}>

<div style={innerStyle}>

<h1 style={titleStyle}>프로필 이미지</h1>

<input
ref={inputRef}
type="file"
accept="image/png,image/jpeg,image/webp"
onChange={onFile}
style={{display:'none'}}
/>

{/* 점선 박스 유지 */}
<div style={panelStyle}>

  <div style={rowStyle}>

    <button onClick={pick} style={btnStyle}>
      이미지 선택
    </button>

    <div style={{flex:1}}/>

    {preview && (
      <button onClick={clear} style={btnStyle}>
        삭제
      </button>
    )}

  </div>

  <div style={hintStyle}>
    {
      file?'새 이미지':
      deleteMode?'삭제 예정':
      preview?'현재 이미지':
      '이미지 선택'
    }
  </div>

  {
    !preview ? (
      <button onClick={pick} style={emptyStyle}>
        이미지 선택
      </button>
    ) : (
      <div style={centerStyle}>
        <div
          onClick={pick}
          style={{
            ...circleStyle,
            backgroundImage:`url('${preview}')`
          }}
        />
      </div>
    )
  }

</div>

{/* 🔥 버튼 외부 유지 */}
<div style={saveWrapStyle}>

  <button
    disabled={!canSubmit}
    onClick={submit}
    style={{
      ...saveBtn,
      opacity:canSubmit?1:0.4,
      cursor:canSubmit?'pointer':'not-allowed'
    }}
  >
    {loading?'저장중':'저장'}
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
onClose={closeModal}
/>

</div>

)

}

/* ================================================== */
/* STYLE */
/* ================================================== */

const pageWrap:CSSProperties={
width:'100%',
minHeight:'100vh',
background:'#f5f6f7'
}

const containerStyle:CSSProperties={
width:'100%',
maxWidth:720,
margin:'0 auto',
padding:'0px 20px'
}

const mainCardStyle:CSSProperties={
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
borderRadius:14,
border:'2px dashed #cfd6dd',
background:'#fff',
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

const hintStyle:CSSProperties={
fontSize:12,
color:'#666',
marginTop:8,
marginBottom:16
}

const emptyStyle:CSSProperties={
width:180,
height:180,
borderRadius:'50%',
border:'1px dashed #e6e6e6',
background:'#fafafa',
margin:'0 auto',
cursor:'pointer',
display:'flex',
alignItems:'center',
justifyContent:'center'
}

const centerStyle:CSSProperties={
display:'flex',
justifyContent:'center'
}

const circleStyle:CSSProperties={
width:180,
height:180,
borderRadius:'50%',
backgroundSize:'cover',
backgroundPosition:'center',
border:'1px solid #e6e6e6',
cursor:'pointer'
}

const saveWrapStyle:CSSProperties={
marginTop:24
}

const saveBtn:CSSProperties={
width:'100%',
height:56,
borderRadius:14,
background:'#2563eb',
color:'#fff',
border:'none',
fontWeight:600,
fontSize:15
}
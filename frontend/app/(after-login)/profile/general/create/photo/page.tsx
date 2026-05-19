'use client'

/* ================================================== */
// SECTION 01 IMPORT
/* ================================================== */

import{
useEffect,
useRef,
useState
}from'react'

import{
useRouter
}from'next/navigation'

import{
getMyProfile
}from'@/lib/profileApi'

import{
apiFetch
}from'@/lib/api'


/* ================================================== */
// SECTION 02 CONSTANT
/* ================================================== */

const MAX_FILES=9


/* ================================================== */
// SECTION 03 COMPONENT
/* ================================================== */

export default function PhotoCreatePage(){

const router=useRouter()

const fileInputRef=
useRef<HTMLInputElement|null>(null)


/* ================================================== */
// SECTION 04 STATE
/* ================================================== */

const[files,setFiles]=useState<File[]>([])
const[previewUrls,setPreviewUrls]=useState<string[]>([])
const[loading,setLoading]=useState(false)

const canSubmit=files.length>0&&!loading
const remain=MAX_FILES-files.length


/* ================================================== */
// SECTION 05 PREVIEW
/* ================================================== */

useEffect(()=>{

previewUrls.forEach(URL.revokeObjectURL)

const next=files.map(URL.createObjectURL)

setPreviewUrls(next)

return()=>next.forEach(URL.revokeObjectURL)

},[files])


/* ================================================== */
// SECTION 06 FILE SELECT
/* ================================================== */

const openPicker=()=>fileInputRef.current?.click()

const handleFiles=(e:React.ChangeEvent<HTMLInputElement>)=>{

const list=e.target.files?Array.from(e.target.files):[]
if(!list.length)return

setFiles(prev=>{

const merged=[...prev,...list]

const uniq:File[]=[]
const seen=new Set<string>()

for(const f of merged){

const key=`${f.name}_${f.size}_${f.lastModified}`

if(seen.has(key))continue

seen.add(key)
uniq.push(f)

}

return uniq.slice(0,MAX_FILES)

})

e.target.value=''

}


/* ================================================== */
// SECTION 07 REMOVE
/* ================================================== */

const removeAt=(idx:number)=>
setFiles(prev=>prev.filter((_,i)=>i!==idx))

const clearAll=()=>setFiles([])


/* ================================================== */
// SECTION 08 SUBMIT
/* ================================================== */

const handleSubmit=async()=>{

if(!canSubmit)return

try{

setLoading(true)

const profileRes=await getMyProfile()

if(!profileRes?.profile){
alert('프로필 확인 실패')
return
}

const channelCode=profileRes.profile.channelCode

if(!channelCode){
alert('채널코드 없음')
return
}

const assetIds:number[]=[]

for(const file of files){

const form=new FormData()

form.append('file',file)
form.append('usageType','gallery')

const res:any=await apiFetch(
'media/upload',
{method:'POST',body:form,isForm:true}
)

if(!res?.assetId)
throw new Error('upload fail')

assetIds.push(res.assetId)

}

if(assetIds.length){

await apiFetch(
'profiles/gallery',
{
method:'PUT',
body:{assetIds: assetIds}
}
)

}

alert('사진 등록 완료')
router.push('/profile')

}catch(e){

console.error(e)
alert('업로드 실패')

}finally{
setLoading(false)
}

}


/* ================================================== */
// SECTION 09 UI
/* ================================================== */

return(

<div style={pageStyle}>

<div style={contentWrapperStyle}>

<div style={cardStyle}>

<h1 style={titleStyle}>사진 등록</h1>

<input
ref={fileInputRef}
type="file"
multiple
accept="image/*"
onChange={handleFiles}
style={{display:'none'}}
/>

<div style={stitchPanelStyle}>

<div style={panelTopRowStyle}>

<button
onClick={openPicker}
disabled={remain<=0}
style={{
...panelAddBtnStyle,
background:'#1877f2',
color:'#fff',
opacity:remain<=0?0.5:1
}}
>
+ 추가
</button>

<div style={{flex:1}}/>

{files.length>0&&(
<button
onClick={clearAll}
style={{
...panelClearBtnStyle,
background:'#ff4d4f',
color:'#fff'
}}
>
전체삭제
</button>
)}

</div>

<div style={panelHintStyle}>
{files.length===0
?`사진 선택 (최대 ${MAX_FILES}장)`
:`선택된 사진 ${files.length}장`}
</div>

{previewUrls.length===0?(
<label style={panelInnerBoxStyle}>
사진 추가하기
<input
type="file"
multiple
onChange={handleFiles}
style={{display:'none'}}
/>
</label>
):(
<div style={panelGridStyle}>
{previewUrls.map((src,idx)=>(
<div key={idx} style={panelThumbWrapStyle}>

<div style={{
...panelThumbStyle,
backgroundImage:`url(${src})`
}}/>

<button
onClick={()=>removeAt(idx)}
style={panelRemoveBtnStyle}
>
×
</button>

</div>
))}
</div>
)}

</div>

<div style={inlineButtonWrap}>

<button
disabled={!canSubmit}
onClick={handleSubmit}
style={inlineButtonStyle}
>
{loading?'등록중...':'사진 등록'}
</button>

</div>

</div>
</div>
</div>

)

}


/* ================================================== */
// SECTION 10 STYLE (TS ERROR FIX COMPLETE)
/* ================================================== */

const pageStyle:React.CSSProperties={
background:'#f0f2f5',
minHeight:'100vh'
}

const contentWrapperStyle:React.CSSProperties={
maxWidth:600,
margin:'0 auto',
padding:'16px'
}

const cardStyle:React.CSSProperties={
background:'#fff',
borderRadius:16,
padding:24,
boxShadow:'0 4px 20px rgba(0,0,0,0.06)'
}

const titleStyle:React.CSSProperties={
fontSize:20,
fontWeight:700,
marginBottom:20
}

const stitchPanelStyle:React.CSSProperties={
border:'2px dashed #cfd6dd',
borderRadius:14,
padding:12,
background:'#f5f6f7'
}

const panelTopRowStyle:React.CSSProperties={
display:'flex',
alignItems:'center',
gap:10
}

const panelAddBtnStyle:React.CSSProperties={
padding:'10px 12px',
borderRadius:10,
border:'1px solid #ddd',
fontSize:13,
cursor:'pointer'

}

const panelClearBtnStyle:React.CSSProperties={
padding:'10px 12px',
borderRadius:10,
border:'1px solid #ddd',
fontSize:13,
cursor:'pointer'
}

const panelHintStyle:React.CSSProperties={
fontSize:12,
color:'#666',
marginTop:8,
marginBottom:10
}

const panelInnerBoxStyle:React.CSSProperties={
display:'flex',
alignItems:'center',
justifyContent:'center',
minHeight:100,
border:'1px solid #ccc',
borderRadius:12,
background:'#fff',
cursor:'pointer',
color:'#999'
}

const panelGridStyle:React.CSSProperties={
display:'grid',
gridTemplateColumns:'repeat(3,1fr)',
gap:10
}

const panelThumbWrapStyle:React.CSSProperties={
position:'relative',
aspectRatio:'1 / 1'
}

const panelThumbStyle:React.CSSProperties={
width:'100%',
height:'100%',
backgroundSize:'cover',
backgroundPosition:'center',
borderRadius:12
}

const panelRemoveBtnStyle:React.CSSProperties={
position:'absolute',
top:6,
right:6,
width:24,
height:24,
borderRadius:'50%',
background:'rgba(0,0,0,0.6)',
color:'#fff',
border:'none',
cursor:'pointer'
}

const inlineButtonWrap:React.CSSProperties={
marginTop:24
}

const inlineButtonStyle:React.CSSProperties={
width:'100%',
padding:14,
borderRadius:12,
border:'none',
background:'#1877f2',
color:'#fff',
fontSize:15,
cursor:'pointer'
}
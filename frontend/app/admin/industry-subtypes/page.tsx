'use client'

/* ==================================================
FILE : frontend/app/admin/industry-subtypes/page.tsx
ROLE : ADMIN INDUSTRY SUBTYPES FINAL HARDENED PAGE
STATUS : PRODUCTION SAFE FINAL
FIX :

admin API rule strict
file upload safe
state race fix
pagination safe
response validation
loading separation
error safe handling

================================================== */

/* ==================================================
SECTION 01 IMPORT
================================================== */

import{

useEffect,
useState,
useRef

}from'react'

import{

adminFetch,
adminFileFetch

}from'@/lib/adminApi'

/* ==================================================
SECTION 02 TYPES
================================================== */

type Industry={

id:number
name:string

}

type Subtype={

id:number
industryId:number
code:string
name:string
sortOrder:number
isActive:number

}

/* ==================================================
SECTION 03 CONST
================================================== */

const API_ROUTE=
'/admin/industry-subtypes'

const PAGE_SIZE=30

/* ==================================================
SECTION 04 COMPONENT
================================================== */

export default function AdminIndustrySubtypesPage(){

const fileRef=
useRef<HTMLInputElement|null>(null)

const[industries,setIndustries]=
useState<Industry[]>([])

const[subtypes,setSubtypes]=
useState<Subtype[]>([])

const[industryId,setIndustryId]=
useState<number|null>(null)

const[loading,setLoading]=
useState(true)

const[uploading,setUploading]=
useState(false)

const[file,setFile]=
useState<File|null>(null)

const[currentPage,setCurrentPage]=
useState(1)

/* ==================================================
SECTION 05 PAGINATION
================================================== */

const totalPages=

Math.max(

1,

Math.ceil(
subtypes.length/
PAGE_SIZE
)

)

const pagedSubtypes=

subtypes.slice(

(currentPage-1)*PAGE_SIZE,

currentPage*PAGE_SIZE

)

/* ==================================================
SECTION 06 LOAD INDUSTRIES
================================================== */

const loadIndustries=async()=>{

try{

const data=

await adminFetch(
'/admin/industries'
)

if(data?.industries){

setIndustries(
data.industries
)

}

}catch(e){

console.error(
'INDUSTRY LOAD FAIL',
e
)

}

}

/* ==================================================
SECTION 07 LOAD SUBTYPES
================================================== */

const loadSubtypes=async()=>{

try{

let url=API_ROUTE

if(industryId){

url=

`${API_ROUTE}?industryId=${industryId}`

}

const data=

await adminFetch(url)

if(data?.subtypes){

setSubtypes(
data.subtypes
)

setCurrentPage(1)

}

}catch(e){

console.error(
'SUBTYPE LOAD FAIL',
e
)

}finally{

setLoading(false)

}

}

/* ==================================================
SECTION 08 CSV UPLOAD
================================================== */

const uploadCSV=async()=>{

if(!file){

alert('CSV 파일 선택 필요')
return

}

const formData=
new FormData()

formData.append(
'file',
file
)

try{

setUploading(true)

const data=

await adminFileFetch(

'/admin/industry-subtypes/import',

formData

)

if(!data?.ok){

alert('업로드 실패')
return

}

alert(

`업로드 완료
inserted: ${data.result?.inserted || 0}
skipped: ${data.result?.skipped || 0}`

)

setFile(null)

if(fileRef.current)
fileRef.current.value=''

await loadSubtypes()

}catch(e){

console.error(
'CSV UPLOAD FAIL',
e
)

alert('업로드 실패')

}finally{

setUploading(false)

}

}

/* ==================================================
SECTION 09 RESET
================================================== */

const resetTable=async()=>{

if(!confirm(
'전체 삭제하시겠습니까?'
))
return

try{

await adminFetch(

`${API_ROUTE}/reset`,

{
method:'DELETE'
}

)

alert('초기화 완료')

await loadSubtypes()

}catch(e){

console.error(
'RESET FAIL',
e
)

}

}

/* ==================================================
SECTION 10 DELETE
================================================== */

const deleteSubtype=async(
id:number
)=>{

if(!confirm(
'삭제하시겠습니까?'
))
return

try{

await adminFetch(

`${API_ROUTE}/${id}`,

{
method:'DELETE'
}

)

await loadSubtypes()

}catch(e){

console.error(
'DELETE FAIL',
e
)

}

}

/* ==================================================
SECTION 11 EFFECT
================================================== */

useEffect(()=>{

loadIndustries()

},[])

useEffect(()=>{

loadSubtypes()

},[industryId])

/* ==================================================
SECTION 12 LOADING UI
================================================== */

if(loading)

return(

<div>

Loading...

</div>

)

/* ==================================================
SECTION 13 UI
================================================== */

return(

<div>

<h2
style={{
marginBottom:20
}}
>

세부 업종 관리 (CSV 업로드)

</h2>

<div
style={{
marginBottom:20
}}
>

<select

value={industryId??''}

onChange={e=>{

const val=
e.target.value

if(val==='')

setIndustryId(null)

else

setIndustryId(
Number(val)
)

}}

>

<option value=''>

전체

</option>

{industries.map(i=>(

<option
key={i.id}
value={i.id}
>

{i.name}

</option>

))}

</select>

</div>

<div

style={{

marginBottom:20,
display:'flex',
gap:10,
alignItems:'center'

}}

>

<input

ref={fileRef}

type="file"

accept=".csv"

onChange={e=>{

if(e.target.files?.[0])

setFile(
e.target.files[0]
)

}}

/>

<button

onClick={uploadCSV}

disabled={uploading}

>

{uploading?

'업로드중...'

:

'CSV 업로드'

}

</button>

<button

onClick={resetTable}

style={{

background:'#c62828',
color:'#fff',
border:'none',
padding:'6px 12px',
cursor:'pointer'

}}

>

테이블 초기화

</button>

</div>

<div

style={{

marginBottom:20,
fontSize:13,
color:'#666'

}}

>

CSV 형식<br/>

industryId,code,name,name_en,name_ko,sortOrder,isActive

</div>

<table

style={{

width:'100%',
borderCollapse:'collapse'

}}

>

<thead>

<tr>

<th>ID</th>
<th>CODE</th>
<th>NAME</th>
<th>ACTIVE</th>
<th></th>

</tr>

</thead>

<tbody>

{pagedSubtypes.map(s=>(

<tr key={s.id}>

<td>{s.id}</td>
<td>{s.code}</td>
<td>{s.name}</td>
<td>{s.isActive}</td>

<td>

<button

onClick={()=>deleteSubtype(s.id)}

>

삭제

</button>

</td>

</tr>

))}

</tbody>

</table>

<div

style={{

marginTop:20,
display:'flex',
gap:5,
flexWrap:'wrap'

}}

>

{Array.from(

{length:totalPages},

(_,i)=>i+1

).map(page=>(

<button

key={page}

onClick={()=>setCurrentPage(page)}

style={{

background:

currentPage===page
?'#000'
:'#eee',

color:

currentPage===page
?'#fff'
:'#000',

border:'none',

padding:'6px 10px',

cursor:'pointer'

}}

>

{page}

</button>

))}

</div>

</div>

)

}

/* ==================================================
SECTION END
================================================== */
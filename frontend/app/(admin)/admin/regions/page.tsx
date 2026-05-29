'use client'

/* ==================================================
FILE : frontend/app/admin/regions/page.tsx
ROLE : ADMIN REGIONS MANAGEMENT
STATUS : FINAL STABLE (ADMIN RULE MATCH)
STRUCTURE :
UI → adminApi → backend → DB
================================================== */

import {
useEffect,
useRef,
useState
}from 'react'

import {
adminFetch,
adminFileFetch
}from '@/lib/adminApi'

/* ==================================================
SECTION 01 : TYPE
================================================== */

type Region={

id:number
code:string
countryCode:string
name:string
depth:number
parentId:number|null
isActive:number

}

/* ==================================================
SECTION 02 : COMPONENT
================================================== */

export default function AdminRegionsPage(){

const[regions,setRegions]=
useState<Region[]>([])

const[file,setFile]=
useState<File|null>(null)

const[uploading,setUploading]=
useState(false)

const[loading,setLoading]=
useState(true)

const[page,setPage]=
useState(1)

const[limit]=
useState(50)

const[total,setTotal]=
useState(0)

const fileInputRef=
useRef<HTMLInputElement|null>(null)

/* ==================================================
SECTION 03 : FETCH
================================================== */

const fetchRegions=
async(p=1)=>{

setLoading(true)

try{

const data=

await adminFetch(

`/admin/regions?page=${p}&limit=${limit}`

)

if(Array.isArray(data)){

setRegions(data)

}
else if(data?.regions){

setRegions(
data.regions
)

setTotal(
data.total||0
)

}
else{

setRegions([])
setTotal(0)

}

}catch(err){

console.error(
'REGION FETCH FAIL',
err
)

setRegions([])
setTotal(0)

}

setLoading(false)

}

/* ==================================================
SECTION 04 : CSV IMPORT
================================================== */

const uploadCSV=
async()=>{

if(!file){

alert('CSV 파일 선택')
return

}

try{

setUploading(true)

const formData=
new FormData()

formData.append(
'file',
file
)

await adminFileFetch(

'/admin/regions/import',

formData

)

alert('CSV 업로드 완료')

setFile(null)

if(fileInputRef.current)
fileInputRef.current.value=''

fetchRegions(page)

}catch(err){

console.error(err)

const message=
err instanceof Error
?err.message
:'업로드 실패'

alert(`업로드 실패\n${message}`)

}
finally{

setUploading(false)

}

}

/* ==================================================
SECTION 05 : CSV EXPORT
================================================== */

const downloadCSV=
async()=>{

try{

const data=

await adminFetch(
'/admin/regions/export'
)

/* export는 CSV string 반환 가정 */

const blob=

new Blob(
[data],
{type:'text/csv'}
)

const url=
window.URL.createObjectURL(blob)

const a=
document.createElement('a')

a.href=url

a.download=
'regions_backup.csv'

document.body.appendChild(a)

a.click()

a.remove()

}catch{

alert('다운로드 실패')

}

}

/* ==================================================
SECTION 06 : RESET
================================================== */

const resetRegions=
async()=>{

if(!confirm(
'초기화 하시겠습니까?'
))
return

try{

await adminFetch(

'/admin/regions/reset',

{
method:'DELETE'
}

)

fetchRegions(page)

}catch{

alert('초기화 실패')

}

}

/* ==================================================
SECTION 07 : EVENT
================================================== */

const handleFileSelect=(

e:React.ChangeEvent<HTMLInputElement>

)=>{

if(!e.target.files)
return

setFile(
e.target.files[0]
)

}

/* ==================================================
SECTION 08 : EFFECT
================================================== */

useEffect(()=>{

fetchRegions(page)

},[page])

/* ==================================================
SECTION 09 : PAGINATION
================================================== */

const totalPages=

Math.max(

1,

Math.ceil(
total/limit
)

)

/* ==================================================
SECTION 10 : LOADING
================================================== */

if(loading){

return(

<div>
불러오는 중...
</div>

)

}

/* ==================================================
SECTION 11 : UI
================================================== */

return(

<div>

<h2>
지역 관리
</h2>

<div style={{marginBottom:20}}>

<input

ref={fileInputRef}

type="file"

accept=".csv"

onChange={handleFileSelect}

/>

<button
onClick={uploadCSV}
disabled={uploading}
>

{uploading
?'업로드중'
:'CSV 업로드'}

</button>

<button
onClick={downloadCSV}
>
CSV 다운로드
</button>

<button
onClick={resetRegions}
>
초기화
</button>

</div>

<table
border={1}
cellPadding={8}
>

<thead>

<tr>

<th>ID</th>
<th>CODE</th>
<th>NAME</th>
<th>DEPTH</th>
<th>PARENT</th>

</tr>

</thead>

<tbody>

{regions.map(r=>(

<tr key={r.id}>

<td>{r.id}</td>

<td>{r.code}</td>

<td>{r.name}</td>

<td>{r.depth}</td>

<td>{r.parentId}</td>

</tr>

))}

</tbody>

</table>

<div style={{marginTop:20}}>

<button

disabled={page<=1}

onClick={()=>
setPage(page-1)
}

>
이전
</button>

<span style={{margin:'0 10px'}}>

{page} / {totalPages}

</span>

<button

disabled={page>=totalPages}

onClick={()=>
setPage(page+1)
}

>
다음
</button>

</div>

</div>

)

/* ==================================================
SECTION END
================================================== */

}

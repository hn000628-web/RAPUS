'use client'

/* ==================================================
FILE : frontend/app/admin/industries/page.tsx
ROLE : ADMIN INDUSTRY MANAGEMENT
STATUS : FINAL STABLE (ADMIN RULE MATCH)
STRUCTURE :
UI → adminApi → backend → DB
================================================== */

import{
useEffect,
useState
}from 'react'

import{
adminFetch
}from '@/lib/adminApi'

/* ==================================================
SECTION 01 : TYPE
================================================== */

type Industry={

id:number
code:string
name:string
description:string|null
isActive:number
createdAt:string

}

/* ==================================================
SECTION 02 : COMPONENT
================================================== */

export default function AdminIndustriesPage(){

const[industries,setIndustries]=
useState<Industry[]>([])

const[loading,setLoading]=
useState(true)

const[code,setCode]=
useState('')

const[name,setName]=
useState('')

const[description,setDescription]=
useState('')

/* ==================================================
SECTION 03 : FETCH
================================================== */

const loadIndustries=
async()=>{

setLoading(true)

try{

const data=

await adminFetch(
'/admin/industries'
)

if(Array.isArray(data)){

setIndustries(data)

}
else if(data?.industries){

setIndustries(
data.industries
)

}
else{

setIndustries([])

}

}catch(err){

console.error(
'INDUSTRY FETCH FAIL',
err
)

setIndustries([])

}

setLoading(false)

}

/* ==================================================
SECTION 04 : CREATE
================================================== */

const createIndustry=
async()=>{

if(!code.trim()){

alert('code 필요')
return

}

if(!name.trim()){

alert('name 필요')
return

}

try{

await adminFetch(

'/admin/industries',

{

method:'POST',

headers:{
'Content-Type':
'application/json'
},

body:JSON.stringify({

code,
name,
description

})

}

)

setCode('')
setName('')
setDescription('')

loadIndustries()

}catch(err){

console.error(err)

alert('생성 실패')

}

}

/* ==================================================
SECTION 05 : DELETE
================================================== */

const deleteIndustry=
async(id:number)=>{

if(!confirm(
'삭제하시겠습니까?'
))
return

try{

await adminFetch(

`/admin/industries/${id}`,

{
method:'DELETE'
}

)

loadIndustries()

}catch(err){

console.error(err)

alert('삭제 실패')

}

}

/* ==================================================
SECTION 06 : TOGGLE
================================================== */

const toggleIndustry=
async(id:number)=>{

try{

await adminFetch(

`/admin/industries/${id}/toggle`,

{
method:'PATCH'
}

)

loadIndustries()

}catch{

alert('변경 실패')

}

}

/* ==================================================
SECTION 07 : EFFECT
================================================== */

useEffect(()=>{

loadIndustries()

},[])

/* ==================================================
SECTION 08 : LOADING
================================================== */

if(loading){

return(

<div>
불러오는 중...
</div>

)

}

/* ==================================================
SECTION 09 : UI
================================================== */

return(

<div>

<h2 style={{

fontSize:20,
fontWeight:700,
marginBottom:20

}}>

업종 관리

</h2>

<div style={{

display:'flex',
gap:10,
marginBottom:20

}}>

<input

placeholder="CODE"

value={code}

onChange={(e)=>
setCode(e.target.value)
}

style={inputStyle}

/>

<input

placeholder="NAME"

value={name}

onChange={(e)=>
setName(e.target.value)
}

style={inputStyle}

/>

<input

placeholder="DESCRIPTION"

value={description}

onChange={(e)=>
setDescription(e.target.value)
}

style={inputStyle}

/>

<button

onClick={createIndustry}

style={createBtn}

>

추가

</button>

</div>

<table style={{

width:'100%',
borderCollapse:'collapse'

}}>

<thead>

<tr style={{

background:'#f5f6f7'

}}>

<th style={thStyle}>ID</th>
<th style={thStyle}>CODE</th>
<th style={thStyle}>NAME</th>
<th style={thStyle}>DESCRIPTION</th>
<th style={thStyle}>ACTIVE</th>
<th style={thStyle}>CREATED</th>
<th style={thStyle}></th>

</tr>

</thead>

<tbody>

{industries.map(i=>(

<tr key={i.id}>

<td style={tdStyle}>
{i.id}
</td>

<td style={tdStyle}>
{i.code}
</td>

<td style={tdStyle}>
{i.name}
</td>

<td style={tdStyle}>
{i.description}
</td>

<td style={tdStyle}>

<button

onClick={()=>
toggleIndustry(i.id)
}

style={toggleBtn}

>

{i.isActive?'ON':'OFF'}

</button>

</td>

<td style={tdStyle}>

{i.createdAt?.slice(0,10)}

</td>

<td style={tdStyle}>

<button

onClick={()=>
deleteIndustry(i.id)
}

style={deleteBtn}

>

삭제

</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

)

/* ==================================================
SECTION END
================================================== */

}

/* ==================================================
SECTION STYLE
================================================== */

const inputStyle={

padding:8,
border:'1px solid #ccc',
borderRadius:4

}

const thStyle={

textAlign:'left' as const,
padding:'10px',
borderBottom:'1px solid #ddd',
fontSize:13

}

const tdStyle={

padding:'10px',
borderBottom:'1px solid #ddd',
fontSize:13

}

const createBtn={

background:'#1877f2',
color:'#fff',
border:0,
padding:'8px 14px',
borderRadius:4,
cursor:'pointer'

}

const deleteBtn={

background:'#e53935',
color:'#fff',
border:0,
padding:'6px 10px',
borderRadius:4,
cursor:'pointer'

}

const toggleBtn={

background:'#333',
color:'#fff',
border:0,
padding:'5px 10px',
borderRadius:4,
cursor:'pointer'

}
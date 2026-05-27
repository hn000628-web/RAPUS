'use client'

/* ==================================================
FILE : frontend/app/admin/categories/page.tsx
ROLE : ADMIN CATEGORY MANAGEMENT
STATUS : FINAL STABLE (ADMIN API RULE MATCH)
STRUCTURE :
UI → adminApi → backend → DB
================================================== */

import {
useEffect,
useState
} from 'react'

import {
adminFetch
} from '@/lib/adminApi'

/* ==================================================
SECTION 01 : TYPE
================================================== */

type Category={

id:number
code:string
name:string
type:string
isActive:number

}

/* ==================================================
SECTION 02 : COMPONENT
================================================== */

export default function AdminCategoriesPage(){

const[categories,setCategories]=
useState<Category[]>([])

const[code,setCode]=
useState('')

const[name,setName]=
useState('')

const[type,setType]=
useState('COMMUNITY')

const[loading,setLoading]=
useState(true)

/* ==================================================
SECTION 03 : FETCH
================================================== */

const fetchCategories=
async()=>{

setLoading(true)

try{

const data=

await adminFetch(
'/categories'
)

if(Array.isArray(data)){

setCategories(data)

}
else{

setCategories([])

}

}catch(err){

console.error(
'CATEGORY FETCH FAIL',
err
)

setCategories([])

}

setLoading(false)

}

useEffect(()=>{

fetchCategories()

},[])

/* ==================================================
SECTION 04 : CREATE
================================================== */

const handleCreate=
async()=>{

if(!code.trim()){

alert('code 입력')
return

}

if(!name.trim()){

alert('name 입력')
return

}

try{

await adminFetch(

'/admin/categories',

{

method:'POST',

body:{

code,
name,
type

}

}

)

setCode('')
setName('')
setType('COMMUNITY')

fetchCategories()

}catch(err){

console.error(err)

alert('생성 실패')

}

}

/* ==================================================
SECTION 05 : DELETE
================================================== */

const handleDelete=
async(
id:number
)=>{

if(!confirm(
'삭제하시겠습니까?'
))return

try{

await adminFetch(

`/admin/categories/${id}`,

{
method:'DELETE'
}

)

fetchCategories()

}catch(err){

console.error(err)

alert('삭제 실패')

}

}

/* ==================================================
SECTION 06 : LOADING
================================================== */

if(loading){

return(

<div>
불러오는 중...
</div>

)

}

/* ==================================================
SECTION 07 : UI
================================================== */

return(

<div>

<h2
style={{

fontSize:20,
fontWeight:700,
marginBottom:20

}}
>

카테고리 관리

</h2>

<div
style={{

display:'flex',
gap:10,
marginBottom:20

}}
>

<input
placeholder="CODE"
value={code}
onChange={(e)=>
setCode(e.target.value)
}
style={{

padding:8,
border:'1px solid #ccc',
borderRadius:4

}}
/>

<input
placeholder="NAME"
value={name}
onChange={(e)=>
setName(e.target.value)
}
style={{

padding:8,
border:'1px solid #ccc',
borderRadius:4

}}
/>

<select
value={type}
onChange={(e)=>
setType(e.target.value)
}
style={{

padding:8,
border:'1px solid #ccc',
borderRadius:4

}}
>

<option value="COMMUNITY">
COMMUNITY
</option>

<option value="MARKET">
MARKET
</option>

<option value="BUSINESS">
BUSINESS
</option>

</select>

<button
onClick={handleCreate}
style={{

background:'#1877f2',
color:'#fff',
border:0,
padding:'8px 14px',
borderRadius:4,
cursor:'pointer'

}}
>

추가

</button>

</div>

<table
style={{

width:'100%',
borderCollapse:'collapse'

}}
>

<thead>

<tr
style={{

background:'#f5f6f7'

}}
>

<th style={thStyle}>ID</th>
<th style={thStyle}>CODE</th>
<th style={thStyle}>NAME</th>
<th style={thStyle}>TYPE</th>
<th style={thStyle}>ACTIVE</th>
<th style={thStyle}></th>

</tr>

</thead>

<tbody>

{categories.map((c)=>(

<tr key={c.id}>

<td style={tdStyle}>
{c.id}
</td>

<td style={tdStyle}>
{c.code}
</td>

<td style={tdStyle}>
{c.name}
</td>

<td style={tdStyle}>
{c.type}
</td>

<td style={tdStyle}>
{c.isActive?'Y':'N'}
</td>

<td style={tdStyle}>

<button
onClick={()=>
handleDelete(c.id)
}
style={{

background:'#e53935',
color:'#fff',
border:0,
padding:'6px 10px',
borderRadius:4,
cursor:'pointer'

}}
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

}

/* ==================================================
SECTION 08 : STYLE
================================================== */

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
//FILE: frontend/app/dev-login/page.tsx
'use client';

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import React,{useState}from'react';

/* ==================================================
SECTION 02 : TYPE
================================================== */

type AccountRowProps={
email:string;
type:string;
onDelete?:()=>void;
};

type TestUser={
email:string;
type:string;
};

/* ==================================================
SECTION 03 : CONSTANT
================================================== */

const mockUsers=[
{email:'user1@test.com',type:'GENERAL'},
{email:'user2@test.com',type:'GENERAL'},
];

const mockBusiness=[
{email:'shop@test.com',type:'BUSINESS'},
{email:'cafe@test.com',type:'BUSINESS'},
];

/* ==================================================
SECTION 04 : STATE (ADD)
================================================== */

const initialTestUsers:TestUser[]=[
{email:'test1@test.com',type:'TEST'},
{email:'test2@test.com',type:'TEST'}
];

/* ==================================================
SECTION 05 : EVENT
================================================== */

function handleLogin(email:string){

console.log('DEV LOGIN:',email);

}

/* TEST CREATE */

function createTestUser(
email:string,
setUsers:React.Dispatch<React.SetStateAction<TestUser[]>>
){

if(!email)return;

setUsers(prev=>[
...prev,
{email,type:'TEST'}
]);

}

/* TEST DELETE */

function deleteTestUser(
email:string,
setUsers:React.Dispatch<React.SetStateAction<TestUser[]>>
){

setUsers(prev=>
prev.filter(u=>u.email!==email)
);

}

/* ==================================================
SECTION 06 : UI BLOCK
================================================== */

export default function DevLoginPage(){

const[testUsers,setTestUsers]=
useState<TestUser[]>(initialTestUsers);

const[newEmail,setNewEmail]=
useState('');

return(

<div>

<h2
style={{
marginBottom:24,
fontSize:20,
}}
>
DEV ACCOUNT LOGIN
</h2>

{/* =============================
TEST ACCOUNT (ADD)
============================= */}

<BlockTitle label="TEST ACCOUNT"/>

<div
style={{
display:'flex',
gap:8,
marginBottom:12
}}
>

<input
value={newEmail}
onChange={e=>setNewEmail(e.target.value)}
placeholder="test email"
style={{
padding:8,
border:'1px solid #ddd',
borderRadius:6,
fontSize:13
}}
/>

<button
onClick={()=>{

createTestUser(
newEmail,
setTestUsers
);

setNewEmail('');

}}
style={{
padding:'6px 14px',
borderRadius:6,
border:'none',
background:'#00a86b',
color:'#fff',
cursor:'pointer',
fontSize:13,
}}
>
CREATE
</button>

</div>

<Table>

{testUsers.map(u=>(
<AccountRow
key={u.email}
email={u.email}
type={u.type}
onDelete={()=>
deleteTestUser(
u.email,
setTestUsers
)
}
/>
))}

</Table>

{/* =============================
GENERAL
============================= */}

<BlockTitle label="GENERAL ACCOUNT"/>

<Table>

{mockUsers.map(u=>(
<AccountRow
key={u.email}
email={u.email}
type={u.type}
/>
))}

</Table>

{/* =============================
BUSINESS
============================= */}

<BlockTitle label="BUSINESS ACCOUNT"/>

<Table>

{mockBusiness.map(u=>(
<AccountRow
key={u.email}
email={u.email}
type={u.type}
/>
))}

</Table>

</div>

);

}

/* ==================================================
SECTION 07 : SUB COMPONENT
================================================== */

function BlockTitle({label}:{label:string}){

return(

<div
style={{
marginTop:24,
marginBottom:8,
fontWeight:600,
fontSize:14,
}}
>
{label}
</div>

);

}

function Table({children}:{children:React.ReactNode}){

return(

<div
style={{
border:'1px solid #e4e6eb',
borderRadius:6,
overflow:'hidden',
marginBottom:24,
}}
>
{children}
</div>

);

}

function AccountRow({
email,
type,
onDelete
}:AccountRowProps){

return(

<div
style={{
display:'flex',
justifyContent:'space-between',
padding:12,
borderBottom:'1px solid #eee',
alignItems:'center',
}}
>

<div>

<div
style={{
fontSize:14,
fontWeight:500,
}}
>
{email}
</div>

<div
style={{
fontSize:12,
color:'#888',
}}
>
{type}
</div>

</div>

<div
style={{
display:'flex',
gap:6
}}
>

<button
onClick={()=>
handleLogin(email)
}
style={{
padding:'6px 14px',
borderRadius:6,
border:'none',
background:'#1877f2',
color:'#fff',
cursor:'pointer',
fontSize:13,
}}
>
LOGIN
</button>

{onDelete&&(

<button
onClick={onDelete}
style={{
padding:'6px 10px',
borderRadius:6,
border:'none',
background:'#ff4d4f',
color:'#fff',
cursor:'pointer',
fontSize:12,
}}
>
DELETE
</button>

)}

</div>

</div>

);

}

/* ==================================================
SECTION 08 : END
================================================== */
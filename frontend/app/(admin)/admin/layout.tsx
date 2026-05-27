'use client'

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import { usePathname, useRouter } from 'next/navigation'
import React from 'react'


/* ==================================================
SECTION 02 : TYPE
================================================== */

type LayoutProps={
children:React.ReactNode
}

type SectionTitleProps={
label:string
}

type NavItemProps={
label:string
onClick:()=>void
danger?:boolean
active?:boolean
}


/* ==================================================
SECTION 03 : CONSTANT
================================================== */

const TOPBAR_HEIGHT=52


/* ==================================================
SECTION 04 : ADMIN LAYOUT
================================================== */

export default function AdminLayout(
{children}:LayoutProps
){

const router=useRouter()
const pathname=usePathname()

return(

<div
style={{
minHeight:'100vh',
background:'#f0f2f5'
}}
>


{/* =========================================
SECTION : TOPBAR
========================================= */}

<div
style={{
height:TOPBAR_HEIGHT,
background:'#1c1e21',
color:'#fff',
position:'fixed',
top:0,
left:0,
right:0,
zIndex:1000,
display:'flex',
alignItems:'center',
padding:'0 20px',
fontSize:14,
fontWeight:600
}}
>
BASEBOOK · ADMIN
</div>


{/* =========================================
SECTION : BODY
========================================= */}

<div
style={{
display:'flex',
marginTop:TOPBAR_HEIGHT
}}
>


{/* =========================================
SECTION : SIDEBAR
========================================= */}

<aside
style={{
width:200,
background:'#fff',
borderRight:'1px solid #ddd',
padding:'16px 12px',
minHeight:`calc(100vh - ${TOPBAR_HEIGHT}px)`
}}
>


{/* ================= ADMIN ================= */}

<SectionTitle label="ADMIN"/>

<NavItem
label="관리자 홈"
onClick={()=>router.push('/admin')}
active={pathname==='/admin'}
/>

<NavItem
label="Users"
onClick={()=>router.push('/admin/users')}
active={pathname.startsWith('/admin/users')}
/>

<NavItem
label="Feeds"
onClick={()=>router.push('/admin/feeds')}
active={pathname.startsWith('/admin/feeds')}
/>

<NavItem
label="Ads"
onClick={()=>router.push('/admin/ads')}
active={pathname.startsWith('/admin/ads')}
/>

<Divider/>


{/* ================= MEDIA ================= */}

<SectionTitle label="MEDIA"/>

<NavItem
label="Orphan Media"
onClick={()=>router.push('/admin/orphan-media')}
active={pathname.startsWith('/admin/orphan-media')}
/>

<NavItem
label="DB Cleanup"
onClick={()=>router.push('/admin/db-cleaner')}
active={pathname.startsWith('/admin/db-cleaner')}
/>

<NavItem
label="Full Cleanup"
danger
onClick={()=>router.push('/admin/storage')}
active={pathname.startsWith('/admin/storage')}
/>

<Divider/>


{/* ================= DATA ================= */}

<SectionTitle label="DATA"/>

<NavItem
label="Regions"
onClick={()=>router.push('/admin/regions')}
active={pathname.startsWith('/admin/regions')}
/>

<NavItem
label="Categories"
onClick={()=>router.push('/admin/categories')}
active={pathname.startsWith('/admin/categories')}
/>

<NavItem
label="Industries"
onClick={()=>router.push('/admin/industries')}
active={pathname.startsWith('/admin/industries')}
/>

<NavItem
label="Industry Subtypes"
onClick={()=>router.push('/admin/industry-subtypes')}
active={pathname.startsWith('/admin/industry-subtypes')}
/>

<Divider/>


{/* ================= DEV ================= */}

<SectionTitle label="DEV"/>

<NavItem
label="Dev Login"
onClick={()=>router.push('/admin/dev')}
active={pathname.startsWith('/admin/dev')}
/>

<Divider/>


<NavItem
label="Logout"
danger
active={false}
onClick={()=>router.push('/login')}
/>

</aside>


{/* =========================================
SECTION : MAIN CONTENT
========================================= */}

<main
style={{
flex:1,
padding:'0 32px 32px'
}}
>

<div
style={{
background:'#fff',
borderRadius:8,
padding:24,
minHeight:400,
boxShadow:'0 1px 2px rgba(0,0,0,0.08)'
}}
>
{children}
</div>

</main>

</div>

</div>

)

}


/* ==================================================
SECTION 05 : SUB COMPONENTS
================================================== */

function SectionTitle(
{label}:SectionTitleProps
){
return(
<div
style={{
fontSize:12,
fontWeight:600,
color:'#65676b',
marginBottom:8,
padding:'0 8px',
marginTop:12
}}
>
{label}
</div>
)
}


function NavItem(
{
label,
onClick,
danger
,
active
}:NavItemProps
){
return(
<div
onClick={onClick}
style={{
padding:'10px 12px',
marginBottom:4,
borderRadius:6,
cursor:'pointer',
fontSize:14,
color:danger?'#e53935':active?'#0b57d0':'#050505',
fontWeight:active?600:400,
background:active?'#eaf2ff':'transparent',
transition:'background 0.2s'
}}
onMouseEnter={(e)=>{
if(!active){
e.currentTarget.style.background='#f2f3f5'
}
}}
onMouseLeave={(e)=>{
if(!active){
e.currentTarget.style.background='transparent'
}
}}
>
{label}
</div>
)
}


function Divider(){
return(
<div
style={{
height:1,
background:'#e4e6eb',
margin:'16px 0'
}}
/>
)
}


/* ==================================================
SECTION 06 : END
================================================== */

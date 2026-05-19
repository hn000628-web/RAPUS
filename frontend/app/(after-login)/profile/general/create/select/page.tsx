'use client'

/* ==================================================
SECTION 01 IMPORT
================================================== */

import {useEffect,useState} from 'react'
import GeneralCreatePage from '../../../create/select/general/page'
import BusinessCreatePage from '../../../business/create/select/page'

/* ==================================================
SECTION 02 TYPE
================================================== */

type ProfileMe={

profileType:string

}

/* ==================================================
SECTION 03 CONSTANT
================================================== */

const loadingStyle:React.CSSProperties={

minHeight:'100vh',
display:'flex',
alignItems:'center',
justifyContent:'center',
background:'#f0f2f5',
fontSize:18,
fontWeight:600

}

/* ==================================================
SECTION 04 STATE
================================================== */

const API_ME='/api/profiles'

/* ==================================================
SECTION 05 DATA FUNCTION
================================================== */

async function loadProfileType(){

try{

const res=await fetch(API_ME)

if(!res.ok){

throw new Error('profile load fail')

}

return await res.json()

}catch{

return null

}

}

/* ==================================================
SECTION 06 EVENT FUNCTION
================================================== */
// 없음

/* ==================================================
SECTION 07 EFFECT
================================================== */

export default function ProfileCreateSelectPage(){

const[profileType,setProfileType]=useState<string|null>(null)

const[loading,setLoading]=useState(true)

useEffect(()=>{

async function init(){

const data:ProfileMe|null=

await loadProfileType()

if(data){

setProfileType(data.profileType)

}

setLoading(false)

}

init()

},[])

/* ==================================================
SECTION 08 UI BLOCK
FORMAT ASSEMBLY PAGE
================================================== */

if(loading){

return(

<div style={loadingStyle}>

Loading...

</div>

)

}

if(profileType==='BUSINESS'){

return <BusinessCreatePage/>

}

return <GeneralCreatePage/>

}

/* ==================================================
SECTION 09 RETURN
RETURN INCLUDED ABOVE
================================================== */
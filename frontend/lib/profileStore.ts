// FILE : frontend/lib/profileStore.ts
// ROOT : frontend/lib/profileStore.ts
// STATUS : PROFILE STORE FINAL SAFE
// ROLE : PROFILE STATE STORE
// CONTRACT : profileApi.ts MATCH


// SECTION 01 : IMPORT

import type {

Profile

}

from '@/lib/profileApi'


// SECTION 02 : STATE TYPE

type ProfileState={

profile:Profile|null

loading:boolean

updating:boolean

}


// SECTION 03 : INTERNAL STATE

let state:ProfileState={

profile:null,

loading:false,

updating:false

}


// SECTION 04 : GETTERS

export function getProfile():

Profile|null{

return state.profile

}


export function isProfileLoading():

boolean{

return state.loading

}


export function isProfileUpdating():

boolean{

return state.updating

}


// SECTION 05 : BASE CONTROL

export function setProfile(

profile:Profile

){

state={

...state,

profile

}

}


export function clearProfile(){

state={

...state,

profile:null

}

}


// SECTION 06 : LOAD PROFILE

export async function loadProfile(

fetcher:()=>Promise<any>

){

if(state.loading)
return

state={

...state,

loading:true

}

try{

const data=
await fetcher()

if(data?.profile){

state={

...state,

profile:data.profile

}

}

}catch(error){

console.error(

'profile load error',

error

)

}finally{

state={

...state,

loading:false

}

}

}


// SECTION 07 : UPDATE PROFILE

export async function updateProfile(

payload:any,

fetcher:(payload:any)=>Promise<any>

){

if(state.updating)
return

state={

...state,

updating:true

}

try{

const data=

await fetcher(payload)

if(data?.profile){

state={

...state,

profile:data.profile

}

}

return data

}catch(error){

console.error(

'profile update error',

error

)

throw error

}finally{

state={

...state,

updating:false

}

}

}


// SECTION 08 : AVATAR RELATION UPDATE

export function setAvatar(

avatar:Profile['avatar']

){

if(!state.profile)
return

state={

...state,

profile:{

...state.profile,

avatar

}

}

}


// SECTION 09 : DISPLAY NAME UPDATE

export function setDisplayName(

displayName:string|null

){

if(!state.profile)
return

state={

...state,

profile:{

...state.profile,

displayName

}

}

}


// SECTION 10 : BIO UPDATE

export function setBio(

bio:string|null

){

if(!state.profile)
return

state={

...state,

profile:{

...state.profile,

bio

}

}

}


// SECTION 11 : CHANNEL UPDATE

export function setChannel(

channelName:string|null,

channelURL:string|null

){

if(!state.profile)
return

state={

...state,

profile:{

...state.profile,

channelName,

channelURL

}

}

}
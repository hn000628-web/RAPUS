'use client';

import { useState } from 'react';

import ProfileIntroSection
from '../components/ProfileIntroSection';

import BlockAddButtons
from '../components/BlockAddButtons';

import SubmitButton
from '../components/SubmitButton';

import type { ProfileBlock }
from '../../business/create/posts/components/businessPostTypes';

/* ==================================================
SECTION 01 STATE
================================================== */

export default function ProfileInfoPage(){

const [bio,setBio]=
useState('');

const [blocks,setBlocks]=
useState<ProfileBlock[]>([]);

const [loading,setLoading]=
useState(false);

/* ==================================================
SECTION 02 SAVE
================================================== */

const handleSave=
async()=>{

setLoading(true);

try{

console.log(
bio,
blocks
);

}
finally{

setLoading(false);

}

};

/* ==================================================
SECTION 03 UI
================================================== */

return(

<div style={{

maxWidth:720,
margin:'0 auto',
padding:'40px 20px 100px'

}}>

<h2 style={{

fontSize:22,
fontWeight:700,
marginBottom:30

}}>
프로필 소개 설정
</h2>

{/* INTRO */}

<ProfileIntroSection

bio={bio}

setBio={setBio}

/>

{/* BLOCK ADD */}

<BlockAddButtons

setBlocks={setBlocks}

canAdd={true}

/>

{/* SAVE */}

<SubmitButton

onClick={handleSave}

loading={loading}

/>

</div>

);

}
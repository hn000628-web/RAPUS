'use client';

import type { CSSProperties, SetStateAction } from 'react';
import type { BusinessProfileBlock } from '../../business/create/posts/components/businessPostTypes';

import { useState } from 'react';

/* ==================================================
SECTION 01 TYPES
================================================== */

type Props = {

setBlocks: React.Dispatch<
SetStateAction<BusinessProfileBlock[]>
>;

canAdd: boolean;

};

/* ==================================================
SECTION 02 COMPONENT
================================================== */

export default function BlockAddButtons({

setBlocks,
canAdd

}: Props) {

/* ==================================================
SECTION 03 UI STATE
================================================== */

const RADIUS = 12;

const [hoverSection,setHoverSection]=
useState(false);

const [hoverLink,setHoverLink]=
useState(false);

/* ==================================================
SECTION 04 ADD TEXT BLOCK
================================================== */

const addSection=()=>{

if(!canAdd) return;

setBlocks(prev=>[

...prev,

{

tempId:crypto.randomUUID(),

type:'TEXT',

title:'',

value:'',

sortOrder:prev.length

}

]);

};

/* ==================================================
SECTION 05 ADD LINK BLOCK
================================================== */

const addLink=()=>{

if(!canAdd) return;

setBlocks(prev=>[

...prev,

{

tempId:crypto.randomUUID(),

type:'LINK',

title:'',

url:'',

sortOrder:prev.length

}

]);

};

/* ==================================================
SECTION 06 STYLES
================================================== */

const rowStyle:CSSProperties={

display:'flex',

gap:12,

marginBottom:24

};

const baseBtnStyle:CSSProperties={

flex:1,

height:40,

borderRadius:RADIUS,

border:'1px solid #1877f2',

fontWeight:600,

transition:'all 0.2s ease'

};

/* ==================================================
SECTION 07 UI
================================================== */

return(

<div style={rowStyle}>

<button

type="button"

onClick={addSection}

disabled={!canAdd}

onMouseEnter={()=>setHoverSection(true)}

onMouseLeave={()=>setHoverSection(false)}

style={{

...baseBtnStyle,

background:

canAdd
? hoverSection
? '#1877f2'
: '#fff'
: '#e5e7eb',

color:

canAdd
? hoverSection
? '#fff'
: '#1877f2'
: '#9ca3af',

cursor:

canAdd
? 'pointer'
: 'not-allowed'

}}

>
+ 섹션 추가
</button>

<button

type="button"

onClick={addLink}

disabled={!canAdd}

onMouseEnter={()=>setHoverLink(true)}

onMouseLeave={()=>setHoverLink(false)}

style={{

...baseBtnStyle,

background:

canAdd
? hoverLink
? '#1877f2'
: '#fff'
: '#e5e7eb',

color:

canAdd
? hoverLink
? '#fff'
: '#1877f2'
: '#9ca3af',

cursor:

canAdd
? 'pointer'
: 'not-allowed'

}}

>
+ 링크 추가
</button>

</div>

);

}

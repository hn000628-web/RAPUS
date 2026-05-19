'use client';

/* ==================================================
SECTION 01 IMPORT
================================================== */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/* ==================================================
SECTION 02 TYPE
================================================== */

type SelectCardProps={
title:string;
onClick:()=>void;
};

/* ==================================================
SECTION 03 CONSTANT
================================================== */

const pageStyle: React.CSSProperties = {
minHeight: '100vh',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
background: '#f0f2f5',
padding: '20px 0',
};

const cardWrapperStyle: React.CSSProperties = {
width: 360,
padding: 24,
background: '#fff',
borderRadius: 16,
boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
textAlign: 'center',
display: 'flex',
flexDirection: 'column',
gap: 16,
minHeight: 260,
};

const titleStyle: React.CSSProperties = {
fontSize: 20,
fontWeight: 700,
marginBottom: 24,
};

const cardStyle: React.CSSProperties = {
borderRadius: 12,
padding: '18px 16px',
marginBottom: 14,
cursor: 'pointer',
fontSize: 16,
fontWeight: 600,
background: '#fff',
border: '1px solid #ddd',
boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
transition: 'all 0.2s ease',
};


/* ==================================================
SECTION 04 UI BLOCK
REGISTER MENU HUB
================================================== */

export default function ProfileSelectPage() {

const router = useRouter();

return (
<main style={pageStyle}>

<div style={cardWrapperStyle}>

<h1 style={titleStyle}>
등록 유형 선택
</h1>

{/* 게시물 등록 */}
<SelectCard
title="게시물 등록"
onClick={() => router.push('/profile/general/create/posts')}
/>

{/* 사진 등록 */}
<SelectCard
title="사진 등록"
onClick={() => router.push('/profile/general/create/photo')}
/>

</div>

</main>
);
}

/* ==================================================
SECTION 04-1 UI COMPONENT
SELECT CARD
================================================== */

function SelectCard({ title, onClick }: SelectCardProps) {

const [hover, setHover] = useState(false);

return (

<div
onClick={onClick}
onMouseEnter={() => setHover(true)}
onMouseLeave={() => setHover(false)}
style={{
...cardStyle,
background: hover ? '#1877f2' : '#fff',
color: hover ? '#fff' : '#000',
}}
>

{title}

</div>

);

}
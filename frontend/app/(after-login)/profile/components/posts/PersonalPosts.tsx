'use client'

/* ==================================================
SECTION CODE OUTPUT : PERSONAL POSTS
ROLE : PROFILE POSTS VIEW
ROOT : frontend/components/profile/PersonalPosts.tsx

STATUS : PRODUCTION SAFE FINAL

RULE :
API LAYER ONLY
RAW FETCH 금지
PROFILE DOMAIN ONLY
POSTS DOMAIN READ (PROFILE CONTEXT)
================================================== */


/* ==================================================
SECTION 01 : IMPORT
================================================== */

import {
useEffect,
useState
} from 'react'

import {
useRouter
} from 'next/navigation'

import {
apiFetch
} from '@/lib/api'


/* ==================================================
SECTION 02 : TYPES (DB SYNC)
================================================== */

type PostImage={

imageAssetId:number
imageUrl:string
sortOrder:number

}

type PostItem={

id:number
content:string|null
contentType:'LIFE'|'PLACE'
createdAt:string

images:PostImage[]

}


/* ==================================================
SECTION 03 : STYLE
================================================== */

const gridStyle:React.CSSProperties={

display:'grid',
gridTemplateColumns:'repeat(3,1fr)',
gap:8

}

const cardStyle:React.CSSProperties={

width:'100%',
aspectRatio:'1/1',
borderRadius:12,
overflow:'hidden',
cursor:'pointer'

}

const emptyStyle:React.CSSProperties={

padding:20

}


/* ==================================================
SECTION 04 : COMPONENT
================================================== */

export default function PersonalPosts(){

const router=useRouter()

const[posts,setPosts]=
useState<PostItem[]>([])

const[loading,setLoading]=
useState(true)


/* ==================================================
SECTION 05 : LOAD POSTS (PROFILE DOMAIN)
================================================== */

useEffect(()=>{

const load=async()=>{

try{

setLoading(true)

/* 🔥 PROFILE CONTEXT POSTS */

const res=await apiFetch<{

ok:boolean
posts:PostItem[]

}>('posts/me')

setPosts(res?.posts||[])

}catch(e){

console.error('posts load fail',e)
setPosts([])

}finally{

setLoading(false)

}

}

load()

},[])


/* ==================================================
SECTION 06 : ACTION
================================================== */

const openPost=(postId:number)=>{

router.push(
`/profile/general/post/${postId}`
)

}


// ==================================================
// SECTION 07 : RENDER
// ==================================================

if(loading){

  return <div style={emptyStyle}>불러오는 중...</div>

}

if(!posts.length){

  return <div style={emptyStyle}>게시물이 없습니다.</div>

}

return(

  <div style={gridStyle}>

    {posts.map(post=>{

      const thumb =
        post.images?.[0]?.imageUrl || null

      /* 🔥 제목 (content 일부 사용) */
      const title =
        post.content && post.content.trim() !== ''
          ? post.content.slice(0,20)
          : ''

      return(

        <div
          key={post.id}
          style={cardStyle}
          onClick={()=>openPost(post.id)}
        >

          {/* =========================
          IMAGE
          ========================= */}

          <div
            style={{
              width:'100%',
              height:'100%',
              backgroundColor:'#eee',
              backgroundImage:
                thumb
                  ? `url('${thumb}')`
                  : undefined,
              backgroundSize:'cover',
              backgroundPosition:'center',
              position:'relative' // 🔥 핵심
            }}
          >

            {/* =========================
            OVERLAY (GRADIENT)
            ========================= */}

            <div
              style={{
                position:'absolute',
                left:0,
                right:0,
                bottom:0,
                height:'60%',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.6), transparent)'
              }}
            />

            {/* =========================
            TITLE
            ========================= */}

            {title && (
              <div
                style={{
                  position:'absolute',
                  left:8,
                  right:8,
                  bottom:8,
                  color:'#fff',
                  fontSize:13,
                  fontWeight:600,
                  lineHeight:1.3,
                  overflow:'hidden',
                  display:'-webkit-box',
                  WebkitLineClamp:2,
                  WebkitBoxOrient:'vertical'
                }}
              >
                {title}
              </div>
            )}

          </div>

        </div>

      )

    })}

  </div>

)
}
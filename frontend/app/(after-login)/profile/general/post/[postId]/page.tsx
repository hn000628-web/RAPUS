'use client'

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import { useParams } from 'next/navigation'
import PostDetailContainer
from '@/components/feed-detail/PostDetailContainer'

/* ==================================================
SECTION 02 : TYPE
================================================== */

type Params = {
  postId?: string
}

/* ==================================================
SECTION 03 : COMPONENT
================================================== */

export default function PostDetailPage(){

  const params = useParams() as Params | null

  /* =========================
  SAFE PARSE
  ========================= */

  const postIdRaw = params?.postId

  const postId =
    typeof postIdRaw === 'string'
      ? Number(postIdRaw)
      : NaN

  /* ==================================================
  SECTION 04 : VALIDATION
  ================================================== */

  if(
    !postId ||
    Number.isNaN(postId) ||
    postId <= 0
  ){

    return(
      <div style={{
        maxWidth:720,
        margin:'0 auto',
        padding:'40px 20px',
        color:'#333'
      }}>
        게시물을 찾을 수 없습니다.
      </div>
    )

  }

  /* ==================================================
  SECTION 05 : RENDER
  ================================================== */

  return(

    <PostDetailContainer
      postId={postId}
    />

  )

}
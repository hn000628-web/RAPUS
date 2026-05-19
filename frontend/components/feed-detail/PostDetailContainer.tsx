// FILE : frontend/app/(after-login)/profile/general/post/[id]/components/PostDetailContainer.tsx
// ROOT : frontend/app/(after-login)/profile/general/post/[id]/components/PostDetailContainer.tsx

'use client'

// ==================================================
// SECTION 01 : IMPORT
// ==================================================

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import usePostDetail from '../../hooks/use-post-detail'
import { postDetailStore } from '../../stores/post-detail-store'

import PostHero from './PostHero'
import PostDetailBody from './PostDetailBody'
import ImageViewer from '@/components/viewer/ImageViewer'

// ==================================================
// SECTION 02 : TYPE
// ==================================================

type Props = {
  postId: number
}

// ==================================================
// SECTION 03 : COMPONENT
// ==================================================

export default function PostDetailContainer({ postId }: Props){

  const router = useRouter()

  const {
    state,
    hero,
    authorLabel,
    createdDateLabel,
    canSlide,
    onPrev,
    onNext,
  } = usePostDetail(postId)

  const [viewerOpen,setViewerOpen] = useState(false)

  const images = state.images ?? []

// ==================================================
// SECTION 04 : ACTION
// ==================================================

  const onDelete = async()=>{

    const ok = window.confirm('정말 삭제하시겠습니까?')
    if(!ok) return

    try{

      await postDetailStore.delete(postId)

      window.alert('삭제 완료')

      router.push('/profile')

    }catch(e){

      const message =
        e instanceof Error ? e.message : '서버 오류'

      window.alert(message)

    }

  }

  const onEdit = ()=>{

    router.push(`/profile/general/post/${postId}/edit`)

  }

// ==================================================
// SECTION 05 : GUARD
// ==================================================

  if(!state.post) return null

// ==================================================
// SECTION 06 : RETURN (🔥 프로필 UI 완전 동일 구조)
// ==================================================

  return(

    <div
      style={{
        width:'100%',
        minHeight:'100vh',
        background:'#f5f6f7'
      }}
    >

      <div
        style={{
          width:'100%',
          maxWidth:720,
          margin:'0 auto',
          padding:'16px 20px'
        }}
      >

        {/* =========================
        MAIN CONTENT (프로필 카드 내부 구조)
        ========================= */}

        <div
          style={{
            background:'#fff',
            borderRadius:16,     // ✅ 라운드 적용
            overflow:'hidden'    // ✅ 핵심 (이미지 포함 라운드 유지)
          }}
        >

          {/* =========================
          HERO
          ========================= */}

          <div
            onClick={()=>{
              if(images.length > 0){
                setViewerOpen(true)
              }
            }}
            style={{
              cursor:'zoom-in'
            }}
          >
            <PostHero
              hero={hero?.imageUrl ?? null}
              canSlide={canSlide}
              index={state.currentIndex}
              total={images.length}
              onPrev={onPrev}
              onNext={onNext}
            />
          </div>

          {/* =========================
          BODY
          ========================= */}

          <div style={{ padding:16 }}>

            <PostDetailBody
              title={state.post.title}
              authorLabel={authorLabel}
              createdDateLabel={createdDateLabel}
              categoryLabel={state.post.category}
              regionLabel={state.post.regionName}
              content={state.post.content}
              isOwner={true}
              isLiked={false}
              isSubscribed={false}
              onLike={() => {}}
              onShare={() => {}}
              onSubscribe={() => {}}
              onEdit={onEdit}
              onDelete={onDelete}
            />

          </div>

        </div>

      </div>

      {/* =========================
      IMAGE VIEWER
      ========================= */}

      <ImageViewer
        open={viewerOpen}
        images={images}
        index={state.currentIndex}
        onClose={()=>setViewerOpen(false)}
        onPrev={onPrev}
        onNext={onNext}
      />

    </div>

  )

}
'use client'

/* ==================================================
FILE : frontend/app/feed/life/page.tsx
ROLE : LIFE FEED PAGE (GENERAL POSTS ONLY)
STATUS : TEMP UI + STRUCTURE READY
================================================== */

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import { useEffect, useState } from 'react'

/* ==================================================
SECTION 02 : TYPES (임시)
================================================== */

type Post = {
  id: number
  content: string
  authorName: string
  createdAt: string
}

/* ==================================================
SECTION 03 : COMPONENT
================================================== */

export default function LifeFeedPage() {

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  /* ==================================================
  SECTION 04 : FETCH (임시 데이터)
  ================================================== */

  useEffect(() => {

    // 🔥 임시 데이터 (API 연결 전)
    const mock: Post[] = [
      {
        id: 1,
        content: '오늘 날씨 좋다 ☀️',
        authorName: '홍길동',
        createdAt: '방금 전'
      },
      {
        id: 2,
        content: '점심 뭐 먹지 고민중',
        authorName: '김철수',
        createdAt: '5분 전'
      },
      {
        id: 3,
        content: '헬스 다녀옴 💪',
        authorName: '이영희',
        createdAt: '10분 전'
      }
    ]

    setTimeout(() => {
      setPosts(mock)
      setLoading(false)
    }, 500)

  }, [])

  /* ==================================================
  SECTION 05 : RENDER
  ================================================== */

  return (

    <div style={pageWrap}>

      {/* ========================= HEADER ========================= */}
      <div style={header}>
        <div style={title}>라이프 피드</div>
      </div>

      {/* ========================= CONTENT ========================= */}

      {loading && (
        <div style={loadingStyle}>불러오는 중...</div>
      )}

      {!loading && posts.length === 0 && (
        <div style={emptyStyle}>게시물이 없습니다</div>
      )}

      {!loading && posts.map(post => (

        <div key={post.id} style={card}>

          <div style={author}>
            {post.authorName}
          </div>

          <div style={content}>
            {post.content}
          </div>

          <div style={date}>
            {post.createdAt}
          </div>

        </div>

      ))}

    </div>

  )

}

/* ==================================================
SECTION 06 : STYLE
================================================== */

const pageWrap: React.CSSProperties = {
  maxWidth: 640,
  margin: '0 auto',
  padding: 16,
  background: '#f5f6f7',
  minHeight: '100vh'
}

const header: React.CSSProperties = {
  marginBottom: 16
}

const title: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
}

const author: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: 8
}

const content: React.CSSProperties = {
  fontSize: 15,
  marginBottom: 10
}

const date: React.CSSProperties = {
  fontSize: 12,
  color: '#888'
}

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 40
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 40,
  color: '#888'
}
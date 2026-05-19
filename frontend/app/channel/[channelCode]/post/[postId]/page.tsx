// FILE : frontend/app/channel/[channelCode]/post/[postId]/page.tsx
// ROOT : C:\Users\kjm\social-platform\frontend\app\channel\[channelCode]\post\[postId]\page.tsx
// STATUS : FINAL MODIFIED
// ROLE : PUBLIC GENERAL POST DETAIL UI PAGE
// CHANGE SUMMARY :
// - 조회 / 반응 / 댓글 영역을 내용 섹션 위로 이동
// - 제목 / 작성자 / 작성일 다음에 반응 요약 먼저 표시
// - 내용 섹션은 반응 요약 아래로 이동
// - PRODUCT / EVENT와 분리된 GENERAL 포맷 유지
// - PC : 좌측 미디어 / 우측 게시물 정보 2칼럼 구조 유지
// - TABLET / MOBILE : 1칼럼 반응형 구조 유지
// - DB / API / Service 연결 없음
// - mockPost 기반 임시 UI 렌더링
// - 컴포넌트 에러 방지를 위해 외부 포스트 컴포넌트 import 없음

'use client'

// SECTION 01 : IMPORT

import {
  useMemo,
  useState
} from 'react'

import styles from './GeneralPostDetailPage.module.css'

// SECTION 02 : TYPE

type PageProps = {
  params: {
    channelCode: string
    postId: string
  }
}

type GeneralPostDetail = {
  id: number
  channelCode: string
  title: string
  content: string
  authorName: string
  authorType: string
  createdAt: string
  viewCountText: string
  likeCountText: string
  commentCountText: string
  images: string[]
  tags: string[]
}

// SECTION 03 : MOCK DATA

const mockPost: GeneralPostDetail = {
  id: 4,
  channelCode: 'BK28FWTUNA9NC',
  title: '오늘 준비한 매장 소식 안내',
  content:
    '오늘은 대표 메뉴 준비 수량이 넉넉하게 준비되어 있습니다. 매장 방문과 포장 주문 모두 가능하며, 재료 소진 시 일부 메뉴는 조기 마감될 수 있습니다. 방문 전 문의하시면 더 정확한 안내를 받을 수 있습니다.',
  authorName: '음식점_2',
  authorType: '스토어 · Food · 한식',
  createdAt: '2026-05-02 15:40',
  viewCountText: '조회 1,284',
  likeCountText: '좋아요 42',
  commentCountText: '댓글 8',
  images: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80'
  ],
  tags: [
    '공지',
    '매장소식',
    '오늘의 안내'
  ]
}

// SECTION 04 : COMPONENT

export default function PublicGeneralPostDetailPage({
  params
}: PageProps) {
  const channelCode =
    params.channelCode

  const postId =
    params.postId

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0)

  const post =
    useMemo<GeneralPostDetail>(() => {
      return {
        ...mockPost,
        channelCode
      }
    }, [
      channelCode
    ])

  const selectedImage =
    post.images[selectedImageIndex] ??
    post.images[0]

  const hasMultipleImages =
    post.images.length > 1

  // SECTION 05 : HANDLER

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => {
      if (prev <= 0) {
        return post.images.length - 1
      }

      return prev - 1
    })
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => {
      if (prev >= post.images.length - 1) {
        return 0
      }

      return prev + 1
    })
  }

  // SECTION 06 : RENDER

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          RAPUS
        </div>

        <div className={styles.headerRight}>
          <span className={styles.locationDot}>
            ●
          </span>

          <span className={styles.locationText}>
            풍암동
          </span>

          <button
            type="button"
            className={styles.loginButton}
          >
            로그인
          </button>
        </div>
      </header>

      <section className={styles.shell}>
        <section className={styles.layout}>
          <aside className={styles.mediaColumn}>
            <div className={styles.mediaFrame}>
              <img
                src={selectedImage}
                alt={post.title}
                className={styles.mainImage}
              />

              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    className={`${styles.mediaNavButton} ${styles.mediaNavButtonLeft}`}
                    aria-label="previous post image"
                    onClick={handlePrevImage}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className={`${styles.mediaNavButton} ${styles.mediaNavButtonRight}`}
                    aria-label="next post image"
                    onClick={handleNextImage}
                  >
                    ›
                  </button>
                </>
              )}

              <div className={styles.mediaCount}>
                {selectedImageIndex + 1}/{post.images.length}
              </div>
            </div>

            <div className={styles.thumbnailRow}>
              {post.images.map((image, index) => {
                const isActive =
                  selectedImageIndex === index

                return (
                  <button
                    key={image}
                    type="button"
                    className={
                      isActive
                        ? `${styles.thumbnailButton} ${styles.thumbnailButtonActive}`
                        : styles.thumbnailButton
                    }
                    onClick={() => {
                      setSelectedImageIndex(index)
                    }}
                  >
                    <img
                      src={image}
                      alt={`${post.title} ${index + 1}`}
                      className={styles.thumbnailImage}
                    />
                  </button>
                )
              })}
            </div>
          </aside>

          <section className={styles.infoColumn}>
            <article className={styles.postCard}>
              <div className={styles.tagRow}>
                {post.tags.map((tag) => {
                  return (
                    <span
                      key={tag}
                      className={styles.tag}
                    >
                      {tag}
                    </span>
                  )
                })}
              </div>

              <p className={styles.categoryText}>
                일반 게시물 / 소식 / 안내
              </p>

              <h1 className={styles.postTitle}>
                {post.title}
              </h1>

              <div className={styles.authorBox}>
                <div className={styles.avatarBox}>
                  <span className={styles.avatarText}>
                    960×960
                  </span>

                  <span className={styles.avatarSubText}>
                    테스트
                  </span>
                </div>

                <div className={styles.authorInfo}>
                  <strong className={styles.authorName}>
                    {post.authorName}
                  </strong>

                  <span className={styles.authorMeta}>
                    {post.authorType}
                  </span>

                  <span className={styles.createdAt}>
                    {post.createdAt}
                  </span>
                </div>
              </div>

              <div className={styles.divider} />

              <section className={styles.reactionSection}>
                <div className={styles.reactionGrid}>
                  <div className={styles.reactionBox}>
                    <span className={styles.reactionLabel}>
                      조회
                    </span>

                    <strong className={styles.reactionValue}>
                      {post.viewCountText}
                    </strong>
                  </div>

                  <div className={styles.reactionBox}>
                    <span className={styles.reactionLabel}>
                      반응
                    </span>

                    <strong className={styles.reactionValue}>
                      {post.likeCountText}
                    </strong>
                  </div>

                  <div className={styles.reactionBox}>
                    <span className={styles.reactionLabel}>
                      댓글
                    </span>

                    <strong className={styles.reactionValue}>
                      {post.commentCountText}
                    </strong>
                  </div>
                </div>
              </section>

              <div className={styles.divider} />

              <section className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>
                  내용
                </h2>

                <p className={styles.contentText}>
                  {post.content}
                </p>
              </section>

              <section className={styles.commentPreviewSection}>
                <h2 className={styles.sectionTitle}>
                  댓글
                </h2>

                <div className={styles.commentPreviewBox}>
                  <div>
                    <strong className={styles.commentPreviewTitle}>
                      댓글 기능 준비중
                    </strong>

                    <p className={styles.commentPreviewText}>
                      일반 게시물은 댓글 / 좋아요 / 공유 중심으로 확장됩니다.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.commentButton}
                  >
                    댓글 보기
                  </button>
                </div>
              </section>

              <div className={styles.bottomActions}>
                <button
                  type="button"
                  className={styles.outlineButton}
                >
                  공유하기
                </button>

                <button
                  type="button"
                  className={styles.darkButton}
                >
                  좋아요
                </button>
              </div>
            </article>

            <div className={styles.debugBox}>
              <span>
                channelCode : {channelCode}
              </span>

              <span>
                postId : {postId}
              </span>
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}

// SECTION 07 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- 조회 / 반응 / 댓글 영역을 내용 섹션 위로 이동 완료
- 제목 / 작성자 / 작성일 다음에 반응 요약 표시 완료
- 내용 섹션은 반응 요약 아래로 이동 완료
- PRODUCT / EVENT와 분리된 GENERAL 포맷 유지
- 제목 / 작성자 / 작성일 / 반응 / 본문 / 댓글 미리보기 구성
- PC 2컬럼 구조 적용
- CSS Module 기반 모바일 대응 구조 적용
- 외부 포스트 컴포넌트 import 없음
- API 호출 없음
- DB 직접 접근 없음
- 백엔드 변경 없음
- JSX multi-line 구조 유지
*/
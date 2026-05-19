// FILE : frontend/app/channel/[channelCode]/gallery/[galleryId]/page.tsx
// ROOT : C:\Users\kjm\social-platform\frontend\app\channel\[channelCode]\gallery\[galleryId]\page.tsx
// STATUS : FINAL MODIFIED
// ROLE : PUBLIC GALLERY DETAIL UI PAGE
// CHANGE SUMMARY :
// - 기존 UI 구조 유지
// - PC : 좌측 대표 이미지 / 썸네일, 우측 사진 정보
// - MOBILE : 사진 / 썸네일 / 정보 순서 유지
// - 대표 이미지 내부 좌우 슬라이딩 버튼 유지
// - 썸네일 클릭 전환 유지
// - 하단 다음 사진 버튼 제거 유지
// - 하단 채널로 돌아가기 버튼 제거
// - mediaActions / outlineButton / darkButton 사용 제거
// - useRouter 제거
// - DB / API / Service 연결 없음
// - mockGallery 기반 임시 UI 렌더링

'use client'

// SECTION 01 : IMPORT

import {
  useMemo,
  useState
} from 'react'

import styles from './GalleryDetailPage.module.css'

// SECTION 02 : TYPE

type PageProps = {
  params: {
    channelCode: string
    galleryId: string
  }
}

type GalleryImage = {
  id: number
  imageUrl: string
  title: string
  description: string
  createdAt: string
}

type GalleryDetail = {
  id: number
  channelCode: string
  title: string
  description: string
  createdAt: string
  images: GalleryImage[]
  tags: string[]
}

// SECTION 03 : MOCK DATA

const mockGallery: GalleryDetail = {
  id: 1,
  channelCode: 'BK28FWTUNA9NC',
  title: '매장 사진첩',
  description:
    '매장 분위기, 상품 이미지, 이벤트 현장 사진을 모아둔 공개 사진첩입니다.',
  createdAt: '2026-05-02 16:20',
  tags: [
    '사진첩',
    '매장사진',
    '공개갤러리'
  ],
  images: [
    {
      id: 1,
      imageUrl:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80',
      title: '신선 식재료 진열',
      description:
        '매장에서 사용하는 신선 식재료와 상품 진열 사진입니다.',
      createdAt: '2026-05-02 16:20'
    },
    {
      id: 2,
      imageUrl:
        'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1400&q=80',
      title: '매장 내부 진열',
      description:
        '고객이 둘러볼 수 있는 매장 내부 진열 공간입니다.',
      createdAt: '2026-05-02 16:22'
    },
    {
      id: 3,
      imageUrl:
        'https://images.unsplash.com/photo-1515706886582-54c73c5eaf41?auto=format&fit=crop&w=1400&q=80',
      title: '행사 상품 구성',
      description:
        '프로모션 기간 동안 함께 노출되는 상품 구성 사진입니다.',
      createdAt: '2026-05-02 16:25'
    }
  ]
}

// SECTION 04 : COMPONENT

export default function PublicGalleryDetailPage({
  params
}: PageProps) {
  const channelCode =
    params.channelCode

  const galleryId =
    params.galleryId

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0)

  const gallery =
    useMemo<GalleryDetail>(() => {
      return {
        ...mockGallery,
        id: Number(galleryId) || mockGallery.id,
        channelCode
      }
    }, [
      channelCode,
      galleryId
    ])

  const selectedImage =
    gallery.images[selectedImageIndex] ??
    gallery.images[0]

  const hasMultipleImages =
    gallery.images.length > 1

  // SECTION 05 : HANDLER

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => {
      if (prev <= 0) {
        return gallery.images.length - 1
      }

      return prev - 1
    })
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => {
      if (prev >= gallery.images.length - 1) {
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
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className={styles.mainImage}
              />

              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    className={`${styles.mediaNavButton} ${styles.mediaNavButtonLeft}`}
                    aria-label="previous gallery image"
                    onClick={handlePrevImage}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className={`${styles.mediaNavButton} ${styles.mediaNavButtonRight}`}
                    aria-label="next gallery image"
                    onClick={handleNextImage}
                  >
                    ›
                  </button>
                </>
              )}

              <div className={styles.mediaCount}>
                {selectedImageIndex + 1}/{gallery.images.length}
              </div>
            </div>

            <div className={styles.thumbnailRow}>
              {gallery.images.map((image, index) => {
                const isActive =
                  selectedImageIndex === index

                return (
                  <button
                    key={image.id}
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
                      src={image.imageUrl}
                      alt={image.title}
                      className={styles.thumbnailImage}
                    />
                  </button>
                )
              })}
            </div>
          </aside>

          <section className={styles.infoColumn}>
            <article className={styles.galleryCard}>
              <div className={styles.tagRow}>
                {gallery.tags.map((tag) => {
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
                사진첩 / 갤러리 / 이미지
              </p>

              <h1 className={styles.galleryTitle}>
                {gallery.title}
              </h1>

              <p className={styles.galleryDescription}>
                {gallery.description}
              </p>

              <div className={styles.divider} />

              <section className={styles.imageInfoSection}>
                <h2 className={styles.sectionTitle}>
                  선택한 사진
                </h2>

                <div className={styles.imageInfoBox}>
                  <strong className={styles.imageTitle}>
                    {selectedImage.title}
                  </strong>

                  <p className={styles.imageDescription}>
                    {selectedImage.description}
                  </p>

                  <span className={styles.imageCreatedAt}>
                    {selectedImage.createdAt}
                  </span>
                </div>
              </section>

              <section className={styles.galleryMetaSection}>
                <div className={styles.metaBox}>
                  <span className={styles.metaLabel}>
                    전체 사진
                  </span>

                  <strong className={styles.metaValue}>
                    {gallery.images.length}장
                  </strong>
                </div>

                <div className={styles.metaBox}>
                  <span className={styles.metaLabel}>
                    현재 사진
                  </span>

                  <strong className={styles.metaValue}>
                    {selectedImageIndex + 1}번째
                  </strong>
                </div>

                <div className={styles.metaBox}>
                  <span className={styles.metaLabel}>
                    등록일
                  </span>

                  <strong className={styles.metaValue}>
                    {gallery.createdAt}
                  </strong>
                </div>
              </section>

              <div className={styles.noticeBox}>
                사진첩 이미지는 공개 채널에서 읽기 전용으로 표시됩니다.
              </div>
            </article>

            <div className={styles.debugBox}>
              <span>
                channelCode : {channelCode}
              </span>

              <span>
                galleryId : {galleryId}
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
- 기존 PC 좌측 사진 / 우측 정보 구조 유지 완료
- 모바일 사진 / 정보 순서 유지 가능 구조 완료
- 대표 이미지 내부 좌우 슬라이딩 버튼 유지 완료
- 썸네일 클릭 전환 유지 완료
- 하단 다음 사진 버튼 제거 완료
- 하단 채널로 돌아가기 버튼 제거 완료
- mediaActions JSX 제거 완료
- handleBackToChannel 제거 완료
- useRouter 제거 완료
- default export React Component 유지 완료
- /channel/[channelCode]/gallery/[galleryId] 라우트 대응 완료
- 갤러리 상세 UI 유지 완료
- PC 2칼럼 구조 유지
- CSS Module 기반 모바일 대응 구조 유지
- 외부 갤러리 컴포넌트 import 없음
- API 호출 없음
- DB 직접 접근 없음
- 백엔드 변경 없음
- JSX multi-line 구조 유지
*/
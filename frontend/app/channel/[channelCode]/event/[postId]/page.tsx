// FILE : frontend/app/channel/[channelCode]/event/[postId]/page.tsx
// ROOT : C:\Users\kjm\social-platform\frontend\app\channel\[channelCode]\event\[postId]\page.tsx
// STATUS : FINAL MODIFIED
// ROLE : PUBLIC EVENT DETAIL UI PAGE
// CHANGE SUMMARY :
// - /channel/[channelCode]/event/[postId] 이벤트 상세 페이지 UI 구성
// - 이벤트 상세 전용 2칼럼 구조 적용
// - 좌측 : 이벤트 대표 이미지 / 썸네일
// - 우측 : 이벤트 제목 / 기간 / 내용 / 장소 / 문의하기
// - EVENT는 행사 / 이벤트 / 프로모션 안내 전용 포맷으로 분리
// - PC : 좌측 미디어 / 우측 이벤트 정보 2칼럼 구조
// - TABLET / MOBILE : 1칼럼 반응형 구조
// - DB / API / Service 연결 없음
// - mockEvent 기반 임시 UI 렌더링
// - 컴포넌트 에러 방지를 위해 외부 이벤트 컴포넌트 import 없음

'use client'

// SECTION 01 : IMPORT

import {
  useMemo,
  useState
} from 'react'

import styles from './EventDetailPage.module.css'

// SECTION 02 : TYPE

type PageProps = {
  params: {
    channelCode: string
    postId: string
  }
}

type EventStatus =
  | '진행중'
  | '예정'
  | '종료'

type EventDetail = {
  id: number
  channelCode: string
  title: string
  summary: string
  content: string
  eventStartAt: string
  eventEndAt: string
  locationText: string
  statusText: EventStatus
  targetText: string
  images: string[]
  badges: string[]
}

// SECTION 03 : MOCK DATA

const mockEvent: EventDetail = {
  id: 3,
  channelCode: 'BK28FWTUNA9NC',
  title: '주말 한정 피자 할인 이벤트',
  summary: '이번 주말 동안 대표 메뉴를 특별가로 제공합니다.',
  content:
    '매장 방문 고객과 포장 주문 고객을 대상으로 진행되는 기간 한정 이벤트입니다. 이벤트 기간 내 주문 시 일부 메뉴에 할인이 적용되며, 준비 수량 소진 시 조기 종료될 수 있습니다.',
  eventStartAt: '2026-05-02 09:00',
  eventEndAt: '2026-05-05 18:00',
  locationText: '매장 방문 / 포장 주문',
  statusText: '진행중',
  targetText: '전체 공개',
  images: [
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=1400&q=80'
  ],
  badges: [
    'EVENT',
    '기간 한정',
    '프로모션'
  ]
}

// SECTION 04 : COMPONENT

export default function PublicEventDetailPage({
  params
}: PageProps) {
  const channelCode =
    params.channelCode

  const postId =
    params.postId

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0)

  const event =
    useMemo<EventDetail>(() => {
      return {
        ...mockEvent,
        channelCode
      }
    }, [
      channelCode
    ])

  const selectedImage =
    event.images[selectedImageIndex] ??
    event.images[0]

  const hasMultipleImages =
    event.images.length > 1

  // SECTION 05 : HANDLER

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => {
      if (prev <= 0) {
        return event.images.length - 1
      }

      return prev - 1
    })
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => {
      if (prev >= event.images.length - 1) {
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
                alt={event.title}
                className={styles.mainImage}
              />

              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    className={`${styles.mediaNavButton} ${styles.mediaNavButtonLeft}`}
                    aria-label="previous event image"
                    onClick={handlePrevImage}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className={`${styles.mediaNavButton} ${styles.mediaNavButtonRight}`}
                    aria-label="next event image"
                    onClick={handleNextImage}
                  >
                    ›
                  </button>
                </>
              )}

              <div className={styles.mediaCount}>
                {selectedImageIndex + 1}/{event.images.length}
              </div>
            </div>

            <div className={styles.thumbnailRow}>
              {event.images.map((image, index) => {
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
                      alt={`${event.title} ${index + 1}`}
                      className={styles.thumbnailImage}
                    />
                  </button>
                )
              })}
            </div>
          </aside>

          <section className={styles.infoColumn}>
            <article className={styles.eventCard}>
              <div className={styles.badgeRow}>
                {event.badges.map((badge) => {
                  return (
                    <span
                      key={badge}
                      className={styles.badge}
                    >
                      {badge}
                    </span>
                  )
                })}

                <span className={styles.statusBadge}>
                  {event.statusText}
                </span>
              </div>

              <p className={styles.categoryText}>
                이벤트 / 행사 안내 / 프로모션
              </p>

              <h1 className={styles.eventTitle}>
                {event.title}
              </h1>

              <p className={styles.summaryText}>
                {event.summary}
              </p>

              <div className={styles.divider} />

              <section className={styles.periodSection}>
                <h2 className={styles.sectionTitle}>
                  이벤트 기간
                </h2>

                <div className={styles.periodBox}>
                  <div className={styles.periodItem}>
                    <span className={styles.periodLabel}>
                      시작
                    </span>

                    <strong className={styles.periodValue}>
                      {event.eventStartAt}
                    </strong>
                  </div>

                  <div className={styles.periodDivider}>
                    ~
                  </div>

                  <div className={styles.periodItem}>
                    <span className={styles.periodLabel}>
                      종료
                    </span>

                    <strong className={styles.periodValue}>
                      {event.eventEndAt}
                    </strong>
                  </div>
                </div>
              </section>

              <section className={styles.detailSection}>
                <h2 className={styles.sectionTitle}>
                  내용
                </h2>

                <p className={styles.contentText}>
                  {event.content}
                </p>
              </section>

              <section className={styles.metaSection}>
                <div className={styles.metaBox}>
                  <span className={styles.metaLabel}>
                    진행 장소
                  </span>

                  <strong className={styles.metaValue}>
                    {event.locationText}
                  </strong>
                </div>

                <div className={styles.metaBox}>
                  <span className={styles.metaLabel}>
                    노출 대상
                  </span>

                  <strong className={styles.metaValue}>
                    {event.targetText}
                  </strong>
                </div>
              </section>

              <div className={styles.noticeBox}>
                이벤트 내용은 사업자 사정에 따라 변경될 수 있습니다.
              </div>

              <div className={styles.bottomActions}>
                <button
                  type="button"
                  className={styles.inquiryButton}
                >
                  문의하기
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
- 이벤트 상세 전용 페이지 구성 완료
- 제목 / 내용 / 기간 from ~ to 표시 완료
- 문의하기 버튼 구성 완료
- PC 2칼럼 구조 적용
- CSS Module 기반 모바일 대응 구조 적용
- 외부 이벤트 컴포넌트 import 없음
- API 호출 없음
- DB 직접 접근 없음
- 백엔드 변경 없음
- JSX multi-line 구조 유지
*/
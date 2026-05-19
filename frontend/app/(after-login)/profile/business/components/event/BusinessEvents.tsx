// FILE : frontend/app/(after-login)/profile/business/components/event/BusinessEvents.tsx
// ROOT : frontend/app/(after-login)/profile/business/components/event/BusinessEvents.tsx
// STATUS : CREATE MODE
// ROLE : BUSINESS EVENT / PROMOTION LIST UI
// CHANGE SUMMARY :
// - BusinessProducts.tsx 구조 기반 EVENT 전용 컴포넌트 생성
// - 타이틀 / 설명 헤더 없이 상태 박스와 카드 그리드만 렌더링
// - loading 상태에서 타이틀 없이 스켈레톤만 표시
// - error 상태에서 조회 실패 박스만 표시
// - empty 상태에서 비어 있음 박스만 표시
// - EVENT 데이터 존재 시 카드 그리드만 표시
// - authApi.ts getMe() 기반 profileId + channelCode 조회 유지
// - business-posts-api.ts getBusinessEventPosts() 연결
// - posts.postType = EVENT 데이터 기준 행사 / 이벤트 / 프로모션 표시
// - 대표 이미지 / 제목 / 내용 요약 / 등록일 출력 유지
// - 프론트는 API 응답만 사용하고 DB 직접 접근 없음

'use client'

// SECTION 01 : IMPORT

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import type {
  CSSProperties
} from 'react'

import type {
  MeResponse
} from '@/lib/authApi'

import {
  getMe
} from '@/lib/authApi'

import type {
  BusinessPostListItem
} from '@/lib/business/business-posts-api'

import {
  getBusinessPosts,
  getBusinessEventPosts
} from '@/lib/business/business-posts-api'

// SECTION 02 : TYPE

type BusinessMeUser =
  MeResponse['user'] & {
    profileId: number
    channelCode: string
    profileType: 'GENERAL' | 'BUSINESS'
  }

type BusinessMeResponse =
  MeResponse & {
    user: BusinessMeUser
  }

type EventViewItem = {
  id: number
  title: string
  content: string
  imageUrl: string | null
  createdAt: string | null
}

// SECTION 03 : CONSTANT

const EMPTY_MESSAGE =
  '등록된 행사 / 이벤트 / 프로모션이 없습니다.'

const FALLBACK_IMAGE_LABEL =
  'NO IMAGE'

// SECTION 04 : COMPONENT

export default function BusinessEvents() {
  const [items, setItems] =
    useState<EventViewItem[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const hasItems =
    items.length > 0

  // SECTION 05 : DATA FUNCTION

  const mapEventPostToViewItem = useCallback(
    (
      post: BusinessPostListItem
    ): EventViewItem => {
      return {
        id: post.id,
        title: post.title || '이벤트 이름 없음',
        content: post.content || '',
        imageUrl:
          post.thumbnailUrl ||
          post.imageUrl ||
          post.images?.[0]?.imageUrl ||
          null,
        createdAt: post.createdAt ?? null
      }
    },
    []
  )

  const loadEvents = useCallback(
    async () => {
      try {
        setLoading(true)
        setErrorMessage(null)

        const me =
          await getMe() as BusinessMeResponse

        if (
          !me.ok ||
          !me.user ||
          me.user.profileType !== 'BUSINESS'
        ) {
          setItems([])
          setErrorMessage(
            '비즈니스 프로필에서만 이벤트를 조회할 수 있습니다.'
          )
          return
        }

        const resolvedProfileId =
          Number(me.user.profileId)

        const resolvedChannelCode =
          String(me.user.channelCode || '')

        if (
          !resolvedProfileId ||
          !resolvedChannelCode
        ) {
          setItems([])
          setErrorMessage(
            '비즈니스 프로필 정보를 찾을 수 없습니다.'
          )
          return
        }

        const posts =
          await getBusinessEventPosts({
            profileId: resolvedProfileId,
            channelCode: resolvedChannelCode
          })

        const resolvedPosts =
          posts.length > 0
            ? posts
            : await getBusinessPosts({
                profileId: resolvedProfileId,
                channelCode: resolvedChannelCode,
                postType: 'EVENT',
                status: 'DRAFT'
              }).then((response) =>
                Array.isArray(response.posts)
                  ? response.posts
                  : []
              )

        const mappedItems =
          resolvedPosts.map(mapEventPostToViewItem)

        setItems(mappedItems)
      } catch (error) {
        console.error(
          'BUSINESS EVENT LOAD FAILED →',
          error
        )

        setItems([])
        setErrorMessage(
          '이벤트 정보를 불러오지 못했습니다.'
        )
      } finally {
        setLoading(false)
      }
    },
    [
      mapEventPostToViewItem
    ]
  )

  function buildContentPreview(
    content: string
  ) {
    const normalized =
      content.trim()

    if (!normalized) {
      return '상세 설명이 없습니다.'
    }

    if (normalized.length <= 60) {
      return normalized
    }

    return `${normalized.slice(0, 60)}...`
  }

  function formatCreatedAt(
    value: string | null
  ) {
    if (!value) {
      return '등록일 정보 없음'
    }

    const parsedDate =
      new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
      return '등록일 정보 없음'
    }

    return parsedDate.toLocaleDateString('ko-KR')
  }

  // SECTION 06 : EVENT FUNCTION

  function handleRetry() {
    void loadEvents()
  }

  // SECTION 07 : EFFECT

  useEffect(() => {
    void loadEvents()
  }, [
    loadEvents
  ])

  // SECTION 08 : RETURN

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingGridStyle}>
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              style={skeletonCardStyle}
            >
              <div style={skeletonImageStyle} />

              <div style={skeletonLineLargeStyle} />

              <div style={skeletonLineSmallStyle} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div style={pageStyle}>
        <div style={stateBoxStyle}>
          <div style={stateTitleStyle}>
            조회 실패
          </div>

          <div style={stateTextStyle}>
            {errorMessage}
          </div>

          <button
            type="button"
            onClick={handleRetry}
            style={retryButtonStyle}
          >
            다시 불러오기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {!hasItems && (
        <div style={stateBoxStyle}>
          <div style={stateTitleStyle}>
            비어 있음
          </div>

          <div style={stateTextStyle}>
            {EMPTY_MESSAGE}
          </div>
        </div>
      )}

      {hasItems && (
        <div style={gridStyle}>
          {items.map((item) => (
            <article
              key={item.id}
              style={cardStyle}
            >
              <div style={imageWrapStyle}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={imageStyle}
                  />
                ) : (
                  <div style={emptyImageStyle}>
                    {FALLBACK_IMAGE_LABEL}
                  </div>
                )}
              </div>

              <div style={bodyStyle}>
                <div style={eventTitleStyle}>
                  {item.title}
                </div>

                <div style={dateStyle}>
                  {formatCreatedAt(item.createdAt)}
                </div>

                <div style={contentStyle}>
                  {buildContentPreview(item.content)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// SECTION 09 : STYLE

const pageStyle: CSSProperties = {
  width: '100%',
  padding: 0,
  boxSizing: 'border-box'
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
  gap: 12,
  width: '100%'
}

const cardStyle: CSSProperties = {
  border: '1px solid #edf0f3',
  borderRadius: 14,
  background: '#fff',
  overflow: 'hidden',
  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)'
}

const imageWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  background: '#f3f4f6',
  overflow: 'hidden'
}

const imageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover'
}

const emptyImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.5
}

const bodyStyle: CSSProperties = {
  padding: 12,
  boxSizing: 'border-box'
}

const eventTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: '#111827',
  lineHeight: 1.35,
  wordBreak: 'break-word'
}

const dateStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 12,
  fontWeight: 700,
  color: '#1877f2',
  lineHeight: 1.35
}

const contentStyle: CSSProperties = {
  marginTop: 7,
  fontSize: 12,
  fontWeight: 400,
  color: '#6b7280',
  lineHeight: 1.45,
  wordBreak: 'break-word'
}

const stateBoxStyle: CSSProperties = {
  width: '100%',
  minHeight: 180,
  border: '1px dashed #d1d5db',
  borderRadius: 14,
  background: '#fafafa',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  boxSizing: 'border-box',
  textAlign: 'center'
}

const stateTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: '#111827',
  marginBottom: 6
}

const stateTextStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 400,
  color: '#6b7280',
  lineHeight: 1.5
}

const retryButtonStyle: CSSProperties = {
  marginTop: 14,
  height: 38,
  padding: '0 16px',
  borderRadius: 10,
  border: 'none',
  background: '#1877f2',
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer'
}

const loadingGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
  gap: 12,
  width: '100%'
}

const skeletonCardStyle: CSSProperties = {
  border: '1px solid #edf0f3',
  borderRadius: 14,
  background: '#fff',
  overflow: 'hidden',
  paddingBottom: 12
}

const skeletonImageStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '16 / 9',
  background: '#f3f4f6'
}

const skeletonLineLargeStyle: CSSProperties = {
  height: 14,
  width: '70%',
  margin: '12px 12px 0',
  borderRadius: 999,
  background: '#f3f4f6'
}

const skeletonLineSmallStyle: CSSProperties = {
  height: 12,
  width: '45%',
  margin: '8px 12px 0',
  borderRadius: 999,
  background: '#f3f4f6'
}

// SECTION 10 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- BusinessProducts.tsx 구조 기반 EVENT 전용 컴포넌트 생성
- HeaderBlock 없음
- EVENT_PAGE_TITLE 없음
- EVENT_PAGE_DESCRIPTION 없음
- 조회 실패 상태에서 stateBoxStyle만 렌더링
- 프론트 DB 직접 접근 없음
- profileId + channelCode API 조회 컨텍스트 유지
- getMe() 기반 BUSINESS 프로필 검증 유지
- posts.postType = EVENT 조회 helper 연결 전제
*/

// FILE : frontend/app/(after-login)/profile/business/components/product/BusinessProducts.tsx
// ROOT : frontend/app/(after-login)/profile/business/components/product/BusinessProducts.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS PRODUCT / SERVICE / MENU LIST UI
// CHANGE SUMMARY :
// - PRODUCT 카드 클릭 시 /profile/business/posts/[postId] 이동 추가
// - useRouter 기반 사업자 본인 관리 상세페이지 연결
// - article role="button" / tabIndex / keyboard event 추가
// - 기존 상품 조회 / 렌더링 / 에러 / 빈 상태 구조 유지
// - authApi.ts getMe() 기반 profileId + channelCode 조회 유지
// - business-posts-api.ts getBusinessProductPosts() 연결 유지
// - 프론트는 API 응답만 사용하고 DB 직접 접근 없음

'use client'

// SECTION 01 : IMPORT

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import type {
  CSSProperties,
  KeyboardEvent
} from 'react'

import {
  useRouter
} from 'next/navigation'

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
  getBusinessProductPosts
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

type ProductViewItem = {
  id: number
  title: string
  content: string
  priceAmount: number | null
  imageUrl: string | null
  createdAt: string | null
}

// SECTION 03 : CONSTANT

const EMPTY_MESSAGE =
  '등록된 상품 / 서비스 / 메뉴가 없습니다.'

const FALLBACK_IMAGE_LABEL =
  'NO IMAGE'

// SECTION 04 : COMPONENT

export default function BusinessProducts() {
  const router =
    useRouter()

  const [items, setItems] =
    useState<ProductViewItem[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const hasItems =
    items.length > 0

  // SECTION 05 : DATA FUNCTION

  const mapProductPostToViewItem = useCallback(
    (
      post: BusinessPostListItem
    ): ProductViewItem => {
      return {
        id: post.id,
        title: post.title || '이름 없음',
        content: post.content || '',
        priceAmount: post.priceAmount ?? null,
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

  const loadProducts = useCallback(
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
            '비즈니스 프로필에서만 상품을 조회할 수 있습니다.'
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
          await getBusinessProductPosts({
            profileId: resolvedProfileId,
            channelCode: resolvedChannelCode
          })

        const mappedItems =
          posts.map(mapProductPostToViewItem)

        setItems(mappedItems)
      } catch (error) {
        console.error(
          'BUSINESS PRODUCT LOAD FAILED →',
          error
        )

        setItems([])
        setErrorMessage(
          '상품 정보를 불러오지 못했습니다.'
        )
      } finally {
        setLoading(false)
      }
    },
    [
      mapProductPostToViewItem
    ]
  )

  function formatPrice(
    value: number | null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return '가격 정보 없음'
    }

    return `${value.toLocaleString()}원`
  }

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

  // SECTION 06 : EVENT FUNCTION

  function handleRetry() {
    void loadProducts()
  }

  function handleOpenPostDetail(
    postId: number
  ) {
    if (
      !postId ||
      Number.isNaN(postId) ||
      postId <= 0
    ) {
      return
    }

    router.push(
      `/profile/business/product/${postId}`
    )
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLElement>,
    postId: number
  ) {
    if (
      event.key !== 'Enter' &&
      event.key !== ' '
    ) {
      return
    }

    event.preventDefault()

    handleOpenPostDetail(postId)
  }

  // SECTION 07 : EFFECT

  useEffect(() => {
    void loadProducts()
  }, [
    loadProducts
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
              role="button"
              tabIndex={0}
              aria-label={`${item.title} 상세 보기`}
              onClick={() => handleOpenPostDetail(item.id)}
              onKeyDown={(event) => handleCardKeyDown(
                event,
                item.id
              )}
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
                <div style={productTitleStyle}>
                  {item.title}
                </div>

                <div style={priceStyle}>
                  {formatPrice(item.priceAmount)}
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
  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
  cursor: 'pointer',
  outline: 'none'
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

const productTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: '#111827',
  lineHeight: 1.35,
  wordBreak: 'break-word'
}

const priceStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 14,
  fontWeight: 800,
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
  aspectRatio: '1 / 1',
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
- 상품 / 서비스 / 메뉴 카드 클릭 시 /profile/business/posts/[postId] 이동
- 관리자용 상세 라우트 기준 유지
- 공개 사용자용 /channel/[channelCode]/post/[postId] 와 혼동 금지
- HeaderBlock 제거 유지
- PRODUCT_PAGE_TITLE 제거 유지
- PRODUCT_PAGE_DESCRIPTION 제거 유지
- 조회 실패 상태에서 stateBoxStyle만 렌더링
- 프론트 DB 직접 접근 없음
- profileId + channelCode API 조회 컨텍스트 유지
*/
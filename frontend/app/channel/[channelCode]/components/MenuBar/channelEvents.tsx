// FILE : frontend/app/channel/[channelCode]/components/MenuBar/channelEvents.tsx
// ROOT : frontend/app/channel/[channelCode]/components/MenuBar/channelEvents.tsx
// STATUS : MODIFY MODE
// ROLE : PUBLIC CHANNEL EVENT / PROMOTION VIEW COMPONENT
// CHANGE SUMMARY :
// - BusinessEvents 而댄룷?뚰듃瑜??ъ슜??怨듦컻 梨꾨꼸酉??꾩슜 ChannelEvents濡??ш?怨?
// - getMe / authApi / business-posts-api 吏곸젒 ?몄텧 ?쒓굅
// - 遺紐?而댄룷?뚰듃?먯꽌 ?꾨떖諛쏆? items / loading / errorMessage 湲곗? ?뚮뜑留?
// - EVENT ?곗씠??議댁옱 ??移대뱶 洹몃━?쒕쭔 ?쒖떆
// - loading ?곹깭?먯꽌 ??댄? ?놁씠 ?ㅼ펷?덊넠留??쒖떆
// - error ?곹깭?먯꽌 議고쉶 ?ㅽ뙣 諛뺤뒪留??쒖떆
// - empty ?곹깭?먯꽌 鍮꾩뼱 ?덉쓬 諛뺤뒪留??쒖떆
// - ????대?吏 / ?쒕ぉ / ?댁슜 ?붿빟 / ?깅줉??異쒕젰 ?좎?
// - DB / API / Service 吏곸젒 ?묎렐 ?놁쓬

'use client'

// SECTION 01 : IMPORT

import type {
  CSSProperties
} from 'react'
import {
  useEffect,
  useState
} from 'react'
import {
  useParams,
  useRouter
} from 'next/navigation'

// SECTION 02 : TYPE

export type ChannelEventViewItem = {
  id: number
  title: string
  content?: string | null
  imageUrl?: string | null
  createdAt?: string | null
}

type ChannelEventsProps = {
  items?: ChannelEventViewItem[] | null
  loading?: boolean
  errorMessage?: string | null
  onRetry?: (() => void) | null
  detailRouteType?: 'event' | 'post'
}

// SECTION 03 : CONSTANT

const EMPTY_MESSAGE =
  '등록된 행사 / 이벤트 / 프로모션이 없습니다.'

const FALLBACK_IMAGE_LABEL =
  'NO IMAGE'

// SECTION 04 : COMPONENT

export default function ChannelEvents({
  items,
  loading = false,
  errorMessage = null,
  onRetry = null,
  detailRouteType = 'event'
}: ChannelEventsProps) {
  const router =
    useRouter()

  const params =
    useParams<{ channelCode?: string }>()

  const [columnCount, setColumnCount] =
    useState(2)

  const safeItems =
    Array.isArray(items)
      ? items
      : []

  const hasItems =
    safeItems.length > 0

  useEffect(() => {
    function updateColumnCount() {
      if (window.innerWidth >= 1200) {
        setColumnCount(2)
        return
      }

      if (window.innerWidth > 640) {
        setColumnCount(3)
        return
      }

      setColumnCount(2)
    }

    updateColumnCount()

    window.addEventListener('resize', updateColumnCount)

    return () => {
      window.removeEventListener('resize', updateColumnCount)
    }
  }, [])

  // SECTION 05 : DATA FUNCTION

  function buildContentPreview(
    content?: string | null
  ) {
    const normalized =
      typeof content === 'string'
        ? content.trim()
        : ''

    if (!normalized) {
      return '상세 설명이 없습니다.'
    }

    if (normalized.length <= 60) {
      return normalized
    }

    return `${normalized.slice(0, 60)}...`
  }

  function formatCreatedAt(
    value?: string | null
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

  function handleOpenPost(
    postId: number
  ) {
    if (
      !postId ||
      Number.isNaN(postId) ||
      postId <= 0
    ) {
      return
    }

    const channelCode =
      String(params?.channelCode || '')
        .trim()

    if (!channelCode) {
      return
    }

    router.push(
      `/channel/${encodeURIComponent(channelCode)}/${detailRouteType}/${postId}`
    )
  }

  // SECTION 06 : RETURN - LOADING

  if (loading) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            ...loadingGridStyle,
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
          }}
        >
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

  // SECTION 07 : RETURN - ERROR

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

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={retryButtonStyle}
            >
              다시 불러오기
            </button>
          )}
        </div>
      </div>
    )
  }

  // SECTION 08 : RETURN - NORMAL

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
        <div
          style={{
            ...gridStyle,
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
          }}
        >
          {safeItems.map((item) => (
            <article
              key={item.id}
              style={clickableCardStyle}
              role="button"
              tabIndex={0}
              onClick={() => handleOpenPost(item.id)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' ||
                  event.key === ' '
                ) {
                  event.preventDefault()
                  handleOpenPost(item.id)
                }
              }}
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
                  {item.title || '이벤트 이름 없음'}
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
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  width: '100%'
}

const cardStyle: CSSProperties = {
  overflow: 'hidden',
  border: '1px solid #edf0f3',
  borderRadius: 14,
  background: '#ffffff',
  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)'
}

const clickableCardStyle: CSSProperties = {
  ...cardStyle,
  cursor: 'pointer'
}

const imageWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
  background: '#f3f4f6'
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
  color: '#111827',
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.35,
  wordBreak: 'break-word'
}

const dateStyle: CSSProperties = {
  marginTop: 5,
  color: '#1877f2',
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.35
}

const contentStyle: CSSProperties = {
  marginTop: 7,
  color: '#6b7280',
  fontSize: 12,
  fontWeight: 400,
  lineHeight: 1.45,
  wordBreak: 'break-word'
}

const stateBoxStyle: CSSProperties = {
  width: '100%',
  minHeight: 180,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  border: '1px dashed #d1d5db',
  borderRadius: 14,
  background: '#fafafa',
  textAlign: 'center'
}

const stateTitleStyle: CSSProperties = {
  marginBottom: 6,
  color: '#111827',
  fontSize: 15,
  fontWeight: 800
}

const stateTextStyle: CSSProperties = {
  color: '#6b7280',
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.5
}

const retryButtonStyle: CSSProperties = {
  height: 38,
  marginTop: 14,
  padding: '0 16px',
  border: 'none',
  borderRadius: 10,
  background: '#1877f2',
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer'
}

const loadingGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  width: '100%'
}

const skeletonCardStyle: CSSProperties = {
  overflow: 'hidden',
  paddingBottom: 12,
  border: '1px solid #edf0f3',
  borderRadius: 14,
  background: '#ffffff'
}

const skeletonImageStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '16 / 9',
  background: '#f3f4f6'
}

const skeletonLineLargeStyle: CSSProperties = {
  width: '70%',
  height: 14,
  margin: '12px 12px 0',
  borderRadius: 999,
  background: '#f3f4f6'
}

const skeletonLineSmallStyle: CSSProperties = {
  width: '45%',
  height: 12,
  margin: '8px 12px 0',
  borderRadius: 999,
  background: '#f3f4f6'
}

// SECTION 10 : VALIDATION

/*
VALIDATION:
- 梨꾨꼸酉??꾩슜 ChannelEvents 而댄룷?뚰듃濡?蹂寃??꾨즺
- BusinessEvents ?ㅼ씠諛??쒓굅 ?꾨즺
- getMe / authApi 吏곸젒 ?몄텧 ?쒓굅 ?꾨즺
- getBusinessPosts / getBusinessEventPosts 吏곸젒 ?몄텧 ?쒓굅 ?꾨즺
- 遺紐?props 湲곕컲 items / loading / errorMessage ?뚮뜑留?援ъ“ ?꾨즺
- EVENT 移대뱶 洹몃━??異쒕젰 ?좎? ?꾨즺
- loading / error / empty ?곹깭 泥섎━ ?꾨즺
- DB 吏곸젒 ?묎렐 ?놁쓬
- API 吏곸젒 ?몄텧 ?놁쓬
- 愿由ъ옄 鍮꾩쫰?덉뒪 ?대깽??而댄룷?뚰듃 ?곹뼢 ?놁쓬
*/

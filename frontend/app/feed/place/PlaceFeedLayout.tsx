// FILE : frontend/app/feed/place/PlaceFeedLayout.tsx
// ROOT : C:\Users\kjm\social-platform\frontend\app\feed\place\PlaceFeedLayout.tsx
// STATUS : MODIFY MODE
// ROLE : PLACE FEED PAGE LAYOUT
// CHANGE SUMMARY :
// - PLACE 피드 상단 지역 타이틀 잘림 현상 수정 유지
// - shellStyle 상단 padding 증가 유지
// - headerWrapStyle height auto / overflow visible / paddingTop 적용 유지
// - PC 좌측 사이드바 + 우측 콘텐츠 구조 유지
// - 모바일 사이드바 숨김 + 상단 모바일 필터 구조 유지
// - 모바일 필터 영역 하단 native scrollbar 노출 방지
// - 모바일 필터 영역 좌/우 슬라이드 버튼 추가
// - 슬라이드 버튼 클릭 시 mobileFilters 영역 가로 이동 처리
// - 슬라이드 가능 여부에 따라 좌/우 버튼 비활성화 처리
// - API 호출 없음
// - DB 직접 접근 없음

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useRef,
  useState
} from 'react'

import type {
  CSSProperties,
  ReactNode
} from 'react'

// SECTION 02 : TYPE

type Props = {
  header: ReactNode
  search: ReactNode
  sidebar: ReactNode
  mobileFilters: ReactNode
  children: ReactNode
}

type SlideDirection =
  | 'left'
  | 'right'

// SECTION 03 : CONSTANT

const MOBILE_BREAKPOINT =
  768

const MOBILE_FILTER_SLIDE_AMOUNT =
  180

const MOBILE_FILTER_SCROLL_TOLERANCE =
  4

// SECTION 04 : COMPONENT

export default function PlaceFeedLayout({
  header,
  search,
  sidebar,
  mobileFilters,
  children
}: Props) {
  const [isMobile, setIsMobile] =
    useState(false)

  const [canSlideLeft, setCanSlideLeft] =
    useState(false)

  const [canSlideRight, setCanSlideRight] =
    useState(false)

  const mobileFilterScrollRef =
    useRef<HTMLDivElement | null>(null)

  // SECTION 05 : EVENT FUNCTION

  const syncMobileFilterSlideState = () => {
    const target =
      mobileFilterScrollRef.current

    if (!target) {
      setCanSlideLeft(false)
      setCanSlideRight(false)

      return
    }

    const maxScrollLeft =
      target.scrollWidth - target.clientWidth

    setCanSlideLeft(
      target.scrollLeft > MOBILE_FILTER_SCROLL_TOLERANCE
    )

    setCanSlideRight(
      target.scrollLeft < maxScrollLeft - MOBILE_FILTER_SCROLL_TOLERANCE
    )
  }

  const handleMobileFilterSlide = (
    direction: SlideDirection
  ) => {
    const target =
      mobileFilterScrollRef.current

    if (!target) {
      return
    }

    const nextLeft =
      direction === 'left'
        ? target.scrollLeft - MOBILE_FILTER_SLIDE_AMOUNT
        : target.scrollLeft + MOBILE_FILTER_SLIDE_AMOUNT

    target.scrollTo({
      left: nextLeft,
      behavior: 'smooth'
    })
  }

  // SECTION 06 : EFFECT

  useEffect(() => {
    function syncViewport() {
      setIsMobile(
        window.innerWidth < MOBILE_BREAKPOINT
      )
    }

    syncViewport()

    window.addEventListener(
      'resize',
      syncViewport
    )

    return () => {
      window.removeEventListener(
        'resize',
        syncViewport
      )
    }
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setCanSlideLeft(false)
      setCanSlideRight(false)

      return
    }

    const target =
      mobileFilterScrollRef.current

    if (!target) {
      return
    }

    syncMobileFilterSlideState()

    target.addEventListener(
      'scroll',
      syncMobileFilterSlideState
    )

    window.addEventListener(
      'resize',
      syncMobileFilterSlideState
    )

    const timer =
      window.setTimeout(() => {
        syncMobileFilterSlideState()
      }, 120)

    return () => {
      target.removeEventListener(
        'scroll',
        syncMobileFilterSlideState
      )

      window.removeEventListener(
        'resize',
        syncMobileFilterSlideState
      )

      window.clearTimeout(timer)
    }
  }, [
    isMobile,
    mobileFilters
  ])

  // SECTION 07 : RETURN

  return (
    <main style={pageStyle}>
      <style>
        {`
          .place-mobile-filter-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .place-mobile-filter-scroll::-webkit-scrollbar {
            display: none;
          }

          .place-mobile-filter-scroll * {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .place-mobile-filter-scroll *::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      <section
        style={{
          ...shellStyle,
          ...(isMobile
            ? shellMobileStyle
            : shellDesktopStyle)
        }}
      >
        <div
          style={
            isMobile
              ? headerTopMobileStyle
              : headerTopDesktopStyle
          }
        >
          <header style={headerWrapStyle}>
            {header}
          </header>

          <div style={searchWrapStyle}>
            {search}
          </div>
        </div>

        {isMobile && (
          <div style={mobileFilterWrapStyle}>
            <button
              type="button"
              aria-label="이전 필터 보기"
              style={
                canSlideLeft
                  ? mobileFilterSlideButtonStyle
                  : mobileFilterSlideButtonDisabledStyle
              }
              disabled={!canSlideLeft}
              onClick={() => {
                handleMobileFilterSlide('left')
              }}
            >
              ‹
            </button>

            <div style={mobileFilterViewportStyle}>
              <div
                ref={mobileFilterScrollRef}
                className="place-mobile-filter-scroll"
                style={mobileFilterScrollStyle}
              >
                <div style={mobileFilterInnerStyle}>
                  {mobileFilters}
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="다음 필터 보기"
              style={
                canSlideRight
                  ? mobileFilterSlideButtonStyle
                  : mobileFilterSlideButtonDisabledStyle
              }
              disabled={!canSlideRight}
              onClick={() => {
                handleMobileFilterSlide('right')
              }}
            >
              ›
            </button>
          </div>
        )}

        <div style={layoutStyle}>
          {!isMobile && (
            <div style={sidebarWrapStyle}>
              {sidebar}
            </div>
          )}

          <section style={contentStyle}>
            {children}
          </section>
        </div>
      </section>
    </main>
  )
}

// SECTION 08 : STYLE

const pageStyle: CSSProperties = {
  width: '100%',
  minHeight: '100vh',
  background: '#ffffff',
  boxSizing: 'border-box',
  overflow: 'visible'
}

const shellStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1320,
  margin: '0 auto',
  boxSizing: 'border-box',
  overflow: 'visible'
}

const shellDesktopStyle: CSSProperties = {
  padding: '8px 20px 48px'
}

const shellMobileStyle: CSSProperties = {
  padding: '6px 14px 36px'
}

const headerWrapStyle: CSSProperties = {
  flex: '0 0 auto',
  height: 'auto',
  minHeight: 'auto',
  paddingTop: 0,
  boxSizing: 'border-box',
  overflow: 'visible'
}

const searchWrapStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 0,
  boxSizing: 'border-box',
  marginBottom: 20
}

const headerTopDesktopStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 20
}

const headerTopMobileStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column'
}

const mobileFilterWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  marginBottom: 14,
  display: 'grid',
  gridTemplateColumns: '28px minmax(0, 1fr) 28px',
  alignItems: 'center',
  columnGap: 6,
  boxSizing: 'border-box'
}

const mobileFilterViewportStyle: CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  boxSizing: 'border-box'
}

const mobileFilterScrollStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
  overflowY: 'hidden',
  WebkitOverflowScrolling: 'touch',
  boxSizing: 'border-box'
}

const mobileFilterInnerStyle: CSSProperties = {
  width: 'max-content',
  minWidth: '100%',
  boxSizing: 'border-box'
}

const mobileFilterSlideButtonStyle: CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 999,
  background: '#f3f4f6',
  color: '#111827',
  fontSize: 18,
  fontWeight: 900,
  lineHeight: '28px',
  cursor: 'pointer',
  boxSizing: 'border-box'
}

const mobileFilterSlideButtonDisabledStyle: CSSProperties = {
  ...mobileFilterSlideButtonStyle,
  background: '#f9fafb',
  color: '#cbd5e1',
  cursor: 'default'
}

const layoutStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 24,
  width: '100%'
}

const sidebarWrapStyle: CSSProperties = {
  width: 230,
  flex: '0 0 230px',
  boxSizing: 'border-box'
}

const contentStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  boxSizing: 'border-box'
}

// SECTION 09 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- PLACE 피드 전용 layout 컴포넌트 유지
- PC sidebar + content 구조 유지
- 모바일 sidebar 숨김 구조 유지
- mobileFilters 상단 렌더링 유지
- mobileFilters native scrollbar 숨김 처리 완료
- mobileFilters 좌/우 슬라이드 버튼 추가 완료
- slide button 클릭 시 scrollLeft 이동 처리 완료
- scroll 가능 여부에 따라 button disabled 처리 완료
- page.tsx에서 UI 블록 주입 가능
- header 영역 overflow visible 적용 유지
- shell 상단 padding 증가로 타이틀 잘림 방지 유지
- API 호출 없음
- DB 직접 접근 없음
- 백엔드 변경 없음
*/

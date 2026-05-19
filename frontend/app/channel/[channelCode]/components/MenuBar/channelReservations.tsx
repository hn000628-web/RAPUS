// FILE : frontend/app/channel/[channelCode]/components/MenuBar/channelReservations.tsx
// ROOT : frontend/app/channel/[channelCode]/components/MenuBar/channelReservations.tsx
// STATUS : MODIFY MODE
// ROLE : PUBLIC BUSINESS CHANNEL RESERVATION INTRO COMPONENT
// CHANGE SUMMARY :
// - 기존 상세 예약 폼 UI 제거
// - 예약 탭 1차 화면을 안내 + 예약하기 버튼 구조로 변경
// - 예약하기 클릭 시 /channel/[channelCode]/reservation 상세 예약 페이지로 이동
// - API 호출 없음
// - DB 직접 접근 없음
// - Service / Controller 수정 없음

'use client'

// SECTION 01 : IMPORT

import {
  useMemo
} from 'react'

import type {
  CSSProperties
} from 'react'

import {
  useParams,
  useRouter
} from 'next/navigation'

// SECTION 02 : TYPE

type RouteParams = {
  channelCode?: string
}

type ReservationGuideItem = {
  title: string
  description: string
}

// SECTION 03 : CONSTANT

const RESERVATION_GUIDE_ITEMS: ReservationGuideItem[] = [
  {
    title: '방문 예약',
    description: '매장 방문 시간과 인원을 선택할 수 있습니다.'
  },
  {
    title: '포장 예약',
    description: '방문 수령 시간을 선택하고 메뉴를 미리 예약할 수 있습니다.'
  },
  {
    title: '배달 예약',
    description: '원하는 배달 시간과 메뉴 수량을 선택할 수 있습니다.'
  }
]

// SECTION 04 : COMPONENT

export default function ChannelReservations() {
  // SECTION 05 : ROUTE

  const router =
    useRouter()

  const params =
    useParams<RouteParams>()

  const channelCode = useMemo(() => {
    return String(params?.channelCode || '').trim()
  }, [
    params?.channelCode
  ])

  // SECTION 06 : EVENT FUNCTION

  function handleReservationClick() {
    if (!channelCode) {
      return
    }

    router.push(`/channel/${channelCode}/reservation`)
  }

  // SECTION 07 : STYLE

  const shellStyle: CSSProperties = {
    width: '100%',
    padding: '20px 16px 28px',
    boxSizing: 'border-box'
  }

  const cardStyle: CSSProperties = {
    width: '100%',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 20,
    boxSizing: 'border-box'
  }

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: '#111827'
  }

  const descStyle: CSSProperties = {
    margin: '8px 0 0',
    fontSize: 13,
    lineHeight: 1.6,
    color: '#6b7280'
  }

  const guideListStyle: CSSProperties = {
    display: 'grid',
    gap: 10,
    marginTop: 20
  }

  const guideItemStyle: CSSProperties = {
    padding: 14,
    border: '1px solid #eef0f3',
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    boxSizing: 'border-box'
  }

  const guideTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: 14,
    fontWeight: 900,
    color: '#111827'
  }

  const guideDescStyle: CSSProperties = {
    margin: '6px 0 0',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#6b7280'
  }

  const noticeStyle: CSSProperties = {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    fontSize: 13,
    lineHeight: 1.6,
    color: '#9a3412',
    boxSizing: 'border-box'
  }

  const buttonStyle: CSSProperties = {
    width: '100%',
    height: 48,
    marginTop: 18,
    border: 'none',
    borderRadius: 14,
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 900,
    cursor: channelCode
      ? 'pointer'
      : 'not-allowed',
    opacity: channelCode
      ? 1
      : 0.5
  }

  // SECTION 08 : UI BLOCK

  const GuideListUI = (
    <div style={guideListStyle}>
      {RESERVATION_GUIDE_ITEMS.map(item => {
        return (
          <div
            key={item.title}
            style={guideItemStyle}
          >
            <p style={guideTitleStyle}>
              {item.title}
            </p>

            <p style={guideDescStyle}>
              {item.description}
            </p>
          </div>
        )
      })}
    </div>
  )

  const NoticeUI = (
    <div style={noticeStyle}>
      예약하기 버튼을 누르면 방문 / 포장 / 배달 예약 상세 화면으로 이동합니다.
      예약 시간, 인원, 메뉴 수량은 다음 화면에서 입력합니다.
    </div>
  )

  // SECTION 09 : RETURN

  return (
    <section style={shellStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>
          예약
        </h2>

        <p style={descStyle}>
          이 매장은 방문 / 포장 / 배달 예약을 지원합니다.
          원하는 예약 방식을 선택하고 시간과 메뉴 수량을 입력할 수 있습니다.
        </p>

        {GuideListUI}

        {NoticeUI}

        <button
          type="button"
          style={buttonStyle}
          disabled={!channelCode}
          onClick={handleReservationClick}
        >
          예약하기
        </button>
      </div>
    </section>
  )
}
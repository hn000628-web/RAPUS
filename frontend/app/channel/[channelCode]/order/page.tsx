'use client'

import {
  useState,
  type CSSProperties
} from 'react'
import { useParams, useRouter } from 'next/navigation'

import OrderLayout from './components/OrderLayout'

type RouteParams = {
  channelCode?: string
}

const contentStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  paddingBottom: '80px'
}

const introCardStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '20px',
  flexWrap: 'wrap',
  alignSelf: 'flex-start',
  padding: '26px',
  borderRadius: '20px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
}

const introTitleWrapStyle: CSSProperties = {
  minWidth: '220px',
  flex: '1 1 320px'
}

const introDescriptionWrapStyle: CSSProperties = {
  minWidth: '280px',
  flex: '1 1 420px'
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 900,
  color: '#111827',
  letterSpacing: '-0.03em'
}

const descriptionStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: '14px',
  lineHeight: 1.65,
  color: '#4b5563'
}

const modeGridStyle: CSSProperties = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px'
}

const modeButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '50px',
  minHeight: '50px',
  padding: '0 14px',
  border: 'none',
  borderRadius: '15px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 900,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  cursor: 'pointer'
}

const secondaryModeButtonStyle: CSSProperties = {
  ...modeButtonStyle,
  backgroundColor: '#1f2937'
}

const backButtonStyle: CSSProperties = {
  ...modeButtonStyle,
  backgroundColor: '#ffffff',
  color: '#111827',
  border: '1px solid #d1d5db'
}

const noticeCardStyle: CSSProperties = {
  width: '100%',
  padding: '18px 20px',
  borderRadius: '18px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: 1.6
}

export default function ChannelOrderPage() {
  const router = useRouter()
  const params = useParams<RouteParams>()
  const channelCode = String(params?.channelCode || '').trim()
  const [isGeneralOrderSelected, setIsGeneralOrderSelected] =
    useState(false)

  function handleMoveOrderMode(path: string) {
    if (!channelCode) {
      return
    }

    router.push(`/channel/${channelCode}/order/${path}`)
  }

  function handleSelectGeneralOrder() {
    setIsGeneralOrderSelected(true)
  }

  function handleBackOrderMode() {
    setIsGeneralOrderSelected(false)
  }

  const IntroUI = (
    <section style={introCardStyle}>
      <div style={introTitleWrapStyle}>
        <h2 style={titleStyle}>주문 방식을 선택하세요</h2>
      </div>

      <div style={introDescriptionWrapStyle}>
        <p style={descriptionStyle}>
          오더는 픽업, 배달 방식에 따라 필요한 입력 정보가 다릅니다.
          매장 내 주문은 테이블 QR 주문을 이용합니다.
        </p>
      </div>
    </section>
  )

  const OrderModeUI = isGeneralOrderSelected ? (
    <section style={modeGridStyle}>
      <button
        type="button"
        style={modeButtonStyle}
        onClick={() => handleMoveOrderMode('pickup')}
      >
        픽업주문
      </button>

      <button
        type="button"
        style={secondaryModeButtonStyle}
        onClick={() => handleMoveOrderMode('delivery')}
      >
        배달주문
      </button>

      <button
        type="button"
        style={backButtonStyle}
        onClick={handleBackOrderMode}
      >
        이전
      </button>
    </section>
  ) : (
    <section>
      <button
        type="button"
        style={modeButtonStyle}
        onClick={handleSelectGeneralOrder}
      >
        일반주문
      </button>
    </section>
  )

  const NoticeUI = (
    <section style={noticeCardStyle}>
      {isGeneralOrderSelected
        ? '일반 주문 선택 상태입니다. 픽업주문 또는 배달주문을 선택해 주세요.'
        : '일반주문을 선택하면 해당 영역에서 픽업주문/배달주문을 선택할 수 있습니다.'}
    </section>
  )

  return (
    <OrderLayout
      channelCode={channelCode}
      hideSidebar
      headerMode="DEFAULT"
    >
      <section style={contentStyle}>
        {IntroUI}
        {OrderModeUI}
        {NoticeUI}
      </section>
    </OrderLayout>
  )
}

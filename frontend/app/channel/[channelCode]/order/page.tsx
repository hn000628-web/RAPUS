'use client'

import type { CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'

import OrderLayout from './components/OrderLayout'

type RouteParams = {
  channelCode?: string
}

type OrderModeItem = {
  id: string
  title: string
  description: string
  detail: string
  path: string
  actionLabel: string
}

const ORDER_MODE_ITEMS: OrderModeItem[] = [
  {
    id: 'pickup',
    title: '픽업주문',
    description: '고객이 주문 후 매장에서 직접 수령합니다.',
    detail: '메뉴 선택, 수량, 옵션, 픽업 예정 시간을 입력합니다.',
    path: 'pickup',
    actionLabel: '픽업주문 선택'
  },
  {
    id: 'delivery',
    title: '배달주문',
    description: '고객 주소지를 기준으로 배달 주문을 진행합니다.',
    detail: '메뉴 선택, 수량, 옵션, 배송지, 연락처, 배달 요청사항을 입력합니다.',
    path: 'delivery',
    actionLabel: '배달주문 선택'
  }
]

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
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '14px'
}

const modeCardStyle: CSSProperties = {
  width: '100%',
  minHeight: '210px',
  padding: '22px',
  borderRadius: '20px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'space-between',
  gap: '18px',
  textAlign: 'left',
  cursor: 'pointer'
}

const modeTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 900,
  color: '#111827',
  letterSpacing: '-0.02em'
}

const modeDescriptionStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: '14px',
  lineHeight: 1.55,
  color: '#4b5563'
}

const modeDetailStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: '12px',
  lineHeight: 1.5,
  color: '#9ca3af'
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

  function handleMoveOrderMode(path: string) {
    if (!channelCode) {
      return
    }

    router.push(`/channel/${channelCode}/order/${path}`)
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

  const OrderModeUI = (
    <section style={modeGridStyle}>
      {ORDER_MODE_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          style={modeCardStyle}
          onClick={() => handleMoveOrderMode(item.path)}
        >
          <span>
            <h3 style={modeTitleStyle}>{item.title}</h3>
            <p style={modeDescriptionStyle}>{item.description}</p>
            <p style={modeDetailStyle}>{item.detail}</p>
          </span>

          <span style={modeButtonStyle}>{item.actionLabel}</span>
        </button>
      ))}
    </section>
  )

  const NoticeUI = (
    <section style={noticeCardStyle}>
      현재는 UI 구성 단계입니다.
      실제 주문 생성, 고객 주소 조회, 결제, 사장님 주문관리는 이후 API / DB / Service 연동에서 처리합니다.
    </section>
  )

  return (
    <OrderLayout
      channelCode={channelCode}
      hideSidebar
      headerMode="PROFILE_LEFT"
      headerLeftBottomContent={IntroUI}
      headerRightContent={
        <section style={contentStyle}>
          {OrderModeUI}
        </section>
      }
    >
      <section style={contentStyle}>
        {NoticeUI}
      </section>
    </OrderLayout>
  )
}

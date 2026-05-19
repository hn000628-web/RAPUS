'use client'

import {
  useState,
  type CSSProperties
} from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  channelCode: string
}

const sectionStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column'
}

const orderCardStyle: CSSProperties = {
  width: '100%',
  padding: '24px',
  borderRadius: '18px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
}

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px'
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 800,
  color: '#111827',
  letterSpacing: '-0.02em'
}

const descriptionStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: '14px',
  lineHeight: 1.65,
  color: '#4b5563'
}

const buttonWrapStyle: CSSProperties = {
  marginTop: '22px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap'
}

const orderButtonStyle: CSSProperties = {
  flex: '1 1 180px',
  minWidth: 0,
  height: '48px',
  border: 'none',
  borderRadius: '14px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 800,
  cursor: 'pointer',
  textAlign: 'center'
}

const reservationOrderButtonStyle: CSSProperties = {
  ...orderButtonStyle,
  backgroundColor: '#1f2937'
}

const inlineActionButtonStyle: CSSProperties = {
  ...orderButtonStyle,
  flex: '1 1 160px'
}

const backButtonStyle: CSSProperties = {
  height: '40px',
  padding: '0 14px',
  border: '1px solid #d1d5db',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer'
}

const noticeStyle: CSSProperties = {
  marginTop: '12px',
  fontSize: '12px',
  lineHeight: 1.5,
  color: '#9ca3af',
  textAlign: 'center'
}

export default function ChannelOrder({
  channelCode
}: Props) {
  const router = useRouter()
  const [isGeneralOrderSelected, setIsGeneralOrderSelected] =
    useState(false)

  function handleGeneralOrderClick() {
    setIsGeneralOrderSelected(true)
  }

  function handleReservationOrderClick() {
    const safeChannelCode = String(channelCode || '').trim()
    if (!safeChannelCode) {
      return
    }

    router.push(`/channel/${safeChannelCode}/reservation`)
  }

  function handlePickupOrderClick() {
    const safeChannelCode = String(channelCode || '').trim()
    if (!safeChannelCode) {
      return
    }

    router.push(`/channel/${safeChannelCode}/order/pickup`)
  }

  function handleDeliveryOrderClick() {
    const safeChannelCode = String(channelCode || '').trim()
    if (!safeChannelCode) {
      return
    }

    router.push(`/channel/${safeChannelCode}/order/delivery`)
  }

  function handleResetGeneralOrderSelection() {
    setIsGeneralOrderSelected(false)
  }

  return (
    <section
      style={sectionStyle}
      data-channel-code={channelCode}
    >
      <div style={orderCardStyle}>
        <div style={headerRowStyle}>
          <h2 style={titleStyle}>
            오더
          </h2>

          {isGeneralOrderSelected && (
            <button
              type="button"
              style={backButtonStyle}
              onClick={handleResetGeneralOrderSelection}
            >
              이전
            </button>
          )}
        </div>

        <p style={descriptionStyle}>
          일반주문을 선택하면 픽업주문 또는 배달주문으로 바로 진행할 수 있습니다.
        </p>

        <div style={buttonWrapStyle}>
          {isGeneralOrderSelected ? (
            <>
              <button
                type="button"
                style={inlineActionButtonStyle}
                onClick={handlePickupOrderClick}
              >
                픽업주문
              </button>

              <button
                type="button"
                style={reservationOrderButtonStyle}
                onClick={handleDeliveryOrderClick}
              >
                배달주문
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                style={orderButtonStyle}
                onClick={handleGeneralOrderClick}
              >
                일반주문
              </button>

              <button
                type="button"
                style={reservationOrderButtonStyle}
                onClick={handleReservationOrderClick}
              >
                예약주문
              </button>
            </>
          )}
        </div>

        <div style={noticeStyle}>
          {isGeneralOrderSelected
            ? '원하는 주문 방식을 선택해 주세요.'
            : '일반주문은 즉시 주문, 예약주문은 미리 주문 또는 다음 일정 주문으로 진행됩니다.'}
        </div>
      </div>
    </section>
  )
}

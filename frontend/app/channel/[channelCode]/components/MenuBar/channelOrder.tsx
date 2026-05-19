'use client'

import { useState, type CSSProperties } from 'react'
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

const closeButtonStyle: CSSProperties = {
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

export default function ChannelOrder({ channelCode }: Props) {
  const router = useRouter()
  const [isOrderTypeModalOpen, setIsOrderTypeModalOpen] = useState(false)
  const [hoveredOrderType, setHoveredOrderType] = useState<'PICKUP' | 'DELIVERY' | null>(null)

  function handleGeneralOrderClick() {
    setIsOrderTypeModalOpen(true)
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

  function handleCloseOrderTypeModal() {
    setIsOrderTypeModalOpen(false)
  }

  return (
    <section style={sectionStyle} data-channel-code={channelCode}>
      <div style={orderCardStyle}>
        <div style={headerRowStyle}>
          <h2 style={titleStyle}>오더</h2>
        </div>

        <p style={descriptionStyle}>일반주문을 선택하면 픽업주문 또는 배달주문으로 진행할 수 있습니다.</p>

        <div style={buttonWrapStyle}>
          <button type="button" style={orderButtonStyle} onClick={handleGeneralOrderClick}>
            일반주문
          </button>

          <button type="button" style={reservationOrderButtonStyle} onClick={handleReservationOrderClick}>
            예약주문
          </button>
        </div>

        <div style={noticeStyle}>일반주문은 즉시 주문, 예약주문은 미리 주문 또는 다음 일정 주문으로 진행됩니다.</div>
      </div>

      {isOrderTypeModalOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 1000,
            boxSizing: 'border-box'
          }}
          onClick={handleCloseOrderTypeModal}
        >
          <section
            style={{
              width: 'min(100%, 480px)',
              background: '#fff',
              borderRadius: '24px',
              border: '1px solid #dbe2ea',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.22)',
              padding: '22px',
              boxSizing: 'border-box'
            }}
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#111827'
                }}
              >
                주문유형
              </h3>
              <button type="button" style={closeButtonStyle} onClick={handleCloseOrderTypeModal}>
                닫기
              </button>
            </div>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#64748b'
              }}
            >
              주문 방식을 선택해 주세요.
            </p>

            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                style={{
                  width: 'min(100%, 200px)',
                  minHeight: '64px',
                  borderRadius: '14px',
                  border: hoveredOrderType === 'PICKUP' ? '1px solid #0f172a' : '1px solid #dbe3ef',
                  background: '#ffffff',
                  color: hoveredOrderType === 'PICKUP' ? '#ffffff' : '#0f172a',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 120ms ease',
                  ...(hoveredOrderType === 'PICKUP'
                    ? {
                        background: '#0f172a'
                      }
                    : {})
                }}
                onMouseEnter={() => {
                  setHoveredOrderType('PICKUP')
                }}
                onMouseLeave={() => {
                  setHoveredOrderType(null)
                }}
                onFocus={() => {
                  setHoveredOrderType('PICKUP')
                }}
                onBlur={() => {
                  setHoveredOrderType(null)
                }}
                onClick={() => {
                  handleCloseOrderTypeModal()
                  handlePickupOrderClick()
                }}
              >
                픽업주문
              </button>

              <button
                type="button"
                style={{
                  width: 'min(100%, 200px)',
                  minHeight: '64px',
                  borderRadius: '14px',
                  border: hoveredOrderType === 'DELIVERY' ? '1px solid #0f172a' : '1px solid #dbe3ef',
                  background: hoveredOrderType === 'DELIVERY' ? '#0f172a' : '#ffffff',
                  color: hoveredOrderType === 'DELIVERY' ? '#ffffff' : '#0f172a',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 120ms ease'
                }}
                onMouseEnter={() => {
                  setHoveredOrderType('DELIVERY')
                }}
                onMouseLeave={() => {
                  setHoveredOrderType(null)
                }}
                onFocus={() => {
                  setHoveredOrderType('DELIVERY')
                }}
                onBlur={() => {
                  setHoveredOrderType(null)
                }}
                onClick={() => {
                  handleCloseOrderTypeModal()
                  handleDeliveryOrderClick()
                }}
              >
                배달주문
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

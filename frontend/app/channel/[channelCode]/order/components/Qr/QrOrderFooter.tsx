// FILE : frontend/app/channel/[channelCode]/order/components/Qr/QrOrderFooter.tsx
// ROOT : frontend/app/channel/[channelCode]/order/components/Qr/QrOrderFooter.tsx
// STATUS : MODIFY MODE
// ROLE : PUBLIC BUSINESS CHANNEL QR ORDER FOOTER COMPONENT
// CHANGE SUMMARY :
// - QR코드 주문 전용 하단 고정 푸터 컴포넌트 수정
// - 주문하기 버튼 왼쪽에 매장이용 / 픽업포장 선택 버튼 추가
// - selectedOrderType / onSelectOrderType optional props 추가
// - 기본 주문 처리 방식은 DINE_IN 으로 설정
// - 총 금액 / 로그인 주문 안내 / 주문 처리 방식 / 주문하기 버튼 UI 구성
// - disabled 상태 버튼 스타일 대응
// - QR 주문은 로그인 전용 고객 휴대폰 주문 UI 문구 반영
// - 현재 단계는 UI only 목업 구조
// - API 호출 / DB 접근 / 주문 생성 / 결제 연결 없음

'use client'

// SECTION 01 : IMPORT

import type {
  CSSProperties
} from 'react'

// SECTION 02 : TYPE

export type QrOrderType =
  | 'DINE_IN'
  | 'TAKEOUT'

type Props = {
  totalAmount: number
  disabled?: boolean
  buttonLabel?: string
  totalLabel?: string
  orderInfoText?: string
  selectedOrderType?: QrOrderType
  onSelectOrderType?: (orderType: QrOrderType) => void
  onSubmitOrder: () => void
}

type OrderTypeOption = {
  id: QrOrderType
  label: string
}

// SECTION 03 : CONSTANT

const ORDER_TYPE_OPTIONS: OrderTypeOption[] = [
  {
    id: 'DINE_IN',
    label: '매장이용'
  },
  {
    id: 'TAKEOUT',
    label: '픽업포장'
  }
]

// SECTION 04 : STYLE

const footerShellStyle: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 3000,
  padding: '12px 20px',
  borderTop: '1px solid #e5e7eb',
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 -10px 30px rgba(15, 23, 42, 0.08)'
}

const footerInnerStyle: CSSProperties = {
  width: '100%',
  maxWidth: '1160px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '16px'
}

const totalGroupStyle: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}

const totalRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  minWidth: 0
}

const labelStyle: CSSProperties = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#111827',
  whiteSpace: 'nowrap'
}

const amountStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 950,
  color: '#111827',
  whiteSpace: 'nowrap'
}

const infoTextStyle: CSSProperties = {
  margin: 0,
  fontSize: '12px',
  lineHeight: 1.45,
  color: '#6b7280'
}

const actionGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const orderTypeGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  backgroundColor: '#f9fafb'
}

const orderTypeButtonStyle: CSSProperties = {
  minWidth: '86px',
  height: '40px',
  padding: '0 13px',
  border: 'none',
  borderRadius: '11px',
  backgroundColor: 'transparent',
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: 900,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}

const selectedOrderTypeButtonStyle: CSSProperties = {
  ...orderTypeButtonStyle,
  backgroundColor: '#111827',
  color: '#ffffff',
  boxShadow: '0 6px 16px rgba(17, 24, 39, 0.18)'
}

const buttonStyle: CSSProperties = {
  minWidth: '132px',
  height: '48px',
  padding: '0 22px',
  border: 'none',
  borderRadius: '13px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 900,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#d1d5db',
  color: '#6b7280',
  cursor: 'not-allowed'
}

// SECTION 05 : UTIL FUNCTION

function formatPrice(
  value: number
): string {
  return `${value.toLocaleString('ko-KR')}원`
}

// SECTION 06 : COMPONENT

export default function QrOrderFooter({
  totalAmount,
  disabled = false,
  buttonLabel = '주문하기',
  totalLabel = '총 금액',
  orderInfoText = 'QR코드 로그인 주문입니다.',
  selectedOrderType = 'DINE_IN',
  onSelectOrderType,
  onSubmitOrder
}: Props) {
  // SECTION 07 : EVENT FUNCTION

  function handleSelectOrderType(
    orderType: QrOrderType
  ) {
    onSelectOrderType?.(orderType)
  }

  function handleClick() {
    if (disabled) {
      return
    }

    onSubmitOrder()
  }

  // SECTION 08 : UI BLOCK

  const OrderTypeButtonsUI = (
    <div style={orderTypeGroupStyle}>
      {ORDER_TYPE_OPTIONS.map(option => {
        const isSelected =
          option.id === selectedOrderType

        return (
          <button
            key={option.id}
            type="button"
            style={
              isSelected
                ? selectedOrderTypeButtonStyle
                : orderTypeButtonStyle
            }
            onClick={() => {
              handleSelectOrderType(option.id)
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )

  // SECTION 09 : RETURN

  return (
    <footer style={footerShellStyle}>
      <div style={footerInnerStyle}>
        <div style={totalGroupStyle}>
          <div style={totalRowStyle}>
            <span style={labelStyle}>
              {totalLabel} :
            </span>

            <strong style={amountStyle}>
              {formatPrice(totalAmount)}
            </strong>
          </div>

          <p style={infoTextStyle}>
            {orderInfoText}
          </p>
        </div>

        <div style={actionGroupStyle}>
          {OrderTypeButtonsUI}

          <button
            type="button"
            disabled={disabled}
            style={
              disabled
                ? disabledButtonStyle
                : buttonStyle
            }
            onClick={handleClick}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </footer>
  )
}
// FILE : frontend/app/(pos)/pos/components/PosOrderFooter.tsx
// ROOT : frontend/app/(pos)/pos/components/PosOrderFooter.tsx
// STATUS : MODIFY MODE
// ROLE : POS ORDER FOOTER COMPONENT
// CHANGE SUMMARY :
// - POS 하단 결제 영역을 flex 하단 고정 구조로 정리
// - position fixed 제거로 POS 페이지 내부 레이아웃 기준 적용
// - 기존 총액 계산 표시/결제 버튼 동작 유지
// - API 호출 없음
// - DB 직접 접근 없음

'use client'

import type { CSSProperties } from 'react'

type Props = {
  totalAmount: number
  disabled?: boolean
  buttonLabel?: string
  secondaryButtonLabel?: string
  secondaryDisabled?: boolean
  tertiaryButtonLabel?: string
  tertiaryDisabled?: boolean
  totalLabel?: string
  onSubmitPayment: () => void
  onSubmitSecondary?: () => void
  onSubmitTertiary?: () => void
}

const footerShellStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  flexShrink: 0,
  padding: '10px 20px',
  borderTop: '1px solid #e5e7eb',
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 -10px 28px rgba(15, 23, 42, 0.08)'
}

const footerInnerStyle: CSSProperties = {
  width: '100%',
  maxWidth: '1360px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px'
}

const totalWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  minWidth: 0
}

const totalLabelStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#111827',
  whiteSpace: 'nowrap'
}

const totalAmountStyle: CSSProperties = {
  fontSize: '28px',
  fontWeight: 900,
  color: '#111827',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.02em'
}

const buttonStyle: CSSProperties = {
  minWidth: '168px',
  height: '56px',
  padding: '0 24px',
  border: 'none',
  borderRadius: '16px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 900,
  cursor: 'pointer'
}

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#d1d5db',
  color: '#6b7280',
  cursor: 'not-allowed'
}

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
}

function formatPrice(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

export default function PosOrderFooter({
  totalAmount,
  disabled = false,
  buttonLabel = '결제하기',
  secondaryButtonLabel,
  secondaryDisabled = false,
  tertiaryButtonLabel,
  tertiaryDisabled = false,
  totalLabel = '총 금액',
  onSubmitPayment,
  onSubmitSecondary,
  onSubmitTertiary
}: Props) {
  function handleClick() {
    if (disabled) {
      return
    }

    onSubmitPayment()
  }

  function handleSecondaryClick() {
    if (secondaryDisabled || !onSubmitSecondary) {
      return
    }

    onSubmitSecondary()
  }

  function handleTertiaryClick() {
    if (tertiaryDisabled || !onSubmitTertiary) {
      return
    }

    onSubmitTertiary()
  }

  return (
    <footer style={footerShellStyle}>
      <div style={footerInnerStyle}>
        <div style={totalWrapStyle}>
          <span style={totalLabelStyle}>{totalLabel} :</span>
          <strong style={totalAmountStyle}>{formatPrice(totalAmount)}</strong>
        </div>

        <div style={buttonGroupStyle}>
          {tertiaryButtonLabel && (
            <button
              type="button"
              disabled={tertiaryDisabled}
              style={tertiaryDisabled ? disabledButtonStyle : buttonStyle}
              onClick={handleTertiaryClick}
            >
              {tertiaryButtonLabel}
            </button>
          )}

          {secondaryButtonLabel && (
            <button
              type="button"
              disabled={secondaryDisabled}
              style={secondaryDisabled ? disabledButtonStyle : buttonStyle}
              onClick={handleSecondaryClick}
            >
              {secondaryButtonLabel}
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            style={disabled ? disabledButtonStyle : buttonStyle}
            onClick={handleClick}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </footer>
  )
}

// FILE : frontend/app/(pos)/pos/components/PosOrderList.tsx
// ROOT : frontend/app/(pos)/pos/components/PosOrderList.tsx
// STATUS : MODIFY MODE
// ROLE : POS ORDER LIST COMPONENT
// CHANGE SUMMARY :
// - 우측 주문 내역 패널을 고정 높이 구조로 정리
// - 주문 목록 영역만 내부 스크롤되도록 적용
// - 기존 주문 내역 표시/전체 삭제 기능 유지
// - API 호출 없음
// - DB 직접 접근 없음

import type { CSSProperties } from 'react'

type OrderItem = {
  id: string
  name: string
  price: number
  quantity: number
  selectedOptions?: {
    id: string
    label: string
    quantity: number
    extraPrice: number
  }[]
}

type PosOrderListProps = {
  title?: string
  subtitle?: string | null
  orderItems: OrderItem[]
  onClear: () => void
}

export default function PosOrderList({
  title = '주문 내역',
  subtitle = null,
  orderItems,
  onClear
}: PosOrderListProps) {
  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={titleWrapStyle}>
          <h2 style={titleStyle}>{title}</h2>
          {subtitle ? (
            <p style={subtitleStyle}>{subtitle}</p>
          ) : null}
        </div>
        <button type="button" style={clearButtonStyle} onClick={onClear}>
          전체 삭제
        </button>
      </div>

      <div style={listStyle}>
        {orderItems.length === 0 ? (
          <p style={emptyTextStyle}>선택된 메뉴가 없습니다.</p>
        ) : (
          orderItems.map((item) => (
            <div key={item.id} style={itemRowStyle}>
              <div style={itemInfoStyle}>
                <strong style={itemNameStyle}>{item.name}</strong>
                <span style={itemMetaStyle}>
                  {item.quantity}개 · {(item.price * item.quantity).toLocaleString('ko-KR')}원
                </span>
                {item.selectedOptions && item.selectedOptions.length > 0 ? (
                  <div style={optionListStyle}>
                    {item.selectedOptions.map((option) => (
                      <span key={option.id} style={optionItemStyle}>
                        - 옵션: {option.label} X {option.quantity} · +{(option.extraPrice * option.quantity).toLocaleString('ko-KR')}원
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const panelStyle: CSSProperties = {
  border: 'none',
  borderRadius: 0,
  backgroundColor: 'transparent',
  padding: 0,
  boxSizing: 'border-box',
  flex: '1 1 auto',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '10px',
  flexShrink: 0
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 800
}

const titleWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#6b7280',
  fontWeight: 700
}

const clearButtonStyle: CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  padding: '6px 10px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer'
}

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  overflowY: 'auto',
  minHeight: 0,
  paddingBottom: '10px'
}

const itemRowStyle: CSSProperties = {
  border: '1px solid #f0f1f4',
  borderRadius: '10px',
  padding: '10px'
}

const itemInfoStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}

const itemNameStyle: CSSProperties = {
  fontSize: '14px'
}

const itemMetaStyle: CSSProperties = {
  fontSize: '12px',
  color: '#6b7280'
}

const optionListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  marginTop: '4px'
}

const optionItemStyle: CSSProperties = {
  fontSize: '12px',
  color: '#374151',
  fontWeight: 600
}

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: '#6b7280',
  fontSize: '13px'
}

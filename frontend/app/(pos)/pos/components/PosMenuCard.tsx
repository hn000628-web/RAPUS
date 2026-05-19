// FILE : frontend/app/(after-login)/profile/business/pos/components/PosMenuCard.tsx
// ROOT : frontend/app/(after-login)/profile/business/pos/components/PosMenuCard.tsx
// STATUS : CREATE MODE
// ROLE : POS MENU CARD COMPONENT
// CHANGE SUMMARY :
// - 메뉴 카드 UI를 별도 컴포넌트화
// - JSX multi-line, CSS 모듈 적용

import type { CSSProperties } from 'react'

type PosMenuItem = {
  id: string
  name: string
  description: string
  price: number
}

type PosMenuCardProps = {
  item: PosMenuItem
  quantity: number
  onIncrease: (id: string) => void
  onDecrease: (id: string) => void
  className?: string
}

export default function PosMenuCard({ item, quantity, onIncrease, onDecrease, className }: PosMenuCardProps) {
  return (
    <article className={className}>
      <div style={menuTopStyle}>
        <strong style={menuNameStyle}>{item.name}</strong>
        <span style={menuPriceStyle}>{item.price.toLocaleString('ko-KR')}원</span>
      </div>
      <p style={menuDescriptionStyle}>{item.description}</p>
      <div style={quantityRowStyle}>
        <button type="button" style={stepButtonStyle} onClick={() => onDecrease(item.id)}>-</button>
        <strong style={quantityValueStyle}>{quantity}</strong>
        <button type="button" style={stepButtonStyle} onClick={() => onIncrease(item.id)}>+</button>
      </div>
    </article>
  )
}

// STYLE
const menuTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }
const menuNameStyle: CSSProperties = { fontSize: '16px', fontWeight: 800 }
const menuPriceStyle: CSSProperties = { fontSize: '15px', fontWeight: 800 }
const menuDescriptionStyle: CSSProperties = { margin: '0 0 12px', color: '#6b7280', fontSize: '13px', minHeight: '18px' }
const quantityRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }
const stepButtonStyle: CSSProperties = { width: '28px', height: '28px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: 800 }
const quantityValueStyle: CSSProperties = { minWidth: '24px', textAlign: 'center' }
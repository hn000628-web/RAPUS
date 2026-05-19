// FILE : frontend/app/channel/[channelCode]/order/components/Qr/QrOrderSidebar.tsx
// ROOT : frontend/app/channel/[channelCode]/order/components/Qr/QrOrderSidebar.tsx
// STATUS : CREATE MODE
// ROLE : PUBLIC BUSINESS CHANNEL QR ORDER SIDEBAR COMPONENT
// CHANGE SUMMARY :
// - QR코드 주문 전용 사이드바 컴포넌트 신규 생성
// - 메인 메뉴 / 서브 메뉴 / 음료 / 사이드 카테고리 선택 UI 구성
// - selectedCategoryId / onSelectCategory props 기반 카테고리 전환 구조 적용
// - router 이동 없이 QR 주문 페이지 내부 카테고리 전환 전용으로 구성
// - QR 주문은 로그인 전용 고객 휴대폰 주문 UI 문구 반영
// - 현재 단계는 UI only 목업 구조
// - API 호출 / DB 접근 / 주문 생성 / 결제 연결 없음

'use client'

// SECTION 01 : IMPORT

import type {
  CSSProperties
} from 'react'

// SECTION 02 : TYPE

export type QrCategoryId =
  | 'main'
  | 'sub'
  | 'drink'
  | 'side'

type Props = {
  selectedCategoryId: QrCategoryId
  onSelectCategory: (categoryId: QrCategoryId) => void
}

type QrSidebarItem = {
  id: QrCategoryId
  label: string
  description: string
}

// SECTION 03 : CONSTANT

const QR_SIDEBAR_ITEMS: QrSidebarItem[] = [
  {
    id: 'main',
    label: '메인 메뉴',
    description: '대표 식사 메뉴'
  },
  {
    id: 'sub',
    label: '서브 메뉴',
    description: '추가 선택 메뉴'
  },
  {
    id: 'drink',
    label: '음료',
    description: '음료 카테고리'
  },
  {
    id: 'side',
    label: '사이드',
    description: '곁들임 메뉴'
  }
]

// SECTION 04 : STYLE

const sidebarStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}

const introCardStyle: CSSProperties = {
  width: '100%',
  padding: '20px 18px',
  borderRadius: '18px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
}

const introTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 900,
  color: '#111827',
  letterSpacing: '-0.02em'
}

const introDescriptionStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: '13px',
  lineHeight: 1.55,
  color: '#6b7280'
}

const itemButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: '74px',
  padding: '16px',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  gap: '6px',
  textAlign: 'left',
  cursor: 'pointer'
}

const selectedItemButtonStyle: CSSProperties = {
  ...itemButtonStyle,
  border: '2px solid #111827',
  backgroundColor: '#f9fafb'
}

const itemLabelStyle: CSSProperties = {
  fontSize: '15px',
  fontWeight: 900,
  color: '#111827'
}

const itemDescriptionStyle: CSSProperties = {
  fontSize: '12px',
  lineHeight: 1.45,
  color: '#6b7280'
}

const noticeCardStyle: CSSProperties = {
  width: '100%',
  padding: '15px 16px',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb'
}

const noticeTextStyle: CSSProperties = {
  margin: 0,
  fontSize: '12px',
  lineHeight: 1.55,
  color: '#6b7280'
}

// SECTION 05 : COMPONENT

export default function QrOrderSidebar({
  selectedCategoryId,
  onSelectCategory
}: Props) {
  // SECTION 06 : UI BLOCK

  const IntroUI = (
    <section style={introCardStyle}>
      <h2 style={introTitleStyle}>
        QR코드 주문
      </h2>

      <p style={introDescriptionStyle}>
        로그인한 고객이 휴대폰에서 카테고리를 선택하고 메뉴를 주문합니다.
      </p>
    </section>
  )

  const CategoryListUI = (
    <>
      {QR_SIDEBAR_ITEMS.map(item => {
        const isSelected =
          item.id === selectedCategoryId

        return (
          <button
            key={item.id}
            type="button"
            style={
              isSelected
                ? selectedItemButtonStyle
                : itemButtonStyle
            }
            onClick={() => {
              onSelectCategory(item.id)
            }}
          >
            <span style={itemLabelStyle}>
              {item.label}
            </span>

            <span style={itemDescriptionStyle}>
              {item.description}
            </span>
          </button>
        )
      })}
    </>
  )

  const NoticeUI = (
    <section style={noticeCardStyle}>
      <p style={noticeTextStyle}>
        QR 주문은 로그인 전용 주문입니다.
        고객 채널 정보와 테이블 정보는 이후 API / DB 연결 단계에서 처리합니다.
      </p>
    </section>
  )

  // SECTION 07 : RETURN

  return (
    <aside style={sidebarStyle}>
      {IntroUI}

      {CategoryListUI}

      {NoticeUI}
    </aside>
  )
}
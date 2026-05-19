'use client'

import type {
  CSSProperties
} from 'react'

type KioskCategoryId =
  | 'main'
  | 'sub'
  | 'drink'
  | 'side'

type SidebarItem = {
  id: KioskCategoryId
  label: string
  description: string
}

type Props = {
  selectedCategoryId: KioskCategoryId
  onSelectCategory: (categoryId: KioskCategoryId) => void
}

const SIDEBAR_ITEMS: SidebarItem[] = [
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

const sidebarStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}

const headerStyle: CSSProperties = {
  width: '100%',
  padding: '18px',
  borderRadius: '18px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 900,
  color: '#111827',
  letterSpacing: '-0.02em'
}

const descriptionStyle: CSSProperties = {
  margin: '7px 0 0',
  fontSize: '13px',
  lineHeight: 1.5,
  color: '#6b7280'
}

const menuWrapStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
}

const menuButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: '72px',
  padding: '14px 15px',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  color: '#111827',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '5px'
}

const activeMenuButtonStyle: CSSProperties = {
  ...menuButtonStyle,
  border: '2px solid #111827',
  backgroundColor: '#f9fafb'
}

const menuLabelStyle: CSSProperties = {
  fontSize: '15px',
  fontWeight: 900,
  color: '#111827'
}

const menuDescriptionStyle: CSSProperties = {
  fontSize: '12px',
  lineHeight: 1.45,
  color: '#6b7280'
}

export default function KioskOrderSidebar({
  selectedCategoryId,
  onSelectCategory
}: Props) {
  return (
    <aside style={sidebarStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          키오스크
        </h2>

        <p style={descriptionStyle}>
          카테고리를 선택하고 메뉴를 주문하세요.
        </p>
      </div>

      <div style={menuWrapStyle}>
        {SIDEBAR_ITEMS.map((item) => {
          const isActive =
            item.id === selectedCategoryId

          return (
            <button
              key={item.id}
              type="button"
              style={
                isActive
                  ? activeMenuButtonStyle
                  : menuButtonStyle
              }
              onClick={() => {
                onSelectCategory(item.id)
              }}
            >
              <span style={menuLabelStyle}>
                {item.label}
              </span>

              <span style={menuDescriptionStyle}>
                {item.description}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

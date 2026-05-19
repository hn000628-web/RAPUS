// FILE : frontend/app/(pos)/pos/components/PosCategorySidebar.tsx
// ROOT : frontend/app/(pos)/pos/components/PosCategorySidebar.tsx
// STATUS : MODIFY MODE
// ROLE : POS MAIN SIDEBAR COMPONENT
// CHANGE SUMMARY :
// - POS 메인페이지 전용 사이드바 구조로 수정
// - 기존 카테고리 명칭을 POS 메뉴 명칭으로 변경
// - 테이블 / 매출내역 같은 POS 메인 메뉴 버튼 렌더링 대응
// - selectedMenuId / onSelectMenu 구조로 의미 정리
// - sticky 의존 없음
// - API 호출 없음
// - DB 직접 접근 없음

import type { CSSProperties } from 'react'

type PosMainMenu = {
  id: string
  label: string
}

type PosCategorySidebarProps = {
  menus: PosMainMenu[]
  selectedMenuId: string
  onSelectMenu: (id: string) => void
  className?: string
}

export default function PosCategorySidebar({
  menus,
  selectedMenuId,
  onSelectMenu,
  className
}: PosCategorySidebarProps) {
  return (
    <aside className={className} style={sidebarStyle}>
      <h2 style={sidebarTitleStyle}>POS 메뉴</h2>

      <div style={sidebarListStyle}>
        {menus.map((menu) => {
          const isSelected = selectedMenuId === menu.id

          return (
            <button
              key={menu.id}
              type="button"
              aria-pressed={isSelected}
              style={isSelected ? menuActiveButtonStyle : menuButtonStyle}
              onClick={() => onSelectMenu(menu.id)}
            >
              {menu.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

const sidebarStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '8px',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden'
}

const sidebarTitleStyle: CSSProperties = {
  margin: 0,
  marginBottom: '12px',
  fontSize: '18px',
  fontWeight: 800
}

const sidebarListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  height: '100%',
  minHeight: 0,
  overflowY: 'auto'
}

const menuButtonStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: '15px',
  fontWeight: 800,
  textAlign: 'left',
  cursor: 'pointer'
}

const menuActiveButtonStyle: CSSProperties = {
  ...menuButtonStyle,
  border: '1px solid #111827',
  backgroundColor: '#111827',
  color: '#ffffff'
}

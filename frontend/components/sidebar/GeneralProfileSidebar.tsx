// FILE : frontend/app/(after-login)/profile/components/sidebar/GeneralProfileSidebar.tsx
// ROOT : frontend/app/(after-login)/profile/components/sidebar/GeneralProfileSidebar.tsx
// STATUS : MODIFY MODE
// ROLE : GENERAL PROFILE SIDEBAR
// CHANGE SUMMARY :
// - GENERAL 전용 사이드바 유지
// - BUSINESS 경로 제거 유지
// - 공용 메뉴 배열 사용 금지 유지
// - button 기반 UI 유지
// - focus / focus-visible / active 검은 테두리 CSS 강제 제거
// - 클릭 후 button blur 처리 유지
// - 프로필 메인 / 프로필 / 예약 / 주문 / PAY 포맷 유지

'use client'

// SECTION 01 : IMPORT
import { CSSProperties } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// SECTION 02 : TYPE
type SidebarItem = {
  label: string
  href: string
}

// SECTION 03 : CONSTANT
const GENERAL_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: '마이페이지',
    href: '/profile'
  },
  {
    label: '프로필',
    href: '/profile/general'
  },
  {
    label: '예약',
    href: '/profile/reservations/general'
  },
  {
    label: '주문',
    href: '/profile/orders/general'
  },
  {
    label: 'PAY',
    href: '/profile/pay/general'
  }
]

// SECTION 04 : COMPONENT
export default function GeneralProfileSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  // SECTION 05 : EVENT FUNCTION
  function moveToPage(href: string) {
    router.push(href)
  }

  // SECTION 06 : RETURN
  return (
    <aside style={sidebar}>
      <style>
        {`
          .general-sidebar-button,
          .general-sidebar-button:focus,
          .general-sidebar-button:focus-visible,
          .general-sidebar-button:active {
            outline: none !important;
            box-shadow: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }

          .general-sidebar-button::-moz-focus-inner {
            border: 0 !important;
          }
        `}
      </style>

      <h2 style={sidebarTitle}>
        프로필 메뉴
      </h2>

      <nav style={menuList}>
        {GENERAL_SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname === item.href

          return (
            <button
              key={item.href}
              type="button"
              className="general-sidebar-button"
              tabIndex={-1}
              style={{
                ...menuButton,
                ...(isActive ? activeMenuButton : null)
              }}
              onMouseDown={(event) => {
                event.preventDefault()
              }}
              onFocus={(event) => {
                event.currentTarget.blur()
              }}
              onClick={(event) => {
                event.currentTarget.blur()
                moveToPage(item.href)
              }}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

// SECTION 07 : STYLE
const sidebar: CSSProperties = {
  width: 196,
  minHeight: 'calc(100vh - 56px)',
  background: '#ffffff',
  borderRight: '1px solid #e5e7eb',
  padding: '18px 10px',
  flexShrink: 0
}

const sidebarTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 10px 4px'
}

const menuList: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
}

const menuButton: CSSProperties = {
  width: '100%',
  minHeight: 34,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#ffffff',
  color: '#111827',
  fontSize: 12,
  fontWeight: 700,
  textAlign: 'left',
  padding: '0 10px',
  cursor: 'pointer',
  outline: 'none',
  boxShadow: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  WebkitTapHighlightColor: 'transparent'
}

const activeMenuButton: CSSProperties = {
  border: '1px solid #c7d2fe',
  background: '#eef2ff',
  color: '#3730a3',
  outline: 'none',
  boxShadow: 'none'
}
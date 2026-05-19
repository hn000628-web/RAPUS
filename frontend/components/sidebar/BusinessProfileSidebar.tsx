// FILE : frontend/components/sidebar/BusinessProfileSidebar.tsx
// ROOT : frontend/components/sidebar/BusinessProfileSidebar.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE SIDEBAR
// CHANGE SUMMARY :
// - div 기반 메뉴 사용 금지 유지
// - button 기반 UI 유지
// - focus / focus-visible / active 검은 테두리 CSS 강제 제거 유지
// - 선택된 메뉴만 연한 블루 배경 표시 유지
// - BUSINESS 전용 경로 유지
// - 프로필 메인 / 프로필 / 스토어 뷰 / 고객관리 / 예약 / 주문 / PAY 포맷 적용
// - 고객관리 메뉴 /profile/business/customers 추가
// - API 호출 변경 없음
// - DB 직접 접근 없음
// - Service / Controller 수정 없음

'use client'

// SECTION 01 : IMPORT

import {
  CSSProperties,
  useEffect,
  useState
} from 'react'

import {
  usePathname,
  useRouter
} from 'next/navigation'

import {
  getMe
} from '@/lib/authApi'

// SECTION 02 : TYPE

type SidebarItem = {
  label: string
  href: string
}

type BusinessSidebarItem =
  SidebarItem & {
    useChannelView?: boolean
  }

// SECTION 03 : CONSTANT

const BUSINESS_SIDEBAR_ITEMS: BusinessSidebarItem[] = [
  {
    label: '마이페이지',
    href: '/profile'
  },
  {
    label: '프로필',
    href: '/profile/business'
  },
  {
    label: '스토어 뷰',
    href: '/channel',
    useChannelView: true
  },
  {
    label: '고객관리',
    href: '/profile/business/customers'
  },
  {
    label: '예약',
    href: '/profile/reservations/business'
  },
  {
    label: '주문',
    href: '/profile/orders/business'
  },
  {
    label: 'PAY',
    href: '/profile/pay/business'
  }
]

// SECTION 04 : COMPONENT

export default function BusinessProfileSidebar() {
  const router =
    useRouter()

  const pathname =
    usePathname()

  const [channelCode, setChannelCode] =
    useState('')

  useEffect(() => {
    let cancelled =
      false

    async function loadMe() {
      try {
        const me =
          await getMe()

        const nextChannelCode =
          me?.user?.channelCode || ''

        if (!cancelled) {
          setChannelCode(nextChannelCode)
        }
      } catch {
        if (!cancelled) {
          setChannelCode('')
        }
      }
    }

    loadMe()

    return () => {
      cancelled = true
    }
  }, [])

  // SECTION 05 : EVENT FUNCTION

  function moveToPage(
    href: string
  ) {
    router.push(href)
  }

  // SECTION 06 : RETURN

  return (
    <aside style={sidebar}>
      <style>
        {`
          .business-sidebar-button,
          .business-sidebar-button:focus,
          .business-sidebar-button:focus-visible,
          .business-sidebar-button:active {
            outline: none !important;
            box-shadow: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }

          .business-sidebar-button::-moz-focus-inner {
            border: 0 !important;
          }
        `}
      </style>

      <h2 style={sidebarTitle}>
        프로필 메뉴
      </h2>

      <nav style={menuList}>
        {BUSINESS_SIDEBAR_ITEMS.map((item) => {
          const targetHref =
            item.useChannelView && channelCode
              ? `/channel/${channelCode}`
              : item.href

          const isActive =
            pathname === targetHref

          return (
            <button
              key={item.label}
              type="button"
              className="business-sidebar-button"
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
                moveToPage(targetHref)
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
  width: 220,
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
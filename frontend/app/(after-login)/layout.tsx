// FILE : frontend/app/(after-login)/layout.tsx
// ROOT : frontend/app/(after-login)/layout.tsx
// STATUS : MODIFY MODE
// ROLE : AFTER LOGIN ROOT LAYOUT
// CHANGE SUMMARY :
// - TopMenuZone 을 (after-login) 공용 레이아웃으로 이동
// - /pos 경로 분리 구조와 충돌하지 않도록 일반 로그인 후 화면 전용으로 유지
// - 기존 사이드바 조건 렌더링 및 메인 레이아웃 구조 유지
// - API 호출 없음
// - DB 직접 접근 없음

'use client'

// SECTION 01 : IMPORT
import {
  usePathname
} from 'next/navigation'

import {
  CSSProperties,
  ReactNode,
  useEffect,
  useState
} from 'react'

import TopMenuZone from '@/components/topbar/TopMenuZone'
import { useAuth } from '@/contexts/AuthContext'
import GeneralProfileSidebar from '@/components/sidebar/GeneralProfileSidebar'
import BusinessProfileSidebar from '@/components/sidebar/BusinessProfileSidebar'

// SECTION 02 : CONSTANT
const TOPBAR_HEIGHT = 56
const MOBILE_BREAKPOINT = 640

// SECTION 03 : TYPE
type Props = {
  children: ReactNode
}

type ProfileType = 'GENERAL' | 'BUSINESS' | ''

// SECTION 04 : COMPONENT
export default function AfterLoginLayout({
  children
}: Props) {
  const { profile, loading } = useAuth()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  // SECTION 05 : WINDOW RESIZE EFFECT
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    }

    checkMobile()

    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // SECTION 06 : PROFILE TYPE NORMALIZE
  const profileType = normalizeProfileType(profile?.profileType)
  const shouldShowProfileSidebar =
    !pathname?.startsWith('/feed/market')

  // SECTION 07 : RETURN
  return (
    <div style={root}>
      <TopMenuZone />

      <div style={body}>
        {shouldShowProfileSidebar &&
        !loading &&
        !isMobile &&
        profileType === 'GENERAL' && (
          <GeneralProfileSidebar />
        )}

        {shouldShowProfileSidebar &&
        !loading &&
        !isMobile &&
        profileType === 'BUSINESS' && (
          <BusinessProfileSidebar />
        )}

        <main style={main}>
          {children}
        </main>
      </div>
    </div>
  )
}

// SECTION 08 : DATA FUNCTION
function normalizeProfileType(value: unknown): ProfileType {
  const normalized = String(value || '').toUpperCase()

  if (normalized === 'GENERAL') {
    return 'GENERAL'
  }

  if (normalized === 'BUSINESS') {
    return 'BUSINESS'
  }

  return ''
}

// SECTION 09 : STYLE
const root: CSSProperties = {
  minHeight: '100vh',
  background: '#f5f6f7'
}

const body: CSSProperties = {
  display: 'flex',
  paddingTop: TOPBAR_HEIGHT
}

const main: CSSProperties = {
  width: '100%',
  minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`
}

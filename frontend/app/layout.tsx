// FILE : frontend/app/layout.tsx
// ROOT : frontend/app/layout.tsx
// STATUS : MODIFY MODE
// ROLE : ROOT APPLICATION LAYOUT
// CHANGE SUMMARY :
// - RootLayout 에서 TopMenuZone 제거
// - RootLayout 을 전역 Provider 전용 구조로 정리
// - POS route group 에 공용 헤더가 겹치는 문제 해결
// - API 호출 없음
// - DB 직접 접근 없음

// SECTION 01 : IMPORT
'use client'

import './globals.css'
import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { RegionProvider } from '@/components/Region/RegionContext'
import { FeedRegionProvider } from '@/components/Region/FeedRegionContext'

// SECTION 02 : TYPE
type Props = { children: ReactNode }

// SECTION 03 : ROOT LAYOUT
export default function RootLayout({ children }: Props) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#fff',
          fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "맑은 고딕", sans-serif'
        }}
      >
        <AuthProvider>
          <RegionProvider>
            <FeedRegionProvider>{children}</FeedRegionProvider>
          </RegionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

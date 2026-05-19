// FILE : frontend/app/feed/layout.tsx
// ROOT : frontend/app/feed/layout.tsx
// STATUS : CREATE MODE
// ROLE : FEED PUBLIC LAYOUT WITH TOPBAR
// CHANGE SUMMARY :
// - /feed 계열 public 페이지에 공용 TopMenuZone 연결
// - root layout 에서 분리된 탑바를 /feed route group 에 복구
// - 탑바는 항상 표시하고 본문만 상단 여백을 확보
// - API / DB / Service 변경 없음

// SECTION 01 : IMPORT

import type {
  ReactNode
} from 'react'

import TopMenuZone from '@/components/topbar/TopMenuZone'

// SECTION 02 : TYPE

type Props = {
  children: ReactNode
}

// SECTION 03 : CONSTANT

const TOPBAR_HEIGHT = 56

// SECTION 04 : COMPONENT

export default function FeedLayout({
  children
}: Props) {
  return (
    <>
      <TopMenuZone />

      <main
        style={{
          minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          paddingTop: TOPBAR_HEIGHT
        }}
      >
        {children}
      </main>
    </>
  )
}

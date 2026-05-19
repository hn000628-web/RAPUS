// FILE : frontend/app/(pos)/layout.tsx
// ROOT : frontend/app/(pos)/layout.tsx
// STATUS : MODIFY MODE
// ROLE : POS GROUP LAYOUT
// CHANGE SUMMARY :
// - POS route group 전용 100dvh 고정 레이아웃 적용
// - 공용 TopMenuZone / 사이드바 / 피드 레이아웃 비포함 유지
// - POS 내부 스크롤 제어를 위한 overflow hidden 적용
// - API 호출 없음
// - DB 직접 접근 없음

// SECTION 01 : IMPORT
import { ReactNode } from 'react'
import { PosKeyboardModeProvider } from './pos/components/PosKeyboardModeContext'

// SECTION 02 : TYPE
type Props = {
  children: ReactNode
}

// SECTION 03 : LAYOUT
export default function PosGroupLayout({ children }: Props) {
  return (
    <PosKeyboardModeProvider>
      <div
        style={{
          height: '100dvh',
          minHeight: '100dvh',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </div>
    </PosKeyboardModeProvider>
  )
}

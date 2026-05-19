// FILE : frontend/app/(pos)/pos/table/settings/page.tsx
// ROOT : frontend/app/(pos)/pos/table/settings/page.tsx
// STATUS : CREATE
// ROLE : POS TABLE SETTINGS PAGE ROUTE
// CHANGE SUMMARY :
// - /pos/table/settings 설정 허브 라우트 구성

import { Suspense } from 'react'

import PosTableSettingsShell from './_components/PosTableSettingsShell'

// SECTION 01 : COMPONENT
export default function PosTableSettingsPage() {
  return (
    <Suspense fallback={<div>테이블 POS 설정 화면을 불러오는 중입니다.</div>}>
      <PosTableSettingsShell />
    </Suspense>
  )
}

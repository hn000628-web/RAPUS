// FILE : frontend/app/business/pos/page.tsx
// ROOT : frontend/app/business/pos/page.tsx
// STATUS : CREATE MODE
// ROLE : POS REDIRECT PAGE
// CHANGE SUMMARY :
// - 기존 /business/pos 접속 주소를 /pos 기준으로 변경
// - Next.js Route Group (pos) 구조 적용
// - 기존 POS UI/기능 유지
// - 기존 /business/pos 참조를 /pos 로 변경
// - API 호출 / DB 접근 없음

// SECTION 01 : IMPORT
import { redirect } from 'next/navigation'

// SECTION 02 : PAGE
export default function BusinessPosRedirectPage() {
  redirect('/pos')
}

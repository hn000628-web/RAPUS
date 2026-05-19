// FILE : frontend/app/auth/register/business/page.tsx
// ROOT : frontend/app/auth/register/business/page.tsx
// STATUS : MODIFY MODE
// ROLE : LEGACY BUSINESS REGISTER PAGE REDIRECT
// CHANGE SUMMARY :
// - 구버전 /auth/register/business 가입 폼 비활성화
// - 직접 접근 시 정규 회원가입 경로(/signup)로 리다이렉트
// - DB/API/Service/Auth 로직 수정 없음

// SECTION 01 : IMPORT
import { redirect } from 'next/navigation'

// SECTION 02 : PAGE
export default function LegacyBusinessRegisterRedirectPage() {
  redirect('/signup')
}

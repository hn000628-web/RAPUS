// FILE : frontend/app/(pos)/pos/settings/menu/category/page.tsx
// ROOT : frontend/app/(pos)/pos/settings/menu/category/page.tsx
// STATUS : REDIRECT SHIM
// ROLE : LEGACY ROUTE REDIRECT
// CHANGE SUMMARY :
// - 구 경로 /pos/settings/menu/category 요청을
//   신규 경로 /pos/settings/category 로 리다이렉트

import { redirect } from 'next/navigation'

export default function LegacyPosMenuCategoryPage() {
  redirect('/pos/settings/category')
}

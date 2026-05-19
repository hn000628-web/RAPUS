/* =========================================
   Auth Guard
   frontend/lib/authGuard.ts
========================================= */

export function getAccessToken(): string | null {

  if (typeof window === 'undefined')
    return null

  return localStorage.getItem('accessToken')
}

/* =========================================
   로그인 여부 체크
========================================= */

export function isLoggedIn(): boolean {

  const token = getAccessToken()

  if (!token)
    return false

  return true
}

/* =========================================
   로그인 필요 페이지 가드
========================================= */

export function requireAuth() {

  if (typeof window === 'undefined')
    return

  const token = getAccessToken()

  if (!token) {

    alert('로그인이 필요합니다.')

    window.location.href = '/login'

  }

}

/* =========================================
   로그아웃 처리
========================================= */

export function logout() {

  if (typeof window === 'undefined')
    return

  localStorage.removeItem('accessToken')

  window.location.href = '/login'

}

/* =========================================
   API 401 처리
========================================= */

export function handleUnauthorized() {

  if (typeof window === 'undefined')
    return

  alert('세션이 만료되었습니다. 다시 로그인해주세요.')

  localStorage.removeItem('accessToken')

  window.location.href = '/login'

}
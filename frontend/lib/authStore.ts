/* =========================================
   Auth Store
   frontend/lib/authStore.ts
========================================= */

type AuthState = {

  token: string | null

  isLoggedIn: boolean

}

/* =========================================
   내부 상태
========================================= */

let state: AuthState = {

  token: null,

  isLoggedIn: false

}

/* =========================================
   초기화
========================================= */

export function initAuth() {

  if (typeof window === 'undefined')
    return

  const token = localStorage.getItem('accessToken')

  if (token) {

    state.token = token
    state.isLoggedIn = true

  }

}

/* =========================================
   토큰 설정
========================================= */

export function setToken(token: string) {

  if (typeof window !== 'undefined') {

    localStorage.setItem('accessToken', token)

  }

  state.token = token
  state.isLoggedIn = true

}

/* =========================================
   토큰 가져오기
========================================= */

export function getToken(): string | null {

  if (state.token)
    return state.token

  if (typeof window !== 'undefined') {

    const token = localStorage.getItem('accessToken')

    if (token) {

      state.token = token
      state.isLoggedIn = true

      return token

    }

  }

  return null

}

/* =========================================
   로그인 여부
========================================= */

export function isLoggedIn(): boolean {

  return state.isLoggedIn

}

/* =========================================
   로그아웃
========================================= */

export function logout() {

  if (typeof window !== 'undefined') {

    localStorage.removeItem('accessToken')

  }

  state.token = null
  state.isLoggedIn = false

  if (typeof window !== 'undefined') {

    window.location.href = '/login'

  }

}
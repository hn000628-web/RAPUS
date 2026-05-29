// FILE : frontend/lib/authApi.ts
// ROOT : frontend/lib/authApi.ts
// STATUS : MODIFY MODE
// ROLE : AUTH DOMAIN API
// CHANGE SUMMARY :
// - AuthUserContext 공통 타입 추가
// - getMe() 응답 타입에 activityRegionId / activityRegionName optional 필드 추가
// - getMe() channelCode / profileId 존재 여부 검증 강화
// - channelCode 없으면 Error throw + console.error 유지
// - 기존 auth domain 흐름 유지

'use client'

// SECTION 01 : IMPORT

import { apiFetch } from '@/lib/api'

// SECTION 02 : TYPE

export type LoginProfileType =
  | 'GENERAL'
  | 'BUSINESS'

export type LoginRequest = {
  email: string
  password: string
  profileType: LoginProfileType
}

export type AuthUserContext = {
  userId: number
  profileId: number
  profileType: LoginProfileType
  channelCode: string
  displayName: string
  email: string
  baseCode: string
  corporationGrade?: number | null
  providerGrade?: number | null
  genesisGrade?: number | null
  userGrade?: number | null
  meteoAiGrade?: number | null
  activityRegionId?: number | null
  activityRegionName?: string | null
}

export type LoginResponse = {
  ok: boolean
  accessToken: string
  user: AuthUserContext
}

export type MeResponse = {
  ok: boolean
  user: AuthUserContext
}

export type RefreshResponse = {
  ok: boolean
  accessToken: string
}

export type SwitchProfileResponse = {
  ok: boolean
  accessToken: string
  userId: number
  profileId: number
  profileType: LoginProfileType
  channelCode: string
  displayName: string
  email: string
  baseCode: string
  corporationGrade?: number | null
  providerGrade?: number | null
  genesisGrade?: number | null
  userGrade?: number | null
  activityRegionId?: number | null
  activityRegionName?: string | null
}

export type BusinessSignupRequest = {
  displayName?: string
  businessTypeCode?: 'NORMAL' | 'STORE' | 'SHOPPING_MALL' | 'FREELANCER' | 'MOBILE_BIZ'
}

export type BusinessSignupResponse = {
  ok: boolean
  alreadyExists?: boolean
  accessToken: string
  user: AuthUserContext & {
    id?: number
    channelURL?: string | null
  }
}

export type BusinessTrialApplyResponse = {
  ok: boolean
  user: Pick<
    AuthUserContext,
    | 'userId'
    | 'email'
    | 'userGrade'
    | 'providerGrade'
    | 'corporationGrade'
  >
}

// SECTION 03 : CONSTANT

const AUTH_BASE = '/auth'
const AUTH_COOKIE_KEYS = [
  'accessToken',
  'refreshToken',
  'rememberToken',
  'rememberMe',
  'autoLogin',
  'profileSession',
  'profileSessionId',
  'sessionId'
] as const
const AUTH_STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'rememberToken',
  'rememberMe',
  'autoLogin',
  'profileSession',
  'profileSessionId',
  'sessionId',
  'userId',
  'profileType',
  'activeProfileType',
  'profileId',
  'activeProfileId',
  'generalProfileId',
  'businessProfileId',
  'channelCode',
  'displayName'
] as const

// SECTION 04 : TOKEN HELPER

function setToken(token: string) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem('accessToken', token)

  document.cookie =
    `accessToken=${token}; path=/; SameSite=Lax; max-age=604800`
}

function removeToken() {
  if (typeof window === 'undefined') {
    return
  }

  clearClientAuthState()
}

export function clearClientAuthState() {
  if (typeof window === 'undefined') {
    return
  }

  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })

  AUTH_COOKIE_KEYS.forEach((key) => {
    document.cookie =
      `${key}=; Max-Age=0; path=/; SameSite=Lax`
  })
}

export function getToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem('accessToken')
}

// SECTION 05 : AUTH API

export async function login(
  data: LoginRequest
): Promise<LoginResponse> {
  try {
    const res =
      await apiFetch<LoginResponse>(
        `${AUTH_BASE}/login`,
        {
          method: 'POST',
          body: data
        }
      )

    if (res?.accessToken) {
      setToken(res.accessToken)
    }

    return res
  } catch (error) {
    console.error('AUTH LOGIN ERROR', error)
    throw error
  }
}

export async function getMe(): Promise<MeResponse> {
  const res =
    await apiFetch<MeResponse>(
      `${AUTH_BASE}/me`
    )

  if (!res.user?.channelCode) {
    console.error('ME API ERROR → channelCode missing', res)
    throw new Error('로그인 컨텍스트 없음')
  }

  if (!res.user?.profileId) {
    console.error('ME API ERROR → profileId missing', res)
    throw new Error('프로필 컨텍스트 없음')
  }

  return res
}

export async function logout() {
  try {
    const res =
      await apiFetch(
        `${AUTH_BASE}/logout`,
        {
          method: 'POST'
        }
      )

    clearClientAuthState()
    window.dispatchEvent(new Event('auth-change'))

    return res
  } catch (error) {
    clearClientAuthState()
    window.dispatchEvent(new Event('auth-change'))
    throw error
  }
}

export async function refresh(): Promise<RefreshResponse> {
  try {
    const res =
      await apiFetch<RefreshResponse>(
        `${AUTH_BASE}/refresh`,
        {
          method: 'POST'
        }
      )

    if (res?.accessToken) {
      setToken(res.accessToken)
    }

    return res
  } catch (error) {
    removeToken()
    throw error
  }
}

export async function switchProfile(
  profileType: LoginProfileType
): Promise<SwitchProfileResponse> {
  const res =
    await apiFetch<SwitchProfileResponse>(
      `${AUTH_BASE}/switch`,
      {
        method: 'POST',
        body: {
          profileType
        }
      }
    )

  if (res?.accessToken) {
    setToken(res.accessToken)
  }

  return res
}

export async function signupBusinessProfile(
  data: BusinessSignupRequest
): Promise<BusinessSignupResponse> {
  const res =
    await apiFetch<BusinessSignupResponse>(
      `${AUTH_BASE}/business-signup`,
      {
        method: 'POST',
        body: data
      }
    )

  if (res?.accessToken) {
    setToken(res.accessToken)
  }

  return res
}

export async function applyBusinessTrial(): Promise<BusinessTrialApplyResponse> {
  return apiFetch<BusinessTrialApplyResponse>(
    `${AUTH_BASE}/business-trial-apply`,
    {
      method: 'POST'
    }
  )
}

export async function adminHeartbeat(): Promise<{
  ok: boolean
  lastSeenAt?: string
}> {
  return apiFetch<{
    ok: boolean
    lastSeenAt?: string
  }>(
    `${AUTH_BASE}/admin-heartbeat`,
    {
      method: 'POST'
    }
  )
}

// SECTION 06 : EXPORT

export {
  removeToken
}

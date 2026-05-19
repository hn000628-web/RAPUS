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
  activityRegionId?: number | null
  activityRegionName?: string | null
}

// SECTION 03 : CONSTANT

const AUTH_BASE = '/auth'

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

  localStorage.removeItem('accessToken')

  document.cookie =
    'accessToken=; Max-Age=0; path=/'
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

    removeToken()

    return res
  } catch (error) {
    removeToken()
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

// SECTION 06 : EXPORT

export {
  removeToken
}
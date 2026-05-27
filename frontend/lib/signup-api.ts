// FILE : frontend/lib/signup-api.ts
// ROOT : frontend/lib/signup-api.ts
// STATUS : CREATE MODE
// ROLE : SIGNUP FRONTEND API
// CHANGE SUMMARY :
// - 회원가입 전용 프런트 API 신규 생성
// - 기존 로그인 API와 분리
// - POST /api/auth/signup 호출
// - baseCode / channelCode / channelURL 프론트 생성 금지
// - GENERAL / BUSINESS profileType 요청 타입 분리
// - BUSINESS businessTypeCode 기본 STORE 처리

// SECTION 01 : TYPE

export type SignupProfileType =
  | 'GENERAL'
  | 'BUSINESS'

export type SignupBusinessTypeCode =
  | 'NORMAL'
  | 'STORE'
  | 'SHOPPING_MALL'
  | 'FREELANCER'
  | 'MOBILE_BIZ'

export type SignupRequest = {
  email: string
  password: string
  profileType: SignupProfileType
  displayName?: string
  businessTypeCode?: SignupBusinessTypeCode
}

export type SignupUser = {
  userId: number
  id: number
  profileId: number
  profileType: SignupProfileType
  channelCode: string
  channelURL: string
  displayName: string | null
  email: string
  baseCode: string
}

export type SignupResponse = {
  ok: boolean
  user: SignupUser
}

type SignupErrorResponse = {
  message?: string | string[]
  error?: string
  statusCode?: number
}

// SECTION 02 : CONSTANT

function normalizeApiBaseUrl(rawBaseUrl: string): string {
  const trimmed = rawBaseUrl.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed.replace(/\/+$/, '')
}

function buildSignupEndpoint(): string {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_URL
    || process.env.NEXT_PUBLIC_API
    || ''

  const normalizedBaseUrl = normalizeApiBaseUrl(rawBaseUrl)

  if (!normalizedBaseUrl) {
    return '/api/auth/signup'
  }

  if (normalizedBaseUrl.endsWith('/api')) {
    return `${normalizedBaseUrl}/auth/signup`
  }

  return `${normalizedBaseUrl}/api/auth/signup`
}

const SIGNUP_ENDPOINT = buildSignupEndpoint()

// SECTION 03 : VALIDATION

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isSignupProfileType(
  profileType: string
): profileType is SignupProfileType {
  return profileType === 'GENERAL' || profileType === 'BUSINESS'
}

function isSignupBusinessTypeCode(
  businessTypeCode: string
): businessTypeCode is SignupBusinessTypeCode {
  return (
    businessTypeCode === 'NORMAL'
    || businessTypeCode === 'STORE'
    || businessTypeCode === 'SHOPPING_MALL'
    || businessTypeCode === 'FREELANCER'
    || businessTypeCode === 'MOBILE_BIZ'
  )
}

function resolveErrorMessage(errorBody: SignupErrorResponse): string {
  if (Array.isArray(errorBody.message)) {
    return errorBody.message.join('\n')
  }

  if (errorBody.message) {
    return errorBody.message
  }

  if (errorBody.error) {
    return errorBody.error
  }

  return '회원가입 요청에 실패했습니다.'
}

// SECTION 04 : API

export async function signup(
  payload: SignupRequest
): Promise<SignupResponse> {
  const email = normalizeEmail(payload.email)

  if (!email) {
    throw new Error('이메일을 입력하세요.')
  }

  if (!payload.password) {
    throw new Error('비밀번호를 입력하세요.')
  }

  if (!isSignupProfileType(payload.profileType)) {
    throw new Error('회원 유형이 올바르지 않습니다.')
  }

  const requestBody: SignupRequest = {
    email,
    password: payload.password,
    profileType: payload.profileType,
    displayName: payload.displayName?.trim() || undefined
  }

  if (payload.profileType === 'BUSINESS') {
    const businessTypeCode = payload.businessTypeCode

    if (businessTypeCode) {
      if (!isSignupBusinessTypeCode(businessTypeCode)) {
        throw new Error('비즈니스 유형이 올바르지 않습니다.')
      }

      requestBody.businessTypeCode = businessTypeCode
    }
  }

  const res = await fetch(SIGNUP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(
      resolveErrorMessage(data || {})
    )
  }

  return data as SignupResponse
}

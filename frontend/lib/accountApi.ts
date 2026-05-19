// FILE : frontend/lib/profile/accountApi.ts
// ROOT : frontend/lib/profile/accountApi.ts
// STATUS : CREATE MODE
// ROLE : PROFILE ACCOUNT FRONT API
// CHANGE SUMMARY :
// - /profile/account 전용 Front API 신규 생성
// - GET /api/profile/account 조회 함수 추가
// - PATCH /api/profile/account/basic 저장 함수 추가
// - PATCH /api/profile/account/birth-date 저장 함수 추가
// - PATCH /api/profile/account/primary-password 저장 함수 추가
// - PATCH /api/profile/account/payment-password 저장 함수 추가
// - authApi.ts와 책임 분리
// - DB 직접 접근 없음

// SECTION 01 : IMPORT

import {
  API_BASE_URL
} from '@/lib/config'

// SECTION 02 : TYPE

export type ProfileAccountProfileType =
  | 'GENERAL'
  | 'BUSINESS'

export type ProfileAccountPasswordStatus =
  | 'SET'
  | 'NOT_SET'

export type ProfileAccountResponseData = {
  profileId: number
  channelCode: string
  profileType: ProfileAccountProfileType
  detailAddress: string | null
  contactPhone: string | null
  birthDate: string | null
  adultVerificationStatus: string
  primaryPasswordStatus: ProfileAccountPasswordStatus
  paymentPasswordStatus: ProfileAccountPasswordStatus
  paymentPasswordLockedUntil: string | null
}

export type ProfileAccountApiResponse<T> = {
  ok: boolean
  data: T
  message?: string
}

export type GetProfileAccountParams = {
  profileId: number
  channelCode: string
}

export type UpdateProfileAccountBasicPayload = {
  profileId: number
  channelCode: string
  detailAddress: string | null
  contactPhone: string | null
}

export type UpdateProfileAccountBasicResponseData = {
  profileId: number
  channelCode: string
  detailAddress: string | null
  contactPhone: string | null
}

export type UpdateBirthDatePayload = {
  profileId: number
  channelCode: string
  birthDate: string | null
}

export type UpdateBirthDateResponseData = {
  profileId: number
  channelCode: string
  birthDate: string | null
}

export type UpdatePrimaryPasswordPayload = {
  profileId: number
  channelCode: string
  newPassword: string
  confirmPassword: string
}

export type UpdatePrimaryPasswordResponseData = {
  profileId: number
  channelCode: string
  primaryPasswordStatus: ProfileAccountPasswordStatus
}

export type UpdatePaymentPasswordPayload = {
  profileId: number
  channelCode: string
  paymentPassword: string
  confirmPaymentPassword: string
}

export type UpdatePaymentPasswordResponseData = {
  profileId: number
  channelCode: string
  paymentPasswordStatus: ProfileAccountPasswordStatus
  paymentPasswordLockedUntil: string | null
}

export type VerifyAdultForDevPayload = {
  profileId: number
  channelCode: string
}

export type VerifyAdultForDevResponseData = {
  profileId: number
  channelCode: string
  birthDate: string
  adultVerificationStatus: 'VERIFIED'
  adultVerifiedAt: string
  adultVerificationProvider: 'DEV_TEMP'
  adultVerificationExpiresAt: null
}

type RequestMethod =
  | 'GET'
  | 'PATCH'

type RequestOptions = {
  method: RequestMethod
  body?: unknown
}

// SECTION 03 : CONSTANT

const PROFILE_ACCOUNT_API_PATH =
  '/api/profile/account'

// SECTION 04 : API FUNCTION

export async function getProfileAccount(
  params: GetProfileAccountParams
): Promise<ProfileAccountResponseData> {
  const query =
    new URLSearchParams({
      profileId: String(params.profileId),
      channelCode: params.channelCode
    })

  const response =
    await requestProfileAccountApi<ProfileAccountResponseData>(
      `${PROFILE_ACCOUNT_API_PATH}?${query.toString()}`,
      {
        method: 'GET'
      }
    )

  return response.data
}

export async function updateProfileAccountBasic(
  payload: UpdateProfileAccountBasicPayload
): Promise<UpdateProfileAccountBasicResponseData> {
  const response =
    await requestProfileAccountApi<UpdateProfileAccountBasicResponseData>(
      `${PROFILE_ACCOUNT_API_PATH}/basic`,
      {
        method: 'PATCH',
        body: payload
      }
    )

  return response.data
}

export async function updateProfileAccountBirthDate(
  payload: UpdateBirthDatePayload
): Promise<UpdateBirthDateResponseData> {
  const response =
    await requestProfileAccountApi<UpdateBirthDateResponseData>(
      `${PROFILE_ACCOUNT_API_PATH}/birth-date`,
      {
        method: 'PATCH',
        body: payload
      }
    )

  return response.data
}

export async function updatePrimaryPassword(
  payload: UpdatePrimaryPasswordPayload
): Promise<UpdatePrimaryPasswordResponseData> {
  const response =
    await requestProfileAccountApi<UpdatePrimaryPasswordResponseData>(
      `${PROFILE_ACCOUNT_API_PATH}/primary-password`,
      {
        method: 'PATCH',
        body: payload
      }
    )

  return response.data
}

export async function updatePaymentPassword(
  payload: UpdatePaymentPasswordPayload
): Promise<UpdatePaymentPasswordResponseData> {
  const response =
    await requestProfileAccountApi<UpdatePaymentPasswordResponseData>(
      `${PROFILE_ACCOUNT_API_PATH}/payment-password`,
      {
        method: 'PATCH',
        body: payload
      }
    )

  return response.data
}

export async function verifyAdultForDev(
  payload: VerifyAdultForDevPayload
): Promise<VerifyAdultForDevResponseData> {
  const response =
    await requestProfileAccountApi<VerifyAdultForDevResponseData>(
      `${PROFILE_ACCOUNT_API_PATH}/adult-verification/dev`,
      {
        method: 'PATCH',
        body: payload
      }
    )

  return response.data
}

// SECTION 05 : REQUEST FUNCTION

async function requestProfileAccountApi<T>(
  path: string,
  options: RequestOptions
): Promise<ProfileAccountApiResponse<T>> {
  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        method: options.method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body:
          options.body === undefined
            ? undefined
            : JSON.stringify(options.body)
      }
    )

  const json =
    await parseApiResponse<T>(response)

  if (!response.ok || !json.ok) {
    throw new Error(
      json.message ?? `PROFILE_ACCOUNT_API_ERROR_${response.status}`
    )
  }

  return json
}

async function parseApiResponse<T>(
  response: Response
): Promise<ProfileAccountApiResponse<T>> {
  const contentType =
    response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new Error(
      `PROFILE_ACCOUNT_API_INVALID_RESPONSE_${response.status}`
    )
  }

  return response.json() as Promise<ProfileAccountApiResponse<T>>
}

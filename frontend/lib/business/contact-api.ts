// FILE : frontend/lib/business/contact-api.ts
// ROOT : frontend/lib/business/contact-api.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS CONTACT API
// CHANGE SUMMARY :
// - ProfileDetailPayload import 누락 수정
// - FullProfilePayload 반환 → profile 추출
// - 단일 귀속 channelCode + profileId 기준 유지
// - TypeScript 에러 2304, 2740 해결

'use client'

import { apiFetch } from '@/lib/api'
import { getMe, MeResponse } from '@/lib/authApi'
import {
  getProfileByChannelCode,
  ProfileDetailPayload
} from '@/lib/profile-summary-api'

export type BusinessContactPayload = {
  ok: true
  profileId: number
  channelCode: string
  contactPhone: string | null
}

export type UpdateBusinessContactBody = {
  contactPhone: string
}

const BUSINESS_CONTACT_BASE = '/business/contact'

// ================================
// GET BUSINESS CONTACT
// ================================
export async function getBusinessContact(): Promise<BusinessContactPayload> {
  // 1. 로그인 정보 확보 (메인)
  const me: MeResponse = await getMe()
  if (!me.user?.channelCode) throw new Error('로그인 컨텍스트 없음')

  // 2. 프로필 전체 정보 조회 (서브)
  const summary: ProfileDetailPayload = await getProfileByChannelCode(me.user.channelCode)

  // 3. 채널 기반 연락처 조회
  return apiFetch(`${BUSINESS_CONTACT_BASE}/${encodeURIComponent(summary.channelCode)}`)
}

// ================================
// UPDATE BUSINESS CONTACT
// ================================
export async function updateBusinessContact(
  body: UpdateBusinessContactBody
): Promise<BusinessContactPayload> {
  // 1. 로그인 정보 확보 (메인)
  const me: MeResponse = await getMe()
  if (!me.user?.channelCode) throw new Error('로그인 컨텍스트 없음')

  // 2. 프로필 전체 정보 조회 (서브)
  const summary: ProfileDetailPayload = await getProfileByChannelCode(me.user.channelCode)

  // 3. 연락처 업데이트
  return apiFetch(`${BUSINESS_CONTACT_BASE}/${encodeURIComponent(summary.channelCode)}`, {
    method: 'PATCH',
    body
  })
}

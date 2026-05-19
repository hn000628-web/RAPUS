'use client'

import { apiFetch } from '@/lib/api'
import { getMe, MeResponse } from '@/lib/authApi'

export type ProfileDetailPayload = {
  id: number
  userId: number
  profileType: 'GENERAL' | 'BUSINESS'
  baseCode: string
  channelCode: string
  displayName: string | null
  bio: string | null
  channelURL: string | null
  channelName: string | null
  contactPhone: string | null
  activityRegionId: number | null
  feedRegionId: number | null
  detailAddress: string | null
  businessRegistrationNumber: string | null
  primaryIndustryId: number | null
  primaryIndustrySubtypeId: number | null
  primaryIndustryCode: string | null
  primaryIndustrySubtypeCode: string | null
  createdAt: string
  updatedAt: string | null
}

export type BusinessProfileContext = {
  profileId: number
  channelCode: string
}

export async function getProfileByChannelCode(channelCode: string): Promise<ProfileDetailPayload> {
  if (!channelCode) throw new Error('channelCode is required')

  const me: MeResponse = await getMe()
  if (!me.user?.channelCode) throw new Error('로그인 컨텍스트 없음')

  return apiFetch<ProfileDetailPayload>(`/profile-summary/channel/${encodeURIComponent(channelCode)}`)
}

export async function getProfileByProfileId(profileId: number): Promise<ProfileDetailPayload> {
  if (!profileId) throw new Error('profileId is required')

  const me: MeResponse = await getMe()
  if (!me.user?.channelCode) throw new Error('로그인 컨텍스트 없음')

  return apiFetch<ProfileDetailPayload>(`/profile-summary/id/${profileId}`)
}

export async function getProfileByProfileIdAndChannelCode(
  profileId: number,
  channelCode: string
): Promise<ProfileDetailPayload> {
  if (!profileId || !channelCode) throw new Error('profileId and channelCode are required')

  const me: MeResponse = await getMe()
  if (!me.user?.channelCode) throw new Error('로그인 컨텍스트 없음')

  return apiFetch<ProfileDetailPayload>(
    `/profile-summary/detail/${profileId}/${encodeURIComponent(channelCode)}`
  )
}

export async function getBusinessProfileContext(): Promise<BusinessProfileContext> {
  const me: MeResponse = await getMe()
  const meChannelCode = me.user?.channelCode?.trim()
  if (!meChannelCode) throw new Error('login context missing')

  const profile = await getProfileByChannelCode(meChannelCode)
  const profileId = Number(profile.id || 0)
  const profileChannelCode = String(profile.channelCode || '').trim()

  if (!profileId || !profileChannelCode) {
    throw new Error('profile context missing')
  }

  return {
    profileId,
    channelCode: profileChannelCode
  }
}

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
  placeFeedTypeCode: PlaceFeedTypeCode | null
  avatarImage: ProfileSummaryImagePayload | null
  heroImage: ProfileSummaryImagePayload | null
  activityRegion: ProfileSummaryRegionPayload | null
  feedRegion: ProfileSummaryRegionPayload | null
  businessHours: ProfileSummaryBusinessHoursPayload | null
  createdAt: string
  updatedAt: string | null
}

export type ProfileSummaryImagePayload = {
  id: number
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
}

export type ProfileSummaryRegionPayload = {
  id: number
  code: string | null
  name: string | null
  fullName: string | null
}

export type ProfileSummaryBusinessHoursDay = {
  dayKey: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
  dayLabel: string
  isClosed: boolean
  openTime: string
  closeTime: string
}

export type ProfileSummaryBusinessHoursPayload = {
  weeklyHours: ProfileSummaryBusinessHoursDay[]
  summary: string
  isOpenNow: boolean
  alwaysOpen: boolean
  temporaryClosed: boolean
  updatedAt: string | null
}

export type PlaceFeedTypeCode =
  | 'NORMAL'
  | 'CLASSIC'
  | 'MARKET'
  | 'ONLINE_SHOP'
  | 'FOOD'
  | 'BEAUTY'
  | 'CULTURE'
  | 'STAY'
  | 'RENTCAR'

export type PlaceFeedPreset = {
  landing: string
  feed: string | null
  pos: string | null
  admin: string | null
  enabled: boolean
  capabilities: PlaceFeedPresetCapabilities
}

export type PlaceFeedPresetCapability =
  | 'productSystem'
  | 'inventory'
  | 'campaigns'
  | 'ads'

export type PlaceFeedPresetCapabilities = Record<
  PlaceFeedPresetCapability,
  boolean
>

const EMPTY_PLACE_FEED_PRESET_CAPABILITIES: PlaceFeedPresetCapabilities = {
  productSystem: false,
  inventory: false,
  campaigns: false,
  ads: false
}

const MARKET_PLACE_FEED_PRESET_CAPABILITIES: PlaceFeedPresetCapabilities = {
  productSystem: true,
  inventory: true,
  campaigns: true,
  ads: true
}

export const PLACE_FEED_PRESET_REGISTRY: Record<PlaceFeedTypeCode, PlaceFeedPreset> = {
  NORMAL: {
    landing: '/channel/{channelCode}',
    feed: null,
    pos: null,
    admin: null,
    enabled: true,
    capabilities: EMPTY_PLACE_FEED_PRESET_CAPABILITIES
  },
  CLASSIC: {
    landing: '/classic/{channelCode}',
    feed: null,
    pos: null,
    admin: null,
    enabled: true,
    capabilities: EMPTY_PLACE_FEED_PRESET_CAPABILITIES
  },
  MARKET: {
    landing: '/market/{channelCode}',
    feed: '/market/{channelCode}',
    pos: '/market_admin',
    admin: '/market_admin',
    enabled: true,
    capabilities: MARKET_PLACE_FEED_PRESET_CAPABILITIES
  },
  ONLINE_SHOP: {
    landing: '/market/{channelCode}',
    feed: '/market/{channelCode}',
    pos: '/market_admin',
    admin: '/market_admin',
    enabled: true,
    capabilities: MARKET_PLACE_FEED_PRESET_CAPABILITIES
  },
  FOOD: {
    landing: '/food/{channelCode}',
    feed: '/food/{channelCode}',
    pos: '/food_admin',
    admin: '/food_admin',
    enabled: false,
    capabilities: EMPTY_PLACE_FEED_PRESET_CAPABILITIES
  },
  BEAUTY: {
    landing: '/beauty/{channelCode}',
    feed: '/beauty/{channelCode}',
    pos: null,
    admin: null,
    enabled: false,
    capabilities: EMPTY_PLACE_FEED_PRESET_CAPABILITIES
  },
  CULTURE: {
    landing: '/culture/{channelCode}',
    feed: '/culture/{channelCode}',
    pos: null,
    admin: null,
    enabled: false,
    capabilities: EMPTY_PLACE_FEED_PRESET_CAPABILITIES
  },
  STAY: {
    landing: '/stay/{channelCode}',
    feed: '/stay/{channelCode}',
    pos: '/stay_admin',
    admin: '/stay_admin',
    enabled: false,
    capabilities: EMPTY_PLACE_FEED_PRESET_CAPABILITIES
  },
  RENTCAR: {
    landing: '/rentcar/{channelCode}',
    feed: '/rentcar/{channelCode}',
    pos: null,
    admin: null,
    enabled: false,
    capabilities: EMPTY_PLACE_FEED_PRESET_CAPABILITIES
  }
}

export const PLACE_PRESET_REGISTRY = PLACE_FEED_PRESET_REGISTRY

export function buildPlaceFeedPresetPath(
  routePattern: string,
  channelCode: string
) {
  return routePattern.replace('{channelCode}', channelCode.trim())
}

export function getPlaceFeedPreset(
  placeFeedTypeCode?: PlaceFeedTypeCode | null
) {
  return PLACE_FEED_PRESET_REGISTRY[placeFeedTypeCode ?? 'NORMAL']
}

export function getEnabledPlaceFeedPosRoute(
  placeFeedTypeCode?: PlaceFeedTypeCode | null
) {
  const preset = getPlaceFeedPreset(placeFeedTypeCode)

  if (!preset.enabled || !preset.pos) {
    return null
  }

  return preset.pos
}

export function getEnabledPlaceFeedAdminRoute(
  placeFeedTypeCode?: PlaceFeedTypeCode | null
) {
  const preset = getPlaceFeedPreset(placeFeedTypeCode)

  if (!preset.enabled || !preset.admin) {
    return null
  }

  return preset.admin
}

export function hasPlaceFeedPresetCapability(
  placeFeedTypeCode: PlaceFeedTypeCode | null | undefined,
  capability: PlaceFeedPresetCapability
) {
  const preset = getPlaceFeedPreset(placeFeedTypeCode)

  return preset.enabled && preset.capabilities[capability]
}

export function buildProfileStoreRoute(
  channelCode: string,
  placeFeedTypeCode?: PlaceFeedTypeCode | null
) {
  const safeChannelCode = channelCode.trim()
  const preset = getPlaceFeedPreset(placeFeedTypeCode)

  return buildPlaceFeedPresetPath(
    preset.landing,
    safeChannelCode
  )
}

export type BusinessProfileContext = {
  profileId: number
  channelCode: string
}

export async function getProfileByChannelCode(channelCode: string): Promise<ProfileDetailPayload> {
  if (!channelCode) throw new Error('channelCode is required')

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

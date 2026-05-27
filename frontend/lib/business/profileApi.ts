import { apiFetch } from '@/lib/api'
import type { Region } from '@/types/region'

/* ==================================================
SECTION 02 : TYPES
================================================== */
export type BusinessAvatar = {
  id: number
  profileId: number
  channelCode: string
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
  isActive?: number
  createdAt?: string | null
}

export type BusinessHeroImage = {
  id: number
  profileId: number
  channelCode: string
  imageAssetId: number | null
  filePath: string | null
  imageUrl: string | null
  sortOrder: number
  createdAt?: string | null
}

export type BusinessGalleryImage = {
  id: number
  channelCode: string
  usageType: string
  fileName: string
  filePath: string
  mimeType?: string | null
  fileSize?: number | null
  createdAt?: string | null
}

export type BusinessSession = {
  id: number
  userId: number
  profileId: number
  profileType: 'BUSINESS'
  channelCode: string
  deviceId: string | null
  status: string | null
  loginAt: string | null
  lastSeenAt: string | null
}

export type BusinessBlock = {
  id?: number
  blockType: string
  title?: string | null
  content?: string | null
  linkUrl?: string | null
  sortOrder: number
  isActive?: number | null
}

export type BusinessIndustry = {
  id: number | null
  code: string | null
  name: string | null
  description?: string | null
}

export type BusinessIndustrySubtype = {
  id: number | null
  code: string | null
  name: string | null
}

export type BusinessIndustryPayload = {
  primaryIndustryId: number | null
  primaryIndustrySubtypeId: number | null
  primaryIndustryCode: string | null
  primaryIndustrySubtypeCode: string | null
  industry: BusinessIndustry | null
  industrySubtype: BusinessIndustrySubtype | null
}

export type BusinessIndustryOption = {
  id: number
  code: string
  name: string
  description: string | null
  isActive: number
  sortOrder: number
  createdAt?: string | null
}

export type BusinessIndustrySubtypeOption = {
  id: number
  industryId: number
  code: string
  name: string
  name_en?: string | null
  name_ko?: string | null
  searchKeywords?: string | null
  isActive: number
  sortOrder: number
  industryName?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type BusinessPlaceMeta = {
  contactPhone: string | null
  activityRegionId: number | null
  feedRegionId: number | null
  detailAddress: string | null
  bio: string | null
  activityRegion: Region | null
  feedRegion: Region | null
}

export type BusinessProfile = {
  id: number
  userId: number
  profileType: 'BUSINESS'
  displayName: string | null
  bio: string | null
  channelCode: string
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
  createdAt: string
  updatedAt: string | null
}

export type PlaceFeedTypeCode =
  | 'NORMAL'
  | 'CLASSIC'
  | 'MARKET'
  | 'FOOD'
  | 'BEAUTY'
  | 'CULTURE'
  | 'STAY'
  | 'RENTCAR'

export type BusinessProfileSummary = {
  profile: BusinessProfile
  industry: BusinessIndustryPayload
  placeMeta: BusinessPlaceMeta
  infoBlocks: BusinessBlock[]
  session: BusinessSession | null
}

export type BusinessProfileDetail = {
  profile: BusinessProfile
  industry: BusinessIndustryPayload
  placeMeta: BusinessPlaceMeta
  infoBlocks: BusinessBlock[]
  session: BusinessSession | null
  media: {
    avatar: BusinessAvatar | null
    heroImages: BusinessHeroImage[]
    galleryImages: BusinessGalleryImage[]
  }
}

export type BusinessHoursDayKey =
  | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export type BusinessHoursDay = {
  dayKey: BusinessHoursDayKey
  dayLabel: string
  isClosed: boolean
  openTime: string
  closeTime: string
}

export type BusinessHoursPayload = {
  weeklyHours: BusinessHoursDay[]
  summary: string
  temporaryClosed?: boolean | number
  alwaysOpen?: boolean | number
  updatedAt: string | null
}

/* ==================================================
SECTION 02-1 : HELPER
================================================== */
export function mapBusinessHoursStateToArray(
  state: Record<string, { isClosed: boolean; startTime: string; endTime: string }>
): BusinessHoursDay[] {
  const dayKeys: BusinessHoursDayKey[] = ['MON','TUE','WED','THU','FRI','SAT','SUN']
  const mapping: Record<BusinessHoursDayKey,string> = {
    MON: '월요일', TUE: '화요일', WED: '수요일', THU: '목요일',
    FRI: '금요일', SAT: '토요일', SUN: '일요일'
  }
  return dayKeys.map(day => {
    const key = day.toLowerCase()
    const dayState = state[key]
    return {
      dayKey: day,
      dayLabel: mapping[day],
      isClosed: dayState?.isClosed ?? true,
      openTime: dayState?.startTime ?? '09:00',
      closeTime: dayState?.endTime ?? '18:00'
    }
  })
}

/* ==================================================
SECTION 03 : RESPONSES
================================================== */
export type UpdateBusinessProfileResponse = BusinessProfile
export type DeleteRelationResponse = { success: boolean }
export type UpdateBusinessRegistrationNumberResponse = {
  ok: boolean
  businessRegistrationNumber: string
}

/* ==================================================
SECTION 04 : BASE
================================================== */
const BUSINESS_PROFILE_BASE = 'business/profile'

/* ==================================================
SECTION 05~10 : API
================================================== */
export async function getBusinessProfile(profileId: number): Promise<BusinessProfile> {
  return apiFetch<BusinessProfile>(`${BUSINESS_PROFILE_BASE}/${profileId}`)
}

export async function getBusinessProfileDetail(channelCode: string): Promise<BusinessProfileDetail> {
  return apiFetch<BusinessProfileDetail>(`${BUSINESS_PROFILE_BASE}/${channelCode}/detail`)
}

export async function getBusinessProfileSummary(channelCode: string): Promise<BusinessProfileSummary> {
  return apiFetch<BusinessProfileSummary>(`${BUSINESS_PROFILE_BASE}/${channelCode}/summary`)
}

export async function getBusinessIndustryOptions(keyword?: string): Promise<BusinessIndustryOption[]> {
  const params = new URLSearchParams()
  if (keyword && keyword.trim()) params.set('keyword', keyword.trim())
  const queryString = params.toString().length > 0 ? `?${params.toString()}` : ''
  return apiFetch<BusinessIndustryOption[]>(`${BUSINESS_PROFILE_BASE}/industries${queryString}`)
}

export async function getBusinessIndustrySubtypeOptions(industryId?: number | null, keyword?: string): Promise<BusinessIndustrySubtypeOption[]> {
  const params = new URLSearchParams()
  if (typeof industryId === 'number' && !Number.isNaN(industryId) && industryId > 0) params.set('industryId', String(industryId))
  if (keyword && keyword.trim()) params.set('keyword', keyword.trim())
  const queryString = params.toString().length > 0 ? `?${params.toString()}` : ''
  return apiFetch<BusinessIndustrySubtypeOption[]>(`${BUSINESS_PROFILE_BASE}/industry-subtypes${queryString}`)
}

export async function getBusinessChannel(profileId: number) {
  return apiFetch(`business/profile-settings/${profileId}/channel`)
}

export async function getBusinessSession(profileId: number): Promise<BusinessSession | null> {
  return apiFetch<BusinessSession | null>(`${BUSINESS_PROFILE_BASE}/${profileId}/session`)
}

export async function getBusinessIndustry(profileId: number): Promise<BusinessIndustryPayload> {
  return apiFetch<BusinessIndustryPayload>(`${BUSINESS_PROFILE_BASE}/${profileId}/industry`)
}

export async function getBusinessPlaceMeta(profileId: number): Promise<BusinessPlaceMeta> {
  return apiFetch<BusinessPlaceMeta>(`${BUSINESS_PROFILE_BASE}/${profileId}/place`)
}

export async function getBusinessInfoBlocks(profileId: number): Promise<BusinessBlock[]> {
  return apiFetch<BusinessBlock[]>(`${BUSINESS_PROFILE_BASE}/${profileId}/blocks`)
}

export async function getBusinessHours(profileId: number): Promise<BusinessHoursPayload> {
  return apiFetch<BusinessHoursPayload>(`${BUSINESS_PROFILE_BASE}/${profileId}/hours`)
}

export async function getBusinessHoursSummary(channelCode: string): Promise<BusinessHoursPayload> {
  return apiFetch<BusinessHoursPayload>(`${BUSINESS_PROFILE_BASE}/${channelCode}/hours-summary`)
}

export async function getBusinessAvatar(profileId: number): Promise<BusinessAvatar | null> {
  return apiFetch<BusinessAvatar | null>(`${BUSINESS_PROFILE_BASE}/${profileId}/avatar`)
}

export async function getBusinessHeroImages(profileId: number): Promise<BusinessHeroImage[]> {
  return apiFetch<BusinessHeroImage[]>(`${BUSINESS_PROFILE_BASE}/${profileId}/hero`)
}

export async function getBusinessGalleryImages(profileId: number): Promise<BusinessGalleryImage[]> {
  return apiFetch<BusinessGalleryImage[]>(`${BUSINESS_PROFILE_BASE}/${profileId}/gallery`)
}

export async function updateBusinessProfileCore(profileId: number, data: { displayName?: string | null; bio?: string | null; contactPhone?: string | null }): Promise<UpdateBusinessProfileResponse> {
  return apiFetch<UpdateBusinessProfileResponse>(`business/profile-settings/${profileId}/core`, { method:'PATCH', body:data })
}

export async function updateBusinessRegistrationNumber(
  profileId: number,
  data: {
    channelCode: string
    businessRegistrationNumber: string
  }
): Promise<UpdateBusinessRegistrationNumberResponse> {
  return apiFetch<UpdateBusinessRegistrationNumberResponse>(
    `business/profile-settings/${profileId}/registration-number`,
    {
      method: 'PATCH',
      body: data
    }
  )
}

export async function updateBusinessChannelRegion(profileId: number, data: { channelName?: string | null; channelURL?: string | null; activityRegionId?: number | null; feedRegionId?: number | null }): Promise<UpdateBusinessProfileResponse> {
  return apiFetch<UpdateBusinessProfileResponse>(`business/profile-settings/${profileId}/channel`, { method:'PATCH', body:data })
}

export async function updateBusinessFields(profileId: number, data: { detailAddress?: string | null; primaryIndustryId?: number | null; primaryIndustrySubtypeId?: number | null; primaryIndustryCode?: string | null; primaryIndustrySubtypeCode?: string | null }): Promise<UpdateBusinessProfileResponse> {
  return apiFetch<UpdateBusinessProfileResponse>(`${BUSINESS_PROFILE_BASE}/${profileId}/business`, { method:'PATCH', body:data })
}

// SECTION 08-1 : UPDATE BUSINESS HOURS
export async function updateBusinessHours(profileId: number, data: { weeklyHours: BusinessHoursDay[] }): Promise<BusinessHoursPayload> {
  return apiFetch<BusinessHoursPayload>(`${BUSINESS_PROFILE_BASE}/${profileId}/hours`, { method:'PATCH', body:data })
}

// SECTION 09 : UPDATE BLOCKS
export async function replaceBusinessInfoBlocks(profileId: number, blocks: BusinessBlock[]): Promise<BusinessBlock[]> {
  return apiFetch<BusinessBlock[]>(`${BUSINESS_PROFILE_BASE}/${profileId}/blocks`, { method:'PUT', body:{ blocks } })
}

// SECTION 09-1 : MEDIA RELATION WRITE
export async function connectBusinessAvatar(profileId: number, imageAssetId: number): Promise<BusinessAvatar | null> {
  return apiFetch<BusinessAvatar | null>(`${BUSINESS_PROFILE_BASE}/${profileId}/avatar`, { method:'PUT', body:{ imageAssetId } })
}

// SECTION 10 : DELETE MEDIA RELATION
export async function deleteBusinessAvatar(profileId: number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`${BUSINESS_PROFILE_BASE}/${profileId}/avatar`, { method:'DELETE' })
}

export async function deleteBusinessHero(profileId: number, heroId: number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`${BUSINESS_PROFILE_BASE}/${profileId}/hero/${heroId}`, { method:'DELETE' })
}

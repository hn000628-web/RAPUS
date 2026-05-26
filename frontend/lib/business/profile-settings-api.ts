import { apiFetch } from '@/lib/api'
import { getMe, MeResponse } from '@/lib/authApi'
import type { PlaceFeedTypeCode } from '@/lib/profile-summary-api'

/* ==================================================
SECTION 01 : PROFILE SUMMARY TYPES
================================================== */
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
  secondaryPhone: string | null
  faxNumber: string | null
  managerEmail: string | null
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

export async function getProfileByChannelCode(channelCode: string): Promise<ProfileDetailPayload> {
  if (!channelCode) throw new Error('channelCode is required')
  return apiFetch(`/profile-summary/channel/${encodeURIComponent(channelCode)}`)
}

/* ==================================================
SECTION 02 : BUSINESS TYPES
================================================== */
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
  secondaryPhone: string | null
  faxNumber: string | null
  managerEmail: string | null
  loginPasswordStatus: 'SET' | 'NOT_SET'
  paymentPasswordStatus: 'SET' | 'NOT_SET'
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

export type BusinessBlock = {
  id?: number
  blockType: string
  title?: string | null
  content?: string | null
  linkUrl?: string | null
  sortOrder: number
  isActive?: number | null
}

export type BusinessPlaceMeta = {
  contactPhone: string | null
  secondaryPhone: string | null
  faxNumber: string | null
  managerEmail: string | null
  activityRegionId: number | null
  feedRegionId: number | null
  detailAddress: string | null
  bio: string | null
  activityRegion?: { fullName: string } | null
  feedRegion?: { fullName: string } | null
}

export type BusinessProfileDetail = {
  profile: BusinessProfile
  placeMeta: BusinessPlaceMeta
  infoBlocks: BusinessBlock[]
  media?: {
    avatar?: { filePath?: string; imageUrl?: string }
    heroImages?: Array<{ filePath?: string; imageUrl?: string }>
  }
}

export type BusinessContactSettingsPayload = {
  contactPhone?: string | null
  secondaryPhone?: string | null
  faxNumber?: string | null
  managerEmail?: string | null
}

export type UpdateBusinessLoginPasswordPayload = {
  currentPassword: string
  settlementApprovalPassword: string
  newPassword: string
  confirmNewPassword: string
}

export type UpdateBusinessPasswordResponse = {
  ok: boolean
  loginPasswordStatus?: 'SET'
  paymentPasswordStatus?: 'SET'
}

export type UpdateBusinessRegistrationNumberResponse = {
  ok: boolean
  businessRegistrationNumber: string
}

/* ==================================================
SECTION 03 : BUSINESS HOURS TYPES + HELPERS
================================================== */
export type DayKey =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'

export type BusinessHoursDayKey =
  | 'MON'
  | 'TUE'
  | 'WED'
  | 'THU'
  | 'FRI'
  | 'SAT'
  | 'SUN'

export type BusinessHoursDay = {
  dayKey: BusinessHoursDayKey
  isClosed: boolean
  startTime: string
  endTime: string
}

export type BusinessHoursState = Record<
  string,
  { isClosed: boolean; startTime: string; endTime: string }
>

export function mapBusinessHoursStateToArray(
  state: BusinessHoursState
): BusinessHoursDay[] {
  const dayKeys: BusinessHoursDayKey[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  return dayKeys.map((day) => {
    const key = day.toLowerCase()
    const dayState = state[key] ?? {
      isClosed: true,
      startTime: '09:00',
      endTime: '18:00'
    }

    return {
      dayKey: day,
      isClosed: dayState.isClosed,
      startTime: dayState.startTime,
      endTime: dayState.endTime
    }
  })
}

/* ==================================================
SECTION 04 : API BASE
================================================== */
const BUSINESS_PROFILE_BASE = 'business/profile-settings'

/* ==================================================
SECTION 05 : BUSINESS API FUNCTIONS
================================================== */
export async function getBusinessProfile(profileId: number): Promise<BusinessProfile> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${profileId}`)
}

export async function getBusinessProfileDetail(
  channelCode: string
): Promise<BusinessProfileDetail> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${channelCode}/detail`)
}

export async function getBusinessProfileSummary(
  channelCode: string
): Promise<BusinessProfileDetail> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${channelCode}/summary`)
}

export async function updateBusinessProfileCore(
  profileId: number,
  data: {
    displayName?: string | null
    bio?: string | null
    contactPhone?: string | null
    placeFeedTypeCode?: PlaceFeedTypeCode | null
  }
): Promise<BusinessProfile> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${profileId}/core`, {
    method: 'PATCH',
    body: data
  })
}

export async function updateBusinessRegistrationNumber(
  profileId: number,
  data: {
    channelCode: string
    businessRegistrationNumber: string
  }
): Promise<UpdateBusinessRegistrationNumberResponse> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${profileId}/registration-number`, {
    method: 'PATCH',
    body: data
  })
}

export async function updateBusinessContactSettings(
  profileId: number,
  data: BusinessContactSettingsPayload
): Promise<BusinessProfile> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${profileId}/contact`, {
    method: 'PATCH',
    body: data
  })
}

export async function updateBusinessLoginPassword(
  profileId: number,
  data: UpdateBusinessLoginPasswordPayload
): Promise<UpdateBusinessPasswordResponse> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${profileId}/login-password`, {
    method: 'PATCH',
    body: data
  })
}

export async function updateBusinessPaymentPassword(
  profileId: number,
  password: string
): Promise<UpdateBusinessPasswordResponse> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${profileId}/payment-password`, {
    method: 'PATCH',
    body: {
      paymentPassword: password,
      confirmPaymentPassword: password
    }
  })
}

export async function updateBusinessChannelRegion(
  profileId: number,
  data: {
    channelName?: string
    channelURL?: string
    activityRegionId?: number
    feedRegionId?: number
    detailAddress?: string | null
  }
): Promise<BusinessProfile> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${profileId}/channel`, {
    method: 'PATCH',
    body: data
  })
}

export async function updateBusinessFields(
  profileId: number,
  data: {
    primaryIndustryId?: number
    primaryIndustrySubtypeId?: number
    primaryIndustryCode?: string
    primaryIndustrySubtypeCode?: string
  }
): Promise<BusinessProfile> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${profileId}/business`, {
    method: 'PATCH',
    body: data
  })
}

export async function updateBusinessHours(
  profileId: number,
  data: { weeklyHours: BusinessHoursDay[] }
): Promise<BusinessHoursDay[]> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${profileId}/hours`, {
    method: 'PATCH',
    body: data
  })
}

export async function replaceBusinessInfoBlocks(
  profileId: number,
  blocks: BusinessBlock[]
): Promise<BusinessBlock[]> {
  return apiFetch(`${BUSINESS_PROFILE_BASE}/${profileId}/blocks`, {
    method: 'PUT',
    body: { blocks }
  })
}

/* ==================================================
SECTION 06 : LOGIN CONTEXT + FULL PROFILE
================================================== */
export async function getMyBusinessProfileFull(): Promise<
  BusinessProfileDetail &
    ProfileDetailPayload & {
      loginUser: MeResponse['user']
    }
> {
  const me = await getMe()
  if (!me.user?.channelCode) throw new Error('로그인 컨텍스트 없음')

  const profileDetail: ProfileDetailPayload = await getProfileByChannelCode(
    me.user.channelCode
  )

  const detail: BusinessProfileDetail = await getBusinessProfileDetail(
    me.user.channelCode
  )

  const normalizedHeroImages =
    detail.media?.heroImages?.map((i) => ({
      filePath: i.filePath ?? undefined,
      imageUrl: i.imageUrl ?? undefined
    })) ?? []

  return {
    ...profileDetail,
    ...detail,
    media: {
      ...detail.media,
      heroImages: normalizedHeroImages
    },
    loginUser: me.user
  }
}

/* ==================================================
SECTION 07 : BUSINESS INDUSTRY OPTIONS
================================================== */
export async function getBusinessIndustryOptions(): Promise<
  { id: number; code: string; name: string }[]
> {
  return apiFetch('/business/profile-settings/industries')
}

export async function getBusinessIndustrySubtypeOptions(
  industryId: number
): Promise<{ id: number; code: string; name: string }[]> {
  return apiFetch(
    `/business/profile-settings/industry-subtypes?industryId=${industryId}`
  )
}

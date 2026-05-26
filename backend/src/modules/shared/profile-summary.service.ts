import { Injectable, NotFoundException } from '@nestjs/common'
import db from '../../config/database'

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
  createdAt: string
  updatedAt: string
}

export type PlaceFeedTypeCode =
  | 'NORMAL'
  | 'MARKET'
  | 'FOOD'
  | 'BEAUTY'
  | 'CULTURE'
  | 'STAY'
  | 'RENTCAR'

@Injectable()
export class ProfileSummaryService {
  // channelCode 단독 조회
  getProfileByChannelCode(channelCode: string): ProfileDetailPayload {
    const row = db.prepare(`
      SELECT *
      FROM profiles
      WHERE channelCode = ?
      LIMIT 1
    `).get(channelCode)

    if (!row) throw new NotFoundException('Profile not found for the given channelCode')

    return row
  }

  // profileId 단독 조회
  getProfileByProfileId(profileId: number): ProfileDetailPayload {
    const row = db.prepare(`
      SELECT *
      FROM profiles
      WHERE id = ?
      LIMIT 1
    `).get(profileId)

    if (!row) throw new NotFoundException('Profile not found for the given profileId')

    return row
  }

  // profileId + channelCode 조합 단일 귀속 조회
  getProfileByProfileIdAndChannelCode(profileId: number, channelCode: string): ProfileDetailPayload {
    const row = db.prepare(`
      SELECT *
      FROM profiles
      WHERE id = ? AND channelCode = ?
      LIMIT 1
    `).get(profileId, channelCode)

    if (!row) throw new NotFoundException('Profile not found for the given profileId and channelCode')

    return row
  }
}

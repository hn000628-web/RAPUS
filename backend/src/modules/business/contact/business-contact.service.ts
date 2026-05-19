import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import db from '../../../config/database'

type BusinessProfileRow = {
  id: number
  channelCode: string
  profileType: 'BUSINESS'
  contactPhone: string | null
}

type BusinessContactPayload = {
  ok: true
  profileId: number
  channelCode: string
  contactPhone: string | null
}

@Injectable()
export class BusinessContactService {

  private getRequiredBusinessProfileByChannelCode(channelCode: string): BusinessProfileRow {
    const cc = channelCode?.trim()
    if (!cc) throw new BadRequestException('channelCode missing')

    const row = db.prepare(`
      SELECT id, channelCode, profileType, contactPhone
      FROM profiles
      WHERE channelCode=? AND profileType='BUSINESS'
      LIMIT 1
    `).get(cc) as BusinessProfileRow | undefined

    if (!row) throw new NotFoundException('Business contact profile not found')
    return row
  }

  getBusinessContactByChannelCode(channelCode: string): BusinessContactPayload {
    const profile = this.getRequiredBusinessProfileByChannelCode(channelCode)
    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      contactPhone: profile.contactPhone ?? null
    }
  }

  updateBusinessContact(channelCode: string, contactPhone: string | null): BusinessContactPayload {
    const profile = this.getRequiredBusinessProfileByChannelCode(channelCode)

    const phone = contactPhone?.trim()
      ? contactPhone.replace(/\D/g, '').replace(/(\d{2,3})(\d{3,4})(\d{4})/, '$1-$2-$3')
      : null

    db.prepare(`
      UPDATE profiles
      SET contactPhone=?, updatedAt=CURRENT_TIMESTAMP
      WHERE id=? AND channelCode=? AND profileType='BUSINESS'
    `).run(phone, profile.id, profile.channelCode)

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      contactPhone: phone
    }
  }
}
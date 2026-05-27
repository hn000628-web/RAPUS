import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import db from '../../config/database'

type UserStatus = 'ACTIVE' | 'INACTIVE'
type ProfileType = 'GENERAL' | 'BUSINESS'

export interface AdminUserRow {
  userId: number
  email: string
  baseCode: string | null
  phone: string | null
  accountType: string
  type: string
  status: UserStatus
  profileCount: number
  createdAt: string | null
}

export interface UploadResult {
  totalRows: number
  createdUsers: number
  createdGeneralProfiles: number
  createdBusinessProfiles: number
  createdBusinessHours: number
  skippedRows: number
  errors: string[]
}

type AddUserInput = {
  email: string
  displayName: string
  accountType?: string
  type?: string
}

type CsvRow = {
  email: string
  password: string
  baseCode: string
  generalDisplayName: string
  businessDisplayName: string
  phone: string
  businessTypeCode: string
  primaryIndustryCode: string
  activityRegionCode: string
  feedRegionCode: string
  detailAddress: string
  memo: string
}

const BASE_CODE_REGEX = /^[A-Z0-9]{12}$/
const ALLOWED_BUSINESS_TYPE_CODES = new Set([
  'STORE',
  'SHOPPING_MALL',
  'FREELANCER',
  'MOBILE_BIZ'
])
const CSV_HEADER = 'email,password,baseCode,generalDisplayName,businessDisplayName,phone,businessTypeCode,primaryIndustryCode,activityRegionCode,feedRegionCode,detailAddress,memo'

@Injectable()
export class UsersService {
  async getAllUsers(): Promise<AdminUserRow[]> {
    const rows = db.prepare(`
      SELECT
        u.id AS userId,
        u.email AS email,
        u.baseCode AS baseCode,
        u.phone AS phone,
        u.accountType AS accountType,
        u.type AS type,
        u.status AS status,
        COUNT(p.id) AS profileCount,
        u.createdAt AS createdAt
      FROM users u
      LEFT JOIN profiles p
        ON p.userId = u.id
      GROUP BY
        u.id,
        u.email,
        u.baseCode,
        u.phone,
        u.accountType,
        u.type,
        u.status,
        u.createdAt
      ORDER BY u.id DESC
    `).all() as Array<{
      userId: number
      email: string
      baseCode: string | null
      phone: string | null
      accountType: string | null
      type: string | null
      status: UserStatus
      profileCount: number
      createdAt: string | null
    }>

    return rows.map((row) => ({
      userId: row.userId,
      email: row.email,
      baseCode: row.baseCode,
      phone: row.phone,
      accountType: row.accountType ?? 'USER',
      type: row.type ?? 'normal',
      status: row.status,
      profileCount: Number(row.profileCount ?? 0),
      createdAt: row.createdAt
    }))
  }

  async addUser(data: AddUserInput): Promise<AdminUserRow> {
    const email = data.email.trim().toLowerCase()
    if (!email) {
      throw new BadRequestException('email required')
    }

    const baseCode = this.generateBaseCodeFromTimestamp()
    const passwordHash = await bcrypt.hash('1234', 10)

    const insertResult = db.prepare(`
      INSERT INTO users(
        email,
        passwordHash,
        baseCode,
        displayName,
        phone,
        accountType,
        status,
        type
      )
      VALUES(?,?,?,?,?,?,?,?)
    `).run(
      email,
      passwordHash,
      baseCode,
      data.displayName,
      null,
      data.accountType ?? 'USER',
      'ACTIVE',
      data.type ?? 'normal'
    )

    const userId = Number(insertResult.lastInsertRowid)
    this.upsertProfile(userId, 'GENERAL', {
      baseCode,
      displayName: data.displayName,
      phone: null,
      businessTypeId: null,
      businessTypeCode: null,
      detailAddress: null
    })

    const list = await this.getAllUsers()
    const created = list.find((item) => item.userId === userId)
    if (!created) {
      throw new NotFoundException('user not found after create')
    }

    return created
  }

  async createUser(data: AddUserInput): Promise<AdminUserRow> {
    return this.addUser(data)
  }

  async toggleStatus(userId: number, status: UserStatus): Promise<void> {
    db.prepare(`
      UPDATE users
      SET status=?
      WHERE id=?
    `).run(status, userId)
  }

  async deleteUser(userId: number): Promise<void> {
    db.prepare(`
      DELETE FROM business_hours
      WHERE profileId IN(
        SELECT id
        FROM profiles
        WHERE userId=?
      )
    `).run(userId)

    db.prepare(`
      DELETE FROM profiles
      WHERE userId=?
    `).run(userId)

    db.prepare(`
      DELETE FROM users
      WHERE id=?
    `).run(userId)
  }

  async uploadCSV(file: Express.Multer.File): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('CSV_FILE_REQUIRED')
    }

    const csvText = file.buffer.toString('utf8').replace(/^\uFEFF/, '')
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length === 0) {
      throw new BadRequestException('INVALID_CSV_HEADER')
    }

    if (lines[0] !== CSV_HEADER) {
      throw new BadRequestException('INVALID_CSV_HEADER')
    }

    const result: UploadResult = {
      totalRows: Math.max(lines.length - 1, 0),
      createdUsers: 0,
      createdGeneralProfiles: 0,
      createdBusinessProfiles: 0,
      createdBusinessHours: 0,
      skippedRows: 0,
      errors: []
    }

    console.log('ADMIN USER CSV IMPORT START')
    console.log(`totalRows=${result.totalRows}`)

    for (let i = 1; i < lines.length; i += 1) {
      const csvRow = this.parseCsvRow(lines[i])
      const rowNumber = i + 1

      try {
        const email = csvRow.email.trim().toLowerCase()
        const password = csvRow.password.trim()
        const baseCode = csvRow.baseCode.trim()
        const businessTypeCode = (csvRow.businessTypeCode || 'STORE').trim().toUpperCase()

        if (!email) {
          throw new BadRequestException(`ROW_${rowNumber}_EMAIL_REQUIRED`)
        }
        if (!password) {
          throw new BadRequestException(`ROW_${rowNumber}_PASSWORD_REQUIRED`)
        }
        if (!baseCode || !BASE_CODE_REGEX.test(baseCode)) {
          throw new BadRequestException('INVALID_BASE_CODE')
        }
        if (!ALLOWED_BUSINESS_TYPE_CODES.has(businessTypeCode)) {
          throw new BadRequestException(`ROW_${rowNumber}_INVALID_BUSINESS_TYPE_CODE`)
        }

        const businessTypeId = this.getBusinessTypeIdByCode(businessTypeCode)

        const userUpsert = await this.upsertUser({
          email,
          password,
          baseCode,
          phone: csvRow.phone.trim()
        })
        if (userUpsert.created) {
          result.createdUsers += 1
        }

        const generalProfile = this.upsertProfile(userUpsert.userId, 'GENERAL', {
          baseCode,
          displayName: csvRow.generalDisplayName.trim(),
          phone: csvRow.phone.trim() || null,
          businessTypeId: null,
          businessTypeCode: null,
          detailAddress: csvRow.detailAddress.trim() || null
        })
        if (generalProfile.created) {
          result.createdGeneralProfiles += 1
        }

        let businessProfile: {
          profileId: number
          channelCode: string
          created: boolean
        }
        try {
          businessProfile = this.upsertProfile(userUpsert.userId, 'BUSINESS', {
            baseCode,
            displayName: csvRow.businessDisplayName.trim(),
            phone: csvRow.phone.trim() || null,
            businessTypeId,
            businessTypeCode,
            detailAddress: csvRow.detailAddress.trim() || null
          })
        } catch {
          throw new BadRequestException('BUSINESS_PROFILE_CREATE_FAILED')
        }
        if (businessProfile.created) {
          result.createdBusinessProfiles += 1
        }

        const createdHours = this.upsertBusinessHours({
          profileId: businessProfile.profileId,
          channelCode: businessProfile.channelCode
        })
        if (createdHours) {
          result.createdBusinessHours += 1
        }

        this.ensureDefaultPlaceFeedAdSettingsForBusinessProfile({
          profileId: businessProfile.profileId,
          channelCode: businessProfile.channelCode
        })
      } catch (error) {
        result.skippedRows += 1
        result.errors.push(this.normalizeError(error))
      }
    }

    console.log('ADMIN USER CSV IMPORT DONE')
    console.log(`createdUsers=${result.createdUsers}`)
    console.log(`createdGeneralProfiles=${result.createdGeneralProfiles}`)
    console.log(`createdBusinessProfiles=${result.createdBusinessProfiles}`)
    console.log(`createdBusinessHours=${result.createdBusinessHours}`)
    console.log(`skippedRows=${result.skippedRows}`)

    return result
  }

  async createTestAccount(): Promise<void> {
    return
  }

  private parseCsvRow(line: string): CsvRow {
    const values = line.split(',')
    return {
      email: values[0] ?? '',
      password: values[1] ?? '',
      baseCode: values[2] ?? '',
      generalDisplayName: values[3] ?? '',
      businessDisplayName: values[4] ?? '',
      phone: values[5] ?? '',
      businessTypeCode: values[6] ?? '',
      primaryIndustryCode: values[7] ?? '',
      activityRegionCode: values[8] ?? '',
      feedRegionCode: values[9] ?? '',
      detailAddress: values[10] ?? '',
      memo: values[11] ?? ''
    }
  }

  private getBusinessTypeIdByCode(code: string): number {
    const businessType = db.prepare(`
      SELECT id
      FROM business_types
      WHERE code=?
      LIMIT 1
    `).get(code) as { id?: number } | undefined

    if (!businessType?.id) {
      throw new BadRequestException('BUSINESS_TYPE_NOT_FOUND')
    }

    return businessType.id
  }

  private async upsertUser(input: {
    email: string
    password: string
    baseCode: string
    phone: string
  }): Promise<{ userId: number; created: boolean }> {
    const existing = db.prepare(`
      SELECT id
      FROM users
      WHERE email=?
      LIMIT 1
    `).get(input.email) as { id?: number } | undefined

    const passwordHash = await bcrypt.hash(input.password, 10)

    if (!existing?.id) {
      const inserted = db.prepare(`
        INSERT INTO users(
          email,
          passwordHash,
          baseCode,
          phone,
          accountType,
          status,
          type
        )
        VALUES(?,?,?,?,?,?,?)
      `).run(
        input.email,
        passwordHash,
        input.baseCode,
        input.phone || null,
        'USER',
        'ACTIVE',
        'normal'
      )

      return {
        userId: Number(inserted.lastInsertRowid),
        created: true
      }
    }

    db.prepare(`
      UPDATE users
      SET
        passwordHash=?,
        baseCode=?,
        phone=?
      WHERE id=?
    `).run(
      passwordHash,
      input.baseCode,
      input.phone || null,
      existing.id
    )

    return {
      userId: existing.id,
      created: false
    }
  }

  private upsertProfile(
    userId: number,
    profileType: ProfileType,
    input: {
      baseCode: string
      displayName: string
      phone: string | null
      businessTypeId: number | null
      businessTypeCode: string | null
      detailAddress: string | null
    }
  ): { profileId: number; channelCode: string; created: boolean } {
    const channelCode = `${profileType === 'GENERAL' ? 'A' : 'B'}${input.baseCode}`
    const channelURL = `xxx.com/@${channelCode}`
    const channelName = input.displayName

    const existing = db.prepare(`
      SELECT id
      FROM profiles
      WHERE userId=? AND profileType=?
      LIMIT 1
    `).get(userId, profileType) as { id?: number } | undefined

    if (!existing?.id) {
      const inserted = db.prepare(`
        INSERT INTO profiles(
          userId,
          profileType,
          baseCode,
          displayName,
          channelCode,
          channelURL,
          channelName,
          contactPhone,
          detailAddress,
          businessTypeId,
          businessTypeCode,
          placeFeedTypeCode
        )
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        userId,
        profileType,
        input.baseCode,
        input.displayName,
        channelCode,
        channelURL,
        channelName,
        input.phone,
        input.detailAddress,
        input.businessTypeId,
        input.businessTypeCode,
        profileType === 'BUSINESS' ? 'NORMAL' : null
      )

      return {
        profileId: Number(inserted.lastInsertRowid),
        channelCode,
        created: true
      }
    }

    db.prepare(`
      UPDATE profiles
      SET
        baseCode=?,
        displayName=?,
        channelCode=?,
        channelURL=?,
        channelName=?,
        contactPhone=?,
        detailAddress=?,
        businessTypeId=?,
        businessTypeCode=?,
        placeFeedTypeCode=?,
        updatedAt=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      input.baseCode,
      input.displayName,
      channelCode,
      channelURL,
      channelName,
      input.phone,
      input.detailAddress,
      input.businessTypeId,
      input.businessTypeCode,
      profileType === 'BUSINESS' ? 'NORMAL' : null,
      existing.id
    )

    return {
      profileId: existing.id,
      channelCode,
      created: false
    }
  }

  private upsertBusinessHours(input: {
    profileId: number
    channelCode: string
  }): boolean {
    const existing = db.prepare(`
      SELECT profileId
      FROM business_hours
      WHERE profileId=?
      LIMIT 1
    `).get(input.profileId) as { profileId?: number } | undefined

    if (!existing?.profileId) {
      db.prepare(`
        INSERT INTO business_hours(
          profileId,
          channelCode,
          isActive,
          temporaryClosed
        )
        VALUES(?,?,1,0)
      `).run(input.profileId, input.channelCode)

      return true
    }

    db.prepare(`
      UPDATE business_hours
      SET
        channelCode=?,
        isActive=1,
        temporaryClosed=0,
        updatedAt=CURRENT_TIMESTAMP
      WHERE profileId=?
    `).run(input.channelCode, input.profileId)

    return false
  }

  private ensureDefaultPlaceFeedAdSettingsForBusinessProfile(input: {
    profileId: number
    channelCode: string
  }): void {
    db.prepare(`
      INSERT INTO place_feed_ad_settings(
        profileId,
        channelCode,
        adSlotNo,
        adStatus,
        isPlaceFeedEnabled,
        isActive,
        createdAt,
        updatedAt
      )
      SELECT
        ?,
        ?,
        0,
        'NONE',
        1,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      WHERE NOT EXISTS (
        SELECT 1
        FROM place_feed_ad_settings
        WHERE profileId = ?
          AND channelCode = ?
      )
    `).run(
      input.profileId,
      input.channelCode,
      input.profileId,
      input.channelCode
    )
  }

  private normalizeError(error: unknown): string {
    if (error instanceof BadRequestException) {
      const response = error.getResponse()
      if (typeof response === 'string') {
        return response
      }
      if (typeof response === 'object' && response && 'message' in response) {
        const message = (response as { message?: string | string[] }).message
        if (typeof message === 'string') {
          return message
        }
        if (Array.isArray(message) && message.length > 0) {
          return String(message[0])
        }
      }
      return 'BAD_REQUEST'
    }

    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed: profiles.channelCode')) {
        return 'BUSINESS_PROFILE_CREATE_FAILED'
      }
      return error.message
    }

    return 'UNKNOWN_ERROR'
  }

  private generateBaseCodeFromTimestamp(): string {
    const seed = `${Date.now()}${Math.floor(Math.random() * 9999)}`
      .replace(/[^0-9]/g, '')
      .slice(-12)
      .padStart(12, '0')

    return seed
      .replace(/0/g, 'A')
      .replace(/1/g, 'B')
      .replace(/2/g, 'C')
      .replace(/3/g, 'D')
      .replace(/4/g, 'E')
      .replace(/5/g, 'F')
      .replace(/6/g, 'G')
      .replace(/7/g, 'H')
      .replace(/8/g, 'J')
      .replace(/9/g, 'K')
  }
}

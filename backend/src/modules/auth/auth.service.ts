/* ==================================================
FILE : backend/src/modules/auth/auth.service.ts
STATUS : PRODUCTION FINAL DB FK SAFE MATCH
ROLE : LOGIN + SESSION + JWT + PROFILE SAFE INIT
================================================== */

import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { createHash, randomBytes, randomInt, randomUUID } from 'crypto'
import db from '../../config/database'

type ProfileType = 'GENERAL' | 'BUSINESS'
type BusinessTypeCode =
  | 'NORMAL'
  | 'STORE'
  | 'SHOPPING_MALL'
  | 'FREELANCER'
  | 'MOBILE_BIZ'

type SignupInput = {
  email: string
  password: string
  profileType: ProfileType
  displayName?: string
  businessTypeCode?: BusinessTypeCode
}

type BusinessSignupInput = {
  displayName?: string
  businessTypeCode?: BusinessTypeCode
}

type EmergencyQrTokenType =
  | 'MASTER_ACCESS'
  | 'GUARDIAN_ACCESS'
  | 'EMERGENCY_LOGIN'

type EmergencyQrStatus =
  | 'ACTIVE'
  | 'USED'
  | 'EXPIRED'
  | 'REVOKED'

type EmergencyRequestContext = {
  ipAddress?: string | null
  userAgent?: string | null
}

type EmergencyGenerateQrInput = {
  channelCode: string
  emergencyAccessCode: string
  tokenType?: EmergencyQrTokenType
}

type EmergencyVerifyQrInput = {
  channelCode?: string
  tokenId?: string
  qrToken?: string
  qrPayload?: string
}

type ExistingUserRow = {
  id: number
  email: string
  baseCode: string | null
}

type PosDefaultCategory = {
  categoryCode: 'MAIN' | 'SUB' | 'DRINK' | 'SIDE' | 'ALCOHOL'
  categoryName: string
  sortOrder: number
  isActive: 0 | 1
  isDefault: 0 | 1
  isDeletable: 0 | 1
  ageRestrictionType: string | null
  requiresAdultVerification: 0 | 1
  restrictedOrderChannel: string | null
}

type PosDefaultOrderType = {
  orderTypeCode: 'TABLE' | 'RESERVATION' | 'DELIVERY' | 'PICKUP' | 'QR_ORDER' | 'KIOSK'
  defaultTitle: string
  description: string
  isEnabled: 0 | 1
  sortOrder: number
}

type BusinessDefaultMenuConfig = {
  menuType: 'INFO' | 'SUMMARY' | 'REVIEW' | 'EVENT' | 'PRODUCT' | 'GENERAL' | 'GALLERY'
  label: string
  sortOrder: number
  isDefault: 0 | 1
  isRequired: 0 | 1
  isEnabled: 0 | 1
  deletable: 0 | 1
}

const DEFAULT_POS_CATEGORIES: PosDefaultCategory[] = [
  {
    categoryCode: 'MAIN',
    categoryName: '메인 메뉴',
    sortOrder: 1,
    isActive: 1,
    isDefault: 1,
    isDeletable: 0,
    ageRestrictionType: null,
    requiresAdultVerification: 0,
    restrictedOrderChannel: null
  },
  {
    categoryCode: 'SUB',
    categoryName: '서브 메뉴',
    sortOrder: 2,
    isActive: 1,
    isDefault: 1,
    isDeletable: 1,
    ageRestrictionType: null,
    requiresAdultVerification: 0,
    restrictedOrderChannel: null
  },
  {
    categoryCode: 'DRINK',
    categoryName: '음료',
    sortOrder: 3,
    isActive: 1,
    isDefault: 1,
    isDeletable: 1,
    ageRestrictionType: null,
    requiresAdultVerification: 0,
    restrictedOrderChannel: null
  },
  {
    categoryCode: 'SIDE',
    categoryName: '사이드',
    sortOrder: 4,
    isActive: 1,
    isDefault: 1,
    isDeletable: 1,
    ageRestrictionType: null,
    requiresAdultVerification: 0,
    restrictedOrderChannel: null
  },
  {
    categoryCode: 'ALCOHOL',
    categoryName: '주류',
    sortOrder: 5,
    isActive: 1,
    isDefault: 1,
    isDeletable: 1,
    ageRestrictionType: 'ADULT_19',
    requiresAdultVerification: 1,
    restrictedOrderChannel: 'QR_ORDER'
  }
]

const DEFAULT_POS_ORDER_TYPES: PosDefaultOrderType[] = [
  {
    orderTypeCode: 'TABLE',
    defaultTitle: '테이블 주문',
    description: '매장 내 테이블 주문을 사용합니다.',
    isEnabled: 1,
    sortOrder: 1
  },
  {
    orderTypeCode: 'RESERVATION',
    defaultTitle: '예약 주문',
    description: '예약 기반 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 2
  },
  {
    orderTypeCode: 'DELIVERY',
    defaultTitle: '배달 주문',
    description: '배달 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 3
  },
  {
    orderTypeCode: 'PICKUP',
    defaultTitle: '픽업 주문',
    description: '픽업 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 4
  },
  {
    orderTypeCode: 'QR_ORDER',
    defaultTitle: 'QR 주문',
    description: '테이블 QR 주문 접수를 사용합니다.',
    isEnabled: 1,
    sortOrder: 5
  },
  {
    orderTypeCode: 'KIOSK',
    defaultTitle: '키오스크 주문',
    description: '키오스크 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 6
  }
]

const DEFAULT_BUSINESS_MENU_CONFIGS: BusinessDefaultMenuConfig[] = [
  { menuType: 'INFO', label: '안내', sortOrder: 1, isDefault: 1, isRequired: 1, isEnabled: 1, deletable: 0 },
  { menuType: 'SUMMARY', label: '소개', sortOrder: 2, isDefault: 1, isRequired: 1, isEnabled: 1, deletable: 0 },
  { menuType: 'REVIEW', label: '리뷰', sortOrder: 3, isDefault: 1, isRequired: 1, isEnabled: 1, deletable: 0 },
  { menuType: 'EVENT', label: '이벤트', sortOrder: 4, isDefault: 0, isRequired: 0, isEnabled: 1, deletable: 1 },
  { menuType: 'PRODUCT', label: '메뉴/상품/서비스', sortOrder: 5, isDefault: 0, isRequired: 0, isEnabled: 1, deletable: 1 },
  { menuType: 'GENERAL', label: '게시물', sortOrder: 6, isDefault: 0, isRequired: 0, isEnabled: 1, deletable: 1 },
  { menuType: 'GALLERY', label: '사진첩', sortOrder: 7, isDefault: 0, isRequired: 0, isEnabled: 1, deletable: 1 }
]

const EMERGENCY_QR_TOKEN_TTL_SECONDS = 180
const ADMIN_HEARTBEAT_INTERVAL_MS = 10000
const ADMIN_SESSION_EXPIRE_MS = 30 * 60 * 1000

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  // ==================================================
  // SECTION 00 SIGNUP HELPERS
  // ==================================================
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private assertProfileType(profileType: string): asserts profileType is ProfileType {
    if (profileType !== 'GENERAL' && profileType !== 'BUSINESS') {
      throw new BadRequestException('invalid profileType')
    }
  }

  private hasForbiddenBaseCodePattern(baseCode: string): boolean {
    const forbiddenPatterns = new Set([
      'AAAAAAAAAAAA',
      '000000000000',
      '111111111111',
      'ABCABCABCABC'
    ])

    return forbiddenPatterns.has(baseCode)
  }

  private generateBaseCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

    while (true) {
      let baseCode = ''

      for (let i = 0; i < 12; i += 1) {
        baseCode += chars[randomInt(0, chars.length)]
      }

      if (!this.hasForbiddenBaseCodePattern(baseCode)) {
        return baseCode
      }
    }
  }

  private createChannelCode(profileType: ProfileType, baseCode: string): string {
    const prefix = profileType === 'GENERAL' ? 'A' : 'B'
    return `${prefix}${baseCode}`
  }

  private createChannelURL(channelCode: string): string {
    return `xxx.com/@${channelCode}`
  }

  private getBusinessTypeId(code: BusinessTypeCode): number {
    const row = db.prepare(`
      SELECT id
      FROM business_types
      WHERE code=?
    `).get(code) as { id?: number } | undefined

    if (!row?.id) {
      throw new BadRequestException('business type not found')
    }

    return row.id
  }

  private isSqliteUniqueError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false
    }

    const sqliteError = error as Error & { code?: string }
    return sqliteError.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')
  }

  private getExistingUserByEmail(email: string): ExistingUserRow | undefined {
    return db.prepare(`
      SELECT id, email, baseCode
      FROM users
      WHERE email=?
    `).get(email) as ExistingUserRow | undefined
  }

  private getProfileBaseCodeByUserId(userId: number): string | null {
    const row = db.prepare(`
      SELECT baseCode
      FROM profiles
      WHERE userId=?
      ORDER BY id ASC
      LIMIT 1
    `).get(userId) as { baseCode?: string } | undefined

    return row?.baseCode ?? null
  }

  private createUserWithBaseCode(email: string, passwordHash: string, displayName: string | null): ExistingUserRow {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const baseCode = this.generateBaseCode()

      try {
        const inserted = db.prepare(`
          INSERT INTO users(email, passwordHash, baseCode, displayName)
          VALUES(?,?,?,?)
        `).run(email, passwordHash, baseCode, displayName)

        const userId = Number(inserted.lastInsertRowid)
        return {
          id: userId,
          email,
          baseCode
        }
      } catch (error) {
        if (!this.isSqliteUniqueError(error)) {
          throw error
        }
      }
    }

    throw new BadRequestException('failed to create baseCode')
  }

  private ensureUserBaseCode(userId: number, currentBaseCode: string | null): string {
    if (currentBaseCode) {
      return currentBaseCode
    }

    const profileBaseCode = this.getProfileBaseCodeByUserId(userId)
    if (profileBaseCode) {
      db.prepare(`
        UPDATE users
        SET baseCode=?
        WHERE id=? AND baseCode IS NULL
      `).run(profileBaseCode, userId)

      const user = db.prepare(`
        SELECT baseCode
        FROM users
        WHERE id=?
      `).get(userId) as { baseCode?: string } | undefined

      if (user?.baseCode) {
        return user.baseCode
      }
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const baseCode = this.generateBaseCode()

      try {
        db.prepare(`
          UPDATE users
          SET baseCode=?
          WHERE id=? AND baseCode IS NULL
        `).run(baseCode, userId)
      } catch (error) {
        if (!this.isSqliteUniqueError(error)) {
          throw error
        }

        continue
      }

      const user = db.prepare(`
        SELECT baseCode
        FROM users
        WHERE id=?
      `).get(userId) as { baseCode?: string } | undefined

      if (user?.baseCode) {
        return user.baseCode
      }
    }

    throw new BadRequestException('failed to create baseCode')
  }

  private ensureDefaultPosSettingsForBusinessProfile(
    profileId: number,
    channelCode: string
  ): void {
    const businessProfile = db.prepare(`
      SELECT id
      FROM profiles
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId, channelCode) as { id?: number } | undefined

    if (!businessProfile?.id) {
      return
    }

    const insertCategory = db.prepare(`
      INSERT OR IGNORE INTO pos_product_categories(
        profileId,
        channelCode,
        categoryCode,
        categoryName,
        sortOrder,
        isActive,
        isDefault,
        isDeletable,
        ageRestrictionType,
        requiresAdultVerification,
        restrictedOrderChannel,
        createdAt,
        updatedAt
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `)

    const insertOrderType = db.prepare(`
      INSERT OR IGNORE INTO pos_order_type_configs(
        profileId,
        channelCode,
        orderTypeCode,
        defaultTitle,
        customTitle,
        description,
        isEnabled,
        isFixed,
        sortOrder
      )
      VALUES(?,?,?,?,?,?,?,?,?)
    `)

    const insertBusinessHours = db.prepare(`
      INSERT OR IGNORE INTO business_hours(
        profileId,
        channelCode,
        isActive,
        mon_isActive, mon_isClosed, mon_startTime, mon_endTime,
        tue_isActive, tue_isClosed, tue_startTime, tue_endTime,
        wed_isActive, wed_isClosed, wed_startTime, wed_endTime,
        thu_isActive, thu_isClosed, thu_startTime, thu_endTime,
        fri_isActive, fri_isClosed, fri_startTime, fri_endTime,
        sat_isActive, sat_isClosed, sat_startTime, sat_endTime,
        sun_isActive, sun_isClosed, sun_startTime, sun_endTime,
        temporaryClosed,
        createdAt,
        updatedAt
      )
      VALUES(
        ?, ?,
        1,
        1, 1, '', '',
        1, 1, '', '',
        1, 1, '', '',
        1, 1, '', '',
        1, 1, '', '',
        1, 1, '', '',
        1, 1, '', '',
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `)

    const tx = db.transaction(() => {
      for (const category of DEFAULT_POS_CATEGORIES) {
        insertCategory.run(
          profileId,
          channelCode,
          category.categoryCode,
          category.categoryName,
          category.sortOrder,
          category.isActive,
          category.isDefault,
          category.isDeletable,
          category.ageRestrictionType,
          category.requiresAdultVerification,
          category.restrictedOrderChannel
        )
      }

      for (const orderType of DEFAULT_POS_ORDER_TYPES) {
        insertOrderType.run(
          profileId,
          channelCode,
          orderType.orderTypeCode,
          orderType.defaultTitle,
          null,
          orderType.description,
          orderType.isEnabled,
          1,
          orderType.sortOrder
        )
      }

      insertBusinessHours.run(
        profileId,
        channelCode
      )
    })

    tx()
  }

  private ensureDefaultBusinessMenuConfigForBusinessProfile(
    profileId: number,
    channelCode: string
  ): void {
    const businessProfile = db.prepare(`
      SELECT id
      FROM profiles
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId, channelCode) as { id?: number } | undefined

    if (!businessProfile?.id) {
      return
    }

    const insertMenu = db.prepare(`
      INSERT OR IGNORE INTO profile_categories(
        profileId,
        channelCode,
        postType,
        name,
        title,
        sortOrder,
        isActive,
        isSystem,
        isDefault,
        isRequired,
        deletable,
        createdAt,
        updatedAt
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `)

    const tx = db.transaction(() => {
      for (const menu of DEFAULT_BUSINESS_MENU_CONFIGS) {
        insertMenu.run(
          profileId,
          channelCode,
          menu.menuType,
          menu.label,
          menu.label,
          menu.sortOrder,
          menu.isEnabled,
          menu.isDefault,
          menu.isDefault,
          menu.isRequired,
          menu.deletable
        )
      }
    })

    tx()
  }

  private ensureDefaultPlaceFeedAdSettingsForBusinessProfile(
    profileId: number,
    channelCode: string
  ): void {
    const businessProfile = db.prepare(`
      SELECT id
      FROM profiles
      WHERE id = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(profileId, channelCode) as { id?: number } | undefined

    if (!businessProfile?.id) {
      return
    }

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
      profileId,
      channelCode,
      profileId,
      channelCode
    )
  }

  // ==================================================
  // SECTION 00-1 SIGNUP
  // ==================================================
  async signup(body: SignupInput) {
    const email = this.normalizeEmail(body.email)

    if (!email) {
      throw new BadRequestException('email is required')
    }

    if (!body.password) {
      throw new BadRequestException('password is required')
    }

    this.assertProfileType(body.profileType)
    const profileType = body.profileType

    const existingUser = this.getExistingUserByEmail(email)

    let userId: number
    let userEmail: string
    let accountBaseCode: string

    if (!existingUser) {
      const passwordHash = await bcrypt.hash(body.password, 10)
      const createdUser = this.createUserWithBaseCode(
        email,
        passwordHash,
        body.displayName?.trim() || null
      )

      userId = createdUser.id
      userEmail = createdUser.email
      accountBaseCode = createdUser.baseCode as string
    } else {
      userId = existingUser.id
      userEmail = existingUser.email
      accountBaseCode = this.ensureUserBaseCode(userId, existingUser.baseCode)
    }

    const existingProfile = db.prepare(`
      SELECT id
      FROM profiles
      WHERE userId=? AND profileType=?
    `).get(userId, profileType) as { id?: number } | undefined

    if (existingProfile?.id) {
      throw new ConflictException('profile already exists')
    }

    let businessTypeId: number | null = null
    let businessTypeCode: BusinessTypeCode | null = null
    let placeFeedTypeCode: 'NORMAL' | null = null

    if (profileType === 'BUSINESS') {
      const selectedBusinessTypeCode = body.businessTypeCode ?? 'NORMAL'

      if (
        selectedBusinessTypeCode !== 'NORMAL'
        && selectedBusinessTypeCode !== 'STORE'
        && selectedBusinessTypeCode !== 'SHOPPING_MALL'
        && selectedBusinessTypeCode !== 'FREELANCER'
        && selectedBusinessTypeCode !== 'MOBILE_BIZ'
      ) {
        throw new BadRequestException('invalid businessTypeCode')
      }

      businessTypeCode = selectedBusinessTypeCode
      businessTypeId = this.getBusinessTypeId(selectedBusinessTypeCode)
      placeFeedTypeCode = 'NORMAL'
    }

    const displayName = body.displayName?.trim() || `${email}_${profileType.toLowerCase()}`
    const channelCode = this.createChannelCode(profileType, accountBaseCode)
    const channelURL = this.createChannelURL(channelCode)
    let createdProfileId: number

    try {
      const inserted = db.prepare(`
        INSERT INTO profiles(
          userId,
          profileType,
          baseCode,
          displayName,
          channelCode,
          channelURL,
          contactPhone,
          businessTypeId,
          businessTypeCode,
          placeFeedTypeCode
        )
        VALUES(?,?,?,?,?,?,?,?,?,?)
      `).run(
        userId,
        profileType,
        accountBaseCode,
        displayName,
        channelCode,
        channelURL,
        null,
        businessTypeId,
        businessTypeCode,
        placeFeedTypeCode
      )

      createdProfileId = Number(inserted.lastInsertRowid)
    } catch (error) {
      if (this.isSqliteUniqueError(error)) {
        throw new BadRequestException('failed to create profile with account baseCode')
      }

      throw error
    }

    const profile = db.prepare(`
      SELECT id, userId, profileType, channelCode, channelURL, displayName, baseCode
      FROM profiles
      WHERE id=?
    `).get(createdProfileId) as {
      id: number
      userId: number
      profileType: ProfileType
      channelCode: string
      channelURL: string
      displayName: string | null
      baseCode: string
    } | undefined

    if (!profile) {
      throw new BadRequestException('profile not found')
    }

    if (profile.profileType === 'BUSINESS') {
      this.ensureDefaultPosSettingsForBusinessProfile(
        profile.id,
        profile.channelCode
      )
      this.ensureDefaultBusinessMenuConfigForBusinessProfile(
        profile.id,
        profile.channelCode
      )
      this.ensureDefaultPlaceFeedAdSettingsForBusinessProfile(
        profile.id,
        profile.channelCode
      )
    }

    const accessUser = db.prepare(`
      SELECT corporationGrade, providerGrade
      FROM users
      WHERE id=?
    `).get(userId) as {
      corporationGrade: number | null
      providerGrade: number | null
    } | undefined

    return {
      ok: true,
      user: {
        userId,
        id: userId,
        profileId: profile.id,
        profileType: profile.profileType,
        channelCode: profile.channelCode,
        channelURL: profile.channelURL,
        displayName: profile.displayName,
        email: userEmail,
        baseCode: profile.baseCode,
        corporationGrade: accessUser?.corporationGrade ?? null,
        providerGrade: accessUser?.providerGrade ?? 0
      }
    }
  }

  // ==================================================
  // SECTION 00-2 BUSINESS SIGNUP
  // ==================================================
  async signupBusinessProfile(
    userId: number,
    body: BusinessSignupInput
  ) {
    const user = db.prepare(`
      SELECT id, email, baseCode, corporationGrade, providerGrade, userGrade, genesisGrade
      FROM users
      WHERE id=?
    `).get(userId) as
      | {
          id: number
          email: string
          baseCode: string | null
          corporationGrade: number | null
          providerGrade: number | null
          userGrade: number | null
          genesisGrade: number | null
        }
      | undefined

    if (!user) {
      throw new BadRequestException('User not found')
    }

    const accountBaseCode =
      this.ensureUserBaseCode(user.id, user.baseCode)

    const existingProfile = db.prepare(`
      SELECT id, userId, profileType, channelCode, channelURL, displayName, baseCode
      FROM profiles
      WHERE userId=? AND profileType='BUSINESS'
      LIMIT 1
    `).get(user.id) as
      | {
          id: number
          userId: number
          profileType: 'BUSINESS'
          channelCode: string
          channelURL: string | null
          displayName: string | null
          baseCode: string
        }
      | undefined

    let profile = existingProfile
    let alreadyExists = Boolean(existingProfile?.id)

    if (!profile) {
      const selectedBusinessTypeCode =
        body.businessTypeCode ?? 'NORMAL'

      if (
        selectedBusinessTypeCode !== 'NORMAL'
        && selectedBusinessTypeCode !== 'STORE'
        && selectedBusinessTypeCode !== 'SHOPPING_MALL'
        && selectedBusinessTypeCode !== 'FREELANCER'
        && selectedBusinessTypeCode !== 'MOBILE_BIZ'
      ) {
        throw new BadRequestException('invalid businessTypeCode')
      }

      const businessTypeId =
        this.getBusinessTypeId(selectedBusinessTypeCode)
      const displayName =
        body.displayName?.trim() || `${user.email}_business`
      const channelCode =
        this.createChannelCode('BUSINESS', accountBaseCode)
      const channelURL =
        this.createChannelURL(channelCode)

      try {
        const inserted = db.prepare(`
          INSERT INTO profiles(
            userId,
            profileType,
            baseCode,
            displayName,
            channelCode,
            channelURL,
            contactPhone,
            businessTypeId,
            businessTypeCode,
            placeFeedTypeCode
          )
          VALUES(?,?,?,?,?,?,?,?,?,?)
        `).run(
          user.id,
          'BUSINESS',
          accountBaseCode,
          displayName,
          channelCode,
          channelURL,
          null,
          businessTypeId,
          selectedBusinessTypeCode,
          'NORMAL'
        )

        profile = db.prepare(`
          SELECT id, userId, profileType, channelCode, channelURL, displayName, baseCode
          FROM profiles
          WHERE id=?
        `).get(Number(inserted.lastInsertRowid)) as {
          id: number
          userId: number
          profileType: 'BUSINESS'
          channelCode: string
          channelURL: string | null
          displayName: string | null
          baseCode: string
        }
      } catch (error) {
        if (this.isSqliteUniqueError(error)) {
          throw new ConflictException('business profile already exists')
        }

        throw error
      }

      if (!profile) {
        throw new BadRequestException('profile not found')
      }

      this.ensureDefaultPosSettingsForBusinessProfile(
        profile.id,
        profile.channelCode
      )
      this.ensureDefaultBusinessMenuConfigForBusinessProfile(
        profile.id,
        profile.channelCode
      )
      this.ensureDefaultPlaceFeedAdSettingsForBusinessProfile(
        profile.id,
        profile.channelCode
      )
    }

    db.prepare(`
      UPDATE users
      SET
        userGrade = CASE
          WHEN userGrade < 1 THEN 1
          ELSE userGrade
        END,
        providerGrade = 0
      WHERE id=?
    `).run(user.id)

    const updatedUser = db.prepare(`
      SELECT id, email, corporationGrade, providerGrade, userGrade, genesisGrade
      FROM users
      WHERE id=?
    `).get(user.id) as {
      id: number
      email: string
      corporationGrade: number | null
      providerGrade: number | null
      userGrade: number | null
      genesisGrade: number | null
    }

    db.prepare(`DELETE FROM profile_sessions WHERE profileId=?`).run(profile.id)

    const now = new Date().toISOString()
    db.prepare(`
      INSERT INTO profile_sessions(userId, profileId, profileType, channelCode, status, loginAt, lastSeenAt)
      VALUES(?,?,?,?,?,?,?)
    `).run(
      user.id,
      profile.id,
      profile.profileType,
      profile.channelCode,
      'ACTIVE',
      now,
      now
    )

    const payload = {
      sub: user.id,
      profileId: profile.id,
      profileType: profile.profileType,
      channelCode: profile.channelCode
    }

    const accessToken =
      this.jwtService.sign(payload)

    return {
      ok: true,
      alreadyExists,
      accessToken,
      user: {
        userId: user.id,
        id: user.id,
        profileId: profile.id,
        profileType: profile.profileType,
        channelCode: profile.channelCode,
        channelURL: profile.channelURL,
        displayName: profile.displayName,
        email: updatedUser.email,
        baseCode: profile.baseCode,
        corporationGrade: updatedUser.corporationGrade,
        providerGrade: updatedUser.providerGrade ?? 0,
        genesisGrade: updatedUser.genesisGrade ?? 0,
        userGrade: updatedUser.userGrade ?? 0
      }
    }
  }

  // ==================================================
  // SECTION 01 LOGIN
  // ==================================================
  async login(email: string, password: string, profileType: ProfileType) {
    this.assertProfileType(profileType)

    const user = db.prepare(`
      SELECT id, email, passwordHash, corporationGrade, providerGrade
      FROM users
      WHERE email=?
    `).get(email.toLowerCase())

    if (!user) throw new UnauthorizedException('Invalid credentials')

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw new UnauthorizedException('Invalid credentials')

    const profile = db.prepare(`
      SELECT id, userId, profileType, channelCode, displayName, baseCode
      FROM profiles
      WHERE userId=? AND profileType=?
    `).get(user.id, profileType)

    if (!profile) {
      throw new BadRequestException('profile not found')
    }

    // ==================================================
    // SESSION 泥섎━
    // ==================================================
    const now = new Date().toISOString()
    db.prepare(`DELETE FROM profile_sessions WHERE profileId=?`).run(profile.id)
    db.prepare(`
      INSERT INTO profile_sessions(userId, profileId, profileType, channelCode, status, loginAt, lastSeenAt)
      VALUES(?,?,?,?,?,?,?)
    `).run(user.id, profile.id, profile.profileType, profile.channelCode, 'ACTIVE', now, now)

    const payload = { sub: user.id, profileId: profile.id, profileType: profile.profileType, channelCode: profile.channelCode }
    const accessToken = this.jwtService.sign(payload)

    return {
      ok: true,
      accessToken,
      user: {
        userId: user.id,
        id: user.id,
        profileId: profile.id,
        profileType: profile.profileType,
        channelCode: profile.channelCode,
        displayName: profile.displayName,
        email: user.email,          // 異붽?
        baseCode: profile.baseCode,  // 異붽?
        corporationGrade: user.corporationGrade,
        providerGrade: user.providerGrade ?? 0
      }
    }
  }

  // ==================================================
  // SECTION 02 LOGOUT
  // ==================================================
  async logout(profileId: number) {
    db.prepare(`UPDATE profile_sessions SET status='CLOSED' WHERE profileId=?`).run(profileId)
    return { ok: true }
  }

  // ==================================================
  // SECTION 03 REFRESH
  // ==================================================
  async refresh(profileId: number) {
    const session = db.prepare(`
      SELECT id FROM profile_sessions
      WHERE profileId=? AND status='ACTIVE'
    `).get(profileId)

    if (!session) throw new UnauthorizedException('session expired')

    const profile = db.prepare(`
      SELECT userId, profileType, channelCode, baseCode
      FROM profiles
      WHERE id=?
    `).get(profileId)

    const payload = { sub: profile.userId, profileId, profileType: profile.profileType, channelCode: profile.channelCode }
    const accessToken = this.jwtService.sign(payload)

    return { ok: true, accessToken }
  }

  // ==================================================
  // SECTION 03-1 ADMIN SESSION CHECK
  // ==================================================
  private assertSessionAlive(
    profileId: number,
    maxIdleMs: number
  ) {
    const session = db.prepare(`
      SELECT id, lastSeenAt
      FROM profile_sessions
      WHERE profileId=? AND status='ACTIVE'
      LIMIT 1
    `).get(profileId) as
      | {
          id: number
          lastSeenAt: string | null
        }
      | undefined

    if (!session) {
      throw new UnauthorizedException('session expired')
    }

    const lastSeenAtMs =
      session.lastSeenAt
        ? new Date(session.lastSeenAt).getTime()
        : NaN

    if (!Number.isFinite(lastSeenAtMs)) {
      db.prepare(`
        UPDATE profile_sessions
        SET status='CLOSED'
        WHERE id=?
      `).run(session.id)
      throw new UnauthorizedException('session expired')
    }

    const idleMs =
      Date.now() - lastSeenAtMs

    if (idleMs > maxIdleMs) {
      db.prepare(`
        UPDATE profile_sessions
        SET status='CLOSED'
        WHERE id=?
      `).run(session.id)
      throw new UnauthorizedException('session expired')
    }
  }

  private getCorporationGradeByProfileId(
    profileId: number
  ): number {
    const row = db.prepare(`
      SELECT u.corporationGrade AS corporationGrade
      FROM profiles p
      JOIN users u ON u.id = p.userId
      WHERE p.id=?
      LIMIT 1
    `).get(profileId) as
      | {
          corporationGrade: number | null
        }
      | undefined

    return Number(row?.corporationGrade ?? 0)
  }

  enforceAdminSessionAliveIfAdmin(profileId: number) {
    const corporationGrade =
      this.getCorporationGradeByProfileId(profileId)

    if (corporationGrade < 24) {
      return
    }

    this.assertSessionAlive(
      profileId,
      ADMIN_SESSION_EXPIRE_MS
    )
  }

  adminHeartbeat(profileId: number) {
    const corporationGrade =
      this.getCorporationGradeByProfileId(profileId)

    if (corporationGrade < 24) {
      throw new UnauthorizedException('admin only')
    }

    this.assertSessionAlive(
      profileId,
      ADMIN_SESSION_EXPIRE_MS
    )

    const now =
      new Date().toISOString()

    db.prepare(`
      UPDATE profile_sessions
      SET lastSeenAt=?
      WHERE profileId=? AND status='ACTIVE'
    `).run(now, profileId)

    return {
      ok: true,
      lastSeenAt: now,
      heartbeatIntervalMs: ADMIN_HEARTBEAT_INTERVAL_MS,
      expireMs: ADMIN_SESSION_EXPIRE_MS
    }
  }

  // ==================================================
  // SECTION 04 GET USER
  // ==================================================
  async getUserById(userId: number) {
    const user = db.prepare(`
      SELECT id, email, corporationGrade, providerGrade, userGrade, genesisGrade, meteoAiGrade
      FROM users
      WHERE id=?
    `).get(userId)

    if (!user) throw new BadRequestException('User not found')
    return user
  }

  businessTrialApply(userId: number) {
    const user = db.prepare(`
      SELECT id, email, corporationGrade, providerGrade, userGrade
      FROM users
      WHERE id=?
    `).get(userId) as {
      id: number
      email: string
      corporationGrade: number | null
      providerGrade: number | null
      userGrade: number | null
    } | undefined

    if (!user) {
      throw new BadRequestException('User not found')
    }

    db.prepare(`
      UPDATE users
      SET userGrade = CASE
        WHEN COALESCE(userGrade, 0) < 2 THEN 2
        ELSE userGrade
      END
      WHERE id=?
    `).run(user.id)

    const updatedUser = db.prepare(`
      SELECT id, email, corporationGrade, providerGrade, userGrade
      FROM users
      WHERE id=?
    `).get(user.id) as {
      id: number
      email: string
      corporationGrade: number | null
      providerGrade: number | null
      userGrade: number | null
    }

    return {
      ok: true,
      user: {
        userId: updatedUser.id,
        email: updatedUser.email,
        userGrade: updatedUser.userGrade ?? 0,
        providerGrade: updatedUser.providerGrade ?? 0,
        corporationGrade: updatedUser.corporationGrade ?? 0
      }
    }
  }

  // ==================================================
  // SECTION 05 GET PROFILE
  // ==================================================
  async getProfileById(profileId: number) {
    const profile = db.prepare(`
      SELECT id, userId, profileType, channelCode, displayName, baseCode
      FROM profiles
      WHERE id=?
    `).get(profileId)

    if (!profile) throw new BadRequestException('Profile not found')
    return profile
  }

  // ==================================================
  // SECTION 06 PROFILE SWITCH
  // ==================================================
  async switchProfile(userId: number, profileType: 'GENERAL' | 'BUSINESS') {
    const user = await this.getUserById(userId)

    const profile = db.prepare(`
      SELECT id, profileType, channelCode, displayName, baseCode
      FROM profiles
      WHERE userId=? AND profileType=?
    `).get(userId, profileType)

    if (!profile) throw new BadRequestException('profile not found')

    db.prepare(`DELETE FROM profile_sessions WHERE profileId=?`).run(profile.id)

    const now = new Date().toISOString()
    db.prepare(`
      INSERT INTO profile_sessions(userId, profileId, profileType, channelCode, status, loginAt, lastSeenAt)
      VALUES(?,?,?,?,?,?,?)
    `).run(userId, profile.id, profile.profileType, profile.channelCode, 'ACTIVE', now, now)

    const payload = { sub: userId, profileId: profile.id, profileType: profile.profileType, channelCode: profile.channelCode }

    const accessToken = this.jwtService.sign(payload)

    return {
      ok: true,
      accessToken,
      userId,
      profileId: profile.id,
      profileType: profile.profileType,
      channelCode: profile.channelCode,
      displayName: profile.displayName,
      email: user.email,
      baseCode: profile.baseCode,
      corporationGrade: user.corporationGrade,
      providerGrade: user.providerGrade ?? 0
    }
  }

  // ==================================================
  // SECTION 07 GET SESSION
  // ==================================================
  getSession(profileId: number) {
    return db.prepare(`
      SELECT *
      FROM profile_sessions
      WHERE profileId=?
    `).get(profileId)
  }

  // ==================================================
  // SECTION 08 EMERGENCY QR POSSESSION AUTH
  // ==================================================
  async generateEmergencyQr(
    input: EmergencyGenerateQrInput,
    context: EmergencyRequestContext = {}
  ) {
    const channelCode = this.normalizeEmergencyChannelCode(input.channelCode)
    const tokenType = this.normalizeEmergencyQrTokenType(input.tokenType)
    const credentials = this.ensureSecurityCredentials(channelCode)

    if (!credentials.emergencyAccessCodeHash) {
      this.insertEmergencyAccessLog({
        channelCode,
        accessType: 'GENERATE_QR_BLOCKED',
        context,
        metadata: {
          reason: 'EMERGENCY_ACCESS_CODE_NOT_CONFIGURED',
          tokenType
        }
      })
      throw new UnauthorizedException('EMERGENCY_ACCESS_CODE_NOT_CONFIGURED')
    }

    const emergencyAccessCode = String(input.emergencyAccessCode ?? '')
    const emergencyOk = await bcrypt.compare(
      emergencyAccessCode,
      credentials.emergencyAccessCodeHash
    )

    if (!emergencyOk) {
      this.insertEmergencyAccessLog({
        channelCode,
        accessType: 'GENERATE_QR_DENIED',
        context,
        metadata: {
          reason: 'INVALID_EMERGENCY_ACCESS_CODE',
          tokenType
        }
      })
      throw new UnauthorizedException('INVALID_EMERGENCY_ACCESS_CODE')
    }

    this.expireEmergencyQrTokens(channelCode)

    const tokenId = randomUUID()
    const qrToken = randomBytes(32).toString('hex')
    const qrTokenHash = this.hashEmergencyToken(qrToken, credentials.qrBaseCode)
    const now = new Date()
    const expiresAt = new Date(
      now.getTime() + EMERGENCY_QR_TOKEN_TTL_SECONDS * 1000
    ).toISOString()
    const qrPayload =
      `RAPUS://AUTH/${channelCode}/${tokenId}/${qrToken}`

    db.prepare(`
      INSERT INTO emergency_qr_tokens(
        tokenId,
        channelCode,
        qrTokenHash,
        tokenType,
        status,
        expiresAt,
        createdAt
      )
      VALUES(?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(tokenId, channelCode, qrTokenHash, tokenType, expiresAt, now.toISOString())

    this.insertEmergencyAccessLog({
      channelCode,
      accessType: 'GENERATE_QR',
      context,
      metadata: {
        tokenId,
        tokenType,
        expiresAt,
        ttlSeconds: EMERGENCY_QR_TOKEN_TTL_SECONDS
      }
    })

    return {
      success: true,
      tokenId,
      channelCode,
      tokenType,
      qrPayload,
      expiresAt,
      ttlSeconds: EMERGENCY_QR_TOKEN_TTL_SECONDS
    }
  }

  async verifyEmergencyQr(
    input: EmergencyVerifyQrInput,
    context: EmergencyRequestContext = {}
  ) {
    const parsed = this.parseEmergencyQrInput(input)
    this.expireEmergencyQrTokens(parsed.channelCode)

    const tokenRow = db.prepare(`
      SELECT
        id,
        tokenId,
        channelCode,
        qrTokenHash,
        tokenType,
        status,
        expiresAt
      FROM emergency_qr_tokens
      WHERE tokenId=?
        AND channelCode=?
      LIMIT 1
    `).get(parsed.tokenId, parsed.channelCode) as
      | {
          id: number
          tokenId: string
          channelCode: string
          qrTokenHash: string
          tokenType: EmergencyQrTokenType
          status: EmergencyQrStatus
          expiresAt: string
        }
      | undefined

    if (!tokenRow) {
      throw new UnauthorizedException('QR_TOKEN_NOT_FOUND')
    }

    if (tokenRow.status !== 'ACTIVE') {
      this.insertEmergencyAccessLog({
        channelCode: parsed.channelCode,
        accessType: 'VERIFY_QR_DENIED',
        context,
        metadata: {
          tokenId: parsed.tokenId,
          reason: `TOKEN_${tokenRow.status}`
        }
      })
      throw new UnauthorizedException('QR_TOKEN_NOT_ACTIVE')
    }

    if (new Date(tokenRow.expiresAt).getTime() <= Date.now()) {
      db.prepare(`
        UPDATE emergency_qr_tokens
        SET status='EXPIRED'
        WHERE id=?
          AND status='ACTIVE'
      `).run(tokenRow.id)

      this.insertEmergencyAccessLog({
        channelCode: parsed.channelCode,
        accessType: 'VERIFY_QR_DENIED',
        context,
        metadata: {
          tokenId: parsed.tokenId,
          reason: 'TOKEN_EXPIRED'
        }
      })
      throw new UnauthorizedException('QR_TOKEN_EXPIRED')
    }

    const credentials = this.ensureSecurityCredentials(parsed.channelCode)
    const incomingHash = this.hashEmergencyToken(parsed.qrToken, credentials.qrBaseCode)

    if (incomingHash !== tokenRow.qrTokenHash) {
      this.insertEmergencyAccessLog({
        channelCode: parsed.channelCode,
        accessType: 'VERIFY_QR_DENIED',
        context,
        metadata: {
          tokenId: parsed.tokenId,
          reason: 'TOKEN_HASH_MISMATCH'
        }
      })
      throw new UnauthorizedException('QR_TOKEN_INVALID')
    }

    const profile = this.getBusinessProfileByChannelCode(parsed.channelCode)
    const now = new Date().toISOString()

    db.prepare(`
      UPDATE emergency_qr_tokens
      SET status='USED',
          usedAt=?
      WHERE id=?
        AND status='ACTIVE'
    `).run(now, tokenRow.id)

    db.prepare(`DELETE FROM profile_sessions WHERE profileId=?`).run(profile.id)
    db.prepare(`
      INSERT INTO profile_sessions(
        userId,
        profileId,
        profileType,
        channelCode,
        status,
        loginAt,
        lastSeenAt
      )
      VALUES(?,?,?,?,?,?,?)
    `).run(
      profile.userId,
      profile.id,
      profile.profileType,
      profile.channelCode,
      'ACTIVE',
      now,
      now
    )

    const payload = {
      sub: profile.userId,
      profileId: profile.id,
      profileType: profile.profileType,
      channelCode: profile.channelCode
    }
    const accessToken = this.jwtService.sign(payload)

    this.insertEmergencyAccessLog({
      channelCode: parsed.channelCode,
      accessType: 'VERIFY_QR_SUCCESS',
      context,
      metadata: {
        tokenId: parsed.tokenId,
        tokenType: tokenRow.tokenType,
        sessionIssued: true
      }
    })

    return {
      success: true,
      accessToken,
      tokenId: parsed.tokenId,
      channelCode: profile.channelCode,
      tokenType: tokenRow.tokenType,
      usedAt: now,
      user: {
        userId: profile.userId,
        id: profile.userId,
        profileId: profile.id,
        profileType: profile.profileType,
        channelCode: profile.channelCode,
        displayName: profile.displayName,
        baseCode: profile.baseCode
      }
    }
  }

  getEmergencyQrStatus(channelCodeRaw: string) {
    const channelCode = this.normalizeEmergencyChannelCode(channelCodeRaw)
    const credentials = this.ensureSecurityCredentials(channelCode)
    this.expireEmergencyQrTokens(channelCode)

    const tokenSummary = db.prepare(`
      SELECT
        status,
        COUNT(*) AS count
      FROM emergency_qr_tokens
      WHERE channelCode=?
      GROUP BY status
    `).all(channelCode) as Array<{ status: EmergencyQrStatus; count: number }>

    const activeToken = db.prepare(`
      SELECT
        tokenId,
        tokenType,
        expiresAt,
        createdAt
      FROM emergency_qr_tokens
      WHERE channelCode=?
        AND status='ACTIVE'
      ORDER BY createdAt DESC
      LIMIT 1
    `).get(channelCode) as
      | {
          tokenId: string
          tokenType: EmergencyQrTokenType
          expiresAt: string
          createdAt: string
        }
      | undefined

    return {
      success: true,
      channelCode,
      emergencyAccessConfigured: Boolean(credentials.emergencyAccessCodeHash),
      qrBaseCodeConfigured: Boolean(credentials.qrBaseCode),
      activeToken: activeToken ?? null,
      tokenSummary: tokenSummary.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = Number(row.count)
        return acc
      }, {})
    }
  }

  private normalizeEmergencyChannelCode(channelCode: string | null | undefined): string {
    const normalized = String(channelCode ?? '').trim().toUpperCase()

    if (!normalized) {
      throw new BadRequestException('channelCode is required')
    }

    return normalized
  }

  private normalizeEmergencyQrTokenType(
    tokenType?: EmergencyQrTokenType
  ): EmergencyQrTokenType {
    if (
      tokenType === 'MASTER_ACCESS' ||
      tokenType === 'GUARDIAN_ACCESS' ||
      tokenType === 'EMERGENCY_LOGIN'
    ) {
      return tokenType
    }

    return 'EMERGENCY_LOGIN'
  }

  private ensureSecurityCredentials(channelCode: string): {
    channelCode: string
    emergencyAccessCodeHash: string | null
    qrBaseCode: string
  } {
    const existing = db.prepare(`
      SELECT
        channelCode,
        emergencyAccessCodeHash,
        qrBaseCode
      FROM user_security_credentials
      WHERE channelCode=?
      LIMIT 1
    `).get(channelCode) as
      | {
          channelCode: string
          emergencyAccessCodeHash: string | null
          qrBaseCode: string
        }
      | undefined

    if (existing) {
      return existing
    }

    const profile = this.getBusinessProfileByChannelCode(channelCode)
    const user = db.prepare(`
      SELECT passwordHash
      FROM users
      WHERE id=?
      LIMIT 1
    `).get(profile.userId) as { passwordHash: string } | undefined

    db.prepare(`
      INSERT INTO user_security_credentials(
        channelCode,
        loginPasswordHash,
        emergencyAccessCodeHash,
        qrBaseCode,
        createdAt,
        updatedAt
      )
      VALUES(?, ?, NULL, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(channelCode, user?.passwordHash ?? null, profile.baseCode)

    return {
      channelCode,
      emergencyAccessCodeHash: null,
      qrBaseCode: profile.baseCode
    }
  }

  private getBusinessProfileByChannelCode(channelCode: string) {
    const profile = db.prepare(`
      SELECT
        id,
        userId,
        profileType,
        channelCode,
        displayName,
        baseCode
      FROM profiles
      WHERE channelCode=?
        AND profileType='BUSINESS'
      LIMIT 1
    `).get(channelCode) as
      | {
          id: number
          userId: number
          profileType: 'BUSINESS'
          channelCode: string
          displayName: string | null
          baseCode: string
        }
      | undefined

    if (!profile) {
      throw new BadRequestException('BUSINESS_PROFILE_NOT_FOUND')
    }

    return profile
  }

  private parseEmergencyQrInput(input: EmergencyVerifyQrInput): {
    channelCode: string
    tokenId: string
    qrToken: string
  } {
    if (input.qrPayload) {
      const parts = String(input.qrPayload).trim().split('/')
      const tokenId = parts[4]
      const qrToken = parts[5]
      const channelCode = this.normalizeEmergencyChannelCode(parts[3])

      if (!tokenId || !qrToken) {
        throw new BadRequestException('INVALID_QR_PAYLOAD')
      }

      return {
        channelCode,
        tokenId,
        qrToken
      }
    }

    const channelCode = this.normalizeEmergencyChannelCode(input.channelCode)
    const tokenId = String(input.tokenId ?? '').trim()
    const qrToken = String(input.qrToken ?? '').trim()

    if (!tokenId || !qrToken) {
      throw new BadRequestException('tokenId and qrToken are required')
    }

    return {
      channelCode,
      tokenId,
      qrToken
    }
  }

  private hashEmergencyToken(token: string, qrBaseCode: string): string {
    return createHash('sha256')
      .update(`${qrBaseCode}:${token}`)
      .digest('hex')
  }

  private expireEmergencyQrTokens(channelCode: string): void {
    db.prepare(`
      UPDATE emergency_qr_tokens
      SET status='EXPIRED'
      WHERE channelCode=?
        AND status='ACTIVE'
        AND expiresAt <= ?
    `).run(channelCode, new Date().toISOString())
  }

  private insertEmergencyAccessLog(params: {
    channelCode: string
    accessType: string
    context: EmergencyRequestContext
    metadata?: Record<string, unknown>
  }): void {
    db.prepare(`
      INSERT INTO emergency_access_logs(
        logId,
        actorChannelCode,
        accessType,
        ipAddress,
        userAgent,
        metadata,
        createdAt
      )
      VALUES(?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      randomUUID(),
      params.channelCode,
      params.accessType,
      params.context.ipAddress ?? null,
      params.context.userAgent ?? null,
      JSON.stringify(params.metadata ?? {})
    )
  }
}



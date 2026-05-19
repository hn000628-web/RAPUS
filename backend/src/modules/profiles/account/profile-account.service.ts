// FILE : backend/src/modules/profile/account/profile-account.service.ts
// ROOT : backend/src/modules/profile/account/profile-account.service.ts
// STATUS : CREATE MODE
// ROLE : PROFILE ACCOUNT API SERVICE
// CHANGE SUMMARY :
// - /api/profile/account 전용 Service 신규 생성
// - users / profiles 기반 개인정보 조회 및 수정 로직 추가
// - 기본주소 profiles.detailAddress 수정
// - 기본연락처 profiles.contactPhone 수정
// - 생년월일 users.birthDate 수정
// - 1차 비밀번호 users.passwordHash bcrypt hash 처리
// - 2차 비밀번호 profiles.paymentPasswordHash bcrypt hash 처리
// - Service 단일 DB 접근 구조

// SECTION 01 : IMPORT

import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'

import * as bcrypt from 'bcrypt'

import db from '../../../config/database'

// SECTION 02 : TYPE

type ProfileType =
  | 'GENERAL'
  | 'BUSINESS'

type PasswordStatus =
  | 'SET'
  | 'NOT_SET'

export type GetProfileAccountRequest = {
  profileId: number | string
  channelCode: string
}

export type UpdateProfileAccountBasicRequest = {
  profileId: number | string
  channelCode: string
  detailAddress?: string | null
  contactPhone?: string | null
}

export type UpdateBirthDateRequest = {
  profileId: number | string
  channelCode: string
  birthDate: string | null
}

export type UpdatePrimaryPasswordRequest = {
  profileId: number | string
  channelCode: string
  newPassword: string
  confirmPassword: string
}

export type UpdatePaymentPasswordRequest = {
  profileId: number | string
  channelCode: string
  paymentPassword: string
  confirmPaymentPassword: string
}

export type VerifyAdultForDevRequest = {
  profileId: number | string
  channelCode: string
}

export type GetDeliverySettingsRequest = {
  profileId: number | string
  channelCode: string
}

export type UpdateDeliverySettingsRequest = {
  profileId: number | string
  channelCode: string
  deliveryAddress?: string | null
  deliveryDetailAddress?: string | null
  entrancePassword?: string | null
  deliveryMemo?: string | null
}

export type ListDeliveryAddressesRequest = {
  profileId: number | string
  channelCode: string
}

export type DeliveryAddressPayload = {
  profileId: number | string
  channelCode: string
  label: string
  recipientName?: string | null
  recipientPhone?: string | null
  deliveryAddress: string
  deliveryDetailAddress?: string | null
  entrancePassword?: string | null
  deliveryMemo?: string | null
  isDefault?: boolean | number
}

export type UpdateDeliveryAddressPayload = {
  profileId: number | string
  channelCode: string
  label?: string
  recipientName?: string | null
  recipientPhone?: string | null
  deliveryAddress?: string
  deliveryDetailAddress?: string | null
  entrancePassword?: string | null
  deliveryMemo?: string | null
  isDefault?: boolean | number
}

export type DeliveryAddressIdentityRequest = {
  profileId: number | string
  channelCode: string
  addressId: number | string
}

type ProfileAccountContext = {
  profileId: number
  userId: number
  profileType: ProfileType
  channelCode: string
}

type ProfileAccountResponse = {
  profileId: number
  channelCode: string
  profileType: ProfileType
  detailAddress: string | null
  contactPhone: string | null
  birthDate: string | null
  adultVerificationStatus: string
  primaryPasswordStatus: PasswordStatus
  paymentPasswordStatus: PasswordStatus
  paymentPasswordLockedUntil: string | null
}

type DeliverySettingsResponse = {
  profileId: number
  channelCode: string
  deliveryAddress: string | null
  deliveryDetailAddress: string | null
  hasEntrancePassword: boolean
  deliveryMemo: string | null
  isRegistered: boolean
}

type DeliveryAddressItem = {
  id: number
  profileId: number
  channelCode: string
  label: string
  recipientName: string | null
  recipientPhone: string | null
  deliveryAddress: string
  deliveryDetailAddress: string | null
  entrancePassword: string | null
  deliveryMemo: string | null
  isDefault: 0 | 1
  sortOrder: number
  isActive: 0 | 1
  createdAt: string | null
  updatedAt: string | null
}

type DeliveryAddressListResponse = {
  addresses: Array<{
    id: number
    label: string
    recipientName: string | null
    recipientPhone: string | null
    deliveryAddress: string
    deliveryDetailAddress: string | null
    hasEntrancePassword: boolean
    deliveryMemo: string | null
    isDefault: 0 | 1
    sortOrder: number
    isActive: 0 | 1
  }>
  totalCount: number
  defaultAddressId: number | null
  isRegistered: boolean
}

type ProfileAccountRow = {
  profileId: number
  channelCode: string
  profileType: ProfileType
  detailAddress: string | null
  contactPhone: string | null
  paymentPasswordHash: string | null
  paymentPasswordLockedUntil: string | null
  birthDate: string | null
  adultVerificationStatus: string | null
  passwordHash: string | null
}

type ProfileContextRow = {
  profileId: number
  userId: number
  profileType: ProfileType
  channelCode: string
}

type ProfileBasicRow = {
  detailAddress: string | null
  contactPhone: string | null
}

type UserBirthDateRow = {
  birthDate: string | null
}

type AdultVerificationRow = {
  birthDate: string
  adultVerifiedAt: string
}

type DeliverySettingsRow = {
  profileId: number
  channelCode: string
  deliveryAddress: string | null
  deliveryDetailAddress: string | null
  entrancePassword: string | null
  deliveryMemo: string | null
  isActive: number
}

export type VerifyAdultForDevResponse = {
  profileId: number
  channelCode: string
  birthDate: string
  adultVerificationStatus: 'VERIFIED'
  adultVerifiedAt: string
  adultVerificationProvider: 'DEV_TEMP'
  adultVerificationExpiresAt: null
}

// SECTION 03 : SERVICE

@Injectable()
export class ProfileAccountService {
  // SECTION 04 : READ ACCOUNT

  async getProfileAccount(
    input: GetProfileAccountRequest
  ): Promise<ProfileAccountResponse> {
    const profileId =
      this.normalizeProfileId(input.profileId)

    const channelCode =
      this.normalizeChannelCode(input.channelCode)

    const row =
      db.prepare(`
        SELECT
          p.id AS profileId,
          p.channelCode AS channelCode,
          p.profileType AS profileType,
          p.detailAddress AS detailAddress,
          p.contactPhone AS contactPhone,
          p.paymentPasswordHash AS paymentPasswordHash,
          p.paymentPasswordLockedUntil AS paymentPasswordLockedUntil,
          u.birthDate AS birthDate,
          u.adultVerificationStatus AS adultVerificationStatus,
          u.passwordHash AS passwordHash
        FROM profiles p
        JOIN users u ON u.id = p.userId
        WHERE p.id = ?
          AND p.channelCode = ?
        LIMIT 1
      `).get(
        profileId,
        channelCode
      ) as ProfileAccountRow | undefined

    if (!row) {
      throw new NotFoundException(
        'PROFILE_ACCOUNT_NOT_FOUND'
      )
    }

    return {
      profileId: row.profileId,
      channelCode: row.channelCode,
      profileType: row.profileType,
      detailAddress: row.detailAddress,
      contactPhone: row.contactPhone,
      birthDate: row.birthDate,
      adultVerificationStatus:
        row.adultVerificationStatus ?? 'UNVERIFIED',
      primaryPasswordStatus:
        this.buildPasswordStatus(row.passwordHash),
      paymentPasswordStatus:
        this.buildPasswordStatus(row.paymentPasswordHash),
      paymentPasswordLockedUntil:
        row.paymentPasswordLockedUntil
    }
  }

  // SECTION 04-1 : READ DELIVERY SETTINGS

  async getMyDeliverySettings(
    input: GetDeliverySettingsRequest
  ): Promise<DeliverySettingsResponse> {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const row =
      db.prepare(`
        SELECT
          profileId AS profileId,
          channelCode AS channelCode,
          deliveryAddress AS deliveryAddress,
          deliveryDetailAddress AS deliveryDetailAddress,
          entrancePassword AS entrancePassword,
          deliveryMemo AS deliveryMemo,
          isActive AS isActive
        FROM profile_delivery_settings
        WHERE profileId = ?
          AND channelCode = ?
        LIMIT 1
      `).get(
        context.profileId,
        context.channelCode
      ) as DeliverySettingsRow | undefined

    return this.buildDeliverySettingsResponse({
      profileId: context.profileId,
      channelCode: context.channelCode,
      row
    })
  }

  // SECTION 04-2 : LIST DELIVERY ADDRESSES

  async listMyDeliveryAddresses(
    input: ListDeliveryAddressesRequest
  ): Promise<DeliveryAddressListResponse> {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const rows =
      db.prepare(`
        SELECT
          id,
          profileId,
          channelCode,
          label,
          recipientName,
          recipientPhone,
          deliveryAddress,
          deliveryDetailAddress,
          entrancePassword,
          deliveryMemo,
          isDefault,
          sortOrder,
          isActive,
          createdAt,
          updatedAt
        FROM profile_delivery_addresses
        WHERE profileId = ?
          AND channelCode = ?
          AND isActive = 1
        ORDER BY isDefault DESC, sortOrder ASC, id ASC
      `).all(
        context.profileId,
        context.channelCode
      ) as DeliveryAddressItem[]

    return this.buildDeliveryAddressListResponse(rows)
  }

  // SECTION 05 : UPDATE BASIC INFO

  async updateProfileAccountBasic(
    input: UpdateProfileAccountBasicRequest
  ) {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const current =
      this.getProfileBasicRow(context)

    const nextDetailAddress =
      input.detailAddress === undefined
        ? current.detailAddress
        : this.normalizeNullableText(input.detailAddress)

    const nextContactPhone =
      input.contactPhone === undefined
        ? current.contactPhone
        : this.normalizeNullableText(input.contactPhone)

    const updateResult =
      db.prepare(`
        UPDATE profiles
        SET
          detailAddress = ?,
          contactPhone = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND channelCode = ?
      `).run(
        nextDetailAddress,
        nextContactPhone,
        context.profileId,
        context.channelCode
      )

    if (updateResult.changes < 1) {
      throw new NotFoundException(
        'PROFILE_ACCOUNT_BASIC_UPDATE_FAILED'
      )
    }

    return {
      profileId: context.profileId,
      channelCode: context.channelCode,
      detailAddress: nextDetailAddress,
      contactPhone: nextContactPhone
    }
  }

  // SECTION 06 : UPDATE BIRTH DATE

  async updateProfileAccountBirthDate(
    input: UpdateBirthDateRequest
  ) {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const birthDate =
      this.normalizeBirthDate(input.birthDate)

    const updateResult =
      db.prepare(`
        UPDATE users
        SET birthDate = ?
        WHERE id = ?
      `).run(
        birthDate,
        context.userId
      )

    if (updateResult.changes < 1) {
      throw new NotFoundException(
        'PROFILE_ACCOUNT_BIRTH_DATE_UPDATE_FAILED'
      )
    }

    return {
      profileId: context.profileId,
      channelCode: context.channelCode,
      birthDate
    }
  }

  // SECTION 07 : UPDATE PRIMARY PASSWORD

  async updatePrimaryPassword(
    input: UpdatePrimaryPasswordRequest
  ) {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const newPassword =
      this.normalizeRequiredText(
        input.newPassword,
        'NEW_PASSWORD_REQUIRED'
      )

    const confirmPassword =
      this.normalizeRequiredText(
        input.confirmPassword,
        'CONFIRM_PASSWORD_REQUIRED'
      )

    this.validatePasswordPair(
      newPassword,
      confirmPassword
    )

    const passwordHash =
      await this.hashPassword(newPassword)

    const updateResult =
      db.prepare(`
        UPDATE users
        SET passwordHash = ?
        WHERE id = ?
      `).run(
        passwordHash,
        context.userId
      )

    if (updateResult.changes < 1) {
      throw new NotFoundException(
        'PRIMARY_PASSWORD_UPDATE_FAILED'
      )
    }

    return {
      profileId: context.profileId,
      channelCode: context.channelCode,
      primaryPasswordStatus: 'SET' as const
    }
  }

  // SECTION 08 : UPDATE PAYMENT PASSWORD

  async updatePaymentPassword(
    input: UpdatePaymentPasswordRequest
  ) {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const paymentPassword =
      this.normalizeRequiredText(
        input.paymentPassword,
        'PAYMENT_PASSWORD_REQUIRED'
      )

    const confirmPaymentPassword =
      this.normalizeRequiredText(
        input.confirmPaymentPassword,
        'CONFIRM_PAYMENT_PASSWORD_REQUIRED'
      )

    this.validatePaymentPasswordPair(
      paymentPassword,
      confirmPaymentPassword
    )

    const paymentPasswordHash =
      await this.hashPassword(paymentPassword)

    const updateResult =
      db.prepare(`
        UPDATE profiles
        SET
          paymentPasswordHash = ?,
          paymentPasswordSetAt = COALESCE(
            paymentPasswordSetAt,
            CURRENT_TIMESTAMP
          ),
          paymentPasswordUpdatedAt = CURRENT_TIMESTAMP,
          paymentPasswordFailCount = 0,
          paymentPasswordLockedUntil = NULL,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND channelCode = ?
      `).run(
        paymentPasswordHash,
        context.profileId,
        context.channelCode
      )

    if (updateResult.changes < 1) {
      throw new NotFoundException(
        'PAYMENT_PASSWORD_UPDATE_FAILED'
      )
    }

    return {
      profileId: context.profileId,
      channelCode: context.channelCode,
      paymentPasswordStatus: 'SET' as const,
      paymentPasswordLockedUntil: null
    }
  }

  // SECTION 08-1 : UPDATE DELIVERY SETTINGS

  async updateMyDeliverySettings(
    input: UpdateDeliverySettingsRequest
  ): Promise<DeliverySettingsResponse> {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const current =
      db.prepare(`
        SELECT
          profileId AS profileId,
          channelCode AS channelCode,
          deliveryAddress AS deliveryAddress,
          deliveryDetailAddress AS deliveryDetailAddress,
          entrancePassword AS entrancePassword,
          deliveryMemo AS deliveryMemo,
          isActive AS isActive
        FROM profile_delivery_settings
        WHERE profileId = ?
          AND channelCode = ?
        LIMIT 1
      `).get(
        context.profileId,
        context.channelCode
      ) as DeliverySettingsRow | undefined

    const nextDeliveryAddress =
      input.deliveryAddress === undefined
        ? current?.deliveryAddress ?? null
        : this.normalizeNullableText(input.deliveryAddress)

    const nextDeliveryDetailAddress =
      input.deliveryDetailAddress === undefined
        ? current?.deliveryDetailAddress ?? null
        : this.normalizeNullableText(input.deliveryDetailAddress)

    const nextEntrancePassword =
      input.entrancePassword === undefined
        ? current?.entrancePassword ?? null
        : this.normalizeNullableText(input.entrancePassword)

    const nextDeliveryMemo =
      input.deliveryMemo === undefined
        ? current?.deliveryMemo ?? null
        : this.normalizeNullableText(input.deliveryMemo)

    if (current) {
      db.prepare(`
        UPDATE profile_delivery_settings
        SET
          deliveryAddress = ?,
          deliveryDetailAddress = ?,
          entrancePassword = ?,
          deliveryMemo = ?,
          isActive = 1,
          updatedAt = CURRENT_TIMESTAMP
        WHERE profileId = ?
          AND channelCode = ?
      `).run(
        nextDeliveryAddress,
        nextDeliveryDetailAddress,
        nextEntrancePassword,
        nextDeliveryMemo,
        context.profileId,
        context.channelCode
      )
    } else {
      db.prepare(`
        INSERT INTO profile_delivery_settings(
          profileId,
          channelCode,
          deliveryAddress,
          deliveryDetailAddress,
          entrancePassword,
          deliveryMemo,
          isActive
        ) VALUES(?,?,?,?,?,?,1)
      `).run(
        context.profileId,
        context.channelCode,
        nextDeliveryAddress,
        nextDeliveryDetailAddress,
        nextEntrancePassword,
        nextDeliveryMemo
      )
    }

    const refreshed =
      db.prepare(`
        SELECT
          profileId AS profileId,
          channelCode AS channelCode,
          deliveryAddress AS deliveryAddress,
          deliveryDetailAddress AS deliveryDetailAddress,
          entrancePassword AS entrancePassword,
          deliveryMemo AS deliveryMemo,
          isActive AS isActive
        FROM profile_delivery_settings
        WHERE profileId = ?
          AND channelCode = ?
        LIMIT 1
      `).get(
        context.profileId,
        context.channelCode
      ) as DeliverySettingsRow | undefined

    return this.buildDeliverySettingsResponse({
      profileId: context.profileId,
      channelCode: context.channelCode,
      row: refreshed
    })
  }

  // SECTION 08-2 : CREATE DELIVERY ADDRESS

  async createMyDeliveryAddress(
    input: DeliveryAddressPayload
  ): Promise<DeliveryAddressListResponse> {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const label =
      this.normalizeRequiredText(input.label, 'DELIVERY_LABEL_REQUIRED')

    const deliveryAddress =
      this.normalizeRequiredText(input.deliveryAddress, 'DELIVERY_ADDRESS_REQUIRED')

    const recipientName =
      this.normalizeNullableText(input.recipientName)
    const recipientPhone =
      this.normalizeNullableText(input.recipientPhone)
    const deliveryDetailAddress =
      this.normalizeNullableText(input.deliveryDetailAddress)
    const entrancePassword =
      this.normalizeNullableText(input.entrancePassword)
    const deliveryMemo =
      this.normalizeNullableText(input.deliveryMemo)

    const activeCountRow =
      db.prepare(`
        SELECT COUNT(*) AS count
        FROM profile_delivery_addresses
        WHERE profileId = ?
          AND channelCode = ?
          AND isActive = 1
      `).get(
        context.profileId,
        context.channelCode
      ) as { count: number } | undefined

    const activeCount = Number(activeCountRow?.count ?? 0)

    const nextIsDefault =
      activeCount === 0
        ? 1
        : this.normalizeFlag(input.isDefault, 0)

    if (nextIsDefault === 1) {
      db.prepare(`
        UPDATE profile_delivery_addresses
        SET
          isDefault = 0,
          updatedAt = CURRENT_TIMESTAMP
        WHERE profileId = ?
          AND channelCode = ?
          AND isActive = 1
      `).run(
        context.profileId,
        context.channelCode
      )
    }

    const sortOrderRow =
      db.prepare(`
        SELECT COALESCE(MAX(sortOrder), -1) AS maxSortOrder
        FROM profile_delivery_addresses
        WHERE profileId = ?
          AND channelCode = ?
      `).get(
        context.profileId,
        context.channelCode
      ) as { maxSortOrder: number } | undefined

    const nextSortOrder =
      Number(sortOrderRow?.maxSortOrder ?? -1) + 1

    db.prepare(`
      INSERT INTO profile_delivery_addresses(
        profileId,
        channelCode,
        label,
        recipientName,
        recipientPhone,
        deliveryAddress,
        deliveryDetailAddress,
        entrancePassword,
        deliveryMemo,
        isDefault,
        sortOrder,
        isActive
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,1)
    `).run(
      context.profileId,
      context.channelCode,
      label,
      recipientName,
      recipientPhone,
      deliveryAddress,
      deliveryDetailAddress,
      entrancePassword,
      deliveryMemo,
      nextIsDefault,
      nextSortOrder
    )

    return this.listMyDeliveryAddresses({
      profileId: context.profileId,
      channelCode: context.channelCode
    })
  }

  // SECTION 08-3 : UPDATE DELIVERY ADDRESS

  async updateMyDeliveryAddress(
    input: UpdateDeliveryAddressPayload & { addressId: number | string }
  ): Promise<DeliveryAddressListResponse> {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const addressId =
      this.normalizeProfileId(input.addressId)

    const current = this.getActiveDeliveryAddressOrThrow(
      context.profileId,
      context.channelCode,
      addressId
    )

    const nextLabel =
      input.label === undefined
        ? current.label
        : this.normalizeRequiredText(input.label, 'DELIVERY_LABEL_REQUIRED')

    const nextDeliveryAddress =
      input.deliveryAddress === undefined
        ? current.deliveryAddress
        : this.normalizeRequiredText(input.deliveryAddress, 'DELIVERY_ADDRESS_REQUIRED')

    const nextRecipientName =
      input.recipientName === undefined
        ? current.recipientName
        : this.normalizeNullableText(input.recipientName)

    const nextRecipientPhone =
      input.recipientPhone === undefined
        ? current.recipientPhone
        : this.normalizeNullableText(input.recipientPhone)

    const nextDeliveryDetailAddress =
      input.deliveryDetailAddress === undefined
        ? current.deliveryDetailAddress
        : this.normalizeNullableText(input.deliveryDetailAddress)

    const nextDeliveryMemo =
      input.deliveryMemo === undefined
        ? current.deliveryMemo
        : this.normalizeNullableText(input.deliveryMemo)

    const nextEntrancePassword =
      input.entrancePassword === undefined
        ? current.entrancePassword
        : this.normalizeNullableText(input.entrancePassword)

    const nextIsDefault =
      input.isDefault === undefined
        ? current.isDefault
        : this.normalizeFlag(input.isDefault, current.isDefault)

    if (nextIsDefault === 1) {
      db.prepare(`
        UPDATE profile_delivery_addresses
        SET
          isDefault = 0,
          updatedAt = CURRENT_TIMESTAMP
        WHERE profileId = ?
          AND channelCode = ?
          AND isActive = 1
      `).run(
        context.profileId,
        context.channelCode
      )
    }

    db.prepare(`
      UPDATE profile_delivery_addresses
      SET
        label = ?,
        recipientName = ?,
        recipientPhone = ?,
        deliveryAddress = ?,
        deliveryDetailAddress = ?,
        entrancePassword = ?,
        deliveryMemo = ?,
        isDefault = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND isActive = 1
    `).run(
      nextLabel,
      nextRecipientName,
      nextRecipientPhone,
      nextDeliveryAddress,
      nextDeliveryDetailAddress,
      nextEntrancePassword,
      nextDeliveryMemo,
      nextIsDefault,
      addressId,
      context.profileId,
      context.channelCode
    )

    return this.listMyDeliveryAddresses({
      profileId: context.profileId,
      channelCode: context.channelCode
    })
  }

  // SECTION 08-4 : DELETE DELIVERY ADDRESS (SOFT)

  async deleteMyDeliveryAddress(
    input: DeliveryAddressIdentityRequest
  ): Promise<DeliveryAddressListResponse> {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const addressId =
      this.normalizeProfileId(input.addressId)

    const current = this.getActiveDeliveryAddressOrThrow(
      context.profileId,
      context.channelCode,
      addressId
    )

    db.prepare(`
      UPDATE profile_delivery_addresses
      SET
        isActive = 0,
        isDefault = 0,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND isActive = 1
    `).run(
      addressId,
      context.profileId,
      context.channelCode
    )

    if (current.isDefault === 1) {
      const nextDefault =
        db.prepare(`
          SELECT id
          FROM profile_delivery_addresses
          WHERE profileId = ?
            AND channelCode = ?
            AND isActive = 1
          ORDER BY sortOrder ASC, id ASC
          LIMIT 1
        `).get(
          context.profileId,
          context.channelCode
        ) as { id: number } | undefined

      if (nextDefault?.id) {
        db.prepare(`
          UPDATE profile_delivery_addresses
          SET
            isDefault = 1,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
            AND profileId = ?
            AND channelCode = ?
            AND isActive = 1
        `).run(
          nextDefault.id,
          context.profileId,
          context.channelCode
        )
      }
    }

    return this.listMyDeliveryAddresses({
      profileId: context.profileId,
      channelCode: context.channelCode
    })
  }

  // SECTION 08-5 : SET DEFAULT DELIVERY ADDRESS

  async setDefaultDeliveryAddress(
    input: DeliveryAddressIdentityRequest
  ): Promise<DeliveryAddressListResponse> {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const addressId =
      this.normalizeProfileId(input.addressId)

    this.getActiveDeliveryAddressOrThrow(
      context.profileId,
      context.channelCode,
      addressId
    )

    db.prepare(`
      UPDATE profile_delivery_addresses
      SET
        isDefault = 0,
        updatedAt = CURRENT_TIMESTAMP
      WHERE profileId = ?
        AND channelCode = ?
        AND isActive = 1
    `).run(
      context.profileId,
      context.channelCode
    )

    db.prepare(`
      UPDATE profile_delivery_addresses
      SET
        isDefault = 1,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND profileId = ?
        AND channelCode = ?
        AND isActive = 1
    `).run(
      addressId,
      context.profileId,
      context.channelCode
    )

    return this.listMyDeliveryAddresses({
      profileId: context.profileId,
      channelCode: context.channelCode
    })
  }

  // SECTION 09 : VERIFY ADULT FOR DEV

  verifyAdultForDev(
    input: VerifyAdultForDevRequest
  ): VerifyAdultForDevResponse {
    const context =
      this.resolveProfileContext({
        profileId: input.profileId,
        channelCode: input.channelCode
      })

    const birthDateRow =
      db.prepare(`
        SELECT
          birthDate
        FROM users
        WHERE id = ?
        LIMIT 1
      `).get(
        context.userId
      ) as UserBirthDateRow | undefined

    if (!birthDateRow || !birthDateRow.birthDate) {
      throw new BadRequestException(
        'BIRTH_DATE_REQUIRED'
      )
    }

    const birthDate =
      this.normalizeBirthDate(birthDateRow.birthDate)

    if (!birthDate) {
      throw new BadRequestException(
        'BIRTH_DATE_REQUIRED'
      )
    }

    if (!this.isAdultByBirthDate(birthDate)) {
      throw new BadRequestException(
        'ADULT_VERIFICATION_UNDER_AGE'
      )
    }

    const updateResult =
      db.prepare(`
        UPDATE users
        SET
          adultVerificationStatus = 'VERIFIED',
          adultVerifiedAt = CURRENT_TIMESTAMP,
          adultVerificationProvider = 'DEV_TEMP',
          adultVerificationExpiresAt = NULL
        WHERE id = ?
      `).run(
        context.userId
      )

    if (updateResult.changes < 1) {
      throw new NotFoundException(
        'ADULT_VERIFICATION_DEV_UPDATE_FAILED'
      )
    }

    const verificationRow =
      db.prepare(`
        SELECT
          birthDate AS birthDate,
          adultVerifiedAt AS adultVerifiedAt
        FROM users
        WHERE id = ?
        LIMIT 1
      `).get(
        context.userId
      ) as AdultVerificationRow | undefined

    if (
      !verificationRow
      || !verificationRow.birthDate
      || !verificationRow.adultVerifiedAt
    ) {
      throw new NotFoundException(
        'ADULT_VERIFICATION_DEV_RESULT_NOT_FOUND'
      )
    }

    return {
      profileId: context.profileId,
      channelCode: context.channelCode,
      birthDate: verificationRow.birthDate,
      adultVerificationStatus: 'VERIFIED',
      adultVerifiedAt: verificationRow.adultVerifiedAt,
      adultVerificationProvider: 'DEV_TEMP',
      adultVerificationExpiresAt: null
    }
  }

  // SECTION 10 : CONTEXT HELPER

  private resolveProfileContext(
    input: GetProfileAccountRequest
  ): ProfileAccountContext {
    const profileId =
      this.normalizeProfileId(input.profileId)

    const channelCode =
      this.normalizeChannelCode(input.channelCode)

    const row =
      db.prepare(`
        SELECT
          id AS profileId,
          userId AS userId,
          profileType AS profileType,
          channelCode AS channelCode
        FROM profiles
        WHERE id = ?
          AND channelCode = ?
        LIMIT 1
      `).get(
        profileId,
        channelCode
      ) as ProfileContextRow | undefined

    if (!row) {
      throw new NotFoundException(
        'PROFILE_CONTEXT_NOT_FOUND'
      )
    }

    return {
      profileId: row.profileId,
      userId: row.userId,
      profileType: row.profileType,
      channelCode: row.channelCode
    }
  }

  private getProfileBasicRow(
    context: ProfileAccountContext
  ): ProfileBasicRow {
    const row =
      db.prepare(`
        SELECT
          detailAddress AS detailAddress,
          contactPhone AS contactPhone
        FROM profiles
        WHERE id = ?
          AND channelCode = ?
        LIMIT 1
      `).get(
        context.profileId,
        context.channelCode
      ) as ProfileBasicRow | undefined

    if (!row) {
      throw new NotFoundException(
        'PROFILE_BASIC_NOT_FOUND'
      )
    }

    return row
  }

  // SECTION 11 : VALIDATION HELPER

  private normalizeProfileId(
    value: number | string
  ): number {
    const profileId =
      typeof value === 'number'
        ? value
        : Number(value)

    if (!Number.isInteger(profileId) || profileId <= 0) {
      throw new BadRequestException(
        'INVALID_PROFILE_ID'
      )
    }

    return profileId
  }

  private normalizeChannelCode(
    value: string
  ): string {
    const channelCode =
      this.normalizeRequiredText(
        value,
        'CHANNEL_CODE_REQUIRED'
      )

    if (channelCode.length !== 13) {
      throw new BadRequestException(
        'INVALID_CHANNEL_CODE'
      )
    }

    return channelCode
  }

  private normalizeRequiredText(
    value: string,
    errorCode: string
  ): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(errorCode)
    }

    const trimmedValue =
      value.trim()

    if (!trimmedValue) {
      throw new BadRequestException(errorCode)
    }

    return trimmedValue
  }

  private normalizeNullableText(
    value: string | null | undefined
  ): string | null {
    if (value === null || value === undefined) {
      return null
    }

    const trimmedValue =
      value.trim()

    return trimmedValue || null
  }

  private normalizeBirthDate(
    value: string | null
  ): string | null {
    if (value === null) {
      return null
    }

    const birthDate =
      this.normalizeRequiredText(
        value,
        'BIRTH_DATE_REQUIRED'
      )

    const isValidFormat =
      /^\d{4}-\d{2}-\d{2}$/.test(birthDate)

    if (!isValidFormat) {
      throw new BadRequestException(
        'INVALID_BIRTH_DATE_FORMAT'
      )
    }

    return birthDate
  }

  private isAdultByBirthDate(
    birthDate: string
  ): boolean {
    const [
      yearText,
      monthText,
      dayText
    ] = birthDate.split('-')

    const birthYear = Number(yearText)
    const birthMonth = Number(monthText)
    const birthDay = Number(dayText)

    const today = new Date()
    let age =
      today.getFullYear() - birthYear

    const isBeforeBirthday =
      today.getMonth() + 1 < birthMonth
      || (
        today.getMonth() + 1 === birthMonth
        && today.getDate() < birthDay
      )

    if (isBeforeBirthday) {
      age -= 1
    }

    return age >= 19
  }

  private validatePasswordPair(
    password: string,
    confirmPassword: string
  ) {
    if (password !== confirmPassword) {
      throw new BadRequestException(
        'PASSWORD_CONFIRM_MISMATCH'
      )
    }

    if (password.length < 4) {
      throw new BadRequestException(
        'PASSWORD_TOO_SHORT'
      )
    }
  }

  private validatePaymentPasswordPair(
    paymentPassword: string,
    confirmPaymentPassword: string
  ) {
    if (paymentPassword !== confirmPaymentPassword) {
      throw new BadRequestException(
        'PAYMENT_PASSWORD_CONFIRM_MISMATCH'
      )
    }

    const isSixDigitNumber =
      /^\d{6}$/.test(paymentPassword)

    if (!isSixDigitNumber) {
      throw new BadRequestException(
        'PAYMENT_PASSWORD_MUST_BE_6_DIGITS'
      )
    }
  }

  private normalizeFlag(
    value: boolean | number | undefined,
    fallback: 0 | 1
  ): 0 | 1 {
    if (value === undefined) {
      return fallback
    }

    if (value === true || value === 1) {
      return 1
    }

    if (value === false || value === 0) {
      return 0
    }

    return fallback
  }

  private getActiveDeliveryAddressOrThrow(
    profileId: number,
    channelCode: string,
    addressId: number
  ): DeliveryAddressItem {
    const row =
      db.prepare(`
        SELECT
          id,
          profileId,
          channelCode,
          label,
          recipientName,
          recipientPhone,
          deliveryAddress,
          deliveryDetailAddress,
          entrancePassword,
          deliveryMemo,
          isDefault,
          sortOrder,
          isActive,
          createdAt,
          updatedAt
        FROM profile_delivery_addresses
        WHERE id = ?
          AND profileId = ?
          AND channelCode = ?
          AND isActive = 1
        LIMIT 1
      `).get(
        addressId,
        profileId,
        channelCode
      ) as DeliveryAddressItem | undefined

    if (!row) {
      throw new NotFoundException('DELIVERY_ADDRESS_NOT_FOUND')
    }

    return row
  }

  // SECTION 12 : STATUS / SECURITY HELPER

  private buildPasswordStatus(
    hash: string | null
  ): PasswordStatus {
    return hash
      ? 'SET'
      : 'NOT_SET'
  }

  private buildDeliverySettingsResponse(input: {
    profileId: number
    channelCode: string
    row?: DeliverySettingsRow
  }): DeliverySettingsResponse {
    const deliveryAddress =
      input.row?.deliveryAddress ?? null

    const deliveryDetailAddress =
      input.row?.deliveryDetailAddress ?? null

    const entrancePassword =
      input.row?.entrancePassword ?? null

    const deliveryMemo =
      input.row?.deliveryMemo ?? null

    const isRegistered =
      Boolean(deliveryAddress)
      || Boolean(deliveryDetailAddress)
      || Boolean(entrancePassword)
      || Boolean(deliveryMemo)

    return {
      profileId: input.profileId,
      channelCode: input.channelCode,
      deliveryAddress,
      deliveryDetailAddress,
      hasEntrancePassword: Boolean(entrancePassword),
      deliveryMemo,
      isRegistered
    }
  }

  private buildDeliveryAddressListResponse(
    rows: DeliveryAddressItem[]
  ): DeliveryAddressListResponse {
    const addresses =
      rows.map((row) => ({
        id: row.id,
        label: row.label,
        recipientName: row.recipientName,
        recipientPhone: row.recipientPhone,
        deliveryAddress: row.deliveryAddress,
        deliveryDetailAddress: row.deliveryDetailAddress,
        hasEntrancePassword: Boolean(row.entrancePassword),
        deliveryMemo: row.deliveryMemo,
        isDefault: row.isDefault,
        sortOrder: row.sortOrder,
        isActive: row.isActive
      }))

    const defaultAddressId =
      rows.find((row) => row.isDefault === 1)?.id ?? null

    return {
      addresses,
      totalCount: addresses.length,
      defaultAddressId,
      isRegistered: addresses.length > 0
    }
  }

  private async hashPassword(
    value: string
  ): Promise<string> {
    return bcrypt.hash(
      value,
      10
    )
  }
}

// FILE : backend/src/modules/profile/account/profile-account.controller.ts
// ROOT : backend/src/modules/profile/account/profile-account.controller.ts
// STATUS : CREATE MODE
// ROLE : PROFILE ACCOUNT API CONTROLLER
// CHANGE SUMMARY :
// - /api/profile/account 전용 Controller 신규 생성
// - 개인정보 조회 / 기본정보 수정 / 생년월일 수정 / 1차 비밀번호 변경 / 2차 비밀번호 설정 API 추가
// - Controller는 Service 호출만 수행
// - DB 직접 접근 없음
// - bcrypt 직접 접근 없음

// SECTION 01 : IMPORT

import {
  Body,
  Controller,
  Get,
  Patch,
  Query
} from '@nestjs/common'

import {
  ProfileAccountService,
  VerifyAdultForDevRequest,
  UpdateBirthDateRequest,
  UpdatePaymentPasswordRequest,
  UpdatePrimaryPasswordRequest,
  UpdateProfileAccountBasicRequest
} from './profile-account.service'

// SECTION 02 : CONTROLLER

@Controller('profile/account')
export class ProfileAccountController {
  constructor(
    private readonly profileAccountService: ProfileAccountService
  ) {}

  // SECTION 03 : GET PROFILE ACCOUNT

  @Get()
  async getProfileAccount(
    @Query('profileId') profileId: string,
    @Query('channelCode') channelCode: string
  ) {
    const data =
      await this.profileAccountService.getProfileAccount({
        profileId,
        channelCode
      })

    return {
      ok: true,
      data
    }
  }

  // SECTION 04 : PATCH BASIC INFO

  @Patch('basic')
  async updateProfileAccountBasic(
    @Body() body: UpdateProfileAccountBasicRequest
  ) {
    const data =
      await this.profileAccountService.updateProfileAccountBasic(
        body
      )

    return {
      ok: true,
      data
    }
  }

  // SECTION 05 : PATCH BIRTH DATE

  @Patch('birth-date')
  async updateProfileAccountBirthDate(
    @Body() body: UpdateBirthDateRequest
  ) {
    const data =
      await this.profileAccountService.updateProfileAccountBirthDate(
        body
      )

    return {
      ok: true,
      data
    }
  }

  // SECTION 06 : PATCH PRIMARY PASSWORD

  @Patch('primary-password')
  async updatePrimaryPassword(
    @Body() body: UpdatePrimaryPasswordRequest
  ) {
    const data =
      await this.profileAccountService.updatePrimaryPassword(
        body
      )

    return {
      ok: true,
      data
    }
  }

  // SECTION 07 : PATCH PAYMENT PASSWORD

  @Patch('payment-password')
  async updatePaymentPassword(
    @Body() body: UpdatePaymentPasswordRequest
  ) {
    const data =
      await this.profileAccountService.updatePaymentPassword(
        body
      )

    return {
      ok: true,
      data
    }
  }

  // SECTION 08 : PATCH ADULT VERIFICATION DEV

  @Patch('adult-verification/dev')
  async verifyAdultForDev(
    @Body() body: VerifyAdultForDevRequest
  ) {
    const data =
      this.profileAccountService.verifyAdultForDev(
        body
      )

    return {
      ok: true,
      data
    }
  }
}

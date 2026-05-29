/* ==================================================
FILE : backend/src/modules/auth/auth.controller.ts
ROOT : backend/src/modules/auth/auth.controller.ts
STATUS : AUTH CONTROLLER FINAL SNS STRUCTURE
ROLE : LOGIN + LOGOUT + REFRESH + PROFILE SWITCH + GETME EMAIL/BASECODE
================================================== */

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Res,
  BadRequestException
} from '@nestjs/common'
import type { Response } from 'express'

import { AuthService } from './auth.service'
import { AuthGuard } from '@nestjs/passport'

type LoginBody = {
  email: string
  password: string
  profileType: 'GENERAL' | 'BUSINESS'
}

type SwitchBody = {
  profileType: 'GENERAL' | 'BUSINESS'
}

type SignupBody = {
  email: string
  password: string
  profileType: 'GENERAL' | 'BUSINESS'
  displayName?: string
  businessTypeCode?: 'NORMAL' | 'STORE' | 'SHOPPING_MALL' | 'FREELANCER' | 'MOBILE_BIZ'
}

type BusinessSignupBody = {
  displayName?: string
  businessTypeCode?: 'NORMAL' | 'STORE' | 'SHOPPING_MALL' | 'FREELANCER' | 'MOBILE_BIZ'
}

type JwtUser = {
  id?: number
  userId?: number
  sub?: number
  profileId: number
  profileType: 'GENERAL' | 'BUSINESS'
  channelCode: string
}

type EmergencyQrTokenType =
  | 'MASTER_ACCESS'
  | 'GUARDIAN_ACCESS'
  | 'EMERGENCY_LOGIN'

type EmergencyGenerateQrBody = {
  channelCode: string
  emergencyAccessCode: string
  tokenType?: EmergencyQrTokenType
}

type EmergencyVerifyQrBody = {
  channelCode?: string
  tokenId?: string
  qrToken?: string
  qrPayload?: string
}

type RequestWithMeta = {
  ip?: string
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* ==================================================
  SECTION 01 LOGIN
  POST /auth/login
  ================================================== */
  @Post('login')
  async login(@Body() body: LoginBody) {
    if (!body.email) {
      throw new BadRequestException('email is required')
    }

    if (!body.password) {
      throw new BadRequestException('password is required')
    }

    if (!body.profileType) {
      throw new BadRequestException('profileType is required')
    }

    if (body.profileType !== 'GENERAL' && body.profileType !== 'BUSINESS') {
      throw new BadRequestException('invalid profileType')
    }

    return this.authService.login(body.email, body.password, body.profileType)
  }

  /* ==================================================
  SECTION 01-1 SIGNUP
  POST /auth/signup
  ================================================== */
  @Post('signup')
  async signup(@Body() body: SignupBody) {
    if (!body.email) {
      throw new BadRequestException('email is required')
    }

    if (!body.password) {
      throw new BadRequestException('password is required')
    }

    if (!body.profileType) {
      throw new BadRequestException('profileType is required')
    }

    if (body.profileType !== 'GENERAL' && body.profileType !== 'BUSINESS') {
      throw new BadRequestException('invalid profileType')
    }

    return this.authService.signup(body)
  }

  /* ==================================================
  SECTION 01-2 BUSINESS SIGNUP
  POST /auth/business-signup
  ================================================== */
  @UseGuards(AuthGuard('jwt'))
  @Post('business-signup')
  async businessSignup(
    @Request() req: { user: JwtUser },
    @Body() body: BusinessSignupBody
  ) {
    const userId = req.user.id ?? req.user.userId ?? req.user.sub

    if (!userId) {
      throw new BadRequestException('invalid jwt payload')
    }

    return this.authService.signupBusinessProfile(userId, body)
  }

  /* ==================================================
  SECTION 01-3 BUSINESS TRIAL APPLY
  POST /auth/business-trial-apply
  ================================================== */
  @UseGuards(AuthGuard('jwt'))
  @Post('business-trial-apply')
  async businessTrialApply(
    @Request() req: { user: JwtUser }
  ) {
    const userId = req.user.id ?? req.user.userId ?? req.user.sub

    if (!userId) {
      throw new BadRequestException('invalid jwt payload')
    }

    return this.authService.businessTrialApply(userId)
  }

  /* ==================================================
  SECTION 02 ME
  GET /auth/me
  ================================================== */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Request() req: { user: JwtUser }) {
    this.authService.enforceAdminSessionAliveIfAdmin(req.user.profileId)

    const profile = await this.authService.getProfileById(req.user.profileId)
    const userId = profile.userId ?? req.user.id ?? req.user.userId ?? req.user.sub
    if (!userId) throw new BadRequestException('invalid jwt payload')
    const user = await this.authService.getUserById(userId)

    return {
      ok: true,
      user: {
        userId,
        profileId: req.user.profileId,
        profileType: req.user.profileType,
        channelCode: profile.channelCode || req.user.channelCode,
        displayName: profile.displayName,
        email: user.email,          // 추가
        baseCode: profile.baseCode,  // 추가
        corporationGrade: user.corporationGrade,
        providerGrade: user.providerGrade ?? 0,
        genesisGrade: user.genesisGrade ?? 0,
        userGrade: user.userGrade ?? 0,
        meteoAiGrade: user.meteoAiGrade ?? 0
      }
    }
  }

  /* ==================================================
  SECTION 03 LOGOUT
  POST /auth/logout
  ================================================== */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(
    @Request() req: { user: JwtUser },
    @Res({ passthrough: true }) res: Response
  ) {
    const clearCookieOptions = {
      path: '/',
      sameSite: 'lax' as const
    }

    const cookieKeys = [
      'accessToken',
      'refreshToken',
      'rememberToken',
      'rememberMe',
      'autoLogin',
      'profileSession',
      'profileSessionId',
      'sessionId'
    ] as const

    cookieKeys.forEach((cookieKey) => {
      res.clearCookie(cookieKey, clearCookieOptions)
    })

    return this.authService.logout(req.user.profileId)
  }

  /* ==================================================
  SECTION 04 REFRESH
  POST /auth/refresh
  ================================================== */
  @UseGuards(AuthGuard('jwt'))
  @Post('refresh')
  async refresh(@Request() req: { user: JwtUser }) {
    return this.authService.refresh(req.user.profileId)
  }

  /* ==================================================
  SECTION 04-1 ADMIN HEARTBEAT
  POST /auth/admin-heartbeat
  ================================================== */
  @UseGuards(AuthGuard('jwt'))
  @Post('admin-heartbeat')
  async adminHeartbeat(@Request() req: { user: JwtUser }) {
    return this.authService.adminHeartbeat(req.user.profileId)
  }

  /* ==================================================
  SECTION 05 PROFILE SWITCH
  POST /auth/switch
  ================================================== */
  @UseGuards(AuthGuard('jwt'))
  @Post('switch')
  async switchProfile(@Request() req: { user: JwtUser }, @Body() body: SwitchBody) {
    const userId = req.user.id ?? req.user.userId ?? req.user.sub
    if (!body.profileType) throw new BadRequestException('profileType missing')
    if (!userId) throw new BadRequestException('invalid jwt payload')

    return this.authService.switchProfile(userId, body.profileType)
  }

  /* ==================================================
  SECTION 06 EMERGENCY QR GENERATE
  POST /auth/emergency/generate-qr
  ================================================== */
  @Post('emergency/generate-qr')
  async generateEmergencyQr(
    @Body() body: EmergencyGenerateQrBody,
    @Request() req: RequestWithMeta
  ) {
    if (!body.channelCode) {
      throw new BadRequestException('channelCode is required')
    }

    if (!body.emergencyAccessCode) {
      throw new BadRequestException('emergencyAccessCode is required')
    }

    return this.authService.generateEmergencyQr(
      {
        channelCode: body.channelCode,
        emergencyAccessCode: body.emergencyAccessCode,
        tokenType: body.tokenType
      },
      {
        ipAddress: req.ip ?? null,
        userAgent: this.getRequestUserAgent(req)
      }
    )
  }

  /* ==================================================
  SECTION 07 EMERGENCY QR VERIFY
  POST /auth/emergency/verify-qr
  ================================================== */
  @Post('emergency/verify-qr')
  async verifyEmergencyQr(
    @Body() body: EmergencyVerifyQrBody,
    @Request() req: RequestWithMeta
  ) {
    if (!body.qrPayload && (!body.channelCode || !body.tokenId || !body.qrToken)) {
      throw new BadRequestException('qr payload is required')
    }

    return this.authService.verifyEmergencyQr(
      {
        channelCode: body.channelCode,
        tokenId: body.tokenId,
        qrToken: body.qrToken,
        qrPayload: body.qrPayload
      },
      {
        ipAddress: req.ip ?? null,
        userAgent: this.getRequestUserAgent(req)
      }
    )
  }

  /* ==================================================
  SECTION 08 EMERGENCY QR STATUS
  GET /auth/emergency/status
  ================================================== */
  @Get('emergency/status')
  async getEmergencyStatus(@Request() req: RequestWithMeta) {
    const queryChannelCode = req.query?.channelCode
    const channelCode = Array.isArray(queryChannelCode)
      ? queryChannelCode[0]
      : queryChannelCode

    if (!channelCode) {
      throw new BadRequestException('channelCode is required')
    }

    return this.authService.getEmergencyQrStatus(channelCode)
  }

  private getRequestUserAgent(req: RequestWithMeta): string | null {
    const userAgent = req.headers?.['user-agent']

    if (Array.isArray(userAgent)) {
      return userAgent[0] ?? null
    }

    return userAgent ?? null
  }
}

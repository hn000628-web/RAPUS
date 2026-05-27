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
  BadRequestException
} from '@nestjs/common'

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

type JwtUser = {
  id?: number
  userId?: number
  sub?: number
  profileId: number
  profileType: 'GENERAL' | 'BUSINESS'
  channelCode: string
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
  SECTION 02 ME
  GET /auth/me
  ================================================== */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Request() req: { user: JwtUser }) {
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
        baseCode: profile.baseCode  // 추가
      }
    }
  }

  /* ==================================================
  SECTION 03 LOGOUT
  POST /auth/logout
  ================================================== */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Request() req: { user: JwtUser }) {
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
}

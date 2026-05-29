import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt.guard'
import { BusinessSecurityService } from './business-security.service'

type AuthRequest = {
  ip?: string
  headers?: Record<string, string | string[] | undefined>
  user?: {
    id?: number
    userId?: number
    channelCode?: string
  }
}

@Controller('business/security')
export class BusinessSecurityController {
  constructor(private readonly service: BusinessSecurityService) {}

  @Get('qr-status')
  @UseGuards(JwtAuthGuard)
  getQrStatus(@Req() req: AuthRequest) {
    return this.service.getQrStatus(
      this.getRequestUserId(req),
      req.user?.channelCode ?? ''
    )
  }

  @Post('generate-qr')
  @UseGuards(JwtAuthGuard)
  generateQr(
    @Req() req: AuthRequest,
    @Body() body: {
      emergencyAccessCode?: string | null
    }
  ) {
    return this.service.generateQr(
      this.getRequestUserId(req),
      req.user?.channelCode ?? '',
      body,
      {
        ipAddress: req.ip ?? null,
        userAgent: this.getRequestUserAgent(req)
      }
    )
  }

  @Post('verify-qr')
  verifyQr(
    @Req() req: AuthRequest,
    @Body() body: {
      channelCode?: string
      tokenId?: string
      qrToken?: string
      qrPayload?: string
    }
  ) {
    return this.service.verifyQr(
      body,
      {
        ipAddress: req.ip ?? null,
        userAgent: this.getRequestUserAgent(req)
      }
    )
  }

  private getRequestUserId(req: AuthRequest): number {
    return Number(req.user?.id ?? req.user?.userId ?? 0)
  }

  private getRequestUserAgent(req: AuthRequest): string | null {
    const userAgent = req.headers?.['user-agent']

    if (Array.isArray(userAgent)) {
      return userAgent[0] ?? null
    }

    return userAgent ?? null
  }
}

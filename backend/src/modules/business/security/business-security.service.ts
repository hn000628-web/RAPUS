import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import db from '../../../config/database'
import { AuthService } from '../../auth/auth.service'

type QrStatusRow = {
  channelCode: string
  qrStatus: 'ACTIVE' | 'DISABLED' | 'LOCKED'
  qrLastIssuedAt: string | null
  qrExpiresAt: string | null
}

@Injectable()
export class BusinessSecurityService {
  constructor(private readonly authService: AuthService) {}

  getQrStatus(userId: number, channelCode: string) {
    const profile = this.getOwnedBusinessProfile(userId, channelCode)
    const authStatus = this.authService.getEmergencyQrStatus(profile.channelCode)
    const credential = this.getCredentialRow(profile.channelCode)
    const now = Date.now()
    const expiresAtMs = credential?.qrExpiresAt
      ? new Date(credential.qrExpiresAt).getTime()
      : 0
    const remainingSeconds =
      expiresAtMs > now
        ? Math.max(0, Math.floor((expiresAtMs - now) / 1000))
        : 0
    const currentQrStatus =
      credential?.qrStatus === 'DISABLED' || credential?.qrStatus === 'LOCKED'
        ? credential.qrStatus
        : remainingSeconds > 0
          ? 'ACTIVE'
          : credential?.qrExpiresAt
            ? 'EXPIRED'
            : 'DISABLED'

    return {
      success: true,
      channelCode: profile.channelCode,
      qrStatus: currentQrStatus,
      qrCredentialStatus: credential?.qrStatus ?? 'DISABLED',
      qrLastIssuedAt: credential?.qrLastIssuedAt ?? null,
      qrExpiresAt: credential?.qrExpiresAt ?? null,
      remainingSeconds,
      emergencyAccessConfigured: authStatus.emergencyAccessConfigured,
      activeToken: authStatus.activeToken
    }
  }

  async generateQr(
    userId: number,
    channelCode: string,
    payload: {
      emergencyAccessCode?: string | null
    },
    context: {
      ipAddress?: string | null
      userAgent?: string | null
    }
  ) {
    const profile = this.getOwnedBusinessProfile(userId, channelCode)
    const emergencyAccessCode = payload.emergencyAccessCode?.trim() ?? ''

    if (!emergencyAccessCode) {
      throw new BadRequestException('emergencyAccessCode is required')
    }

    const result = await this.authService.generateEmergencyQr(
      {
        channelCode: profile.channelCode,
        emergencyAccessCode,
        tokenType: 'EMERGENCY_LOGIN'
      },
      context
    )

    db.prepare(`
      UPDATE user_security_credentials
      SET
        qrStatus = 'ACTIVE',
        qrLastIssuedAt = CURRENT_TIMESTAMP,
        qrExpiresAt = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE channelCode = ?
    `).run(result.expiresAt, profile.channelCode)

    return {
      ...result,
      qrImageSvg: this.createQrDisplaySvg(result.qrPayload),
      qrStatus: 'ACTIVE'
    }
  }

  async verifyQr(
    payload: {
      channelCode?: string
      tokenId?: string
      qrToken?: string
      qrPayload?: string
    },
    context: {
      ipAddress?: string | null
      userAgent?: string | null
    }
  ) {
    const result = await this.authService.verifyEmergencyQr(payload, context)

    db.prepare(`
      UPDATE user_security_credentials
      SET
        qrStatus = 'ACTIVE',
        qrExpiresAt = NULL,
        updatedAt = CURRENT_TIMESTAMP
      WHERE channelCode = ?
    `).run(result.channelCode)

    return result
  }

  private getOwnedBusinessProfile(userId: number, channelCode: string) {
    const normalizedChannelCode = channelCode.trim()

    if (!userId || !normalizedChannelCode) {
      throw new UnauthorizedException('invalid business security context')
    }

    const profile = db.prepare(`
      SELECT id, userId, channelCode, baseCode
      FROM profiles
      WHERE userId = ?
        AND channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(userId, normalizedChannelCode) as
      | {
          id: number
          userId: number
          channelCode: string
          baseCode: string
        }
      | undefined

    if (!profile) {
      throw new UnauthorizedException('business profile not found')
    }

    return profile
  }

  private getCredentialRow(channelCode: string): QrStatusRow | null {
    const row = db.prepare(`
      SELECT
        channelCode,
        qrStatus,
        qrLastIssuedAt,
        qrExpiresAt
      FROM user_security_credentials
      WHERE channelCode = ?
      LIMIT 1
    `).get(channelCode) as QrStatusRow | undefined

    return row ?? null
  }

  private createQrDisplaySvg(payload: string): string {
    const encodedPayload = this.escapeXml(payload)
    const cells = Array.from({ length: 121 }, (_, index) => {
      const charCode = payload.charCodeAt(index % payload.length) || index
      const x = (index % 11) * 12
      const y = Math.floor(index / 11) * 12
      const shouldFill = (charCode + index) % 3 !== 0

      return shouldFill
        ? `<rect x="${x}" y="${y}" width="10" height="10" rx="1" fill="#0f172a"/>`
        : ''
    }).join('')

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="212" viewBox="0 0 180 212" role="img">',
      '<rect width="180" height="212" rx="18" fill="#ffffff"/>',
      '<rect x="24" y="16" width="132" height="132" fill="#f8fafc"/>',
      `<g transform="translate(24 16)">${cells}</g>`,
      '<rect x="30" y="22" width="30" height="30" fill="#0f172a"/>',
      '<rect x="120" y="22" width="30" height="30" fill="#0f172a"/>',
      '<rect x="30" y="112" width="30" height="30" fill="#0f172a"/>',
      '<text x="90" y="172" text-anchor="middle" font-size="10" font-weight="700" fill="#2563eb">RAPUS QR AUTH</text>',
      `<text x="90" y="190" text-anchor="middle" font-size="6" fill="#64748b">${encodedPayload.slice(0, 44)}</text>`,
      '</svg>'
    ].join('')
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

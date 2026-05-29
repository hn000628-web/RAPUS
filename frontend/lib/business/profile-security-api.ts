import { apiFetch } from '@/lib/api'

export type BusinessQrStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'DISABLED'
  | 'LOCKED'

export type BusinessQrStatusResponse = {
  success: boolean
  channelCode: string
  qrStatus: BusinessQrStatus
  qrCredentialStatus: 'ACTIVE' | 'DISABLED' | 'LOCKED'
  qrLastIssuedAt: string | null
  qrExpiresAt: string | null
  remainingSeconds: number
  emergencyAccessConfigured: boolean
  activeToken: {
    tokenId: string
    tokenType: string
    expiresAt: string
    createdAt: string
  } | null
}

export type BusinessQrGenerateResponse = {
  success: boolean
  tokenId: string
  channelCode: string
  tokenType: string
  qrPayload: string
  qrImageSvg: string
  qrStatus: 'ACTIVE'
  expiresAt: string
  ttlSeconds: number
}

const BUSINESS_SECURITY_BASE =
  'business/security'

export async function getBusinessQrStatus(): Promise<BusinessQrStatusResponse> {
  return apiFetch(`${BUSINESS_SECURITY_BASE}/qr-status`)
}

export async function generateBusinessQr(
  emergencyAccessCode: string
): Promise<BusinessQrGenerateResponse> {
  return apiFetch(`${BUSINESS_SECURITY_BASE}/generate-qr`, {
    method: 'POST',
    body: {
      emergencyAccessCode
    }
  })
}

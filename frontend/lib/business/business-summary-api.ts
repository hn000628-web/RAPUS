// FILE : frontend/lib/business/business-summary-api.ts
// ROOT : frontend/lib/business/business-summary-api.ts
// STATUS : BUSINESS SUMMARY API (FINAL)
// ROLE : BUSINESS SUMMARY (BIO) 전용 API

// ==================================================
// SECTION 01 : IMPORT
// ==================================================

import { apiFetch } from '@/lib/api'

// ==================================================
// SECTION 02 : TYPES
// ==================================================

export type BusinessSummaryResponse = {
  ok: boolean
  summary: string | null
}

export type BusinessSummaryUpdateResponse = {
  ok: boolean
}

// ==================================================
// SECTION 03 : TOKEN GUARD
// ==================================================

function hasToken() {

  if (typeof window === 'undefined')
    return false

  return !!localStorage.getItem('accessToken')
}

// ==================================================
// SECTION 04 : GET SUMMARY
// ==================================================

export async function getBusinessSummary():
Promise<BusinessSummaryResponse> {

  if (!hasToken()) {
    return {
      ok: true,
      summary: null
    }
  }

  return apiFetch<BusinessSummaryResponse>(
    'business/summary'
  )
}

// ==================================================
// SECTION 05 : UPDATE SUMMARY
// ==================================================

export async function updateBusinessSummary(
  summary: string | null
): Promise<BusinessSummaryUpdateResponse> {

  if (!hasToken()) {
    throw new Error('AUTH REQUIRED')
  }

  return apiFetch<BusinessSummaryUpdateResponse>(
    'business/summary',
    {
      method: 'PATCH',
      body: {
        summary: summary || null
      }
    }
  )
}
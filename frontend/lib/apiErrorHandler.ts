/* =========================================
   API Error Handler
   frontend/lib/apiErrorHandler.ts
========================================= */

import { handleUnauthorized } from './authGuard'

/* =========================================
   API Error 처리
========================================= */

export async function handleApiError(res: Response) {

  /* =====================================
     401 Unauthorized
  ===================================== */

  if (res.status === 401) {

    handleUnauthorized()

    throw new Error('Unauthorized')

  }

  /* =====================================
     403 Forbidden
  ===================================== */

  if (res.status === 403) {

    alert('접근 권한이 없습니다.')

    throw new Error('Forbidden')

  }

  /* =====================================
     404 Not Found
  ===================================== */

  if (res.status === 404) {

    throw new Error('API not found')

  }

  /* =====================================
     500 Server Error
  ===================================== */

  if (res.status >= 500) {

    alert('서버 오류가 발생했습니다.')

    throw new Error('Server error')

  }

  /* =====================================
     기타 오류
  ===================================== */

  let message = 'API error'

  try {

    const text = await res.text()

    if (text)
      message = text

  } catch {}

  throw new Error(message)

}
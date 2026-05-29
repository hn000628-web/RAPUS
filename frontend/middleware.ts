import {
  NextResponse
} from 'next/server'

import type {
  NextRequest
} from 'next/server'

type AuthMeResponse = {
  ok?: boolean
  user?: {
    corporationGrade?: unknown
    meteoAiGrade?: unknown
  }
}

const ACCESS_TOKEN_COOKIE =
  'accessToken'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

function buildRedirectUrl(
  request: NextRequest,
  pathname: string
) {
  const url =
    request.nextUrl.clone()

  url.pathname =
    pathname
  url.search =
    ''

  return url
}

function toSafeNumber(value: unknown) {
  if (
    typeof value !== 'number' &&
    typeof value !== 'string'
  ) {
    return null
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue)
    ? numberValue
    : null
}

function hasAdminAuthority(input: {
  corporationGrade: unknown
} | null) {
  if (!input) {
    return false
  }

  const corporationGrade =
    toSafeNumber(input.corporationGrade)
  return (corporationGrade ?? 0) >= 24
}

function hasMeteoMasterAuthority(input: {
  meteoAiGrade: unknown
} | null) {
  if (!input) {
    return false
  }

  const meteoAiGrade =
    toSafeNumber(input.meteoAiGrade)

  return (meteoAiGrade ?? 0) >= 24
}

async function getSessionAdminContext(accessToken: string) {
  const response =
    await fetch(
      `${API_BASE_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        cache: 'no-store'
      }
    )

  if (!response.ok) {
    return null
  }

  const data =
    await response.json() as AuthMeResponse

  return {
    corporationGrade: data.user?.corporationGrade ?? null,
    meteoAiGrade: data.user?.meteoAiGrade ?? null
  }
}

export async function middleware(request: NextRequest) {
  if (
    !request.nextUrl.pathname.startsWith('/admin')
  ) {
    return NextResponse.redirect(
      buildRedirectUrl(request, '/login')
    )
  }

  const accessToken =
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value

  if (!accessToken) {
    return NextResponse.redirect(
      buildRedirectUrl(request, '/login')
    )
  }

  let isAdminAllowed = false
  let isMeteoMasterAllowed = false

  try {
    const adminContext =
      await getSessionAdminContext(accessToken)

    isAdminAllowed =
      hasAdminAuthority(adminContext)

    isMeteoMasterAllowed =
      hasMeteoMasterAuthority({
        meteoAiGrade: adminContext?.meteoAiGrade ?? null
      })
  } catch {
    isAdminAllowed = false
    isMeteoMasterAllowed = false
  }

  if (!isAdminAllowed) {
    return NextResponse.redirect(
      buildRedirectUrl(request, '/login')
    )
  }

  if (
    request.nextUrl.pathname.startsWith('/admin/meteo-ai') &&
    !isMeteoMasterAllowed
  ) {
    return NextResponse.redirect(
      buildRedirectUrl(request, '/profile')
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*'
  ]
}

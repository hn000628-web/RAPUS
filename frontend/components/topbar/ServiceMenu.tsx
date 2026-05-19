// FILE : frontend/components/topbar/ServiceMenu.tsx
// ROOT : frontend/components/topbar/ServiceMenu.tsx
// STATUS : MODIFY MODE
// ROLE : TOPBAR SERVICE MENU
// CHANGE SUMMARY :
// - [비즈니스] 버튼 제거 유지
// - [프로필] 버튼을 로그인 profileType 기준으로 라우팅
// - GENERAL 로그인 시 /profile/general 이동
// - BUSINESS 로그인 시 /profile/business 이동
// - profileType 불명확 시 channelCode prefix 로 보조 판단
// - 기존 스타일 / 레이아웃 유지

'use client'

// SECTION 01 : IMPORT
import {
  CSSProperties
} from 'react'

import {
  useRouter
} from 'next/navigation'

import {
  useAuth
} from '@/contexts/AuthContext'

// SECTION 02 : TYPE
type Props = {
  onClose: () => void
}

type ProfileRouteType = 'GENERAL' | 'BUSINESS' | null

type UnknownRecord = Record<string, unknown>

// SECTION 03 : COMPONENT
export default function ServiceMenu({
  onClose
}: Props) {
  const router = useRouter()
  const { profile } = useAuth()

  const isLogin = !!profile
  const profileRouteType = resolveProfileRouteType(profile)

  // SECTION 04 : EVENT FUNCTION
  function go(path: string) {
    onClose()
    router.push(path)
  }

  function goProfile() {
    if (profileRouteType === 'GENERAL') {
      go('/profile/general')
      return
    }

    if (profileRouteType === 'BUSINESS') {
      go('/profile/business')
      return
    }

    go('/profile')
  }

  // SECTION 05 : RETURN
  return (
    <div style={menu}>
      <div style={grid}>
        <ServiceItem
          label="MY Page"
          onClick={() => go('/profile')}
        />

        {!isLogin && (
          <ServiceItem
            label="서비스"
            onClick={() => go('/account')}
          />
        )}

        {isLogin && (
          <>
            <ServiceItem
              label="프로필"
              onClick={goProfile}
            />

            <ServiceItem
              label="라이프"
              onClick={() => go('/feed/life')}
            />

            <ServiceItem
              label="플레이스"
              onClick={() => go('/feed/place')}
            />
          </>
        )}
      </div>
    </div>
  )
}

// SECTION 06 : DATA FUNCTION
function resolveProfileRouteType(source: unknown): ProfileRouteType {
  const profileType = readNestedString(source, [
    ['profileType'],
    ['user', 'profileType'],
    ['profile', 'profileType']
  ])

  const normalizedProfileType = profileType?.toUpperCase()

  if (normalizedProfileType === 'GENERAL') {
    return 'GENERAL'
  }

  if (normalizedProfileType === 'BUSINESS') {
    return 'BUSINESS'
  }

  const channelCode = readNestedString(source, [
    ['channelCode'],
    ['user', 'channelCode'],
    ['profile', 'channelCode']
  ])

  if (channelCode?.startsWith('A')) {
    return 'GENERAL'
  }

  if (channelCode?.startsWith('B')) {
    return 'BUSINESS'
  }

  return null
}

function readNestedString(
  source: unknown,
  paths: string[][]
): string | null {
  for (const path of paths) {
    const value = readPath(source, path)

    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }

  return null
}

function readPath(
  source: unknown,
  path: string[]
): unknown {
  let current: unknown = source

  for (const key of path) {
    if (!isRecord(current)) {
      return null
    }

    current = current[key]
  }

  return current
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

// SECTION 07 : SERVICE ITEM COMPONENT
function ServiceItem({
  label,
  onClick
}: {
  label: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={item}
    >
      <div style={circle} />

      <div style={text}>
        {label}
      </div>
    </div>
  )
}

// SECTION 08 : STYLE
const menu: CSSProperties = {
  position: 'fixed',
  top: 56,
  right: 70,
  width: 220,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  padding: 12,
  display: 'grid',
  gridTemplateColumns: 'repeat(2,1fr)',
  gap: 12,
  zIndex: 3000
}

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2,1fr)',
  gap: 12
}

const item: CSSProperties = {
  textAlign: 'center',
  cursor: 'pointer',
  padding: 10,
  borderRadius: 10
}

const circle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 18,
  background: '#f1f5f9',
  margin: '0 auto 6px'
}

const text: CSSProperties = {
  fontSize: 12
}
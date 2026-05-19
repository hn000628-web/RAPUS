// FILE : frontend/components/TopBar/ProfileMenu.tsx
'use client'

/* ==================================================
FILE : frontend/components/TopBar/ProfileMenu.tsx
ROLE : GLOBAL ACCOUNT DROPDOWN MENU
STATUS : PRODUCTION SAFE FINAL
UPDATE :
LOGOUT EVENT DISPATCH
HOME LOGIN BUTTON SYNC
================================================== */

import {
  useRouter
} from 'next/navigation'

import {
  useAuth
} from '@/contexts/AuthContext'

type Props = {
  onClose: () => void
}

export default function ProfileMenu({
  onClose
}: Props) {
  const router = useRouter()

  const {
    profile,
    logout
  } = useAuth()

  /* ==================================================
  SECTION 01 : LOGOUT
  ================================================== */

  const handleLogout = async () => {
    onClose()

    await Promise.resolve(logout())

    window.dispatchEvent(
      new Event('auth-change')
    )

    router.replace('/')
    router.refresh()
  }

  /* ==================================================
  SECTION 02 : NAV HELPER
  ================================================== */

  const go = (path: string) => {
    router.push(path)
    onClose()
  }

  /* ==================================================
  SECTION 03 : UI
  ================================================== */

  return (
    <div style={container}>
      <div style={accountHeader}>
        <div style={nickname}>
          {profile?.displayName || 'USER'}
        </div>

        <div style={email}>
          {profile?.channelCode || ''}
        </div>
      </div>

      <ul style={menu}>
        <li>
          <MenuItem
            label='마이프로필'
            onClick={() => go('/profile')}
          />
        </li>

        <li>
          <MenuItem
            label='친구 & 구독'
            onClick={() => go('/connections')}
          />
        </li>

        <Divider />

        <li>
          <MenuItem
            label='로그아웃'
            danger
            onClick={handleLogout}
          />
        </li>
      </ul>
    </div>
  )
}

/* ==================================================
SECTION 04 : MENU ITEM
================================================== */

function MenuItem({
  label,
  danger,
  onClick
}: {
  label: string
  danger?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '9px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        color: danger ? '#e53935' : '#111',
        fontSize: 13,
        fontWeight: 500,
        transition: '0.15s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f5f7fa'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {label}
    </div>
  )
}

/* ==================================================
SECTION 05 : DIVIDER
================================================== */

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: '#eee',
        margin: '6px 0'
      }}
    />
  )
}

/* ==================================================
SECTION 06 : STYLE
================================================== */

const container: React.CSSProperties = {
  position: 'fixed',
  top: 56,
  right: 16,
  width: 240,
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  zIndex: 2000,
  overflow: 'hidden'
}

const accountHeader: React.CSSProperties = {
  padding: '14px',
  borderBottom: '1px solid #eee',
  background: '#fafafa'
}

const nickname: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
  marginBottom: 4
}

const email: React.CSSProperties = {
  fontSize: 12,
  color: '#6b7280'
}

const menu: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 8
}

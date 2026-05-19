'use client'

import type { CSSProperties } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type Props = {
  channelCode: string
  mode?: 'ORDER_TYPE' | 'MENU_CATEGORY'
  categories?: Array<{
    key: string
    label: string
  }>
  activeCategoryKey?: string
  onChangeCategory?: (key: string) => void
}

type OrderSidebarItem = {
  id: string
  label: string
  description: string
  pathSuffix: string
}

const ORDER_SIDEBAR_ITEMS: OrderSidebarItem[] = [
  {
    id: 'home',
    label: '오더 홈',
    description: '주문 방식을 선택합니다.',
    pathSuffix: '/order'
  },
  {
    id: 'QRcode',
    label: 'QR코드',
    description: 'QR코드 주문',
    pathSuffix: '/order/Qr'
  },
  {
    id: 'Kiosk',
    label: '키오스크',
    description: '키오스크 주문',
    pathSuffix: '/order/Kiosk'
  },
  {
    id: 'delivery',
    label: '배달',
    description: '주소지로 배달 받습니다.',
    pathSuffix: '/order/delivery'
  }
]

const sidebarStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}

const headerStyle: CSSProperties = {
  width: '100%',
  padding: '18px',
  borderRadius: '18px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 900,
  color: '#111827',
  letterSpacing: '-0.02em'
}

const descriptionStyle: CSSProperties = {
  margin: '7px 0 0',
  fontSize: '13px',
  lineHeight: 1.5,
  color: '#6b7280'
}

const menuWrapStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  maxHeight: '520px',
  overflowY: 'auto'
}

const menuButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: '72px',
  padding: '14px 15px',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  color: '#111827',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '5px'
}

const activeMenuButtonStyle: CSSProperties = {
  ...menuButtonStyle,
  border: '2px solid #111827',
  backgroundColor: '#f9fafb'
}

const menuLabelStyle: CSSProperties = {
  fontSize: '15px',
  fontWeight: 900,
  color: '#111827'
}

const menuDescriptionStyle: CSSProperties = {
  fontSize: '12px',
  lineHeight: 1.45,
  color: '#6b7280'
}

const channelCodeStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '14px',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  fontSize: '12px',
  lineHeight: 1.5,
  color: '#9ca3af',
  wordBreak: 'break-all'
}

function buildOrderPath(channelCode: string, pathSuffix: string): string {
  return `/channel/${encodeURIComponent(channelCode)}${pathSuffix}`
}

function isActivePath(pathname: string, targetPath: string, itemId: string): boolean {
  if (itemId === 'home') {
    return pathname === targetPath
  }

  return pathname.startsWith(targetPath)
}

export default function OrderSidebar({
  channelCode,
  mode = 'ORDER_TYPE',
  categories = [],
  activeCategoryKey,
  onChangeCategory
}: Props) {
  const router = useRouter()
  const pathname = usePathname() || ''

  function handleMove(pathSuffix: string) {
    const safeChannelCode = String(channelCode || '').trim()

    if (!safeChannelCode) {
      return
    }

    router.push(buildOrderPath(safeChannelCode, pathSuffix))
  }

  const HeaderUI = (
    <div style={headerStyle}>
      <h2 style={titleStyle}>{mode === 'MENU_CATEGORY' ? '메뉴 카테고리' : '오더'}</h2>
      <p style={descriptionStyle}>
        {mode === 'MENU_CATEGORY'
          ? '카테고리를 선택하면 해당 메뉴만 표시됩니다.'
          : '주문 방식을 눌러 매장 이용, 배달 화면을 분리합니다.'}
      </p>
    </div>
  )

  const OrderTypeMenuUI = (
    <div style={menuWrapStyle}>
      {ORDER_SIDEBAR_ITEMS.map((item) => {
        const targetPath = buildOrderPath(channelCode, item.pathSuffix)
        const active = isActivePath(pathname, targetPath, item.id)

        return (
          <button
            key={item.id}
            type="button"
            style={active ? activeMenuButtonStyle : menuButtonStyle}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              handleMove(item.pathSuffix)
            }}
          >
            <span style={menuLabelStyle}>{item.label}</span>
            <span style={menuDescriptionStyle}>{item.description}</span>
          </button>
        )
      })}
    </div>
  )

  const CategoryMenuUI = (
    <div style={menuWrapStyle}>
      {categories.map((item) => {
        const active = activeCategoryKey === item.key

        return (
          <button
            key={item.key}
            type="button"
            style={
              active
                ? {
                    ...menuButtonStyle,
                    minHeight: '44px',
                    padding: '11px 14px',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    border: '1px solid #0f172a',
                    backgroundColor: '#0f172a',
                    color: '#ffffff'
                  }
                : {
                    ...menuButtonStyle,
                    minHeight: '44px',
                    padding: '11px 14px',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    border: '1px solid #d8e0ea',
                    backgroundColor: '#ffffff',
                    color: '#0f172a'
                  }
            }
            aria-current={active ? 'true' : undefined}
            onClick={() => {
              onChangeCategory?.(item.key)
            }}
          >
            <span
              style={{
                ...menuLabelStyle,
                fontSize: '14px',
                color: active ? '#ffffff' : '#0f172a'
              }}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )

  const ChannelCodeUI = (
    <div style={channelCodeStyle}>채널 코드 : {channelCode || '-'}</div>
  )

  return (
    <aside style={sidebarStyle}>
      {HeaderUI}
      {mode === 'MENU_CATEGORY' ? CategoryMenuUI : OrderTypeMenuUI}
      {ChannelCodeUI}
    </aside>
  )
}

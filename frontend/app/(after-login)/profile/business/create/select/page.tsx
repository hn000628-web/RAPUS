'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import type {
  CSSProperties
} from 'react'

import {
  useRouter
} from 'next/navigation'

import {
  getMe
} from '@/lib/authApi'

import {
  getBusinessMenus
} from '@/lib/business/menuApi'

type BusinessCreateTypeItem = {
  typeCode: string
  label: string
  routePath: string
  sortOrder: number
  isActive: boolean
}

type SelectCardProps = {
  title: string
  onClick: () => void
}

export default function ProfileSelectPage() {
  const router =
    useRouter()

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const [createTypeItems, setCreateTypeItems] =
    useState<BusinessCreateTypeItem[]>([])

  useEffect(() => {
    void loadCreateTypeItems()
  }, [])

  async function loadCreateTypeItems() {
    try {
      setLoading(true)
      setErrorMessage(null)

      const me =
        await getMe()

      const channelCode =
        String(me?.user?.channelCode || '').trim()

      if (!channelCode) {
        setCreateTypeItems([])
        setErrorMessage('채널 정보를 확인할 수 없습니다.')
        return
      }

      const menus =
        await getBusinessMenus(channelCode)

      const nextItems =
        menus
          .map((menu) => {
            const typeCode =
              String(menu?.postType || '')
                .trim()
                .toUpperCase()

            const routePath =
              resolveRoutePath(typeCode)

            return {
              typeCode,
              label: String(menu?.title || '').trim(),
              routePath,
              sortOrder: Number(menu?.sortOrder || 0),
              isActive: menu?.isActive !== false
            } satisfies BusinessCreateTypeItem
          })
          .filter((item) => {
            if (!item.isActive) {
              return false
            }

            if (!item.routePath) {
              return false
            }

            if (!item.label) {
              return false
            }

            return true
          })
          .sort((a, b) => a.sortOrder - b.sortOrder)

      setCreateTypeItems(nextItems)
    } catch (error) {
      console.error(
        'BUSINESS CREATE TYPE LOAD FAILED',
        error
      )

      setCreateTypeItems([])
      setErrorMessage('등록 유형을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function resolveRoutePath(typeCode: string) {
    if (typeCode === 'SUMMARY') {
      return '/profile/business/create/summary'
    }

    if (typeCode === 'GENERAL') {
      return '/profile/business/create/posts'
    }

    if (typeCode === 'EVENT') {
      return '/profile/business/create/event'
    }

    if (typeCode === 'PRODUCT') {
      return '/profile/business/create/product'
    }

    if (typeCode === 'GALLERY') {
      return '/profile/business/create/photo'
    }

    return ''
  }

  const hasCreateTypeItems =
    useMemo(() => {
      return createTypeItems.length > 0
    }, [createTypeItems])

  return (
    <main style={pageStyle}>
      <div style={cardWrapperStyle}>
        <h1 style={titleStyle}>
          등록 유형 선택
        </h1>

        {loading && (
          <div style={stateTextStyle}>
            불러오는 중...
          </div>
        )}

        {!loading && errorMessage && (
          <div style={stateTextStyle}>
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage &&
          !hasCreateTypeItems && (
            <div style={stateTextStyle}>
              활성화된 등록 유형이 없습니다.
            </div>
          )}

        {!loading &&
          !errorMessage &&
          hasCreateTypeItems &&
          createTypeItems.map((item) => (
            <SelectCard
              key={`${item.typeCode}-${item.sortOrder}`}
              title={item.label}
              onClick={() => {
                router.push(item.routePath)
              }}
            />
          ))}
      </div>
    </main>
  )
}

function SelectCard({
  title,
  onClick
}: SelectCardProps) {
  const [hover, setHover] =
    useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => {
        setHover(true)
      }}
      onMouseLeave={() => {
        setHover(false)
      }}
      style={{
        ...cardStyle,
        background: hover
          ? '#1877f2'
          : '#ffffff',
        color: hover
          ? '#ffffff'
          : '#000000'
      }}
    >
      {title}
    </button>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  background: '#f0f2f5',
  padding: '16px 0 20px',
  boxSizing: 'border-box'
}

const cardWrapperStyle: CSSProperties = {
  width: 360,
  padding: '20px 24px 24px',
  background: '#ffffff',
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minHeight: 430,
  boxSizing: 'border-box'
}

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  margin: '0 0 12px',
  color: '#000000'
}

const cardStyle: CSSProperties = {
  width: '100%',
  borderRadius: 12,
  padding: '18px 16px',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 600,
  background: '#ffffff',
  border: '1px solid #dddddd',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box'
}

const stateTextStyle: CSSProperties = {
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  fontSize: 14,
  fontWeight: 500
}

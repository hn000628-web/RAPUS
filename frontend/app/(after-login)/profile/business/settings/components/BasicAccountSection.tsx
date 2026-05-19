'use client'

// SECTION 01 : IMPORT
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'

// SECTION 02 : TYPE
type Props = {
  displayName: string

  slug: string
  setSlug: (v: string) => void

  regionName: string | null
  regionDetailAddress?: string | null

  channelCode: string | null
  channelId: string | null

  contactPhone?: string
  setContactPhone?: (v: string) => void

  businessHoursSummary?: string | null

  moveChannelManage: () => void
  moveMenuManage: () => void
}

// SECTION 03 : COMPONENT
export default function BasicAccountSection({
  displayName,

  slug,
  setSlug,

  regionName,
  regionDetailAddress = null,

  channelCode,

  contactPhone = '',
  setContactPhone,

  businessHoursSummary = null,

  moveChannelManage,
  moveMenuManage
}: Props) {
  const router = useRouter()

  // SECTION 04 : CONSTANT
  const INPUT_HEIGHT = 48
  const RADIUS = 12
  const BORDER = '1px solid #e5e7eb'

  // SECTION 05 : STYLE OBJECT
  const sectionStyle: CSSProperties = {
    marginBottom: 24
  }

  const labelStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 500
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    height: INPUT_HEIGHT,
    padding: '0 16px',
    marginTop: 8,
    borderRadius: RADIUS,
    border: BORDER,
    boxSizing: 'border-box',
    fontSize: 14,
    outline: 'none'
  }

  const readOnlyInputStyle: CSSProperties = {
    ...inputStyle,
    background: '#f3f4f6',
    color: '#6b7280',
    cursor: 'not-allowed'
  }

  const slugBox: CSSProperties = {
    ...inputStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px 0 12px'
  }

  const slugLeft: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flex: 1
  }

  const prefixStyle: CSSProperties = {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
    whiteSpace: 'nowrap'
  }

  const slugInput: CSSProperties = {
    flex: 1,
    border: 'none',
    height: '100%',
    fontSize: 14,
    outline: 'none',
    padding: '0 12px'
  }

  const settingBox: CSSProperties = {
    ...inputStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }

  const settingBoxWithInput: CSSProperties = {
    ...settingBox,
    paddingRight: 8
  }

  const settingText: CSSProperties = {
    fontSize: 14,
    color: '#111827'
  }

  const settingButton: CSSProperties = {
    border: 'none',
    background: 'transparent',
    color: '#1877f2',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  }

  const channelBtn: CSSProperties = {
    height: 32,
    padding: '0 14px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  }

  const contactInput: CSSProperties = {
    flex: 1,
    border: 'none',
    height: '100%',
    fontSize: 14,
    outline: 'none',
    padding: '0 8px 0 0',
    background: 'transparent'
  }

  // SECTION 06 : DATA FUNCTION
  function normalizeChannelValue(value?: string | null) {
    if (!value) {
      return ''
    }

    return value
      .trim()
      .replace(/^https?:\/\/[^/]+\/@/i, '')
      .replace(/^https?:\/\/[^/]+\//i, '')
      .replace(/^xxx\.com\/@/i, '')
      .replace(/^@/, '')
      .replace(/\s/g, '')
  }

  function normalizeDisplayText(value?: string | null) {
    if (typeof value !== 'string') {
      return ''
    }

    return value.trim()
  }

  function buildRegionDisplayLabel(): string {
    const safeRegionName = normalizeDisplayText(regionName)
    const safeDetailAddress = normalizeDisplayText(regionDetailAddress)

    if (safeRegionName && safeDetailAddress) {
      return `${safeRegionName} ${safeDetailAddress}`
    }

    if (safeRegionName) {
      return safeRegionName
    }

    if (safeDetailAddress) {
      return safeDetailAddress
    }

    return '지역 미설정'
  }

  // SECTION 07 : DISPLAY VALUE
  const safeChannelCode = channelCode?.trim()
    ? normalizeChannelValue(channelCode)
    : ''

  const safeChannelName = slug?.trim()
    ? normalizeChannelValue(slug)
    : ''

  const displayChannelName = safeChannelName || safeChannelCode || ''

  const displayBusinessHours = businessHoursSummary?.trim()
    ? businessHoursSummary
    : '영업시간 미설정'

  const displayRegionLabel = buildRegionDisplayLabel()

  // SECTION 08 : RETURN
  return (
    <>
      <div style={sectionStyle}>
        <label style={labelStyle}>
          상호명
        </label>

        <input
          type="text"
          value={displayName}
          readOnly
          aria-readonly="true"
          style={readOnlyInputStyle}
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          채널 주소
        </label>

        <div style={slugBox}>
          <div style={slugLeft}>
            <span style={prefixStyle}>
              xxx.com/@
            </span>

            <input
              type="text"
              value={displayChannelName}
              onChange={(event) => {
                setSlug(normalizeChannelValue(event.target.value))
              }}
              style={slugInput}
              placeholder="channel-name"
            />
          </div>

          <button
            type="button"
            onClick={moveChannelManage}
            style={channelBtn}
          >
            채널관리
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          지역설정
        </label>

        <div style={settingBox}>
          <span style={settingText}>
            {displayRegionLabel}
          </span>

          <button
            type="button"
            onClick={() => router.push('/profile/business/settings/region')}
            style={settingButton}
          >
            지역설정
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          대표 연락처
        </label>

        <div style={settingBoxWithInput}>
          <input
            type="text"
            value={contactPhone}
            onChange={(event) => {
              setContactPhone?.(event.target.value)
            }}
            placeholder="예: 010-1234-1234"
            style={contactInput}
          />

          <button
            type="button"
            onClick={() => router.push('/profile/business/settings/contact')}
            style={settingButton}
          >
            연락처설정
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          영업시간
        </label>

        <div style={settingBox}>
          <span style={settingText}>
            {displayBusinessHours}
          </span>

          <button
            type="button"
            onClick={() => router.push('/profile/business/settings/hours')}
            style={settingButton}
          >
            영업시간설정
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          메뉴 관리
        </label>

        <div style={settingBox}>
          <span style={settingText}>
            프로필 메뉴바 구성
          </span>

          <button
            type="button"
            onClick={moveMenuManage}
            style={settingButton}
          >
            메뉴관리
          </button>
        </div>
      </div>
    </>
  )
}

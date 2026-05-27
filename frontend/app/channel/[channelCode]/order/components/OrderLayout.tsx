// FILE : frontend/app/channel/[channelCode]/order/components/OrderLayout.tsx
// ROOT : frontend/app/channel/[channelCode]/order/components/OrderLayout.tsx
// STATUS : CREATE MODE
// ROLE : PUBLIC BUSINESS CHANNEL ORDER LAYOUT COMPONENT
// CHANGE SUMMARY :
// - 오더 페이지 전용 공통 레이아웃 신규 생성
// - 좌측 OrderSidebar / 우측 children 본문 구조 적용
// - 태블릿 / PC 기준 2컬럼 레이아웃 적용
// - 모바일에서는 1컬럼 구조로 자동 전환
// - channelCode 기반 오더 사이드바 전달
// - API 호출 / DB 접근 / 주문 생성 / 결제 연결 없음

'use client'

// SECTION 01 : IMPORT

import {
  ReactNode,
  useEffect,
  useMemo,
  useState
} from 'react'

import type {
  CSSProperties
} from 'react'

import {
  getBusinessProfileDetail,
  type BusinessProfileDetail
} from '@/lib/business/profileApi'
import {
  getBusinessInfoView,
  type BusinessInfoView
} from '@/lib/business/profile-info-api'

import OrderSidebar from './OrderSidebar'

// SECTION 02 : TYPE

type Props = {
  channelCode: string
  children: ReactNode
  customSidebar?: ReactNode
  hideSidebar?: boolean
  headerMode?: 'DEFAULT' | 'PROFILE_LEFT'
  headerRightContent?: ReactNode
  headerLeftBottomContent?: ReactNode
}

type WeeklyHoursDay = {
  dayKey: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
  dayLabel: string
  isClosed: boolean
  openTime: string
  closeTime: string
}

// SECTION 03 : CONSTANT

const COMPACT_BREAKPOINT =
  860

// SECTION 04 : STYLE

const pageStyle: CSSProperties = {
  minHeight: 'calc(100vh - 80px)',
  backgroundColor: '#ffffff'
}

const shellStyle: CSSProperties = {
  width: '100%',
  maxWidth: '1120px',
  margin: '0 auto',
  padding: '64px 24px 56px',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  boxSizing: 'border-box'
}

const headerStyle: CSSProperties = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 0.82fr)',
  gap: '40px',
  alignItems: 'start'
}

const compactHeaderStyle: CSSProperties = {
  ...headerStyle,
  gridTemplateColumns: '1fr',
  gap: '18px'
}

const profileLeftHeaderWideStyle: CSSProperties = {
  ...headerStyle,
  gridTemplateColumns: 'minmax(440px, 640px) minmax(360px, 1fr)',
  gap: '24px'
}

const heroPanelStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 0.82',
  overflow: 'hidden',
  border: '1px solid #eef0f3',
  borderRadius: '14px',
  backgroundColor: '#f3f4f6'
}

const heroImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover',
  objectPosition: 'center'
}

const heroPlaceholderStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)',
  color: '#9ca3af',
  fontSize: '15px',
  fontWeight: 700
}

const profileHeaderInnerStyle: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  paddingTop: '4px'
}

const profileTopLineStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '14px'
}

const profileAvatarStyle: CSSProperties = {
  width: '64px',
  height: '64px',
  flex: '0 0 64px',
  overflow: 'hidden',
  border: '1px solid #eef0f3',
  borderRadius: '16px',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  fontSize: '12px',
  fontWeight: 800
}

const profileAvatarImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover'
}

const profileInfoStyle: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const profileMetaLineStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  flexWrap: 'wrap'
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 800,
  color: '#111827',
  letterSpacing: '-0.4px',
  lineHeight: 1.28
}

const profileCategoryStyle: CSSProperties = {
  color: '#6b7280',
  fontSize: '15px',
  fontWeight: 600
}

const profileRatingLineStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '14px',
  color: '#4b5563'
}

const profileRatingStyle: CSSProperties = {
  color: '#111827',
  fontWeight: 800
}

const profileReviewStyle: CSSProperties = {
  color: '#6b7280',
  fontWeight: 600
}

const actionGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const actionButtonStyle: CSSProperties = {
  minWidth: '78px',
  height: '40px',
  padding: '0 18px',
  border: '1px solid #e5e7eb',
  borderRadius: '999px',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer'
}

const primaryActionsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px',
  paddingTop: '4px'
}

const primaryButtonStyle: CSSProperties = {
  height: '44px',
  border: 0,
  borderRadius: '10px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer'
}

const basicInfoCardStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  backgroundColor: '#ffffff',
  padding: '14px 16px',
  marginTop: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
}

const basicInfoTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 900,
  color: '#111827'
}

const basicInfoListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const basicInfoRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '90px minmax(0, 1fr)',
  alignItems: 'start',
  gap: '8px'
}

const basicInfoLabelStyle: CSSProperties = {
  color: '#6b7280',
  fontSize: '13px',
  fontWeight: 800
}

const basicInfoValueStyle: CSSProperties = {
  color: '#111827',
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: 1.45,
  wordBreak: 'break-word'
}

const sidebarColumnStyle: CSSProperties = {
  width: '260px',
  minWidth: '260px'
}

const compactSidebarColumnStyle: CSSProperties = {
  width: '100%',
  minWidth: 0
}

const contentColumnStyle: CSSProperties = {
  minWidth: 0,
  width: '100%'
}

// SECTION 04-1 : UTIL FUNCTION

function normalizeImageUrl(
  value?: string | null
): string | null {
  const raw = String(value || '').trim()

  if (!raw) {
    return null
  }

  if (/^(https?:|blob:|\/)/.test(raw)) {
    return raw
  }

  return `/media/${raw}`
}

function formatIndustryLabel(
  detail: BusinessProfileDetail | null
): string {
  const industryName =
    String(detail?.industry?.industry?.name || '').trim()

  const subtypeName =
    String(detail?.industry?.industrySubtype?.name || '').trim()

  if (industryName && subtypeName) {
    return `${industryName} · ${subtypeName}`
  }

  if (subtypeName) {
    return subtypeName
  }

  if (industryName) {
    return industryName
  }

  return '업종 정보 없음'
}

function resolveBusinessTypeLabel(
  detail: BusinessProfileDetail | null
): string {
  const profile =
    detail?.profile as (BusinessProfileDetail['profile'] & {
      businessTypeCode?: string | null
    }) | undefined

  const raw = String(
    profile?.businessTypeCode ||
    ''
  )
    .trim()
    .toUpperCase()

  if (raw === 'STORE') {
    return '고정형마켓'
  }

  if (raw === 'SHOPPING_MALL') {
    return '쇼핑몰형'
  }

  if (raw === 'FREELANCER') {
    return '프리랜서'
  }

  if (raw === 'MOBILE_BIZ' || raw === 'MOBILE') {
    return '이동형'
  }

  return '고정형마켓'
}

function formatWeeklyHoursValue(
  weeklyHours: WeeklyHoursDay[],
  temporaryClosed: boolean,
  alwaysOpen: boolean
): string {
  if (temporaryClosed) {
    return '\uC804\uCCB4 OFF'
  }

  if (alwaysOpen) {
    return '24\uC2DC\uAC04 \uC601\uC5C5'
  }

  if (!Array.isArray(weeklyHours) || weeklyHours.length === 0) {
    return '\uC815\uBCF4 \uC5C6\uC74C'
  }

  return weeklyHours
    .map((day) => {
      return day.isClosed
        ? `${day.dayLabel} \uD734\uBB34`
        : `${day.dayLabel} ${day.openTime}-${day.closeTime}`
    })
    .join(' / ')
}

// SECTION 05 : COMPONENT

export default function OrderLayout({
  channelCode,
  children,
  customSidebar,
  hideSidebar = false,
  headerMode = 'DEFAULT',
  headerRightContent = null,
  headerLeftBottomContent = null
}: Props) {
  // SECTION 06 : STATE

  const [isCompact, setIsCompact] =
    useState(false)

  const [profileDetail, setProfileDetail] =
    useState<BusinessProfileDetail | null>(null)
  const [profileInfoView, setProfileInfoView] =
    useState<BusinessInfoView | null>(null)

  // SECTION 07 : EFFECT

  useEffect(() => {
    function updateLayoutMode() {
      setIsCompact(window.innerWidth < COMPACT_BREAKPOINT)
    }

    updateLayoutMode()

    window.addEventListener(
      'resize',
      updateLayoutMode
    )

    return () => {
      window.removeEventListener(
        'resize',
        updateLayoutMode
      )
    }
  }, [])

  useEffect(() => {
    let cancelled =
      false

    async function loadProfileHeader() {
      const safeChannelCode =
        String(channelCode || '').trim()

      if (!safeChannelCode) {
        setProfileDetail(null)
        setProfileInfoView(null)
        return
      }

      try {
        const [detail, infoView] =
          await Promise.all([
            getBusinessProfileDetail(safeChannelCode),
            getBusinessInfoView(safeChannelCode)
          ])

        if (!cancelled) {
          setProfileDetail(detail)
          setProfileInfoView(infoView)
        }
      } catch (error) {
        console.error('ORDER PROFILE HEADER LOAD FAILED ->', error)

        if (!cancelled) {
          setProfileDetail(null)
          setProfileInfoView(null)
        }
      }
    }

    void loadProfileHeader()

    return () => {
      cancelled = true
    }
  }, [
    channelCode
  ])

  // SECTION 08 : MEMO DATA

  const bodyStyle = useMemo<CSSProperties>(() => {
    if (hideSidebar) {
      return {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: '16px',
        alignItems: 'start'
      }
    }

    if (isCompact) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
        alignItems: 'start'
      }
    }

    return {
      display: 'grid',
      gridTemplateColumns: '260px minmax(0, 1fr)',
      gap: '18px',
      alignItems: 'start'
    }
  }, [
    hideSidebar,
    isCompact
  ])

  const sidebarWrapStyle =
    isCompact
      ? compactSidebarColumnStyle
      : sidebarColumnStyle

  const businessName =
    String(profileDetail?.profile?.displayName || '').trim() ||
    '비즈니스 정보 없음'

  const industryLabel =
    formatIndustryLabel(profileDetail)

  const businessTypeLabel =
    resolveBusinessTypeLabel(profileDetail)

  const avatarUrl =
    normalizeImageUrl(
      profileDetail?.media?.avatar?.imageUrl ||
      profileDetail?.media?.avatar?.filePath ||
      null
    )

  const heroImageUrl =
    normalizeImageUrl(
      profileDetail?.media?.heroImages?.[0]?.imageUrl ||
      profileDetail?.media?.heroImages?.[0]?.filePath ||
      null
    )

  const contactPhone =
    String(
      profileInfoView?.contactPhone ||
      profileDetail?.placeMeta?.contactPhone ||
      ''
    ).trim() || '-'

  const regionText =
    String(
      profileDetail?.placeMeta?.activityRegion?.fullName ||
      profileDetail?.placeMeta?.activityRegion?.name ||
      profileDetail?.placeMeta?.feedRegion?.fullName ||
      profileDetail?.placeMeta?.feedRegion?.name ||
      profileInfoView?.detailAddress ||
      profileDetail?.placeMeta?.detailAddress ||
      ''
    ).trim() || '-'

  const hoursSummaryText =
    String(profileInfoView?.hours?.summary || '').trim() || '-'

  const weeklyHoursText =
    formatWeeklyHoursValue(
      Array.isArray(profileInfoView?.hours?.weeklyHours)
        ? profileInfoView.hours.weeklyHours
        : [],
      Boolean(profileInfoView?.hours?.temporaryClosed),
      Boolean(profileInfoView?.hours?.alwaysOpen)
    )

  const statusText =
    Boolean(profileInfoView?.hours?.temporaryClosed)
      ? '\uC804\uCCB4 OFF'
      : Boolean(profileInfoView?.hours?.alwaysOpen)
        ? '24\uC2DC\uAC04 \uC601\uC5C5'
        : '\uC77C\uBC18 \uC6B4\uC601'

  const BasicInfoCardUI = (
    <section style={basicInfoCardStyle}>
      <h2 style={basicInfoTitleStyle}>
        {'\uAE30\uBCF8 \uC815\uBCF4'}
      </h2>

      <div style={basicInfoListStyle}>
        <div style={basicInfoRowStyle}>
          <span style={basicInfoLabelStyle}>{'\uC804\uD654'}</span>
          <span style={basicInfoValueStyle}>{contactPhone}</span>
        </div>

        <div style={basicInfoRowStyle}>
          <span style={basicInfoLabelStyle}>{'\uC9C0\uC5ED'}</span>
          <span style={basicInfoValueStyle}>{regionText}</span>
        </div>

        <div style={basicInfoRowStyle}>
          <span style={basicInfoLabelStyle}>{'\uC601\uC5C5 \uC548\uB0B4'}</span>
          <span style={basicInfoValueStyle}>{hoursSummaryText}</span>
        </div>

        <div style={basicInfoRowStyle}>
          <span style={basicInfoLabelStyle}>{'\uC8FC\uAC04 \uC601\uC5C5\uC2DC\uAC04'}</span>
          <span style={basicInfoValueStyle}>{weeklyHoursText}</span>
        </div>

        <div style={basicInfoRowStyle}>
          <span style={basicInfoLabelStyle}>{'\uC0C1\uD0DC'}</span>
          <span style={basicInfoValueStyle}>{statusText}</span>
        </div>
      </div>
    </section>
  )

  // SECTION 09 : UI BLOCK

  const ProfileOnlyHeaderLeftUI = (
    <section style={profileHeaderInnerStyle}>
      <div style={profileTopLineStyle}>
        <div style={profileAvatarStyle}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${businessName} 프로필 이미지`}
              style={profileAvatarImageStyle}
            />
          ) : (
            '프로필'
          )}
        </div>

        <div style={profileInfoStyle}>
          <div style={profileMetaLineStyle}>
            <h1 style={titleStyle}>
              {businessName}
            </h1>

            <span style={profileCategoryStyle}>
              {businessTypeLabel}
            </span>

            <span style={profileCategoryStyle}>
              ·
            </span>

            <span style={profileCategoryStyle}>
              {industryLabel}
            </span>
          </div>

          <div style={profileRatingLineStyle}>
            <span style={profileRatingStyle}>
              평점 -
            </span>

            <span style={profileReviewStyle}>
              방문자 리뷰 -
            </span>
          </div>
        </div>
      </div>

      <div style={actionGroupStyle}>
        <button
          type="button"
          style={actionButtonStyle}
        >
          저장
        </button>

        <button
          type="button"
          style={actionButtonStyle}
        >
          공유
        </button>
      </div>

      <div style={primaryActionsStyle}>
        <button
          type="button"
          style={primaryButtonStyle}
        >
          전화
        </button>

        <button
          type="button"
          style={primaryButtonStyle}
        >
          길찾기
        </button>

        <button
          type="button"
          style={primaryButtonStyle}
        >
          지도보기
        </button>
        </div>

        {BasicInfoCardUI}

        {headerLeftBottomContent}
      </section>
  )

  const DefaultHeaderUI = (
    <header style={isCompact ? compactHeaderStyle : headerStyle}>
      <section style={heroPanelStyle}>
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={`${businessName} 대표 이미지`}
            style={heroImageStyle}
          />
        ) : (
          <div style={heroPlaceholderStyle}>
            대표 이미지 영역
          </div>
        )}
      </section>

      <section style={profileHeaderInnerStyle}>
        <div style={profileTopLineStyle}>
          <div style={profileAvatarStyle}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${businessName} 프로필 이미지`}
                style={profileAvatarImageStyle}
              />
            ) : (
              '프로필'
            )}
          </div>

          <div style={profileInfoStyle}>
            <div style={profileMetaLineStyle}>
              <h1 style={titleStyle}>
                {businessName}
              </h1>

              <span style={profileCategoryStyle}>
                {businessTypeLabel}
              </span>

              <span style={profileCategoryStyle}>
                ·
              </span>

              <span style={profileCategoryStyle}>
                {industryLabel}
              </span>
            </div>

            <div style={profileRatingLineStyle}>
              <span style={profileRatingStyle}>
                평점 -
              </span>

              <span style={profileReviewStyle}>
                방문자 리뷰 -
              </span>
            </div>
          </div>
        </div>

        <div style={actionGroupStyle}>
          <button
            type="button"
            style={actionButtonStyle}
          >
            저장
          </button>

          <button
            type="button"
            style={actionButtonStyle}
          >
            공유
          </button>
        </div>

        <div style={primaryActionsStyle}>
          <button
            type="button"
            style={primaryButtonStyle}
          >
            전화
          </button>

          <button
            type="button"
            style={primaryButtonStyle}
          >
            길찾기
          </button>

          <button
            type="button"
            style={primaryButtonStyle}
          >
            지도보기
          </button>
        </div>

        {BasicInfoCardUI}
      </section>
    </header>
  )

  const ProfileLeftHeaderUI = (
    <header style={isCompact ? compactHeaderStyle : profileLeftHeaderWideStyle}>
      {ProfileOnlyHeaderLeftUI}

      <section>
        {headerRightContent}
      </section>
    </header>
  )

  const HeaderUI =
    headerMode === 'PROFILE_LEFT'
      ? ProfileLeftHeaderUI
      : DefaultHeaderUI

  const SidebarUI = hideSidebar
    ? null
    : (
      <div style={sidebarWrapStyle}>
        {customSidebar || (
          <OrderSidebar
            channelCode={channelCode}
          />
        )}
      </div>
    )

  const ContentUI = (
    <div style={contentColumnStyle}>
      {children}
    </div>
  )

  // SECTION 10 : RETURN

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        {HeaderUI}

        <section style={bodyStyle}>
          {SidebarUI}

          {ContentUI}
        </section>
      </section>
    </main>
  )
}

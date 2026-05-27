'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import type {
  CSSProperties
} from 'react'

import Image from 'next/image'

import {
  useParams,
  useRouter
} from 'next/navigation'

import type {
  ProfileDetailPayload
} from '@/lib/profile-summary-api'

import {
  getProfileByChannelCode
} from '@/lib/profile-summary-api'

function getChannelCodeFromParams(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0] || ''
  }

  return value || ''
}

export default function ClassicChannelPage() {
  const params =
    useParams()
  const router =
    useRouter()
  const channelCode =
    getChannelCodeFromParams(params?.channelCode)

  const [profile, setProfile] =
    useState<ProfileDetailPayload | null>(null)
  const [loading, setLoading] =
    useState(true)
  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    let cancelled =
      false

    async function loadProfile() {
      if (!channelCode) {
        setLoading(false)
        setErrorMessage('채널코드를 확인할 수 없습니다.')
        return
      }

      try {
        setLoading(true)
        setErrorMessage('')

        const nextProfile =
          await getProfileByChannelCode(channelCode)

        if (!cancelled) {
          setProfile(nextProfile)
        }
      } catch (error) {
        console.error('CLASSIC PROFILE LOAD FAILED', error)

        if (!cancelled) {
          setErrorMessage('채널 정보를 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [
    channelCode
  ])

  const displayName =
    profile?.displayName?.trim() ||
    profile?.channelName?.trim() ||
    '클래식 채널'
  const bio =
    profile?.bio?.trim() ||
    '브랜드 소개와 핵심 정보를 정돈해서 보여주는 유료 브랜딩형 채널입니다.'
  const address =
    useMemo(() => {
      const regionName =
        profile?.activityRegion?.fullName ||
        profile?.feedRegion?.fullName ||
        profile?.activityRegion?.name ||
        profile?.feedRegion?.name ||
        ''

      return [
        regionName,
        profile?.detailAddress
      ]
        .filter((value) => Boolean(value))
        .join(' ')
    }, [
      profile
    ])
  const phone =
    profile?.contactPhone?.trim() ||
    '전화번호 미등록'
  const businessHours =
    profile?.businessHours?.summary ||
    '영업시간 미등록'
  const heroImageUrl =
    profile?.heroImage?.imageUrl ||
    profile?.avatarImage?.imageUrl ||
    ''

  function handleOpenChannelGuide() {
    if (!channelCode) {
      return
    }

    router.push(`/channel/${channelCode}`)
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroCopyStyle}>
          <span style={eyebrowStyle}>
            CLASSIC CHANNEL
          </span>
          <h1 style={headingStyle}>
            {displayName}
          </h1>
          <p style={bioStyle}>
            {bio}
          </p>

          <div style={actionRowStyle}>
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={handleOpenChannelGuide}
            >
              매장안내
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handleOpenChannelGuide}
            >
              문의하기
            </button>
          </div>
        </div>

        <div style={heroImagePanelStyle}>
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={`${displayName} 대표 이미지`}
              fill
              sizes="(max-width: 768px) 92vw, 520px"
              style={imageStyle}
              unoptimized
            />
          ) : (
            <div style={fallbackImageStyle}>
              {displayName.slice(0, 1)}
            </div>
          )}
        </div>
      </section>

      <section style={contentGridStyle}>
        <article style={infoCardStyle}>
          <span style={cardLabelStyle}>
            주소
          </span>
          <strong style={cardValueStyle}>
            {address || '주소 미등록'}
          </strong>
        </article>

        <article style={infoCardStyle}>
          <span style={cardLabelStyle}>
            전화번호
          </span>
          <strong style={cardValueStyle}>
            {phone}
          </strong>
        </article>

        <article style={infoCardStyle}>
          <span style={cardLabelStyle}>
            영업시간
          </span>
          <strong style={cardValueStyle}>
            {businessHours}
          </strong>
        </article>
      </section>

      <section style={portfolioStyle}>
        <div>
          <span style={eyebrowStyle}>
            BRAND PORTFOLIO
          </span>
          <h2 style={sectionTitleStyle}>
            브랜드 포트폴리오
          </h2>
        </div>

        <div style={portfolioGridStyle}>
          {['브랜드 소개', '서비스 강점', '대표 작업'].map((title) => (
            <article
              key={title}
              style={portfolioCardStyle}
            >
              <span style={portfolioBadgeStyle}>
                CLASSIC
              </span>
              <strong>
                {title}
              </strong>
              <p>
                준비 중인 브랜딩 콘텐츠가 이 영역에 정돈되어 표시됩니다.
              </p>
            </article>
          ))}
        </div>
      </section>

      {loading ? (
        <div style={stateStyle}>
          채널 정보를 불러오는 중...
        </div>
      ) : null}

      {errorMessage ? (
        <div style={stateStyle}>
          {errorMessage}
        </div>
      ) : null}
    </main>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#f8fafc',
  color: '#111827',
  padding: '28px 16px 44px'
}

const heroStyle: CSSProperties = {
  width: 'min(1120px, 100%)',
  margin: '0 auto',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  background: '#ffffff',
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.1)',
  padding: 28,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
  gap: 28,
  alignItems: 'center'
}

const heroCopyStyle: CSSProperties = {
  display: 'grid',
  gap: 16
}

const eyebrowStyle: CSSProperties = {
  color: '#2563eb',
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 0
}

const headingStyle: CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 'clamp(34px, 5vw, 62px)',
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: 0
}

const bioStyle: CSSProperties = {
  maxWidth: 640,
  margin: 0,
  color: '#475569',
  fontSize: 17,
  lineHeight: 1.7,
  fontWeight: 700
}

const actionRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10
}

const primaryButtonStyle: CSSProperties = {
  minHeight: 46,
  border: 0,
  borderRadius: 999,
  background: '#111827',
  color: '#ffffff',
  padding: '0 20px',
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer'
}

const secondaryButtonStyle: CSSProperties = {
  minHeight: 46,
  border: '1px solid #cbd5e1',
  borderRadius: 999,
  background: '#ffffff',
  color: '#111827',
  padding: '0 20px',
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer'
}

const heroImagePanelStyle: CSSProperties = {
  position: 'relative',
  minHeight: 360,
  borderRadius: 22,
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #dbeafe, #eef2ff)'
}

const imageStyle: CSSProperties = {
  objectFit: 'cover'
}

const fallbackImageStyle: CSSProperties = {
  width: '100%',
  height: 360,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  background: 'linear-gradient(135deg, #0f172a, #2563eb)',
  fontSize: 72,
  fontWeight: 950
}

const contentGridStyle: CSSProperties = {
  width: 'min(1120px, 100%)',
  margin: '18px auto 0',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14
}

const infoCardStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  background: '#ffffff',
  padding: 18,
  display: 'grid',
  gap: 8
}

const cardLabelStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 900
}

const cardValueStyle: CSSProperties = {
  color: '#111827',
  fontSize: 15,
  lineHeight: 1.5,
  fontWeight: 900
}

const portfolioStyle: CSSProperties = {
  width: 'min(1120px, 100%)',
  margin: '18px auto 0',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  background: '#ffffff',
  padding: 24,
  display: 'grid',
  gap: 18
}

const sectionTitleStyle: CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 26,
  fontWeight: 950
}

const portfolioGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14
}

const portfolioCardStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  background: '#f8fafc',
  padding: 18,
  display: 'grid',
  gap: 10,
  color: '#334155',
  lineHeight: 1.55
}

const portfolioBadgeStyle: CSSProperties = {
  width: 'fit-content',
  borderRadius: 999,
  background: '#eff6ff',
  color: '#2563eb',
  padding: '5px 9px',
  fontSize: 11,
  fontWeight: 950
}

const stateStyle: CSSProperties = {
  width: 'min(1120px, 100%)',
  margin: '18px auto 0',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  background: '#ffffff',
  padding: 16,
  color: '#475569',
  fontSize: 14,
  fontWeight: 800,
  textAlign: 'center'
}

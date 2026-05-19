// FILE : frontend/app/(after-login)/profile/general/page.tsx
// ROOT : frontend/app/(after-login)/profile/general/page.tsx
// STATUS : MODIFY MODE
// ROLE : GENERAL PROFILE MANAGEMENT PAGE
// CHANGE SUMMARY :
// - GENERAL 메인 페이지 히어로 이미지 슬라이딩 상태 currentHeroIndex 추가
// - 히어로 이미지 좌우 슬라이딩 버튼 추가
// - 히어로 이미지 개수 표시 라운드 배지 1/5 구조 추가
// - 히어로 영역 마우스 오버 시 좌우 버튼 / 이미지 카운트 배지 투명 블랙 강조
// - 히어로 이미지 클릭 시 현재 선택된 이미지 기준으로 전체 이미지 뷰어 표시
// - 기존 HeroViewerUI / QRPopupUI / 탭 구조 유지
// - 프로필 헤더 영역을 오른쪽 정보 컬럼에서 제거 유지
// - 아바타 / 닉네임 / 일반계정 / 친구 / 게시물 정보를 히어로 이미지 하단 유지
// - 프로필 설정 / 게시글 사진 등록 / 공유 / QR코드 버튼을 프로필 헤더 하단에 유지
// - 왼쪽 관리 영역을 히어로 이미지 / 프로필 헤더 / 액션 버튼 구조로 유지
// - 오른쪽 영역은 정보 / 게시물 / 사진첩 탭과 탭 콘텐츠만 담당하도록 유지
// - heroViewerImages를 { imageUrl }[] 구조로 유지
// - ESC 닫기 / 배경 클릭 닫기 / 이전 / 다음 / 인디케이터 유지
// - QR코드 버튼 클릭 시 현재 페이지에서 QR 팝업 즉시 표시 유지
// - react-qr-code 기반 인라인 QR 팝업 유지
// - GeneralProfile 타입에 channelCode / channelURL / channelName 유지
// - 공유 버튼을 현재 프로필 URL 공유 / 클립보드 복사 구조로 유지
// - 게시글 / 사진 등록 버튼 이동 주소 /profile/general/create/select 유지
// - 프로필 설정 경로 /profile/general/profilesettings 유지
// - PublicGeneralPage.module.css 기반 CSS Module 구조 유지
// - PersonalInfo sections prop 타입을 ComponentProps로 역추출 유지
// - 전화 / 길찾기 / 지도보기 제거 유지
// - getMyProfile / useAuthGuard 기존 흐름 유지
// - API / DB / Service 영향 없음

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import type {
  ComponentProps,
  KeyboardEvent,
  MouseEvent
} from 'react'

import {
  useRouter
} from 'next/navigation'

import QRCode from 'react-qr-code'

import {
  getMyProfile
} from '@/lib/profileApi'

import {
  useAuthGuard
} from '@/lib/useAuthGuard'

import PersonalInfo from '../components/info/PersonalInfo'
import PersonalPosts from '../components/posts/PersonalPosts'
import PersonalPhotos from '../components/photos/PersonalPhotos'

import styles from './PublicGeneralPage.module.css'

// SECTION 02 : TYPE

type TabType =
  | 'info'
  | 'posts'
  | 'photos'

type HeroImage = {
  imageUrl: string
  sortOrder: number
}

type AvatarImage = {
  imageUrl: string
}

type ActivityRegion = {
  fullName?: string
}

type ViewerImage = {
  imageUrl: string
}

type PersonalInfoSections =
  NonNullable<ComponentProps<typeof PersonalInfo>['sections']>

type GeneralProfile = {
  id?: number
  profileType: 'GENERAL' | 'BUSINESS'
  displayName?: string
  bio?: string
  channelCode?: string
  channelURL?: string
  channelName?: string
  avatar?: AvatarImage | null
  heroImages?: HeroImage[]
  activityRegion?: ActivityRegion | null
  blocks?: PersonalInfoSections
}

type GetMyProfileResponse = {
  profile: GeneralProfile
}

type TabItem = {
  key: TabType
  label: string
}

type HeroControlHoverType =
  | 'prev'
  | 'next'
  | null

// SECTION 03 : CONSTANT

const GENERAL_TABS: TabItem[] = [
  {
    key: 'info',
    label: '정보'
  },
  {
    key: 'posts',
    label: '게시물'
  },
  {
    key: 'photos',
    label: '사진첩'
  }
]

const DEFAULT_PROFILE_NAME =
  '일반 프로필'

const DEFAULT_PROFILE_TYPE_LABEL =
  '일반계정'

const DEFAULT_FRIEND_COUNT =
  0

const DEFAULT_POST_COUNT =
  0

const PROFILE_SETTINGS_PATH =
  '/profile/general/profilesettings'

const GENERAL_CONTENT_CREATE_PATH =
  '/profile/general/create/select'

const DEFAULT_CHANNEL_URL =
  'xxx.com/@unknown'

// SECTION 04 : COMPONENT

export default function GeneralProfilePage() {
  useAuthGuard()

  const router =
    useRouter()

  const [profile, setProfile] =
    useState<GeneralProfile | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [activeTab, setActiveTab] =
    useState<TabType>('info')

  const [isQrPopupOpen, setQrPopupOpen] =
    useState(false)

  const [isHeroViewerOpen, setHeroViewerOpen] =
    useState(false)

  const [heroViewerIndex, setHeroViewerIndex] =
    useState(0)

  const [currentHeroIndex, setCurrentHeroIndex] =
    useState(0)

  const [isHeroHovered, setHeroHovered] =
    useState(false)

  const [heroControlHover, setHeroControlHover] =
    useState<HeroControlHoverType>(null)

  const contentRef =
    useRef<HTMLDivElement | null>(null)

  // SECTION 05 : EFFECT

  useEffect(() => {
    let cancelled =
      false

    async function fetchData() {
      try {
        const data =
          await getMyProfile() as GetMyProfileResponse

        if (cancelled) {
          return
        }

        if (data.profile.profileType !== 'GENERAL') {
          router.replace(PROFILE_SETTINGS_PATH)
          return
        }

        setProfile(data.profile)
        setLoading(false)
      } catch {
        router.replace('/')
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [
    router
  ])

  useEffect(() => {
    function handleKeyDown(
      event: globalThis.KeyboardEvent
    ) {
      if (event.key === 'Escape') {
        setHeroViewerOpen(false)
      }
    }

    if (isHeroViewerOpen) {
      window.addEventListener(
        'keydown',
        handleKeyDown
      )

      document.body.style.overflow =
        'hidden'
    }

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )

      document.body.style.overflow =
        ''
    }
  }, [
    isHeroViewerOpen
  ])

  // SECTION 06 : DATA

  const sortedHeroImages =
    useMemo(() => {
      if (!profile?.heroImages) {
        return []
      }

      return profile.heroImages
        .slice()
        .sort((a, b) => {
          return a.sortOrder - b.sortOrder
        })
    }, [
      profile?.heroImages
    ])

  const heroImages =
    useMemo(() => {
      return sortedHeroImages
        .map((heroImage) => heroImage.imageUrl)
        .filter((imageUrl) => {
          return Boolean(imageUrl)
        })
    }, [
      sortedHeroImages
    ])

  const heroImageCount =
    useMemo(() => {
      return heroImages.length
    }, [
      heroImages.length
    ])

  const hasMultipleHeroImages =
    useMemo(() => {
      return heroImageCount > 1
    }, [
      heroImageCount
    ])

  const heroViewerImages =
    useMemo<ViewerImage[]>(() => {
      return sortedHeroImages
        .filter((heroImage) => Boolean(heroImage.imageUrl))
        .map((heroImage) => ({
          imageUrl: heroImage.imageUrl
        }))
    }, [
      sortedHeroImages
    ])

  const heroImageUrl =
    useMemo(() => {
      return heroImages[currentHeroIndex] || ''
    }, [
      heroImages,
      currentHeroIndex
    ])

  const currentHeroViewerImage =
    useMemo(() => {
      return heroViewerImages[heroViewerIndex] || null
    }, [
      heroViewerImages,
      heroViewerIndex
    ])

  const profileImage =
    useMemo(() => {
      return (
        profile?.avatar?.imageUrl ||
        heroImageUrl ||
        ''
      )
    }, [
      profile,
      heroImageUrl
    ])

  const displayName =
    useMemo(() => {
      return profile?.displayName || DEFAULT_PROFILE_NAME
    }, [
      profile?.displayName
    ])

  const regionText =
    useMemo(() => {
      return profile?.activityRegion?.fullName || ''
    }, [
      profile?.activityRegion
    ])

  const profileBlocks =
    useMemo<PersonalInfoSections>(() => {
      return profile?.blocks || []
    }, [
      profile?.blocks
    ])

  const channelShareUrl =
    useMemo(() => {
      if (profile?.channelURL) {
        return profile.channelURL
      }

      if (profile?.channelCode) {
        return `xxx.com/@${profile.channelCode}`
      }

      return DEFAULT_CHANNEL_URL
    }, [
      profile?.channelURL,
      profile?.channelCode
    ])

  // SECTION 07 : STYLE DATA

  const heroControlBaseOpacity =
    isHeroHovered
      ? 1
      : 0.38

  const heroCountOpacity =
    isHeroHovered
      ? 1
      : 0.68

  const heroPrevButtonBackground =
    heroControlHover === 'prev'
      ? 'rgba(0, 0, 0, 0.78)'
      : isHeroHovered
        ? 'rgba(0, 0, 0, 0.58)'
        : 'rgba(0, 0, 0, 0.26)'

  const heroNextButtonBackground =
    heroControlHover === 'next'
      ? 'rgba(0, 0, 0, 0.78)'
      : isHeroHovered
        ? 'rgba(0, 0, 0, 0.58)'
        : 'rgba(0, 0, 0, 0.26)'

  const heroCountBackground =
    isHeroHovered
      ? 'rgba(0, 0, 0, 0.68)'
      : 'rgba(0, 0, 0, 0.42)'

  // SECTION 08 : EVENT

  function handleTabClick(
    tab: TabType
  ) {
    setActiveTab(tab)
  }

  function handleOpenProfileSettings() {
    router.push(PROFILE_SETTINGS_PATH)
  }

  function handleOpenCreateContent() {
    router.push(GENERAL_CONTENT_CREATE_PATH)
  }

  async function handleShareProfile() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: displayName,
          text: `${displayName} RAPUS 프로필`,
          url: channelShareUrl
        })

        return
      }

      await navigator.clipboard.writeText(channelShareUrl)
      alert('프로필 주소가 복사되었습니다.')
    } catch {
      return
    }
  }

  function handleOpenQrCode() {
    setQrPopupOpen(true)
  }

  function handleCloseQrCode() {
    setQrPopupOpen(false)
  }

  function handleOpenHeroViewer(
    index: number
  ) {
    if (heroViewerImages.length === 0) {
      return
    }

    setHeroViewerIndex(index)
    setHeroViewerOpen(true)
  }

  function handleCloseHeroViewer() {
    setHeroViewerOpen(false)
  }

  function handleHeroViewerPrev() {
    setHeroViewerIndex((currentIndex) => {
      return Math.max(
        currentIndex - 1,
        0
      )
    })
  }

  function handleHeroViewerNext() {
    setHeroViewerIndex((currentIndex) => {
      return Math.min(
        currentIndex + 1,
        heroViewerImages.length - 1
      )
    })
  }

  function handlePrevHeroImage(
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation()

    if (!hasMultipleHeroImages) {
      return
    }

    setCurrentHeroIndex((prev) => {
      if (prev <= 0) {
        return heroImageCount - 1
      }

      return prev - 1
    })
  }

  function handleNextHeroImage(
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation()

    if (!hasMultipleHeroImages) {
      return
    }

    setCurrentHeroIndex((prev) => {
      if (prev >= heroImageCount - 1) {
        return 0
      }

      return prev + 1
    })
  }

  function handleHeroMouseEnter() {
    setHeroHovered(true)
  }

  function handleHeroMouseLeave() {
    setHeroHovered(false)
    setHeroControlHover(null)
  }

  function handlePrevControlMouseEnter() {
    setHeroControlHover('prev')
  }

  function handleNextControlMouseEnter() {
    setHeroControlHover('next')
  }

  function handleControlMouseLeave() {
    setHeroControlHover(null)
  }

  function handleHeroImageKeyDown(
    event: KeyboardEvent<HTMLDivElement>
  ) {
    if (
      event.key !== 'Enter' &&
      event.key !== ' '
    ) {
      return
    }

    event.preventDefault()
    handleOpenHeroViewer(currentHeroIndex)
  }

  // SECTION 09 : EFFECT SYNC

  useEffect(() => {
    if (heroImages.length === 0) {
      setCurrentHeroIndex(0)
      return
    }

    if (currentHeroIndex > heroImages.length - 1) {
      setCurrentHeroIndex(0)
    }
  }, [
    heroImages.length,
    currentHeroIndex
  ])

  // SECTION 10 : LOADING

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingBox}>
          로딩중...
        </div>
      </main>
    )
  }

  if (!profile) {
    return null
  }

  // SECTION 11 : UI BLOCK

  const ProfileHeaderUI = (
    <div className={styles.profileHead}>
      <div className={styles.profileTopLine}>
        <div className={styles.avatarFrame}>
          {profileImage ? (
            <img
              src={profileImage}
              alt={`${displayName} 프로필 이미지`}
              className={styles.avatarImage}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              프로필
            </div>
          )}
        </div>

        <div className={styles.profileTextBlock}>
          <div className={styles.profileMeta}>
            <h1 className={styles.profileName}>
              {displayName}
            </h1>

            <span className={styles.profileTypeLabel}>
              {DEFAULT_PROFILE_TYPE_LABEL}
            </span>
          </div>

          <div className={styles.profileSubLine}>
            {regionText && (
              <span className={styles.regionText}>
                {regionText}
              </span>
            )}

            <span className={styles.friendText}>
              친구 {DEFAULT_FRIEND_COUNT.toLocaleString()}
            </span>

            <span className={styles.postText}>
              게시물 {DEFAULT_POST_COUNT.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const ActionUI = (
    <div className={styles.actionGroup}>
      <button
        type="button"
        className={styles.actionButton}
        onClick={handleOpenProfileSettings}
      >
        프로필 설정
      </button>

      <button
        type="button"
        className={styles.actionButton}
        onClick={handleOpenCreateContent}
      >
        게시글 / 사진 등록
      </button>

      <button
        type="button"
        className={styles.actionButton}
        onClick={handleShareProfile}
      >
        공유
      </button>

      <button
        type="button"
        className={styles.actionButton}
        onClick={handleOpenQrCode}
      >
        QR코드
      </button>
    </div>
  )

  const HeroImageUI = (
    <section className={styles.mediaColumn}>
      <div
        className={styles.heroImage}
        role={heroImageUrl ? 'button' : undefined}
        tabIndex={heroImageUrl ? 0 : undefined}
        onClick={() => {
          if (heroImageUrl) {
            handleOpenHeroViewer(currentHeroIndex)
          }
        }}
        onKeyDown={handleHeroImageKeyDown}
        onMouseEnter={handleHeroMouseEnter}
        onMouseLeave={handleHeroMouseLeave}
        style={{
          position: 'relative',
          cursor: heroImageUrl ? 'zoom-in' : 'default'
        }}
      >
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={`${displayName} 대표 이미지`}
            className={styles.heroImageFile}
          />
        ) : (
          <div className={styles.heroPlaceholder}>
            대표 이미지 영역
          </div>
        )}

        {hasMultipleHeroImages && (
          <>
            <button
              type="button"
              onClick={handlePrevHeroImage}
              onMouseEnter={handlePrevControlMouseEnter}
              onMouseLeave={handleControlMouseLeave}
              aria-label="이전 대표 이미지"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                zIndex: 3,
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.62)',
                borderRadius: 999,
                background: heroPrevButtonBackground,
                color: '#ffffff',
                fontSize: 28,
                fontWeight: 900,
                lineHeight: 1,
                opacity: heroControlBaseOpacity,
                cursor: 'pointer',
                transform: 'translateY(-50%)',
                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.22)',
                backdropFilter: 'blur(6px)',
                transition:
                  'opacity 0.16s ease, background 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease'
              }}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={handleNextHeroImage}
              onMouseEnter={handleNextControlMouseEnter}
              onMouseLeave={handleControlMouseLeave}
              aria-label="다음 대표 이미지"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                zIndex: 3,
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.62)',
                borderRadius: 999,
                background: heroNextButtonBackground,
                color: '#ffffff',
                fontSize: 28,
                fontWeight: 900,
                lineHeight: 1,
                opacity: heroControlBaseOpacity,
                cursor: 'pointer',
                transform: 'translateY(-50%)',
                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.22)',
                backdropFilter: 'blur(6px)',
                transition:
                  'opacity 0.16s ease, background 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease'
              }}
            >
              ›
            </button>

            <div
              aria-label="대표 이미지 개수"
              style={{
                position: 'absolute',
                right: 14,
                bottom: 14,
                zIndex: 3,
                minWidth: 54,
                height: 30,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 12px',
                border: '1px solid rgba(255, 255, 255, 0.58)',
                borderRadius: 999,
                background: heroCountBackground,
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 900,
                lineHeight: 1,
                opacity: heroCountOpacity,
                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.22)',
                backdropFilter: 'blur(6px)',
                transition:
                  'opacity 0.16s ease, background 0.16s ease, box-shadow 0.16s ease'
              }}
            >
              {currentHeroIndex + 1}/{heroImageCount}
            </div>
          </>
        )}
      </div>

      <div className={styles.mediaProfileBlock}>
        {ProfileHeaderUI}

        {ActionUI}
      </div>
    </section>
  )

  const TabBarUI = (
    <nav className={styles.menuBar}>
      {GENERAL_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={
            activeTab === tab.key
              ? `${styles.menuButton} ${styles.activeMenuButton}`
              : styles.menuButton
          }
          onClick={() => handleTabClick(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )

  const ActiveContentUI = (
    <section
      ref={contentRef}
      className={styles.contentPanel}
    >
      {activeTab === 'info' && (
        <PersonalInfo
          bio={profile.bio}
          sections={profileBlocks}
        />
      )}

      {activeTab === 'posts' && (
        <PersonalPosts />
      )}

      {activeTab === 'photos' && (
        <PersonalPhotos />
      )}
    </section>
  )

  const HeroViewerUI =
    isHeroViewerOpen &&
    currentHeroViewerImage &&
    (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="대표 이미지 보기"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={handleCloseHeroViewer}
      >
        <button
          type="button"
          aria-label="이미지 보기 닫기"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 44,
            height: 44,
            border: 0,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            lineHeight: 1,
            cursor: 'pointer',
            zIndex: 100000
          }}
          onClick={(event) => {
            event.stopPropagation()
            handleCloseHeroViewer()
          }}
        >
          ×
        </button>

        {heroViewerIndex > 0 && (
          <button
            type="button"
            aria-label="이전 이미지"
            onClick={(event) => {
              event.stopPropagation()
              handleHeroViewerPrev()
            }}
            style={{
              position: 'absolute',
              left: 20,
              top: '50%',
              width: 54,
              height: 54,
              border: 0,
              borderRadius: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.42)',
              color: '#ffffff',
              fontSize: 48,
              lineHeight: 1,
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            ‹
          </button>
        )}

        <img
          src={currentHeroViewerImage.imageUrl}
          alt={`${displayName} 대표 이미지 ${heroViewerIndex + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          onClick={(event) => {
            event.stopPropagation()
          }}
        />

        {heroViewerIndex < heroViewerImages.length - 1 && (
          <button
            type="button"
            aria-label="다음 이미지"
            onClick={(event) => {
              event.stopPropagation()
              handleHeroViewerNext()
            }}
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              width: 54,
              height: 54,
              border: 0,
              borderRadius: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.42)',
              color: '#ffffff',
              fontSize: 48,
              lineHeight: 1,
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            ›
          </button>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 20,
            width: '100%',
            textAlign: 'center',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 700
          }}
        >
          {heroViewerIndex + 1} / {heroViewerImages.length}
        </div>
      </div>
    )

  const QRPopupUI =
    isQrPopupOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="프로필 QR코드"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'rgba(15, 23, 42, 0.72)'
        }}
        onClick={handleCloseQrCode}
      >
        <div
          style={{
            width: 330,
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            padding: 24,
            borderRadius: 26,
            background: '#ffffff',
            boxShadow: '0 28px 90px rgba(0,0,0,0.32)'
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: 2,
              background: 'linear-gradient(90deg,#1877f2,#22c55e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            RAPUS
          </div>

          <div
            style={{
              color: '#111827',
              fontSize: 16,
              fontWeight: 900,
              textAlign: 'center',
              wordBreak: 'break-word'
            }}
          >
            {displayName}
          </div>

          <div
            style={{
              padding: 18,
              border: '1px solid #eef2f7',
              borderRadius: 22,
              background: '#ffffff',
              boxShadow: '0 12px 34px rgba(15, 23, 42, 0.08)'
            }}
          >
            <QRCode
              value={channelShareUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#111827"
            />
          </div>

          <div
            style={{
              width: '100%',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.45,
              textAlign: 'center',
              wordBreak: 'break-all'
            }}
          >
            {channelShareUrl}
          </div>

          <button
            type="button"
            onClick={handleCloseQrCode}
            style={{
              width: '100%',
              height: 42,
              border: 0,
              borderRadius: 999,
              background: '#111827',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            닫기
          </button>
        </div>
      </div>
    )

  const MainUI = (
    <section className={styles.shell}>
      <section className={styles.detailGrid}>
        {HeroImageUI}

        <section className={styles.infoColumn}>
          {TabBarUI}

          {ActiveContentUI}
        </section>
      </section>
    </section>
  )

  // SECTION 12 : RETURN

  return (
    <main className={styles.page}>
      {MainUI}

      {HeroViewerUI}

      {QRPopupUI}
    </main>
  )
}

// SECTION FINAL : VALIDATION

/*
VALIDATION:
- ROOT 포함 완료
- 단일 page.tsx 통코드 출력 완료
- SECTION 구조 유지 완료
- GENERAL 히어로 이미지 currentHeroIndex 슬라이드 상태 추가 완료
- GENERAL 히어로 좌우 슬라이드 버튼 추가 완료
- GENERAL 히어로 이미지 1/N 라운드 카운트 배지 추가 완료
- 마우스 오버 시 투명 블랙 버튼 / 배지 강조 적용 완료
- 히어로 이미지 클릭 시 현재 선택 이미지 기준 뷰어 연결 완료
- 기존 QR 팝업 유지 완료
- 기존 getMyProfile / useAuthGuard 흐름 유지 완료
- API / DB / Service 변경 없음
*/
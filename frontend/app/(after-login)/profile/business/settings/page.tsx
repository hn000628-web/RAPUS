// FILE : frontend/app/(after-login)/profile/business/settings/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/settings/page.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE SETTINGS PAGE
// CHANGE SUMMARY :
// - GENERAL ?꾨줈???ㅼ젙 ?섏씠吏? ?숈씪??吏곸젒 JSX 湲곕컲 2而щ읆 UI 援ъ“濡?蹂寃?
// - CoverSection / AvatarSection ?섏〈 ?쒓굅
// - ?덉뼱濡?誘몃━蹂닿린 ?곸뿭??button 援ъ“濡?蹂寃?
// - ?꾨컮? 誘몃━蹂닿린 ?곸뿭??button 援ъ“濡?蹂寃?
// - ?꾨컮? 1/2 ?덉뼱濡?嫄몄묠 援ъ“瑜?GENERAL怨??숈씪?섍쾶 ?곸슜
// - ?쇱そ ?꾨줈??誘몃━蹂닿린 / ?ㅼ젙 ?곹깭???좎?
// - 오른쪽 기존 BasicAccountSection 구조 유지
// - channelURL? xxx.com/@channelCode 怨좎젙 ?먯튃 ?좎?
// - 梨꾨꼸 ID??channelName?쇰줈留????
// - 湲곗〈 getMe / getProfileByChannelCode / getBusinessProfileDetail ?먮쫫 ?좎?
// - 湲곗〈 getCurrentBusinessIndustry / getBusinessHoursSetting ?먮쫫 ?좎?
// - 湲곗〈 updateBusinessProfileCore / updateBusinessChannelRegion / updateBusinessFields ?먮쫫 ?좎?
// - 湲곗〈 updateBusinessHours / replaceBusinessInfoBlocks ????먮쫫 ?좎?
// - API / DB / Service ?좉퇋 ?곹뼢 ?놁쓬

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import BasicAccountSection from './components/BasicAccountSection'

import {
  getMe
} from '@/lib/authApi'

import {
  getProfileByChannelCode
} from '@/lib/profile-summary-api'

import {
  getCurrentBusinessIndustry
} from '@/lib/business/business-industry-api'

import {
  getBusinessProfileDetail,
  updateBusinessProfileCore,
  type BusinessProfileDetail,
  type BusinessBlock,
  type BusinessHoursState,
  type DayKey
} from '@/lib/business/profile-settings-api'

import {
  getBusinessHoursSetting
} from '@/lib/business/business-hours-api'

import styles from './BusinessProfileSettingsPage.module.css'

// SECTION 02 : TYPE

type SettingStatusItem = {
  key: string
  label: string
  completed: boolean
}

type ProfileSummaryLike = {
  displayName?: string | null
  bio?: string | null
  contactPhone?: string | null
  channelName?: string | null
  channelURL?: string | null
  businessTypeCode?: 'STORE' | 'FREELANCER' | 'MOBILE_BIZ' | null
  primaryIndustryId?: number | null
  primaryIndustrySubtypeId?: number | null
}

// SECTION 03 : CONSTANT

const DEFAULT_DISPLAY_NAME =
  '비지니스 이름 없음'

const DEFAULT_REGION_NAME =
  '지역 미설정'

const DEFAULT_EMPTY_TEXT =
  '미설정'

const DEFAULT_HOURS_SUMMARY =
  '영업시간 미설정'

const BUSINESS_PROFILE_PATH =
  '/profile/business'

const BUSINESS_CHANNEL_SETTINGS_PATH =
  '/profile/business/settings/channel'

const BUSINESS_MENU_SETTINGS_PATH =
  '/profile/business/menu-config'

const BUSINESS_HERO_SETTINGS_PATH =
  '/profile/business/settings/hero'

const BUSINESS_AVATAR_SETTINGS_PATH =
  '/profile/business/settings/avatar'

const DAYS: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
]

const DAY_LABELS: Record<DayKey, string> = {
  sunday: '일요일',
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일'
}

// SECTION 04 : COMPONENT

export default function BusinessProfileSettingsPage() {
  const router =
    useRouter()

  // SECTION 05 : STATE

  const [profileId, setProfileId] =
    useState<number | null>(null)

  const [channelCode, setChannelCode] =
    useState<string | null>(null)

  const [channelId, setChannelId] =
    useState<string | null>(null)

  const [displayName, setDisplayName] =
    useState(DEFAULT_DISPLAY_NAME)

  const [bio, setBio] =
    useState('')

  const [contactPhone, setContactPhone] =
    useState('')

  const [slug, setSlug] =
    useState('')

  const [industryId, setIndustryId] =
    useState<number | null>(null)

  const [subtypeId, setSubtypeId] =
    useState<number | null>(null)

  const [customIndustry, setCustomIndustry] =
    useState('')

  const [businessTypeCode, setBusinessTypeCode] =
    useState<'STORE' | 'FREELANCER' | 'MOBILE_BIZ' | null>(null)

  const [displayIndustryLabel, setDisplayIndustryLabel] =
    useState('')

  const [regionName, setRegionName] =
    useState(DEFAULT_REGION_NAME)

  const [regionDetailAddress, setRegionDetailAddress] =
    useState('')

  const [heroImages, setHeroImages] =
    useState<string[]>([])

  const [profileImage, setProfileImage] =
    useState<string | null>(null)

  const [blocks, setBlocks] =
    useState<BusinessBlock[]>([])

  const [businessHours, setBusinessHours] =
    useState<BusinessHoursState | null>(null)

  const [, setBusinessHoursTemporaryClosed] =
    useState<0 | 1>(0)

  const [, setBusinessHoursIsOpenNow] =
    useState(false)

  const [businessHoursSummary, setBusinessHoursSummary] =
    useState<string>(DEFAULT_HOURS_SUMMARY)

  const [saving, setSaving] =
    useState(false)

  const [saved, setSaved] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  // SECTION 06 : DATA

  const heroImageUrl =
    useMemo(() => {
      return heroImages[0] || ''
    }, [
      heroImages
    ])

  const profileImageUrl =
    useMemo(() => {
      return (
        profileImage ||
        heroImageUrl ||
        ''
      )
    }, [
      profileImage,
      heroImageUrl
    ])

  const displayChannelCode =
    useMemo(() => {
      return channelCode || DEFAULT_EMPTY_TEXT
    }, [
      channelCode
    ])

  const fixedChannelURL =
    useMemo(() => {
      if (!channelCode) {
        return ''
      }

      return `xxx.com/@${channelCode}`
    }, [
      channelCode
    ])

  const industryText =
    useMemo(() => {
      const businessTypeLabel =
        businessTypeCodeToLabel(businessTypeCode)

      const industryLabel =
        displayIndustryLabel.trim()

      if (businessTypeLabel && industryLabel) {
        return `${businessTypeLabel}&${industryLabel}`
      }

      if (businessTypeLabel) {
        return businessTypeLabel
      }

      if (industryLabel) {
        return industryLabel
      }

      return customIndustry.trim()
    }, [
      businessTypeCode,
      displayIndustryLabel,
      customIndustry,
    ])

  const settingStatusItems =
    useMemo<SettingStatusItem[]>(() => {
      return [
        {
          key: 'displayName',
          label: '상호명',
          completed:
            displayName.trim() !== '' &&
            displayName !== DEFAULT_DISPLAY_NAME
        },
        {
          key: 'hero',
          label: '히어로 이미지',
          completed:
            heroImages.length > 0
        },
        {
          key: 'avatar',
          label: '프로필 이미지',
          completed:
            Boolean(profileImage)
        },
        {
          key: 'industry',
          label: '업종',
          completed:
            Boolean(industryId || subtypeId || customIndustry.trim())
        },
        {
          key: 'region',
          label: '지역',
          completed:
            regionName.trim() !== '' &&
            regionName !== DEFAULT_REGION_NAME
        },
        {
          key: 'phone',
          label: '연락처',
          completed:
            contactPhone.trim() !== ''
        },
        {
          key: 'hours',
          label: '영업시간',
          completed:
            businessHoursSummary !== DEFAULT_HOURS_SUMMARY
        }
      ]
    }, [
      displayName,
      heroImages.length,
      profileImage,
      industryId,
      subtypeId,
      customIndustry,
      regionName,
      contactPhone,
      businessHoursSummary
    ])

  const completedStatusCount =
    useMemo(() => {
      return settingStatusItems
        .filter((item) => item.completed)
        .length
    }, [
      settingStatusItems
    ])

  const completionPercent =
    useMemo(() => {
      if (settingStatusItems.length === 0) {
        return 0
      }

      return Math.round(
        completedStatusCount / settingStatusItems.length * 100
      )
    }, [
      completedStatusCount,
      settingStatusItems.length
    ])

  const heroBusinessStatusText =
    useMemo(() => {
      if (!businessHoursSummary || businessHoursSummary === DEFAULT_HOURS_SUMMARY) {
        return '영업상태 미설정'
      }

      return businessHoursSummary
    }, [
      businessHoursSummary
    ])

  // SECTION 07 : FUNCTION

  function normalizeMediaUrl(
    value?: string | null
  ) {
    if (!value) {
      return null
    }

    if (/^(https?:|blob:)/.test(value)) {
      return value
    }

    if (value.startsWith('/')) {
      return value
    }

    return `/media/${value}`
  }

  function resolveAvatarImage(
    media?: BusinessProfileDetail['media']
  ) {
    if (!media?.avatar) {
      return null
    }

    return (
      normalizeMediaUrl(media.avatar.imageUrl) ??
      normalizeMediaUrl(media.avatar.filePath)
    )
  }

  function resolveHeroImages(
    media?: BusinessProfileDetail['media']
  ) {
    if (!media?.heroImages?.length) {
      return []
    }

    return media.heroImages
      .map((item) => {
        return (
          normalizeMediaUrl(item.imageUrl) ??
          normalizeMediaUrl(item.filePath)
        )
      })
      .filter((url): url is string => {
        return Boolean(url)
      })
  }

  function normalizeChannelName(
    summary: ProfileSummaryLike,
    fallbackChannelCode: string
  ) {
    const rawChannelName =
      summary.channelName?.trim() || ''

    if (rawChannelName) {
      return rawChannelName
    }

    const rawChannelURL =
      summary.channelURL?.trim() || ''

    if (!rawChannelURL) {
      return fallbackChannelCode
    }

    if (rawChannelURL.startsWith('xxx.com/@')) {
      return fallbackChannelCode
    }

    if (rawChannelURL.includes('/@')) {
      const parts =
        rawChannelURL.split('/@')

      return parts[1]?.trim() || fallbackChannelCode
    }

    if (rawChannelURL.startsWith('@')) {
      return rawChannelURL.replace(/^@/, '').trim() || fallbackChannelCode
    }

    return rawChannelURL
  }

  function generateTodaySummary(
    hours: BusinessHoursState | null,
    temporaryClosed: 0 | 1,
    isOpenNow: boolean
  ) {
    if (!hours) {
      return DEFAULT_HOURS_SUMMARY
    }

    const dayKey =
      DAYS[new Date().getDay()]

    const today =
      hours[dayKey]

    const dayLabel =
      DAY_LABELS[dayKey]

    if (temporaryClosed === 1) {
      return '영업종료'
    }

    if (today.isClosed) {
      return `${dayLabel} · 휴무`
    }

    const status =
      isOpenNow
        ? '영업중'
        : '영업종료'

    const startTime =
      today.startTime || '--:--'

    const endTime =
      today.endTime || '--:--'

    if (!today.startTime || !today.endTime) {
      return `${status} ${dayLabel} 오픈 : ${startTime} - 마감 : ${endTime}`
    }

    return `${status} ${dayLabel} 오픈 : ${today.startTime} - 마감 : ${today.endTime}`
  }

  function formatIndustryLabel(
    industryName?: string | null,
    subtypeName?: string | null
  ) {
    const safeIndustryName =
      industryName?.trim() ?? ''

    const safeSubtypeName =
      subtypeName?.trim() ?? ''

    const hasKorean = (value: string) => /[가-힣]/.test(value)

    if (safeIndustryName && safeSubtypeName) {
      const industryIsKo = hasKorean(safeIndustryName)
      const subtypeIsKo = hasKorean(safeSubtypeName)

      if (!industryIsKo && subtypeIsKo) {
        return `${safeSubtypeName}(${safeIndustryName})`
      }

      if (industryIsKo && !subtypeIsKo) {
        return `${safeIndustryName}(${safeSubtypeName})`
      }

      return `${safeSubtypeName}(${safeIndustryName})`
    }

    if (safeSubtypeName) {
      return safeSubtypeName
    }

    if (safeIndustryName) {
      return safeIndustryName
    }

    return ''
  }

  function businessTypeCodeToLabel(
    typeCode?: 'STORE' | 'FREELANCER' | 'MOBILE_BIZ' | null
  ) {
    if (typeCode === 'STORE') {
      return '스토어'
    }

    if (typeCode === 'FREELANCER') {
      return '프리렌서'
    }

    if (typeCode === 'MOBILE_BIZ') {
      return '이동형'
    }

    return ''
  }

  // SECTION 08 : API FUNCTION

  async function loadProfile() {
    try {
      setLoading(true)

      const me =
        await getMe()

      const currentChannelCode =
        me.user?.channelCode

      if (!currentChannelCode) {
        throw new Error('채널코드 없음')
      }

      const detail: BusinessProfileDetail =
        await getBusinessProfileDetail(currentChannelCode)

      let summary: ProfileSummaryLike = {}
      try {
        summary =
          await getProfileByChannelCode(currentChannelCode) as ProfileSummaryLike
      } catch (error) {
        console.warn(
          'BUSINESS SETTINGS SUMMARY LOAD SKIPPED',
          error
        )
      }

      let currentIndustry: Awaited<ReturnType<typeof getCurrentBusinessIndustry>> | null =
        null
      try {
        currentIndustry =
          await getCurrentBusinessIndustry(currentChannelCode)
      } catch (error) {
        console.warn(
          'BUSINESS SETTINGS INDUSTRY LOAD SKIPPED',
          error
        )
      }

      const resolvedProfileId =
        detail.profile.id ||
        me.user?.profileId ||
        null

      const resolvedChannelCode =
        detail.profile.channelCode ||
        currentChannelCode ||
        null

      setProfileId(resolvedProfileId)
      setChannelCode(resolvedChannelCode)
      setChannelId(resolvedChannelCode)

      setDisplayName(
        summary.displayName ??
        detail.profile.displayName ??
        DEFAULT_DISPLAY_NAME
      )

      setBio(
        summary.bio ??
        detail.profile.bio ??
        ''
      )

      setContactPhone(
        summary.contactPhone ??
        detail.placeMeta.contactPhone ??
        ''
      )

      setSlug(
        normalizeChannelName(
          summary,
          resolvedChannelCode || currentChannelCode
        )
      )

      const resolvedIndustryId =
        currentIndustry?.current.industryId ??
        summary.primaryIndustryId ??
        detail.profile.primaryIndustryId ??
        null

      const resolvedSubtypeId =
        currentIndustry?.current.industrySubtypeId ??
        summary.primaryIndustrySubtypeId ??
        detail.profile.primaryIndustrySubtypeId ??
        null

      const resolvedIndustryLabel =
        formatIndustryLabel(
          currentIndustry?.current.industryName,
          currentIndustry?.current.industrySubtypeName
        )

      const resolvedBusinessTypeCode =
        (currentIndustry?.current as {
          businessTypeCode?: 'STORE' | 'FREELANCER' | 'MOBILE_BIZ' | null
        } | undefined)?.businessTypeCode ||
        summary.businessTypeCode ||
        null

      const resolvedBusinessTypeLabel =
        businessTypeCodeToLabel(resolvedBusinessTypeCode)

      const resolvedCombinedIndustryLabel =
        resolvedBusinessTypeLabel && resolvedIndustryLabel
          ? `${resolvedBusinessTypeLabel}&${resolvedIndustryLabel}`
          : resolvedBusinessTypeLabel || resolvedIndustryLabel

      setIndustryId(resolvedIndustryId)
      setSubtypeId(resolvedSubtypeId)
      setBusinessTypeCode(resolvedBusinessTypeCode)
      setDisplayIndustryLabel(resolvedIndustryLabel)

      setCustomIndustry(
        resolvedCombinedIndustryLabel
      )

      setBlocks(
        detail.infoBlocks ?? []
      )

      setRegionDetailAddress(
        detail.placeMeta.detailAddress ?? ''
      )

      setRegionName(
        detail.placeMeta.activityRegion?.fullName ??
        detail.placeMeta.feedRegion?.fullName ??
        DEFAULT_REGION_NAME
      )

      setProfileImage(
        resolveAvatarImage(detail.media)
      )

      setHeroImages(
        resolveHeroImages(detail.media)
      )

      if (resolvedProfileId && resolvedChannelCode) {
        try {
          const hoursData =
            await getBusinessHoursSetting(
              resolvedProfileId,
              resolvedChannelCode
            )

          const normalizedHours: BusinessHoursState = {
            sunday: hoursData.sunday,
            monday: hoursData.monday,
            tuesday: hoursData.tuesday,
            wednesday: hoursData.wednesday,
            thursday: hoursData.thursday,
            friday: hoursData.friday,
            saturday: hoursData.saturday
          }

          setBusinessHours(normalizedHours)
          setBusinessHoursTemporaryClosed(
            hoursData.temporaryClosed === 1 ? 1 : 0
          )
          setBusinessHoursIsOpenNow(
            Boolean(hoursData.isOpenNow)
          )
          setBusinessHoursSummary(
            generateTodaySummary(
              normalizedHours,
              hoursData.temporaryClosed === 1 ? 1 : 0,
              Boolean(hoursData.isOpenNow)
            )
          )
        } catch (error) {
          console.warn(
            'BUSINESS SETTINGS HOURS LOAD SKIPPED',
            error
          )
          setBusinessHours(null)
          setBusinessHoursSummary(DEFAULT_HOURS_SUMMARY)
        }
      } else {
        console.warn('BUSINESS SETTINGS CONTEXT PARTIAL', {
          resolvedProfileId,
          resolvedChannelCode
        })
      }
    } catch (error) {
      console.error(
        'BUSINESS PROFILE SETTINGS LOAD FAIL',
        error
      )
      alert('비즈니스 설정 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    if (saving) {
      return
    }

    if (!profileId || !channelCode) {
      alert('프로필 정보가 없습니다')
      return
    }

    try {
      setSaving(true)

      await updateBusinessProfileCore(
        profileId,
        {
          displayName
        }
      )

      setSaved(true)

      setTimeout(() => {
        setSaved(false)
      }, 2000)

      await loadProfile()
    } catch (error) {
      console.error(
        'BUSINESS PROFILE SETTINGS SAVE FAIL',
        error
      )

      alert('저장 오류')
    } finally {
      setSaving(false)
    }
  }

  // SECTION 09 : EVENT

  function moveBusinessProfile() {
    router.push(BUSINESS_PROFILE_PATH)
  }

  function moveChannelManage() {
    router.push(BUSINESS_CHANNEL_SETTINGS_PATH)
  }

  function moveMenuManage() {
    router.push(BUSINESS_MENU_SETTINGS_PATH)
  }

  function moveHeroManage() {
    router.push(BUSINESS_HERO_SETTINGS_PATH)
  }

  function moveAvatarManage() {
    router.push(BUSINESS_AVATAR_SETTINGS_PATH)
  }

  // SECTION 10 : EFFECT

  useEffect(() => {
    void loadProfile()
  }, [])

  // SECTION 11 : UI BLOCK

  const LoadingUI = (
    <main className={styles.page}>
      <div className={styles.loadingBox}>
        로딩중...
      </div>
    </main>
  )

  const HeroPreviewUI = (
    <div className={styles.heroPreview}>
      <button
        type="button"
        className={styles.heroMediaButton}
        onClick={moveHeroManage}
        aria-label="비즈니스 히어로 이미지 설정"
      >
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={`${displayName} 히어로 이미지`}
            className={styles.heroImage}
          />
        ) : (
          <div className={styles.heroPlaceholder}>
            히어로 이미지 미설정
          </div>
        )}

        <span className={styles.mediaEditBadge}>
          히어로 설정
        </span>

        <span
          style={{
            position: 'absolute',
            left: 14,
            top: 14,
            zIndex: 2,
            padding: '8px 10px',
            borderRadius: 999,
            background:
              heroBusinessStatusText.startsWith('영업중')
                ? 'rgba(22, 163, 74, 0.9)'
                : 'rgba(15, 23, 42, 0.78)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 900,
            lineHeight: 1,
            whiteSpace: 'nowrap'
          }}
        >
          {heroBusinessStatusText}
        </span>
      </button>

      <button
        type="button"
        className={styles.avatarFrame}
        onClick={moveAvatarManage}
        aria-label="비즈니스 프로필 이미지 설정"
      >
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt={`${displayName} 프로필 이미지`}
            className={styles.avatarImage}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            프로필
          </div>
        )}

        <span className={styles.avatarEditBadge}>
          변경
        </span>
      </button>
    </div>
  )

  const PreviewSummaryUI = (
    <div className={styles.profileSummary}>
      <h1 className={styles.profileName}>
        {displayName}
      </h1>

      <p className={styles.profileType}>
        비즈니스 계정
      </p>

      {industryText && (
        <p className={styles.industryName}>
          {industryText}
        </p>
      )}

      <p className={styles.regionName}>
        {regionName}
      </p>

      <div className={styles.channelCode}>
        @{displayChannelCode}
      </div>
    </div>
  )

  const CompletionUI = (
    <section className={styles.statusCard}>
      <div className={styles.statusHeader}>
        <div>
          <h2 className={styles.statusTitle}>
            설정 상태
          </h2>

          <p className={styles.statusDesc}>
            비즈니스 프로필 완성도 기준
          </p>
        </div>

        <strong className={styles.statusPercent}>
          {completionPercent}%
        </strong>
      </div>

      <div className={styles.progressTrack}>
        <div
          className={styles.progressBar}
          style={{
            width: `${completionPercent}%`
          }}
        />
      </div>

      <div className={styles.statusList}>
        {settingStatusItems.map((item) => (
          <div
            key={item.key}
            className={styles.statusItem}
          >
            <span className={styles.statusLabel}>
              {item.label}
            </span>

            <span
              className={
                item.completed
                  ? styles.statusComplete
                  : styles.statusPending
              }
            >
              {item.completed ? '완료' : '미설정'}
            </span>
          </div>
        ))}
      </div>
    </section>
  )

  const PreviewActionUI = (
    <div className={styles.previewActionGroup}>
      <button
        type="button"
        className={styles.previewButton}
        onClick={moveBusinessProfile}
      >
        프로필 보기
      </button>

      <button
        type="button"
        className={styles.previewButton}
        onClick={moveChannelManage}
      >
        채널 관리
      </button>

      <button
        type="button"
        className={styles.previewButton}
        onClick={moveMenuManage}
      >
        메뉴 관리
      </button>
    </div>
  )

  const PreviewColumnUI = (
    <aside className={styles.previewColumn}>
      <section className={styles.previewCard}>
        {HeroPreviewUI}

        {PreviewSummaryUI}

        {CompletionUI}

        {PreviewActionUI}
      </section>
    </aside>
  )

  const DashboardHeaderUI = (
    <div className={styles.dashboardHeader}>
      <p className={styles.kicker}>
        BUSINESS PROFILE SETTINGS
      </p>

      <h2 className={styles.dashboardTitle}>
        비즈니스 설정
      </h2>

      <p className={styles.dashboardDesc}>
        상호명, 채널 주소, 지역, 연락처, 업종 정보를 관리합니다.
      </p>
    </div>
  )

  const DashboardColumnUI = (
    <section className={styles.dashboardColumn}>
      <div className={styles.dashboardCard}>
        {DashboardHeaderUI}

        <div className={styles.formStack}>
          <section className={styles.formPanel}>
            <BasicAccountSection
              displayName={displayName}
              slug={slug}
              setSlug={setSlug}
              regionName={regionName}
              regionDetailAddress={regionDetailAddress}
              channelCode={channelCode}
              channelId={channelId}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
              businessHoursSummary={businessHoursSummary}
              moveChannelManage={moveChannelManage}
              moveMenuManage={moveMenuManage}
            />
          </section>
        </div>
      </div>
    </section>
  )

  const SavedModalUI =
    saved && (
      <div className={styles.modalWrap}>
        <div className={styles.modalBox}>
          <div className={styles.checkIcon}>
            ✓
          </div>

          <div className={styles.modalTitle}>
            저장 완료
          </div>

          <div className={styles.modalDesc}>
            비즈니스 설정이 저장되었습니다
          </div>
        </div>
      </div>
    )

  const MainUI = (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.settingsGrid}>
          {PreviewColumnUI}

          {DashboardColumnUI}
        </div>
      </section>

      {SavedModalUI}
    </main>
  )

  // SECTION 12 : RETURN

  if (loading) {
    return LoadingUI
  }

  if (!profileId || !channelCode) {
    return null
  }

  return MainUI
}


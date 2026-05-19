// FILE : frontend/app/(after-login)/profile/general/profilesettings/page.tsx
// ROOT : frontend/app/(after-login)/profile/general/profilesettings/page.tsx
// STATUS : MODIFY MODE
// ROLE : GENERAL PROFILE SETTINGS PAGE
// CHANGE SUMMARY :
// - 히어로 미리보기 영역을 button 구조로 변경
// - 히어로 클릭 시 /profile/general/profilesettings/hero 이동 추가
// - 아바타 미리보기 영역을 button 구조로 변경
// - 아바타 클릭 시 /profile/general/profilesettings/avatar 이동 추가
// - heroMediaButton / mediaEditBadge / avatarEditBadge className 연결
// - 왼쪽 프로필 미리보기 영역에서 xxx.com/@channelCode 중복 표시 제거 유지
// - profileUrlText useMemo 제거 유지
// - styles.profileUrl 사용 제거 유지
// - channelCode는 @channelCode 단일 표시만 유지
// - inline style 제거 유지
// - CSS Module 기반 2컬럼 설정 대시보드 구조 유지
// - 왼쪽 프로필 미리보기 / 설정 상태판 유지
// - 오른쪽 기존 BasicAccountSection / BioSection / ProfileBlocksSection 유지
// - 저장 완료 모달 CSS Module 구조 유지
// - 기존 getMyProfile / updateProfileInfo / updateProfileBlocks 흐름 유지
// - API / DB / Service 영향 없음

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
import BioSection from './components/BioSection'
import ProfileBlocksSection, {
  Block as ProfileBlockType
} from './components/ProfileBlocksSection'

import {
  getMyProfile,
  updateProfileInfo,
  updateProfileBlocks
} from '@/lib/profileApi'

import styles from './ProfileSettingsPage.module.css'

// SECTION 02 : TYPE

type Block =
  ProfileBlockType

type ProfileHeroImage = {
  imageUrl?: string | null
  sortOrder?: number | null
}

type ProfileAvatar = {
  imageUrl?: string | null
  thumbUrl?: string | null
}

type ProfileRegion = {
  fullName?: string | null
}

type ProfileBlockResponse = {
  type: Block['type']
  title?: string | null
  content?: string | null
  url?: string | null
  description?: string | null
}

type GeneralProfile = {
  id?: number | string | null
  displayName?: string | null
  bio?: string | null
  channelCode?: string | null
  channelName?: string | null
  channelURL?: string | null
  avatar?: ProfileAvatar | null
  heroImages?: ProfileHeroImage[] | null
  feedRegion?: ProfileRegion | null
  activityRegion?: ProfileRegion | null
  blocks?: ProfileBlockResponse[] | null
}

type GetMyProfileResponse = {
  profile?: GeneralProfile | null
}

type SettingStatusItem = {
  key: string
  label: string
  completed: boolean
}

// SECTION 03 : CONSTANT

const DEFAULT_DISPLAY_NAME =
  '닉네임 없음'

const DEFAULT_REGION_NAME =
  '지역 미설정'

const DEFAULT_EMPTY_TEXT =
  '미설정'

const GENERAL_PROFILE_PATH =
  '/profile/general'

const CHANNEL_SETTINGS_PATH =
  '/profile/general/profilesettings/channel'

const HERO_SETTINGS_PATH =
  '/profile/general/profilesettings/hero'

const AVATAR_SETTINGS_PATH =
  '/profile/general/profilesettings/avatar'

// SECTION 04 : COMPONENT

export default function GeneralProfileSettingsPage() {
  const router =
    useRouter()

  // SECTION 05 : STATE

  const [heroImages, setHeroImages] =
    useState<string[]>([])

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null)

  const [avatarThumbUrl, setAvatarThumbUrl] =
    useState<string | null>(null)

  const [displayName, setDisplayName] =
    useState(DEFAULT_DISPLAY_NAME)

  const [slug, setSlug] =
    useState('')

  const [bio, setBio] =
    useState('')

  const [blocks, setBlocks] =
    useState<Block[]>([])

  const [regionName, setRegionName] =
    useState(DEFAULT_REGION_NAME)

  const [saving, setSaving] =
    useState(false)

  const [channelId, setChannelId] =
    useState('')

  const [channelCode, setChannelCode] =
    useState('')

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
        avatarThumbUrl ||
        avatarUrl ||
        heroImageUrl ||
        ''
      )
    }, [
      avatarThumbUrl,
      avatarUrl,
      heroImageUrl
    ])

  const settingStatusItems =
    useMemo<SettingStatusItem[]>(() => {
      return [
        {
          key: 'displayName',
          label: '닉네임',
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
            Boolean(avatarUrl || avatarThumbUrl)
        },
        {
          key: 'bio',
          label: '소개글',
          completed:
            bio.trim() !== ''
        },
        {
          key: 'blocks',
          label: '프로필 블록',
          completed:
            blocks.length > 0
        }
      ]
    }, [
      displayName,
      heroImages.length,
      avatarUrl,
      avatarThumbUrl,
      bio,
      blocks.length
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

  // SECTION 07 : EFFECT

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const data =
          await getMyProfile() as GetMyProfileResponse

        if (cancelled) {
          return
        }

        const profile =
          data.profile

        if (!profile) {
          setLoading(false)
          return
        }

        const safeChannelCode =
          profile.channelCode || ''

        const safeSlug =
          profile.channelName &&
          profile.channelName.trim() !== ''
            ? profile.channelName
            : safeChannelCode

        setDisplayName(
          profile.displayName ||
          safeSlug ||
          DEFAULT_DISPLAY_NAME
        )

        setSlug(safeSlug)
        setBio(profile.bio || '')

        setRegionName(
          profile.feedRegion?.fullName ||
          profile.activityRegion?.fullName ||
          DEFAULT_REGION_NAME
        )

        setChannelCode(safeChannelCode)

        setChannelId(
          profile.id
            ? String(profile.id)
            : ''
        )

        setHeroImages(
          (profile.heroImages || [])
            .slice()
            .sort((a, b) => {
              return (a.sortOrder || 0) - (b.sortOrder || 0)
            })
            .map((heroImage) => heroImage.imageUrl || '')
            .filter((imageUrl) => imageUrl !== '')
        )

        setAvatarUrl(
          profile.avatar?.imageUrl || null
        )

        setAvatarThumbUrl(
          profile.avatar?.thumbUrl || null
        )

        if (profile.blocks) {
          setBlocks(
            profile.blocks.map((block, index) => ({
              id: index,
              type: block.type,
              title: block.title || '',
              content: block.content || '',
              url: block.url || '',
              description: block.description || ''
            }))
          )
        }

        setLoading(false)
      } catch (error) {
        console.error(
          'PROFILE LOAD FAIL',
          error
        )

        setLoading(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  // SECTION 08 : EVENT

  async function saveProfile() {
    if (saving) {
      return
    }

    try {
      setSaving(true)

      await updateProfileInfo({
        displayName,
        bio
      })

      if (slug.trim() !== '') {
        const {
          updateChannel
        } = await import('@/lib/profileApi')

        await updateChannel({
          channelName: slug,
          channelURL: slug
        })
      }

      await updateProfileBlocks(
        blocks.map((block, index) => ({
          type: block.type,
          title: block.title,
          content: block.content || null,
          url: block.url || null,
          description: block.description || null,
          sortOrder: index
        }))
      )

      setSaved(true)

      setTimeout(() => {
        setSaved(false)
      }, 2000)
    } catch (error) {
      console.error(
        'SAVE FAIL',
        error
      )
    } finally {
      setSaving(false)
    }
  }

  function moveChannelManage() {
    router.push(CHANNEL_SETTINGS_PATH)
  }

  function moveProfilePage() {
    router.push(GENERAL_PROFILE_PATH)
  }

  function moveHeroManage() {
    router.push(HERO_SETTINGS_PATH)
  }

  function moveAvatarManage() {
    router.push(AVATAR_SETTINGS_PATH)
  }

  // SECTION 09 : UI BLOCK

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
        aria-label="히어로 이미지 설정"
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
      </button>

      <button
        type="button"
        className={styles.avatarFrame}
        onClick={moveAvatarManage}
        aria-label="프로필 이미지 설정"
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

  const ProfileSummaryUI = (
    <div className={styles.profileSummary}>
      <h1 className={styles.profileName}>
        {displayName}
      </h1>

      <p className={styles.regionName}>
        {regionName}
      </p>

      <div className={styles.channelCode}>
        @{channelCode || DEFAULT_EMPTY_TEXT}
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
            프로필 완성도 기준
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
        onClick={moveProfilePage}
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
    </div>
  )

  const PreviewColumnUI = (
    <aside className={styles.previewColumn}>
      <section className={styles.previewCard}>
        {HeroPreviewUI}

        {ProfileSummaryUI}

        {CompletionUI}

        {PreviewActionUI}
      </section>
    </aside>
  )

  const DashboardHeaderUI = (
    <div className={styles.dashboardHeader}>
      <div>
        <p className={styles.kicker}>
          GENERAL PROFILE SETTINGS
        </p>

        <h2 className={styles.dashboardTitle}>
          프로필 설정
        </h2>

        <p className={styles.dashboardDesc}>
          닉네임, 소개, 채널 주소, 프로필 블록을 관리합니다.
        </p>
      </div>
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
              setDisplayName={setDisplayName}
              slug={slug}
              setSlug={setSlug}
              regionName={regionName}
              channelCode={channelCode}
              channelId={channelId}
              moveChannelManage={moveChannelManage}
            />
          </section>

          <section className={styles.formPanel}>
            <BioSection
              bio={bio}
              onChange={setBio}
            />
          </section>

          <section className={styles.formPanel}>
            <ProfileBlocksSection
              blocks={blocks}
              setBlocks={setBlocks}
              displayName={displayName}
              channelId={channelId}
              setChannelId={setChannelId}
              slug={slug}
              setSlug={setSlug}
              regionName={regionName}
              moveChannelManage={moveChannelManage}
            />
          </section>

          <div className={styles.saveArea}>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? '저장중...' : '설정 저장'}
            </button>
          </div>
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
            프로필 설정이 저장되었습니다
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

  // SECTION 10 : RETURN

  if (loading) {
    return LoadingUI
  }

  return MainUI
}
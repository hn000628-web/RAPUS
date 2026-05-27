// FILE : frontend/app/(after-login)/profile/page.tsx
// ROOT : frontend/app/(after-login)/profile/page.tsx
// STATUS : MODIFY MODE
// ROLE : PROFILE HUB PAGE CONTAINER
// CHANGE SUMMARY :
// - GENERAL / BUSINESS 전용 마이페이지 컴포넌트 분기 렌더링 구조로 변경
// - page.tsx는 로그인/계정 컨텍스트 로딩과 프로필 타입 판별 컨테이너 역할만 유지
// - 기존 getMe()/switchProfile() 흐름 유지
// - DB/API/Service/Controller 수정 없음

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import {
  ProfileType
} from '@/types/api'

import {
  getToken
} from '@/utils/auth'

import {
  getMe,
  switchProfile
} from '@/lib/authApi'
import {
  getProfileAccount
} from '@/lib/accountApi'
import {
  buildProfileStoreRoute,
  getProfileByChannelCode,
  hasPlaceFeedPresetCapability,
  type PlaceFeedTypeCode
} from '@/lib/profile-summary-api'
import type {
  ProfileAccountResponseData
} from '@/lib/accountApi'

import BusinessMyPage from './components/mypage/BusinessMyPage'
import GeneralMyPage from './components/mypage/GeneralMyPage'
import styles from './ProfilePage.module.css'

// SECTION 02 : TYPE

type AccountInfoState = {
  profileId: number | null
  email: string
  channelCode: string
}

type UnknownRecord =
  Record<string, unknown>

type HubCardItem = {
  title: string
  description: string
  path?: string
}

type ProfileEntryConfig = {
  icon: string
  title: string
  description: string
  path: string
}

// SECTION 03 : CONSTANT

const LEGACY_PROFILE_ID_KEYS = [
  'activeProfileId',
  'profileId',
  'generalProfileId',
  'businessProfileId'
] as const

const DEFAULT_ACCOUNT_INFO: AccountInfoState = {
  profileId: null,
  email: '이메일 확인중',
  channelCode: '채널코드 확인중'
}

const PROFILE_ENTRY_CONFIG: Record<'GENERAL' | 'BUSINESS', ProfileEntryConfig> = {
  GENERAL: {
    icon: '일반',
    title: '일반 프로필',
    description: '개인 피드와 일반 활동 영역',
    path: '/profile/general'
  },
  BUSINESS: {
    icon: '비즈니스',
    title: '비즈니스 프로필',
    description: '매장 정보, 메뉴, 이벤트, 리뷰 관리',
    path: '/profile/business'
  }
}

const BUSINESS_MANAGEMENT_ITEMS: HubCardItem[] = [
  {
    title: '비즈니스 정보 관리',
    description: '/profile/business/account'
  },
  {
    title: '도메인 관리',
    description: '사업자 도메인 검색 및 연결 관리',
    path: '/profile/business/domain'
  },
  {
    title: '고객 관리',
    description: '/profile/business/customers'
  },
  {
    title: '주문 관리',
    description: '/profile/orders/business'
  },
  {
    title: '정산 관리',
    description: '/profile/pay/business'
  },
  {
    title: '전체설정',
    description: '계정 및 전체 설정 화면으로 이동',
    path: '/settings'
  }
]

const GENERAL_MANAGEMENT_ITEMS: HubCardItem[] = [
  {
    title: 'PAY',
    description: '/profile/pay',
    path: '/profile/pay'
  },
  {
    title: '개인 피드 관리',
    description: '/profile/general'
  },
  {
    title: '개인 예약 내역',
    description: '/profile/reservations'
  },
  {
    title: '개인 주문 내역',
    description: '/profile/orders',
    path: '/profile/orders'
  },
  {
    title: '개인 설정',
    description: '/profile/settings'
  }
]

function createAccountInfo(
  source: unknown
): AccountInfoState {
  const profileId =
    readNestedNumber(source, [
      ['profileId'],
      ['activeProfileId'],
      ['profile', 'id'],
      ['profile', 'profileId'],
      ['user', 'profileId']
    ])

  const email =
    readNestedString(source, [
      ['email'],
      ['user', 'email'],
      ['profile', 'email']
    ]) || '이메일 확인 필요'

  const channelCode =
    readNestedString(source, [
      ['channelCode'],
      ['user', 'channelCode'],
      ['profile', 'channelCode']
    ]) || '채널코드 확인 필요'

  return {
    profileId,
    email,
    channelCode
  }
}

function resolveProfileTypeByChannelCode(
  channelCode: string
): ProfileType | null {
  if (channelCode.startsWith('A')) {
    return 'GENERAL'
  }

  if (channelCode.startsWith('B')) {
    return 'BUSINESS'
  }

  return null
}

function readNestedString(
  source: unknown,
  paths: string[][]
) {
  for (const path of paths) {
    const value =
      readPath(
        source,
        path
      )

    if (
      typeof value === 'string' &&
      value.length > 0
    ) {
      return value
    }
  }

  return null
}

function readNestedNumber(
  source: unknown,
  paths: string[][]
) {
  for (const path of paths) {
    const value =
      readPath(
        source,
        path
      )

    if (typeof value === 'number') {
      return Number.isFinite(value)
        ? value
        : null
    }

    if (
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      const parsedValue =
        Number(value)

      if (Number.isFinite(parsedValue)) {
        return parsedValue
      }
    }
  }

  return null
}

function readPath(
  source: unknown,
  path: string[]
): unknown {
  let current: unknown =
    source

  for (const key of path) {
    if (!isRecord(current)) {
      return null
    }

    current =
      current[key]
  }

  return current
}

function isRecord(
  value: unknown
): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

// SECTION 04 : COMPONENT

export default function ProfileHubPage() {
  const router =
    useRouter()

  const [accountInfo, setAccountInfo] =
    useState<AccountInfoState>(
      DEFAULT_ACCOUNT_INFO
    )

  const [activeProfileType, setActiveProfileType] =
    useState<ProfileType | null>(null)

  const [loadingSwitch, setLoadingSwitch] =
    useState<ProfileType | null>(null)

  const [loadingAccount, setLoadingAccount] =
    useState<boolean>(true)

  const [generalAccountSummary, setGeneralAccountSummary] =
    useState<ProfileAccountResponseData | null>(null)

  const [businessPlaceFeedTypeCode, setBusinessPlaceFeedTypeCode] =
    useState<PlaceFeedTypeCode>('NORMAL')

  // SECTION 05 : EFFECT

  useEffect(() => {
    let cancelled =
      false

    async function loadAccountInfo() {
      const token =
        getToken()

      if (!token) {
        router.replace('/')
        return
      }

      clearLegacyProfileIdCache()

      try {
        const me =
          await getMe()

        if (cancelled) {
          return
        }

        const nextAccountInfo =
          createAccountInfo(me)

        const nextProfileType =
          resolveProfileTypeByChannelCode(
            nextAccountInfo.channelCode
          )

        let nextGeneralAccountSummary: ProfileAccountResponseData | null =
          null
        let nextBusinessPlaceFeedTypeCode: PlaceFeedTypeCode =
          'NORMAL'

        if (
          nextProfileType === 'GENERAL' &&
          nextAccountInfo.profileId !== null &&
          nextAccountInfo.channelCode.length > 0
        ) {
          nextGeneralAccountSummary =
            await getProfileAccount({
              profileId: nextAccountInfo.profileId,
              channelCode: nextAccountInfo.channelCode
            })
        }

        if (
          nextProfileType === 'BUSINESS' &&
          nextAccountInfo.channelCode.length > 0
        ) {
          const businessProfile =
            await getProfileByChannelCode(
              nextAccountInfo.channelCode
            )

          nextBusinessPlaceFeedTypeCode =
            businessProfile.placeFeedTypeCode ?? 'NORMAL'
        }

        setAccountInfo(nextAccountInfo)
        setActiveProfileType(nextProfileType)
        setGeneralAccountSummary(nextGeneralAccountSummary)
        setBusinessPlaceFeedTypeCode(nextBusinessPlaceFeedTypeCode)
      } catch (err) {
        console.error(
          'PROFILE HUB ACCOUNT INFO ERROR',
          err
        )

        if (!cancelled) {
          setAccountInfo({
            profileId: null,
            email: '이메일 확인 필요',
            channelCode: '채널코드 확인 필요'
          })

          setActiveProfileType(null)
          setGeneralAccountSummary(null)
          setBusinessPlaceFeedTypeCode('NORMAL')
        }
      } finally {
        if (!cancelled) {
          setLoadingAccount(false)
        }
      }
    }

    loadAccountInfo()

    return () => {
      cancelled = true
    }
  }, [
    router
  ])

  // SECTION 06 : DATA FUNCTION

  function clearLegacyProfileIdCache() {
    LEGACY_PROFILE_ID_KEYS.forEach((key) => {
      localStorage.removeItem(key)
    })
  }

  // SECTION 07 : EVENT FUNCTION

  async function switchToProfile(
    type: ProfileType
  ) {
    if (loadingSwitch) {
      return
    }

    if (
      type !== 'GENERAL' &&
      type !== 'BUSINESS'
    ) {
      return
    }

    setLoadingSwitch(type)

    try {
      await switchProfile(type)

      localStorage.setItem(
        'activeProfileType',
        type
      )

      localStorage.setItem(
        'profileType',
        type
      )

      router.push(
        PROFILE_ENTRY_CONFIG[type].path
      )
    } catch (err) {
      console.error(
        'PROFILE SWITCH ERROR',
        err
      )

      alert(`${type} 프로필 접근 오류`)
    } finally {
      setLoadingSwitch(null)
    }
  }

  function moveToBusinessStoreView() {
    const channelCode =
      accountInfo.channelCode

    if (
      !channelCode ||
      !channelCode.startsWith('B')
    ) {
      alert('비즈니스 채널코드를 확인할 수 없습니다.')
      return
    }

    router.push(
      buildProfileStoreRoute(
        channelCode,
        businessPlaceFeedTypeCode
      )
    )
  }

  function moveToBusinessPosView() {
    const channelCode =
      accountInfo.channelCode

    if (
      !channelCode ||
      !channelCode.startsWith('B')
    ) {
      alert('비즈니스 채널코드를 확인할 수 없습니다.')
      return
    }

    router.push('/pos')
  }

  function moveToBusinessAccountPage() {
    router.push('/profile/business/account')
  }

  const canUseProductSystem =
    hasPlaceFeedPresetCapability(
      businessPlaceFeedTypeCode,
      'productSystem'
    )

  // SECTION 08 : RETURN

  if (loadingAccount) {
    return (
      <main className={styles.fallbackPage}>
        <section className={styles.fallbackCard}>
          <h1 className={styles.fallbackTitle}>
            마이페이지 로딩 중
          </h1>
          <p className={styles.fallbackDescription}>
            계정 정보를 확인하고 있습니다.
          </p>
        </section>
      </main>
    )
  }

  if (activeProfileType === 'BUSINESS') {
    return (
      <BusinessMyPage
        accountInfo={accountInfo}
        profileConfig={PROFILE_ENTRY_CONFIG.BUSINESS}
        loadingSwitch={loadingSwitch !== null}
        managementItems={BUSINESS_MANAGEMENT_ITEMS}
        onSwitchProfile={() => {
          switchToProfile('BUSINESS')
        }}
        onMoveBusinessAccount={moveToBusinessAccountPage}
        onMoveStoreView={moveToBusinessStoreView}
        onMovePosView={moveToBusinessPosView}
        canUseProductSystem={canUseProductSystem}
      />
    )
  }

  if (activeProfileType === 'GENERAL') {
    return (
      <GeneralMyPage
        accountInfo={accountInfo}
        generalAccountSummary={generalAccountSummary}
        profileConfig={PROFILE_ENTRY_CONFIG.GENERAL}
        loadingSwitch={loadingSwitch !== null}
        personalItems={GENERAL_MANAGEMENT_ITEMS}
        onSwitchProfile={() => {
          switchToProfile('GENERAL')
        }}
      />
    )
  }

  return (
    <main className={styles.fallbackPage}>
      <section className={styles.fallbackCard}>
        <h1 className={styles.fallbackTitle}>
          프로필 타입 확인 필요
        </h1>
        <p className={styles.fallbackDescription}>
          현재 계정의 프로필 타입을 확인할 수 없습니다.
        </p>
        <div className={styles.fallbackInfoBox}>
          <p className={styles.fallbackInfoRow}>
            이메일: {accountInfo.email}
          </p>
          <p className={styles.fallbackInfoRow}>
            채널코드: {accountInfo.channelCode}
          </p>
        </div>
      </section>
    </main>
  )
}

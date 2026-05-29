// FILE : frontend/app/(after-login)/profile/components/mypage/GeneralMyPage.tsx
// ROOT : frontend/app/(after-login)/profile/components/mypage/GeneralMyPage.tsx
// STATUS : CREATE MODE
// ROLE : GENERAL PROFILE MY PAGE COMPONENT
// CHANGE SUMMARY :
// - GENERAL 전용 마이페이지 컴포넌트 신규 생성
// - 기존 profile/page.tsx의 GENERAL 관련 UI 분리
// - 계정 정보 / 일반 프로필 / 개인 메뉴 UI 구성 분리
// - DB/API/Service 수정 없음

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import type {
  ProfileAccountResponseData
} from '@/lib/accountApi'

import styles from '../../ProfilePage.module.css'

// SECTION 02 : TYPE

type AccountInfoState = {
  email: string
  channelCode: string
  userGrade?: number | null
}

type ProfileEntryConfig = {
  icon: string
  title: string
  description: string
  path: string
}

type HubCardItem = {
  title: string
  description: string
  path?: string
}

type AccountManagementItem = {
  title: string
  description: string
  badgeLabel: string
  enabled: boolean
  path?: string
}

type GeneralMyPageProps = {
  accountInfo: AccountInfoState
  generalAccountSummary: ProfileAccountResponseData | null
  profileConfig: ProfileEntryConfig
  loadingSwitch: boolean
  businessProfileSwitching: boolean
  personalItems: HubCardItem[]
  onSwitchProfile: () => void
  onMoveBusinessProfile: () => void
}

// SECTION 03 : CONSTANT

const GENERAL_PAGE_TITLE = '마이페이지'
const GENERAL_PAGE_DESCRIPTION = '일반 계정 정보와 개인 활동 메뉴를 확인합니다.'

const ACCOUNT_MANAGEMENT_ITEMS: AccountManagementItem[] = [
  {
    title: '개인정보 관리',
    description: '/profile/account',
    badgeLabel: '관리',
    enabled: true,
    path: '/profile/account'
  }
]

// SECTION 04 : COMPONENT

export default function GeneralMyPage({
  accountInfo,
  generalAccountSummary,
  profileConfig,
  loadingSwitch,
  businessProfileSwitching,
  personalItems,
  onSwitchProfile,
  onMoveBusinessProfile
}: GeneralMyPageProps) {
  const router = useRouter()
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const canMoveBusinessProfile = Boolean(
    accountInfo.userGrade && accountInfo.userGrade >= 1
  )

  useEffect(() => {
    if (!isAccountModalOpen) {
      return
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAccountModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscapeKey)
    return () => {
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isAccountModalOpen])

  // SECTION 05 : UI BLOCK

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.shellCard}>
          <div className={styles.titleBox}>
            <h1 className={styles.pageTitle}>
              {GENERAL_PAGE_TITLE}
            </h1>

            <p className={styles.pageDescription}>
              {GENERAL_PAGE_DESCRIPTION}
            </p>
          </div>

          <div className={styles.divider} />

          <div className={styles.profileGrid}>
            <div className={styles.profileColumn}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  일반 프로필
                </h2>

                <ProfileEntryCard
                  config={profileConfig}
                  disabled={loadingSwitch}
                  onEnter={onSwitchProfile}
                />
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeadRow}>
                  <h2 className={styles.sectionTitle}>
                    계정 정보
                  </h2>

                  <button
                    type="button"
                    className={styles.accountOpenButton}
                    onClick={() => {
                      setIsAccountModalOpen(true)
                    }}
                  >
                    계정정보
                  </button>
                </div>

                <div className={styles.accountInfoBox}>
                  <InfoRow
                    label="이메일"
                    value={accountInfo.email}
                  />

                  <InfoRow
                    label="채널코드"
                    value={accountInfo.channelCode}
                  />

                  {canMoveBusinessProfile ? (
                    <div className={styles.accountInfoActionRow}>
                      <button
                        type="button"
                        className={styles.accountInfoBusinessButton}
                        disabled={businessProfileSwitching}
                        onClick={() => {
                          onMoveBusinessProfile()
                        }}
                      >
                        {businessProfileSwitching
                          ? '계정을 전환합니다'
                          : '비지니스 프로필'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            <div className={styles.profileColumn}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  개인정보 관리
                </h2>

                <div className={styles.managementGrid}>
                  {ACCOUNT_MANAGEMENT_ITEMS.map((item) => (
                    <ManagementCard
                      key={item.title}
                      title={item.title}
                      description={item.description}
                      badgeLabel={item.badgeLabel}
                      enabled={item.enabled}
                      onClick={
                        (() => {
                          if (!item.enabled) {
                            return undefined
                          }

                          const targetPath = item.path

                          if (!targetPath) {
                            return undefined
                          }

                          return () => {
                            router.push(targetPath)
                          }
                        })()
                      }
                    />
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  개인 활동 관리
                </h2>

                <div className={styles.managementGrid}>
                  {personalItems.map((item) => (
                    <ManagementCard
                      key={item.title}
                      title={item.title}
                      description={item.description}
                      badgeLabel={item.path ? '이동' : '준비중'}
                      enabled={Boolean(item.path)}
                      onClick={
                        (() => {
                          const targetPath = item.path
                          if (!targetPath) {
                            return undefined
                          }
                          return () => {
                            router.push(targetPath)
                          }
                        })()
                      }
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>

      {isAccountModalOpen ? (
        <div
          className={styles.accountModalOverlay}
          role="presentation"
          onClick={() => {
            setIsAccountModalOpen(false)
          }}
        >
          <section
            className={styles.accountModal}
            role="dialog"
            aria-modal="true"
            aria-label="계정 정보"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <div className={styles.accountModalHeader}>
              <h3 className={styles.accountModalTitle}>
                계정 정보
              </h3>

              <button
                type="button"
                className={styles.accountModalCloseButton}
                aria-label="닫기"
                onClick={() => {
                  setIsAccountModalOpen(false)
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.accountInfoBox}>
              <InfoRow
                label="이메일"
                value={accountInfo.email}
                copyValue={accountInfo.email}
              />

              <InfoRow
                label="채널코드"
                value={accountInfo.channelCode}
                copyValue={accountInfo.channelCode}
              />

              <InfoRow
                label="생년월일"
                value={buildNullableDisplayText(
                  generalAccountSummary?.birthDate
                )}
              />

              <InfoRow
                label="성인인증"
                value={buildAdultVerificationText(
                  generalAccountSummary?.adultVerificationStatus
                )}
                valueToneClassName={buildAdultVerificationToneClassName(
                  generalAccountSummary?.adultVerificationStatus
                )}
              />

              <InfoRow
                label="기본지역"
                value={buildNullableDisplayText(
                  generalAccountSummary?.detailAddress
                )}
                isLongValue
              />

              <InfoRow
                label="기본연락처"
                value={formatKoreanPhoneDisplay(
                  generalAccountSummary?.contactPhone
                )}
              />

              <InfoRow
                label="2차비밀번호"
                value={buildPasswordStatusText(
                  generalAccountSummary?.paymentPasswordStatus
                )}
                valueToneClassName={buildPasswordStatusToneClassName(
                  generalAccountSummary?.paymentPasswordStatus
                )}
              />
            </div>

            <div className={styles.accountModalFooter}>
              <button
                type="button"
                className={styles.accountModalGhostButton}
                onClick={() => {
                  setIsAccountModalOpen(false)
                }}
              >
                닫기
              </button>

              <button
                type="button"
                className={styles.accountModalPrimaryButton}
                onClick={() => {
                  router.push('/profile/account')
                }}
              >
                수정하기
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

// SECTION 06 : RETURN

function buildNullableDisplayText(
  value: string | null | undefined
) {
  if (!value) {
    return '미등록'
  }

  return value
}

function formatKoreanPhoneDisplay(
  value: string | null | undefined
) {
  if (!value) {
    return '미등록'
  }

  const digits =
    value.replace(/\D/g, '')

  if (
    digits.length === 11 &&
    digits.startsWith('010')
  ) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  return value
}

function buildAdultVerificationText(
  status: string | null | undefined
) {
  switch (status) {
    case 'VERIFIED':
      return '인증됨'
    case 'EXPIRED':
      return '만료됨'
    case 'REQUIRED':
      return '인증필요'
    case 'FAILED':
      return '실패'
    case 'UNVERIFIED':
    default:
      return '미인증'
  }
}

function buildAdultVerificationToneClassName(
  status: string | null | undefined
) {
  switch (status) {
    case 'VERIFIED':
      return styles.statusSafe
    case 'EXPIRED':
    case 'REQUIRED':
    case 'UNVERIFIED':
      return styles.statusWarning
    case 'FAILED':
      return styles.statusDanger
    default:
      return styles.statusWarning
  }
}

function buildPasswordStatusText(
  status: string | null | undefined
) {
  if (status === 'SET') {
    return '설정됨'
  }

  return '미설정'
}

function buildPasswordStatusToneClassName(
  status: string | null | undefined
) {
  if (status === 'SET') {
    return styles.statusSafe
  }

  return styles.statusWarning
}

function InfoRow({
  label,
  value,
  isLongValue = false,
  valueToneClassName,
  copyValue
}: {
  label: string
  value: string
  isLongValue?: boolean
  valueToneClassName?: string
  copyValue?: string
}) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>
        {label}
      </span>

      <div className={styles.infoValueWrap}>
        <strong
          className={[
            styles.infoValue,
            isLongValue ? styles.infoValueLong : '',
            valueToneClassName ?? ''
          ].join(' ').trim()}
        >
          {value}
        </strong>

        {copyValue ? (
          <button
            type="button"
            className={styles.copyValueButton}
            aria-label={`${label} 복사`}
            onClick={() => {
              void navigator.clipboard.writeText(copyValue)
            }}
          >
            복사
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ProfileEntryCard({
  config,
  disabled,
  onEnter
}: {
  config: ProfileEntryConfig
  disabled: boolean
  onEnter: () => void
}) {
  return (
    <button
      type="button"
      className={[
        styles.profileEntryCard,
        disabled ? styles.profileEntryCardDisabled : ''
      ].join(' ').trim()}
      disabled={disabled}
      onClick={onEnter}
    >
      <div className={styles.profileIcon}>
        {config.icon}
      </div>

      <div className={styles.profileContent}>
        <strong className={styles.cardTitle}>
          {config.title}
        </strong>

        <span className={styles.cardDescription}>
          {config.description}
        </span>
      </div>
    </button>
  )
}

function ManagementCard({
  title,
  description,
  badgeLabel,
  enabled,
  onClick
}: {
  title: string
  description: string
  badgeLabel: string
  enabled: boolean
  onClick?: () => void
}) {
  return (
    <div
      className={[
        styles.managementCard,
        enabled ? styles.managementCardEnabled : styles.managementCardDisabled
      ].join(' ')}
      onClick={onClick}
    >
      <div className={styles.managementTop}>
        <strong className={styles.cardTitle}>
          {title}
        </strong>

        <span
          className={[
            styles.badge,
            enabled ? styles.badgeActive : styles.badgeReady
          ].join(' ')}
        >
          {badgeLabel}
        </span>
      </div>

      <p className={styles.managementDescription}>
        {description}
      </p>
    </div>
  )
}

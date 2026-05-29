// FILE : frontend/app/(after-login)/profile/components/mypage/BusinessMyPage.tsx
// ROOT : frontend/app/(after-login)/profile/components/mypage/BusinessMyPage.tsx
// STATUS : CREATE MODE
// ROLE : BUSINESS PROFILE MY PAGE COMPONENT
// CHANGE SUMMARY :
// - BUSINESS 전용 마이페이지 컴포넌트 신규 생성
// - 기존 profile/page.tsx의 BUSINESS 관련 UI 분리
// - 계정 정보 / 비즈니스 프로필 액션 / 관리 카드 UI 유지
// - DB/API/Service 수정 없음

'use client'

// SECTION 01 : IMPORT

import { useRouter } from 'next/navigation'
import Link from 'next/link'

import styles from '../../ProfilePage.module.css'

// SECTION 02 : TYPE

type AccountInfoState = {
  email: string
  channelCode: string
  corporationGrade: number
  providerGrade?: number | null
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

type BusinessMyPageProps = {
  accountInfo: AccountInfoState
  profileConfig: ProfileEntryConfig
  loadingSwitch: boolean
  managementItems: HubCardItem[]
  onSwitchProfile: () => void
  onMoveBusinessAccount: () => void
  onMoveStoreView: () => void
  onMovePosView: () => void
  canUseProductSystem: boolean
}

type BusinessProfileActionItem = {
  key: string
  label: string
  description: string
  secondaryDescription?: string
  onClick?: () => void
  href?: string
  disabled?: boolean
}

// SECTION 03 : CONSTANT

const BUSINESS_PAGE_TITLE = '마이페이지'
const BUSINESS_PAGE_DESCRIPTION = '비즈니스 계정 정보와 운영 관리 메뉴를 확인합니다.'

// SECTION 04 : COMPONENT

export default function BusinessMyPage({
  accountInfo,
  loadingSwitch,
  managementItems,
  onSwitchProfile,
  onMoveStoreView,
  onMovePosView
}: BusinessMyPageProps) {
  const router = useRouter()
  const canUseBusinessPaidFeatures =
    normalizeGradeValue(accountInfo.userGrade) >= 2 &&
    normalizeGradeValue(accountInfo.providerGrade) >= 1

  const businessActionItems: BusinessProfileActionItem[] = [
    {
      key: 'business-manage',
      label: '비즈니스 관리 프로필',
      description: '매장 관리 프로필로 이동',
      onClick: onSwitchProfile
    },
    {
      key: 'business-store-view',
      label: '비즈니스 스토어 뷰',
      description: '사용자 스토어뷰로 이동',
      onClick: onMoveStoreView
    },
    {
      key: 'business-pos-view',
      label: '포스 뷰',
      description: canUseBusinessPaidFeatures
        ? '사업자 POS 화면으로 이동'
        : '유료 전환 후 사용 가능',
      onClick: onMovePosView,
      disabled: !canUseBusinessPaidFeatures
    },
    {
      key: 'business-market-admin-view',
      label: '비즈니스 어드민',
      description: canUseBusinessPaidFeatures
        ? '사업자 운영 관리 화면으로 이동'
        : '유료 전환 후 사용 가능',
      href: '/profile_admin',
      disabled: !canUseBusinessPaidFeatures
    },
    ...(accountInfo.corporationGrade >= 24
      ? [
          {
            key: 'business-admin-view',
            label: '어드민',
            description: '관리자 화면으로 이동',
            href: '/admin'
          } satisfies BusinessProfileActionItem
        ]
      : []),
    {
      key: 'premium-uiux-design',
      label: '프리미엄 UI/UX 디자인',
      description: '고급 비즈니스 디자인 적용',
      secondaryDescription: '데모 디자인 및 서비스 신청',
      href: '/profile/business/premium-design'
    },
    ...(accountInfo.corporationGrade >= 24
      ? [
          {
            key: 'business-meteo-ai-view',
            label: '메테오AI',
            description: '메테오AI 운영 허브로 이동',
            href: '/admin/meteo-ai'
          } satisfies BusinessProfileActionItem
        ]
      : [])
  ]

  // SECTION 05 : UI BLOCK

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.shellCard}>
          <div className={styles.titleBox}>
            <h1 className={styles.pageTitle}>
              {BUSINESS_PAGE_TITLE}
            </h1>

            <p className={styles.pageDescription}>
              {canUseBusinessPaidFeatures
                ? BUSINESS_PAGE_DESCRIPTION
                : normalizeGradeValue(accountInfo.userGrade) >= 2
                  ? '현재 BUSINESS 체험판을 이용 중입니다. 상품관리, 주문, 예약, POS 기능은 유료 전환 후 사용할 수 있습니다.'
                  : 'INTRO 무료 소개 페이지와 기본 정보를 확인합니다.'}
            </p>
          </div>

          <div className={styles.divider} />

          <div className={styles.profileGrid}>
            <div className={styles.profileColumn}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  계정 정보
                </h2>

                <div className={styles.accountInfoBox}>
                  <InfoRow
                    label="이메일"
                    value={accountInfo.email}
                  />

                  <InfoRow
                    label="채널코드"
                    value={accountInfo.channelCode}
                  />

                  <InfoRow
                    label="유저코드(그레이드)"
                    value={formatUserGradeCode(accountInfo)}
                  />
                </div>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  비즈니스 프로필
                </h2>

                <BusinessProfileActionGrid
                  disabled={loadingSwitch}
                  items={businessActionItems}
                />
              </section>
            </div>

            <div className={styles.profileColumn}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  비즈니스 운영 관리
                </h2>

                <div className={styles.managementGrid}>
                  {managementItems.map((item) => {
                    const isPaidItem =
                      isPaidManagementItem(item.title)
                    const isLocked =
                      isPaidItem && !canUseBusinessPaidFeatures

                    return (
                      <ManagementCard
                        key={item.title}
                        title={item.title}
                        description={
                          isLocked
                            ? '유료 전환 후 사용 가능'
                            : item.description
                        }
                        showBadge={!item.path || isLocked}
                        onClick={
                          isLocked
                            ? undefined
                            : () => {
                                router.push(item.path || item.description)
                              }
                        }
                      />
                    )
                  })}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

// SECTION 06 : RETURN

function InfoRow({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>
        {label}
      </span>

      <strong className={styles.infoValue}>
        {value}
      </strong>
    </div>
  )
}

function formatUserGradeCode(
  accountInfo: AccountInfoState
) {
  const userGrade =
    normalizeGradeValue(accountInfo.userGrade)
  const providerGrade =
    normalizeGradeValue(accountInfo.providerGrade)
  const code =
    `${userGrade}${providerGrade}0`

  if (userGrade === 0 && providerGrade === 0) {
    return `일반회원(${code})`
  }

  if (userGrade === 1 && providerGrade === 0) {
    return `무료 비즈니스 파트너(${code})`
  }

  if (userGrade === 2 && providerGrade === 0) {
    return `체험판 비즈니스 파트너(${code})`
  }

  if (userGrade === 2 && providerGrade === 1) {
    return `유료 비즈니스 파트너(${code})`
  }

  return `등급 확인 필요(${code})`
}

function normalizeGradeValue(
  grade?: number | null
) {
  if (typeof grade !== 'number' || !Number.isFinite(grade)) {
    return 0
  }

  return grade
}

function BusinessProfileActionGrid({
  disabled,
  items
}: {
  disabled: boolean
  items: BusinessProfileActionItem[]
}) {
  return (
    <div className={styles.businessProfileStack}>
      <div className={styles.businessActionGrid}>
        {items.map((item) => (
          item.href && !item.disabled ? (
            <Link
              key={item.key}
              href={item.href}
              className={styles.businessActionButton}
            >
              <strong className={styles.cardTitle}>
                {item.label}
              </strong>
              <span className={styles.cardDescription}>
                {item.description}
              </span>
              {item.secondaryDescription ? (
                <span className={styles.cardDescription}>
                  {item.secondaryDescription}
                </span>
              ) : null}
            </Link>
          ) : (
            <button
              key={item.key}
              type="button"
              className={[
                styles.businessActionButton,
                disabled || item.disabled ? styles.profileEntryCardDisabled : ''
              ].join(' ').trim()}
              disabled={disabled || item.disabled}
              onClick={item.onClick}
            >
              <strong className={styles.cardTitle}>
                {item.label}
              </strong>
              <span className={styles.cardDescription}>
                {item.description}
              </span>
              {item.secondaryDescription ? (
                <span className={styles.cardDescription}>
                  {item.secondaryDescription}
                </span>
              ) : null}
            </button>
          )
        ))}
      </div>
    </div>
  )
}

function isPaidManagementItem(
  title: string
) {
  return (
    title.includes('고객') ||
    title.includes('주문') ||
    title.includes('정산') ||
    title.includes('상품') ||
    title.includes('예약') ||
    title.includes('행사') ||
    title.includes('POS')
  )
}

function ManagementCard({
  title,
  description,
  showBadge = true,
  onClick
}: {
  title: string
  description: string
  showBadge?: boolean
  onClick?: () => void
}) {
  return (
    <div
      className={[
        styles.managementCard,
        onClick ? styles.managementCardEnabled : styles.managementCardDisabled
      ].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) {
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
    >
      <div className={styles.managementTop}>
        <strong className={styles.cardTitle}>
          {title}
        </strong>

        {showBadge ? (
          <span className={[styles.badge, styles.badgeReady].join(' ')}>
            준비중
          </span>
        ) : null}
      </div>

      <p className={styles.managementDescription}>
        {description}
      </p>
    </div>
  )
}

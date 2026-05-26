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
}

type BusinessProfileActionItem = {
  key: string
  label: string
  description: string
  onClick?: () => void
  href?: string
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
      description: '사업자 POS 화면으로 이동',
      onClick: onMovePosView
    },
    {
      key: 'product-info-system',
      label: '상품정보시스템',
      description: 'RAPUS 등록 상품 리스트 조회',
      href: '/protect'
    }
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
              {BUSINESS_PAGE_DESCRIPTION}
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
                  {managementItems.map((item) => (
                    <ManagementCard
                      key={item.title}
                      title={item.title}
                      description={item.description}
                      showBadge={!item.path}
                      onClick={() => {
                        router.push(item.path || item.description)
                      }}
                    />
                  ))}
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
          item.href ? (
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
            </Link>
          ) : (
            <button
              key={item.key}
              type="button"
              className={[
                styles.businessActionButton,
                disabled ? styles.profileEntryCardDisabled : ''
              ].join(' ').trim()}
              disabled={disabled}
              onClick={item.onClick}
            >
              <strong className={styles.cardTitle}>
                {item.label}
              </strong>
              <span className={styles.cardDescription}>
                {item.description}
              </span>
            </button>
          )
        ))}
      </div>
    </div>
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

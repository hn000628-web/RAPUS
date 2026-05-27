// FILE : frontend/app/(pos)/pos/page.tsx
// ROOT : frontend/app/(pos)/pos/page.tsx

'use client'

// SECTION 01 : IMPORT
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import styles from './PosMainPage.module.css'

import { usePosKeyboardMode } from './components/PosKeyboardModeContext'
import PosTopbar from './components/PosTopbar'
import {
  getMyBusinessProfileFull
} from '@/lib/business/profile-settings-api'
import {
  getEnabledPlaceFeedPosRoute
} from '@/lib/profile-summary-api'

// SECTION 02 : TYPE
type HubItem = {
  key: string
  title: string
  description: string
  path?: string
  badge?: string
  iconLabel?: string
}

// SECTION 03 : CONSTANT
const HUB_ITEMS: HubItem[] = [
  {
    key: 'TABLE',
    title: '요식업_매장관리',
    description: '매장 테이블 상태와 주문내역을 확인합니다.',
    path: '/pos/table'
  },
  {
    key: 'ROOM_STATUS',
    title: '숙박업_매장관리',
    description: '객실 상태와 숙박 운영 현황을 확인합니다.',
    path: '/pos/rooms'
  },
  {
    key: 'DELIVERY_ORDER',
    title: '배달전문점_매장관리',
    description: '배달전문점 전용 / 예약 / 배달 / 포장 주문을 통합하여 확인합니다.',
    path: '/pos/delivery-orders'
  },
  {
    key: 'SETTINGS',
    title: '설정',
    description: 'POS 설정으로 이동합니다.',
    path: '/pos/settings'
  },
  {
    key: 'MARKET_ADMIN',
    title: '마켓 운영센터',
    description: '상품, 행사, 재고, 주문, 광고 등 마켓 운영을 통합 관리합니다.',
    path: '/market_admin',
    badge: 'NEW',
    iconLabel: 'MART'
  }
]

// SECTION 04 : PAGE
export default function PosHubPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [isResolvingPreset, setIsResolvingPreset] = useState(true)

  useEffect(() => {
    let isActive = true

    const finishResolvingPreset = () => {
      if (!isActive) {
        return
      }

      setIsResolvingPreset(false)
    }

    const routeByBusinessPlaceFeedType = async () => {
      try {
        const businessProfileFull =
          await getMyBusinessProfileFull()

        if (!isActive) {
          return
        }

        if (businessProfileFull.profile?.profileType !== 'BUSINESS') {
          finishResolvingPreset()
          return
        }

        const placeFeedTypeCode =
          businessProfileFull.profile.placeFeedTypeCode ??
          businessProfileFull.placeFeedTypeCode ??
          'NORMAL'

        const targetRoute =
          getEnabledPlaceFeedPosRoute(placeFeedTypeCode)

        if (!targetRoute || targetRoute === '/pos') {
          finishResolvingPreset()
          return
        }

        router.replace(targetRoute)
      } catch {
        // BUSINESS profile context가 없으면 기존 POS 허브를 유지합니다.
        finishResolvingPreset()
      }
    }

    void routeByBusinessPlaceFeedType()

    return () => {
      isActive = false
    }
  }, [
    router
  ])

  // SECTION 05 : EVENT FUNCTION
  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleClickItem = (item: HubItem) => {
    if (!item.path) {
      return
    }

    router.push(item.path)
  }

  if (isResolvingPreset) {
    return (
      <div className={styles.page}>
        <div className={styles.posShell}>
          <div className={styles.topbarWrap}>
            <div className={styles.topbarInner}>
              <PosTopbar
                title="POS 메인"
                onHomeClick={handleGoPosHome}
                onSettingsClick={handleOpenPosSettings}
                onMyPageClick={handleGoMyPage}
                syncStatus="SYNCING"
                homeShortcutLabel="F1"
                keyboardMode={keyboardMode}
                onToggleKeyboardMode={toggleKeyboardMode}
              />
            </div>
          </div>

          <main className={styles.loadingMain}>
            <section className={styles.loadingPanel} aria-live="polite">
              <span className={styles.loadingSpinner} aria-hidden="true" />
              <h1 className={styles.loadingTitle}>
                POS 운영모드 확인중...
              </h1>
              <p className={styles.loadingDescription}>
                현재 비즈니스 프로필에 맞는 운영 화면을 준비하고 있습니다.
              </p>
            </section>
          </main>
        </div>
      </div>
    )
  }

  // SECTION 06 : RETURN
  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="POS 메인"
              onHomeClick={handleGoPosHome}
              onSettingsClick={handleOpenPosSettings}
              onMyPageClick={handleGoMyPage}
              syncStatus="ONLINE"
              homeShortcutLabel="F1"
              keyboardMode={keyboardMode}
              onToggleKeyboardMode={toggleKeyboardMode}
            />
          </div>
        </div>

        <main className={styles.main}>
          <div className={styles.contentLayout}>
            <section className={styles.grid} aria-label="POS 기능 카드">
              {HUB_ITEMS.map((item) => {
                const isEnabled = Boolean(item.path)

                return (
                  <article
                    key={item.key}
                    className={[
                      styles.card,
                      isEnabled ? styles.cardClickable : ''
                    ].filter(Boolean).join(' ')}
                    role={isEnabled ? 'button' : undefined}
                    tabIndex={isEnabled ? 0 : undefined}
                    onClick={() => handleClickItem(item)}
                    onKeyDown={(event) => {
                      if (!isEnabled) {
                        return
                      }

                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleClickItem(item)
                      }
                    }}
                  >
                    {(item.badge || item.iconLabel) ? (
                      <div className={styles.cardMetaRow}>
                        {item.iconLabel ? (
                          <span className={styles.cardIcon}>
                            {item.iconLabel}
                          </span>
                        ) : null}
                        {item.badge ? (
                          <span className={styles.cardBadge}>
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <h2 className={styles.cardTitle}>{item.title}</h2>
                    <p className={styles.cardDescription}>{item.description}</p>
                    <button
                      type="button"
                      className={isEnabled ? styles.cardButton : styles.cardButtonDisabled}
                      onClick={(event) => {
                        event.stopPropagation()
                        handleClickItem(item)
                      }}
                      disabled={!isEnabled}
                    >
                      {isEnabled ? '이동' : '준비중'}
                    </button>
                  </article>
                )
              })}
            </section>

            <aside className={styles.summaryPanel} aria-label="오늘의 요약">
              <h2 className={styles.summaryTitle}>오늘의 요약</h2>
              <p className={styles.summaryDescription}>
                실시간 운영/매출 연동 데이터를 준비 중입니다.
              </p>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

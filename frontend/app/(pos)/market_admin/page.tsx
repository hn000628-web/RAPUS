// FILE : frontend/app/(pos)/market_admin/page.tsx
// ROOT : frontend/app/(pos)/market_admin/page.tsx
// STATUS : CREATE MODE
// ROLE : MARKET ADMIN OPERATION HUB MOCK PAGE

'use client'

// SECTION 01 : IMPORT
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { usePosKeyboardMode } from '../pos/components/PosKeyboardModeContext'
import PosTopbar from '../pos/components/PosTopbar'
import styles from './market-admin.module.css'

// SECTION 02 : TYPE
type MarketAdminStatus =
  | 'ACTIVE'
  | 'WARNING'

type MarketAdminSummaryCard = {
  id: string
  label: string
  value: string
  status: MarketAdminStatus
  description: string
}

type MarketAdminMenuCard = {
  id: string
  icon: string
  title: string
  description: string
  status: MarketAdminStatus
}

type MarketAdminRealtimeItem = {
  id: string
  label: string
  value: string
  status: MarketAdminStatus
}

// SECTION 03 : CONSTANT
const MARKET_CHANNEL_CODE = 'B8X7C6V5B4N3M'
const MARKET_ADMIN_BADGE = 'MARKET ADMIN'
const MARKET_ADMIN_STATUS: MarketAdminStatus = 'ACTIVE'
const MOCK_CURRENT_TIME = '14:35'

const SUMMARY_CARDS: MarketAdminSummaryCard[] = [
  {
    id: 'today-orders',
    label: '오늘 주문',
    value: '124건',
    status: 'ACTIVE',
    description: '오늘 접수된 주문'
  },
  {
    id: 'campaign-products',
    label: '행사 진행중',
    value: '8개',
    status: 'ACTIVE',
    description: '현재 노출중 행사'
  },
  {
    id: 'low-stock',
    label: '재고 부족',
    value: '14개',
    status: 'WARNING',
    description: '재고 부족 상품'
  },
  {
    id: 'feed-status',
    label: '피드 노출 상태',
    value: '정상',
    status: 'ACTIVE',
    description: '마켓 피드 노출중'
  },
  {
    id: 'ad-status',
    label: '광고 상태',
    value: 'ACTIVE',
    status: 'ACTIVE',
    description: '플레이스 광고 운영중'
  },
  {
    id: 'today-visitors',
    label: '오늘 방문자',
    value: '2,481',
    status: 'ACTIVE',
    description: '오늘 방문자 수'
  }
]

const REALTIME_ITEMS: MarketAdminRealtimeItem[] = [
  {
    id: 'new-orders',
    label: '신규 주문',
    value: '12건',
    status: 'ACTIVE'
  },
  {
    id: 'campaign-approval',
    label: '행사 승인 대기',
    value: '3건',
    status: 'WARNING'
  },
  {
    id: 'stock-alert',
    label: '재고 경고',
    value: '5건',
    status: 'WARNING'
  },
  {
    id: 'feed-review',
    label: '피드 검수 필요',
    value: '1건',
    status: 'WARNING'
  }
]

const MENU_CARDS: MarketAdminMenuCard[] = [
  {
    id: 'products',
    icon: 'NEW',
    title: '상품등록',
    description: '신규 상품 등록 / 가격 / 카테고리 설정',
    status: 'ACTIVE'
  },
  {
    id: 'campaign-create',
    icon: 'SALE',
    title: '행사등록',
    description: '행사 상품 / 할인율 / 노출 기간 설정',
    status: 'ACTIVE'
  },
  {
    id: 'stock-check',
    icon: 'INV',
    title: '재고확인',
    description: '재고 부족 / 품절 / 입고 대기 확인',
    status: 'WARNING'
  },
  {
    id: 'feed-sync',
    icon: 'FEED',
    title: '피드관리',
    description: '마켓 피드 / 행사 노출 / 검수 상태 관리',
    status: 'ACTIVE'
  },
  {
    id: 'ads',
    icon: 'ADS',
    title: '광고관리',
    description: '플레이스 / 마켓 광고 슬롯',
    status: 'ACTIVE'
  },
  {
    id: 'banners',
    icon: 'BNR',
    title: '배너관리',
    description: '카테고리 배너 및 프로모션',
    status: 'ACTIVE'
  },
  {
    id: 'order-reception',
    icon: 'ORD',
    title: '주문접수',
    description: '실시간 주문 접수 / 처리 상태 확인',
    status: 'ACTIVE'
  },
  {
    id: 'delivery',
    icon: 'DLV',
    title: '배송관리',
    description: '지역배달 / 택배발송 / 픽업 상태 관리',
    status: 'ACTIVE'
  }
]

// SECTION 04 : STATE
export default function MarketAdminPage() {
  const router = useRouter()
  const {
    keyboardMode,
    toggleKeyboardMode
  } = usePosKeyboardMode()
  const [selectedMenuId, setSelectedMenuId] = useState<string>(MENU_CARDS[0]?.id ?? '')

  // SECTION 05 : DATA
  const selectedMenu = useMemo(() => {
    return MENU_CARDS.find((card) => card.id === selectedMenuId) ?? MENU_CARDS[0]
  }, [selectedMenuId])

  // SECTION 06 : EVENT
  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleOpenProductSettings = () => {
    router.push('/pos/settings/menu')
  }

  const handleOpenOrderBoard = () => {
    router.push('/pos/table/orders')
  }

  const handleSelectMenu = (menuId: string) => {
    setSelectedMenuId(menuId)
  }

  // SECTION 07 : UI
  const renderStatusBadge = (status: MarketAdminStatus) => {
    const badgeClassName = [
      styles.statusBadge,
      status === 'WARNING' ? styles.statusWarning : styles.statusActive
    ].join(' ')

    return (
      <span className={badgeClassName}>
        {status}
      </span>
    )
  }

  // SECTION 08 : RETURN
  return (
    <div className={styles.page}>
      <div className={styles.topbarWrap}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="MARKET 운영 허브"
            onHomeClick={handleGoPosHome}
            onSettingsClick={handleOpenPosSettings}
            onMyPageClick={handleGoMyPage}
            syncStatus="ONLINE"
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
          />
        </div>
      </div>

      <main className={styles.main}>
        <section className={styles.operationHeader} aria-label="마켓 운영 헤더">
          <div className={styles.headerCopy}>
            <div className={styles.headerBadgeRow}>
              <span className={styles.adminBadge}>
                {MARKET_ADMIN_BADGE}
              </span>
              {renderStatusBadge(MARKET_ADMIN_STATUS)}
            </div>

            <h1 className={styles.title}>
              신선마트 운영센터
            </h1>

            <div className={styles.metaGrid}>
              <span>
                채널 : {MARKET_CHANNEL_CODE}
              </span>
              <span>
                운영상태 : {MARKET_ADMIN_STATUS}
              </span>
              <span>
                현재 시간 : {MOCK_CURRENT_TIME}
              </span>
            </div>
          </div>

          <div className={styles.quickActions} aria-label="빠른 실행">
            <button
              type="button"
              className={styles.secondaryActionButton}
              onClick={handleOpenOrderBoard}
            >
              주문 현황
            </button>
            <button
              type="button"
              className={styles.primaryActionButton}
              onClick={handleOpenProductSettings}
            >
              상품 등록
            </button>
          </div>
        </section>

        <section className={styles.summaryGrid} aria-label="운영 요약">
          {SUMMARY_CARDS.map((card) => (
            <article key={card.id} className={styles.summaryCard}>
              <div className={styles.cardTopLine}>
                <span className={styles.summaryLabel}>
                  {card.label}
                </span>
                {renderStatusBadge(card.status)}
              </div>
              <strong className={styles.summaryValue}>
                {card.value}
              </strong>
              <p className={styles.summaryDescription}>
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className={styles.realtimePanel} aria-label="실시간 운영현황">
          <div className={styles.realtimeHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                실시간 운영현황
              </h2>
              <p className={styles.sectionDescription}>
                주문, 행사, 재고, 피드 검수 흐름을 운영센터에서 바로 확인합니다.
              </p>
            </div>

            <span className={styles.liveBadge}>
              LIVE MOCK
            </span>
          </div>

          <div className={styles.realtimeGrid}>
            {REALTIME_ITEMS.map((item) => (
              <article key={item.id} className={styles.realtimeItem}>
                <div className={styles.realtimeItemTop}>
                  <span className={styles.realtimeLabel}>
                    {item.label}
                  </span>
                  {renderStatusBadge(item.status)}
                </div>
                <strong className={styles.realtimeValue}>
                  {item.value}
                </strong>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.menuPanel} aria-label="운영 메뉴">
          <div className={styles.sectionHeading}>
            <div>
              <h2 className={styles.sectionTitle}>
                운영 메뉴
              </h2>
              <p className={styles.sectionDescription}>
                상품, 주문, 재고, 광고 노출 흐름을 한 화면에서 관리합니다.
              </p>
            </div>

            <div className={styles.selectedMenuPill}>
              선택 : {selectedMenu?.title ?? '상품관리'}
            </div>
          </div>

          <div className={styles.menuGrid}>
            {MENU_CARDS.map((card) => {
              const isSelected = selectedMenuId === card.id
              const cardClassName = [
                styles.menuCard,
                isSelected ? styles.menuCardSelected : ''
              ].filter(Boolean).join(' ')

              return (
                <button
                  key={card.id}
                  type="button"
                  className={cardClassName}
                  onClick={() => handleSelectMenu(card.id)}
                >
                  <span className={styles.iconBox}>
                    {card.icon}
                  </span>

                  <span className={styles.menuContent}>
                    <span className={styles.menuTitleRow}>
                      <strong className={styles.menuTitle}>
                        {card.title}
                      </strong>
                      {renderStatusBadge(card.status)}
                    </span>
                    <span className={styles.menuDescription}>
                      {card.description}
                    </span>
                  </span>

                  <span className={styles.arrowIcon} aria-hidden="true">
                    →
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import BaseModal from '@/components/ui/modal/BaseModal'
import styles from './ProfileOrdersPage.module.css'

type ProfileOrderModalType =
  | 'ALL'
  | 'CART'
  | 'ORDER'
  | 'IN_PROGRESS'
  | 'COMPLETED'

type ActivityKind =
  | 'CART'
  | 'ORDER'

type ProductSourceType =
  | 'POS_PRODUCT'
  | 'MARKET_PRODUCT'

type ProductSourceFilter =
  | 'ALL'
  | 'POS_PRODUCT'
  | 'MARKET_PRODUCT'

type OrderStatusGroup =
  | 'CART'
  | 'ORDER'
  | 'IN_PROGRESS'
  | 'COMPLETED'

type ActivityItem = {
  id: string
  activityNumber: string
  activityKind: ActivityKind
  sourceType: ProductSourceType
  statusGroup: OrderStatusGroup
  statusLabel: string
  storeName: string
  orderTypeLabel: string
  activityAt: string
  totalAmount: number
  summaryText: string
}

const SOURCE_FILTERS: Array<{ key: ProductSourceFilter, label: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'POS_PRODUCT', label: '플레이스' },
  { key: 'MARKET_PRODUCT', label: '마켓' }
]

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: 'cart-001',
    activityNumber: 'CART-2026-0523-001',
    activityKind: 'CART',
    sourceType: 'POS_PRODUCT',
    statusGroup: 'CART',
    statusLabel: '장바구니',
    storeName: '광화문 버거 스토어',
    orderTypeLabel: '픽업',
    activityAt: '2026-05-23 10:42',
    totalAmount: 18900,
    summaryText: '불고기버거 세트 1개'
  },
  {
    id: 'ord-002',
    activityNumber: 'ORD-2026-0522-017',
    activityKind: 'ORDER',
    sourceType: 'MARKET_PRODUCT',
    statusGroup: 'IN_PROGRESS',
    statusLabel: '배송중',
    storeName: '한빛 마켓',
    orderTypeLabel: '배송',
    activityAt: '2026-05-22 19:16',
    totalAmount: 25400,
    summaryText: '데일리 세탁세제 외 2건'
  },
  {
    id: 'ord-003',
    activityNumber: 'ORD-2026-0521-043',
    activityKind: 'ORDER',
    sourceType: 'POS_PRODUCT',
    statusGroup: 'COMPLETED',
    statusLabel: '완료',
    storeName: '청담 키친',
    orderTypeLabel: '배달',
    activityAt: '2026-05-21 13:20',
    totalAmount: 31200,
    summaryText: '특선 도시락 외 1건'
  },
  {
    id: 'ord-004',
    activityNumber: 'ORD-2026-0520-088',
    activityKind: 'ORDER',
    sourceType: 'MARKET_PRODUCT',
    statusGroup: 'COMPLETED',
    statusLabel: '취소',
    storeName: '오늘의 리빙',
    orderTypeLabel: '배송',
    activityAt: '2026-05-20 09:55',
    totalAmount: 0,
    summaryText: '주문 취소'
  }
]

const MODAL_META: Record<ProfileOrderModalType, { title: string, description: string, cardDescription: string }> = {
  ALL: {
    title: '전체',
    description: '장바구니와 주문 내역을 모두 확인합니다.',
    cardDescription: '전체 활동 확인'
  },
  CART: {
    title: '장바구니내역',
    description: '주문 전 저장한 플레이스/마켓 상품을 확인합니다.',
    cardDescription: '주문 전 저장 상품 확인'
  },
  ORDER: {
    title: '주문내역',
    description: '주문 확정된 플레이스/마켓 상품을 확인합니다.',
    cardDescription: '확정된 주문 확인'
  },
  IN_PROGRESS: {
    title: '진행중',
    description: '현재 처리 중인 주문을 확인합니다.',
    cardDescription: '처리 중 주문 확인'
  },
  COMPLETED: {
    title: '완료',
    description: '완료, 취소, 환불완료된 주문을 확인합니다.',
    cardDescription: '종료된 주문 확인'
  }
}

function formatPrice(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

function sourceLabel(sourceType: ProductSourceType): string {
  return sourceType === 'POS_PRODUCT' ? '플레이스' : '마켓'
}

function filterByModalType(items: ActivityItem[], modalType: ProfileOrderModalType): ActivityItem[] {
  if (modalType === 'ALL') {
    return items
  }
  if (modalType === 'CART') {
    return items.filter((item) => item.activityKind === 'CART')
  }
  if (modalType === 'ORDER') {
    return items.filter((item) => item.activityKind === 'ORDER')
  }
  if (modalType === 'IN_PROGRESS') {
    return items.filter((item) => item.activityKind === 'ORDER' && item.statusGroup === 'IN_PROGRESS')
  }
  return items.filter((item) => item.activityKind === 'ORDER' && item.statusGroup === 'COMPLETED')
}

export default function ProfileOrdersPage() {
  const router = useRouter()
  const [selectedModalType, setSelectedModalType] = useState<ProfileOrderModalType>('ALL')
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<ProductSourceFilter>('ALL')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)

  const summary = useMemo(() => {
    return {
      all: MOCK_ACTIVITIES.length,
      cart: MOCK_ACTIVITIES.filter((item) => item.activityKind === 'CART').length,
      order: MOCK_ACTIVITIES.filter((item) => item.activityKind === 'ORDER').length,
      inProgress: MOCK_ACTIVITIES.filter((item) => item.activityKind === 'ORDER' && item.statusGroup === 'IN_PROGRESS').length,
      completed: MOCK_ACTIVITIES.filter((item) => item.activityKind === 'ORDER' && item.statusGroup === 'COMPLETED').length
    }
  }, [])

  const statusCards = useMemo(() => {
    return [
      { key: 'ALL' as const, count: summary.all },
      { key: 'CART' as const, count: summary.cart },
      { key: 'ORDER' as const, count: summary.order },
      { key: 'IN_PROGRESS' as const, count: summary.inProgress },
      { key: 'COMPLETED' as const, count: summary.completed }
    ]
  }, [summary])

  const modalActivities = useMemo(() => {
    const byModal = filterByModalType(MOCK_ACTIVITIES, selectedModalType)
    if (selectedSourceFilter === 'ALL') {
      return byModal
    }
    return byModal.filter((item) => item.sourceType === selectedSourceFilter)
  }, [selectedModalType, selectedSourceFilter])

  const selectedMeta = MODAL_META[selectedModalType]

  function handleOpenModal(type: ProfileOrderModalType) {
    setSelectedModalType(type)
    setSelectedSourceFilter('ALL')
    setIsDetailModalOpen(true)
  }

  return (
    <main className={styles.pageShell}>
      <section className={styles.contentShell}>
        <section className={styles.hubLayout}>
          <section className={styles.hubIntroColumn}>
            <section className={styles.heroPanel}>
              <div className={styles.heroLabel}>MY ORDERS HUB</div>
              <div className={styles.heroTopRow}>
                <h1 className={styles.heroTitle}>개인 주문 관리</h1>
                <p className={styles.heroDescription}>장바구니, 플레이스 주문, 마켓 주문 내역을 확인합니다.</p>
              </div>
              <div className={styles.heroActions}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => {
                    router.push('/profile')
                  }}
                >
                  마이페이지로 돌아가기
                </button>
              </div>
              <p className={styles.hubNotice}>
                상태 카드를 누르면 해당 상세 내역을 모달에서 확인할 수 있습니다.
              </p>
            </section>
          </section>

          <section className={styles.hubCardsColumn}>
            <section className={styles.statusCardGrid}>
              {statusCards.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={styles.statusCard}
                  onClick={() => {
                    handleOpenModal(item.key)
                  }}
                >
                  <span className={styles.statusCardLabel}>{MODAL_META[item.key].title}</span>
                  <strong className={styles.statusCardValue}>{item.count}</strong>
                  <span className={styles.statusCardDescription}>{MODAL_META[item.key].cardDescription}</span>
                </button>
              ))}
            </section>
          </section>
        </section>
      </section>

      <BaseModal
        open={isDetailModalOpen}
        type="info"
        title={selectedMeta.title}
        description={selectedMeta.description}
        onClose={() => {
          setIsDetailModalOpen(false)
        }}
        autoClose={false}
        hideDefaultButton
        showCloseButton
        closeButtonInHeaderActions
        hideIcon
        panelStyle={{
          width: 'min(940px, calc(100vw - 24px))',
          maxHeight: 'calc(100vh - 24px)',
          minHeight: 'auto',
          padding: '20px'
        }}
        bodyStyle={{
          maxHeight: 'calc(100vh - 210px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '2px'
        }}
      >
        <div className={styles.modalBody}>
          <div className={styles.modalFilterBar}>
            {SOURCE_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={selectedSourceFilter === item.key ? styles.sourceFilterActive : styles.sourceFilter}
                onClick={() => {
                  setSelectedSourceFilter(item.key)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {modalActivities.length < 1 ? (
            <div className={styles.emptyState}>
              선택한 조건에 맞는 내역이 없습니다.
            </div>
          ) : (
            <div className={styles.modalList}>
              {modalActivities.map((item) => (
                <article key={item.id} className={styles.modalCard}>
                  <div className={styles.cardHeader}>
                    <strong className={styles.activityNumber}>{item.activityNumber}</strong>
                    <span className={styles.statusBadge}>{item.statusLabel}</span>
                  </div>

                  <div className={styles.badgeRow}>
                    <span className={styles.sourceBadge}>{sourceLabel(item.sourceType)}</span>
                    <span className={styles.methodBadge}>{item.orderTypeLabel}</span>
                  </div>

                  <div className={styles.cardBody}>
                    <p className={styles.cardMeta}><span>매장명</span><strong>{item.storeName}</strong></p>
                    <p className={styles.cardMeta}><span>일시</span><strong>{item.activityAt}</strong></p>
                    <p className={styles.cardMeta}><span>금액</span><strong>{formatPrice(item.totalAmount)}</strong></p>
                    <p className={styles.cardMeta}><span>상품 요약</span><strong>{item.summaryText}</strong></p>
                  </div>

                  <div className={styles.cardFooter}>
                    <button type="button" className={styles.detailButton}>상세보기</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </BaseModal>
    </main>
  )
}

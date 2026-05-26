'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import BaseModal from '@/components/ui/modal/BaseModal'
import { buildMediaUrl } from '@/lib/config'
import { deleteCartItem as deleteCartItemApi } from '@/lib/cartApi'
import {
  fetchProfileCartItems,
  fetchProfileOrderDetail,
  fetchProfileOrders,
  fetchProfileOrdersSummary,
  type ProfileCartItem,
  type ProfileOrderDetail,
  type ProfileOrderItem
} from '@/lib/profile/orders/profileOrdersApi'
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
  providerChannelCode?: string
  thumbnailUrl?: string | null
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

function mapOrderStatusGroup(orderStatus: string): OrderStatusGroup {
  const normalized = String(orderStatus || '').toUpperCase()
  if (normalized === 'COMPLETED' || normalized === 'CANCELLED' || normalized === 'REFUNDED') {
    return 'COMPLETED'
  }
  return 'IN_PROGRESS'
}

function mapOrderStatusLabel(orderStatus: string): string {
  const normalized = String(orderStatus || '').toUpperCase()
  if (normalized === 'COMPLETED') {
    return '완료'
  }
  if (normalized === 'CANCELLED') {
    return '취소'
  }
  if (normalized === 'REFUNDED') {
    return '환불'
  }
  return '진행중'
}

function toActivityAt(value: string | null): string {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('ko-KR')
}

function mapCartItemToActivity(item: ProfileCartItem): ActivityItem {
  const raw = item as unknown as Record<string, unknown>
  const thumbnailFromFilePath =
    typeof item.thumbnailFilePath === 'string' && item.thumbnailFilePath.trim().length > 0
      ? buildMediaUrl(item.thumbnailFilePath)
      : null
  const thumbnailCandidates = [
    thumbnailFromFilePath,
    raw.thumbnailUrl,
    raw.imageUrl,
    raw.thumbnailImageUrl,
    raw.primaryImageUrl,
    raw.imageAssetUrl
  ]
  const thumbnailUrl =
    (thumbnailCandidates.find((value) => typeof value === 'string' && value.trim().length > 0) as string | undefined) ?? null

  return {
    id: `cart-${item.id}`,
    activityNumber: item.cartItemCode || item.cartCode || `CART-${item.id}`,
    activityKind: 'CART',
    providerChannelCode: item.providerChannelCode,
    thumbnailUrl,
    sourceType: item.sourceType,
    statusGroup: 'CART',
    statusLabel: '장바구니',
    storeName: item.providerName || item.providerChannelCode,
    orderTypeLabel: item.orderFlowType || '-',
    activityAt: toActivityAt(item.createdAt),
    totalAmount: Number(item.lineTotalAmount || 0),
    summaryText: `${item.productNameSnapshot || '상품'} ${item.quantity || 0}개`
  }
}

function mapOrderItemToActivity(item: ProfileOrderItem): ActivityItem {
  return {
    id: `ord-${item.id}`,
    activityNumber: item.orderCode || `ORD-${item.id}`,
    activityKind: 'ORDER',
    providerChannelCode: item.providerChannelCode,
    sourceType: item.sourceType,
    statusGroup: mapOrderStatusGroup(item.orderStatus),
    statusLabel: mapOrderStatusLabel(item.orderStatus),
    storeName: item.providerName || item.providerChannelCode,
    orderTypeLabel: item.orderFlowType || '-',
    activityAt: toActivityAt(item.createdAt),
    totalAmount: Number(item.totalAmount || 0),
    summaryText: item.itemSummary || '-'
  }
}

export default function ProfileOrdersPage() {
  const router = useRouter()
  const [selectedModalType, setSelectedModalType] = useState<ProfileOrderModalType>('ALL')
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<ProductSourceFilter>('ALL')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [summaryState, setSummaryState] = useState({
    totalCount: 0,
    cartItemCount: 0,
    orderCount: 0,
    activeOrderCount: 0,
    completedOrderCount: 0
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false)
  const [isReceiptLoading, setIsReceiptLoading] = useState<boolean>(false)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<ProfileOrderDetail | null>(null)
  const [receiptQuantities, setReceiptQuantities] = useState<Record<number, number>>({})
  const [isReceiptQuantityEditable, setIsReceiptQuantityEditable] = useState<boolean>(false)
  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([])
  const [viewportWidth, setViewportWidth] = useState<number>(1280)

  useEffect(() => {
    let mounted = true

    async function loadProfileOrders() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const [summary, cartItems, orderItems] = await Promise.all([
          fetchProfileOrdersSummary(),
          fetchProfileCartItems(),
          fetchProfileOrders()
        ])

        if (!mounted) {
          return
        }

        setSummaryState(summary)
        setActivities([
          ...cartItems.map(mapCartItemToActivity),
          ...orderItems.map(mapOrderItemToActivity)
        ])
      } catch (error) {
        if (!mounted) {
          return
        }
        const message = error instanceof Error ? error.message : '개인 주문 데이터를 불러오지 못했습니다.'
        setLoadError(message)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadProfileOrders()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth)
    }

    onResize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const summary = useMemo(() => {
    return {
      all: summaryState.totalCount,
      cart: summaryState.cartItemCount,
      order: summaryState.orderCount,
      inProgress: summaryState.activeOrderCount,
      completed: summaryState.completedOrderCount
    }
  }, [summaryState])

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
    const byModal = filterByModalType(activities, selectedModalType)
    if (selectedSourceFilter === 'ALL') {
      return byModal
    }
    return byModal.filter((item) => item.sourceType === selectedSourceFilter)
  }, [activities, selectedModalType, selectedSourceFilter])

  const selectedMeta = MODAL_META[selectedModalType]
  const isCartModal = selectedModalType === 'CART'
  const isMobileViewport = viewportWidth <= 640
  const isTabletViewport = viewportWidth > 640 && viewportWidth <= 1024
  const cartSummaryColumnWidth = isTabletViewport ? '280px' : '300px'
  const cartModalPanelWidth = isMobileViewport
    ? 'calc(100vw - 20px)'
    : isTabletViewport
      ? 'calc(100vw - 32px)'
      : 'min(1180px, calc(100vw - 48px))'
  const cartModalMaxHeight = isMobileViewport ? 'calc(100vh - 24px)' : 'calc(100vh - 72px)'
  const cartThumbnailSize = isMobileViewport ? '100px' : 'clamp(100px, 12vw, 180px)'
  const visibleCartItems = useMemo(() => {
    return modalActivities.filter((item) => item.activityKind === 'CART')
  }, [modalActivities])

  const visibleSelectedCartItems = useMemo(() => {
    return visibleCartItems.filter((item) => selectedCartIds.includes(item.id))
  }, [visibleCartItems, selectedCartIds])

  const cartSummary = useMemo(() => {
    const totalProductAmount = visibleSelectedCartItems.reduce((sum, item) => {
      return sum + Number(item.totalAmount || 0)
    }, 0)
    const totalDeliveryAmount = 0
    const totalAmount = totalProductAmount + totalDeliveryAmount

    return {
      totalProductAmount,
      totalDeliveryAmount,
      totalAmount,
      selectedCount: visibleSelectedCartItems.length
    }
  }, [visibleSelectedCartItems])

  const isAllVisibleSelected = useMemo(() => {
    if (visibleCartItems.length < 1) {
      return false
    }
    return visibleCartItems.every((item) => selectedCartIds.includes(item.id))
  }, [visibleCartItems, selectedCartIds])

  function handleOpenModal(type: ProfileOrderModalType) {
    setSelectedModalType(type)
    setSelectedSourceFilter('ALL')
    if (type === 'CART') {
      const allCartIds = activities
        .filter((item) => item.activityKind === 'CART')
        .map((item) => item.id)
      setSelectedCartIds(allCartIds)
    }
    setIsDetailModalOpen(true)
  }

  function buildFallbackReceipt(item: ActivityItem): ProfileOrderDetail {
    return {
      id: Number(item.id.replace(/\D/g, '') || '0'),
      orderCode: item.activityNumber,
      providerChannelCode: item.storeName,
      providerName: item.storeName,
      storeName: item.storeName,
      sourceType: item.sourceType,
      orderFlowType: item.orderTypeLabel,
      orderStatus: item.statusLabel,
      totalAmount: item.totalAmount,
      createdAt: item.activityAt,
      orderedAt: item.activityAt,
      items: [
        {
          id: 1,
          itemName: item.summaryText,
          productNameSnapshot: item.summaryText,
          quantity: 1,
          unitPrice: item.totalAmount,
          lineTotal: item.totalAmount,
          lineTotalAmount: item.totalAmount,
          options: []
        }
      ]
    }
  }

  async function handleOpenReceipt(item: ActivityItem) {
    setIsReceiptModalOpen(true)
    setIsReceiptLoading(true)
    setReceiptError(null)
    setReceiptData(null)
    setReceiptQuantities({})
    setIsReceiptQuantityEditable(item.activityKind === 'CART')

    try {
      if (item.activityKind !== 'ORDER') {
        setReceiptData(buildFallbackReceipt(item))
        return
      }

      const orderId = Number(item.id.replace('ord-', ''))
      if (!Number.isFinite(orderId) || orderId <= 0) {
        setReceiptData(buildFallbackReceipt(item))
        return
      }

      const detail = await fetchProfileOrderDetail(orderId)
      setReceiptData(detail)
    } catch (error) {
      const message = error instanceof Error ? error.message : '상세 내역을 불러오지 못했습니다.'
      setReceiptError(message)
      setReceiptData(buildFallbackReceipt(item))
    } finally {
      setIsReceiptLoading(false)
    }
  }

  function handleOrderFromCart(item: ActivityItem) {
    if (item.activityKind !== 'CART') {
      return
    }

    const channelCode = String(item.providerChannelCode ?? '').trim()
    if (!channelCode) {
      window.alert('주문 기능 준비중')
      return
    }

    router.push(`/channel/${channelCode}?openOrder=true`)
  }

  function isDeliveryFlow(orderFlowType: string | null | undefined): boolean {
    const value = String(orderFlowType ?? '').trim().toUpperCase()
    return value.includes('DELIVERY') || value.includes('배달')
  }

  function getDeliveryAddressText(detail: ProfileOrderDetail): string {
    const record = detail as unknown as Record<string, unknown>
    const candidates = [
      record.deliveryAddress,
      record.shippingAddress,
      record.address,
      record.roadAddress
    ]
    const found = candidates.find((value) => typeof value === 'string' && value.trim().length > 0)
    if (typeof found === 'string') {
      return found
    }
    return '배송지 정보 없음'
  }

  function getItemOptionTotal(optionList: Array<{ optionQuantity: number; optionPrice: number }>): number {
    return optionList.reduce((sum, option) => {
      const optionQty = Number(option.optionQuantity || 0)
      const optionPrice = Number(option.optionPrice || 0)
      return sum + (optionQty * optionPrice)
    }, 0)
  }

  function getEffectiveQuantity(itemId: number, fallback: number): number {
    const fromState = receiptQuantities[itemId]
    if (Number.isFinite(fromState) && fromState > 0) {
      return fromState
    }
    const normalized = Number(fallback || 0)
    return normalized > 0 ? normalized : 1
  }

  function handleChangeReceiptQuantity(itemId: number, delta: number) {
    if (!isReceiptQuantityEditable) {
      return
    }

    setReceiptQuantities((prev) => {
      const current = prev[itemId] ?? 1
      const next = Math.max(1, current + delta)
      return {
        ...prev,
        [itemId]: next
      }
    })
  }

  useEffect(() => {
    if (!receiptData?.items?.length) {
      return
    }

    const next: Record<number, number> = {}
    receiptData.items.forEach((item) => {
      next[item.id] = Math.max(1, Number(item.quantity || 1))
    })
    setReceiptQuantities(next)
  }, [receiptData])

  function handleToggleCartItem(itemId: string) {
    setSelectedCartIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId)
      }
      return [...prev, itemId]
    })
  }

  function handleToggleAllVisibleCartItems() {
    const visibleIds = visibleCartItems.map((item) => item.id)
    if (visibleIds.length < 1) {
      return
    }

    setSelectedCartIds((prev) => {
      const hasAll = visibleIds.every((id) => prev.includes(id))
      if (hasAll) {
        return prev.filter((id) => !visibleIds.includes(id))
      }
      const merged = new Set([...prev, ...visibleIds])
      return Array.from(merged)
    })
  }

  function handleCartBatchOrder() {
    window.alert('주문 기능 준비중')
  }

  async function handleDeleteCartItem(activityId: string) {
    const cartItemId = Number(activityId.replace('cart-', ''))
    if (!Number.isFinite(cartItemId) || cartItemId <= 0) {
      window.alert('삭제할 장바구니 항목 정보를 찾을 수 없습니다.')
      return
    }

    try {
      await deleteCartItemApi(cartItemId)
      setActivities((prev) => prev.filter((item) => item.id !== activityId))
      setSelectedCartIds((prev) => prev.filter((id) => id !== activityId))
      setSummaryState((prev) => ({
        ...prev,
        cartItemCount: Math.max(0, prev.cartItemCount - 1),
        totalCount: Math.max(0, prev.totalCount - 1)
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : '장바구니 삭제에 실패했습니다.'
      window.alert(message)
    }
  }

  function handleThumbnailOrderEntry(item: ActivityItem) {
    const targetChannelCode = String(
      (item as ActivityItem & { businessChannelCode?: string }).providerChannelCode
      || (item as ActivityItem & { businessChannelCode?: string }).businessChannelCode
      || ''
    ).trim()

    if (!targetChannelCode) {
      window.alert('주문 페이지 정보를 찾을 수 없습니다.')
      return
    }

    router.push(`/channel/${targetChannelCode}?openOrder=true`)
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
            {isLoading ? (
              <p className={styles.hubNotice}>로딩 중...</p>
            ) : null}
            {loadError ? (
              <p className={styles.hubNotice}>{loadError}</p>
            ) : null}
          </section>
        </section>
      </section>

      <BaseModal
        open={isDetailModalOpen}
        type="info"
        title={selectedMeta.title}
        description={selectedMeta.description}
        titleStyle={{ fontSize: 22, fontWeight: 800 }}
        descriptionStyle={{ fontSize: 15 }}
        headerRight={(
          <div className={styles.modalFilterBar}>
            {SOURCE_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={selectedSourceFilter === item.key ? styles.sourceFilterActive : styles.sourceFilter}
                style={{ fontSize: 14 }}
                onClick={() => {
                  setSelectedSourceFilter(item.key)
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              className={styles.detailButton}
              style={{ marginLeft: 'auto', fontSize: 15, minWidth: 94 }}
              onClick={() => {
                setIsDetailModalOpen(false)
              }}
            >
              닫기
            </button>
          </div>
        )}
        onClose={() => {
          setIsDetailModalOpen(false)
        }}
        autoClose={false}
        hideDefaultButton
        showCloseButton={false}
        closeButtonInHeaderActions={false}
        hideIcon
        panelStyle={{
          width: isCartModal ? cartModalPanelWidth : 'min(990px, calc(100vw - 24px))',
          maxHeight: isCartModal ? cartModalMaxHeight : 'calc(100vh - 24px)',
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
          {modalActivities.length < 1 ? (
            <div className={styles.emptyState}>
              선택한 조건에 맞는 내역이 없습니다.
            </div>
          ) : selectedModalType === 'CART' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobileViewport ? '1fr' : `minmax(0, 1fr) ${cartSummaryColumnWidth}`,
                gap: '12px',
                alignItems: 'start'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#334155'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={handleToggleAllVisibleCartItems}
                    />
                    전체 선택
                  </label>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                      선택 {cartSummary.selectedCount}개
                    </span>
                  </div>

                  <div className={styles.modalList}>
                    {visibleCartItems.map((item) => {
                      const checked = selectedCartIds.includes(item.id)
                      return (
                        <article key={item.id} className={styles.modalCard} style={{ minHeight: isMobileViewport ? 'auto' : '220px' }}>
                          <div className={styles.cardHeader}>
                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                minWidth: 0
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  handleToggleCartItem(item.id)
                                }}
                              />
                              <strong className={styles.activityNumber} style={{ fontSize: 16 }}>
                                {item.activityNumber}
                              </strong>
                            </label>
                            <span className={styles.statusBadge}>장바구니</span>
                          </div>

                          <div className={styles.badgeRow} style={{ width: '100%' }}>
                            <span className={styles.sourceBadge} style={{ fontSize: 14 }}>{sourceLabel(item.sourceType)}</span>
                            <span className={styles.methodBadge} style={{ fontSize: 14 }}>{item.orderTypeLabel}</span>
                            <button
                              type="button"
                              className={styles.detailButton}
                              style={{ minWidth: '62px', height: '30px', fontSize: 14, marginLeft: 'auto' }}
                              onClick={() => {
                                void handleDeleteCartItem(item.id)
                              }}
                            >
                              삭제
                            </button>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: `${cartThumbnailSize} minmax(0, 1fr)`,
                              gap: '10px',
                              alignItems: 'start'
                            }}
                          >
                            <button
                              type="button"
                              style={{
                                width: cartThumbnailSize,
                                height: cartThumbnailSize,
                                aspectRatio: '1 / 1',
                                borderRadius: '14px',
                                overflow: 'hidden',
                                border: '1px solid #d8e0eb',
                                background: '#eef2f7',
                                flexShrink: 0,
                                padding: 0,
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                handleThumbnailOrderEntry(item)
                              }}
                              aria-label="주문유형 선택으로 이동"
                            >
                              {item.thumbnailUrl ? (
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.summaryText || '상품 이미지'}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    color: '#8a97ab'
                                  }}
                                >
                                  NO IMAGE
                                </div>
                              )}
                            </button>

                            <div className={styles.cardBody} style={{ minHeight: cartThumbnailSize }}>
                              <p className={styles.cardMeta} style={{ fontSize: 14 }}>
                                <span style={{ fontSize: 14 }}>매장명</span>
                                <strong style={{ fontSize: 16 }}>{item.storeName}</strong>
                              </p>
                              <p className={styles.cardMeta} style={{ fontSize: 14 }}>
                                <span style={{ fontSize: 14 }}>금액</span>
                                <strong style={{ fontSize: 17 }}>{formatPrice(item.totalAmount)}</strong>
                              </p>
                              <p className={styles.cardMeta} style={{ fontSize: 14 }}>
                                <span style={{ fontSize: 14 }}>상품 요약</span>
                                <strong style={{ fontSize: 16 }}>{item.summaryText}</strong>
                              </p>

                              <div
                                style={{
                                  marginTop: 'auto',
                                  display: 'flex',
                                  justifyContent: 'flex-end'
                                }}
                              >
                                <button
                                  type="button"
                                  className={styles.detailButton}
                                  style={{ fontSize: 15, minWidth: 120 }}
                                  onClick={() => {
                                    void handleOpenReceipt(item)
                                  }}
                                >
                                  상세보기
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>

                <aside
                  style={{
                    border: '1px solid #d8e0eb',
                    borderRadius: '16px',
                    background: '#ffffff',
                    padding: '14px',
                    position: 'sticky',
                    top: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>주문 예상 금액</strong>
                  <p className={styles.cardMeta} style={{ fontSize: 16 }}>
                    <span style={{ fontSize: 16 }}>총 상품 가격</span>
                    <strong style={{ fontSize: 16 }}>{formatPrice(cartSummary.totalProductAmount)}</strong>
                  </p>
                  <p className={styles.cardMeta} style={{ fontSize: 16 }}>
                    <span style={{ fontSize: 16 }}>총 배송비</span>
                    <strong style={{ fontSize: 16 }}>{formatPrice(cartSummary.totalDeliveryAmount)}</strong>
                  </p>
                  <p className={styles.cardMeta} style={{ fontSize: 16 }}>
                    <span style={{ fontSize: 16 }}>선택 상품 수</span>
                    <strong style={{ fontSize: 16 }}>{cartSummary.selectedCount}개</strong>
                  </p>
                  <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '2px', paddingTop: '10px' }}>
                    <p className={styles.cardMeta} style={{ fontSize: 18 }}>
                      <span style={{ fontSize: 18 }}>합계 금액</span>
                      <strong style={{ fontSize: 18 }}>{formatPrice(cartSummary.totalAmount)}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.orderButton}
                    style={{ width: '100%', marginTop: '4px', fontSize: 16 }}
                    onClick={handleCartBatchOrder}
                  >
                    주문하기
                  </button>
                </aside>
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
                      <button
                        type="button"
                        className={styles.detailButton}
                        onClick={() => {
                          void handleOpenReceipt(item)
                        }}
                      >
                        상세보기
                      </button>
                      {item.activityKind === 'CART' ? (
                        <button
                          type="button"
                          className={styles.orderButton}
                          onClick={() => {
                            handleOrderFromCart(item)
                          }}
                        >
                          주문하기
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
        </div>
      </BaseModal>

      <BaseModal
        open={isReceiptModalOpen}
        type="info"
        title="주문내역"
        description="상세 주문 내역"
        onClose={() => {
          setIsReceiptModalOpen(false)
        }}
        autoClose={false}
        hideDefaultButton
        showCloseButton
        closeButtonInHeaderActions
        hideIcon
        panelStyle={{
          width: 'min(560px, calc(100vw - 24px))',
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
          {isReceiptLoading ? (
            <div className={styles.emptyState}>로딩 중...</div>
          ) : receiptData ? (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', background: '#fff', padding: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                {receiptData.storeName || receiptData.providerName || '-'}
              </h3>
              <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#475569' }}>
                주문일시: {receiptData.orderedAt || receiptData.createdAt || '-'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                총 금액: {formatPrice(
                  receiptData.items.reduce((sum, menu) => {
                    const qty = getEffectiveQuantity(menu.id, menu.quantity)
                    const unitPrice = Number(menu.unitPrice || 0)
                    const optionTotal = getItemOptionTotal(menu.options)
                    return sum + ((unitPrice * qty) + optionTotal)
                  }, 0)
                )}
              </p>

              {isDeliveryFlow(receiptData.orderFlowType) ? (
                <div style={{ marginTop: '12px', border: '1px solid #dbe5f0', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>배송지</strong>
                    <button
                      type="button"
                      className={styles.detailButton}
                      onClick={() => {
                        window.alert('주소 변경 기능 준비중')
                      }}
                    >
                      주소 변경
                    </button>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#334155' }}>
                    {getDeliveryAddressText(receiptData)}
                  </p>
                </div>
              ) : null}

              <div style={{ marginTop: '16px', fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>주문내역</div>
              <div style={{ marginTop: '8px', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '10px 0' }}>
                {receiptData.items.map((menu) => {
                  const quantity = getEffectiveQuantity(menu.id, menu.quantity)
                  const unitPrice = Number(menu.unitPrice || 0)
                  const optionTotal = getItemOptionTotal(menu.options)
                  const lineTotal = (unitPrice * quantity) + optionTotal

                  return (
                    <div key={menu.id} style={{ padding: '10px 0' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        {menu.itemName || menu.productNameSnapshot || '-'}
                      </div>
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '13px', color: '#334155' }}>
                          {quantity}개 · {formatPrice(unitPrice)}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className={styles.detailButton}
                            disabled={!isReceiptQuantityEditable}
                            onClick={() => {
                              handleChangeReceiptQuantity(menu.id, -1)
                            }}
                          >
                            -
                          </button>
                          <strong style={{ minWidth: '18px', textAlign: 'center', fontSize: '14px', color: '#0f172a' }}>
                            {quantity}
                          </strong>
                          <button
                            type="button"
                            className={styles.detailButton}
                            disabled={!isReceiptQuantityEditable}
                            onClick={() => {
                              handleChangeReceiptQuantity(menu.id, 1)
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {menu.options.map((opt, index) => (
                        <div key={`${menu.id}-${index}`} style={{ marginTop: '2px', fontSize: '13px', color: '#475569' }}>
                          옵션: {opt.optionName} x {opt.optionQuantity} +{formatPrice(opt.optionPrice)}
                        </div>
                      ))}
                      <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        소계: {formatPrice(lineTotal)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>총 결제금액</span>
                <strong style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                  {formatPrice(
                    receiptData.items.reduce((sum, menu) => {
                      const qty = getEffectiveQuantity(menu.id, menu.quantity)
                      const unitPrice = Number(menu.unitPrice || 0)
                      const optionTotal = getItemOptionTotal(menu.options)
                      return sum + ((unitPrice * qty) + optionTotal)
                    }, 0)
                  )}
                </strong>
              </div>
              {!isReceiptQuantityEditable ? (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                  진행중/완료 주문은 수량 변경이 제한됩니다.
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.emptyState}>{receiptError || '상세 내역이 없습니다.'}</div>
          )}
        </div>
      </BaseModal>
    </main>
  )
}

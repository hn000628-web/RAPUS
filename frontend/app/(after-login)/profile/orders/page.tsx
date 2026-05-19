'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import styles from './ProfileOrdersPage.module.css'

type OrderStatus =
  | 'WAITING'
  | 'PREPARING'
  | 'DONE'
  | 'CANCELED'

type OrderType =
  | 'PICKUP'
  | 'DELIVERY'

type OrderItem = {
  id: string
  orderNumber: string
  storeName: string
  orderType: OrderType
  orderStatus: OrderStatus
  orderedAt: string
  totalAmount: number
  summaryText: string
}

type FilterKey =
  | 'ALL'
  | 'PICKUP'
  | 'DELIVERY'
  | 'DONE'
  | 'CANCELED'

const MOCK_ORDERS: OrderItem[] = [
  {
    id: 'ord-001',
    orderNumber: 'ORD-2026-0519-001',
    storeName: '라푸스 버거 스토어',
    orderType: 'PICKUP',
    orderStatus: 'PREPARING',
    orderedAt: '2026-05-19 10:42',
    totalAmount: 18900,
    summaryText: '불고기버거 외 1건'
  },
  {
    id: 'ord-002',
    orderNumber: 'ORD-2026-0518-017',
    storeName: '라푸스 델리',
    orderType: 'DELIVERY',
    orderStatus: 'DONE',
    orderedAt: '2026-05-18 19:16',
    totalAmount: 25400,
    summaryText: '데리야끼버거 외 2건'
  },
  {
    id: 'ord-003',
    orderNumber: 'ORD-2026-0517-043',
    storeName: '라푸스 피자',
    orderType: 'DELIVERY',
    orderStatus: 'CANCELED',
    orderedAt: '2026-05-17 13:20',
    totalAmount: 0,
    summaryText: '주문 취소'
  }
]

function formatPrice(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

function statusLabel(status: OrderStatus): string {
  if (status === 'WAITING') return '접수대기'
  if (status === 'PREPARING') return '준비중'
  if (status === 'DONE') return '완료'
  return '취소'
}

function orderTypeLabel(type: OrderType): string {
  return type === 'PICKUP' ? '픽업' : '배달'
}

export default function ProfileOrdersPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('ALL')

  const summary = useMemo(() => {
    return {
      all: MOCK_ORDERS.length,
      active: MOCK_ORDERS.filter((order) => order.orderStatus === 'WAITING' || order.orderStatus === 'PREPARING').length,
      done: MOCK_ORDERS.filter((order) => order.orderStatus === 'DONE').length,
      canceled: MOCK_ORDERS.filter((order) => order.orderStatus === 'CANCELED').length
    }
  }, [])

  const visibleOrders = useMemo(() => {
    if (filter === 'ALL') return MOCK_ORDERS
    if (filter === 'PICKUP') return MOCK_ORDERS.filter((order) => order.orderType === 'PICKUP')
    if (filter === 'DELIVERY') return MOCK_ORDERS.filter((order) => order.orderType === 'DELIVERY')
    if (filter === 'DONE') return MOCK_ORDERS.filter((order) => order.orderStatus === 'DONE')
    return MOCK_ORDERS.filter((order) => order.orderStatus === 'CANCELED')
  }, [filter])

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.headerCard}>
          <div>
            <h1 className={styles.title}>개인 주문 내역</h1>
            <p className={styles.description}>내가 주문한 픽업/배달 주문 내역을 확인합니다.</p>
          </div>

          <button
            type="button"
            className={styles.backButton}
            onClick={() => {
              router.push('/profile')
            }}
          >
            마이페이지로 돌아가기
          </button>
        </header>

        <section className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>전체 주문</span>
            <strong className={styles.summaryValue}>{summary.all}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>진행중</span>
            <strong className={styles.summaryValue}>{summary.active}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>완료</span>
            <strong className={styles.summaryValue}>{summary.done}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>취소</span>
            <strong className={styles.summaryValue}>{summary.canceled}</strong>
          </article>
        </section>

        <section className={styles.filterRow}>
          {(['ALL', 'PICKUP', 'DELIVERY', 'DONE', 'CANCELED'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={filter === key ? styles.filterButtonActive : styles.filterButton}
              onClick={() => {
                setFilter(key)
              }}
            >
              {key === 'ALL' && '전체'}
              {key === 'PICKUP' && '픽업'}
              {key === 'DELIVERY' && '배달'}
              {key === 'DONE' && '완료'}
              {key === 'CANCELED' && '취소'}
            </button>
          ))}
        </section>

        {visibleOrders.length < 1 ? (
          <section className={styles.emptyBox}>
            <strong className={styles.emptyTitle}>주문 내역이 없습니다.</strong>
            <p className={styles.emptyDescription}>필터 조건에 맞는 주문 내역이 없습니다.</p>
          </section>
        ) : (
          <section className={styles.orderList}>
            {visibleOrders.map((order) => (
              <article key={order.id} className={styles.orderCard}>
                <div className={styles.orderTop}>
                  <strong className={styles.orderNumber}>{order.orderNumber}</strong>
                  <span className={styles.orderStatus}>{statusLabel(order.orderStatus)}</span>
                </div>

                <div className={styles.orderRows}>
                  <p className={styles.row}><span>매장명</span><strong>{order.storeName}</strong></p>
                  <p className={styles.row}><span>주문유형</span><strong>{orderTypeLabel(order.orderType)}</strong></p>
                  <p className={styles.row}><span>주문일시</span><strong>{order.orderedAt}</strong></p>
                  <p className={styles.row}><span>결제금액</span><strong>{formatPrice(order.totalAmount)}</strong></p>
                  <p className={styles.row}><span>주문상품</span><strong>{order.summaryText}</strong></p>
                </div>

                <div className={styles.orderFooter}>
                  <button type="button" className={styles.detailButton}>상세보기</button>
                </div>
              </article>
            ))}
          </section>
        )}

        <p className={styles.noticeText}>
          목업 화면입니다. 실제 주문 데이터 연결은 추후 진행됩니다.
        </p>
      </section>
    </main>
  )
}


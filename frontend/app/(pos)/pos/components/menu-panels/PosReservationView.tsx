// FILE : frontend/app/(pos)/pos/components/views/PosReservationView.tsx
// ROOT : frontend/app/(pos)/pos/components/views/PosReservationView.tsx
// STATUS : MODIFY MODE
// ROLE : POS RESERVATION VIEW COMPONENT
// CHANGE SUMMARY :
// - 예약주문 카드 리스트 UI 유지
// - props 누락 시에도 런타임 오류가 나지 않도록 방어 처리 추가
// - DB/API 연결 없음

// SECTION 01 : IMPORT
import type { CSSProperties } from 'react'

import styles from '../../PosPage.module.css'

import { PosReservationOrderItem } from '../posTypes'

// SECTION 02 : TYPE
type PosReservationViewProps = {
  reservationOrders?: PosReservationOrderItem[]
}

// SECTION 03 : COMPONENT
export default function PosReservationView({
  reservationOrders = []
}: PosReservationViewProps) {
  return (
    <section className={styles.reservationView}>
      <div className={styles.reservationActionRow}>
        <button type="button" style={ghostButtonStyle}>
          전화주문 등록
        </button>
        <button type="button" style={ghostButtonStyle}>
          모바일 예약 새로고침
        </button>
      </div>

      <div className={styles.reservationGuideBox}>
        예약 예정 주문을 카드 형태로 미리 확인하는 목업 화면입니다.
      </div>

      <div className={styles.reservationList}>
        {reservationOrders.map((order) => (
          <article key={order.id} className={styles.reservationCard}>
            <div className={styles.reservationCardHeader}>
              <div className={styles.reservationOrderNumberWrap}>
                <strong className={styles.reservationOrderNumber}>{order.orderNo}</strong>
              </div>
              <span
                className={styles.reservationTypeBadge}
                style={badgeStyleByType[order.reservationType]}
              >
                {order.reservationLabel}
              </span>
            </div>

            <div className={styles.reservationMetaRow}>
              <span className={styles.reservationMetaLabel}>{order.scheduledLabel}</span>
              <strong className={styles.reservationMetaValue}>{order.scheduledTime}</strong>
            </div>

            <p className={styles.reservationSummaryText}>
              내용 : {order.summaryText}
            </p>

            {order.customerName && (
              <p className={styles.reservationCustomerText}>
                예약자 : {order.customerName}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

// SECTION 04 : STYLE
const ghostButtonStyle: CSSProperties = {
  height: '40px',
  padding: '0 14px',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer'
}

const baseBadgeStyle: CSSProperties = {
  border: 'none'
}

const badgeStyleByType: Record<PosReservationOrderItem['reservationType'], CSSProperties> = {
  VISIT: {
    ...baseBadgeStyle,
    backgroundColor: '#e0f2fe',
    color: '#075985'
  },
  DELIVERY: {
    ...baseBadgeStyle,
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  PICKUP: {
    ...baseBadgeStyle,
    backgroundColor: '#fef3c7',
    color: '#92400e'
  }
}

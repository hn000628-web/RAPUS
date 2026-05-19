// FILE : frontend/app/(pos)/pos/components/views/PosOrderHistoryView.tsx
// ROOT : frontend/app/(pos)/pos/components/views/PosOrderHistoryView.tsx
// STATUS : MODIFY MODE
// ROLE : POS ORDER HISTORY VIEW COMPONENT
// CHANGE SUMMARY :
// - 오늘 주문내역 본문 화면의 한글 인코딩 복구
// - 기존 주문 상태 전환 버튼 구조 유지
// - DB/API 연결 없음

// SECTION 01 : IMPORT
import styles from '../../PosPage.module.css'

import { DailyOrderItem } from '../posTypes'

// SECTION 02 : TYPE
type PosOrderHistoryViewProps = {
  dailyOrders: DailyOrderItem[]
  onConfirmOrder: (orderId: string) => void
  onRevertToWaiting: (orderId: string) => void
  onEditOrder: (orderId: string) => void
  onPayOrder: (orderId: string) => void
}

// SECTION 03 : COMPONENT
export default function PosOrderHistoryView({
  dailyOrders,
  onConfirmOrder,
  onRevertToWaiting,
  onEditOrder,
  onPayOrder
}: PosOrderHistoryViewProps) {
  return (
    <section className={styles.dailyOrderList}>
      {dailyOrders.map((order) => {
        const isPaid = order.paymentStatus === 'PAID'
        const isConfirmed = order.orderStatus === 'ORDER_CONFIRMED'
        const isWaiting = order.orderStatus === 'ORDER_WAITING'
        const isProcessed = order.orderStatus !== 'ORDER_REQUESTED'
        const isEditable = !isPaid && !isConfirmed

        return (
          <article
            key={order.id}
            className={[
              styles.dailyOrderCard,
              isProcessed ? styles.dailyOrderCardProcessed : '',
              isWaiting ? styles.dailyOrderCardWaiting : '',
              isPaid ? styles.dailyOrderCardLocked : ''
            ].join(' ').trim()}
          >
            <div className={styles.dailyOrderTop}>
              <strong className={styles.dailyOrderNumber}>{order.orderNumber}</strong>
              <span className={styles.dailyOrderAmount}>{order.amount.toLocaleString('ko-KR')}원</span>
            </div>

            <div className={styles.dailyOrderMeta}>
              <span>{order.tableNo}번 테이블</span>
              <span>{getOrderStatusLabel(order.orderStatus)}</span>
              <span>{getPaymentStatusLabel(order.paymentStatus)}</span>
              <span className={styles.dailyOrderEditState}>
                {isEditable ? '수정 가능' : '수정 불가'}
              </span>
            </div>

            <ul className={styles.dailyOrderItems}>
              {order.items.map((item) => (
                <li key={`${order.id}-${item}`} className={styles.dailyOrderItemText}>
                  {item}
                </li>
              ))}
            </ul>

            <div className={styles.dailyOrderActionRow}>
              {isPaid ? (
                <span className={styles.dailyOrderDoneText}>결제완료 · 수정 불가</span>
              ) : order.orderStatus === 'ORDER_REQUESTED' ? (
                <button
                  type="button"
                  className={styles.dailyOrderConfirmButton}
                  onClick={() => onConfirmOrder(order.id)}
                >
                  확정
                </button>
              ) : order.orderStatus === 'ORDER_CONFIRMED' ? (
                <>
                  <button
                    type="button"
                    className={styles.dailyOrderWaitButton}
                    onClick={() => onEditOrder(order.id)}
                  >
                    수정하기
                  </button>
                  <button
                    type="button"
                    className={styles.dailyOrderWaitButton}
                    onClick={() => onRevertToWaiting(order.id)}
                  >
                    대기 전환
                  </button>
                  <button
                    type="button"
                    className={styles.dailyOrderConfirmButton}
                    onClick={() => onPayOrder(order.id)}
                  >
                    결제하기
                  </button>
                </>
              ) : order.orderStatus === 'ORDER_WAITING' ? (
                <button
                  type="button"
                  className={styles.dailyOrderConfirmButton}
                  onClick={() => onConfirmOrder(order.id)}
                >
                  확정
                </button>
              ) : (
                <span className={styles.dailyOrderDoneText}>수정 불가</span>
              )}
            </div>
          </article>
        )
      })}
    </section>
  )
}

// SECTION 04 : UTIL
function getOrderStatusLabel(status: DailyOrderItem['orderStatus']) {
  if (status === 'ORDER_CONFIRMED') {
    return '확정완료'
  }

  if (status === 'ORDER_WAITING') {
    return '대기처리'
  }

  return '주문요청'
}

function getPaymentStatusLabel(status: DailyOrderItem['paymentStatus']) {
  if (status === 'PAID') {
    return '결제완료'
  }

  return '미결제'
}

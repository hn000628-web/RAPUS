// FILE : frontend/app/(pos)/pos/components/views/PosSalesHistoryView.tsx
// ROOT : frontend/app/(pos)/pos/components/views/PosSalesHistoryView.tsx
// STATUS : MODIFY MODE
// ROLE : POS SALES HISTORY VIEW COMPONENT
// CHANGE SUMMARY :
// - 오늘 매출내역 본문 화면의 한글 인코딩 복구
// - 기존 결제카드 선택 구조와 active 스타일 유지
// - DB/API 연결 없음

// SECTION 01 : IMPORT
import styles from '../../PosPage.module.css'

import { DailyOrderItem } from '../posTypes'

// SECTION 02 : TYPE
type PosSalesHistoryViewProps = {
  salesOrders: DailyOrderItem[]
  selectedSalesPaymentId: string | null
  onSelectSalesPayment: (paymentId: string) => void
}

// SECTION 03 : COMPONENT
export default function PosSalesHistoryView({
  salesOrders,
  selectedSalesPaymentId,
  onSelectSalesPayment
}: PosSalesHistoryViewProps) {
  return (
    <section className={styles.salesList}>
      {salesOrders.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <h2 className={styles.emptyStateTitle}>매출내역 없음</h2>
          <p className={styles.emptyStateText}>선택한 조건의 매출내역이 없습니다.</p>
        </div>
      ) : (
        salesOrders.map((order) => {
          const isSelected = selectedSalesPaymentId === order.id

          return (
            <button
              key={order.id}
              type="button"
              className={`${styles.salesCard} ${isSelected ? styles.salesCardActive : ''}`}
              onClick={() => onSelectSalesPayment(order.id)}
            >
              <div className={styles.salesTop}>
                <strong className={styles.salesOrderNo}>{order.paymentNumber}</strong>
                <span className={styles.salesAmount}>{order.amount.toLocaleString('ko-KR')}원</span>
              </div>
              <div className={styles.salesSummaryLine}>
                <span>{order.tableNo}번 테이블</span>
                <span>·</span>
                <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                <span>·</span>
                <span>{order.paidAt || '-'}</span>
                <span>·</span>
                <span>포인트 {order.pointAmount.toLocaleString('ko-KR')}P</span>
              </div>
            </button>
          )
        })
      )}
    </section>
  )
}

// SECTION 04 : UTIL
function getPaymentMethodLabel(method: DailyOrderItem['paymentMethod']) {
  if (method === 'CARD') {
    return '카드'
  }

  if (method === 'CASH') {
    return '현금'
  }

  return 'QR결제'
}

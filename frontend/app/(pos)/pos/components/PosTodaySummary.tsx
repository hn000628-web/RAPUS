// FILE : frontend/app/(pos)/pos/components/PosTodaySummary.tsx
// ROOT : frontend/app/(pos)/pos/components/PosTodaySummary.tsx
// STATUS : MODIFY MODE
// ROLE : POS TODAY SUMMARY COMPONENT
// CHANGE SUMMARY :
// - 우측 오늘 요약 / 주문내역 / 결제내역 패널을 UTF-8 기준으로 재정리
// - 예약주문 mock summary count 반영
// - 기존 우측 패널 레이아웃과 스타일 유지
// - DB/API 연결 없음

// SECTION 01 : IMPORT
import styles from '../PosPage.module.css'

import {
  DailyOrderItem,
  PosDailySummary,
  PosMenuKey,
  PosReservationSummary,
  PosSalesSummary,
  PosTableItem,
  SalesFilterType
} from './posTypes'

// SECTION 02 : TYPE
type PosTodaySummaryProps = {
  activeMenu: PosMenuKey
  selectedTableOrderSummary: PosTableItem | null
  usingTableCount: number
  confirmedTableCount: number
  totalTableAmount: number
  reservationSummary: PosReservationSummary
  dailySummary: PosDailySummary
  salesSummary: PosSalesSummary
  selectedSalesFilter: SalesFilterType
  selectedSalesPayment: DailyOrderItem | null
  onSelectSalesFilter: (filter: SalesFilterType) => void
  onResetSelectedSalesPayment: () => void
  onResetSelectedTableSummary: () => void
}

// SECTION 03 : COMPONENT
export default function PosTodaySummary({
  activeMenu,
  selectedTableOrderSummary,
  usingTableCount,
  confirmedTableCount,
  totalTableAmount,
  reservationSummary,
  dailySummary,
  salesSummary,
  selectedSalesFilter,
  selectedSalesPayment,
  onSelectSalesFilter,
  onResetSelectedSalesPayment,
  onResetSelectedTableSummary
}: PosTodaySummaryProps) {
  const handleMockPrintOrder = () => {
    console.log('주문인쇄 목업')
  }

  return (
    <aside className={styles.summaryPanel}>
      <div className={styles.summaryBox}>
        <h2 className={styles.summaryTitle}>
          {activeMenu === 'TABLE' && selectedTableOrderSummary
            ? '주문내역'
            : activeMenu === 'SALES_HISTORY' && selectedSalesPayment
              ? '결제내역'
              : '오늘 요약'}
        </h2>

        <div className={styles.summaryList}>
          {activeMenu === 'TABLE' && selectedTableOrderSummary ? (
            <>
              <div className={styles.summaryHeaderRow}>
                <h3 className={styles.summaryDetailTitle}>
                  {selectedTableOrderSummary.tableNo}번 테이블
                </h3>
                <div className={styles.summaryHeaderButtonGroup}>
                  <button
                    type="button"
                    className={styles.summaryBackButton}
                    onClick={onResetSelectedTableSummary}
                  >
                    오늘 요약
                  </button>
                  <button
                    type="button"
                    className={styles.summaryBackButton}
                    onClick={handleMockPrintOrder}
                  >
                    주문인쇄
                  </button>
                </div>
              </div>

              <div className={styles.summaryDetailList}>
                <div className={styles.summaryDetailRow}>
                  <span>테이블 번호</span>
                  <strong>{selectedTableOrderSummary.tableNo}번 테이블</strong>
                </div>
                <div className={styles.summaryDetailRow}>
                  <span>주문 상태</span>
                  <strong>{getTableStatusLabel(selectedTableOrderSummary.status)}</strong>
                </div>
                <div className={styles.summaryDetailRow}>
                  <span>주문금액</span>
                  <strong>{selectedTableOrderSummary.amount.toLocaleString('ko-KR')}원</strong>
                </div>
                <div className={styles.summaryDetailRow}>
                  <span>결제 상태</span>
                  <strong>{selectedTableOrderSummary.paymentStatusLabel}</strong>
                </div>
                <div className={styles.summaryDetailRowColumn}>
                  <span>주문내역</span>
                  {selectedTableOrderSummary.orderItems.length > 0 ? (
                    <ul className={styles.summaryDetailItems}>
                      {selectedTableOrderSummary.orderItems.map((item) => (
                        <li key={`${selectedTableOrderSummary.tableNo}-${item.name}-${item.quantity}`}>
                          {item.name} x{item.quantity}
                          {item.optionSummary ? ` (옵션: ${item.optionSummary})` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.summaryDetailMemo}>주문 내역이 없습니다.</p>
                  )}
                </div>
                <div className={styles.summaryDetailRowColumn}>
                  <span>메모</span>
                  <p className={styles.summaryDetailMemo}>{selectedTableOrderSummary.memo}</p>
                </div>
              </div>
            </>
          ) : activeMenu === 'RESERVATION' ? (
            <>
              <div className={styles.summaryRow}>
                <span>예약주문</span>
                <strong>{reservationSummary.total}건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>확정</span>
                <strong>{reservationSummary.confirmed}건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>대기</span>
                <strong>{reservationSummary.waiting}건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>완료</span>
                <strong>{reservationSummary.completed}건</strong>
              </div>
            </>
          ) : activeMenu === 'ORDER_HISTORY' ? (
            <>
              <div className={styles.summaryRow}>
                <span>총 주문</span>
                <strong>{dailySummary.total}건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>확정완료</span>
                <strong>{dailySummary.confirmed}건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>대기처리</span>
                <strong>{dailySummary.waiting}건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>미처리</span>
                <strong>{dailySummary.requested}건</strong>
              </div>
            </>
          ) : activeMenu === 'DELIVERY' ? (
            <>
              <div className={styles.summaryRow}>
                <span>배달주문</span>
                <strong>0건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>준비중</span>
                <strong>0건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>배달중</span>
                <strong>0건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>완료</span>
                <strong>0건</strong>
              </div>
            </>
          ) : activeMenu === 'PICKUP' ? (
            <>
              <div className={styles.summaryRow}>
                <span>픽업주문</span>
                <strong>0건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>준비중</span>
                <strong>0건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>픽업대기</span>
                <strong>0건</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>완료</span>
                <strong>0건</strong>
              </div>
            </>
          ) : activeMenu === 'SALES_HISTORY' && selectedSalesPayment ? (
            <>
              <div className={styles.summaryHeaderRow}>
                <h3 className={styles.summaryDetailTitle}>결제내역</h3>
                <button
                  type="button"
                  className={styles.summaryBackButton}
                  onClick={onResetSelectedSalesPayment}
                >
                  요약 보기
                </button>
              </div>

              <div className={styles.summaryDetailList}>
                <div className={styles.summaryDetailRow}>
                  <span>결제번호</span>
                  <strong>{selectedSalesPayment.paymentNumber}</strong>
                </div>
                <div className={styles.summaryDetailRow}>
                  <span>주문번호</span>
                  <strong>{selectedSalesPayment.orderNumber}</strong>
                </div>
                <div className={styles.summaryDetailRow}>
                  <span>테이블 번호</span>
                  <strong>{selectedSalesPayment.tableNo}번</strong>
                </div>
                <div className={styles.summaryDetailRow}>
                  <span>주문자 채널코드</span>
                  <strong>{selectedSalesPayment.customerChannelCode}</strong>
                </div>
                <div className={styles.summaryDetailRow}>
                  <span>결제방법</span>
                  <strong>{getPaymentMethodLabel(selectedSalesPayment.paymentMethod)}</strong>
                </div>
                <div className={styles.summaryDetailRowColumn}>
                  <span>주문내역</span>
                  <ul className={styles.summaryDetailItems}>
                    {selectedSalesPayment.orderItems.map((item) => (
                      <li key={`${selectedSalesPayment.id}-${item.name}-${item.quantity}`}>
                        {item.name} x{item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.summaryDetailRow}>
                  <span>합계</span>
                  <strong>{selectedSalesPayment.amount.toLocaleString('ko-KR')}원</strong>
                </div>
                <div className={styles.summaryDetailRowColumn}>
                  <span>메모</span>
                  <p className={styles.summaryDetailMemo}>{selectedSalesPayment.memo}</p>
                </div>
              </div>
            </>
          ) : activeMenu === 'SALES_HISTORY' ? (
            <>
              <button
                type="button"
                className={getSalesSummaryRowClassName(selectedSalesFilter === 'ALL')}
                onClick={() => onSelectSalesFilter('ALL')}
              >
                <span>결제완료</span>
                <strong>{salesSummary.paidCount}건</strong>
              </button>
              <button
                type="button"
                className={getSalesSummaryRowClassName(selectedSalesFilter === 'ALL')}
                onClick={() => onSelectSalesFilter('ALL')}
              >
                <span>총 매출</span>
                <strong>{salesSummary.totalSalesAmount.toLocaleString('ko-KR')}원</strong>
              </button>
              <button
                type="button"
                className={getSalesSummaryRowClassName(selectedSalesFilter === 'CARD')}
                onClick={() => onSelectSalesFilter('CARD')}
              >
                <span>카드결제</span>
                <strong>{salesSummary.cardSalesAmount.toLocaleString('ko-KR')}원</strong>
              </button>
              <button
                type="button"
                className={getSalesSummaryRowClassName(selectedSalesFilter === 'CASH')}
                onClick={() => onSelectSalesFilter('CASH')}
              >
                <span>현금결제</span>
                <strong>{salesSummary.cashSalesAmount.toLocaleString('ko-KR')}원</strong>
              </button>
              <button
                type="button"
                className={getSalesSummaryRowClassName(selectedSalesFilter === 'QR')}
                onClick={() => onSelectSalesFilter('QR')}
              >
                <span>QR결제</span>
                <strong>{salesSummary.qrSalesAmount.toLocaleString('ko-KR')}원</strong>
              </button>
              <button
                type="button"
                className={getSalesSummaryRowClassName(selectedSalesFilter === 'POINT')}
                onClick={() => onSelectSalesFilter('POINT')}
              >
                <span>포인트 적립</span>
                <strong>{salesSummary.totalQrPoints.toLocaleString('ko-KR')}P</strong>
              </button>
            </>
          ) : (
            <>
              <div className={styles.summaryRow}>
                <span>사용중 테이블</span>
                <strong>{usingTableCount}개</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>확정 테이블</span>
                <strong>{confirmedTableCount}개</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>테이블 합계</span>
                <strong>{totalTableAmount.toLocaleString('ko-KR')}원</strong>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

// SECTION 04 : UTIL
function getTableStatusLabel(status: PosTableItem['status']) {
  if (status === 'EMPTY') {
    return '비어있음'
  }

  if (status === 'PAYMENT_WAITING') {
    return '확정'
  }

  return '사용중'
}

function getPaymentMethodLabel(method: DailyOrderItem['paymentMethod']) {
  if (method === 'CARD') {
    return '카드'
  }

  if (method === 'CASH') {
    return '현금'
  }

  return 'QR결제'
}

function getSalesSummaryRowClassName(isActive: boolean) {
  return isActive ? `${styles.summaryRow} ${styles.summaryRowActive}` : styles.summaryRow
}


// FILE : frontend/app/(pos)/pos/components/PosFooterBar.tsx
// ROOT : frontend/app/(pos)/pos/components/PosFooterBar.tsx
// STATUS : MODIFY MODE
// ROLE : POS FOOTER BAR COMPONENT
// CHANGE SUMMARY :
// - 하단 고정 바를 UTF-8 기준으로 재정리
// - activeMenu 기준 텍스트와 버튼명 분기 유지
// - 예약주문 count 반영 가능 구조 유지
// - 테이블 상세 상태일 때 확정/대기전환 버튼 구조 유지
// - DB/API 연결 없음

// SECTION 01 : IMPORT
import styles from '../PosPage.module.css'

import { PosMenuKey, PosTableItem } from './posTypes'

// SECTION 02 : TYPE
type PosFooterBarProps = {
  activeMenu: PosMenuKey
  count: number
  amount?: number
  selectedTableOrderSummary: PosTableItem | null
  onPrimaryAction: () => void
  onSecondaryAction?: () => void
}

// SECTION 03 : COMPONENT
export default function PosFooterBar({
  activeMenu,
  count,
  amount,
  selectedTableOrderSummary,
  onPrimaryAction,
  onSecondaryAction
}: PosFooterBarProps) {
  const isConfirmedTable =
    activeMenu === 'TABLE' &&
    selectedTableOrderSummary !== null &&
    selectedTableOrderSummary.status === 'PAYMENT_WAITING'

  return (
    <div className={styles.footerWrap}>
      <div className={styles.mainFooter}>
        <strong className={styles.footerTotalText}>
          {getFooterSummaryText({
            activeMenu,
            count,
            amount,
            selectedTableOrderSummary
          })}
        </strong>

        <div className={styles.footerActionGroup}>
          {isConfirmedTable && onSecondaryAction && (
            <button
              type="button"
              className={styles.footerSecondaryButton}
              onClick={onSecondaryAction}
            >
              대기전환
            </button>
          )}

          <button
            type="button"
            className={
              isConfirmedTable
                ? `${styles.footerPrimaryButton} ${styles.footerCompletedButton}`
                : styles.footerPrimaryButton
            }
            onClick={onPrimaryAction}
            disabled={isConfirmedTable}
          >
            {getFooterPrimaryLabel(activeMenu, selectedTableOrderSummary)}
          </button>
        </div>
      </div>
    </div>
  )
}

// SECTION 04 : UTIL
function getFooterSummaryText({
  activeMenu,
  count,
  amount,
  selectedTableOrderSummary
}: {
  activeMenu: PosMenuKey
  count: number
  amount?: number
  selectedTableOrderSummary: PosTableItem | null
}) {
  if (activeMenu === 'TABLE' && selectedTableOrderSummary) {
    return `${selectedTableOrderSummary.tableNo}번 테이블 주문금액 : ${selectedTableOrderSummary.amount.toLocaleString('ko-KR')}원`
  }

  if (activeMenu === 'TABLE') {
    return `테이블 합계 : ${(amount ?? 0).toLocaleString('ko-KR')}원`
  }

  if (activeMenu === 'RESERVATION') {
    return `예약주문 : ${count}건`
  }

  if (activeMenu === 'DELIVERY') {
    return `오늘 배달주문 : ${count}건`
  }

  if (activeMenu === 'PICKUP') {
    return `오늘 픽업주문 : ${count}건`
  }

  if (activeMenu === 'ORDER_HISTORY') {
    return `오늘 주문 : ${count}건`
  }

  return `오늘 매출 : ${(amount ?? 0).toLocaleString('ko-KR')}원`
}

function getFooterPrimaryLabel(
  activeMenu: PosMenuKey,
  selectedTableOrderSummary: PosTableItem | null
) {
  if (activeMenu === 'TABLE' && selectedTableOrderSummary) {
    return selectedTableOrderSummary.status === 'PAYMENT_WAITING' ? '확정완료' : '확정하기'
  }

  if (activeMenu === 'TABLE') {
    return '테이블'
  }

  if (activeMenu === 'RESERVATION') {
    return '예약주문'
  }

  if (activeMenu === 'DELIVERY') {
    return '배달주문'
  }

  if (activeMenu === 'PICKUP') {
    return '픽업주문'
  }

  if (activeMenu === 'ORDER_HISTORY') {
    return '주문내역(1일)'
  }

  return '매출내역'
}

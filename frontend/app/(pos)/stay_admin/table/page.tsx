'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import PosSidebar from '../../pos/components/PosSidebar'
import PosTopbar from '../../pos/components/PosTopbar'
import { usePosKeyboardMode } from '../../pos/components/PosKeyboardModeContext'
import { POS_ROOM_MENUS, PosMenuKey } from '../../pos/components/posTypes'

import styles from './RoomsTablePage.module.css'

type TableCard = {
  id: string
  tableNo: string
  status: 'USING' | 'EMPTY' | 'ORDERING' | 'PAYMENT_WAITING' | 'RESERVED'
  amount: number
  orderCount: number
}

const tableCards: TableCard[] = [
  { id: 'table-1', tableNo: '1', status: 'USING', amount: 32000, orderCount: 4 },
  { id: 'table-2', tableNo: '2', status: 'EMPTY', amount: 0, orderCount: 0 },
  { id: 'table-3', tableNo: '3', status: 'PAYMENT_WAITING', amount: 48000, orderCount: 6 },
  { id: 'table-4', tableNo: '4', status: 'RESERVED', amount: 18000, orderCount: 2 },
  { id: 'table-5', tableNo: '5', status: 'ORDERING', amount: 26000, orderCount: 3 },
  { id: 'table-6', tableNo: '6', status: 'USING', amount: 54000, orderCount: 7 }
]

const summaryItems = [
  { label: '전체 테이블', value: '12개' },
  { label: '사용중', value: '5개' },
  { label: '비어있음', value: '4개' },
  { label: '결제대기', value: '2개' },
  { label: '예약석', value: '1개' },
  { label: '오늘 주문', value: '96건' }
]

export default function RoomsTablePage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [activeMenu, setActiveMenu] = useState<PosMenuKey>('TABLE')

  const handleChangeMenu = (menu: PosMenuKey) => {
    setActiveMenu(menu)

    if (menu === 'ROOM_STATUS') {
      router.push('/pos/rooms')
      return
    }

    if (menu === 'COOKING') {
      router.push('/pos/rooms/manage')
      return
    }

    if (menu === 'RESERVATION') {
      router.push('/pos/rooms/reservations')
      return
    }

    if (menu === 'TABLE') {
      router.push('/pos/rooms/table')
      return
    }

    if (menu === 'STAY_SALES') {
      router.push('/pos/rooms/stay-sales')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="식당현황"
              onHomeClick={() => router.push('/pos')}
              onMyPageClick={() => router.push('/profile')}
              onSettingsClick={() => router.push('/pos/settings/table')}
              syncStatus="ONLINE"
              homeShortcutLabel="F1"
              keyboardMode={keyboardMode}
              onToggleKeyboardMode={toggleKeyboardMode}
            />
          </div>
        </div>

        <div className={styles.mainViewport}>
          <div className={styles.mainGrid}>
            <PosSidebar
              activeMenu={activeMenu}
              onChangeMenu={handleChangeMenu}
              menuOptions={POS_ROOM_MENUS}
              className={styles.sidebar}
            />

            <main className={styles.main}>
              <div className={styles.contentGrid}>
                <section className={styles.tablePanel} aria-label="식당현황 목록">
                  <div className={styles.filterRow} aria-label="식당현황 필터">
                    {['전체', '사용중', '비어있음', '주문중', '결제대기', '예약석'].map((label) => (
                      <button key={label} type="button" className={styles.filterButton}>
                        {label}
                      </button>
                    ))}
                  </div>

                    <div className={styles.cardGrid}>
                      {tableCards.map((table) => (
                      <article key={table.id} className={styles.tableCard}>
                        <div className={styles.tableCardTop}>
                          <strong className={styles.tableTitle}>테이블 {table.tableNo}</strong>
                        </div>

                        <div className={styles.tableMeta}>
                          <div className={styles.metaRow}>
                            <span>주문금액</span>
                            <strong>{table.amount.toLocaleString('ko-KR')}원</strong>
                          </div>
                          <div className={styles.metaRow}>
                            <span>주문 건수</span>
                            <strong>{table.orderCount}건</strong>
                          </div>
                        </div>

                        <div className={styles.tableStatusRow}>
                          <span className={`${styles.statusBadge} ${styles[`status${table.status}`]}`}>
                            {buildStatusLabel(table.status)}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <aside className={styles.summaryPanel} aria-label="식당현황 요약">
                  <div className={styles.summaryCard}>
                    <h2 className={styles.summaryTitle}>식당현황 요약</h2>
                    <div className={styles.summaryList}>
                      {summaryItems.map((item) => (
                        <div key={item.label} className={styles.summaryRow}>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildStatusLabel(status: TableCard['status']) {
  if (status === 'USING') {
    return '사용중'
  }

  if (status === 'ORDERING') {
    return '주문중'
  }

  if (status === 'PAYMENT_WAITING') {
    return '결제대기'
  }

  if (status === 'RESERVED') {
    return '예약석'
  }

  return '비어있음'
}

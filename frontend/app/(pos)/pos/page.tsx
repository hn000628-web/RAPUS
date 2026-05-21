// FILE : frontend/app/(pos)/pos/page.tsx
// ROOT : frontend/app/(pos)/pos/page.tsx

'use client'

// SECTION 01 : IMPORT
import { useRouter } from 'next/navigation'

import styles from './PosMainPage.module.css'

import { usePosKeyboardMode } from './components/PosKeyboardModeContext'
import PosTopbar from './components/PosTopbar'

// SECTION 02 : TYPE
type HubItem = {
  key: string
  title: string
  description: string
  path?: string
}

// SECTION 03 : CONSTANT
const HUB_ITEMS: HubItem[] = [
  {
    key: 'TABLE',
    title: '요식업_매장관리',
    description: '매장 테이블 상태와 주문내역을 확인합니다.',
    path: '/pos/table'
  },
  {
    key: 'ROOM_STATUS',
    title: '숙박업_매장관리',
    description: '객실 상태와 숙박 운영 현황을 확인합니다.',
    path: '/pos/rooms'
  },
  {
    key: 'DELIVERY_ORDER',
    title: '배달전문점_매장관리',
    description: '배달전문점 전용 / 예약 / 배달 / 포장 주문을 통합하여 확인합니다.',
    path: '/pos/delivery-orders'
  },
  {
    key: 'SETTINGS',
    title: '설정',
    description: 'POS 설정으로 이동합니다.',
    path: '/pos/settings'
  }
]

// SECTION 04 : PAGE
export default function PosHubPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()

  // SECTION 05 : EVENT FUNCTION
  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleClickItem = (item: HubItem) => {
    if (!item.path) {
      return
    }

    router.push(item.path)
  }

  // SECTION 06 : RETURN
  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="POS 메인"
              onHomeClick={handleGoPosHome}
              onSettingsClick={handleOpenPosSettings}
              onMyPageClick={handleGoMyPage}
              syncStatus="ONLINE"
              homeShortcutLabel="F1"
              keyboardMode={keyboardMode}
              onToggleKeyboardMode={toggleKeyboardMode}
            />
          </div>
        </div>

        <main className={styles.main}>
          <div className={styles.contentLayout}>
            <section className={styles.grid} aria-label="POS 기능 카드">
              {HUB_ITEMS.map((item) => {
                const isEnabled = Boolean(item.path)

                return (
                  <article key={item.key} className={styles.card}>
                    <h2 className={styles.cardTitle}>{item.title}</h2>
                    <p className={styles.cardDescription}>{item.description}</p>
                    <button
                      type="button"
                      className={isEnabled ? styles.cardButton : styles.cardButtonDisabled}
                      onClick={() => handleClickItem(item)}
                      disabled={!isEnabled}
                    >
                      {isEnabled ? '이동' : '준비중'}
                    </button>
                  </article>
                )
              })}
            </section>

            <aside className={styles.summaryPanel} aria-label="오늘의 요약">
              <h2 className={styles.summaryTitle}>오늘의 요약</h2>
              <p className={styles.summaryDescription}>
                실시간 운영/매출 연동 데이터를 준비 중입니다.
              </p>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

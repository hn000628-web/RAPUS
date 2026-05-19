'use client'

import { useRouter } from 'next/navigation'
import styles from './ProfilePayPage.module.css'

type SummaryCard = {
  label: string
  value: string
}

type PaymentHistoryItem = {
  title: string
  lines: string[]
}

const SUMMARY_CARDS: SummaryCard[] = [
  { label: '캐시 잔액', value: '125,000원' },
  { label: '포인트', value: '8,420P' },
  { label: '이번 달 사용금액', value: '43,000원' },
  { label: '이번 달 적립포인트', value: '1,240P' }
]

const HISTORY_FILTERS = ['전체', '캐시', '포인트', '충전', '환급', '사용', '적립']

const PAYMENT_HISTORY: PaymentHistoryItem[] = [
  {
    title: '객실 101 룸오더 결제',
    lines: ['캐시 사용: 15,000원', '포인트 적립: 150P']
  },
  {
    title: '캐시 충전',
    lines: ['+50,000원']
  },
  {
    title: '포인트 사용',
    lines: ['-2,000P']
  }
]

export default function ProfilePayPage() {
  const router = useRouter()

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.headerCard}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.title}>PAY</h1>
              <p className={styles.description}>캐시, 포인트, 결제내역, 개인 환급계좌를 관리합니다.</p>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => router.push('/profile/pay/manage')}
              >
                PAY 관리
              </button>
            </div>
          </div>
        </header>

        <section className={styles.summaryGrid}>
          {SUMMARY_CARDS.map((card) => (
            <article key={card.label} className={styles.summaryCard}>
              <p className={styles.summaryLabel}>{card.label}</p>
              <strong className={styles.summaryValue}>{card.value}</strong>
            </article>
          ))}
        </section>

        <section className={styles.sectionGrid}>
          <section className={styles.sectionCard}>
            <h2 className={styles.cardTitle}>캐시 관리</h2>
            <p className={styles.cardText}>캐시는 현금으로 충전한 플랫폼 잔액입니다.</p>
            <p className={styles.cardText}>충전된 캐시는 결제에 사용할 수 있으며, 연결계좌로 환급할 수 있습니다.</p>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => router.push('/profile/pay/manage')}
              >
                관리하기
              </button>
            </div>
            <ul className={styles.noticeList}>
              <li>캐시는 현금 충전만 가능합니다.</li>
              <li>포인트를 캐시로 전환할 수 없습니다.</li>
              <li>캐시 환급은 등록된 본인 계좌로만 가능합니다.</li>
            </ul>
          </section>

          <section className={styles.sectionCard}>
            <h2 className={styles.cardTitle}>포인트 관리</h2>
            <p className={styles.cardText}>포인트는 결제 시 정책에 따라 자동 적립됩니다.</p>
            <p className={styles.cardText}>포인트는 결제 시 사용할 수 있으나 현금 환급은 불가합니다.</p>
            <div className={styles.actionRow}>
              <button type="button" className={styles.actionButton}>포인트 사용내역</button>
              <button type="button" className={styles.actionButton}>적립 정책 보기</button>
            </div>
            <ul className={styles.noticeList}>
              <li>적립률은 결제 유형과 운영 정책에 따라 달라질 수 있습니다.</li>
              <li>포인트는 현금으로 환급할 수 없습니다.</li>
              <li>포인트는 캐시로 전환할 수 없습니다.</li>
            </ul>
          </section>

          <section className={styles.sectionCard}>
            <h2 className={styles.cardTitle}>결제내역</h2>
            <p className={styles.cardText}>캐시와 포인트의 사용, 적립, 충전, 환급 내역을 확인합니다.</p>
            <div className={styles.filterRow}>
              {HISTORY_FILTERS.map((filter) => (
                <button key={filter} type="button" className={styles.filterButton}>
                  {filter}
                </button>
              ))}
            </div>
            <div className={styles.historyList}>
              {PAYMENT_HISTORY.map((item) => (
                <article key={item.title} className={styles.historyItem}>
                  <strong className={styles.historyTitle}>{item.title}</strong>
                  {item.lines.map((line) => (
                    <p key={line} className={styles.historyLine}>{line}</p>
                  ))}
                </article>
              ))}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <h2 className={styles.cardTitle}>정산관리</h2>
            <p className={styles.cardText}>캐시 충전 및 환급을 위한 개인 연결계좌를 관리합니다.</p>
            <p className={styles.cardTextStrong}>이 계좌는 사업자 매출 정산 계좌가 아닙니다.</p>
            <div className={styles.accountBox}>
              <p>국민은행 123-****-4567</p>
              <p>예금주: 김정명</p>
              <p>상태: 인증 완료</p>
            </div>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => router.push('/profile/pay/manage')}
              >
                관리하기
              </button>
            </div>
            <ul className={styles.noticeList}>
              <li>환급은 인증된 본인 계좌로만 가능합니다.</li>
              <li>계좌 인증 후 캐시 환급 신청이 가능합니다.</li>
              <li>포인트는 환급 대상이 아닙니다.</li>
              <li>사업자 매출 정산은 비즈니스 프로필 정산관리에서 별도로 처리합니다.</li>
            </ul>
          </section>
        </section>
      </div>
    </main>
  )
}

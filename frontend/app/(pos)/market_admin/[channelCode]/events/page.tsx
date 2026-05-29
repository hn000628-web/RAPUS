import {
  MarketAdminRouteShell,
  StatusBadge,
} from '../../_components/MarketAdminRouteShell'
import { EVENT_CARDS } from '../../_components/mockData'
import styles from '../../_components/market-admin-route-shell.module.css'
import Link from 'next/link'

type MarketAdminEventsPageProps = {
  params: Promise<{
    channelCode: string
  }>
}

export default async function MarketAdminEventsPage({
  params,
}: MarketAdminEventsPageProps) {
  const { channelCode } = await params

  return (
    <MarketAdminRouteShell
      activePath={`/market_admin/${channelCode}/events`}
      channelCode={channelCode}
      title="행사 관리"
      description="행사 기간, 활성 상태, 연결 상품 수를 mock 기준으로 확인하는 운영 Shell입니다."
    >
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>행사 카드</h2>
            <p className={styles.sectionDescription}>
              실제 행사 API 연결 없이 eventCode 기반 운영 흐름만 보여줍니다.
            </p>
          </div>
          <button className={styles.button}>행사 생성</button>
        </div>

        <div className={styles.grid}>
          {EVENT_CARDS.map((event) => (
            <Link
              key={event.eventCode}
              href={`/market_admin/${channelCode}/events/${event.eventCode}`}
              className={styles.card}
            >
              <h3 className={styles.cardTitle}>{event.title}</h3>
              <p className={styles.cardText}>{event.eventCode}</p>
              <p className={styles.cardText}>{event.period}</p>
              <p className={styles.cardText}>{event.productCount}</p>
              <StatusBadge tone={event.status === 'WARNING' ? 'warning' : event.status === 'READY' ? 'muted' : 'active'}>
                {event.status}
              </StatusBadge>
            </Link>
          ))}
        </div>
      </section>
    </MarketAdminRouteShell>
  )
}

import {
  MarketAdminRouteShell,
  StatusBadge,
} from '../../_components/MarketAdminRouteShell'
import { BANNER_CARDS } from '../../_components/mockData'
import styles from '../../_components/market-admin-route-shell.module.css'

type MarketAdminBannersPageProps = {
  params: Promise<{
    channelCode: string
  }>
}

export default async function MarketAdminBannersPage({
  params,
}: MarketAdminBannersPageProps) {
  const { channelCode } = await params

  return (
    <MarketAdminRouteShell
      activePath={`/market_admin/${channelCode}/banners`}
      channelCode={channelCode}
      title="배너 관리"
      description="OWNER_MASTER 전용으로 분류된 카테고리 배너 운영 mock 화면입니다."
    >
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>배너 슬롯</h2>
            <p className={styles.sectionDescription}>
              현재 단계는 실제 권한 체크 없이 OWNER_MASTER 전용 표시만 제공합니다.
            </p>
          </div>
          <StatusBadge tone="warning">OWNER_MASTER 전용</StatusBadge>
        </div>

        <div className={styles.grid}>
          {BANNER_CARDS.map(([title, category, order, status]) => (
            <article
              key={title}
              className={styles.card}
            >
              <div className={styles.thumbnail}>BANNER</div>
              <h3 className={styles.cardTitle}>{title}</h3>
              <p className={styles.cardText}>
                {category} · 노출 순서 {order}
              </p>
              <StatusBadge tone={status === 'ACTIVE' ? 'active' : 'muted'}>
                {status}
              </StatusBadge>
            </article>
          ))}
        </div>
      </section>
    </MarketAdminRouteShell>
  )
}

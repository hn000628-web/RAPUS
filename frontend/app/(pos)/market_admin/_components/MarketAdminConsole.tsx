import styles from './market-admin-route-shell.module.css'
import { MarketAdminCard } from './MarketAdminCard'
import { MarketAdminHeader } from './MarketAdminHeader'
import { MarketAdminSidebar } from './MarketAdminSidebar'
import {
  buildMarketAdminRoute,
  MARKET_ADMIN_MENU_ITEMS,
  TODAY_METRICS,
  getMockMarketChannel,
} from './mockData'
import { StatusBadge } from './MarketAdminRouteShell'

type MarketAdminConsoleProps = {
  channelCode: string
}

export function MarketAdminConsole({
  channelCode,
}: MarketAdminConsoleProps) {
  const channel = getMockMarketChannel(channelCode)

  return (
    <main className={styles.consolePage}>
      <MarketAdminHeader
        title={`${channel.storeName} 운영 콘솔`}
        description="오너와 현장 운영자가 같은 화면에서 오늘 현황, 상품, 행사, 배너, 바코드 원장을 빠르게 확인하는 channelCode 기반 공통 운영 Shell입니다."
        channelCode={channelCode}
      />

      <div className={styles.consoleLayout}>
        <MarketAdminSidebar
          activePath={`/market_admin/${channelCode}`}
          channelCode={channelCode}
        />

        <section className={styles.consoleContent}>
          <section
            className={styles.todayPanel}
            aria-label="오늘 현황"
          >
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  오늘 현황
                </h2>
                <p className={styles.sectionDescription}>
                  현재 단계는 mock data 기반 UI Shell입니다.
                </p>
              </div>
              <StatusBadge>{channelCode}</StatusBadge>
            </div>

            <div className={styles.metricGrid}>
              {TODAY_METRICS.map((metric) => (
                <article
                  key={metric.label}
                  className={styles.metricCard}
                >
                  <span className={styles.metricLabel}>
                    {metric.label}
                  </span>
                  <strong className={styles.metricValue}>
                    {metric.value}
                  </strong>
                  <span className={styles.metricHint}>
                    {metric.hint}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section
            className={styles.todayPanel}
            aria-label="운영 메뉴"
          >
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  운영 메뉴
                </h2>
                <p className={styles.sectionDescription}>
                  빠른 클릭과 현장 검수를 우선한 카드형 운영 콘솔입니다.
                </p>
              </div>
            </div>

            <div className={styles.operationGrid}>
              {MARKET_ADMIN_MENU_ITEMS.map((item) => (
                <MarketAdminCard
                  key={item.id}
                  item={{
                    ...item,
                    routePath: buildMarketAdminRoute(item.routePath, channelCode),
                  }}
                />
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}

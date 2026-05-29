import Link from 'next/link'

import styles from './market-admin-route-shell.module.css'
import {
  MOCK_MARKET_ADMIN_CHANNELS,
  MARKET_ADMIN_ROLES,
} from './mockData'
import { StatusBadge } from './MarketAdminRouteShell'

export function MarketAdminChannelList() {
  return (
    <main className={styles.consolePage}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            MARKET CHANNEL ENTRY
          </p>
          <h1 className={styles.title}>
            마트 운영 채널 선택
          </h1>
          <p className={styles.description}>
            OWNER_MASTER는 여러 마트 채널 중 선택하고, 점주와 직원은 배정된 channelCode 운영 콘솔로 진입하는 구조를 전제로 합니다.
          </p>
        </div>

        <div className={styles.roleBox}>
          <span className={styles.roleTitle}>
            권한 타입 준비
          </span>
          <div className={styles.roleList}>
            {MARKET_ADMIN_ROLES.map((role) => (
              <span
                key={role}
                className={styles.roleBadge}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.todayPanel}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>
              운영 가능한 마트 채널
            </h2>
            <p className={styles.sectionDescription}>
              현재는 mock channel list이며 실제 권한/채널 조회 API는 연결하지 않았습니다.
            </p>
          </div>
          <StatusBadge>공통 진입 허브</StatusBadge>
        </div>

        <div className={styles.channelGrid}>
          {MOCK_MARKET_ADMIN_CHANNELS.map((channel) => (
            <Link
              key={channel.channelCode}
              href={`/market_admin/${channel.channelCode}`}
              className={styles.channelCard}
            >
              <span className={styles.channelCode}>
                {channel.channelCode}
              </span>
              <strong className={styles.channelName}>
                {channel.storeName}
              </strong>
              <span className={styles.channelMeta}>
                {channel.address}
              </span>
              <span className={styles.channelMeta}>
                오늘 주문 {channel.todayOrderCount} · 경고 {channel.warningCount}
              </span>
              <span className={styles.channelFooter}>
                <StatusBadge tone={channel.status === 'ACTIVE' ? 'active' : 'muted'}>
                  {channel.status}
                </StatusBadge>
                <span className={styles.operationArrow}>
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

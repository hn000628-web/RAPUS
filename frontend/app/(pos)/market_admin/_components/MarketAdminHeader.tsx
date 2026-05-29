import Link from 'next/link'

import styles from './market-admin-route-shell.module.css'
import { MARKET_ADMIN_ROLES } from './mockData'

type MarketAdminHeaderProps = {
  title: string
  description: string
  channelCode: string
}

export function MarketAdminHeader({
  title,
  description,
  channelCode,
}: MarketAdminHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>
          MARKET REAL OPERATION
        </p>
        <h1 className={styles.title}>
          {title}
        </h1>
        <p className={styles.description}>
          {description}
        </p>
        <p className={styles.channelCodeLine}>
          channelCode : {channelCode}
        </p>
      </div>

      <div className={styles.headerActions}>
        <Link
          href="/market_admin"
          className={styles.adminEntryButton}
        >
          채널 목록
        </Link>

        <div className={styles.roleBox}>
          <span className={styles.roleTitle}>
            향후 권한 범위
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
      </div>
    </header>
  )
}

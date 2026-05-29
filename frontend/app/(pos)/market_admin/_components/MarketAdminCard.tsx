import Link from 'next/link'

import styles from './market-admin-route-shell.module.css'
import type { MarketAdminMenuItem } from './mockData'
import { StatusBadge } from './MarketAdminRouteShell'

type MarketAdminCardProps = {
  item: MarketAdminMenuItem
}

export function MarketAdminCard({
  item,
}: MarketAdminCardProps) {
  return (
    <Link
      href={item.routePath}
      className={styles.operationCard}
    >
      <span className={styles.operationIcon}>
        {item.code}
      </span>

      <span className={styles.operationBody}>
        <strong className={styles.operationTitle}>
          {item.title}
        </strong>
        <span className={styles.operationText}>
          {item.description}
        </span>
        <StatusBadge
          tone={item.status === 'WARNING' ? 'warning' : item.status === 'MOCK' ? 'muted' : 'active'}
        >
          {item.status}
        </StatusBadge>
      </span>

      <span
        className={styles.operationArrow}
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  )
}

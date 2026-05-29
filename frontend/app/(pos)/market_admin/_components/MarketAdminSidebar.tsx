import Link from 'next/link'

import styles from './market-admin-route-shell.module.css'
import {
  buildMarketAdminRoute,
  MARKET_ADMIN_MENU_ITEMS,
} from './mockData'

type MarketAdminSidebarProps = {
  activePath: string
  channelCode: string
}

export function MarketAdminSidebar({
  activePath,
  channelCode,
}: MarketAdminSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <Link
        href={`/market_admin/${channelCode}`}
        className={activePath === `/market_admin/${channelCode}` ? styles.sidebarActive : styles.sidebarLink}
      >
        오늘 현황
      </Link>

      {MARKET_ADMIN_MENU_ITEMS.map((item) => (
        <Link
          key={item.id}
          href={buildMarketAdminRoute(item.routePath, channelCode)}
          className={activePath === buildMarketAdminRoute(item.routePath, channelCode) ? styles.sidebarActive : styles.sidebarLink}
        >
          {item.title}
        </Link>
      ))}
    </aside>
  )
}

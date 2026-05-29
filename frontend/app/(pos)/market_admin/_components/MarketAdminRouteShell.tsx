import Link from 'next/link'
import type { ReactNode } from 'react'

import styles from './market-admin-route-shell.module.css'

type MarketAdminRole = 'OWNER_MASTER' | 'MART_MANAGER' | 'MART_STAFF' | 'VIEWER'

type MarketAdminRouteShellProps = {
  title: string
  description: string
  activePath: string
  channelCode: string
  children: ReactNode
}

const ROLE_STRUCTURE: MarketAdminRole[] = [
  'OWNER_MASTER',
  'MART_MANAGER',
  'MART_STAFF',
  'VIEWER',
]

const NAV_ITEMS = [
  {
    label: '운영 허브',
    path: '/market_admin/{channelCode}',
  },
  {
    label: '카테고리 관리',
    path: '/market_admin/{channelCode}/categories',
  },
  {
    label: '배너 관리',
    path: '/market_admin/{channelCode}/banners',
  },
  {
    label: '행사 관리',
    path: '/market_admin/{channelCode}/events',
  },
  {
    label: '상품 관리',
    path: '/market_admin/{channelCode}/products',
  },
  {
    label: '바코드 관리',
    path: '/market_admin/{channelCode}/barcodes',
  },
]

export function MarketAdminRouteShell({
  title,
  description,
  activePath,
  channelCode,
  children,
}: MarketAdminRouteShellProps) {
  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>MARKET ADMIN CONSOLE</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
          <p className={styles.channelCodeLine}>channelCode : {channelCode}</p>
        </div>

        <div className={styles.roleBox}>
          <span className={styles.roleTitle}>권한 분기 예정</span>
          <div className={styles.roleList}>
            {ROLE_STRUCTURE.map((role) => (
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

      <nav
        className={styles.nav}
        aria-label="마켓 운영 콘솔 이동"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            href={item.path.replace('{channelCode}', channelCode)}
            className={activePath === item.path.replace('{channelCode}', channelCode) ? styles.navActive : styles.navItem}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </main>
  )
}

export function StatusBadge({
  children,
  tone = 'active',
}: {
  children: ReactNode
  tone?: 'active' | 'warning' | 'muted'
}) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {children}
    </span>
  )
}

export function MockTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: string[][]
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

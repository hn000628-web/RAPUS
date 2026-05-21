import type { PosMenuKey, PosMenuOption } from './posTypes'

export type TablePosSidebarMenuKey = Extract<
  PosMenuKey,
  'TABLE' | 'COOKING' | 'ORDER_HISTORY' | 'RESERVATION' | 'SALES_HISTORY' | 'MENU_MANAGE'
>

export const TABLE_POS_SIDEBAR_MENUS: PosMenuOption[] = [
  {
    key: 'TABLE',
    label: '테이블 현황'
  },
  {
    key: 'COOKING',
    label: '조리현황'
  },
  {
    key: 'ORDER_HISTORY',
    label: '주문현황'
  },
  {
    key: 'RESERVATION',
    label: '예약현황'
  },
  {
    key: 'SALES_HISTORY',
    label: '매출현황'
  },
  {
    key: 'MENU_MANAGE',
    label: '테이블/메뉴관리'
  }
]

export const TABLE_POS_SIDEBAR_PATHS: Record<TablePosSidebarMenuKey, string> = {
  TABLE: '/pos/table',
  COOKING: '/pos/table/cooking',
  ORDER_HISTORY: '/pos/table/orders',
  RESERVATION: '/pos/table/reservations',
  SALES_HISTORY: '/pos/table/stay-sales',
  MENU_MANAGE: '/pos/table/settings'
}

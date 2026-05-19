// FILE : frontend/app/(pos)/pos/components/posTypes.ts
// ROOT : frontend/app/(pos)/pos/components/posTypes.ts
// STATUS : MODIFY MODE
// ROLE : POS MAIN SHARED TYPE
// CHANGE SUMMARY :
// - POS 메인 공통 타입과 메뉴 정의를 UTF-8 기준으로 재정리
// - 조리현황 메뉴 및 목업 타입 추가
// - 기존 테이블 / 예약 / 매출 관련 타입 유지
// - DB/API 연결 없음

// SECTION 01 : TYPE
export type PosMenuKey =
  | 'ROOM_STATUS'
  | 'TABLE'
  | 'MENU_MANAGE'
  | 'RESERVATION'
  | 'STAY_SALES'
  | 'DELIVERY'
  | 'PICKUP'
  | 'COOKING'
  | 'ORDER_HISTORY'
  | 'SALES_HISTORY'

export type PosMenuOption = {
  key: PosMenuKey
  label: string
}

export type PosTableItem = {
  locationId: number
  tableNo: number
  label: string
  amount: number
  resourceStatus?: string
  status: 'EMPTY' | 'USING' | 'PAYMENT_WAITING' | 'CHECKOUT_PENDING' | 'CLEANING' | 'CLEAN_DONE'
  cookingStatusLabel?: string
  paymentStatusLabel: '미결제' | '결제대기' | '결제완료'
  orderItems: Array<{
    name: string
    quantity: number
    optionSummary?: string
  }>
  memo: string
}

export type PosReservationType = 'VISIT' | 'DELIVERY' | 'PICKUP'

export type PosReservationOrderItem = {
  id: string
  orderNo: string
  reservationType: PosReservationType
  reservationLabel: '매장방문' | '배달주문' | '픽업주문'
  summaryText: string
  scheduledLabel: string
  scheduledTime: string
  customerName?: string
  status: 'WAITING' | 'CONFIRMED' | 'COMPLETED'
}

export type PosReservationSummary = {
  total: number
  confirmed: number
  waiting: number
  completed: number
}

export type PosCookingStatus = 'WAITING' | 'COOKING' | 'DONE'

export type PosCookingTicket = {
  id: string
  orderLabel: string
  menuName: string
  quantity: number
  optionText?: string
  requestText?: string
  orderedAt: string
  elapsedMinutes: number
  status: PosCookingStatus
}

export type DailyOrderStatus = 'ORDER_REQUESTED' | 'ORDER_CONFIRMED' | 'ORDER_WAITING'
export type DailyPaymentStatus = 'UNPAID' | 'PAID'
export type DailyPaymentMethod = 'CARD' | 'CASH' | 'QR'
export type SalesFilterType = 'ALL' | 'CARD' | 'CASH' | 'QR' | 'POINT'

export type DailyOrderItem = {
  id: string
  paymentNumber: string
  orderNumber: string
  tableNo: number
  customerChannelCode: string
  amount: number
  orderStatus: DailyOrderStatus
  paymentStatus: DailyPaymentStatus
  paymentMethod: DailyPaymentMethod
  paidAt: string
  isQrPayment: boolean
  pointAmount: number
  memo: string
  orderItems: Array<{
    name: string
    quantity: number
  }>
  items: string[]
}

export type PosDailySummary = {
  total: number
  confirmed: number
  waiting: number
  requested: number
}

export type PosSalesSummary = {
  paidCount: number
  totalSalesAmount: number
  cardSalesAmount: number
  cashSalesAmount: number
  qrSalesAmount: number
  totalQrPoints: number
}

// SECTION 02 : CONSTANT
export const POS_MAIN_MENUS: PosMenuOption[] = [
  {
    key: 'ROOM_STATUS',
    label: '객실현황'
  },
  {
    key: 'TABLE',
    label: '식당현황'
  },
  {
    key: 'RESERVATION',
    label: '예약주문'
  },
  {
    key: 'DELIVERY',
    label: '배달주문'
  },
  {
    key: 'PICKUP',
    label: '픽업주문'
  },
  {
    key: 'COOKING',
    label: '조리현황'
  },
  {
    key: 'ORDER_HISTORY',
    label: '주문내역(1일)'
  },
  {
    key: 'SALES_HISTORY',
    label: '매출내역(1일)'
  }
]

export const POS_ROOM_MENUS: PosMenuOption[] = [
  {
    key: 'ROOM_STATUS',
    label: '객실현황'
  },
  {
    key: 'COOKING',
    label: '객실관리'
  },
  {
    key: 'RESERVATION',
    label: '예약현황'
  },
  {
    key: 'TABLE',
    label: '식당현황'
  },
  {
    key: 'STAY_SALES',
    label: '매출 현황'
  }
]

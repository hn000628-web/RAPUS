export type MarketAdminRole =
  | 'OWNER_MASTER'
  | 'MART_MANAGER'
  | 'MART_STAFF'
  | 'VIEWER'

export type OperationStatus =
  | 'ACTIVE'
  | 'READY'
  | 'WARNING'
  | 'MOCK'

export type MarketAdminMenuItem = {
  id: string
  code: string
  title: string
  description: string
  routePath: string
  status: OperationStatus
}

export type TodayMetric = {
  label: string
  value: string
  hint: string
  status: OperationStatus
}

export type MarketAdminEventCard = {
  eventCode: string
  title: string
  period: string
  productCount: string
  status: OperationStatus
}

export type MarketAdminChannel = {
  channelCode: string
  storeName: string
  address: string
  managerRole: MarketAdminRole
  status: OperationStatus
  todayOrderCount: string
  warningCount: string
}

export const MARKET_ADMIN_ROLES: MarketAdminRole[] = [
  'OWNER_MASTER',
  'MART_MANAGER',
  'MART_STAFF',
  'VIEWER',
]

export const MOCK_MARKET_ADMIN_CHANNELS: MarketAdminChannel[] = [
  {
    channelCode: 'B8X7C6V5B4N3M',
    storeName: '라푸스마켓',
    address: '광주광역시 서구 풍암동',
    managerRole: 'OWNER_MASTER',
    status: 'ACTIVE',
    todayOrderCount: '128',
    warningCount: '37',
  },
  {
    channelCode: 'B012712392766',
    storeName: '신선마트 본점',
    address: '광주광역시 북구 운암동',
    managerRole: 'MART_MANAGER',
    status: 'READY',
    todayOrderCount: '42',
    warningCount: '8',
  },
]

export const MARKET_ADMIN_MENU_ITEMS: MarketAdminMenuItem[] = [
  {
    id: 'categories',
    code: 'CAT',
    title: '카테고리 관리',
    description: '공산품, 청과, 야채, 정육 등 운영 카테고리 정렬',
    routePath: '/market_admin/{channelCode}/categories',
    status: 'ACTIVE',
  },
  {
    id: 'banners',
    code: 'BNR',
    title: '배너 관리',
    description: '카테고리별 대표 배너와 노출 순서 관리',
    routePath: '/market_admin/{channelCode}/banners',
    status: 'READY',
  },
  {
    id: 'events',
    code: 'EVT',
    title: '행사 관리',
    description: '행사 기간, 행사 상태, 연결 상품 수 운영',
    routePath: '/market_admin/{channelCode}/events',
    status: 'ACTIVE',
  },
  {
    id: 'products',
    code: 'PRD',
    title: '상품 관리',
    description: '판매가, 재고, 품절, 행사상품 상태 검수',
    routePath: '/market_admin/{channelCode}/products',
    status: 'WARNING',
  },
  {
    id: 'barcodes',
    code: 'BCD',
    title: '바코드 / 상품원장 관리',
    description: 'CSV 업로드와 scanCodeValue 연결 상태 관리',
    routePath: '/market_admin/{channelCode}/barcodes',
    status: 'READY',
  },
]

export const TODAY_METRICS: TodayMetric[] = [
  {
    label: '오늘 주문',
    value: '128',
    hint: '접수 / 처리 mock',
    status: 'ACTIVE',
  },
  {
    label: '재고 경고',
    value: '37',
    hint: '안전 재고 이하',
    status: 'WARNING',
  },
  {
    label: '행사 상품',
    value: '126',
    hint: 'eventCode 연결',
    status: 'ACTIVE',
  },
  {
    label: '검수 대기',
    value: '18',
    hint: '바코드 / 이미지 확인',
    status: 'READY',
  },
]

export const CATEGORY_ROWS = [
  ['공산품', 'GROCERY', '대표 배너 있음', '10', 'ACTIVE'],
  ['청과', 'FRUIT', '대표 배너 있음', '20', 'ACTIVE'],
  ['정육', 'MEAT', '배너 대기', '30', 'READY'],
]

export const BANNER_CARDS = [
  ['오늘의 청과', 'FRUIT', '1', 'ACTIVE'],
  ['정육 특가전', 'MEAT', '2', 'ACTIVE'],
  ['생활용품 모음', 'LIFESTYLE', '3', 'READY'],
]

export const EVENT_CARDS: MarketAdminEventCard[] = [
  {
    eventCode: 'EV2606010001',
    title: '주말 장보기 특가',
    period: '2026-06-01 ~ 2026-06-07',
    productCount: '128개 상품',
    status: 'ACTIVE',
  },
  {
    eventCode: 'EV2606100001',
    title: '여름 음료 행사',
    period: '2026-06-10 ~ 2026-06-30',
    productCount: '64개 상품',
    status: 'READY',
  },
  {
    eventCode: 'EV2606150001',
    title: '정육 데이',
    period: '2026-06-15 ~ 2026-06-16',
    productCount: '32개 상품',
    status: 'WARNING',
  },
]

export const PRODUCT_ROWS = [
  ['IMG', '신라면', '8801043014830', '1,200', '42', 'ACTIVE'],
  ['IMG', '참외 1팩', 'RPNNO379000001', '6,900', '0', '품절'],
  ['IMG', '삼겹살 500g', 'RPNNO511000001', '9,900', '4', '재고부족'],
]

export const BARCODE_ROWS = [
  ['8801043014830', 'RPB8801043014830', '신라면', 'ACTIVE'],
  ['379', 'RPNNO379000001', '참외', 'ACTIVE'],
  ['UNKNOWN-001', '-', '검수 필요', 'READY'],
]

export function buildMarketAdminRoute(
  routePath: string,
  channelCode: string
) {
  return routePath.replace('{channelCode}', channelCode)
}

export function getMockMarketChannel(channelCode: string) {
  return (
    MOCK_MARKET_ADMIN_CHANNELS.find((channel) => channel.channelCode === channelCode)
    ?? {
      channelCode,
      storeName: '마트 운영 채널',
      address: '등록된 주소 없음',
      managerRole: 'VIEWER' as const,
      status: 'MOCK' as const,
      todayOrderCount: '0',
      warningCount: '0',
    }
  )
}

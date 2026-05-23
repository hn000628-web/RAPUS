// FILE : frontend/app/channel/[channelCode]/order/components/DeliveryOrderContent.tsx
// ROOT : frontend/app/channel/[channelCode]/order/components/DeliveryOrderContent.tsx
// STATUS : CREATE MODE
// ROLE : PUBLIC BUSINESS CHANNEL DELIVERY ORDER CONTENT COMPONENT
// CHANGE SUMMARY :
// - 배달 주문 전용 UI 본문 구성
// - 메뉴 선택 / 수량 선택 / 옵션 선택 / 배송지 / 연락처 / 요청사항 / 주문 확인 UI 구성
// - 데스크톱 2열 주문 입력 레이아웃 적용
// - 모바일 1열 전환 가능한 grid 구조 적용
// - 현재 단계는 UI 중심 구성
// - API 호출은 주문 조회/접수 범위만 사용 (DB 직접 접근 없음)

'use client'

// SECTION 01 : IMPORT

import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState
} from 'react'

import type {
  CSSProperties
} from 'react'
import {
  createCustomerOrder,
  getCustomerOrderBootstrap,
  type CreateCustomerOrderRequest,
  type CustomerOrderBootstrapResponse
} from '@/lib/business/pos/customerOrderApi'
import {
  getProductFavoriteStatus,
  toggleProductFavorite
} from '@/lib/favoritesApi'
import {
  addCartItem,
  getMyCartItems,
  type AddCartItemOptionInput,
  type CartOptionType
} from '@/lib/cartApi'
import { getMe } from '@/lib/authApi'
import { mediaUrl } from '@/lib/media'
import BaseModal from '@/components/ui/modal/BaseModal'
import {
  listMyDeliveryAddresses,
  type DeliveryAddressItem,
} from '@/lib/accountApi'

// SECTION 02 : TYPE

type Props = {
  channelCode: string
  activeCategoryKey: string
  categorySidebar?: ReactNode
  embedInModal?: boolean
}

type OrderMenuItem = {
  id: string
  productDbId?: number | null
  productId?: string | null
  productCode?: string | null
  sourceType?: 'POS_PRODUCT' | 'MARKET_PRODUCT'
  categoryKey: string
  name: string
  description: string
  price: number
  thumbnailFilePath?: string | null
}

type OrderOptionItem = {
  id: string
  label: string
  price: number
  productOptionId?: number
  productOptionValueId?: number
  optionName?: string
  optionType?: CartOptionType
  optionValueName?: string
  isQuantityEnabled?: boolean
  isQuantityLimitEnabled?: boolean
  minOptionQuantity?: number | null
  maxOptionQuantity?: number | null
  defaultOptionQuantity?: number | null
}

type DeliveryPaymentItem = {
  id: string
  label: string
  description: string
}

type DeliveryAddressLoadContext = {
  profileId: number
  channelCode: string
}

type DeliveryDraftOrderOption = {
  optionItemId: string
  optionId: number | null
  optionValueId: number | null
  optionName: string
  optionType: CartOptionType
  optionValueName: string
  isQuantityEnabled: boolean
  isQuantityLimitEnabled: boolean
  priceDelta: number
  quantity: number
  lineOptionAmount: number
}

type DeliveryDraftOrderItem = {
  localItemId: string
  productDbId: number | null
  productCode: string
  productId?: string | null
  sourceType: 'POS_PRODUCT' | 'MARKET_PRODUCT'
  productName: string
  unitPrice: number
  quantity: number
  optionTotalAmount: number
  lineTotalAmount: number
  options: DeliveryDraftOrderOption[]
}

type CartNoticeModalType = 'success' | 'warning'

// SECTION 03 : CONSTANT

const MOCK_MENU_ITEMS: OrderMenuItem[] = [
  {
    id: 'kimchi-stew',
    categoryKey: 'MAIN',
    name: '김치찌개',
    description: '기본 300g 기준 메뉴입니다.',
    price: 3000
  },
  {
    id: 'cola',
    categoryKey: 'DRINK',
    name: '콜라',
    description: '1.5L 음료입니다.',
    price: 2000
  },
  {
    id: 'rice',
    categoryKey: 'SIDE',
    name: '공기밥',
    description: '추가 공기밥입니다.',
    price: 1000
  },
  {
    id: 'ramen',
    categoryKey: 'SUB',
    name: '라면사리',
    description: '찌개류에 추가 가능한 사리입니다.',
    price: 1500
  },
  {
    id: 'egg-roll',
    categoryKey: 'SIDE',
    name: '계란말이',
    description: '사이드 메뉴입니다.',
    price: 4500
  },
  {
    id: 'water',
    categoryKey: 'DRINK',
    name: '생수',
    description: '500ml 생수입니다.',
    price: 1000
  }
]

const MOCK_OPTION_ITEMS: OrderOptionItem[] = [
  {
    id: 'extra-spicy',
    label: '맵게',
    price: 0
  },
  {
    id: 'extra-meat',
    label: '고기 추가',
    price: 1500
  },
  {
    id: 'extra-rice',
    label: '공기밥 추가',
    price: 1000
  }
]

const DELIVERY_PAYMENT_ITEMS: DeliveryPaymentItem[] = [
  {
    id: 'onsite-card',
    label: '만나서 카드결제',
    description: '배달 수령 시 카드로 결제합니다.'
  },
  {
    id: 'onsite-cash',
    label: '만나서 현금결제',
    description: '배달 수령 시 현금으로 결제합니다.'
  },
  {
    id: 'online',
    label: '온라인 결제',
    description: '추후 결제 API 연결 단계에서 사용합니다.'
  }
]

const EMPTY_MENU_ITEM: OrderMenuItem = {
  id: 'empty',
  categoryKey: 'MAIN',
  name: '메뉴 없음',
  description: '주문 가능한 메뉴가 없습니다.',
  price: 0
}

// SECTION 04 : STYLE

const contentStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  paddingBottom: '118px',
  overflowX: 'hidden',
  boxSizing: 'border-box'
}

const introCardStyle: CSSProperties = {
  width: '100%',
  padding: '16px',
  borderRadius: '20px',
  border: '1px solid #dbe2ea',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
  boxSizing: 'border-box'
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '34px',
  fontWeight: 900,
  color: '#0f172a',
  letterSpacing: '-0.03em',
  lineHeight: 1
}

const descriptionStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: '14px',
  fontWeight: 700,
  lineHeight: 1.5,
  color: '#64748b'
}

const orderGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 1.1fr) minmax(280px, 1fr) minmax(260px, 320px)',
  alignItems: 'stretch',
  gap: '10px',
  minHeight: 0
}

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  minWidth: 0,
  minHeight: 0
}

const cardStyle: CSSProperties = {
  width: '100%',
  padding: '16px',
  borderRadius: '20px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
  boxSizing: 'border-box'
}

const summaryCardStyle: CSSProperties = {
  ...cardStyle,
  position: 'sticky',
  top: '10px',
  borderColor: '#dbe2ea',
  padding: '10px',
  maxHeight: '100%',
  overflowY: 'auto',
  overflowX: 'hidden'
}

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: '24px',
  fontWeight: 900,
  color: '#0f172a',
  letterSpacing: '-0.02em',
  lineHeight: 1.2,
  wordBreak: 'keep-all'
}

const menuGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px'
}

const menuButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: '124px',
  padding: '16px',
  border: '1px solid #dbe2ea',
  borderRadius: '20px',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'space-between',
  gap: '10px',
  textAlign: 'left',
  cursor: 'pointer',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
  boxSizing: 'border-box',
  overflow: 'hidden'
}

const selectedMenuButtonStyle: CSSProperties = {
  ...menuButtonStyle,
  border: '2px solid #111827',
  backgroundColor: '#f8fafc',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.16)'
}

const menuImageButtonStyle: CSSProperties = {
  ...menuButtonStyle,
  padding: '0',
  gap: '0',
  justifyContent: 'stretch'
}

const selectedMenuImageButtonStyle: CSSProperties = {
  ...selectedMenuButtonStyle,
  padding: '0',
  gap: '0',
  justifyContent: 'stretch'
}

const menuThumbWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  minHeight: '124px',
  height: '100%',
  borderRadius: 'inherit',
  overflow: 'hidden',
  backgroundColor: '#f8fafc'
}

const menuThumbImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
}

const menuThumbTitlePillStyle: CSSProperties = {
  position: 'absolute',
  top: '8px',
  left: '8px',
  maxWidth: '70%',
  padding: '6px 10px',
  borderRadius: '999px',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: '12px',
  fontWeight: 800,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  boxShadow: '0 6px 16px rgba(15, 23, 42, 0.16)'
}

const menuThumbPricePillStyle: CSSProperties = {
  position: 'absolute',
  right: '8px',
  bottom: '8px',
  padding: '6px 10px',
  borderRadius: '999px',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: '12px',
  fontWeight: 900,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  boxShadow: '0 6px 16px rgba(15, 23, 42, 0.16)'
}

const menuThumbFavoriteButtonStyle: CSSProperties = {
  position: 'absolute',
  left: '8px',
  bottom: '8px',
  width: '30px',
  height: '30px',
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.7)',
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  color: '#111827',
  fontSize: '16px',
  fontWeight: 900,
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.16)',
  zIndex: 2
}

const menuThumbFavoriteButtonActiveStyle: CSSProperties = {
  ...menuThumbFavoriteButtonStyle,
  color: '#e11d48'
}

const menuThumbFavoriteButtonLoadingStyle: CSSProperties = {
  ...menuThumbFavoriteButtonStyle,
  opacity: 0.6,
  cursor: 'default'
}

const menuButtonTopStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '8px'
}

const selectedBadgeStyle: CSSProperties = {
  flexShrink: 0,
  padding: '2px 8px',
  borderRadius: '999px',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 900,
  lineHeight: 1.4,
  whiteSpace: 'nowrap'
}

const menuNameStyle: CSSProperties = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 900,
  color: '#0f172a',
  lineHeight: 1.2,
  wordBreak: 'keep-all',
  overflowWrap: 'anywhere'
}

const menuDescStyle: CSSProperties = {
  margin: '7px 0 0',
  fontSize: '13px',
  lineHeight: 1.4,
  color: '#64748b',
  wordBreak: 'keep-all'
}

const priceStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: '16px',
  fontWeight: 900,
  color: '#0f172a',
  textAlign: 'right'
}

const selectedMenuSummaryStyle: CSSProperties = {
  padding: '14px',
  borderRadius: '18px',
  backgroundColor: '#f8fafc',
  border: '1px solid #dbe2ea'
}

const quantityWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px'
}

const quantityControlStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
}

const quantityButtonStyle: CSSProperties = {
  width: '46px',
  height: '46px',
  border: '1px solid #d1d5db',
  borderRadius: '999px',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  fontSize: '22px',
  fontWeight: 800,
  cursor: 'pointer'
}

const quantityNumberStyle: CSSProperties = {
  minWidth: '34px',
  textAlign: 'center',
  fontSize: '20px',
  fontWeight: 900,
  color: '#111827'
}

const optionListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
}

const optionLabelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  minHeight: '52px',
  padding: '12px',
  borderRadius: '16px',
  border: '1px solid #dbe2ea',
  backgroundColor: '#ffffff',
  cursor: 'pointer'
}

const optionMainRowStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px'
}

const optionLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '14px',
  fontWeight: 800,
  color: '#111827'
}

const optionRightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
  flexShrink: 0
}

const optionQuantityLimitNoticeStyle: CSSProperties = {
  width: '100%',
  paddingLeft: '28px',
  marginTop: '-2px',
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 700,
  lineHeight: 1.35,
  wordBreak: 'keep-all',
  overflowWrap: 'break-word'
}

const optionQuantityControlStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}

const optionQuantityButtonStyle: CSSProperties = {
  width: '28px',
  height: '28px',
  border: '1px solid #d1d5db',
  borderRadius: '999px',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: 900,
  cursor: 'pointer',
  lineHeight: 1
}

const optionQuantityNumberStyle: CSSProperties = {
  minWidth: '20px',
  textAlign: 'center',
  fontSize: '13px',
  fontWeight: 900,
  color: '#111827'
}

const checkboxStyle: CSSProperties = {
  width: '18px',
  height: '18px'
}

const inputGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
}

const inputStyle: CSSProperties = {
  width: '100%',
  height: '46px',
  boxSizing: 'border-box',
  padding: '0 14px',
  border: '1px solid #dbe2ea',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: 800,
  color: '#111827',
  outline: 'none'
}

const addressButtonStyle: CSSProperties = {
  width: '100%',
  height: '46px',
  padding: '0 14px',
  boxSizing: 'border-box',
  border: '1px solid #dbe2ea',
  borderRadius: '12px',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 800,
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
}

const paymentGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px'
}

const paymentButtonStyle: CSSProperties = {
  minHeight: '86px',
  padding: '14px',
  border: '1px solid #dbe3ef',
  borderRadius: '16px',
  backgroundColor: '#ffffff',
  boxShadow: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  outline: 'none'
}

const selectedPaymentButtonStyle: CSSProperties = {
  ...paymentButtonStyle,
  border: '2px solid #0f172a',
  backgroundColor: '#f8fafc',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.14)'
}

const paymentTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 900,
  color: '#111827'
}

const paymentDescStyle: CSSProperties = {
  margin: '7px 0 0',
  fontSize: '12px',
  lineHeight: 1.45,
  color: '#6b7280'
}

const memoStyle: CSSProperties = {
  width: '100%',
  minHeight: '82px',
  boxSizing: 'border-box',
  padding: '14px',
  border: '1px solid #dbe2ea',
  borderRadius: '12px',
  resize: 'vertical',
  fontSize: '14px',
  lineHeight: 1.5,
  outline: 'none'
}

const summaryRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  padding: '8px 4px',
  fontSize: '14px',
  color: '#374151'
}

const totalRowStyle: CSSProperties = {
  ...summaryRowStyle,
  marginTop: '8px',
  paddingTop: '14px',
  borderTop: '1px solid #dbe2ea',
  fontSize: '20px',
  fontWeight: 900,
  color: '#0f172a'
}

const summaryListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const summaryItemCardStyle: CSSProperties = {
  padding: '12px',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 6px 16px rgba(15, 23, 42, 0.04)'
}

const summaryOptionListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '4px 4px 0',
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 700,
  lineHeight: 1.45,
  wordBreak: 'keep-all',
  overflowWrap: 'break-word'
}

const footerBarStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  minHeight: '56px',
  padding: '0',
  border: 'none',
  backgroundColor: 'transparent',
  boxShadow: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '14px',
  boxSizing: 'border-box'
}

const footerBarModalContainerStyle: CSSProperties = {
  borderTop: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: 'none',
  minHeight: '76px'
}

const footerBarViewportStyle: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 90,
  borderTop: '1px solid #dbe2ea',
  backgroundColor: '#ffffff',
  boxShadow: '0 -8px 24px rgba(15, 23, 42, 0.08)'
}

const footerBarInnerStyle: CSSProperties = {
  width: '100%',
  maxWidth: '1120px',
  margin: '0 auto',
  padding: '10px 24px calc(10px + env(safe-area-inset-bottom))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '14px',
  boxSizing: 'border-box'
}

const footerBarInnerModalStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  margin: 0,
  padding: '10px 16px calc(10px + env(safe-area-inset-bottom))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '14px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff'
}

const footerTotalStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  minWidth: 0,
  color: '#0f172a'
}

const footerTotalLabelStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 900,
  whiteSpace: 'nowrap'
}

const footerTotalAmountStyle: CSSProperties = {
  fontSize: '28px',
  fontWeight: 1000,
  letterSpacing: '-0.02em',
  whiteSpace: 'nowrap'
}

const footerOrderButtonStyle: CSSProperties = {
  minWidth: '180px',
  height: '48px',
  border: 'none',
  borderRadius: '12px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 900,
  cursor: 'pointer'
}

const footerActionGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '10px',
  minWidth: 0,
  flex: '0 0 auto',
  flexWrap: 'wrap'
}

const footerCartButtonStyle: CSSProperties = {
  minWidth: '128px',
  height: '48px',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: '15px',
  fontWeight: 900,
  cursor: 'pointer'
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  padding: '24px',
  backgroundColor: 'rgba(15, 23, 42, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  overflow: 'hidden'
}

const modalPanelStyle: CSSProperties = {
  width: 'min(100%, 900px)',
  maxHeight: 'min(86vh, 760px)',
  border: '1px solid #dbe2ea',
  borderRadius: '24px',
  backgroundColor: '#ffffff',
  boxShadow: '0 28px 70px rgba(15, 23, 42, 0.28)',
  padding: '18px',
  boxSizing: 'border-box',
  overflow: 'hidden',
  position: 'relative',
  margin: 'auto',
  display: 'flex',
  flexDirection: 'column'
}

const modalHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '16px',
  marginBottom: '14px'
}

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 900,
  color: '#0f172a',
  letterSpacing: '-0.03em'
}

const modalDescriptionStyle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: '14px',
  fontWeight: 700,
  lineHeight: 1.5,
  color: '#64748b'
}

const modalCloseButtonStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  border: '1px solid #dbe2ea',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  fontSize: '22px',
  fontWeight: 900,
  cursor: 'pointer'
}

const modalBodyStyle: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: '12px',
  alignItems: 'start'
}

const modalFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginTop: '14px',
  paddingTop: '14px',
  borderTop: '1px solid #e5eaf0'
}

const modalCancelButtonStyle: CSSProperties = {
  minWidth: '120px',
  height: '46px',
  border: '1px solid #dbe2ea',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: 900,
  cursor: 'pointer'
}

const modalSubmitButtonStyle: CSSProperties = {
  minWidth: '180px',
  height: '46px',
  border: 'none',
  borderRadius: '12px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 900,
  cursor: 'pointer'
}

const noticeStyle: CSSProperties = {
  marginTop: '10px',
  fontSize: '12px',
  lineHeight: 1.5,
  color: '#9ca3af',
  textAlign: 'center'
}

// SECTION 05 : UTIL FUNCTION

function formatPrice(
  value: number
): string {
  return `${value.toLocaleString('ko-KR')}원`
}

function normalizeCartOptionType(
  value: string | null | undefined
): CartOptionType {
  const normalized =
    String(value ?? '').trim().toUpperCase()

  if (
    normalized === 'SIZE' ||
    normalized === 'TEMPERATURE' ||
    normalized === 'ADDON' ||
    normalized === 'CHOICE' ||
    normalized === 'CUSTOM'
  ) {
    return normalized
  }

  return 'CUSTOM'
}

function getOptionDefaultQuantity(
  option: OrderOptionItem
): number {
  return Math.max(1, Number(option.defaultOptionQuantity ?? option.minOptionQuantity ?? 1))
}

function getOptionMinQuantity(
  option: OrderOptionItem
): number {
  return Math.max(1, Number(option.minOptionQuantity ?? 1))
}

function getOptionMaxQuantity(
  option: OrderOptionItem
): number | null {
  if (!option.isQuantityLimitEnabled) {
    return null
  }

  const value = Number(option.maxOptionQuantity)
  return Number.isInteger(value) && value >= 1 ? value : null
}

// SECTION 06 : COMPONENT

export default function DeliveryOrderContent({
  channelCode,
  activeCategoryKey,
  categorySidebar,
  embedInModal = false
}: Props) {
  const [isLoadingMenus, setIsLoadingMenus] = useState<boolean>(false)
  const [menuError, setMenuError] = useState<string | null>(null)
  const [orderSubmitError, setOrderSubmitError] = useState<string | null>(null)
  const [deliveryAddressError, setDeliveryAddressError] = useState<string | null>(null)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false)
  const [isCartAdding, setIsCartAdding] = useState<boolean>(false)
  const [isLoadingDeliveryAddresses, setIsLoadingDeliveryAddresses] = useState<boolean>(false)
  const [bootstrapData, setBootstrapData] = useState<CustomerOrderBootstrapResponse | null>(null)
  const [orderResult, setOrderResult] = useState<{ orderCode: string, revisionCode: string } | null>(null)
  const [menuItems, setMenuItems] = useState<OrderMenuItem[]>(MOCK_MENU_ITEMS)
  const [menuOptionItemsByMenuId, setMenuOptionItemsByMenuId] = useState<Record<string, OrderOptionItem[]>>({})
  const [deliveryAddresses, setDeliveryAddresses] = useState<DeliveryAddressItem[]>([])
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<string>('')
  const [deliveryAddressLoadContext, setDeliveryAddressLoadContext] = useState<DeliveryAddressLoadContext | null>(null)

  // SECTION 07 : STATE

  const [selectedMenuId, setSelectedMenuId] =
    useState<string>(MOCK_MENU_ITEMS[0]?.id || '')

  const [quantity, setQuantity] =
    useState<number>(0)

  const [selectedOptionIds, setSelectedOptionIds] =
    useState<string[]>([])

  const [selectedOptionQuantities, setSelectedOptionQuantities] =
    useState<Record<string, number>>({})

  const [receiverName, setReceiverName] =
    useState<string>('')

  const [receiverPhone, setReceiverPhone] =
    useState<string>('')

  const [address, setAddress] =
    useState<string>('')

  const [detailAddress, setDetailAddress] =
    useState<string>('')

  const [paymentId, setPaymentId] =
    useState<string>(DELIVERY_PAYMENT_ITEMS[0]?.id || '')

  const [memo, setMemo] =
    useState<string>('')

  const [isCompactLayout, setIsCompactLayout] =
    useState<boolean>(false)

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] =
    useState<boolean>(false)
  const [failedMenuThumbnailKeys, setFailedMenuThumbnailKeys] = useState<Set<string>>(new Set())
  const [favoriteProductMap, setFavoriteProductMap] = useState<Record<string, boolean>>({})
  const [favoriteProductLoadingMap, setFavoriteProductLoadingMap] = useState<Record<string, boolean>>({})
  const [orderItems, setOrderItems] = useState<DeliveryDraftOrderItem[]>([])
  const [isCartNoticeModalOpen, setIsCartNoticeModalOpen] = useState<boolean>(false)
  const [cartNoticeModalType, setCartNoticeModalType] = useState<CartNoticeModalType>('success')
  const [cartNoticeModalMessage, setCartNoticeModalMessage] = useState<string>('')

  // SECTION 08 : MEMO DATA

  useEffect(() => {
    function updateCompactLayout() {
      setIsCompactLayout(window.innerWidth < 1180)
    }

    updateCompactLayout()
    window.addEventListener('resize', updateCompactLayout)

    return () => {
      window.removeEventListener('resize', updateCompactLayout)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadBootstrap() {
      if (!channelCode) {
        setBootstrapData(null)
        setMenuItems([])
        setMenuOptionItemsByMenuId({})
        return
      }

      setIsLoadingMenus(true)
      setMenuError(null)

      try {
        const response = await getCustomerOrderBootstrap({
          providerChannelCode: channelCode,
          orderFlowType: 'DELIVERY'
        })

        if (cancelled) {
          return
        }

        setBootstrapData(response)

        const nextMenuItems: OrderMenuItem[] = response.products.map((product) => ({
          id: String(product.id),
          productDbId: Number(product.productDbId ?? product.id),
          productId: typeof product.productId === 'string' ? product.productId : null,
          productCode: product.productCode ?? null,
          sourceType: product.sourceType === 'MARKET_PRODUCT' ? 'MARKET_PRODUCT' : 'POS_PRODUCT',
          categoryKey: response.categories.find((category) => category.id === product.categoryId)?.categoryCode ?? 'UNCATEGORIZED',
          name: product.productName,
          description: product.productDescription ?? '',
          price: product.basePrice,
          thumbnailFilePath: product.thumbnail?.filePath ?? null
        }))

        const nextOptionsByMenuId: Record<string, OrderOptionItem[]> = {}
        response.products.forEach((product) => {
          nextOptionsByMenuId[String(product.id)] = product.options.flatMap((option) => (
            option.values.map((value) => ({
              id: `${option.id}:${value.id}`,
              label: option.optionName.trim() === value.optionValueName.trim()
                ? option.optionName
                : `${option.optionName} - ${value.optionValueName}`,
              price: value.priceDelta,
              productOptionId: option.id,
              productOptionValueId: value.id,
              optionName: option.optionName,
              optionType: normalizeCartOptionType(option.optionType),
              optionValueName: value.optionValueName,
              isQuantityEnabled: Boolean(value.isQuantityEnabled),
              isQuantityLimitEnabled: Boolean(value.isQuantityLimitEnabled),
              minOptionQuantity: value.minOptionQuantity ?? null,
              maxOptionQuantity: value.maxOptionQuantity ?? null,
              defaultOptionQuantity: value.defaultOptionQuantity ?? null
            }))
          ))
        })

        setMenuItems(nextMenuItems)
        setMenuOptionItemsByMenuId(nextOptionsByMenuId)
      } catch (error) {
        if (cancelled) {
          return
        }
        setBootstrapData(null)
        setMenuItems([])
        setMenuOptionItemsByMenuId({})
        setMenuError(
          error instanceof Error && error.message
            ? `메뉴 정보를 불러오지 못했습니다. (${error.message})`
            : '메뉴 정보를 불러오지 못했습니다.'
        )
      } finally {
        if (!cancelled) {
          setIsLoadingMenus(false)
        }
      }
    }

    void loadBootstrap()

    return () => {
      cancelled = true
    }
  }, [channelCode])

  const selectedMenu = useMemo(() => {
    return menuItems.find(item => {
      return item.id === selectedMenuId
    }) || EMPTY_MENU_ITEM
  }, [
    selectedMenuId,
    menuItems
  ])

  const visibleProducts = useMemo(() => {
    if (activeCategoryKey === 'ALL') {
      return menuItems
    }
    const filtered = menuItems.filter((item) => item.categoryKey === activeCategoryKey)
    return filtered.length > 0 ? filtered : menuItems
  }, [activeCategoryKey, menuItems])

  useEffect(() => {
    if (visibleProducts.length === 0) {
      setSelectedMenuId(EMPTY_MENU_ITEM.id)
      return
    }

    const currentVisible = visibleProducts.some((item) => item.id === selectedMenuId)

    if (!currentVisible) {
      setSelectedMenuId(visibleProducts[0].id)
      setQuantity(0)
      setSelectedOptionIds([])
      setSelectedOptionQuantities({})
    }
  }, [selectedMenuId, visibleProducts])

  const selectedOptions = useMemo(() => {
    const optionItems = menuOptionItemsByMenuId[selectedMenuId] ?? []
    return optionItems.filter(item => {
      return selectedOptionIds.includes(item.id)
    })
  }, [
    selectedOptionIds,
    selectedMenuId,
    menuOptionItemsByMenuId
  ])

  const currentDraftOrderItem = useMemo<DeliveryDraftOrderItem | null>(() => {
    const productCode = getItemProductCode(selectedMenu)

    if (
      !productCode ||
      selectedMenu.id === EMPTY_MENU_ITEM.id ||
      quantity <= 0
    ) {
      return null
    }

    const options = selectedOptions.map((option) => {
      const [optionIdRaw, optionValueIdRaw] = option.id.split(':')
      const optionId =
        option.productOptionId ?? Number(optionIdRaw)
      const optionValueId =
        option.productOptionValueId ?? Number(optionValueIdRaw)
      const optionQuantity =
        option.isQuantityEnabled
          ? Math.max(
              getOptionMinQuantity(option),
              selectedOptionQuantities[option.id] ?? getOptionDefaultQuantity(option)
            )
          : 1

      return {
        optionItemId: option.id,
        optionId: Number.isInteger(optionId) ? optionId : null,
        optionValueId: Number.isInteger(optionValueId) ? optionValueId : null,
        optionName: option.optionName || option.label,
        optionType: option.optionType ?? 'CUSTOM',
        optionValueName: option.optionValueName || option.label,
        isQuantityEnabled: Boolean(option.isQuantityEnabled),
        isQuantityLimitEnabled: Boolean(option.isQuantityLimitEnabled),
        priceDelta: option.price,
        quantity: optionQuantity,
        lineOptionAmount: option.price * optionQuantity
      }
    })

    const optionTotalAmount = options.reduce((sum, option) => {
      return sum + option.lineOptionAmount
    }, 0)

    return {
      localItemId: productCode,
      productDbId:
        Number.isInteger(Number(selectedMenu.productDbId))
          ? Number(selectedMenu.productDbId)
          : Number.isInteger(Number(selectedMenu.id))
            ? Number(selectedMenu.id)
            : null,
      productCode,
      productId: typeof selectedMenu.productId === 'string' && selectedMenu.productId.trim().length > 0
        ? selectedMenu.productId.trim()
        : null,
      sourceType: selectedMenu.sourceType === 'MARKET_PRODUCT' ? 'MARKET_PRODUCT' : 'POS_PRODUCT',
      productName: selectedMenu.name,
      unitPrice: selectedMenu.price,
      quantity,
      optionTotalAmount,
      lineTotalAmount: (selectedMenu.price + optionTotalAmount) * quantity,
      options
    }
  }, [
    selectedMenu,
    selectedOptions,
    selectedOptionQuantities,
    quantity
  ])

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      return sum + item.lineTotalAmount
    }, 0)
  }, [
    orderItems
  ])

  const responsiveOrderGridStyle = useMemo<CSSProperties>(() => {
    if (isCompactLayout) {
      return {
        ...orderGridStyle,
        gridTemplateColumns: '1fr'
      }
    }

    return orderGridStyle
  }, [
    isCompactLayout
  ])

  // SECTION 09 : EVENT FUNCTION

  function handleSelectMenu(
    menuId: string
  ) {
    const nextMenu = menuItems.find((item) => item.id === menuId)
    const nextProductCode = nextMenu ? getItemProductCode(nextMenu) : null
    const existingItem = nextProductCode
      ? orderItems.find((item) => item.productCode === nextProductCode)
      : null

    setSelectedMenuId(menuId)
    setQuantity(existingItem?.quantity ?? 0)
    setSelectedOptionIds(existingItem?.options.map((option) => option.optionItemId) ?? [])
    setSelectedOptionQuantities(
      existingItem?.options.reduce<Record<string, number>>((acc, option) => {
        acc[option.optionItemId] = option.quantity
        return acc
      }, {}) ?? {}
    )
  }

  function getMenuThumbnailKey(item: OrderMenuItem): string {
    const path = item.thumbnailFilePath?.trim() ?? ''
    return `${item.id}:${path || item.name}`
  }

  function getFavoriteItemKey(productCode: string): string {
    return `${channelCode}:${productCode}`
  }

  function getItemProductCode(item: OrderMenuItem): string | null {
    const raw = String(item.productCode ?? '').trim()
    return raw.length > 0 ? raw : null
  }

  useEffect(() => {
    const productCode = getItemProductCode(selectedMenu)

    if (!productCode) {
      return
    }

    setOrderItems((prev) => {
      if (!currentDraftOrderItem) {
        return prev.filter((item) => item.productCode !== productCode)
      }

      const exists = prev.some((item) => item.productCode === productCode)
      if (!exists) {
        return [
          ...prev,
          currentDraftOrderItem
        ]
      }

      return prev.map((item) => (
        item.productCode === productCode
          ? currentDraftOrderItem
          : item
      ))
    })
  }, [
    selectedMenu,
    currentDraftOrderItem
  ])

  useEffect(() => {
    if (!channelCode || menuItems.length === 0) {
      return
    }

    let cancelled = false
    const productCodeSet = new Set<string>()
    menuItems.forEach((item) => {
      const code = getItemProductCode(item)
      if (code) {
        productCodeSet.add(code)
      }
    })

    if (productCodeSet.size === 0) {
      return
    }

    const fetchStatuses = async () => {
      const updates: Record<string, boolean> = {}
      await Promise.all(
        Array.from(productCodeSet).map(async (productCode) => {
          try {
            const response = await getProductFavoriteStatus({
              providerChannelCode: channelCode,
              productCode
            })
            updates[getFavoriteItemKey(productCode)] = Boolean(response?.isActive)
          } catch {
            // 조회 실패 시 기존 상태를 유지한다.
          }
        })
      )

      if (!cancelled && Object.keys(updates).length > 0) {
        setFavoriteProductMap((prev) => ({
          ...prev,
          ...updates
        }))
      }
    }

    void fetchStatuses()

    return () => {
      cancelled = true
    }
  }, [channelCode, menuItems])

  async function handleToggleProductFavorite(
    item: OrderMenuItem,
    event: MouseEvent<HTMLSpanElement> | KeyboardEvent<HTMLSpanElement>
  ) {
    event.preventDefault()
    event.stopPropagation()

    const productCode = getItemProductCode(item)
    if (!channelCode || !productCode) {
      return
    }

    const favoriteKey = getFavoriteItemKey(productCode)
    if (favoriteProductLoadingMap[favoriteKey]) {
      return
    }

    setFavoriteProductLoadingMap((prev) => ({
      ...prev,
      [favoriteKey]: true
    }))

    try {
      const response = await toggleProductFavorite({
        providerChannelCode: channelCode,
        productCode
      })
      setFavoriteProductMap((prev) => ({
        ...prev,
        [favoriteKey]: Boolean(response?.isFavorite)
      }))
    } catch {
      // 실패 시 UI 상태를 강제 변경하지 않는다.
    } finally {
      setFavoriteProductLoadingMap((prev) => ({
        ...prev,
        [favoriteKey]: false
      }))
    }
  }

  function markMenuThumbnailFailed(item: OrderMenuItem) {
    const nextKey = getMenuThumbnailKey(item)
    setFailedMenuThumbnailKeys((prev) => {
      if (prev.has(nextKey)) {
        return prev
      }

      const next = new Set(prev)
      next.add(nextKey)
      return next
    })
  }

  function handleDecreaseQuantity() {
    setQuantity(prev => {
      return Math.max(0, prev - 1)
    })
  }

  function handleIncreaseQuantity() {
    setQuantity(prev => {
      return prev + 1
    })
  }

  function handleToggleOption(
    optionId: string
  ) {
    const targetOption =
      (menuOptionItemsByMenuId[selectedMenuId] ?? []).find((item) => item.id === optionId)

    setSelectedOptionIds(prev => {
      if (prev.includes(optionId)) {
        setSelectedOptionQuantities((quantityMap) => {
          const next = { ...quantityMap }
          delete next[optionId]
          return next
        })
        return prev.filter(id => {
          return id !== optionId
        })
      }

      if (targetOption?.isQuantityEnabled) {
        setSelectedOptionQuantities((quantityMap) => ({
          ...quantityMap,
          [optionId]: Math.max(
            getOptionMinQuantity(targetOption),
            quantityMap[optionId] ?? getOptionDefaultQuantity(targetOption)
          )
        }))
      }

      return [
        ...prev,
        optionId
      ]
    })
  }

  function handleIncreaseOptionQuantity(
    optionId: string,
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault()
    event.stopPropagation()

    const targetOption =
      (menuOptionItemsByMenuId[selectedMenuId] ?? []).find((item) => item.id === optionId)
    if (!targetOption?.isQuantityEnabled) {
      return
    }
    const maxQuantity = getOptionMaxQuantity(targetOption)
    const isCurrentlySelected = selectedOptionIds.includes(optionId)

    setSelectedOptionIds((prev) => (
      prev.includes(optionId)
        ? prev
        : [
            ...prev,
            optionId
          ]
    ))
    setSelectedOptionQuantities((prev) => ({
      ...prev,
      [optionId]: maxQuantity === null
        ? isCurrentlySelected
          ? (prev[optionId] ?? getOptionDefaultQuantity(targetOption)) + 1
          : getOptionDefaultQuantity(targetOption)
        : Math.min(
            maxQuantity,
            isCurrentlySelected
              ? (prev[optionId] ?? getOptionDefaultQuantity(targetOption)) + 1
              : getOptionDefaultQuantity(targetOption)
          )
    }))
  }

  function handleDecreaseOptionQuantity(
    optionId: string,
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault()
    event.stopPropagation()

    const targetOption =
      (menuOptionItemsByMenuId[selectedMenuId] ?? []).find((item) => item.id === optionId)
    if (!targetOption?.isQuantityEnabled) {
      return
    }

    const minQuantity = getOptionMinQuantity(targetOption)
    const currentQuantity = selectedOptionQuantities[optionId] ?? 0

    if (currentQuantity <= minQuantity) {
      setSelectedOptionIds((prev) => prev.filter((id) => id !== optionId))
      setSelectedOptionQuantities((prev) => {
        const next = { ...prev }
        delete next[optionId]
        return next
      })
      return
    }

    setSelectedOptionQuantities((prev) => ({
      ...prev,
      [optionId]: currentQuantity - 1
    }))
  }

  function applyDeliveryAddress(
    item: DeliveryAddressItem
  ) {
    setSelectedDeliveryAddressId(String(item.id))
    setReceiverName(item.recipientName?.trim() || '')
    setReceiverPhone(item.recipientPhone?.trim() || '')
    setAddress(item.deliveryAddress?.trim() || '')
    setDetailAddress(item.deliveryDetailAddress?.trim() || '')
    setMemo(item.deliveryMemo?.trim() || '')
  }

  async function loadDeliveryAddressesFromDb() {
    setIsLoadingDeliveryAddresses(true)
    setDeliveryAddressError(null)

    try {
      const me = await getMe()
      const profileId = Number(me?.user?.profileId || 0)
      const meChannelCode = String(me?.user?.channelCode || '').trim()

      if (!profileId || !meChannelCode) {
        throw new Error('로그인 컨텍스트를 확인하지 못했습니다.')
      }

      const response = await listMyDeliveryAddresses({
        profileId,
        channelCode: meChannelCode,
      })

      setDeliveryAddressLoadContext({
        profileId,
        channelCode: meChannelCode,
      })

      const activeAddresses = (response.addresses || []).filter((item) => Number(item.isActive) === 1)
      setDeliveryAddresses(activeAddresses)

      if (activeAddresses.length > 0) {
        const defaultAddress = activeAddresses.find((item) => Number(item.isDefault) === 1) ?? activeAddresses[0]
        applyDeliveryAddress(defaultAddress)
      }
    } catch (error) {
      setDeliveryAddressError(
        error instanceof Error && error.message
          ? `배송지 정보를 불러오지 못했습니다. (${error.message})`
          : '배송지 정보를 불러오지 못했습니다.'
      )
    } finally {
      setIsLoadingDeliveryAddresses(false)
    }
  }

  function handleAddressSearch() {
    void loadDeliveryAddressesFromDb()
  }

  function handleOpenDeliveryModal() {
    if (orderItems.length === 0) {
      setOrderSubmitError('주문내역에 담긴 메뉴가 없습니다.')
      return
    }

    setOrderSubmitError(null)
    setIsDeliveryModalOpen(true)
    if (deliveryAddresses.length < 1 && !isLoadingDeliveryAddresses) {
      void loadDeliveryAddressesFromDb()
    }
  }

  function handleCloseDeliveryModal() {
    setIsDeliveryModalOpen(false)
  }

  function buildCartOptions(
    item: DeliveryDraftOrderItem
  ): AddCartItemOptionInput[] {
    return item.options
      .map((option) => {
        return {
          productOptionId: option.optionId ?? undefined,
          productOptionValueId: option.optionValueId ?? undefined,
          optionNameSnapshot: option.optionName,
          optionTypeSnapshot: option.optionType,
          optionValueNameSnapshot: option.optionValueName,
          priceDeltaSnapshot: option.priceDelta,
          quantity: option.quantity
        }
      })
      .filter((option) => (
        Number.isInteger(option.productOptionId) &&
        Number.isInteger(option.productOptionValueId)
      ))
  }

  function normalizeOptionSignatureTokens(
    options: Array<{
      productOptionId?: unknown
      productOptionValueId?: unknown
      optionNameSnapshot?: unknown
      optionValueNameSnapshot?: unknown
    }>
  ): string[] {
    return options
      .map((option) => {
        const optionId = Number(option.productOptionId)
        const optionValueId = Number(option.productOptionValueId)
        if (Number.isInteger(optionId) && optionId > 0 && Number.isInteger(optionValueId) && optionValueId > 0) {
          return `${optionId}:${optionValueId}`
        }

        const optionName = String(option.optionNameSnapshot ?? '').trim()
        const optionValueName = String(option.optionValueNameSnapshot ?? '').trim()
        return `name:${optionName}|value:${optionValueName}`
      })
      .filter((token) => token.length > 0)
      .sort()
  }

  function buildDraftOrderItemSignature(item: DeliveryDraftOrderItem): string {
    const productIdentifier =
      Number.isInteger(item.productDbId) && Number(item.productDbId) > 0
        ? `productDbId:${Number(item.productDbId)}`
        : item.productCode
          ? `menuId:${item.productCode}`
          : `id:${item.localItemId}`

    const optionTokens = normalizeOptionSignatureTokens(
      item.options.map((option) => ({
        productOptionId: option.optionId ?? undefined,
        productOptionValueId: option.optionValueId ?? undefined,
        optionNameSnapshot: option.optionName,
        optionValueNameSnapshot: option.optionValueName
      }))
    )

    return `sourceType:${item.sourceType}|${productIdentifier}|options:${optionTokens.join(',')}`
  }

  function buildServerCartItemSignature(item: {
    productCode: string
    sourceType?: string
    options?: Array<{
      productOptionId?: unknown
      productOptionValueId?: unknown
      optionNameSnapshot?: unknown
      optionValueNameSnapshot?: unknown
    }>
  }): string {
    const productCode = String(item.productCode || '').trim()
    const productIdentifier = productCode ? `menuId:${productCode}` : 'id:unknown'
    const optionTokens = normalizeOptionSignatureTokens(item.options ?? [])
    const sourceType = String(item.sourceType ?? 'POS_PRODUCT').trim().toUpperCase()
    return `sourceType:${sourceType}|${productIdentifier}|options:${optionTokens.join(',')}`
  }

  function openCartNoticeModal(
    modalType: CartNoticeModalType,
    message: string
  ) {
    setCartNoticeModalType(modalType)
    setCartNoticeModalMessage(message)
    setIsCartNoticeModalOpen(true)
  }

  function handleAddCartItem() {
    if (isCartAdding) {
      return
    }

    if (!channelCode) {
      setOrderSubmitError('채널 정보를 확인하지 못했습니다.')
      return
    }

    if (orderItems.length === 0) {
      setOrderSubmitError('장바구니에 담을 주문내역이 없습니다.')
      return
    }

    const invalidItem = orderItems.find((item) => !item.productCode || item.quantity <= 0)
    if (invalidItem) {
      setOrderSubmitError('장바구니에 담을 상품 정보를 확인해 주세요.')
      return
    }

    setIsCartAdding(true)
    setOrderSubmitError(null)

    void (async () => {
      const activeCartResponse = await getMyCartItems('ACTIVE')
      const activeCartSignatureSet = new Set<string>(
        activeCartResponse.items
          .filter((cartItem) => cartItem.orderFlowType === 'DELIVERY')
          .map((cartItem) => (
            buildServerCartItemSignature({
              productCode: cartItem.productCode,
              sourceType: (cartItem as { sourceType?: string }).sourceType,
              options: cartItem.options as Array<{
                productOptionId?: unknown
                productOptionValueId?: unknown
                optionNameSnapshot?: unknown
                optionValueNameSnapshot?: unknown
              }>
            })
          ))
      )

      const hasDuplicate = orderItems.some((item) => {
        const signature = buildDraftOrderItemSignature(item)
        return activeCartSignatureSet.has(signature)
      })

      if (hasDuplicate) {
        openCartNoticeModal('warning', '이미 장바구니에 저장되었습니다.')
        return
      }

      let hasCreated = false
      let hasDuplicateFromServer = false

      for (const item of orderItems) {
        const response = await addCartItem({
          providerChannelCode: channelCode,
          productDbId: Number.isInteger(item.productDbId) ? Number(item.productDbId) : undefined,
          productId: item.productId ?? undefined,
          productCode: item.productCode,
          sourceType: item.sourceType,
          quantity: item.quantity,
          orderFlowType: 'DELIVERY',
          fulfillmentType: 'DELIVERY',
          requestMemo: memo.trim() || undefined,
          options: buildCartOptions(item)
        })

        if (response.status === 'DUPLICATE') {
          hasDuplicateFromServer = true
          continue
        }

        hasCreated = true
      }

      if (hasCreated && !hasDuplicateFromServer) {
        openCartNoticeModal('success', '장바구니에 저장되었습니다.')
        return
      }

      if (!hasCreated && hasDuplicateFromServer) {
        openCartNoticeModal('warning', '이미 장바구니에 저장되었습니다.')
        return
      }

      if (hasCreated && hasDuplicateFromServer) {
        openCartNoticeModal('warning', '이미 장바구니에 저장되었습니다.')
      }
    })()
      .catch((error) => {
        setOrderSubmitError(
          error instanceof Error && error.message
            ? `장바구니에 담지 못했습니다. (${error.message})`
            : '장바구니에 담지 못했습니다.'
        )
      })
      .finally(() => {
        setIsCartAdding(false)
      })
  }

  function handleSubmitOrder() {
    if (isSubmittingOrder) {
      return
    }

    if (!channelCode) {
      setOrderSubmitError('채널 정보를 확인하지 못했습니다.')
      return
    }

    if (orderItems.length === 0) {
      setOrderSubmitError('주문내역에 담긴 메뉴가 없습니다.')
      return
    }

    const invalidOrderItem = orderItems.find((item) => (
      !Number.isInteger(item.productDbId) ||
      Number(item.productDbId) < 1 ||
      item.quantity <= 0
    ))
    if (invalidOrderItem) {
      setOrderSubmitError('메뉴 정보가 올바르지 않습니다.')
      return
    }

    setIsSubmittingOrder(true)
    setOrderSubmitError(null)

    const payload: CreateCustomerOrderRequest = {
      providerChannelCode: channelCode,
      orderSource: 'ONLINE',
      orderFlowType: 'DELIVERY',
      customerProfileId: deliveryAddressLoadContext?.profileId,
      customerChannelCode: deliveryAddressLoadContext?.channelCode,
      customerName: receiverName.trim() || undefined,
      customerPhone: receiverPhone.trim() || undefined,
      memo: memo.trim() || undefined,
      fulfillment: {
        deliveryAddress: address.trim() || undefined,
        deliveryDetailAddress: detailAddress.trim() || undefined,
        deliveryPhone: receiverPhone.trim() || undefined,
        deliveryMemo: memo.trim() || undefined,
        customerRequestMemo: memo.trim() || undefined
      },
      items: orderItems.map((item) => ({
        posProductId: Number(item.productDbId),
        productCode: item.productCode,
        productId: item.productId ?? undefined,
        sourceType: item.sourceType,
        quantity: item.quantity,
        options: item.options
          .map((option) => ({
            productOptionId: Number(option.optionId),
            productOptionValueId: Number(option.optionValueId),
            quantity: option.quantity
          }))
          .filter((option) => Number.isInteger(option.productOptionId) && Number.isInteger(option.productOptionValueId))
      }))
    }

    void createCustomerOrder(payload)
      .then((response) => {
        setOrderResult({
          orderCode: response.order.orderCode,
          revisionCode: response.order.revisionCode
        })
        setIsDeliveryModalOpen(false)
      })
      .catch((error) => {
        setOrderSubmitError(
          error instanceof Error && error.message
            ? `주문을 접수하지 못했습니다. (${error.message})`
            : '주문을 접수하지 못했습니다.'
        )
      })
      .finally(() => {
        setIsSubmittingOrder(false)
      })
  }

  // SECTION 10 : UI BLOCK

  const IntroUI = (
    <section style={introCardStyle}>
      <h2 style={titleStyle}>
        배달 주문
      </h2>

      <p style={descriptionStyle}>
        고객 주소지를 기준으로 배달 주문을 진행하는 화면입니다.
        실제 서비스에서는 로그인한 고객의 기본 배송지를 불러오는 구조가 적합합니다.
      </p>
    </section>
  )

  const MenuSelectUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        1. 메뉴 선택
      </h3>

      {isLoadingMenus ? (
        <p style={descriptionStyle}>메뉴 정보를 불러오는 중입니다.</p>
      ) : null}
      {menuError ? (
        <p style={descriptionStyle}>{menuError}</p>
      ) : null}
      <div style={menuGridStyle}>
        {visibleProducts.map(item => {
          const isSelected = item.id === selectedMenuId
          const productCode = getItemProductCode(item)
          const favoriteKey = productCode ? getFavoriteItemKey(productCode) : null
          const isFavorite = favoriteKey ? Boolean(favoriteProductMap[favoriteKey]) : false
          const isFavoriteLoading = favoriteKey ? Boolean(favoriteProductLoadingMap[favoriteKey]) : false
          const thumbnailUrl = mediaUrl(item.thumbnailFilePath)
          const thumbnailKey = getMenuThumbnailKey(item)
          const shouldRenderImageCard =
            Boolean(thumbnailUrl) &&
            !failedMenuThumbnailKeys.has(thumbnailKey)

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              style={
                shouldRenderImageCard
                  ? (isSelected ? selectedMenuImageButtonStyle : menuImageButtonStyle)
                  : (isSelected ? selectedMenuButtonStyle : menuButtonStyle)
              }
              onClick={() => {
                handleSelectMenu(item.id)
              }}
            >
              {shouldRenderImageCard ? (
                <span style={menuThumbWrapStyle}>
                  <img
                    src={thumbnailUrl ?? ''}
                    alt={item.name}
                    style={menuThumbImageStyle}
                    onError={() => {
                      markMenuThumbnailFailed(item)
                    }}
                  />
                  <span style={menuThumbTitlePillStyle}>{item.name}</span>
                  <span style={menuThumbPricePillStyle}>{formatPrice(item.price)}</span>
                  {productCode ? (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={isFavorite ? '상품 찜 해제' : '상품 찜 등록'}
                      aria-pressed={isFavorite}
                      style={
                        isFavoriteLoading
                          ? menuThumbFavoriteButtonLoadingStyle
                          : isFavorite
                            ? menuThumbFavoriteButtonActiveStyle
                            : menuThumbFavoriteButtonStyle
                      }
                      onClick={(event) => {
                        void handleToggleProductFavorite(item, event)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          void handleToggleProductFavorite(item, event)
                        }
                      }}
                    >
                      {isFavorite ? '♥' : '♡'}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <span
                      style={{
                        ...selectedBadgeStyle,
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 1
                      }}
                    >
                      선택됨
                    </span>
                  ) : null}
                </span>
              ) : (
                <>
                  <span>
                    <span style={menuButtonTopStyle}>
                      <h4 style={menuNameStyle}>
                        {item.name}
                      </h4>
                      {isSelected ? (
                        <span style={selectedBadgeStyle}>선택됨</span>
                      ) : null}
                    </span>

                    <p style={menuDescStyle}>
                      {item.description}
                    </p>
                  </span>

                  <span style={priceStyle}>
                    {formatPrice(item.price)}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
  const SelectedMenuUI = (
    <div style={selectedMenuSummaryStyle}>
      <div style={menuNameStyle}>
        {selectedMenu.name}
      </div>

      <div style={menuDescStyle}>
        기본 금액 {formatPrice(selectedMenu.price)}
      </div>
    </div>
  )

  const QuantityUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        2. 수량 선택
      </h3>

      <div style={quantityWrapStyle}>
        <div>
          {SelectedMenuUI}
        </div>

        <div style={quantityControlStyle}>
          <button
            type="button"
            style={quantityButtonStyle}
            onClick={handleDecreaseQuantity}
          >
            -
          </button>

          <div style={quantityNumberStyle}>
            {quantity}
          </div>

          <button
            type="button"
            style={quantityButtonStyle}
            onClick={handleIncreaseQuantity}
          >
            +
          </button>
        </div>
      </div>
    </section>
  )

  const OptionUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        3. 옵션 선택
      </h3>

      <div style={optionListStyle}>
        {(menuOptionItemsByMenuId[selectedMenuId] ?? []).map(item => {
          const checked =
            selectedOptionIds.includes(item.id)
          const optionQuantity =
            selectedOptionQuantities[item.id] ?? 0
          const maxOptionQuantity =
            getOptionMaxQuantity(item)
          const hasQuantityLimitNotice =
            Boolean(item.isQuantityEnabled) &&
            Boolean(item.isQuantityLimitEnabled) &&
            maxOptionQuantity !== null

          return (
            <label
              key={item.id}
              style={optionLabelStyle}
            >
              <span style={optionMainRowStyle}>
                <span style={optionLeftStyle}>
                  <input
                    type="checkbox"
                    checked={checked}
                    style={checkboxStyle}
                    onChange={() => {
                      handleToggleOption(item.id)
                    }}
                  />

                  {item.label}
                </span>

                <span style={optionRightStyle}>
                  <span style={priceStyle}>
                    {item.price > 0
                      ? `+ ${formatPrice(item.price)}`
                      : '기본가'}
                  </span>

                  {checked && item.isQuantityEnabled ? (
                    <span style={optionQuantityControlStyle}>
                      <button
                        type="button"
                        style={optionQuantityButtonStyle}
                        onClick={(event) => {
                          handleDecreaseOptionQuantity(item.id, event)
                        }}
                      >
                        -
                      </button>

                      <span style={optionQuantityNumberStyle}>
                        {Math.max(1, optionQuantity)}
                      </span>

                      <button
                        type="button"
                        style={optionQuantityButtonStyle}
                        disabled={maxOptionQuantity !== null && optionQuantity >= maxOptionQuantity}
                        onClick={(event) => {
                          handleIncreaseOptionQuantity(item.id, event)
                        }}
                      >
                        +
                      </button>
                    </span>
                  ) : null}
                </span>
              </span>

              {hasQuantityLimitNotice ? (
                <span style={optionQuantityLimitNoticeStyle}>
                  최대 {maxOptionQuantity}개까지 선택할 수 있습니다.
                </span>
              ) : null}
            </label>
          )
        })}
      </div>
    </section>
  )

  const DeliveryAddressUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        4. 배송지 정보
      </h3>

      <div style={inputGroupStyle}>
        <input
          type="text"
          value={receiverName}
          style={inputStyle}
          placeholder="수령자 이름"
          onChange={event => {
            setReceiverName(event.target.value)
          }}
        />

        <input
          type="tel"
          value={receiverPhone}
          style={inputStyle}
          placeholder="연락처"
          onChange={event => {
            setReceiverPhone(event.target.value)
          }}
        />

        <button
          type="button"
          style={addressButtonStyle}
          onClick={handleAddressSearch}
        >
          {isLoadingDeliveryAddresses ? '배송지를 불러오는 중...' : '배송지 선택'}
        </button>

        {deliveryAddresses.length > 0 ? (
          <select
            value={selectedDeliveryAddressId}
            style={inputStyle}
            onChange={(event) => {
              const selectedId = event.target.value
              setSelectedDeliveryAddressId(selectedId)
              const selected = deliveryAddresses.find((item) => String(item.id) === selectedId)
              if (selected) {
                applyDeliveryAddress(selected)
              }
            }}
          >
            {deliveryAddresses.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.label} · {item.deliveryAddress}
              </option>
            ))}
          </select>
        ) : null}

        <input
          type="text"
          value={address}
          style={inputStyle}
          placeholder="기본 주소"
          onChange={event => {
            setAddress(event.target.value)
          }}
        />

        <input
          type="text"
          value={detailAddress}
          style={inputStyle}
          placeholder="상세 주소"
          onChange={event => {
            setDetailAddress(event.target.value)
          }}
        />
      </div>

      <p style={descriptionStyle}>
        {deliveryAddressError
          ? deliveryAddressError
          : deliveryAddresses.length > 0
            ? `등록 배송지 ${deliveryAddresses.length}개를 불러왔습니다.`
            : '배송지 선택 버튼을 누르면 DB에 저장된 배송지 목록을 불러옵니다.'}
      </p>
    </section>
  )

  const PaymentUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        5. 결제 방식
      </h3>

      <div style={paymentGridStyle}>
        {DELIVERY_PAYMENT_ITEMS.map(item => {
          const isSelected =
            item.id === paymentId

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              style={
                isSelected
                  ? selectedPaymentButtonStyle
                  : paymentButtonStyle
              }
              onClick={() => {
                setPaymentId(item.id)
              }}
            >
              <h4 style={paymentTitleStyle}>
                {item.label}
              </h4>

              <p style={paymentDescStyle}>
                {item.description}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )

  const MemoUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        6. 배달 요청사항
      </h3>

      <textarea
        value={memo}
        style={memoStyle}
        placeholder="문 앞에 놓아주세요, 벨 누르지 말아주세요"
        onChange={event => {
          setMemo(event.target.value)
        }}
      />
    </section>
  )

  const SummaryUI = (
    <section style={summaryCardStyle}>
      <h3 style={sectionTitleStyle}>
        주문내역
      </h3>

      {orderItems.length > 0 ? (
        <div style={summaryListStyle}>
          {orderItems.map((item) => (
            <article
              key={item.localItemId}
              style={summaryItemCardStyle}
            >
              <div style={summaryRowStyle}>
                <strong>
                  {item.productName}
                </strong>

                <strong>
                  {formatPrice(item.lineTotalAmount)}
                </strong>
              </div>

              <div style={summaryRowStyle}>
                <span>
                  수량
                </span>

                <span>
                  {item.quantity}개 · {formatPrice(item.unitPrice)}
                </span>
              </div>

              <div style={summaryRowStyle}>
                <span>
                  옵션
                </span>

                <span>
                  {item.options.length > 0
                    ? `${item.options.length}개 선택`
                    : '선택 없음'}
                </span>
              </div>

              {item.options.length > 0 ? (
                <div style={summaryOptionListStyle}>
                  {item.options.map((option) => (
                    <span key={option.optionItemId}>
                      {option.isQuantityEnabled
                        ? `- ${option.optionValueName} X ${option.quantity} · +${formatPrice(option.lineOptionAmount)}`
                        : `- ${option.optionValueName} · +${formatPrice(option.lineOptionAmount)}`}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p style={descriptionStyle}>
          선택된 메뉴가 없습니다.
        </p>
      )}

      <div style={totalRowStyle}>
        <span>
          총 금액
        </span>

        <span>
          {formatPrice(totalAmount)}
        </span>
      </div>

      {orderResult ? (
        <div style={noticeStyle}>
          주문 접수 완료: {orderResult.orderCode} / {orderResult.revisionCode}
        </div>
      ) : null}
      {orderSubmitError ? (
        <div style={noticeStyle}>{orderSubmitError}</div>
      ) : null}
    </section>
  )

  const FooterBarUI = (
    <footer
      style={
        embedInModal
          ? {
              ...footerBarViewportStyle,
              ...footerBarModalContainerStyle,
              position: 'sticky',
              left: 'auto',
              right: 'auto',
              bottom: 0,
              zIndex: 1
            }
          : footerBarViewportStyle
      }
    >
      <div
        style={
          embedInModal
            ? (
              isCompactLayout
                ? {
                    ...footerBarInnerModalStyle,
                    alignItems: 'stretch',
                    flexDirection: 'column'
                  }
                : footerBarInnerModalStyle
            )
            : (
              isCompactLayout
                ? {
                    ...footerBarInnerStyle,
                    alignItems: 'stretch',
                    flexDirection: 'column'
                  }
                : footerBarInnerStyle
            )
        }
      >
        <div
          style={
            isCompactLayout
              ? {
                  ...footerBarStyle,
                  alignItems: 'stretch',
                  flexDirection: 'column'
                }
              : footerBarStyle
          }
        >
          <div style={footerTotalStyle}>
            <span style={footerTotalLabelStyle}>
              합계 :
            </span>

            <strong style={footerTotalAmountStyle}>
              {formatPrice(totalAmount)}
            </strong>
          </div>

          <div
            style={
              isCompactLayout
                ? {
                    ...footerActionGroupStyle,
                    alignItems: 'stretch',
                    flexDirection: 'column',
                    width: '100%'
                  }
                : footerActionGroupStyle
            }
          >
            <button
              type="button"
              style={
                isCompactLayout
                  ? {
                      ...footerCartButtonStyle,
                      width: '100%'
                  }
                  : footerCartButtonStyle
              }
              disabled={isCartAdding || orderItems.length === 0}
              onClick={handleAddCartItem}
            >
              {isCartAdding ? '담는 중...' : '장바구니'}
            </button>

            <button
              type="button"
              style={
                isCompactLayout
                  ? {
                      ...footerOrderButtonStyle,
                      width: '100%'
                    }
                  : footerOrderButtonStyle
              }
              disabled={orderItems.length === 0}
              onClick={handleOpenDeliveryModal}
            >
              배달주문등록
            </button>
          </div>
        </div>
      </div>
    </footer>
  )

  const DeliveryModalUI = isDeliveryModalOpen ? (
    <div
      style={modalOverlayStyle}
      role="presentation"
      onClick={handleCloseDeliveryModal}
    >
      <section
        style={modalPanelStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-order-modal-title"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <header style={modalHeaderStyle}>
          <div>
            <h2
              id="delivery-order-modal-title"
              style={modalTitleStyle}
            >
              배달 주문등록
            </h2>

            <p style={modalDescriptionStyle}>
              배송정보, 결제방식, 요청사항을 확인하고 배달 주문을 등록합니다.
            </p>
          </div>

          <button
            type="button"
            style={modalCloseButtonStyle}
            onClick={handleCloseDeliveryModal}
            aria-label="배달 주문등록 모달 닫기"
          >
            ×
          </button>
        </header>

        <div
          style={
            isCompactLayout
              ? {
                  ...modalBodyStyle,
                  gridTemplateColumns: '1fr'
                }
              : modalBodyStyle
          }
        >
          <div style={columnStyle}>
            {DeliveryAddressUI}
          </div>

          <div style={columnStyle}>
            {PaymentUI}

            {MemoUI}
          </div>
        </div>

        <footer
          style={
            isCompactLayout
              ? {
                  ...modalFooterStyle,
                  alignItems: 'stretch',
                  flexDirection: 'column'
                }
              : modalFooterStyle
          }
        >
          <div style={footerTotalStyle}>
            <span style={footerTotalLabelStyle}>
              합계 :
            </span>

            <strong style={footerTotalAmountStyle}>
              {formatPrice(totalAmount)}
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}
          >
            <button
              type="button"
              style={modalCancelButtonStyle}
              onClick={handleCloseDeliveryModal}
            >
              취소
            </button>

            <button
              type="button"
              style={modalSubmitButtonStyle}
              disabled={isSubmittingOrder || orderItems.length === 0}
              onClick={handleSubmitOrder}
            >
              {isSubmittingOrder ? '주문 접수중...' : '배달주문등록'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  ) : null

  // SECTION 11 : RETURN

  return (
    <section
      style={
        embedInModal
          ? {
              ...contentStyle,
              paddingBottom: '10px'
            }
          : contentStyle
      }
    >
      {!embedInModal ? IntroUI : null}
      {categorySidebar}

      <section style={responsiveOrderGridStyle}>
        <section style={columnStyle}>
          {MenuSelectUI}
        </section>

        <section style={columnStyle}>
          {QuantityUI}

          {OptionUI}
        </section>

        <aside style={columnStyle}>
          {SummaryUI}
        </aside>
      </section>

      {FooterBarUI}

      {DeliveryModalUI}

      <BaseModal
        open={isCartNoticeModalOpen}
        type={cartNoticeModalType}
        title="장바구니"
        description={cartNoticeModalMessage}
        onClose={() => {
          setIsCartNoticeModalOpen(false)
        }}
      />
    </section>
  )
}

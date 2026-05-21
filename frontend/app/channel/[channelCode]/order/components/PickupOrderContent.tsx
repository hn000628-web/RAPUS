'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CSSProperties } from 'react'
import {
  createCustomerOrder,
  getCustomerOrderBootstrap,
  type CreateCustomerOrderRequest,
  type CustomerOrderBootstrapResponse,
} from '@/lib/business/pos/customerOrderApi'

type Props = {
  channelCode: string
  activeCategoryKey: string
  categorySidebar?: ReactNode
  embedInModal?: boolean
}

type OrderMenuItem = {
  id: string
  categoryKey: string
  productId: number
  name: string
  description: string
  price: number
  options: OrderOptionItem[]
}

type OrderOptionItem = {
  id: string
  optionId: number
  optionValueId: number
  label: string
  price: number
}

type PickupTimeItem = {
  id: string
  label: string
  description: string
}

type PickupPaymentMethodItem = {
  id: 'ONLINE_PREPAID' | 'ON_SITE_PAYMENT'
  title: string
  description: string
}

const MOCK_MENU_ITEMS: OrderMenuItem[] = []

const PICKUP_TIME_ITEMS: PickupTimeItem[] = [
  {
    id: 'asap',
    label: '가능한 빨리',
    description: '매장 준비 완료 후 바로 수령합니다.'
  },
  {
    id: '10min',
    label: '10분 후',
    description: '약 10분 뒤 매장에서 수령합니다.'
  },
  {
    id: '20min',
    label: '20분 후',
    description: '약 20분 뒤 매장에서 수령합니다.'
  },
  {
    id: '30min',
    label: '30분 후',
    description: '약 30분 뒤 매장에서 수령합니다.'
  }
]

const PICKUP_PAYMENT_METHOD_ITEMS: PickupPaymentMethodItem[] = [
  {
    id: 'ONLINE_PREPAID',
    title: '선결제(온라인)',
    description: '주문 시 온라인으로 결제합니다.'
  },
  {
    id: 'ON_SITE_PAYMENT',
    title: '현장결제',
    description: '픽업 수령 시 매장에서 결제합니다.'
  }
]

const EMPTY_MENU_ITEM: OrderMenuItem = {
  id: 'empty',
  categoryKey: 'ALL',
  productId: -1,
  name: '메뉴 없음',
  description: '선택 가능한 메뉴가 없습니다.',
  price: 0,
  options: []
}

const contentStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  paddingBottom: '118px',
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
  alignItems: 'start',
  gap: '10px'
}

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  minWidth: 0
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
  padding: '8px'
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
  borderColor: '#111827',
  backgroundColor: '#ffffff',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)'
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
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  minHeight: '52px',
  padding: '12px',
  borderRadius: '16px',
  border: '1px solid #dbe2ea',
  backgroundColor: '#ffffff',
  cursor: 'pointer'
}

const optionLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '14px',
  fontWeight: 800,
  color: '#111827'
}

const checkboxStyle: CSSProperties = {
  width: '18px',
  height: '18px'
}

const pickupTimeGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px'
}

const pickupTimeButtonStyle: CSSProperties = {
  minHeight: '86px',
  padding: '14px',
  border: '1px solid #dbe2ea',
  borderRadius: '16px',
  backgroundColor: '#ffffff',
  textAlign: 'left',
  cursor: 'pointer'
}

const selectedPickupTimeButtonStyle: CSSProperties = {
  ...pickupTimeButtonStyle,
  borderColor: '#111827',
  backgroundColor: '#f8fafc',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)'
}

const pickupTimeTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 900,
  color: '#111827'
}

const pickupTimeDescStyle: CSSProperties = {
  margin: '7px 0 0',
  fontSize: '12px',
  lineHeight: 1.45,
  color: '#6b7280'
}

const paymentMethodGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px'
}

const paymentMethodCardStyle: CSSProperties = {
  minHeight: '92px',
  padding: '14px',
  border: '1px solid #dbe2ea',
  borderRadius: '16px',
  backgroundColor: '#ffffff',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const paymentMethodCardSelectedStyle: CSSProperties = {
  ...paymentMethodCardStyle,
  borderWidth: '2px',
  borderColor: '#0f172a',
  backgroundColor: '#f8fafc',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)'
}

const paymentMethodTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 900,
  color: '#111827'
}

const paymentMethodDescStyle: CSSProperties = {
  margin: 0,
  fontSize: '12px',
  lineHeight: 1.45,
  color: '#6b7280'
}

const inputGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
}

const inputStyle: CSSProperties = {
  width: '100%',
  height: '46px',
  padding: '0 14px',
  border: '1px solid #dbe2ea',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: 800,
  color: '#111827',
  outline: 'none'
}

const memoStyle: CSSProperties = {
  width: '100%',
  minHeight: '82px',
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

const orderButtonStyle: CSSProperties = {
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

const noticeStyle: CSSProperties = {
  marginTop: '10px',
  fontSize: '12px',
  lineHeight: 1.5,
  color: '#9ca3af',
  textAlign: 'center'
}

const footerBarStyle: CSSProperties = {
  width: '100%',
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

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  backgroundColor: 'rgba(15, 23, 42, 0.45)',
  overflowY: 'auto',
  boxSizing: 'border-box'
}

const modalPanelStyle: CSSProperties = {
  width: 'min(100%, 760px)',
  maxHeight: 'min(86vh, 820px)',
  borderRadius: '22px',
  backgroundColor: '#ffffff',
  border: '1px solid #dbe2ea',
  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}

const modalHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  padding: '16px 18px',
  borderBottom: '1px solid #e5e7eb'
}

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 900,
  color: '#0f172a'
}

const modalCloseButtonStyle: CSSProperties = {
  minWidth: '48px',
  height: '34px',
  padding: '0 12px',
  border: '1px solid #dbe2ea',
  borderRadius: '999px',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  fontSize: '13px',
  fontWeight: 800,
  whiteSpace: 'nowrap',
  cursor: 'pointer'
}

const modalBodyStyle: CSSProperties = {
  padding: '16px',
  overflowY: 'auto'
}

const pickupModalGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: '12px',
  alignItems: 'start'
}

const pickupModalColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  minWidth: 0
}

const modalFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
  padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
  borderTop: '1px solid #e5e7eb',
  backgroundColor: '#ffffff'
}

const modalSecondaryButtonStyle: CSSProperties = {
  minWidth: '96px',
  height: '40px',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer'
}

const modalPrimaryButtonStyle: CSSProperties = {
  minWidth: '130px',
  height: '40px',
  border: 'none',
  borderRadius: '10px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 900,
  cursor: 'pointer'
}

function formatPrice(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

export default function PickupOrderContent({
  channelCode,
  activeCategoryKey,
  categorySidebar,
  embedInModal = false
}: Props) {
  const [isLoadingMenus, setIsLoadingMenus] = useState<boolean>(false)
  const [menuError, setMenuError] = useState<string | null>(null)
  const [orderSubmitError, setOrderSubmitError] = useState<string | null>(null)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false)
  const [bootstrapData, setBootstrapData] = useState<CustomerOrderBootstrapResponse | null>(null)
  const [orderResult, setOrderResult] = useState<{ orderCode: string, revisionCode: string } | null>(null)
  const [menuItems, setMenuItems] = useState<OrderMenuItem[]>(MOCK_MENU_ITEMS)

  const [selectedMenuId, setSelectedMenuId] = useState<string>(MOCK_MENU_ITEMS[0]?.id || '')
  const [quantity, setQuantity] = useState<number>(1)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [pickupTimeId, setPickupTimeId] = useState<string>(PICKUP_TIME_ITEMS[0]?.id || '')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [pickupExpectedAt, setPickupExpectedAt] = useState<string>('')
  const [memo, setMemo] = useState<string>('')
  const [isCompactLayout, setIsCompactLayout] = useState<boolean>(false)
  const [isPickupModalOpen, setIsPickupModalOpen] = useState<boolean>(false)
  const [pickupPaymentMethodId, setPickupPaymentMethodId] = useState<'ONLINE_PREPAID' | 'ON_SITE_PAYMENT'>('ON_SITE_PAYMENT')

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
        setMenuItems([])
        setBootstrapData(null)
        return
      }

      setIsLoadingMenus(true)
      setMenuError(null)

      try {
        const response = await getCustomerOrderBootstrap({
          providerChannelCode: channelCode,
          orderFlowType: 'PICKUP',
        })

        if (cancelled) {
          return
        }

        setBootstrapData(response)

        const mappedItems: OrderMenuItem[] = response.products.map((product) => {
          const categoryKey = response.categories.find((category) => category.id === product.categoryId)?.categoryCode
            ?? 'UNCATEGORIZED'
          return {
            id: String(product.id),
            productId: product.id,
            categoryKey,
            name: product.productName,
            description: product.productDescription ?? '',
            price: product.basePrice,
            options: product.options.flatMap((option) =>
              option.values.map((value) => ({
                id: `${option.id}:${value.id}`,
                optionId: option.id,
                optionValueId: value.id,
                label: option.optionName.trim() === value.optionValueName.trim()
                  ? option.optionName
                  : `${option.optionName} - ${value.optionValueName}`,
                price: value.priceDelta,
              }))
            ),
          }
        })

        setMenuItems(mappedItems)
      } catch (error) {
        if (cancelled) {
          return
        }
        setMenuItems([])
        setBootstrapData(null)
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

    const hasCurrent = visibleProducts.some((item) => item.id === selectedMenuId)

    if (!hasCurrent) {
      setSelectedMenuId(visibleProducts[0].id)
      setQuantity(1)
      setSelectedOptionIds([])
    }
  }, [selectedMenuId, visibleProducts])

  const selectedMenu = useMemo(() => {
    return menuItems.find((item) => item.id === selectedMenuId) || EMPTY_MENU_ITEM
  }, [selectedMenuId, menuItems])

  const selectedOptions = useMemo(() => {
    return selectedMenu.options.filter((item) => selectedOptionIds.includes(item.id))
  }, [selectedOptionIds, selectedMenu.options])

  const selectedPickupTime = useMemo(() => {
    return PICKUP_TIME_ITEMS.find((item) => item.id === pickupTimeId) || PICKUP_TIME_ITEMS[0]
  }, [pickupTimeId])

  const selectedPickupPaymentMethod = useMemo(() => {
    return PICKUP_PAYMENT_METHOD_ITEMS.find((item) => item.id === pickupPaymentMethodId) || PICKUP_PAYMENT_METHOD_ITEMS[1]
  }, [pickupPaymentMethodId])

  const optionTotal = useMemo(() => {
    return selectedOptions.reduce((sum, item) => sum + item.price, 0)
  }, [selectedOptions])

  const itemUnitTotal = useMemo(() => {
    return selectedMenu.price + optionTotal
  }, [selectedMenu.price, optionTotal])

  const totalAmount = useMemo(() => {
    return itemUnitTotal * quantity
  }, [itemUnitTotal, quantity])

  const responsiveOrderGridStyle = useMemo<CSSProperties>(() => {
    if (isCompactLayout) {
      return {
        ...orderGridStyle,
        gridTemplateColumns: '1fr'
      }
    }

    return orderGridStyle
  }, [isCompactLayout])

  function handleSelectMenu(menuId: string) {
    setSelectedMenuId(menuId)
    setQuantity(1)
    setSelectedOptionIds([])
  }

  function handleDecreaseQuantity() {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  function handleIncreaseQuantity() {
    setQuantity((prev) => prev + 1)
  }

  function handleToggleOption(optionId: string) {
    setSelectedOptionIds((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId)
      }

      return [...prev, optionId]
    })
  }

  async function handleSubmitOrder() {
    if (isSubmittingOrder) {
      return
    }

    if (!channelCode) {
      setOrderSubmitError('채널 정보를 확인하지 못했습니다.')
      return
    }

    if (!selectedMenu || selectedMenu.productId < 1) {
      setOrderSubmitError('주문할 메뉴를 선택해 주세요.')
      return
    }

    setIsSubmittingOrder(true)
    setOrderSubmitError(null)

    const payload: CreateCustomerOrderRequest = {
      providerChannelCode: channelCode,
      orderSource: 'ONLINE',
      orderFlowType: 'PICKUP',
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      memo: memo.trim() || undefined,
      fulfillment: {
        pickupExpectedAt: pickupExpectedAt.trim() || selectedPickupTime?.label || undefined,
        customerRequestMemo: memo.trim() || undefined,
      },
      items: [
        {
          posProductId: selectedMenu.productId,
          quantity,
          options: selectedOptions.map((option) => ({
            productOptionId: option.optionId,
            productOptionValueId: option.optionValueId,
            quantity: 1,
          })),
        },
      ],
    }

    try {
      const response = await createCustomerOrder(payload)
      setOrderResult({
        orderCode: response.order.orderCode,
        revisionCode: response.order.revisionCode,
      })
      setIsPickupModalOpen(false)
    } catch (error) {
      setOrderSubmitError(
        error instanceof Error && error.message
          ? `주문을 접수하지 못했습니다. (${error.message})`
          : '주문을 접수하지 못했습니다.'
      )
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  function handleOpenPickupModal() {
    setIsPickupModalOpen(true)
  }

  function handleClosePickupModal() {
    setIsPickupModalOpen(false)
  }

  const IntroUI = (
    <section style={introCardStyle}>
      <h2 style={titleStyle}>픽업 주문</h2>
      <p style={descriptionStyle}>
        고객이 주문 후 매장에서 직접 수령하는 주문 화면입니다.
        메뉴 선택, 수량, 옵션, 픽업 예정 시간을 입력합니다.
      </p>
    </section>
  )

  const MenuSelectUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>1. 메뉴 선택</h3>
      {isLoadingMenus ? (
        <p style={descriptionStyle}>메뉴 정보를 불러오는 중입니다.</p>
      ) : null}
      {menuError ? (
        <p style={descriptionStyle}>{menuError}</p>
      ) : null}
      <div style={menuGridStyle}>
        {visibleProducts.map((item) => {
          const isSelected = item.id === selectedMenuId

          return (
            <button
              key={item.id}
              type="button"
              style={isSelected ? selectedMenuButtonStyle : menuButtonStyle}
              onClick={() => {
                handleSelectMenu(item.id)
              }}
            >
              <span>
                <h4 style={menuNameStyle}>{item.name}</h4>
                <p style={menuDescStyle}>{item.description}</p>
              </span>
              <span style={priceStyle}>{formatPrice(item.price)}</span>
            </button>
          )
        })}
      </div>
    </section>
  )

  const SelectedMenuUI = (
    <div style={selectedMenuSummaryStyle}>
      <div style={menuNameStyle}>{selectedMenu.name}</div>
      <div style={menuDescStyle}>기본 금액 {formatPrice(selectedMenu.price)}</div>
    </div>
  )

  const QuantityUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>2. 수량 선택</h3>
      <div style={quantityWrapStyle}>
        <div>{SelectedMenuUI}</div>
        <div style={quantityControlStyle}>
          <button type="button" style={quantityButtonStyle} onClick={handleDecreaseQuantity}>
            -
          </button>
          <div style={quantityNumberStyle}>{quantity}</div>
          <button type="button" style={quantityButtonStyle} onClick={handleIncreaseQuantity}>
            +
          </button>
        </div>
      </div>
    </section>
  )

  const OptionUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>3. 옵션 선택</h3>
      <div style={optionListStyle}>
        {selectedMenu.options.map((item) => {
          const checked = selectedOptionIds.includes(item.id)

          return (
            <label key={item.id} style={optionLabelStyle}>
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
              <span style={priceStyle}>{item.price > 0 ? `+ ${formatPrice(item.price)}` : '기본가'}</span>
            </label>
          )
        })}
      </div>
    </section>
  )

  const PickupInfoLeftUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>픽업 정보</h3>
      <p style={descriptionStyle}>주문 수령에 필요한 정보를 입력해 주세요.</p>

      <div style={inputGroupStyle}>
        <input
          type="text"
          value={customerName}
          style={inputStyle}
          placeholder="고객명을 입력하세요"
          onChange={(event) => {
            setCustomerName(event.target.value)
          }}
        />

        <input
          type="tel"
          value={customerPhone}
          style={inputStyle}
          placeholder="연락처를 입력하세요"
          onChange={(event) => {
            setCustomerPhone(event.target.value)
          }}
        />

        <input
          type="datetime-local"
          value={pickupExpectedAt}
          style={inputStyle}
          placeholder="픽업 예정시간 선택"
          onChange={(event) => {
            setPickupExpectedAt(event.target.value)
          }}
        />
      </div>

      <div style={pickupTimeGridStyle}>
        {PICKUP_TIME_ITEMS.map((item) => {
          const isSelected = item.id === pickupTimeId

          return (
            <button
              key={item.id}
              type="button"
              style={isSelected ? selectedPickupTimeButtonStyle : pickupTimeButtonStyle}
              onClick={() => {
                setPickupTimeId(item.id)
                setPickupExpectedAt(item.label)
              }}
            >
              <h4 style={pickupTimeTitleStyle}>{item.label}</h4>
              <p style={pickupTimeDescStyle}>{item.description}</p>
            </button>
          )
        })}
      </div>

    </section>
  )

  const PickupInfoRightUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>결제 방식</h3>
      <div style={paymentMethodGridStyle}>
        {PICKUP_PAYMENT_METHOD_ITEMS.map((item) => {
          const isSelected = item.id === pickupPaymentMethodId

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              style={isSelected ? paymentMethodCardSelectedStyle : paymentMethodCardStyle}
              onClick={() => {
                setPickupPaymentMethodId(item.id)
              }}
            >
              <h4 style={paymentMethodTitleStyle}>{item.title}</h4>
              <p style={paymentMethodDescStyle}>{item.description}</p>
            </button>
          )
        })}
      </div>

      <div style={{ height: '2px' }} />

      <h3 style={sectionTitleStyle}>픽업 요청사항</h3>
      <textarea
        value={memo}
        style={memoStyle}
        placeholder="요청사항을 입력하세요"
        onChange={(event) => {
          setMemo(event.target.value)
        }}
      />
    </section>
  )

  const SummaryUI = (
    <section style={summaryCardStyle}>
      <h3 style={sectionTitleStyle}>픽업 주문 확인</h3>

      <div style={summaryRowStyle}>
        <span>채널 코드</span>
        <strong>{channelCode || '-'}</strong>
      </div>

      <div style={summaryRowStyle}>
        <span>메뉴</span>
        <strong>{selectedMenu.name}</strong>
      </div>

      <div style={summaryRowStyle}>
        <span>수량</span>
        <strong>{quantity}개</strong>
      </div>

      <div style={summaryRowStyle}>
        <span>옵션</span>
        <strong>{selectedOptions.length > 0 ? `${selectedOptions.length}개 선택` : '선택 없음'}</strong>
      </div>

      <div style={summaryRowStyle}>
        <span>고객명</span>
        <strong>{customerName.trim() || '미입력'}</strong>
      </div>

      <div style={summaryRowStyle}>
        <span>연락처</span>
        <strong>{customerPhone.trim() || '미입력'}</strong>
      </div>

      <div style={summaryRowStyle}>
        <span>픽업 예정시간</span>
        <strong>{pickupExpectedAt.trim() || selectedPickupTime?.label || '-'}</strong>
      </div>

      <div style={summaryRowStyle}>
        <span>결제 방식</span>
        <strong>{selectedPickupPaymentMethod.title}</strong>
      </div>

      <div style={totalRowStyle}>
        <span>총 금액</span>
        <span>{formatPrice(totalAmount)}</span>
      </div>

      <div style={noticeStyle}>현재는 UI 목업 단계입니다. 실제 주문 저장/결제는 연결되어 있지 않습니다.</div>
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
          isCompactLayout
            ? {
                ...footerBarInnerStyle,
                alignItems: 'stretch',
                flexDirection: 'column'
              }
            : footerBarInnerStyle
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
            <span style={footerTotalLabelStyle}>합계 :</span>
            <strong style={footerTotalAmountStyle}>{formatPrice(totalAmount)}</strong>
          </div>

          <button
            type="button"
            style={
              isCompactLayout
                ? {
                    ...orderButtonStyle,
                    width: '100%'
                  }
                : orderButtonStyle
            }
            onClick={handleOpenPickupModal}
          >
            픽업 주문하기
          </button>
        </div>
      </div>
    </footer>
  )

  return (
    <section
      style={
        embedInModal
          ? {
              ...contentStyle,
              paddingBottom: '12px'
            }
          : contentStyle
      }
    >
      {IntroUI}
      {categorySidebar}

      <section style={responsiveOrderGridStyle}>
        <section style={columnStyle}>{MenuSelectUI}</section>

        <section style={columnStyle}>
          {QuantityUI}
          {OptionUI}
        </section>

        <aside style={columnStyle}>
          {SummaryUI}
        </aside>
      </section>

      {FooterBarUI}

      {isPickupModalOpen ? (
        <div style={modalOverlayStyle}>
          <section style={modalPanelStyle}>
            <header style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>픽업 주문하기</h3>
              <button type="button" style={modalCloseButtonStyle} onClick={handleClosePickupModal}>
                닫기
              </button>
            </header>

            <div style={modalBodyStyle}>
              <div
                style={
                  isCompactLayout
                    ? {
                        ...pickupModalGridStyle,
                        gridTemplateColumns: '1fr'
                      }
                    : pickupModalGridStyle
                }
              >
                <section style={pickupModalColumnStyle}>{PickupInfoLeftUI}</section>
                <section style={pickupModalColumnStyle}>{PickupInfoRightUI}</section>
              </div>
            </div>

            <footer style={modalFooterStyle}>
              <button type="button" style={modalSecondaryButtonStyle} onClick={handleClosePickupModal}>
                취소
              </button>
              <button type="button" style={modalPrimaryButtonStyle} onClick={handleSubmitOrder} disabled={isSubmittingOrder}>
                {isSubmittingOrder ? '주문 접수중...' : '픽업 주문하기'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  )
}

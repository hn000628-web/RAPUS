// FILE : frontend/app/channel/[channelCode]/components/MenuBar/channelOrder.tsx
// ROOT : frontend/app/channel/[channelCode]/components/MenuBar/channelOrder.tsx
// STATUS : MODIFY
// ROLE : CHANNEL ORDER ENTRY + MODAL ORDER FLOW

'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'

import { getCustomerOrderBootstrap } from '@/lib/business/pos/customerOrderApi'
import DeliveryOrderContent from '../../order/components/DeliveryOrderContent'
import OrderSidebar from '../../order/components/OrderSidebar'
import PickupOrderContent from '../../order/components/PickupOrderContent'

type Props = {
  channelCode: string
  autoOpenOrder?: boolean
}

type OrderFlowType = 'PICKUP' | 'DELIVERY'
type OrderFormModalType = 'pickup' | 'delivery' | null

type OrderCategory = {
  key: string
  label: string
}

const DEFAULT_ORDER_CATEGORIES: OrderCategory[] = []

const sectionStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column'
}

const orderCardStyle: CSSProperties = {
  width: '100%',
  padding: '24px',
  borderRadius: '18px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
  boxSizing: 'border-box'
}

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px'
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 800,
  color: '#111827',
  letterSpacing: '-0.02em'
}

const descriptionStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: '14px',
  lineHeight: 1.65,
  color: '#4b5563'
}

const buttonWrapStyle: CSSProperties = {
  marginTop: '22px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap'
}

const orderButtonStyle: CSSProperties = {
  flex: '1 1 180px',
  minWidth: 0,
  height: '48px',
  border: 'none',
  borderRadius: '14px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 800,
  cursor: 'pointer',
  textAlign: 'center'
}

const reservationOrderButtonStyle: CSSProperties = {
  ...orderButtonStyle,
  backgroundColor: '#1f2937'
}

const closeButtonStyle: CSSProperties = {
  height: '40px',
  padding: '0 14px',
  border: '1px solid #d1d5db',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer'
}

const noticeStyle: CSSProperties = {
  marginTop: '12px',
  fontSize: '12px',
  lineHeight: 1.5,
  color: '#9ca3af',
  textAlign: 'center'
}

const orderTypeModalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: 'rgba(15, 23, 42, 0.45)',
  zIndex: 1000,
  boxSizing: 'border-box'
}

const orderTypeModalPanelStyle: CSSProperties = {
  width: 'min(100%, 480px)',
  background: '#fff',
  borderRadius: '24px',
  border: '1px solid #dbe2ea',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.22)',
  padding: '22px',
  boxSizing: 'border-box'
}

const orderFormOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: 'rgba(15, 23, 42, 0.52)',
  zIndex: 1100,
  boxSizing: 'border-box'
}

const orderFormPanelStyle: CSSProperties = {
  width: 'min(1180px, calc(100vw - 32px))',
  maxHeight: 'calc(100vh - 48px)',
  borderRadius: '24px',
  border: '1px solid #dbe2ea',
  background: '#ffffff',
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.3)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}

const orderFormHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '18px 20px',
  borderBottom: '1px solid #e5e7eb',
  background: '#ffffff'
}

const orderFormBodyStyle: CSSProperties = {
  minHeight: 0,
  flex: '1 1 auto',
  overflowY: 'auto',
  padding: '16px',
  boxSizing: 'border-box',
  background: '#f8fafc'
}

export default function ChannelOrder({ channelCode, autoOpenOrder = false }: Props) {
  const router = useRouter()
  const autoOpenedRef = useRef(false)

  const [isOrderTypeModalOpen, setIsOrderTypeModalOpen] = useState(false)
  const [hoveredOrderType, setHoveredOrderType] = useState<'PICKUP' | 'DELIVERY' | null>(null)
  const [orderFormModalType, setOrderFormModalType] = useState<OrderFormModalType>(null)

  const [pickupCategories, setPickupCategories] = useState<OrderCategory[]>(DEFAULT_ORDER_CATEGORIES)
  const [deliveryCategories, setDeliveryCategories] = useState<OrderCategory[]>(DEFAULT_ORDER_CATEGORIES)
  const [pickupActiveCategoryKey, setPickupActiveCategoryKey] = useState('')
  const [deliveryActiveCategoryKey, setDeliveryActiveCategoryKey] = useState('')

  useEffect(() => {
    if (!autoOpenOrder || autoOpenedRef.current) {
      return
    }

    autoOpenedRef.current = true
    setIsOrderTypeModalOpen(true)
  }, [autoOpenOrder])

  async function loadOrderCategories(flowType: OrderFlowType) {
    const safeChannelCode = String(channelCode || '').trim()
    if (!safeChannelCode) {
      return
    }

    try {
      const response = await getCustomerOrderBootstrap({
        providerChannelCode: safeChannelCode,
        orderFlowType: flowType
      })

      const nextCategories: OrderCategory[] = response.categories.map((category) => ({
        key: category.categoryCode,
        label: category.categoryName
      }))

      if (flowType === 'PICKUP') {
        setPickupCategories(nextCategories)
        setPickupActiveCategoryKey((prev) => {
          const exists = nextCategories.some((category) => category.key === prev)
          return exists ? prev : (nextCategories[0]?.key || '')
        })
        return
      }

      setDeliveryCategories(nextCategories)
      setDeliveryActiveCategoryKey((prev) => {
        const exists = nextCategories.some((category) => category.key === prev)
        return exists ? prev : (nextCategories[0]?.key || '')
      })
    } catch {
      if (flowType === 'PICKUP') {
        setPickupCategories(DEFAULT_ORDER_CATEGORIES)
        setPickupActiveCategoryKey('')
        return
      }
      setDeliveryCategories(DEFAULT_ORDER_CATEGORIES)
      setDeliveryActiveCategoryKey('')
    }
  }

  function handleGeneralOrderClick() {
    setIsOrderTypeModalOpen(true)
  }

  function handleReservationOrderClick() {
    const safeChannelCode = String(channelCode || '').trim()
    if (!safeChannelCode) {
      return
    }
    router.push(`/channel/${safeChannelCode}/reservation`)
  }

  function handleCloseOrderTypeModal() {
    setIsOrderTypeModalOpen(false)
  }

  function handleCloseOrderFormModal() {
    setOrderFormModalType(null)
  }

  function handleSelectPickupOrder() {
    setIsOrderTypeModalOpen(false)
    setOrderFormModalType('pickup')
    void loadOrderCategories('PICKUP')
  }

  function handleSelectDeliveryOrder() {
    setIsOrderTypeModalOpen(false)
    setOrderFormModalType('delivery')
    void loadOrderCategories('DELIVERY')
  }

  const pickupSidebar = useMemo(() => {
    return (
      <OrderSidebar
        channelCode={channelCode}
        mode="MENU_CATEGORY"
        categories={pickupCategories}
        activeCategoryKey={pickupActiveCategoryKey}
        onChangeCategory={setPickupActiveCategoryKey}
      />
    )
  }, [channelCode, pickupActiveCategoryKey, pickupCategories])

  const deliverySidebar = useMemo(() => {
    return (
      <OrderSidebar
        channelCode={channelCode}
        mode="MENU_CATEGORY"
        categories={deliveryCategories}
        activeCategoryKey={deliveryActiveCategoryKey}
        onChangeCategory={setDeliveryActiveCategoryKey}
      />
    )
  }, [channelCode, deliveryActiveCategoryKey, deliveryCategories])

  return (
    <section style={sectionStyle} data-channel-code={channelCode}>
      <div style={orderCardStyle}>
        <div style={headerRowStyle}>
          <h2 style={titleStyle}>오더</h2>
        </div>

        <p style={descriptionStyle}>
          일반주문을 선택하면 픽업주문 또는 배달주문 방식으로 진행할 수 있습니다.
        </p>

        <div style={buttonWrapStyle}>
          <button type="button" style={orderButtonStyle} onClick={handleGeneralOrderClick}>
            일반주문
          </button>

          <button type="button" style={reservationOrderButtonStyle} onClick={handleReservationOrderClick}>
            예약주문
          </button>
        </div>

        <div style={noticeStyle}>
          일반주문은 즉시 주문, 예약주문은 일정 기반 주문으로 진행됩니다.
        </div>
      </div>

      {isOrderTypeModalOpen ? (
        <div style={orderTypeModalOverlayStyle} onClick={handleCloseOrderTypeModal}>
          <section
            style={orderTypeModalPanelStyle}
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#111827'
                }}
              >
                주문유형
              </h3>
              <button type="button" style={closeButtonStyle} onClick={handleCloseOrderTypeModal}>
                닫기
              </button>
            </div>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#64748b'
              }}
            >
              주문 방식을 선택해 주세요.
            </p>

            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                style={{
                  width: 'min(100%, 200px)',
                  minHeight: '64px',
                  borderRadius: '14px',
                  border: hoveredOrderType === 'PICKUP' ? '1px solid #0f172a' : '1px solid #dbe3ef',
                  background: hoveredOrderType === 'PICKUP' ? '#0f172a' : '#ffffff',
                  color: hoveredOrderType === 'PICKUP' ? '#ffffff' : '#0f172a',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 120ms ease'
                }}
                onMouseEnter={() => {
                  setHoveredOrderType('PICKUP')
                }}
                onMouseLeave={() => {
                  setHoveredOrderType(null)
                }}
                onFocus={() => {
                  setHoveredOrderType('PICKUP')
                }}
                onBlur={() => {
                  setHoveredOrderType(null)
                }}
                onClick={handleSelectPickupOrder}
              >
                픽업주문
              </button>

              <button
                type="button"
                style={{
                  width: 'min(100%, 200px)',
                  minHeight: '64px',
                  borderRadius: '14px',
                  border: hoveredOrderType === 'DELIVERY' ? '1px solid #0f172a' : '1px solid #dbe3ef',
                  background: hoveredOrderType === 'DELIVERY' ? '#0f172a' : '#ffffff',
                  color: hoveredOrderType === 'DELIVERY' ? '#ffffff' : '#0f172a',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 120ms ease'
                }}
                onMouseEnter={() => {
                  setHoveredOrderType('DELIVERY')
                }}
                onMouseLeave={() => {
                  setHoveredOrderType(null)
                }}
                onFocus={() => {
                  setHoveredOrderType('DELIVERY')
                }}
                onBlur={() => {
                  setHoveredOrderType(null)
                }}
                onClick={handleSelectDeliveryOrder}
              >
                배달주문
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {orderFormModalType ? (
        <div style={orderFormOverlayStyle} onClick={handleCloseOrderFormModal}>
          <section
            style={orderFormPanelStyle}
            role="dialog"
            aria-modal="true"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <header style={orderFormHeaderStyle}>
              <h3
                style={{
                  margin: 0,
                  color: '#111827',
                  fontSize: '24px',
                  fontWeight: 900
                }}
              >
                {orderFormModalType === 'pickup' ? '픽업 주문' : '배달 주문'}
              </h3>
              <button type="button" style={closeButtonStyle} onClick={handleCloseOrderFormModal}>
                닫기
              </button>
            </header>

            <div style={orderFormBodyStyle}>
              {orderFormModalType === 'pickup' ? (
                <PickupOrderContent
                  channelCode={channelCode}
                  activeCategoryKey={pickupActiveCategoryKey}
                  categorySidebar={pickupSidebar}
                  embedInModal
                />
              ) : (
                <DeliveryOrderContent
                  channelCode={channelCode}
                  activeCategoryKey={deliveryActiveCategoryKey}
                  categorySidebar={deliverySidebar}
                  embedInModal
                />
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

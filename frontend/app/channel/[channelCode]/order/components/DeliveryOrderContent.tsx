// FILE : frontend/app/channel/[channelCode]/order/components/DeliveryOrderContent.tsx
// ROOT : frontend/app/channel/[channelCode]/order/components/DeliveryOrderContent.tsx
// STATUS : CREATE MODE
// ROLE : PUBLIC BUSINESS CHANNEL DELIVERY ORDER CONTENT COMPONENT
// CHANGE SUMMARY :
// - 배달 주문 전용 UI 본체 신규 생성
// - 메뉴 선택 / 수량 선택 / 옵션 선택 / 배송지 / 연락처 / 배달 요청사항 / 주문 확인 UI 구성
// - 태블릿 기준 2컬럼 주문 입력 구조 적용
// - 모바일에서는 1컬럼으로 대응 가능한 grid 구조 적용
// - 현재 단계는 UI only 목업 구조
// - API 호출 / DB 접근 / 로그인 주소 조회 / 주문 생성 / 결제 연결 없음

'use client'

// SECTION 01 : IMPORT

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState
} from 'react'

import type {
  CSSProperties
} from 'react'

// SECTION 02 : TYPE

type Props = {
  channelCode: string
  activeCategoryKey: string
  categorySidebar?: ReactNode
}

type OrderMenuItem = {
  id: string
  categoryKey: string
  name: string
  description: string
  price: number
}

type OrderOptionItem = {
  id: string
  label: string
  price: number
}

type DeliveryPaymentItem = {
  id: string
  label: string
  description: string
}

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

const DELIVERY_FEE =
  3000

// SECTION 04 : STYLE

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
  border: '1px solid #dbe2ea',
  borderRadius: '16px',
  backgroundColor: '#ffffff',
  textAlign: 'left',
  cursor: 'pointer'
}

const selectedPaymentButtonStyle: CSSProperties = {
  ...paymentButtonStyle,
  borderColor: '#111827',
  backgroundColor: '#f8fafc',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)'
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

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 120,
  padding: '18px',
  backgroundColor: 'rgba(15, 23, 42, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box'
}

const modalPanelStyle: CSSProperties = {
  width: 'min(920px, calc(100vw - 36px))',
  maxHeight: 'calc(100vh - 56px)',
  overflowY: 'auto',
  border: '1px solid #dbe2ea',
  borderRadius: '24px',
  backgroundColor: '#ffffff',
  boxShadow: '0 28px 70px rgba(15, 23, 42, 0.28)',
  padding: '18px',
  boxSizing: 'border-box'
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

// SECTION 06 : COMPONENT

export default function DeliveryOrderContent({
  channelCode,
  activeCategoryKey,
  categorySidebar
}: Props) {
  // SECTION 07 : STATE

  const [selectedMenuId, setSelectedMenuId] =
    useState<string>(MOCK_MENU_ITEMS[0]?.id || '')

  const [quantity, setQuantity] =
    useState<number>(1)

  const [selectedOptionIds, setSelectedOptionIds] =
    useState<string[]>([])

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

  const selectedMenu = useMemo(() => {
    return MOCK_MENU_ITEMS.find(item => {
      return item.id === selectedMenuId
    }) || EMPTY_MENU_ITEM
  }, [
    selectedMenuId
  ])

  const visibleProducts = useMemo(() => {
    return MOCK_MENU_ITEMS.filter((item) => {
      return item.categoryKey === activeCategoryKey
    })
  }, [activeCategoryKey])

  useEffect(() => {
    if (visibleProducts.length === 0) {
      setSelectedMenuId(EMPTY_MENU_ITEM.id)
      return
    }

    const currentVisible = visibleProducts.some((item) => item.id === selectedMenuId)

    if (!currentVisible) {
      setSelectedMenuId(visibleProducts[0].id)
      setQuantity(1)
      setSelectedOptionIds([])
    }
  }, [selectedMenuId, visibleProducts])

  const selectedOptions = useMemo(() => {
    return MOCK_OPTION_ITEMS.filter(item => {
      return selectedOptionIds.includes(item.id)
    })
  }, [
    selectedOptionIds
  ])

  const selectedPayment = useMemo(() => {
    return DELIVERY_PAYMENT_ITEMS.find(item => {
      return item.id === paymentId
    }) || DELIVERY_PAYMENT_ITEMS[0]
  }, [
    paymentId
  ])

  const optionTotal = useMemo(() => {
    return selectedOptions.reduce((sum, item) => {
      return sum + item.price
    }, 0)
  }, [
    selectedOptions
  ])

  const itemUnitTotal = useMemo(() => {
    return selectedMenu.price + optionTotal
  }, [
    selectedMenu.price,
    optionTotal
  ])

  const menuTotalAmount = useMemo(() => {
    return itemUnitTotal * quantity
  }, [
    itemUnitTotal,
    quantity
  ])

  const totalAmount = useMemo(() => {
    return menuTotalAmount + DELIVERY_FEE
  }, [
    menuTotalAmount
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
    setSelectedMenuId(menuId)
    setQuantity(1)
    setSelectedOptionIds([])
  }

  function handleDecreaseQuantity() {
    setQuantity(prev => {
      return Math.max(1, prev - 1)
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
    setSelectedOptionIds(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => {
          return id !== optionId
        })
      }

      return [
        ...prev,
        optionId
      ]
    })
  }

  function handleAddressSearch() {
    window.alert('주소 선택 기능은 이후 로그인 주소 조회 / 주소 API 연결 단계에서 구현합니다.')
  }

  function handleOpenDeliveryModal() {
    setIsDeliveryModalOpen(true)
  }

  function handleCloseDeliveryModal() {
    setIsDeliveryModalOpen(false)
  }

  function handleSubmitOrder() {
    window.alert('배달 주문 생성 기능은 이후 API / DB 연결 단계에서 구현합니다.')
    setIsDeliveryModalOpen(false)
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

      <div style={menuGridStyle}>
        {visibleProducts.map(item => {
          const isSelected =
            item.id === selectedMenuId

          return (
            <button
              key={item.id}
              type="button"
              style={
                isSelected
                  ? selectedMenuButtonStyle
                  : menuButtonStyle
              }
              onClick={() => {
                handleSelectMenu(item.id)
              }}
            >
              <span>
                <h4 style={menuNameStyle}>
                  {item.name}
                </h4>

                <p style={menuDescStyle}>
                  {item.description}
                </p>
              </span>

              <span style={priceStyle}>
                {formatPrice(item.price)}
              </span>
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
        {MOCK_OPTION_ITEMS.map(item => {
          const checked =
            selectedOptionIds.includes(item.id)

          return (
            <label
              key={item.id}
              style={optionLabelStyle}
            >
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

              <span style={priceStyle}>
                {item.price > 0
                  ? `+ ${formatPrice(item.price)}`
                  : '기본값'}
              </span>
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
          placeholder="수령인 이름"
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
          배송지 선택
        </button>

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
        현재는 UI 목업입니다. 실제 배달 주문에서는 로그인 고객의 주소 목록을 불러오는 구조로 연결합니다.
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
        placeholder="예: 문 앞에 놓아주세요. 벨 누르지 말아주세요."
        onChange={event => {
          setMemo(event.target.value)
        }}
      />
    </section>
  )

  const SummaryUI = (
    <section style={summaryCardStyle}>
      <h3 style={sectionTitleStyle}>
        배달 주문 확인
      </h3>

      <div style={summaryRowStyle}>
        <span>
          채널 코드
        </span>

        <strong>
          {channelCode || '-'}
        </strong>
      </div>

      <div style={summaryRowStyle}>
        <span>
          메뉴
        </span>

        <strong>
          {selectedMenu.name}
        </strong>
      </div>

      <div style={summaryRowStyle}>
        <span>
          수량
        </span>

        <strong>
          {quantity}개
        </strong>
      </div>

      <div style={summaryRowStyle}>
        <span>
          옵션
        </span>

        <strong>
          {selectedOptions.length > 0
            ? `${selectedOptions.length}개 선택`
            : '선택 없음'}
        </strong>
      </div>

      <div style={summaryRowStyle}>
        <span>
          배달비
        </span>

        <strong>
          {formatPrice(DELIVERY_FEE)}
        </strong>
      </div>

      <div style={summaryRowStyle}>
        <span>
          결제 방식
        </span>

        <strong>
          {selectedPayment?.label || '-'}
        </strong>
      </div>

      <div style={summaryRowStyle}>
        <span>
          배송지
        </span>

        <strong>
          {address.trim()
            ? address
            : '미입력'}
        </strong>
      </div>

      <div style={totalRowStyle}>
        <span>
          총 금액
        </span>

        <span>
          {formatPrice(totalAmount)}
        </span>
      </div>

      <div style={noticeStyle}>
        하단 배달주문등록 버튼을 누르면 배송정보와 결제방식을 입력합니다.
      </div>
    </section>
  )

  const FooterBarUI = (
    <footer
      style={footerBarViewportStyle}
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
            <span style={footerTotalLabelStyle}>
              합계 :
            </span>

            <strong style={footerTotalAmountStyle}>
              {formatPrice(totalAmount)}
            </strong>
          </div>

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
            onClick={handleOpenDeliveryModal}
          >
            배달주문등록
          </button>
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
              배송정보, 결제방식, 요청사항을 확인한 뒤 배달 주문을 등록합니다.
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
              onClick={handleSubmitOrder}
            >
              배달주문등록
            </button>
          </div>
        </footer>
      </section>
    </div>
  ) : null

  // SECTION 11 : RETURN

  return (
    <section style={contentStyle}>
      {IntroUI}
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
    </section>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

type Props = {
  channelCode: string
  activeCategoryKey: string
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

type PickupTimeItem = {
  id: string
  label: string
  description: string
}

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
    categoryKey: 'SIDE',
    name: '라면사리',
    description: '찌개류에 추가 가능한 사리입니다.',
    price: 1500
  },
  {
    id: 'egg-roll',
    categoryKey: 'SUB',
    name: '계란말이',
    description: '서브 메뉴입니다.',
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
    id: 'basic',
    label: '기본값',
    price: 0
  },
  {
    id: 'extra-spicy',
    label: '맵게',
    price: 0
  }
]

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

const EMPTY_MENU_ITEM: OrderMenuItem = {
  id: 'empty',
  categoryKey: 'MAIN',
  name: '메뉴 없음',
  description: '선택 가능한 메뉴가 없습니다.',
  price: 0
}

const contentStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
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
  width: '100%',
  height: '56px',
  marginTop: '18px',
  border: 'none',
  borderRadius: '12px',
  backgroundColor: '#111827',
  color: '#ffffff',
  fontSize: '17px',
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

function formatPrice(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

export default function PickupOrderContent({
  channelCode,
  activeCategoryKey
}: Props) {
  const [selectedMenuId, setSelectedMenuId] = useState<string>(MOCK_MENU_ITEMS[0]?.id || '')
  const [quantity, setQuantity] = useState<number>(1)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [pickupTimeId, setPickupTimeId] = useState<string>(PICKUP_TIME_ITEMS[0]?.id || '')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [pickupExpectedAt, setPickupExpectedAt] = useState<string>('')
  const [memo, setMemo] = useState<string>('')
  const [isCompactLayout, setIsCompactLayout] = useState<boolean>(false)

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

  const visibleProducts = useMemo(() => {
    return MOCK_MENU_ITEMS.filter((item) => item.categoryKey === activeCategoryKey)
  }, [activeCategoryKey])

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
    return MOCK_MENU_ITEMS.find((item) => item.id === selectedMenuId) || EMPTY_MENU_ITEM
  }, [selectedMenuId])

  const selectedOptions = useMemo(() => {
    return MOCK_OPTION_ITEMS.filter((item) => selectedOptionIds.includes(item.id))
  }, [selectedOptionIds])

  const selectedPickupTime = useMemo(() => {
    return PICKUP_TIME_ITEMS.find((item) => item.id === pickupTimeId) || PICKUP_TIME_ITEMS[0]
  }, [pickupTimeId])

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

  function handleSubmitOrder() {
    window.alert('픽업 주문 생성 기능은 이후 API/DB 연결 단계에서 구현합니다.')
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
        {MOCK_OPTION_ITEMS.map((item) => {
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

  const PickupInfoUI = (
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

      <div style={totalRowStyle}>
        <span>총 금액</span>
        <span>{formatPrice(totalAmount)}</span>
      </div>

      <button type="button" style={orderButtonStyle} onClick={handleSubmitOrder}>
        픽업 주문하기
      </button>

      <div style={noticeStyle}>현재는 UI 목업 단계입니다. 실제 주문 저장/결제는 연결되어 있지 않습니다.</div>
    </section>
  )

  return (
    <section style={contentStyle}>
      {IntroUI}

      <section style={responsiveOrderGridStyle}>
        <section style={columnStyle}>{MenuSelectUI}</section>

        <section style={columnStyle}>
          {QuantityUI}
          {OptionUI}
          {PickupInfoUI}
        </section>

        <aside style={columnStyle}>
          {SummaryUI}
        </aside>
      </section>
    </section>
  )
}

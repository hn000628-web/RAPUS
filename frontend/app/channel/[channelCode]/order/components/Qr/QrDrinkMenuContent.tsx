// FILE : frontend/app/channel/[channelCode]/order/components/Qr/QrDrinkMenuContent.tsx
// ROOT : frontend/app/channel/[channelCode]/order/components/Qr/QrDrinkMenuContent.tsx
// STATUS : CREATE MODE
// ROLE : PUBLIC BUSINESS CHANNEL QR DRINK MENU CONTENT COMPONENT
// CHANGE SUMMARY :
// - QR코드 주문 음료 메뉴 전용 콘텐츠 컴포넌트 신규 생성
// - 음료 메뉴 썸네일 카드 + 단가 / 합계 / 수량 조절 UI 구성
// - menuQuantities 기반 메뉴별 수량 관리 구조 적용
// - onTotalAmountChange 콜백으로 상위 QR OrderFooter 합계 연동 가능
// - resetSignal 변경 시 선택 수량 초기화 가능
// - QR 주문은 로그인 전용 주문 UI 문구 반영
// - 현재 단계는 UI only 목업 구조
// - API 호출 / DB 접근 / 주문 생성 / 결제 연결 없음

'use client'

// SECTION 01 : IMPORT

import {
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
  resetSignal?: number
  onTotalAmountChange?: (totalAmount: number) => void
}

type QrMenuItem = {
  id: string
  name: string
  description: string
  price: number
  thumbnailUrl: string
}

type MenuQuantities = Record<string, number>

// SECTION 03 : CONSTANT

const QR_DRINK_MENU_ITEMS: QrMenuItem[] = [
  {
    id: 'cola',
    name: '콜라',
    description: '1.5L 탄산음료입니다.',
    price: 2000,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '콜라',
      '#111827',
      '#dbeafe'
    )
  },
  {
    id: 'cider',
    name: '사이다',
    description: '시원하게 곁들이는 탄산음료입니다.',
    price: 2000,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '사이다',
      '#10b981',
      '#d1fae5'
    )
  },
  {
    id: 'water',
    name: '생수',
    description: '500ml 생수입니다.',
    price: 1000,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '생수',
      '#2563eb',
      '#dbeafe'
    )
  },
  {
    id: 'zero-cola',
    name: '제로콜라',
    description: '당류를 줄인 제로 탄산음료입니다.',
    price: 2500,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '제로콜라',
      '#374151',
      '#e5e7eb'
    )
  },
  {
    id: 'orange-juice',
    name: '오렌지주스',
    description: '상큼한 과일 주스입니다.',
    price: 3000,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '오렌지주스',
      '#f97316',
      '#ffedd5'
    )
  },
  {
    id: 'iced-tea',
    name: '아이스티',
    description: '달콤한 복숭아 아이스티입니다.',
    price: 3000,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '아이스티',
      '#f59e0b',
      '#fef3c7'
    )
  }
]

// SECTION 04 : STYLE

const contentStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  paddingBottom: '96px'
}

const introCardStyle: CSSProperties = {
  width: '100%',
  padding: '24px',
  borderRadius: '20px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 900,
  color: '#111827',
  letterSpacing: '-0.03em'
}

const descriptionStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: '14px',
  lineHeight: 1.65,
  color: '#4b5563'
}

const cardStyle: CSSProperties = {
  width: '100%',
  padding: '22px',
  borderRadius: '20px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
}

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 14px',
  fontSize: '18px',
  fontWeight: 900,
  color: '#111827'
}

const menuGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px'
}

const menuCardStyle: CSSProperties = {
  width: '100%',
  minHeight: '292px',
  padding: 0,
  border: '1px solid #e5e7eb',
  borderRadius: '18px',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'space-between',
  overflow: 'hidden',
  textAlign: 'left'
}

const selectedMenuCardStyle: CSSProperties = {
  ...menuCardStyle,
  border: '2px solid #111827',
  backgroundColor: '#f9fafb'
}

const menuThumbnailStyle: CSSProperties = {
  width: '100%',
  height: '116px',
  display: 'block',
  objectFit: 'cover',
  backgroundColor: '#f3f4f6'
}

const menuContentStyle: CSSProperties = {
  minHeight: '176px',
  padding: '14px 16px 16px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '12px'
}

const menuNameStyle: CSSProperties = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 900,
  color: '#111827'
}

const menuDescStyle: CSSProperties = {
  margin: '7px 0 0',
  fontSize: '13px',
  lineHeight: 1.5,
  color: '#6b7280'
}

const menuPriceGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}

const priceRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  fontSize: '13px',
  color: '#6b7280'
}

const priceStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: '15px',
  fontWeight: 900,
  color: '#111827',
  textAlign: 'right'
}

const lineTotalStyle: CSSProperties = {
  flexShrink: 0,
  fontSize: '15px',
  fontWeight: 900,
  color: '#111827',
  textAlign: 'right'
}

const menuQuantityControlStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '42px 1fr 42px',
  alignItems: 'center',
  gap: '8px',
  marginTop: '4px'
}

const menuQuantityButtonStyle: CSSProperties = {
  width: '42px',
  height: '42px',
  border: '1px solid #e5e7eb',
  borderRadius: '999px',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: '21px',
  fontWeight: 900,
  cursor: 'pointer'
}

const menuQuantityNumberStyle: CSSProperties = {
  minWidth: '34px',
  textAlign: 'center',
  fontSize: '19px',
  fontWeight: 900,
  color: '#111827'
}

// SECTION 05 : UTIL FUNCTION

function formatPrice(
  value: number
): string {
  return `${value.toLocaleString('ko-KR')}원`
}

function buildMenuThumbnailDataUrl(
  title: string,
  color: string,
  backgroundColor: string
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <rect width="640" height="360" rx="0" fill="${backgroundColor}" />
      <circle cx="520" cy="74" r="96" fill="${color}" opacity="0.18" />
      <circle cx="122" cy="292" r="120" fill="${color}" opacity="0.12" />
      <rect x="90" y="78" width="460" height="204" rx="42" fill="#ffffff" opacity="0.92" />
      <circle cx="220" cy="180" r="70" fill="${color}" opacity="0.16" />
      <circle cx="220" cy="180" r="46" fill="${color}" opacity="0.28" />
      <rect x="310" y="142" width="150" height="18" rx="9" fill="${color}" opacity="0.28" />
      <rect x="310" y="178" width="210" height="18" rx="9" fill="${color}" opacity="0.18" />
      <rect x="310" y="214" width="126" height="18" rx="9" fill="${color}" opacity="0.14" />
      <text x="320" y="322" text-anchor="middle" font-size="36" font-weight="800" fill="#111827" font-family="Arial, sans-serif">
        ${title}
      </text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function getMenuQuantity(
  menuQuantities: MenuQuantities,
  menuId: string
): number {
  return menuQuantities[menuId] || 0
}

// SECTION 06 : COMPONENT

export default function QrDrinkMenuContent({
  channelCode,
  resetSignal,
  onTotalAmountChange
}: Props) {
  // SECTION 07 : STATE

  const [selectedMenuId, setSelectedMenuId] =
    useState<string>(QR_DRINK_MENU_ITEMS[0]?.id || '')

  const [menuQuantities, setMenuQuantities] =
    useState<MenuQuantities>({})

  // SECTION 08 : MEMO DATA

  const totalAmount = useMemo(() => {
    return QR_DRINK_MENU_ITEMS.reduce((sum, item) => {
      const quantity =
        getMenuQuantity(
          menuQuantities,
          item.id
        )

      return sum + item.price * quantity
    }, 0)
  }, [
    menuQuantities
  ])

  // SECTION 09 : EFFECT

  useEffect(() => {
    onTotalAmountChange?.(totalAmount)
  }, [
    onTotalAmountChange,
    totalAmount
  ])

  useEffect(() => {
    setMenuQuantities({})
    setSelectedMenuId(QR_DRINK_MENU_ITEMS[0]?.id || '')
  }, [
    resetSignal
  ])

  // SECTION 10 : EVENT FUNCTION

  function handleSelectMenu(
    menuId: string
  ) {
    setSelectedMenuId(menuId)
  }

  function handleDecreaseMenuQuantity(
    menuId: string
  ) {
    setSelectedMenuId(menuId)

    setMenuQuantities(prev => {
      const currentQuantity =
        prev[menuId] || 0

      const nextQuantity =
        Math.max(0, currentQuantity - 1)

      return {
        ...prev,
        [menuId]: nextQuantity
      }
    })
  }

  function handleIncreaseMenuQuantity(
    menuId: string
  ) {
    setSelectedMenuId(menuId)

    setMenuQuantities(prev => {
      const currentQuantity =
        prev[menuId] || 0

      return {
        ...prev,
        [menuId]: currentQuantity + 1
      }
    })
  }

  // SECTION 11 : UI BLOCK

  const IntroUI = (
    <section style={introCardStyle}>
      <h2 style={titleStyle}>
        QR 음료
      </h2>

      <p style={descriptionStyle}>
        채널 코드 {channelCode || '-'} 기준 QR코드 주문 음료 메뉴입니다.
        로그인한 고객이 휴대폰에서 메뉴 카드 수량을 선택하는 구조입니다.
      </p>
    </section>
  )

  const MenuSelectUI = (
    <section style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        음료 선택
      </h3>

      <div style={menuGridStyle}>
        {QR_DRINK_MENU_ITEMS.map(item => {
          const isSelected =
            item.id === selectedMenuId

          const quantity =
            getMenuQuantity(
              menuQuantities,
              item.id
            )

          const lineTotal =
            item.price * quantity

          return (
            <article
              key={item.id}
              style={
                isSelected
                  ? selectedMenuCardStyle
                  : menuCardStyle
              }
              onClick={() => {
                handleSelectMenu(item.id)
              }}
            >
              <img
                src={item.thumbnailUrl}
                alt={`${item.name} 썸네일`}
                style={menuThumbnailStyle}
              />

              <div style={menuContentStyle}>
                <div>
                  <h4 style={menuNameStyle}>
                    {item.name}
                  </h4>

                  <p style={menuDescStyle}>
                    {item.description}
                  </p>
                </div>

                <div style={menuPriceGroupStyle}>
                  <div style={priceRowStyle}>
                    <span>
                      단가
                    </span>

                    <strong style={priceStyle}>
                      {formatPrice(item.price)}
                    </strong>
                  </div>

                  <div style={priceRowStyle}>
                    <span>
                      합계
                    </span>

                    <strong style={lineTotalStyle}>
                      {formatPrice(lineTotal)}
                    </strong>
                  </div>
                </div>

                <div style={menuQuantityControlStyle}>
                  <button
                    type="button"
                    style={menuQuantityButtonStyle}
                    onClick={event => {
                      event.stopPropagation()
                      handleDecreaseMenuQuantity(item.id)
                    }}
                  >
                    -
                  </button>

                  <div style={menuQuantityNumberStyle}>
                    {quantity}
                  </div>

                  <button
                    type="button"
                    style={menuQuantityButtonStyle}
                    onClick={event => {
                      event.stopPropagation()
                      handleIncreaseMenuQuantity(item.id)
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )

  // SECTION 12 : RETURN

  return (
    <section style={contentStyle}>
      {IntroUI}

      {MenuSelectUI}
    </section>
  )
}
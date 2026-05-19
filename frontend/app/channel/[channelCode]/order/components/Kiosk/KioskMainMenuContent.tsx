'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import type {
  CSSProperties
} from 'react'

type Props = {
  channelCode: string
  resetSignal?: number
  onTotalAmountChange?: (totalAmount: number) => void
}

type KioskMenuItem = {
  id: string
  name: string
  description: string
  price: number
  thumbnailUrl: string
}

type MenuQuantities = Record<string, number>

const MAIN_MENU_ITEMS: KioskMenuItem[] = [
  {
    id: 'kimchi-stew',
    name: '김치찌개',
    description: '기본 300g 기준 메인 메뉴입니다.',
    price: 3000,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '김치찌개',
      '#ef4444',
      '#fee2e2'
    )
  },
  {
    id: 'beef-soup',
    name: '소고기국밥',
    description: '든든하게 즐기는 대표 식사 메뉴입니다.',
    price: 9000,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '소고기국밥',
      '#7c3aed',
      '#ede9fe'
    )
  },
  {
    id: 'spicy-pork',
    name: '제육볶음',
    description: '매콤한 양념의 대표 메인 메뉴입니다.',
    price: 10000,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '제육볶음',
      '#f97316',
      '#ffedd5'
    )
  },
  {
    id: 'soybean-stew',
    name: '된장찌개',
    description: '구수한 국물의 한식 메인 메뉴입니다.',
    price: 8500,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '된장찌개',
      '#ca8a04',
      '#fef3c7'
    )
  },
  {
    id: 'cold-noodle',
    name: '물냉면',
    description: '시원하게 즐기는 메인 메뉴입니다.',
    price: 9500,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '물냉면',
      '#2563eb',
      '#dbeafe'
    )
  },
  {
    id: 'bibimbap',
    name: '비빔밥',
    description: '야채와 고명을 함께 비벼 먹는 메뉴입니다.',
    price: 8500,
    thumbnailUrl: buildMenuThumbnailDataUrl(
      '비빔밥',
      '#059669',
      '#d1fae5'
    )
  }
]

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

export default function KioskMainMenuContent({
  channelCode,
  resetSignal,
  onTotalAmountChange
}: Props) {
  const [selectedMenuId, setSelectedMenuId] =
    useState<string>(MAIN_MENU_ITEMS[0]?.id || '')

  const [menuQuantities, setMenuQuantities] =
    useState<MenuQuantities>({})

  const totalAmount = useMemo(() => {
    return MAIN_MENU_ITEMS.reduce((sum, item) => {
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

  useEffect(() => {
    onTotalAmountChange?.(totalAmount)
  }, [
    onTotalAmountChange,
    totalAmount
  ])

  useEffect(() => {
    setMenuQuantities({})
    setSelectedMenuId(MAIN_MENU_ITEMS[0]?.id || '')
  }, [
    resetSignal
  ])

  function handleSelectMenu(
    menuId: string
  ) {
    setSelectedMenuId(menuId)
  }

  function handleDecreaseMenuQuantity(
    menuId: string
  ) {
    setSelectedMenuId(menuId)

    setMenuQuantities((prev) => {
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

    setMenuQuantities((prev) => {
      const currentQuantity =
        prev[menuId] || 0

      return {
        ...prev,
        [menuId]: currentQuantity + 1
      }
    })
  }

  return (
    <section style={contentStyle}>
      <section style={introCardStyle}>
        <h2 style={titleStyle}>
          메인 메뉴
        </h2>

        <p style={descriptionStyle}>
          채널 코드 {channelCode || '-'} 기준 키오스크 메인 메뉴입니다.
          메뉴 카드를 선택하고 수량을 조절하세요.
        </p>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>
          메인 메뉴 선택
        </h3>

        <div style={menuGridStyle}>
          {MAIN_MENU_ITEMS.map((item) => {
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
                      <span>단가</span>

                      <strong style={priceStyle}>
                        {formatPrice(item.price)}
                      </strong>
                    </div>

                    <div style={priceRowStyle}>
                      <span>합계</span>

                      <strong style={lineTotalStyle}>
                        {formatPrice(lineTotal)}
                      </strong>
                    </div>
                  </div>

                  <div style={menuQuantityControlStyle}>
                    <button
                      type="button"
                      style={menuQuantityButtonStyle}
                      onClick={(event) => {
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
                      onClick={(event) => {
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
    </section>
  )
}

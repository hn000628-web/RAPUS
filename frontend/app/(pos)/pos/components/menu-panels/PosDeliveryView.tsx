// FILE : frontend/app/(pos)/pos/components/views/PosDeliveryView.tsx
// ROOT : frontend/app/(pos)/pos/components/views/PosDeliveryView.tsx
// STATUS : MODIFY MODE
// ROLE : POS DELIVERY VIEW COMPONENT
// CHANGE SUMMARY :
// - 기존 준비중 UI를 배달주문 목업 리스트 UI로 교체
// - 모바일 주문 / 전화 주문 카드형 리스트 추가
// - 결제완료 / 카드결제 / pay결제 상태 표시 추가
// - 주문금액 / 주문내용 / 옵션 / 주소지 표시 추가
// - DB/API 연결 없음
// - 정적 목업 데이터만 사용

// SECTION 01 : IMPORT

import type {
  CSSProperties
} from 'react'

// SECTION 02 : TYPE

type DeliveryOrderType =
  | '모바일'
  | '전화'

type DeliveryOrderStatus =
  | '결제완료'

type DeliveryPaymentMethod =
  | '카드결제'
  | 'pay결제'

type DeliveryOrder = {
  id: string
  orderType: DeliveryOrderType
  status: DeliveryOrderStatus
  paymentMethods: DeliveryPaymentMethod[]
  amount: number
  orderText: string
  optionText: string
  addressText: string
}

// SECTION 03 : CONSTANT

const DELIVERY_ORDERS: DeliveryOrder[] = [
  {
    id: 'ORD-240501-001',
    orderType: '모바일',
    status: '결제완료',
    paymentMethods: [
      '카드결제',
      'pay결제'
    ],
    amount: 36000,
    orderText: '아메리카노 2잔 · 치즈케이크 1개',
    optionText: '아이스 / 샷추가 / 포장',
    addressText: '광주광역시 서구 풍암동 000-00'
  },
  {
    id: 'ORD-240501-002',
    orderType: '전화',
    status: '결제완료',
    paymentMethods: [
      '카드결제',
      'pay결제'
    ],
    amount: 27000,
    orderText: '카페라떼 2잔 · 허니브레드 1개',
    optionText: '따뜻하게 / 시럽 제외 / 배달',
    addressText: '광주광역시 남구 봉선동 000-00'
  }
]

const pageStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px'
}

const descriptionGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
}

const descriptionTextStyle: CSSProperties = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 500,
  color: '#334155'
}

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  marginTop: '14px'
}

const cardStyle: CSSProperties = {
  width: '100%',
  minHeight: '118px',
  padding: '22px 26px',
  borderRadius: '18px',
  border: '1px solid #dbe1ea',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '18px'
}

const cardTopStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '260px 1fr auto',
  alignItems: 'center',
  gap: '18px'
}

const orderIdStyle: CSSProperties = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 900,
  color: '#020617',
  letterSpacing: '-0.02em'
}

const statusGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  fontSize: '15px',
  fontWeight: 700,
  color: '#475569'
}

const amountStyle: CSSProperties = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 900,
  color: '#020617',
  whiteSpace: 'nowrap'
}

const cardBottomStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: 0,
  fontSize: '15px',
  fontWeight: 600,
  color: '#475569'
}

const orderTypeStyle: CSSProperties = {
  fontWeight: 900,
  color: '#0f172a'
}

const dividerStyle: CSSProperties = {
  color: '#94a3b8'
}

// SECTION 04 : DATA FUNCTION

function formatPrice(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

function buildPaymentText(order: DeliveryOrder) {
  return [
    order.status,
    ...order.paymentMethods
  ]
}

function buildOrderDetailText(order: DeliveryOrder) {
  return `${order.orderText} / ${order.optionText} / ${order.addressText}`
}

// SECTION 05 : UI BLOCK

function DeliveryOrderCard({
  order
}: {
  order: DeliveryOrder
}) {
  const paymentTexts =
    buildPaymentText(order)

  return (
    <article style={cardStyle}>
      <div style={cardTopStyle}>
        <h2 style={orderIdStyle}>
          {order.id}
        </h2>

        <div style={statusGroupStyle}>
          {paymentTexts.map((paymentText, index) => (
            <span key={paymentText}>
              {index > 0 && (
                <span>
                  {' / '}
                </span>
              )}

              <span>
                (
                {paymentText}
                )
              </span>
            </span>
          ))}
        </div>

        <p style={amountStyle}>
          {formatPrice(order.amount)}
        </p>
      </div>

      <div style={cardBottomStyle}>
        <span style={orderTypeStyle}>
          {order.orderType}
        </span>

        <span style={dividerStyle}>
          ·
        </span>

        <span>
          {buildOrderDetailText(order)}
        </span>
      </div>
    </article>
  )
}

// SECTION 06 : COMPONENT

export default function PosDeliveryView() {
  return (
    <section style={pageStyle}>
      <div style={descriptionGroupStyle}>
        <p style={descriptionTextStyle}>
          모바일/전화 주문을 확인합니다.
        </p>

        <p style={descriptionTextStyle}>
          모바일/전화 주문 내역을 표시합니다.
        </p>
      </div>

      <div style={listStyle}>
        {DELIVERY_ORDERS.map((order) => (
          <DeliveryOrderCard
            key={order.id}
            order={order}
          />
        ))}
      </div>
    </section>
  )
}
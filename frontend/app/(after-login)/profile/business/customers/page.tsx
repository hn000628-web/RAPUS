// FILE : frontend/app/(after-login)/profile/business/customers/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/customers/page.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS CUSTOMER MANAGEMENT PAGE
// CHANGE SUMMARY :
// - 고객관리 페이지에 고객 채널코드 검색바 추가
// - 검색 범위는 현재 사업자에게 등록된 고객 목록 내부로 제한
// - 검색 대상은 고객 이름 / 전화번호가 아닌 customerChannelCode 기준
// - 등록고객 / 우수고객 / 주의고객 3분류 UI 유지
// - 등록고객 전체 쿠폰발송 버튼 유지
// - 고객별 단독 쿠폰발송 버튼 유지
// - 고객 이름 표시 제거 유지
// - 고객 전화번호 표시 제거 유지
// - 고객 식별 정보는 channelCode만 표시
// - 사업자 내부 고객 분류 목업 리스트 유지
// - 사용자에게 블랙컨슈머 표현 노출 없음
// - API 호출 없음
// - DB 직접 접근 없음
// - Service / Controller 수정 없음

'use client'

// SECTION 01 : IMPORT

import {
  useMemo,
  useState
} from 'react'

import type {
  CSSProperties,
  ChangeEvent
} from 'react'

import {
  useRouter
} from 'next/navigation'

// SECTION 02 : TYPE

type CustomerTabType =
  | 'REGISTERED'
  | 'VIP'
  | 'CAUTION'

type CustomerRiskLevel =
  | 'NORMAL'
  | 'VIP'
  | 'CAUTION'
  | 'HIGH_RISK'
  | 'BLOCKED'

type CustomerRegistrationSource =
  | 'STORE_QR'
  | 'CUSTOMER_QR'
  | 'RESERVATION'
  | 'ORDER'

type CustomerMockItem = {
  id: number
  channelCode: string
  type: CustomerTabType
  riskLevel: CustomerRiskLevel
  registrationSource: CustomerRegistrationSource
  visitCount: number
  reservationCount: number
  orderCount: number
  noShowCount: number
  disputeCount: number
  couponSentCount: number
  memo: string
  lastActivityAt: string
}

// SECTION 03 : CONSTANT

const CUSTOMER_TABS: Array<{
  type: CustomerTabType
  label: string
  description: string
}> = [
  {
    type: 'REGISTERED',
    label: '등록고객',
    description: '이 매장에 단골등록한 고객'
  },
  {
    type: 'VIP',
    label: '우수고객',
    description: '방문 / 주문 이력이 안정적인 고객'
  },
  {
    type: 'CAUTION',
    label: '주의고객',
    description: '노쇼 / 분쟁 / 내부 메모가 있는 고객'
  }
]

const CUSTOMER_MOCK_ITEMS: CustomerMockItem[] = [
  {
    id: 1,
    channelCode: 'A91KQ2CUSTOMER',
    type: 'REGISTERED',
    riskLevel: 'NORMAL',
    registrationSource: 'STORE_QR',
    visitCount: 1,
    reservationCount: 0,
    orderCount: 0,
    noShowCount: 0,
    disputeCount: 0,
    couponSentCount: 1,
    memo: '매장 QR을 통해 등록된 고객.',
    lastActivityAt: '2026-05-02'
  },
  {
    id: 2,
    channelCode: 'A77MPCUSTOMER',
    type: 'REGISTERED',
    riskLevel: 'NORMAL',
    registrationSource: 'CUSTOMER_QR',
    visitCount: 0,
    reservationCount: 0,
    orderCount: 1,
    noShowCount: 0,
    disputeCount: 0,
    couponSentCount: 0,
    memo: '고객 QR 스캔으로 등록된 고객.',
    lastActivityAt: '2026-05-01'
  },
  {
    id: 3,
    channelCode: 'A28QRCUSTOMER',
    type: 'REGISTERED',
    riskLevel: 'NORMAL',
    registrationSource: 'ORDER',
    visitCount: 2,
    reservationCount: 0,
    orderCount: 3,
    noShowCount: 0,
    disputeCount: 0,
    couponSentCount: 2,
    memo: '주문 이력으로 자동 등록된 고객.',
    lastActivityAt: '2026-04-30'
  },
  {
    id: 4,
    channelCode: 'A19RSCUSTOMER',
    type: 'REGISTERED',
    riskLevel: 'NORMAL',
    registrationSource: 'RESERVATION',
    visitCount: 1,
    reservationCount: 1,
    orderCount: 0,
    noShowCount: 0,
    disputeCount: 0,
    couponSentCount: 0,
    memo: '예약 요청으로 자동 등록된 고객.',
    lastActivityAt: '2026-04-29'
  },
  {
    id: 5,
    channelCode: 'A66VIPCUSTOMER',
    type: 'VIP',
    riskLevel: 'VIP',
    registrationSource: 'ORDER',
    visitCount: 12,
    reservationCount: 8,
    orderCount: 15,
    noShowCount: 0,
    disputeCount: 0,
    couponSentCount: 4,
    memo: '예약 시간 준수. 단골 고객.',
    lastActivityAt: '2026-05-01'
  },
  {
    id: 6,
    channelCode: 'A82VIPCUSTOMER',
    type: 'VIP',
    riskLevel: 'VIP',
    registrationSource: 'STORE_QR',
    visitCount: 7,
    reservationCount: 4,
    orderCount: 9,
    noShowCount: 0,
    disputeCount: 0,
    couponSentCount: 3,
    memo: '포장 주문 빈도 높음.',
    lastActivityAt: '2026-04-28'
  },
  {
    id: 7,
    channelCode: 'A55NTCUSTOMER',
    type: 'CAUTION',
    riskLevel: 'CAUTION',
    registrationSource: 'RESERVATION',
    visitCount: 3,
    reservationCount: 5,
    orderCount: 2,
    noShowCount: 2,
    disputeCount: 0,
    couponSentCount: 0,
    memo: '예약 후 미방문 이력 2회. 승인 전 확인 필요.',
    lastActivityAt: '2026-04-26'
  },
  {
    id: 8,
    channelCode: 'A31KWCUSTOMER',
    type: 'CAUTION',
    riskLevel: 'HIGH_RISK',
    registrationSource: 'ORDER',
    visitCount: 2,
    reservationCount: 3,
    orderCount: 4,
    noShowCount: 1,
    disputeCount: 2,
    couponSentCount: 0,
    memo: '환불 요청 분쟁 이력 있음. 예약 승인 전 상세 확인 필요.',
    lastActivityAt: '2026-04-21'
  }
]

// SECTION 04 : COMPONENT

export default function BusinessCustomerManagementPage() {
  const router =
    useRouter()

  // SECTION 05 : STATE

  const [activeTab, setActiveTab] =
    useState<CustomerTabType>('REGISTERED')

  const [searchKeyword, setSearchKeyword] =
    useState<string>('')

  // SECTION 06 : MEMO

  const filteredCustomers =
    useMemo(() => {
      const normalizedKeyword =
        searchKeyword.trim().toUpperCase()

      return CUSTOMER_MOCK_ITEMS.filter((item) => {
        const isSameTab =
          item.type === activeTab

        if (!isSameTab) {
          return false
        }

        if (normalizedKeyword.length === 0) {
          return true
        }

        return item.channelCode
          .toUpperCase()
          .includes(normalizedKeyword)
      })
    }, [
      activeTab,
      searchKeyword
    ])

  const registeredCount =
    useMemo(() => {
      return CUSTOMER_MOCK_ITEMS.filter((item) => {
        return item.type === 'REGISTERED'
      }).length
    }, [])

  const vipCount =
    useMemo(() => {
      return CUSTOMER_MOCK_ITEMS.filter((item) => {
        return item.type === 'VIP'
      }).length
    }, [])

  const cautionCount =
    useMemo(() => {
      return CUSTOMER_MOCK_ITEMS.filter((item) => {
        return item.type === 'CAUTION'
      }).length
    }, [])

  // SECTION 07 : EVENT FUNCTION

  function handleBackToProfile() {
    router.push('/profile')
  }

  function handleTabChange(
    tabType: CustomerTabType
  ) {
    setActiveTab(tabType)
    setSearchKeyword('')
  }

  function handleSearchKeywordChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setSearchKeyword(event.target.value)
  }

  function handleClearSearchKeyword() {
    setSearchKeyword('')
  }

  function handlePreparedAction() {
    alert('고객관리 상세 기능은 준비중입니다.')
  }

  function handleSendCouponToCustomer(
    channelCode: string
  ) {
    alert(`${channelCode} 고객에게 단독 쿠폰발송 준비중입니다.`)
  }

  function handleSendCouponToCurrentGroup() {
    const targetLabel =
      getCustomerTabLabel(activeTab)

    alert(`${targetLabel} 전체 쿠폰발송 준비중입니다.`)
  }

  // SECTION 08 : UI BLOCK

  const SummaryUI = (
    <div style={summaryGrid}>
      <div style={summaryCard}>
        <span style={summaryLabel}>
          전체 고객
        </span>

        <strong style={summaryValue}>
          {CUSTOMER_MOCK_ITEMS.length}
        </strong>
      </div>

      <div style={summaryCard}>
        <span style={summaryLabel}>
          등록고객
        </span>

        <strong style={summaryValue}>
          {registeredCount}
        </strong>
      </div>

      <div style={summaryCard}>
        <span style={summaryLabel}>
          우수고객
        </span>

        <strong style={summaryValue}>
          {vipCount}
        </strong>
      </div>

      <div style={summaryCard}>
        <span style={summaryLabel}>
          주의고객
        </span>

        <strong style={summaryValue}>
          {cautionCount}
        </strong>
      </div>
    </div>
  )

  const TabUI = (
    <div style={tabGrid}>
      {CUSTOMER_TABS.map((tab) => {
        const isActive =
          activeTab === tab.type

        return (
          <button
            key={tab.type}
            type="button"
            style={{
              ...tabButton,
              ...(isActive ? activeTabButton : null)
            }}
            onClick={() => {
              handleTabChange(tab.type)
            }}
          >
            <strong style={tabTitle}>
              {tab.label}
            </strong>

            <span style={tabDescription}>
              {tab.description}
            </span>
          </button>
        )
      })}
    </div>
  )

  const ToolbarUI = (
    <div style={toolbar}>
      <div>
        <strong style={toolbarTitle}>
          {getCustomerTabLabel(activeTab)}
        </strong>

        <p style={toolbarDescription}>
          {getCustomerTabDescription(activeTab)}
        </p>
      </div>

      <button
        type="button"
        style={toolbarButton}
        onClick={handleSendCouponToCurrentGroup}
      >
        전체 쿠폰발송
      </button>
    </div>
  )

  const SearchUI = (
    <div style={searchWrap}>
      <div style={searchHeader}>
        <strong style={searchTitle}>
          고객검색
        </strong>

        <span style={searchGuide}>
          현재 매장에 등록된 고객 채널코드만 검색할 수 있습니다.
        </span>
      </div>

      <div style={searchRow}>
        <input
          type="search"
          value={searchKeyword}
          placeholder="고객 채널코드 검색"
          style={searchInput}
          onChange={handleSearchKeywordChange}
        />

        <button
          type="button"
          style={searchClearButton}
          onClick={handleClearSearchKeyword}
        >
          초기화
        </button>
      </div>

      <p style={searchResultText}>
        검색 결과 {filteredCustomers.length}명
      </p>
    </div>
  )

  const CustomerListUI = (
    <div style={customerList}>
      {filteredCustomers.length === 0 ? (
        <div style={emptyBox}>
          <strong style={emptyTitle}>
            검색 결과가 없습니다.
          </strong>

          <p style={emptyDescription}>
            현재 선택한 고객 분류 안에서 등록된 고객 채널코드만 검색됩니다.
          </p>
        </div>
      ) : (
        filteredCustomers.map((customer) => {
          const badgeStyle =
            getCustomerBadgeStyle(customer.riskLevel)

          return (
            <article
              key={customer.id}
              style={customerCard}
            >
              <div style={customerTop}>
                <div style={customerTitleBox}>
                  <div style={customerNameLine}>
                    <strong style={customerCodeTitle}>
                      고객 채널
                    </strong>

                    <span style={badgeStyle}>
                      {getCustomerBadgeLabel(customer.riskLevel)}
                    </span>

                    <span style={sourceBadge}>
                      {getRegistrationSourceLabel(customer.registrationSource)}
                    </span>
                  </div>

                  <p style={customerMeta}>
                    {customer.channelCode}
                  </p>
                </div>

                <div style={lastActivityBox}>
                  <span style={lastActivityLabel}>
                    최근 활동
                  </span>

                  <strong style={lastActivityValue}>
                    {customer.lastActivityAt}
                  </strong>
                </div>
              </div>

              <div style={customerStats}>
                <StatBox
                  label="방문"
                  value={`${customer.visitCount}회`}
                />

                <StatBox
                  label="예약"
                  value={`${customer.reservationCount}회`}
                />

                <StatBox
                  label="주문"
                  value={`${customer.orderCount}회`}
                />

                <StatBox
                  label="노쇼"
                  value={`${customer.noShowCount}회`}
                />

                <StatBox
                  label="분쟁"
                  value={`${customer.disputeCount}회`}
                />

                <StatBox
                  label="쿠폰"
                  value={`${customer.couponSentCount}회`}
                />
              </div>

              <div style={memoBox}>
                <span style={memoLabel}>
                  내부 메모
                </span>

                <p style={memoText}>
                  {customer.memo}
                </p>
              </div>

              <div style={actionRow}>
                <button
                  type="button"
                  style={secondaryButton}
                  onClick={() => {
                    handleSendCouponToCustomer(customer.channelCode)
                  }}
                >
                  단독 쿠폰발송
                </button>

                <button
                  type="button"
                  style={secondaryButton}
                  onClick={handlePreparedAction}
                >
                  메모 수정
                </button>

                <button
                  type="button"
                  style={primaryButton}
                  onClick={handlePreparedAction}
                >
                  상세 보기
                </button>
              </div>
            </article>
          )
        })
      )}
    </div>
  )

  // SECTION 09 : RETURN

  return (
    <main style={page}>
      <section style={container}>
        <div style={header}>
          <button
            type="button"
            style={backButton}
            onClick={handleBackToProfile}
          >
            마이페이지로 돌아가기
          </button>

          <h1 style={title}>
            고객관리
          </h1>

          <p style={description}>
            단골등록 / 예약 / 주문 / 방문 이력을 기준으로 등록고객, 우수고객, 주의고객을 관리합니다.
            고객 이름과 전화번호는 표시하지 않고 채널코드 기준으로 관리합니다.
          </p>
        </div>

        {SummaryUI}

        <section style={card}>
          {TabUI}

          <div style={divider} />

          {ToolbarUI}

          <div style={divider} />

          {SearchUI}

          <div style={divider} />

          {CustomerListUI}
        </section>
      </section>
    </main>
  )
}

// SECTION 10 : STAT BOX COMPONENT

function StatBox({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <div style={statBox}>
      <span style={statLabel}>
        {label}
      </span>

      <strong style={statValue}>
        {value}
      </strong>
    </div>
  )
}

// SECTION 11 : UTIL

function getCustomerTabLabel(
  tabType: CustomerTabType
): string {
  if (tabType === 'REGISTERED') {
    return '등록고객'
  }

  if (tabType === 'VIP') {
    return '우수고객'
  }

  if (tabType === 'CAUTION') {
    return '주의고객'
  }

  return '고객'
}

function getCustomerTabDescription(
  tabType: CustomerTabType
): string {
  if (tabType === 'REGISTERED') {
    return '사용자가 이 매장에 단골등록했거나 예약 / 주문으로 연결된 고객입니다.'
  }

  if (tabType === 'VIP') {
    return '방문 / 주문 / 예약 이력이 안정적인 고객입니다.'
  }

  if (tabType === 'CAUTION') {
    return '노쇼 / 분쟁 / 내부 메모가 있어 확인이 필요한 고객입니다.'
  }

  return '고객 목록입니다.'
}

function getCustomerBadgeLabel(
  riskLevel: CustomerRiskLevel
): string {
  if (riskLevel === 'NORMAL') {
    return '등록고객'
  }

  if (riskLevel === 'VIP') {
    return '우수고객'
  }

  if (riskLevel === 'CAUTION') {
    return '주의고객'
  }

  if (riskLevel === 'HIGH_RISK') {
    return '거래주의'
  }

  if (riskLevel === 'BLOCKED') {
    return '차단고객'
  }

  return '일반'
}

function getRegistrationSourceLabel(
  source: CustomerRegistrationSource
): string {
  if (source === 'STORE_QR') {
    return '매장 QR'
  }

  if (source === 'CUSTOMER_QR') {
    return '고객 QR'
  }

  if (source === 'RESERVATION') {
    return '예약 등록'
  }

  if (source === 'ORDER') {
    return '주문 등록'
  }

  return '등록'
}

function getCustomerBadgeStyle(
  riskLevel: CustomerRiskLevel
): CSSProperties {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
    padding: '0 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: 'nowrap'
  }

  if (riskLevel === 'NORMAL') {
    return {
      ...baseStyle,
      color: '#1d4ed8',
      background: '#dbeafe',
      border: '1px solid #bfdbfe'
    }
  }

  if (riskLevel === 'VIP') {
    return {
      ...baseStyle,
      color: '#166534',
      background: '#dcfce7',
      border: '1px solid #bbf7d0'
    }
  }

  if (riskLevel === 'CAUTION') {
    return {
      ...baseStyle,
      color: '#92400e',
      background: '#fef3c7',
      border: '1px solid #fde68a'
    }
  }

  if (riskLevel === 'HIGH_RISK') {
    return {
      ...baseStyle,
      color: '#991b1b',
      background: '#fee2e2',
      border: '1px solid #fecaca'
    }
  }

  return {
    ...baseStyle,
    color: '#334155',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0'
  }
}

// SECTION 12 : STYLE

const page: CSSProperties = {
  width: '100%',
  minHeight: '100vh',
  background: '#f8fafc',
  padding: '32px 20px',
  boxSizing: 'border-box'
}

const container: CSSProperties = {
  width: '100%',
  maxWidth: 920,
  margin: '0 auto'
}

const header: CSSProperties = {
  marginBottom: 18
}

const backButton: CSSProperties = {
  height: 36,
  padding: '0 14px',
  border: '1px solid #d1d5db',
  borderRadius: 999,
  background: '#ffffff',
  color: '#374151',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  marginBottom: 16
}

const title: CSSProperties = {
  margin: 0,
  color: '#111827',
  fontSize: 28,
  fontWeight: 900,
  letterSpacing: -0.4,
  lineHeight: 1.25
}

const description: CSSProperties = {
  margin: '8px 0 0',
  color: '#6b7280',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.6
}

const summaryGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 14
}

const summaryCard: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  background: '#ffffff',
  padding: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10
}

const summaryLabel: CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 800
}

const summaryValue: CSSProperties = {
  color: '#111827',
  fontSize: 20,
  fontWeight: 900
}

const card: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  background: '#ffffff',
  padding: 18,
  boxShadow: '0 8px 24px rgba(15,23,42,0.04)'
}

const tabGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 10
}

const tabButton: CSSProperties = {
  minHeight: 76,
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  background: '#ffffff',
  color: '#111827',
  padding: 14,
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 6
}

const activeTabButton: CSSProperties = {
  border: '2px solid #111827',
  background: '#111827',
  color: '#ffffff'
}

const tabTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 900
}

const tabDescription: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.45,
  opacity: 0.78
}

const toolbar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  border: '1px solid #eef0f3',
  borderRadius: 14,
  background: '#f8fafc',
  padding: 14
}

const toolbarTitle: CSSProperties = {
  display: 'block',
  color: '#111827',
  fontSize: 15,
  fontWeight: 900,
  marginBottom: 4
}

const toolbarDescription: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.45
}

const toolbarButton: CSSProperties = {
  flexShrink: 0,
  height: 38,
  padding: '0 14px',
  border: 'none',
  borderRadius: 999,
  background: '#2563eb',
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer'
}

const searchWrap: CSSProperties = {
  border: '1px solid #eef0f3',
  borderRadius: 14,
  background: '#ffffff',
  padding: 14
}

const searchHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  marginBottom: 10
}

const searchTitle: CSSProperties = {
  color: '#111827',
  fontSize: 14,
  fontWeight: 900
}

const searchGuide: CSSProperties = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.4,
  textAlign: 'right'
}

const searchRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8
}

const searchInput: CSSProperties = {
  width: '100%',
  height: 42,
  border: '1px solid #dbe1ea',
  borderRadius: 12,
  background: '#f8fafc',
  color: '#111827',
  padding: '0 13px',
  fontSize: 13,
  fontWeight: 800,
  outline: 'none',
  boxSizing: 'border-box'
}

const searchClearButton: CSSProperties = {
  flexShrink: 0,
  height: 42,
  padding: '0 13px',
  border: '1px solid #d1d5db',
  borderRadius: 12,
  background: '#ffffff',
  color: '#374151',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer'
}

const searchResultText: CSSProperties = {
  margin: '8px 0 0',
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800
}

const divider: CSSProperties = {
  height: 1,
  background: '#f1f5f9',
  margin: '18px 0'
}

const customerList: CSSProperties = {
  display: 'grid',
  gap: 12
}

const emptyBox: CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 16,
  background: '#f8fafc',
  padding: 22,
  textAlign: 'center'
}

const emptyTitle: CSSProperties = {
  display: 'block',
  color: '#111827',
  fontSize: 15,
  fontWeight: 900,
  marginBottom: 6
}

const emptyDescription: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.5
}

const customerCard: CSSProperties = {
  border: '1px solid #eef0f3',
  borderRadius: 16,
  background: '#ffffff',
  padding: 16
}

const customerTop: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  alignItems: 'flex-start'
}

const customerTitleBox: CSSProperties = {
  minWidth: 0
}

const customerNameLine: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap'
}

const customerCodeTitle: CSSProperties = {
  color: '#111827',
  fontSize: 16,
  fontWeight: 900
}

const customerMeta: CSSProperties = {
  margin: '6px 0 0',
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.4,
  wordBreak: 'break-all'
}

const sourceBadge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 24,
  padding: '0 9px',
  borderRadius: 999,
  color: '#475569',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: 'nowrap'
}

const lastActivityBox: CSSProperties = {
  flexShrink: 0,
  textAlign: 'right'
}

const lastActivityLabel: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 800,
  marginBottom: 4
}

const lastActivityValue: CSSProperties = {
  color: '#111827',
  fontSize: 12,
  fontWeight: 900
}

const customerStats: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 8,
  marginTop: 14
}

const statBox: CSSProperties = {
  border: '1px solid #eef0f3',
  borderRadius: 12,
  background: '#f8fafc',
  padding: '10px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  textAlign: 'center'
}

const statLabel: CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 800
}

const statValue: CSSProperties = {
  color: '#111827',
  fontSize: 13,
  fontWeight: 900
}

const memoBox: CSSProperties = {
  marginTop: 14,
  border: '1px solid #eef0f3',
  borderRadius: 12,
  background: '#f9fafb',
  padding: 12
}

const memoLabel: CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 11,
  fontWeight: 900,
  marginBottom: 6
}

const memoText: CSSProperties = {
  margin: 0,
  color: '#334155',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.5
}

const actionRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 14
}

const secondaryButton: CSSProperties = {
  height: 36,
  padding: '0 13px',
  border: '1px solid #d1d5db',
  borderRadius: 999,
  background: '#ffffff',
  color: '#374151',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer'
}

const primaryButton: CSSProperties = {
  height: 36,
  padding: '0 13px',
  border: 'none',
  borderRadius: 999,
  background: '#111827',
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer'
}
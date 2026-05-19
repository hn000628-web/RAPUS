'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import OrderLayout from '../components/OrderLayout'
import OrderSidebar from '../components/OrderSidebar'
import PickupOrderContent from '../components/PickupOrderContent'

type RouteParams = {
  channelCode?: string
}

type MockOrderCategory = {
  key: string
  label: string
}

const MOCK_ORDER_CATEGORIES: MockOrderCategory[] = [
  { key: 'MAIN', label: '메인 메뉴' },
  { key: 'SUB', label: '서브 메뉴' },
  { key: 'DRINK', label: '음료' },
  { key: 'SIDE', label: '사이드' },
  { key: 'ALCOHOL', label: '주류' },
  { key: 'CUSTOM_1', label: '새 카테고리' },
  { key: 'CUSTOM_2', label: '새 카테고리' },
  { key: 'CUSTOM_3', label: '새 카테고리' }
]

export default function PickupOrderPage() {
  const router = useRouter()
  const params = useParams<RouteParams>()
  const channelCode = String(params?.channelCode || '').trim()

  const [activeCategoryKey, setActiveCategoryKey] = useState<string>('MAIN')

  const sidebar = useMemo(() => {
    return (
      <OrderSidebar
        channelCode={channelCode}
        mode="MENU_CATEGORY"
        categories={MOCK_ORDER_CATEGORIES}
        activeCategoryKey={activeCategoryKey}
        onChangeCategory={setActiveCategoryKey}
      />
    )
  }, [activeCategoryKey, channelCode])

  if (!channelCode) {
    return (
      <OrderLayout channelCode="" customSidebar={sidebar}>
        <section
          style={{
            width: '100%',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff'
          }}
        >
          채널 정보를 확인할 수 없습니다.
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => {
                router.push('/channel')
              }}
              style={{
                height: '40px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1px solid #d8e0ea',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              채널 목록으로 이동
            </button>
          </div>
        </section>
      </OrderLayout>
    )
  }

  return (
    <OrderLayout
      channelCode={channelCode}
      customSidebar={sidebar}
    >
      <PickupOrderContent
        channelCode={channelCode}
        activeCategoryKey={activeCategoryKey}
      />
    </OrderLayout>
  )
}

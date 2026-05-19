'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import OrderLayout from '../components/OrderLayout'
import OrderSidebar from '../components/OrderSidebar'
import DeliveryOrderContent from '../components/DeliveryOrderContent'

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

export default function DeliveryOrderPage() {
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

  return (
    <OrderLayout
      channelCode={channelCode}
      customSidebar={sidebar}
    >
      <DeliveryOrderContent
        channelCode={channelCode}
        activeCategoryKey={activeCategoryKey}
      />
    </OrderLayout>
  )
}

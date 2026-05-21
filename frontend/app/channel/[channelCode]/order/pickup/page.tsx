'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import OrderLayout from '../components/OrderLayout'
import OrderSidebar from '../components/OrderSidebar'
import PickupOrderContent from '../components/PickupOrderContent'
import type { ReactNode } from 'react'
import { getCustomerOrderBootstrap } from '@/lib/business/pos/customerOrderApi'

type RouteParams = {
  channelCode?: string
}

type OrderCategory = {
  key: string
  label: string
}

const DEFAULT_ORDER_CATEGORIES: OrderCategory[] = []

export default function PickupOrderPage() {
  const router = useRouter()
  const params = useParams<RouteParams>()
  const channelCode = String(params?.channelCode || '').trim()

  const [orderCategories, setOrderCategories] = useState<OrderCategory[]>(DEFAULT_ORDER_CATEGORIES)
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      if (!channelCode) {
        setOrderCategories(DEFAULT_ORDER_CATEGORIES)
        setActiveCategoryKey('')
        return
      }

      try {
        const response = await getCustomerOrderBootstrap({
          providerChannelCode: channelCode,
          orderFlowType: 'PICKUP',
        })

        if (cancelled) {
          return
        }

        const nextCategories: OrderCategory[] = response.categories.map((category) => ({
          key: category.categoryCode,
          label: category.categoryName,
        }))

        setOrderCategories(nextCategories)
        setActiveCategoryKey((prev) => {
          const exists = nextCategories.some((category) => category.key === prev)
          return exists ? prev : nextCategories[0].key
        })
      } catch {
        if (cancelled) {
          return
        }

        setOrderCategories(DEFAULT_ORDER_CATEGORIES)
        setActiveCategoryKey('')
      }
    }

    void loadCategories()

    return () => {
      cancelled = true
    }
  }, [channelCode])

  const sidebar = useMemo(() => {
    return (
      <OrderSidebar
        channelCode={channelCode}
        mode="MENU_CATEGORY"
        categories={orderCategories}
        activeCategoryKey={activeCategoryKey}
        onChangeCategory={setActiveCategoryKey}
      />
    )
  }, [activeCategoryKey, channelCode])

  const sidebarNode = useMemo<ReactNode>(() => sidebar, [sidebar])

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
      hideSidebar
    >
      <PickupOrderContent
        channelCode={channelCode}
        activeCategoryKey={activeCategoryKey}
        categorySidebar={sidebarNode}
      />
    </OrderLayout>
  )
}

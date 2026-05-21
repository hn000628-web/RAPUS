'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import OrderLayout from '../components/OrderLayout'
import OrderSidebar from '../components/OrderSidebar'
import DeliveryOrderContent from '../components/DeliveryOrderContent'
import { getCustomerOrderBootstrap } from '@/lib/business/pos/customerOrderApi'

type RouteParams = {
  channelCode?: string
}

type OrderCategory = {
  key: string
  label: string
}

const DEFAULT_ORDER_CATEGORIES: OrderCategory[] = []

export default function DeliveryOrderPage() {
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
          orderFlowType: 'DELIVERY',
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

  return (
    <OrderLayout
      channelCode={channelCode}
      hideSidebar
    >
      <DeliveryOrderContent
        channelCode={channelCode}
        activeCategoryKey={activeCategoryKey}
        categorySidebar={sidebar}
      />
    </OrderLayout>
  )
}

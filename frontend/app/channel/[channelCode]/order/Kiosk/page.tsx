// FILE : frontend/app/channel/[channelCode]/order/Kiosk/page.tsx
// ROOT : frontend/app/channel/[channelCode]/order/Kiosk/page.tsx
// STATUS : MODIFY MODE
// ROLE : PUBLIC BUSINESS CHANNEL KIOSK ORDER PAGE
// CHANGE SUMMARY :
// - DineInOrderContent alias import 제거
// - DineInOrderSidebar alias import 제거
// - 키오스크 메뉴 컴포넌트 4개 전체 import
// - 메인메뉴 / 서브메뉴 / 음료 / 사이드 카테고리 전환 구조 적용
// - activeCategoryId 기반 표시/숨김 처리
// - 4개 메뉴 컴포넌트 mount 상태 유지
// - categoryTotals 기반 전체 합계 계산
// - OrderFooter 주문하기 클릭 시 resetSignal 증가 및 합계 초기화
// - 현재 단계는 UI only 목업 구조
// - API 호출 / DB 접근 / 주문 생성 / 결제 연결 없음

'use client'

// SECTION 01 : IMPORT

import {
  useCallback,
  useMemo,
  useState
} from 'react'

import type {
  CSSProperties
} from 'react'

import {
  useParams
} from 'next/navigation'

import KioskMainMenuContent from '../components/Kiosk/KioskMainMenuContent'
import KioskSubMenuContent from '../components/Kiosk/KioskSubMenuContent'
import KioskDrinkMenuContent from '../components/Kiosk/KioskDrinkMenuContent'
import KioskSideMenuContent from '../components/Kiosk/KioskSideMenuContent'
import KioskOrderSidebar from '../components/Kiosk/KioskOrderSidebar'
import OrderLayout from '../components/OrderLayout'
import OrderFooter from '../components/Kiosk/KioskOrderFooter'

// SECTION 02 : TYPE

type RouteParams = {
  channelCode?: string
}

export type KioskCategoryId =
  | 'main'
  | 'sub'
  | 'drink'
  | 'side'

type CategoryTotals = Record<KioskCategoryId, number>

// SECTION 03 : CONSTANT

const INITIAL_CATEGORY_TOTALS: CategoryTotals = {
  main: 0,
  sub: 0,
  drink: 0,
  side: 0
}

// SECTION 04 : STYLE

const pageStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  paddingBottom: '96px'
}

const visibleContentStyle: CSSProperties = {
  display: 'block'
}

const hiddenContentStyle: CSSProperties = {
  display: 'none'
}

// SECTION 05 : COMPONENT

export default function KioskOrderPage() {
  // SECTION 06 : ROUTE

  const params =
    useParams<RouteParams>()

  const channelCode =
    String(params?.channelCode || '').trim()

  // SECTION 07 : STATE

  const [activeCategoryId, setActiveCategoryId] =
    useState<KioskCategoryId>('main')

  const [categoryTotals, setCategoryTotals] =
    useState<CategoryTotals>(INITIAL_CATEGORY_TOTALS)

  const [resetSignal, setResetSignal] =
    useState<number>(0)

  // SECTION 08 : MEMO DATA

  const totalAmount = useMemo(() => {
    return Object.values(categoryTotals).reduce((sum, value) => {
      return sum + value
    }, 0)
  }, [
    categoryTotals
  ])

  // SECTION 09 : EVENT FUNCTION

  const handleSelectCategory = useCallback((
    categoryId: KioskCategoryId
  ) => {
    setActiveCategoryId(categoryId)
  }, [])

  const handleCategoryTotalChange = useCallback((
    categoryId: KioskCategoryId,
    nextTotalAmount: number
  ) => {
    setCategoryTotals((prev) => {
      if (prev[categoryId] === nextTotalAmount) {
        return prev
      }

      return {
        ...prev,
        [categoryId]: nextTotalAmount
      }
    })
  }, [])

  const handleMainTotalAmountChange = useCallback((nextTotalAmount: number) => {
    handleCategoryTotalChange(
      'main',
      nextTotalAmount
    )
  }, [handleCategoryTotalChange])

  const handleSubTotalAmountChange = useCallback((nextTotalAmount: number) => {
    handleCategoryTotalChange(
      'sub',
      nextTotalAmount
    )
  }, [handleCategoryTotalChange])

  const handleDrinkTotalAmountChange = useCallback((nextTotalAmount: number) => {
    handleCategoryTotalChange(
      'drink',
      nextTotalAmount
    )
  }, [handleCategoryTotalChange])

  const handleSideTotalAmountChange = useCallback((nextTotalAmount: number) => {
    handleCategoryTotalChange(
      'side',
      nextTotalAmount
    )
  }, [handleCategoryTotalChange])

  function handleSubmitOrder() {
    window.alert('키오스크 주문 생성 기능은 이후 API / DB 연결 단계에서 구현합니다.')

    setCategoryTotals(INITIAL_CATEGORY_TOTALS)

    setResetSignal(prev => {
      return prev + 1
    })

    setActiveCategoryId('main')
  }

  // SECTION 10 : UI BLOCK

  const MainMenuContentUI = (
    <section
      style={
        activeCategoryId === 'main'
          ? visibleContentStyle
          : hiddenContentStyle
      }
    >
      <KioskMainMenuContent
        channelCode={channelCode}
        resetSignal={resetSignal}
        onTotalAmountChange={handleMainTotalAmountChange}
      />
    </section>
  )

  const SubMenuContentUI = (
    <section
      style={
        activeCategoryId === 'sub'
          ? visibleContentStyle
          : hiddenContentStyle
      }
    >
      <KioskSubMenuContent
        channelCode={channelCode}
        resetSignal={resetSignal}
        onTotalAmountChange={handleSubTotalAmountChange}
      />
    </section>
  )

  const DrinkMenuContentUI = (
    <section
      style={
        activeCategoryId === 'drink'
          ? visibleContentStyle
          : hiddenContentStyle
      }
    >
      <KioskDrinkMenuContent
        channelCode={channelCode}
        resetSignal={resetSignal}
        onTotalAmountChange={handleDrinkTotalAmountChange}
      />
    </section>
  )

  const SideMenuContentUI = (
    <section
      style={
        activeCategoryId === 'side'
          ? visibleContentStyle
          : hiddenContentStyle
      }
    >
      <KioskSideMenuContent
        channelCode={channelCode}
        resetSignal={resetSignal}
        onTotalAmountChange={handleSideTotalAmountChange}
      />
    </section>
  )

  // SECTION 11 : RETURN

  return (
    <OrderLayout
      channelCode={channelCode}
      customSidebar={
        <KioskOrderSidebar
          selectedCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategory}
        />
      }
    >
      <main style={pageStyle}>
        {MainMenuContentUI}

        {SubMenuContentUI}

        {DrinkMenuContentUI}

        {SideMenuContentUI}

        <OrderFooter
          totalAmount={totalAmount}
          onSubmitOrder={handleSubmitOrder}
        />
      </main>
    </OrderLayout>
  )
}

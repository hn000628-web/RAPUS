'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useParams } from 'next/navigation'

import OrderLayout from '../components/OrderLayout'
import QrOrderFooter from '../components/Qr/QrOrderFooter'
import { getMe } from '@/lib/authApi'
import { getProfileAccount } from '@/lib/accountApi'
import { getPosProductCategories } from '@/lib/business/pos/posCategoriesApi'
import { getPosMenus, type PosMenuItem, type PosMenuContext } from '@/lib/business/pos/posMenuApi'
import { createPosOrder } from '@/lib/business/pos/posOrdersApi'
import { getPosTableSettings } from '@/lib/business/pos/posTableSettingsApi'

type RouteParams = {
  channelCode?: string
}

type UiCategory = {
  id: string
  code: string
  name: string
}

type UiMenuItem = {
  id: string
  productId: number
  categoryId: string
  categoryCode: string | null
  name: string
  description: string
  price: number
}

type AdultStatus = 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN'

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  paddingBottom: '96px'
}

const cardStyle: CSSProperties = {
  width: '100%',
  padding: '20px',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#fff'
}

const tabRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '10px'
}

const qtyRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '36px 1fr 36px',
  alignItems: 'center',
  gap: '8px'
}

export default function QrOrderPage() {
  const params = useParams<RouteParams>()
  const routeChannelCode = String(params?.channelCode || '').trim()

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [noticeMessage, setNoticeMessage] = useState<string>('')

  const [profileId, setProfileId] = useState<number>(0)
  const [channelCode, setChannelCode] = useState<string>('')
  const [locationId, setLocationId] = useState<number>(0)

  const [adultStatus, setAdultStatus] = useState<AdultStatus>('UNKNOWN')
  const [categories, setCategories] = useState<UiCategory[]>([])
  const [menus, setMenus] = useState<UiMenuItem[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const visibleMenus = useMemo(() => {
    return menus.filter((item) => item.categoryId === selectedCategoryId)
  }, [menus, selectedCategoryId])

  const orderItems = useMemo(() => {
    return menus
      .filter((item) => (quantities[item.id] || 0) > 0)
      .map((item) => ({
        ...item,
        quantity: quantities[item.id] || 0
      }))
  }, [menus, quantities])

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [orderItems])

  const hasAlcoholItem = useMemo(() => {
    return orderItems.some((item) => String(item.categoryCode || '').toUpperCase() === 'ALCOHOL')
  }, [orderItems])

  const isSubmitDisabled = totalAmount <= 0 || isSubmitting || isLoading

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')
        setNoticeMessage('')

        const me = await getMe()
        const meProfileId = Number(me?.user?.profileId || 0)
        const meChannelCode = String(me?.user?.channelCode || '').trim()
        const meProfileType = String(me?.user?.profileType || '')

        if (!meProfileId || !meChannelCode || meProfileType !== 'BUSINESS') {
          throw new Error('QR 주문 컨텍스트를 확인할 수 없습니다.')
        }

        const context: PosMenuContext = {
          profileId: meProfileId,
          channelCode: meChannelCode
        }

        const [categoryResponse, menuResponse, tableResponse, accountData] = await Promise.all([
          getPosProductCategories(),
          getPosMenus(context),
          getPosTableSettings({
            profileId: meProfileId,
            channelCode: meChannelCode
          }),
          getProfileAccount({
            profileId: meProfileId,
            channelCode: meChannelCode
          })
        ])

        if (!mounted) {
          return
        }

        const normalizedCategories = categoryResponse.categories
          .filter((item) => Number(item.isActive) === 1)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            id: String(item.id),
            code: String(item.categoryCode || '').trim().toUpperCase(),
            name: String(item.categoryName || '').trim() || '미분류'
          }))

        const normalizedMenus = menuResponse.items
          .filter((item) => item.isActive && item.saleStatus !== 'OFF')
          .map((item: PosMenuItem) => ({
            id: String(item.id),
            productId: Number(item.id),
            categoryId: String(item.categoryId ?? ''),
            categoryCode: item.categoryCode ? String(item.categoryCode).trim().toUpperCase() : null,
            name: String(item.productName || '').trim() || '상품명 미설정',
            description: String(item.productDescription || '').trim(),
            price: Number(item.basePrice || 0)
          }))

        const table = tableResponse.tables.find((item) => Number(item.isActive) === 1)

        setProfileId(meProfileId)
        setChannelCode(meChannelCode)
        setLocationId(Number(table?.id || 0))
        setAdultStatus(
          String(accountData.adultVerificationStatus || '').toUpperCase() === 'VERIFIED'
            ? 'VERIFIED'
            : 'UNVERIFIED'
        )
        setCategories(normalizedCategories)
        setMenus(normalizedMenus)
        setSelectedCategoryId(normalizedCategories[0]?.id || '')

        if (!table?.id) {
          setNoticeMessage('활성 테이블 설정이 없어 QR 주문 생성이 제한됩니다.')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'QR 주문 정보를 불러오지 못했습니다.'
        if (mounted) {
          setErrorMessage(message)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [routeChannelCode])

  const adjustQty = (menuId: string, delta: number) => {
    setErrorMessage('')
    setNoticeMessage('')
    setQuantities((prev) => {
      const current = prev[menuId] || 0
      const next = Math.max(0, current + delta)
      return {
        ...prev,
        [menuId]: next
      }
    })
  }

  const handleSubmitOrder = async () => {
    if (isSubmitDisabled) {
      return
    }

    if (!profileId || !channelCode || !locationId) {
      setErrorMessage('주문 컨텍스트를 확인할 수 없습니다. 활성 테이블 설정을 확인해주세요.')
      return
    }

    if (hasAlcoholItem && adultStatus !== 'VERIFIED') {
      setErrorMessage('주류 메뉴는 성인인증 완료 후 주문할 수 있습니다.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')

      const result = await createPosOrder({
        profileId,
        channelCode,
        locationId,
        orderSource: 'QR_ORDER',
        orderFlowType: 'TABLE',
        customerProfileId: profileId,
        customerChannelCode: channelCode,
        customerMemo: null,
        items: orderItems.map((item) => ({
          productId: item.productId,
          productName: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          options: []
        }))
      })

      if (result.error || !result.data) {
        const message = result.error || 'QR 주문 생성에 실패했습니다.'
        if (message.includes('ADULT_VERIFICATION_REQUIRED_FOR_QR_ORDER')) {
          setErrorMessage('성인인증이 필요한 주류 메뉴입니다. 성인인증 완료 후 다시 주문해주세요.')
          return
        }
        setErrorMessage(message)
        return
      }

      setNoticeMessage(`주문이 접수되었습니다. 주문번호: ${result.data.orderNumber || result.data.orderCode}`)
      setQuantities({})
    } catch (error) {
      const message = error instanceof Error ? error.message : 'QR 주문 생성 중 오류가 발생했습니다.'
      if (message.includes('ADULT_VERIFICATION_REQUIRED_FOR_QR_ORDER')) {
        setErrorMessage('성인인증이 필요한 주류 메뉴입니다. 성인인증 완료 후 다시 주문해주세요.')
        return
      }
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <OrderLayout channelCode={routeChannelCode}>
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h2 style={{ margin: 0 }}>QR 주문</h2>
          <p style={{ margin: '8px 0 0', color: '#4b5563' }}>
            성인인증 상태: {adultStatus === 'VERIFIED' ? '완료' : adultStatus === 'UNVERIFIED' ? '미완료' : '확인중'}
          </p>
          {errorMessage ? <p style={{ color: '#b91c1c', marginTop: '10px' }}>{errorMessage}</p> : null}
          {noticeMessage ? <p style={{ color: '#065f46', marginTop: '10px' }}>{noticeMessage}</p> : null}
        </section>

        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>카테고리</h3>
          <div style={tabRowStyle}>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedCategoryId(item.id)}
                style={{
                  border: selectedCategoryId === item.id ? '2px solid #111827' : '1px solid #d1d5db',
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>메뉴</h3>
          <div style={gridStyle}>
            {visibleMenus.map((item) => {
              const quantity = quantities[item.id] || 0
              const isAlcohol = String(item.categoryCode || '').toUpperCase() === 'ALCOHOL'
              return (
                <article key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px' }}>
                  <strong>{item.name}</strong>
                  <p style={{ margin: '6px 0', fontSize: '12px', color: '#6b7280' }}>{item.description || ' '}</p>
                  <p style={{ margin: '6px 0', fontWeight: 700 }}>{item.price.toLocaleString('ko-KR')}원</p>
                  {isAlcohol ? (
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#b45309' }}>주류 · 성인인증 필요</p>
                  ) : null}
                  <div style={qtyRowStyle}>
                    <button type="button" onClick={() => adjustQty(item.id, -1)}>-</button>
                    <div style={{ textAlign: 'center', fontWeight: 700 }}>{quantity}</div>
                    <button type="button" onClick={() => adjustQty(item.id, 1)}>+</button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <QrOrderFooter
          totalAmount={totalAmount}
          disabled={isSubmitDisabled}
          orderInfoText={hasAlcoholItem ? '주류 포함 주문은 성인인증 완료 상태에서만 가능합니다.' : 'QR 주문을 진행합니다.'}
          onSubmitOrder={handleSubmitOrder}
        />
      </main>
    </OrderLayout>
  )
}

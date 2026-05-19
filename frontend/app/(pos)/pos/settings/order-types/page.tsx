'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { getMe } from '@/lib/authApi'
import { getProfileByChannelCode } from '@/lib/profile-summary-api'
import {
  getPosOrderTypes,
  savePosOrderTypes,
  type PosOrderTypeCode,
  type PosOrderTypeItem,
  type SavePosOrderTypeInput
} from '@/lib/business/pos/posOrderTypesApi'
import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import PosTopbar from '../../components/PosTopbar'
import styles from './PosOrderTypeSettingsPage.module.css'

type ProfileContext = {
  profileId: number
  channelCode: string
}

type UiOrderTypeItem = PosOrderTypeItem

const FALLBACK_ORDER_TYPES: UiOrderTypeItem[] = [
  {
    code: 'TABLE',
    defaultTitle: '테이블 주문',
    customTitle: '',
    displayTitle: '테이블 주문',
    description: '매장 내 테이블 주문을 사용합니다.',
    isEnabled: true,
    sortOrder: 1
  },
  {
    code: 'RESERVATION',
    defaultTitle: '예약 주문',
    customTitle: '',
    displayTitle: '예약 주문',
    description: '예약 기반 주문 접수를 사용합니다.',
    isEnabled: false,
    sortOrder: 2
  },
  {
    code: 'DELIVERY',
    defaultTitle: '배달 주문',
    customTitle: '',
    displayTitle: '배달 주문',
    description: '배달 주문 접수를 사용합니다.',
    isEnabled: false,
    sortOrder: 3
  },
  {
    code: 'PICKUP',
    defaultTitle: '픽업 주문',
    customTitle: '',
    displayTitle: '픽업 주문',
    description: '픽업 주문 접수를 사용합니다.',
    isEnabled: false,
    sortOrder: 4
  },
  {
    code: 'QR_ORDER',
    defaultTitle: 'QR 주문',
    customTitle: '',
    displayTitle: 'QR 주문',
    description: '테이블 QR 주문 접수를 사용합니다.',
    isEnabled: true,
    sortOrder: 5
  },
  {
    code: 'KIOSK',
    defaultTitle: '키오스크 주문',
    customTitle: '',
    displayTitle: '키오스크 주문',
    description: '키오스크 주문 접수를 사용합니다.',
    isEnabled: false,
    sortOrder: 6
  }
]

const DEFAULT_ORDER_TYPE_PRESET: UiOrderTypeItem[] = [
  {
    code: 'TABLE',
    defaultTitle: '테이블/디자이너 주문',
    customTitle: '',
    displayTitle: '테이블/디자이너 주문',
    description: '매장 내 테이블(룸/디자이너) 주문을 사용합니다.',
    isEnabled: true,
    sortOrder: 1
  },
  {
    code: 'RESERVATION',
    defaultTitle: '예약 주문',
    customTitle: '',
    displayTitle: '예약 주문',
    description: '예약 기반 주문 접수를 사용합니다.',
    isEnabled: true,
    sortOrder: 2
  },
  {
    code: 'DELIVERY',
    defaultTitle: '배달 주문',
    customTitle: '',
    displayTitle: '배달 주문',
    description: '배달 주문 접수를 사용합니다.',
    isEnabled: true,
    sortOrder: 3
  },
  {
    code: 'PICKUP',
    defaultTitle: '픽업 주문',
    customTitle: '',
    displayTitle: '픽업 주문',
    description: '픽업 주문 접수를 사용합니다.',
    isEnabled: true,
    sortOrder: 4
  },
  {
    code: 'QR_ORDER',
    defaultTitle: 'QR 주문',
    customTitle: '',
    displayTitle: 'QR 주문',
    description: '테이블 QR 주문 접수를 사용합니다.',
    isEnabled: true,
    sortOrder: 5
  },
  {
    code: 'KIOSK',
    defaultTitle: '키오스크 주문',
    customTitle: '',
    displayTitle: '키오스크 주문',
    description: '키오스크 주문 접수를 사용합니다.',
    isEnabled: true,
    sortOrder: 6
  }
]

const ORDER_TYPE_CODE_SET = new Set<PosOrderTypeCode>([
  'TABLE',
  'RESERVATION',
  'DELIVERY',
  'PICKUP',
  'QR_ORDER',
  'KIOSK'
])

function toDisplayTitle(item: UiOrderTypeItem): string {
  const custom = String(item.customTitle || '').trim()
  if (custom.length > 0) {
    return custom
  }
  return String(item.defaultTitle || '').trim()
}

export default function PosOrderTypeSettingsPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()

  const [context, setContext] = useState<ProfileContext | null>(null)
  const [orderTypes, setOrderTypes] = useState<UiOrderTypeItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [saveStateText, setSaveStateText] = useState<string>('')

  const [editingCode, setEditingCode] = useState<PosOrderTypeCode | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')

  const enabledCount = useMemo(() => {
    return orderTypes.filter((item) => item.isEnabled).length
  }, [orderTypes])

  const sortedOrderTypes = useMemo(() => {
    return [...orderTypes].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [orderTypes])

  const handleGoPos = () => {
    router.push('/pos')
  }

  const handleGoSettings = () => {
    router.push('/pos/settings')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  useEffect(() => {
    const loadOrderTypes = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')
        setSaveStateText('')

        const me = await getMe()
        const profileType = String(me?.user?.profileType || '')
        const meChannelCode = String(me?.user?.channelCode || '').trim()
        const meProfileId = Number(me?.user?.profileId || 0)

        if (!meChannelCode) {
          throw new Error('BUSINESS channelCode 컨텍스트를 확정할 수 없습니다.')
        }

        let resolvedProfileId = 0

        if (profileType === 'BUSINESS' && meProfileId > 0) {
          resolvedProfileId = meProfileId
        }

        if (!resolvedProfileId) {
          const profile = await getProfileByChannelCode(meChannelCode)
          const profileIdFromSummary = Number(profile?.id || 0)
          const profileTypeFromSummary = String(profile?.profileType || '')

          if (!profileIdFromSummary || profileTypeFromSummary !== 'BUSINESS') {
            throw new Error('BUSINESS profileId 컨텍스트를 확정할 수 없습니다.')
          }

          resolvedProfileId = profileIdFromSummary
        }

        const resolvedContext: ProfileContext = {
          profileId: resolvedProfileId,
          channelCode: meChannelCode
        }

        setContext(resolvedContext)

        const response = await getPosOrderTypes(resolvedContext)
        const items = Array.isArray(response?.items) ? response.items : []

        setOrderTypes(items.length > 0 ? items : FALLBACK_ORDER_TYPES)
      } catch (error) {
        console.error('POS 주문유형 로딩 오류', error)
        setContext(null)
        setOrderTypes([])
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'BUSINESS profileId + channelCode 컨텍스트를 확정할 수 없습니다.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadOrderTypes()
  }, [])

  const handleToggleOrderType = (code: PosOrderTypeCode) => {
    setOrderTypes((prev) => {
      return prev.map((item) => {
        if (item.code !== code) {
          return item
        }
        return {
          ...item,
          isEnabled: !item.isEnabled
        }
      })
    })
    setSaveStateText('')
  }

  const handleStartEdit = (item: UiOrderTypeItem) => {
    setEditingCode(item.code)
    setEditingTitle(toDisplayTitle(item))
    setSaveStateText('')
  }

  const handleCancelEdit = () => {
    setEditingCode(null)
    setEditingTitle('')
  }

  const handleApplyEdit = (code: PosOrderTypeCode) => {
    const nextCustomTitle = editingTitle.trim()
    setOrderTypes((prev) => {
      return prev.map((item) => {
        if (item.code !== code) {
          return item
        }
        return {
          ...item,
          customTitle: nextCustomTitle,
          displayTitle: nextCustomTitle.length > 0
            ? nextCustomTitle
            : item.defaultTitle
        }
      })
    })
    setEditingCode(null)
    setEditingTitle('')
    setSaveStateText('')
  }

  const handleApplyDefaultPreset = () => {
    setOrderTypes(DEFAULT_ORDER_TYPE_PRESET)
    setEditingCode(null)
    setEditingTitle('')
    setErrorMessage('')
    setSaveStateText('기본 주문유형 구성이 화면에 적용되었습니다. 저장 버튼을 눌러 서버에 반영하세요.')
  }

  const handleSave = async () => {
    if (isSaving) {
      return
    }

    if (!context?.profileId || !context?.channelCode) {
      setErrorMessage('BUSINESS profileId + channelCode 컨텍스트가 없어 저장할 수 없습니다.')
      setSaveStateText('')
      return
    }

    if (sortedOrderTypes.length === 0) {
      setErrorMessage('저장할 주문유형 설정이 없습니다.')
      setSaveStateText('')
      return
    }

    if (sortedOrderTypes.some((item) => !ORDER_TYPE_CODE_SET.has(item.code))) {
      setErrorMessage('주문유형 코드가 올바르지 않습니다. QR_ORDER 코드를 사용하세요.')
      setSaveStateText('')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')
      setSaveStateText('')

      const payloadItems: SavePosOrderTypeInput[] = sortedOrderTypes.map((item, index) => {
        return {
          code: item.code,
          customTitle: item.customTitle?.trim().length ? item.customTitle.trim() : null,
          isEnabled: item.isEnabled,
          sortOrder: index + 1
        }
      })

      const saved = await savePosOrderTypes(
        context,
        { items: payloadItems }
      )

      const normalized = Array.isArray(saved?.items) ? saved.items : []
      setOrderTypes(normalized.length > 0 ? normalized : FALLBACK_ORDER_TYPES)
      setSaveStateText('주문유형 설정이 저장되었습니다.')
    } catch (error) {
      console.error('POS 주문유형 저장 오류', error)
      const message = error instanceof Error
        ? error.message
        : '주문유형 저장에 실패했습니다.'
      setErrorMessage(message)
      setSaveStateText('')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="주문 유형 설정"
            onHomeClick={handleGoPos}
            onSettingsClick={handleGoSettings}
            onMyPageClick={handleGoMyPage}
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
          />
        </div>
      </div>

      <main className={styles.shell}>
        <section className={styles.headerCard}>
          <div>
            <h1 className={styles.pageTitle}>주문 유형 설정</h1>
            <p className={styles.pageDescription}>
              주문유형 코드는 고정하고, 화면 표시명은 업종에 맞게 수정할 수 있습니다.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGoSettings}
            >
              뒤로가기
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleApplyDefaultPreset}
              disabled={isSaving}
            >
              기본구성
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? '저장중' : '저장'}
            </button>
          </div>
        </section>

        <section className={styles.summaryCard}>
          <p className={styles.summaryText}>
            활성 주문 유형: <strong>{enabledCount}</strong> / {orderTypes.length}
          </p>
          {saveStateText ? (
            <p className={styles.noticeText}>{saveStateText}</p>
          ) : null}
          {errorMessage ? (
            <p className={styles.noticeText}>{errorMessage}</p>
          ) : null}
        </section>

        <section className={styles.grid}>
          {isLoading ? (
            <article className={styles.orderTypeCard}>
              <p className={styles.cardDescription}>주문유형 설정을 불러오는 중입니다.</p>
            </article>
          ) : null}

          {!isLoading && sortedOrderTypes.length === 0 ? (
            <article className={styles.orderTypeCard}>
              <p className={styles.cardDescription}>주문유형 설정 데이터가 없습니다.</p>
            </article>
          ) : null}

          {!isLoading
            ? sortedOrderTypes.map((item) => {
                const isEditing = editingCode === item.code

                return (
                  <article key={item.code} className={styles.orderTypeCard}>
                    <div className={styles.cardTop}>
                      {isEditing ? (
                        <div className={styles.editWrap}>
                          <label htmlFor={`title-${item.code}`} className={styles.editLabel}>
                            표시명 수정
                          </label>
                          <input
                            id={`title-${item.code}`}
                            className={styles.titleInput}
                            value={editingTitle}
                            onChange={(event) => {
                              setEditingTitle(event.target.value)
                            }}
                            placeholder={item.defaultTitle}
                            maxLength={24}
                          />
                          <div className={styles.editActions}>
                            <button
                              type="button"
                              className={styles.inlinePrimaryButton}
                              onClick={() => handleApplyEdit(item.code)}
                            >
                              적용
                            </button>
                            <button
                              type="button"
                              className={styles.inlineSecondaryButton}
                              onClick={handleCancelEdit}
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className={styles.cardTitle}>{toDisplayTitle(item)}</h2>
                          <p className={styles.cardDefaultTitle}>기본명: {item.defaultTitle}</p>
                          <p className={styles.cardCode}>코드: {item.code}</p>
                          <p className={styles.cardDescription}>{item.description}</p>
                        </>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className={styles.cardBottom}>
                        <button
                          type="button"
                          className={styles.editButton}
                          onClick={() => handleStartEdit(item)}
                        >
                          이름 수정
                        </button>
                        <button
                          type="button"
                          className={item.isEnabled ? styles.enabledButton : styles.disabledButton}
                          onClick={() => handleToggleOrderType(item.code)}
                        >
                          {item.isEnabled ? '사용중' : '미사용'}
                        </button>
                      </div>
                    ) : null}
                  </article>
                )
              })
            : null}
        </section>
      </main>
    </div>
  )
}

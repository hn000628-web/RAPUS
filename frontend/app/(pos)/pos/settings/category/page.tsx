// FILE : frontend/app/(pos)/pos/settings/category/page.tsx
// ROOT : frontend/app/(pos)/pos/settings/category/page.tsx
// STATUS : MODIFY MODE
// ROLE : POS MENU CATEGORY SETTINGS PAGE
// CHANGE SUMMARY :
// - POS 카테고리 API 연동(get/save)
// - getMe() 기반 BUSINESS profile context 확보
// - 로딩/저장/에러 상태 추가
// - 기본 카테고리 fallback 유지

'use client'

// SECTION 01 : IMPORT
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import PosTopbar from '../../components/PosTopbar'
import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import styles from './PosMenuCategoryPage.module.css'
import { getMe } from '@/lib/authApi'
import {
  getPosProductCategories,
  savePosProductCategories,
  type PosProductCategory,
  type SavePosProductCategoryInput
} from '@/lib/business/pos/posCategoriesApi'

// SECTION 02 : TYPE
type PosCategoryItem = {
  id: number
  code: string
  name: string
  sortOrder: number
  isActive: boolean
  isDefault: boolean
  isDeletable: boolean
  ageRestrictionType: string | null
  requiresAdultVerification: boolean
  restrictedOrderChannel: string | null
}

type ProfileContext = {
  profileId: number
  channelCode: string
}

const DEFAULT_POS_CATEGORY_PRESET: PosCategoryItem[] = [
  {
    id: 1,
    code: 'MAIN',
    name: '메인 메뉴',
    sortOrder: 1,
    isActive: true,
    isDefault: true,
    isDeletable: false,
    ageRestrictionType: null,
    requiresAdultVerification: false,
    restrictedOrderChannel: null
  },
  {
    id: 2,
    code: 'SUB',
    name: '서브 메뉴',
    sortOrder: 2,
    isActive: true,
    isDefault: true,
    isDeletable: true,
    ageRestrictionType: null,
    requiresAdultVerification: false,
    restrictedOrderChannel: null
  },
  {
    id: 3,
    code: 'DRINK',
    name: '음료',
    sortOrder: 3,
    isActive: true,
    isDefault: true,
    isDeletable: true,
    ageRestrictionType: null,
    requiresAdultVerification: false,
    restrictedOrderChannel: null
  },
  {
    id: 4,
    code: 'SIDE',
    name: '사이드',
    sortOrder: 4,
    isActive: true,
    isDefault: true,
    isDeletable: true,
    ageRestrictionType: null,
    requiresAdultVerification: false,
    restrictedOrderChannel: null
  },
  {
    id: 5,
    code: 'ALCOHOL',
    name: '주류',
    sortOrder: 5,
    isActive: true,
    isDefault: true,
    isDeletable: true,
    ageRestrictionType: 'ADULT_19',
    requiresAdultVerification: true,
    restrictedOrderChannel: 'QR_ORDER'
  }
]

// SECTION 03 : COMPONENT
export default function PosMenuCategoryPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [categories, setCategories] = useState<PosCategoryItem[]>([])
  const [context, setContext] = useState<ProfileContext | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const normalizeApiRows = (rows: PosProductCategory[]): PosCategoryItem[] => {
    return [...rows]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        id: row.id,
        code: String(row.categoryCode || '').trim() || 'CUSTOM',
        name: String(row.categoryName || '').trim() || '새 카테고리',
        sortOrder: Number(row.sortOrder || 0),
        isActive: Number(row.isActive || 0) === 1,
        isDefault: Number(row.isDefault || 0) === 1,
        isDeletable: Number(row.isDeletable || 0) === 1,
        ageRestrictionType: row.ageRestrictionType
          ? String(row.ageRestrictionType).trim().toUpperCase()
          : null,
        requiresAdultVerification: Number(row.requiresAdultVerification || 0) === 1,
        restrictedOrderChannel: row.restrictedOrderChannel
          ? String(row.restrictedOrderChannel).trim().toUpperCase()
          : null
      }))
  }

  const toSavePayloadRows = (items: PosCategoryItem[]): SavePosProductCategoryInput[] => {
    return [...items]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item, index) => {
        const isAlcoholCode =
          String(item.code || '').trim().toUpperCase() === 'ALCOHOL'

        return {
        id: item.id > 0 ? item.id : undefined,
        categoryCode: String(item.code || '').trim() || `CUSTOM_${index + 1}`,
        categoryName: String(item.name || '').trim(),
        sortOrder: index + 1,
        isActive: item.isActive ? 1 : 0,
        isDefault: item.isDefault ? 1 : 0,
        isDeletable: item.isDeletable ? 1 : 0,
        ageRestrictionType: isAlcoholCode
          ? 'ADULT_19'
          : item.requiresAdultVerification
          ? (item.ageRestrictionType || 'ADULT_19')
          : null,
        requiresAdultVerification: isAlcoholCode
          ? 1
          : item.requiresAdultVerification ? 1 : 0,
        restrictedOrderChannel: isAlcoholCode
          ? 'QR_ORDER'
          : item.requiresAdultVerification
          ? (item.restrictedOrderChannel || 'QR_ORDER')
          : null
        }
      })
  }

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const me = await getMe()
        const profileId = Number(me?.user?.profileId || 0)
        const channelCode = String(me?.user?.channelCode || '').trim()
        const profileType = String(me?.user?.profileType || '')

        if (!profileId || !channelCode || profileType !== 'BUSINESS') {
          throw new Error('프로필 컨텍스트를 확인할 수 없습니다.')
        }

        setContext({
          profileId,
          channelCode
        })

        const response = await getPosProductCategories()
        const normalized = normalizeApiRows(response.categories)
        setCategories(normalized)
      } catch (error) {
        console.error('POS 카테고리 로딩 오류', error)
        setCategories([])
        setErrorMessage('카테고리 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    void init()
  }, [])

  const handleGoPos = () => {
    router.push('/pos')
  }

  const handleGoPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleSettingsClick = () => {
    router.push('/pos/settings')
  }

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  )

  const handleSave = async () => {
    if (isSaving) {
      return
    }

    if (!context?.profileId || !context?.channelCode) {
      setErrorMessage('프로필 컨텍스트를 확인할 수 없습니다.')
      window.alert('프로필 컨텍스트를 확인할 수 없습니다.')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')

      const payloadRows = toSavePayloadRows(categories)
      if (payloadRows.length === 0) {
        throw new Error('저장할 카테고리가 없습니다. 기본구성을 눌러 세팅하세요.')
      }

      if (payloadRows.some((item) => !item.categoryName.trim())) {
        throw new Error('카테고리명을 입력해주세요.')
      }

      await savePosProductCategories({
        profileId: context.profileId,
        channelCode: context.channelCode,
        categories: payloadRows
      })

      const refreshed = await getPosProductCategories()
      const normalized = normalizeApiRows(refreshed.categories)
      setCategories(normalized)

      window.alert('POS 카테고리 설정이 저장되었습니다.')
    } catch (error) {
      console.error('POS 카테고리 저장 오류', error)
      const message = error instanceof Error
        ? error.message
        : '카테고리 저장에 실패했습니다.'

      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeName = (id: number, value: string) => {
    setCategories((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, name: value }
          : item
      )
    )
  }

  const moveUp = (id: number) => {
    setCategories((prev) => {
      const arr = [...prev].sort((a, b) => a.sortOrder - b.sortOrder)
      const index = arr.findIndex((item) => item.id === id)
      if (index <= 0) {
        return prev
      }
      ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
      return arr.map((item, idx) => ({
        ...item,
        sortOrder: idx + 1
      }))
    })
  }

  const moveDown = (id: number) => {
    setCategories((prev) => {
      const arr = [...prev].sort((a, b) => a.sortOrder - b.sortOrder)
      const index = arr.findIndex((item) => item.id === id)
      if (index < 0 || index === arr.length - 1) {
        return prev
      }
      ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
      return arr.map((item, idx) => ({
        ...item,
        sortOrder: idx + 1
      }))
    })
  }

  const toggleActive = (id: number) => {
    setCategories((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isActive: !item.isActive }
          : item
      )
    )
  }

  const toggleAdultVerification = (id: number) => {
    setCategories((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item
        }
        if (String(item.code || '').trim().toUpperCase() === 'ALCOHOL') {
          return {
            ...item,
            requiresAdultVerification: true,
            ageRestrictionType: 'ADULT_19',
            restrictedOrderChannel: 'QR_ORDER'
          }
        }

        const nextValue = !item.requiresAdultVerification
        return {
          ...item,
          requiresAdultVerification: nextValue,
          ageRestrictionType: nextValue ? (item.ageRestrictionType || 'ADULT_19') : null,
          restrictedOrderChannel: nextValue ? (item.restrictedOrderChannel || 'QR_ORDER') : null
        }
      })
    )
  }

  const removeCategory = (id: number) => {
    setCategories((prev) => {
      const target = prev.find((item) => item.id === id)
      if (!target || !target.isDeletable) {
        return prev
      }
      const filtered = prev.filter((item) => item.id !== id)
      return filtered
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item, idx) => ({
          ...item,
          sortOrder: idx + 1
        }))
    })
  }

  const addCustomCategory = () => {
    setCategories((prev) => {
      const nextId = prev.length > 0
        ? Math.max(...prev.map((item) => item.id)) + 1
        : 1

      const nextOrder = prev.length > 0
        ? Math.max(...prev.map((item) => item.sortOrder)) + 1
        : 1

      const existingCodes = new Set(
        prev.map((item) => String(item.code || '').trim().toUpperCase())
      )

      let customIndex = 1
      let customCode = `CUSTOM_${customIndex}`
      while (existingCodes.has(customCode)) {
        customIndex += 1
        customCode = `CUSTOM_${customIndex}`
      }

      return [
        ...prev,
        {
          id: nextId,
          code: customCode,
          name: '새 카테고리',
          sortOrder: nextOrder,
          isActive: true,
          isDefault: false,
          isDeletable: true,
          ageRestrictionType: null,
          requiresAdultVerification: false,
          restrictedOrderChannel: null
        }
      ]
    })
  }

  const handleApplyDefaultPreset = () => {
    setCategories(
      DEFAULT_POS_CATEGORY_PRESET.map((item) => ({ ...item }))
    )
    setErrorMessage('기본 카테고리 구성이 화면에 적용되었습니다. 저장 버튼을 눌러 DB에 반영하세요.')
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbarWrap}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="카테고리 설정"
            onHomeClick={handleGoPos}
            onSettingsClick={handleSettingsClick}
            onMyPageClick={handleGoMyPage}
            syncStatus="ONLINE"
            homeShortcutLabel="F1"
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
          />
        </div>
      </div>

      <main className={styles.content}>
        <section className={styles.headerCard}>
          <div className={styles.titleWrap}>
            <h1 className={styles.title}>POS 카테고리 관리</h1>
            <p className={styles.description}>POS 메뉴와 상품을 분류할 카테고리를 관리합니다.</p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGoPosSettings}
            >
              뒤로가기
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGoPosSettings}
            >
              POS 설정
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
              className={styles.secondaryButton}
              onClick={addCustomCategory}
            >
              카테고리 추가
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>기본 세팅 + 커스텀 카테고리</h2>
          <p className={styles.cardDescription}>
            한 화면에서 카테고리명, 순서, 활성 상태를 바로 수정합니다.
          </p>
          {isLoading && (
            <p className={styles.cardDescription}>카테고리를 불러오는 중입니다.</p>
          )}
          {!isLoading && errorMessage && (
            <p className={styles.cardDescription}>{errorMessage}</p>
          )}

          {!isLoading && !errorMessage && sortedCategories.length === 0 && (
            <p className={styles.cardDescription}>
              등록된 POS 카테고리가 없습니다. 기본구성을 눌러 기본 카테고리를 세팅하세요.
            </p>
          )}

          <div className={styles.rowList}>
            {sortedCategories.map((item) => (
              <article key={item.id} className={styles.rowCard}>
                <div className={styles.rowCode}>
                  {String(item.code || '').trim().toUpperCase() === 'ALCOHOL'
                    ? '알콜'
                    : item.code}
                </div>

                <div className={styles.rowNameField}>
                  <label className={styles.rowLabel}>카테고리명</label>
                  <input
                    className={styles.nameInput}
                    value={item.name}
                    onChange={(event) => handleChangeName(item.id, event.target.value)}
                  />
                </div>

                <div className={styles.rowOrderField}>
                  <label className={styles.rowLabel}>순서</label>
                  <div className={styles.orderButtonRow}>
                    <button
                      type="button"
                      className={styles.smallButton}
                      onClick={() => moveUp(item.id)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.smallButton}
                      onClick={() => moveDown(item.id)}
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className={styles.rowBadgeField}>
                  <label className={styles.rowLabel}>기본값</label>
                  <span className={styles.badgeDefault}>
                    {item.isDefault ? '기본' : '커스텀'}
                  </span>
                </div>

                <div className={styles.rowToggleField}>
                  <label className={styles.rowLabel}>상태</label>
                  <button
                    type="button"
                    className={item.isActive ? styles.toggleOn : styles.toggleOff}
                    onClick={() => toggleActive(item.id)}
                  >
                    {item.isActive ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className={styles.rowToggleField}>
                  <label className={styles.rowLabel}>성인인증</label>
                  <button
                    type="button"
                    className={item.requiresAdultVerification ? styles.toggleOn : styles.toggleOff}
                    onClick={() => toggleAdultVerification(item.id)}
                    disabled={String(item.code || '').trim().toUpperCase() === 'ALCOHOL'}
                  >
                    {item.requiresAdultVerification ? '필요' : '불필요'}
                  </button>
                </div>

                <div className={styles.rowDeleteField}>
                  <label className={styles.rowLabel}>삭제</label>
                  <button
                    type="button"
                    className={item.isDeletable ? styles.deleteButton : styles.lockButton}
                    onClick={() => removeCategory(item.id)}
                    disabled={!item.isDeletable}
                  >
                    {item.isDeletable ? '삭제' : '삭제불가'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

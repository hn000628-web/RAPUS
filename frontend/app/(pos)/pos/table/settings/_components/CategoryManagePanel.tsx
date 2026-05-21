'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import BaseModal from '@/components/ui/modal/BaseModal'
import { getMe } from '@/lib/authApi'
import {
  getPosProductCategories,
  savePosProductCategories,
  type PosProductCategory
} from '@/lib/business/pos/posCategoriesApi'
import {
  emitPosTableSettingsSync,
  subscribePosTableSettingsSync,
  type PosTableSettingsSyncReason
} from '@/lib/business/pos/shared/posTableSettingsRuntimeSync'

import styles from '../PosTableSettingsPage.module.css'

type BusinessContext = {
  profileId: number
  channelCode: string
}

type CategoryManagePanelProps = {
  onSaveActionChange?: (action: (() => Promise<boolean>) | null) => void
  onCreateActionChange?: (action: (() => void) | null) => void
  onSavingChange?: (saving: boolean) => void
  onSaveSuccess?: () => void
  viewMode?: 'DASHBOARD' | 'LIST'
  hideCreateButton?: boolean
}

type CategoryItem = {
  id: string
  categoryCode: string
  categoryName: string
  sortOrder: number
  isDefault: boolean
  isRequired: boolean
  isActive: boolean
  requiresAdultVerification: boolean
  deletable: boolean
}

type PresetCategory = {
  key: string
  label: string
  categoryCode: string
  categoryName: string
}

const PRESET_CATEGORIES: PresetCategory[] = [
  { key: 'MAIN', label: '메인', categoryCode: 'MAIN', categoryName: '메인 메뉴' },
  { key: 'SUB', label: '서브', categoryCode: 'SUB', categoryName: '서브 메뉴' },
  { key: 'SIDE', label: 'SIDE', categoryCode: 'SIDE', categoryName: 'SIDE CATEGORY' },
  { key: 'DRINK', label: 'DRINK', categoryCode: 'DRINK', categoryName: 'DRINK CATEGORY' },
  { key: 'SERVICE', label: 'SERVICE', categoryCode: 'CUSTOM', categoryName: 'SERVICE CATEGORY' },
  { key: 'ALCOHOL', label: '주류', categoryCode: 'ALCOHOL', categoryName: '주류' },
  { key: 'CUSTOM', label: '커스텀', categoryCode: 'CUSTOM', categoryName: '새 카테고리' }
]

const MAX_CATEGORY_COUNT = 10

const PRESET_MODAL_OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  background: 'rgba(15, 23, 42, 0.62)'
}

const PRESET_MODAL_CARD_STYLE: React.CSSProperties = {
  width: 'min(620px, 100%)',
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  boxShadow: '0 24px 48px rgba(15, 23, 42, 0.22)',
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 12
}

const PRESET_MODAL_TITLE_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 900,
  color: '#0f172a'
}

const PRESET_MODAL_DESC_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: '#64748b'
}

const PRESET_GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8
}

const PRESET_BUTTON_STYLE: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  background: '#f8fafc',
  color: '#0f172a',
  fontWeight: 800,
  fontSize: 14,
  height: 40,
  cursor: 'pointer'
}

const PRESET_DISABLED_BUTTON_STYLE: React.CSSProperties = {
  ...PRESET_BUTTON_STYLE,
  cursor: 'not-allowed',
  opacity: 0.45
}

const PRESET_ACTION_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8
}

const PRESET_CLOSE_BUTTON_STYLE: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  background: '#ffffff',
  color: '#0f172a',
  fontWeight: 800,
  fontSize: 14,
  height: 40,
  minWidth: 88,
  cursor: 'pointer'
}

function mapCategoryRowToItem(row: PosProductCategory): CategoryItem {
  const code = String(row.categoryCode || '').trim().toUpperCase() || 'CUSTOM'

  return {
    id: String(row.id),
    categoryCode: code,
    categoryName: String(row.categoryName || '').trim() || '카테고리',
    sortOrder: Number(row.sortOrder || 0),
    isDefault: Number(row.isDefault || 0) === 1,
    isRequired: code === 'MAIN',
    isActive: Number(row.isActive || 0) === 1,
    requiresAdultVerification: Number(row.requiresAdultVerification || 0) === 1,
    deletable: Number(row.isDeletable || 0) === 1
  }
}

function resequence(items: CategoryItem[]): CategoryItem[] {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index + 1
  }))
}

function sortByOrder(items: CategoryItem[]): CategoryItem[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder)
}

function normalizeCategoryPayloadItems(items: CategoryItem[]) {
  return resequence(sortByOrder(items)).map((item) => ({
    categoryCode: item.categoryCode,
    categoryName: item.categoryName.trim() || '카테고리',
    sortOrder: item.sortOrder,
    isActive: item.isActive ? 1 : 0,
    isDefault: item.isDefault ? 1 : 0,
    isDeletable: item.deletable ? 1 : 0,
    requiresAdultVerification: item.requiresAdultVerification ? 1 : 0,
    ageRestrictionType: item.requiresAdultVerification ? 'ADULT_19' : null,
    restrictedOrderChannel: item.requiresAdultVerification ? 'QR_ORDER' : null
  }))
}

export default function CategoryManagePanel({
  onSaveActionChange,
  onCreateActionChange,
  onSavingChange,
  onSaveSuccess,
  viewMode = 'LIST',
  hideCreateButton
}: CategoryManagePanelProps) {
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false)
  const [isCreateSuccessModalOpen, setIsCreateSuccessModalOpen] = useState<boolean>(false)

  const loadCategories = useCallback(async () => {
    setIsLoading(true)

    try {
      const me = await getMe()
      const user = me.user

      if (user.profileType !== 'BUSINESS') {
        setCategories([])
        setBusinessContext(null)
        return
      }

      const context: BusinessContext = {
        profileId: Number(user.profileId),
        channelCode: String(user.channelCode)
      }

      setBusinessContext(context)

      const response = await getPosProductCategories()
      const nextItems = resequence(
        sortByOrder((response.categories ?? []).map(mapCategoryRowToItem))
      )

      setCategories(nextItems)
    } catch (error) {
      console.error('카테고리 목록 조회 실패', error)
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const persistCategories = useCallback(
    async (
      nextItems: CategoryItem[],
      reason: PosTableSettingsSyncReason
    ) => {
      if (!businessContext || isSaving) {
        return false
      }

      setIsSaving(true)

      try {
        const payloadItems = normalizeCategoryPayloadItems(nextItems)

        await savePosProductCategories({
          profileId: businessContext.profileId,
          channelCode: businessContext.channelCode,
          categories: payloadItems
        })

        emitPosTableSettingsSync({
          channelCode: businessContext.channelCode,
          reason
        })

        await loadCategories()
        return true
      } catch (error) {
        console.error('카테고리 저장 실패', error)
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [businessContext, isSaving, loadCategories]
  )

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    onSavingChange?.(isSaving)
  }, [isSaving, onSavingChange])

  const handleSaveCurrentState = useCallback(async (): Promise<boolean> => {
    const saved = await persistCategories(categories, 'save')

    if (saved) {
      onSaveSuccess?.()
    }

    return saved
  }, [categories, persistCategories, onSaveSuccess])

  useEffect(() => {
    onSaveActionChange?.(handleSaveCurrentState)

    return () => {
      onSaveActionChange?.(null)
    }
  }, [handleSaveCurrentState, onSaveActionChange])

  useEffect(() => {
    if (!businessContext?.channelCode) {
      return
    }

    return subscribePosTableSettingsSync({
      channelCode: businessContext.channelCode,
      onSync: () => {
        void loadCategories()
      }
    })
  }, [businessContext?.channelCode, loadCategories])

  const summary = useMemo(() => {
    const total = categories.length
    const defaults = categories.filter((item) => item.isDefault).length
    const active = categories.filter((item) => item.isActive).length
    const inactive = categories.filter((item) => !item.isActive).length

    return { total, defaults, active, inactive }
  }, [categories])

  const activeCategoryCount = useMemo(
    () => summary.active,
    [summary.active]
  )

  const isCategoryLimitReached =
    activeCategoryCount >= MAX_CATEGORY_COUNT

  const handleCreateByPreset = async (preset: PresetCategory) => {
    if (isSaving) {
      return
    }

    const normalizedCode =
      String(preset.categoryCode || '').trim().toUpperCase()

    let nextItems = [...categories]

    if (normalizedCode === 'CUSTOM') {
      const inactiveCustomIndex = nextItems.findIndex(
        (item) =>
          String(item.categoryCode || '').trim().toUpperCase().startsWith('CUSTOM') &&
          !item.isActive
      )

      if (inactiveCustomIndex >= 0) {
        const target = nextItems[inactiveCustomIndex]
        nextItems[inactiveCustomIndex] = {
          ...target,
          categoryName: preset.categoryName,
          isActive: true
        }
      } else {
        if (isCategoryLimitReached) {
          return
        }

        const existingCustomCodes = new Set(
          categories
            .map((item) => String(item.categoryCode || '').trim().toUpperCase())
            .filter((code) => code.startsWith('CUSTOM'))
        )

        let nextIndex = 1
        while (existingCustomCodes.has(`CUSTOM${nextIndex}`)) {
          nextIndex += 1
        }

        nextItems.push({
          id: `new-${preset.key}-${Date.now()}`,
          categoryCode: `CUSTOM${nextIndex}`,
          categoryName: preset.categoryName,
          sortOrder: nextItems.length + 1,
          isDefault: false,
          isRequired: false,
          isActive: true,
          requiresAdultVerification: false,
          deletable: true
        })
      }
    } else {
      const targetIndex = nextItems.findIndex(
        (item) => String(item.categoryCode || '').trim().toUpperCase() === normalizedCode
      )

      if (targetIndex >= 0) {
        const target = nextItems[targetIndex]
        nextItems[targetIndex] = {
          ...target,
          categoryName: preset.categoryName,
          isActive: true,
          requiresAdultVerification: normalizedCode === 'ALCOHOL'
        }
      } else {
        if (isCategoryLimitReached) {
          return
        }

        nextItems.push({
          id: `new-${preset.key}-${Date.now()}`,
          categoryCode: normalizedCode,
          categoryName: preset.categoryName,
          sortOrder: nextItems.length + 1,
          isDefault: normalizedCode !== 'CUSTOM',
          isRequired: normalizedCode === 'MAIN',
          isActive: true,
          requiresAdultVerification: normalizedCode === 'ALCOHOL',
          deletable: normalizedCode !== 'MAIN'
        })
      }
    }

    nextItems = resequence(nextItems)

    setCategories(nextItems)
    const saved = await persistCategories(nextItems, 'create')

    if (saved) {
      setIsPresetModalOpen(false)
      setIsCreateSuccessModalOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    const nextItems = resequence(
      categories.map((item) => {
        if (item.id !== id) {
          return item
        }

        return {
          ...item,
          isActive: false
        }
      })
    )

    setCategories(nextItems.filter((item) => item.isActive))
    await persistCategories(nextItems, 'soft-disconnect')
  }

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= categories.length) {
      return
    }

    const nextItems = [...categories]
    ;[nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]]
    const resequenced = resequence(nextItems)

    setCategories(resequenced)
    await persistCategories(resequenced, 'update')
  }

  const handleToggleActive = async (id: string) => {
    const nextItems = resequence(
      categories.map((item) => {
        if (item.id !== id) {
          return item
        }

        if (item.categoryCode === 'MAIN' && item.isRequired) {
          return item
        }

        return {
          ...item,
          isActive: !item.isActive
        }
      })
    )

    setCategories(nextItems)
    await persistCategories(nextItems, 'update')
  }

  const handleNameChange = (id: string, categoryName: string) => {
    setCategories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, categoryName } : item))
    )
  }

  const handleNameCommit = async () => {
    await persistCategories(categories, 'update')
  }

  const handleOpenCreateModal = useCallback(() => {
    setIsPresetModalOpen(true)
  }, [])

  useEffect(() => {
    onCreateActionChange?.(handleOpenCreateModal)

    return () => {
      onCreateActionChange?.(null)
    }
  }, [handleOpenCreateModal, onCreateActionChange])

  return (
    <section className={styles.categoryPanel}>
      <header className={styles.panelHeader}>
        <div>
          <h2 className={styles.moduleTitle}>카테고리관리</h2>
        </div>
        <div className={styles.panelActions}>
          {!hideCreateButton ? (
            <button
              type="button"
              className={styles.primaryInlineButton}
              onClick={handleOpenCreateModal}
              disabled={isSaving || isCategoryLimitReached}
            >
              + 카테고리추가
            </button>
          ) : null}
        </div>
      </header>

      {viewMode === 'DASHBOARD' ? (
        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>전체 카테고리</p>
            <p className={styles.summaryValue}>{summary.total}개</p>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>기본 카테고리</p>
            <p className={styles.summaryValue}>{summary.defaults}개</p>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>활성 카테고리</p>
            <p className={styles.summaryValue}>{summary.active}개</p>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>비활성 카테고리</p>
            <p className={styles.summaryValue}>{summary.inactive}개</p>
          </article>
        </div>
      ) : (
        <article className={styles.categoryEditorCard}>
          <div className={styles.editorTitleBlock}>
            <h3 className={styles.editorTitle}>카테고리 목록</h3>
            <p className={styles.editorDescription}>수정/삭제가 즉시 반영되고 목록이 자동 동기화됩니다.</p>
          </div>

          <div className={styles.categoryRows}>
            {categories.map((item, index) => {
              const isFirst = index === 0
              const isLast = index === categories.length - 1
              const activeLock = item.categoryCode === 'MAIN' && item.isRequired

              return (
                <article key={item.id} className={styles.categoryRow}>
                  <div className={styles.categoryCodeArea}>
                    <p className={styles.categoryCode}>{item.categoryCode}</p>
                    <button
                      type="button"
                      className={item.deletable ? styles.deleteButton : styles.deleteBlockedButton}
                      disabled={!item.deletable || isSaving}
                      onClick={() => {
                        if (!item.deletable) {
                          return
                        }
                        void handleDelete(item.id)
                      }}
                    >
                      삭제
                    </button>
                  </div>

                  <div className={styles.categoryNameArea}>
                    <label htmlFor={`category-name-${item.id}`} className={styles.categoryLabel}>
                      카테고리명
                    </label>
                    <input
                      id={`category-name-${item.id}`}
                      className={styles.categoryInput}
                      value={item.categoryName}
                      onChange={(event) => handleNameChange(item.id, event.target.value)}
                      onBlur={() => {
                        void handleNameCommit()
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleNameCommit()
                        }
                      }}
                      disabled={isSaving}
                    />
                  </div>

                  <div className={styles.categoryControlArea}>
                    <div className={styles.controlBlock}>
                      <span className={styles.controlLabel}>정렬</span>
                      <div className={styles.reorderButtons}>
                        <button
                          type="button"
                          className={styles.reorderButton}
                          disabled={isFirst || isSaving}
                          onClick={() => {
                            void handleMove(index, -1)
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={styles.reorderButton}
                          disabled={isLast || isSaving}
                          onClick={() => {
                            void handleMove(index, 1)
                          }}
                        >
                          ↓
                        </button>
                      </div>
                    </div>

                    <div className={styles.controlBlock}>
                      <span className={styles.controlLabel}>기본값</span>
                      <span className={styles.itemBadge}>{item.isDefault ? '기본' : '커스텀'}</span>
                    </div>

                    <div className={styles.controlBlock}>
                      <span className={styles.controlLabel}>운영 상태</span>
                      <button
                        type="button"
                        className={`${styles.pillButton} ${item.isActive ? styles.pillButtonActive : ''}`}
                        onClick={() => {
                          void handleToggleActive(item.id)
                        }}
                        disabled={(activeLock && item.isActive) || isSaving}
                      >
                        {item.isActive ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div className={styles.controlBlock}>
                      <span className={styles.controlLabel}>권한/유형</span>
                      <span className={styles.itemBadge}>
                        {item.requiresAdultVerification ? 'ADULT' : 'NORMAL'}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </article>
      )}

      {isPresetModalOpen && typeof document !== 'undefined'
        ? createPortal(
            <div style={PRESET_MODAL_OVERLAY_STYLE}>
              <div style={PRESET_MODAL_CARD_STYLE}>
                <h3 style={PRESET_MODAL_TITLE_STYLE}>카테고리 추가</h3>
                <p style={PRESET_MODAL_DESC_STYLE}>추가할 카테고리 유형을 선택해 주세요.</p>

                <div style={PRESET_GRID_STYLE}>
                  {PRESET_CATEGORIES.map((preset) => {
                    const isExistingCode =
                      preset.categoryCode !== 'CUSTOM' &&
                      categories.some(
                        (item) =>
                          String(item.categoryCode || '').trim().toUpperCase() ===
                          String(preset.categoryCode || '').trim().toUpperCase()
                      )

                    const isPresetDisabled =
                      isSaving ||
                      (isCategoryLimitReached && !isExistingCode)

                    return (
                      <button
                        key={preset.key}
                        type="button"
                        style={isPresetDisabled ? PRESET_DISABLED_BUTTON_STYLE : PRESET_BUTTON_STYLE}
                        disabled={isPresetDisabled}
                        onClick={() => {
                          void handleCreateByPreset(preset)
                        }}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                <div style={PRESET_ACTION_ROW_STYLE}>
                  <button
                    type="button"
                    style={PRESET_CLOSE_BUTTON_STYLE}
                    onClick={() => setIsPresetModalOpen(false)}
                    disabled={isSaving}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      <BaseModal
        open={isCreateSuccessModalOpen}
        type="success"
        title="카테고리 추가 완료"
        description="선택한 카테고리가 등록되었습니다."
        onClose={() => setIsCreateSuccessModalOpen(false)}
      />
    </section>
  )
}

// FILE : frontend/app/(pos)/pos/table/settings/_components/TableLayoutPanel.tsx
// ROOT : frontend/app/(pos)/pos/table/settings/_components/TableLayoutPanel.tsx
// STATUS : CREATE
// ROLE : POS TABLE SETTINGS LAYOUT PANEL

'use client'

// SECTION 01 : IMPORT
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'

import { getMe } from '@/lib/authApi'
import {
  getPosTableSettings,
  type PosResourceType,
  type PosTableSettingItem,
  updatePosTableSetting
} from '@/lib/business/pos/posTableSettingsApi'
import {
  emitPosTableSettingsSync,
  subscribePosTableSettingsSync
} from '@/lib/business/pos/shared/posTableSettingsRuntimeSync'

import styles from '../PosTableSettingsPage.module.css'

// SECTION 02 : TYPE
type TableLayoutPanelProps = {
  hideHeader?: boolean
  controlSlot?: HTMLElement | null
  editorSlot?: HTMLElement | null
  onSaveActionChange?: (action: (() => Promise<boolean>) | null) => void
  onSavingChange?: (saving: boolean) => void
  onSaveSuccess?: () => void
}

type BusinessContext = {
  profileId: number
  channelCode: string
}

type LayoutCardItem = {
  id: string
  tableName: string
  floor: string
  zone: string
  resourceStatusLabel: string
  layoutX: number
  layoutY: number
  layoutWidth: number
  layoutHeight: number
  layoutRotate: number
  layoutShape: string
}

type DragState = {
  id: string
  startClientX: number
  startClientY: number
  startX: number
  startY: number
}

type LayoutEditForm = {
  layoutWidth: string
  layoutHeight: string
  layoutRotate: string
  layoutShape: string
}

type LayoutSnapshot = {
  id: string
  layoutX: number
  layoutY: number
  layoutWidth: number
  layoutHeight: number
  layoutRotate: number
  layoutShape: string
}

type LayoutScalePreset = {
  key: string
  label: string
  width: number
  height: number
}

// SECTION 03 : CONSTANT
const CANVAS_PADDING = 24
const GRID_COLUMN_WIDTH = 210
const GRID_ROW_HEIGHT = 170
const DEFAULT_LAYOUT = {
  layoutX: 0,
  layoutY: 0,
  layoutWidth: 180,
  layoutHeight: 156,
  layoutRotate: 0,
  layoutShape: 'RECT'
}
const LAYOUT_SHAPE_OPTIONS = [
  { value: 'RECT', label: '사각 테이블' },
  { value: 'ROUND', label: '원형 테이블' },
  { value: 'ROOM', label: '룸/객실형' }
]
const LAYOUT_SCALE_PRESETS: LayoutScalePreset[] = [
  { key: 'DEFAULT', label: '기본', width: 180, height: 156 },
  { key: 'SQUARE', label: '정사각', width: 140, height: 140 },
  { key: 'HORIZONTAL', label: '가로형', width: 220, height: 120 },
  { key: 'VERTICAL', label: '세로형', width: 120, height: 220 },
  { key: 'WIDE', label: '긴 가로형', width: 320, height: 100 },
  { key: 'TALL', label: '긴 세로형', width: 100, height: 320 }
]

// SECTION 04 : UTIL
function toResourceStatusLabel(status: string | undefined): string {
  if (status === 'IN_USE') {
    return '사용중'
  }

  if (status === 'RESERVED') {
    return '예약'
  }

  if (status === 'WAITING') {
    return '대기중'
  }

  if (status === 'AVAILABLE') {
    return '비어있음'
  }

  return '비어있음'
}

function getFallbackLayout(index: number) {
  return {
    layoutX: CANVAS_PADDING + (index % 4) * GRID_COLUMN_WIDTH,
    layoutY: CANVAS_PADDING + Math.floor(index / 4) * GRID_ROW_HEIGHT
  }
}

function normalizeLayoutDimensions(
  shape: string,
  width: number,
  height: number
): { width: number; height: number } {
  const normalizedShape =
    String(shape ?? '').trim().toUpperCase()
  const safeWidth =
    Math.max(40, Math.round(width) || DEFAULT_LAYOUT.layoutWidth)
  const safeHeight =
    Math.max(40, Math.round(height) || DEFAULT_LAYOUT.layoutHeight)

  if (normalizedShape === 'ROUND') {
    return {
      width: Math.max(188, safeWidth),
      height: Math.max(188, safeHeight)
    }
  }

  if (safeHeight > safeWidth * 1.5) {
    return {
      width: Math.max(110, safeWidth),
      height: Math.max(220, safeHeight)
    }
  }

  return {
    width: Math.max(180, safeWidth),
    height: Math.max(156, safeHeight)
  }
}

function mapTableSettingToLayoutCard(
  item: PosTableSettingItem,
  index: number
): LayoutCardItem {
  const fallbackLayout =
    getFallbackLayout(index)
  const rawLayoutX =
    Number(item.layoutX ?? 0)
  const rawLayoutY =
    Number(item.layoutY ?? 0)
  const hasSavedPosition =
    rawLayoutX !== 0 || rawLayoutY !== 0
  const normalizedDimensions =
    normalizeLayoutDimensions(
      String(item.layoutShape ?? '').trim() || 'RECT',
      Number(item.layoutWidth ?? 180) || 180,
      Number(item.layoutHeight ?? 156) || 156
    )

  return {
    id: String(item.id),
    tableName: String(item.tableName ?? '').trim() || `테이블 ${item.id}`,
    floor: String(item.floor ?? '').trim() || '1층',
    zone: String(item.zone ?? '').trim() || '홀',
    resourceStatusLabel: toResourceStatusLabel(item.resourceStatus),
    layoutX: hasSavedPosition ? rawLayoutX : fallbackLayout.layoutX,
    layoutY: hasSavedPosition ? rawLayoutY : fallbackLayout.layoutY,
    layoutWidth: normalizedDimensions.width,
    layoutHeight: normalizedDimensions.height,
    layoutRotate: Number(item.layoutRotate ?? 0) || 0,
    layoutShape: String(item.layoutShape ?? '').trim() || 'RECT'
  }
}

function getDistinctOptions(
  cards: LayoutCardItem[],
  key: 'floor' | 'zone'
): string[] {
  return Array.from(
    new Set(
      cards
        .map((card) => card[key].trim())
        .filter(Boolean)
    )
  )
}

function getLayoutSnapshot(card: LayoutCardItem): LayoutSnapshot {
  return {
    id: card.id,
    layoutX: Math.round(card.layoutX),
    layoutY: Math.round(card.layoutY),
    layoutWidth: Math.round(card.layoutWidth),
    layoutHeight: Math.round(card.layoutHeight),
    layoutRotate: Math.round(card.layoutRotate),
    layoutShape: card.layoutShape
  }
}

function areLayoutSnapshotsEqual(
  currentSnapshot: LayoutSnapshot,
  originalSnapshot: LayoutSnapshot | undefined
): boolean {
  if (!originalSnapshot) {
    return false
  }

  return currentSnapshot.layoutX === originalSnapshot.layoutX &&
    currentSnapshot.layoutY === originalSnapshot.layoutY &&
    currentSnapshot.layoutWidth === originalSnapshot.layoutWidth &&
    currentSnapshot.layoutHeight === originalSnapshot.layoutHeight &&
    currentSnapshot.layoutRotate === originalSnapshot.layoutRotate &&
    currentSnapshot.layoutShape === originalSnapshot.layoutShape
}

function getDirtyIdsFromCards(
  cards: LayoutCardItem[],
  originalLayouts: Record<string, LayoutSnapshot>
): string[] {
  return cards
    .filter((card) => !areLayoutSnapshotsEqual(getLayoutSnapshot(card), originalLayouts[card.id]))
    .map((card) => card.id)
}

function getEditFormFromSnapshot(snapshot: LayoutSnapshot): LayoutEditForm {
  return {
    layoutWidth: String(snapshot.layoutWidth),
    layoutHeight: String(snapshot.layoutHeight),
    layoutRotate: String(snapshot.layoutRotate),
    layoutShape: snapshot.layoutShape
  }
}

// SECTION 05 : COMPONENT
export default function TableLayoutPanel({
  hideHeader = false,
  controlSlot = null,
  editorSlot = null,
  onSaveActionChange,
  onSavingChange,
  onSaveSuccess
}: TableLayoutPanelProps) {
  const [businessContext, setBusinessContext] =
    useState<BusinessContext | null>(null)
  const [layoutCards, setLayoutCards] =
    useState<LayoutCardItem[]>([])
  const [selectedFloor, setSelectedFloor] =
    useState<string>('1층')
  const [selectedZone, setSelectedZone] =
    useState<string>('홀')
  const [dirtyIds, setDirtyIds] =
    useState<string[]>([])
  const [originalLayouts, setOriginalLayouts] =
    useState<Record<string, LayoutSnapshot>>({})
  const [undoStack, setUndoStack] =
    useState<LayoutSnapshot[]>([])
  const [selectedCardId, setSelectedCardId] =
    useState<string | null>(null)
  const [editForm, setEditForm] =
    useState<LayoutEditForm | null>(null)
  const [dragState, setDragState] =
    useState<DragState | null>(null)
  const [isLoading, setIsLoading] =
    useState<boolean>(true)
  const [isSaving, setIsSaving] =
    useState<boolean>(false)
  const [errorMessage, setErrorMessage] =
    useState<string>('')
  const [scalePresetDisplayLabel, setScalePresetDisplayLabel] =
    useState<string>('프리셋 선택')
  const dragUndoSnapshotRef =
    useRef<{ snapshot: LayoutSnapshot; pushed: boolean } | null>(null)

  const floorOptions =
    useMemo(() => getDistinctOptions(layoutCards, 'floor'), [layoutCards])
  const zoneOptions =
    useMemo(() => getDistinctOptions(layoutCards, 'zone'), [layoutCards])

  const visibleCards =
    useMemo(() => {
      return layoutCards.filter((card) => {
        const floorMatches =
          card.floor === selectedFloor
        const zoneMatches =
          card.zone === selectedZone

        return floorMatches && zoneMatches
      })
    }, [layoutCards, selectedFloor, selectedZone])

  const selectedCard =
    useMemo(
      () => layoutCards.find((card) => card.id === selectedCardId) ?? null,
      [layoutCards, selectedCardId]
    )

  useEffect(() => {
    setScalePresetDisplayLabel('프리셋 선택')
  }, [selectedCardId])

  const loadLayoutCards = useCallback(async (context: BusinessContext) => {
    const response = await getPosTableSettings({
      profileId: context.profileId,
      channelCode: context.channelCode,
      resourceType: 'ALL' as PosResourceType | 'ALL'
    })

    const nextCards =
      (response.tables ?? []).map(mapTableSettingToLayoutCard)
    const nextOriginalLayouts =
      Object.fromEntries(
        nextCards.map((card) => [card.id, getLayoutSnapshot(card)])
      )

    setLayoutCards(nextCards)
    setOriginalLayouts(nextOriginalLayouts)
    setUndoStack([])
  }, [])

  useEffect(() => {
    const nextFloor =
      floorOptions[0] ?? '1층'

    if (!floorOptions.includes(selectedFloor)) {
      setSelectedFloor(nextFloor)
    }
  }, [floorOptions, selectedFloor])

  useEffect(() => {
    const nextZone =
      zoneOptions[0] ?? '홀'

    if (!zoneOptions.includes(selectedZone)) {
      setSelectedZone(nextZone)
    }
  }, [selectedZone, zoneOptions])

  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const me = await getMe()
        const profileId =
          Number(me.user?.profileId ?? 0)
        const channelCode =
          String(me.user?.channelCode ?? '').trim()

        if (!profileId || !channelCode) {
          throw new Error('BUSINESS 컨텍스트를 확인할 수 없습니다.')
        }

        const context = {
          profileId,
          channelCode
        }

        setBusinessContext(context)
        await loadLayoutCards(context)
      } catch {
        setErrorMessage('테이블 배치 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadInitial()
  }, [loadLayoutCards])

  useEffect(() => {
    onSavingChange?.(isLoading || isSaving)
  }, [isLoading, isSaving, onSavingChange])

  const handleCardMouseDown = (
    event: MouseEvent<HTMLButtonElement>,
    card: LayoutCardItem
  ) => {
    event.preventDefault()
    setSelectedCardId(card.id)
    setEditForm({
      layoutWidth: String(card.layoutWidth),
      layoutHeight: String(card.layoutHeight),
      layoutRotate: String(card.layoutRotate),
      layoutShape: card.layoutShape
    })
    dragUndoSnapshotRef.current = {
      snapshot: getLayoutSnapshot(card),
      pushed: false
    }

    setDragState({
      id: card.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: card.layoutX,
      startY: card.layoutY
    })
  }

  useEffect(() => {
    if (!dragState) {
      return
    }

    const handleMouseMove = (event: globalThis.MouseEvent) => {
      const nextX =
        Math.max(0, dragState.startX + event.clientX - dragState.startClientX)
      const nextY =
        Math.max(0, dragState.startY + event.clientY - dragState.startClientY)
      const hasMovement =
        nextX !== dragState.startX || nextY !== dragState.startY

      if (hasMovement && dragUndoSnapshotRef.current && !dragUndoSnapshotRef.current.pushed) {
        setUndoStack((currentStack) => [
          ...currentStack,
          dragUndoSnapshotRef.current?.snapshot as LayoutSnapshot
        ])
        dragUndoSnapshotRef.current.pushed = true
      }

      setLayoutCards((currentCards) => {
        const nextCards = currentCards.map((card) =>
          card.id === dragState.id
            ? {
              ...card,
              layoutX: nextX,
              layoutY: nextY
            }
            : card
        )

        setDirtyIds(getDirtyIdsFromCards(nextCards, originalLayouts))
        return nextCards
      })
    }

    const handleMouseUp = () => {
      dragUndoSnapshotRef.current = null
      setDragState(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, originalLayouts])

  const handleApplyLayoutEdit = () => {
    if (!selectedCard || !editForm) {
      return
    }

    const nextShape =
      LAYOUT_SHAPE_OPTIONS.some((option) => option.value === editForm.layoutShape)
        ? editForm.layoutShape
        : 'RECT'
    const normalizedDimensions =
      normalizeLayoutDimensions(
        nextShape,
        Number(editForm.layoutWidth) || selectedCard.layoutWidth,
        Number(editForm.layoutHeight) || selectedCard.layoutHeight
      )
    const nextWidth =
      normalizedDimensions.width
    const nextHeight =
      normalizedDimensions.height
    const nextRotate =
      Math.round(Number(editForm.layoutRotate) || 0)

    setUndoStack((currentStack) => [
      ...currentStack,
      getLayoutSnapshot(selectedCard)
    ])

    setLayoutCards((currentCards) => {
      const nextCards = currentCards.map((card) =>
        card.id === selectedCard.id
          ? {
            ...card,
            layoutWidth: nextWidth,
            layoutHeight: nextHeight,
            layoutRotate: nextRotate,
            layoutShape: nextShape
          }
          : card
      )

      setDirtyIds(getDirtyIdsFromCards(nextCards, originalLayouts))
      return nextCards
    })
    setEditForm({
      layoutWidth: String(nextWidth),
      layoutHeight: String(nextHeight),
      layoutRotate: String(nextRotate),
      layoutShape: nextShape
    })
  }

  const handleApplyScalePreset = (preset: LayoutScalePreset) => {
    if (!selectedCard || !editForm) {
      return
    }

    const normalizedPreset =
      normalizeLayoutDimensions(
        selectedCard.layoutShape,
        preset.width,
        preset.height
      )

    if (
      selectedCard.layoutWidth === normalizedPreset.width &&
      selectedCard.layoutHeight === normalizedPreset.height
    ) {
      return
    }

    setUndoStack((currentStack) => [
      ...currentStack,
      getLayoutSnapshot(selectedCard)
    ])

    setLayoutCards((currentCards) => {
      const nextCards = currentCards.map((card) =>
        card.id === selectedCard.id
          ? {
            ...card,
            layoutWidth: normalizedPreset.width,
            layoutHeight: normalizedPreset.height
          }
          : card
      )

      setDirtyIds(getDirtyIdsFromCards(nextCards, originalLayouts))
      return nextCards
    })
    setEditForm({
      ...editForm,
      layoutWidth: String(normalizedPreset.width),
      layoutHeight: String(normalizedPreset.height)
    })
  }

  const handleResetSelectedLayout = () => {
    if (!selectedCard) {
      return
    }
    const normalizedDefault =
      normalizeLayoutDimensions(
        DEFAULT_LAYOUT.layoutShape,
        DEFAULT_LAYOUT.layoutWidth,
        DEFAULT_LAYOUT.layoutHeight
      )

    setUndoStack((currentStack) => [
      ...currentStack,
      getLayoutSnapshot(selectedCard)
    ])

    setLayoutCards((currentCards) => {
      const nextCards = currentCards.map((card) =>
        card.id === selectedCard.id
          ? {
            ...card,
            ...DEFAULT_LAYOUT,
            layoutWidth: normalizedDefault.width,
            layoutHeight: normalizedDefault.height
          }
          : card
      )

      setDirtyIds(getDirtyIdsFromCards(nextCards, originalLayouts))
      return nextCards
    })
    setEditForm({
      layoutWidth: String(normalizedDefault.width),
      layoutHeight: String(normalizedDefault.height),
      layoutRotate: String(DEFAULT_LAYOUT.layoutRotate),
      layoutShape: DEFAULT_LAYOUT.layoutShape
    })
  }

  const handleUndoLayoutChange = useCallback(() => {
    setUndoStack((currentStack) => {
      const previousSnapshot =
        currentStack[currentStack.length - 1]

      if (!previousSnapshot) {
        return currentStack
      }

      setSelectedCardId(previousSnapshot.id)
      setEditForm(getEditFormFromSnapshot(previousSnapshot))
      setLayoutCards((currentCards) => {
        const nextCards = currentCards.map((card) =>
          card.id === previousSnapshot.id
            ? {
              ...card,
              layoutX: previousSnapshot.layoutX,
              layoutY: previousSnapshot.layoutY,
              layoutWidth: previousSnapshot.layoutWidth,
              layoutHeight: previousSnapshot.layoutHeight,
              layoutRotate: previousSnapshot.layoutRotate,
              layoutShape: previousSnapshot.layoutShape
            }
            : card
        )

        setDirtyIds(getDirtyIdsFromCards(nextCards, originalLayouts))
        return nextCards
      })

      return currentStack.slice(0, -1)
    })
  }, [originalLayouts])

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const target =
        event.target

      if (target instanceof HTMLElement) {
        const tagName =
          target.tagName.toLowerCase()
        const isEditableTarget =
          tagName === 'input' ||
          tagName === 'select' ||
          tagName === 'textarea' ||
          target.isContentEditable

        if (isEditableTarget) {
          return
        }
      }

      const isUndoShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'z'

      if (!isUndoShortcut || undoStack.length === 0) {
        return
      }

      event.preventDefault()
      handleUndoLayoutChange()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleUndoLayoutChange, undoStack.length])

  const handleSaveLayout = useCallback(async (): Promise<boolean> => {
    if (!businessContext || isSaving) {
      return false
    }

    const dirtyCards =
      layoutCards.filter((card) =>
        dirtyIds.includes(card.id) &&
        card.floor === selectedFloor &&
        card.zone === selectedZone
      )

    if (dirtyCards.length === 0) {
      setUndoStack([])
      onSaveSuccess?.()
      return true
    }

    setIsSaving(true)
    setErrorMessage('')

    try {
      for (const card of dirtyCards) {
        const normalizedCard =
          normalizeLayoutDimensions(
            card.layoutShape,
            card.layoutWidth,
            card.layoutHeight
          )

        await updatePosTableSetting(Number(card.id), {
          profileId: businessContext.profileId,
          channelCode: businessContext.channelCode,
          layoutX: Math.round(card.layoutX),
          layoutY: Math.round(card.layoutY),
          layoutWidth: Math.round(normalizedCard.width),
          layoutHeight: Math.round(normalizedCard.height),
          layoutRotate: Math.round(card.layoutRotate),
          layoutShape: card.layoutShape
        })
      }

      await loadLayoutCards(businessContext)
      setDirtyIds([])
      setUndoStack([])
      emitPosTableSettingsSync({
        channelCode: businessContext.channelCode,
        reason: 'save'
      })
      onSaveSuccess?.()
      return true
    } catch {
      setErrorMessage('테이블 배치 저장에 실패했습니다.')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [
    businessContext,
    dirtyIds,
    isSaving,
    layoutCards,
    loadLayoutCards,
    onSaveSuccess,
    selectedFloor,
    selectedZone
  ])

  useEffect(() => {
    onSaveActionChange?.(handleSaveLayout)

    return () => {
      onSaveActionChange?.(null)
    }
  }, [handleSaveLayout, onSaveActionChange])

  useEffect(() => {
    if (!businessContext) {
      return undefined
    }

    return subscribePosTableSettingsSync({
      channelCode: businessContext.channelCode,
      onSync: () => {
        void loadLayoutCards(businessContext)
      }
    })
  }, [businessContext, loadLayoutCards])

  const layoutControls = (
    <div className={styles.layoutControlRow}>
      <label className={styles.layoutSelectGroup}>
        <span>층</span>
        <select
          className={styles.layoutSelect}
          value={selectedFloor}
          onChange={(event) => setSelectedFloor(event.target.value)}
        >
          {floorOptions.map((floor) => (
            <option key={floor} value={floor}>
              {floor}
            </option>
          ))}
          {floorOptions.length === 0 ? (
            <option value="1층">1층</option>
          ) : null}
        </select>
      </label>

      <label className={styles.layoutSelectGroup}>
        <span>구역</span>
        <select
          className={styles.layoutSelect}
          value={selectedZone}
          onChange={(event) => setSelectedZone(event.target.value)}
        >
          {zoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
          {zoneOptions.length === 0 ? (
            <option value="홀">홀</option>
          ) : null}
        </select>
      </label>

    </div>
  )

  const layoutEditorControls = (
    <div className={styles.layoutEditorPanel}>
      {selectedCard && editForm ? (
        <>
          <div className={styles.layoutEditorTitleBlock}>
            <strong className={styles.layoutEditorTitle}>선택된 테이블: {selectedCard.tableName}</strong>
            <span className={styles.layoutEditorDescription}>크기, 회전, 형태를 조정한 뒤 적용해 주세요.</span>
          </div>

          <div className={styles.layoutEditorControlColumn}>
            <div className={styles.layoutEditorInputRow}>
              <label className={styles.layoutEditorField}>
                <span>너비</span>
                <input
                  className={styles.layoutEditorInput}
                  type="text"
                  inputMode="numeric"
                  value={editForm.layoutWidth}
                  onChange={(event) => setEditForm((currentForm) =>
                    currentForm
                      ? { ...currentForm, layoutWidth: event.target.value }
                      : currentForm
                  )}
                />
              </label>

              <label className={styles.layoutEditorField}>
                <span>높이</span>
                <input
                  className={styles.layoutEditorInput}
                  type="text"
                  inputMode="numeric"
                  value={editForm.layoutHeight}
                  onChange={(event) => setEditForm((currentForm) =>
                    currentForm
                      ? { ...currentForm, layoutHeight: event.target.value }
                      : currentForm
                  )}
                />
              </label>

              <label className={styles.layoutEditorField}>
                <span>회전</span>
                <input
                  className={styles.layoutEditorInput}
                  type="text"
                  inputMode="numeric"
                  value={editForm.layoutRotate}
                  onChange={(event) => setEditForm((currentForm) =>
                    currentForm
                      ? { ...currentForm, layoutRotate: event.target.value }
                      : currentForm
                  )}
                />
              </label>

              <label className={styles.layoutEditorField}>
                <span>형태</span>
                <select
                  className={styles.layoutEditorInput}
                  value={editForm.layoutShape}
                  onChange={(event) => setEditForm((currentForm) =>
                    currentForm
                      ? { ...currentForm, layoutShape: event.target.value }
                      : currentForm
                  )}
                >
                  {LAYOUT_SHAPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} · {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.layoutEditorField}>
                <span>스케일</span>
                <select
                  className={styles.layoutEditorInput}
                  defaultValue=""
                  onChange={(event) => {
                    const preset = LAYOUT_SCALE_PRESETS.find(
                      (scalePreset) => scalePreset.key === event.target.value
                    )
                    if (preset) {
                      handleApplyScalePreset(preset)
                    }
                    event.currentTarget.value = ''
                  }}
                >
                  <option value="">프리셋 선택</option>
                  {LAYOUT_SCALE_PRESETS.map((preset) => (
                    <option key={preset.key} value={preset.key}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.layoutEditorActionColumn}>
                <button
                  type="button"
                  className={styles.layoutApplyButton}
                  onClick={handleApplyLayoutEdit}
                >
                  적용
                </button>

                <button
                  type="button"
                  className={styles.layoutResetButton}
                  onClick={handleResetSelectedLayout}
                >
                  리셋
                </button>
              </div>

              <p className={styles.layoutEditorMeta}>
                변경 {dirtyIds.length}개
                <span className={styles.layoutUndoHint}>Ctrl+Z 되돌리기</span>
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className={styles.layoutEditorEmpty}>편집할 테이블 카드를 선택해 주세요.</p>
      )}
    </div>
  )

  const layoutEditorControlsInline = (
    <div className={styles.layoutEditorInlineRow}>
      {selectedCard && editForm ? (
        <>
          <strong className={styles.layoutEditorInlineTitle}>선택된 테이블: {selectedCard.tableName}</strong>

          <label className={styles.layoutCompactField}>
            <span className={styles.layoutCompactFieldLabel}>너비 :</span>
            <input
              className={styles.layoutCompactFieldInput}
              type="text"
              inputMode="numeric"
              value={editForm.layoutWidth}
              onChange={(event) => setEditForm((currentForm) =>
                currentForm
                  ? { ...currentForm, layoutWidth: event.target.value }
                  : currentForm
              )}
            />
          </label>

          <label className={styles.layoutCompactField}>
            <span className={styles.layoutCompactFieldLabel}>높이 :</span>
            <input
              className={styles.layoutCompactFieldInput}
              type="text"
              inputMode="numeric"
              value={editForm.layoutHeight}
              onChange={(event) => setEditForm((currentForm) =>
                currentForm
                  ? { ...currentForm, layoutHeight: event.target.value }
                  : currentForm
              )}
            />
          </label>

          <label className={styles.layoutCompactField}>
            <span className={styles.layoutCompactFieldLabel}>회전 :</span>
            <input
              className={styles.layoutCompactFieldInput}
              type="text"
              inputMode="numeric"
              value={editForm.layoutRotate}
              onChange={(event) => setEditForm((currentForm) =>
                currentForm
                  ? { ...currentForm, layoutRotate: event.target.value }
                  : currentForm
              )}
            />
          </label>

          <select
            className={`${styles.layoutEditorInput} ${styles.layoutShapeSelect}`}
            value={editForm.layoutShape}
            aria-label="형태(테이블 타입)"
            onChange={(event) => setEditForm((currentForm) =>
              currentForm
                ? { ...currentForm, layoutShape: event.target.value }
                : currentForm
            )}
          >
            {LAYOUT_SHAPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {`형태: ${option.value} · ${option.label}`}
              </option>
            ))}
          </select>

          <select
            className={`${styles.layoutEditorInput} ${styles.layoutScaleSelect}`}
            defaultValue=""
            aria-label="스케일 프리셋"
            onChange={(event) => {
              const preset = LAYOUT_SCALE_PRESETS.find(
                (scalePreset) => scalePreset.key === event.target.value
              )
              if (preset) {
                setScalePresetDisplayLabel(preset.label)
                handleApplyScalePreset(preset)
              }
              event.currentTarget.value = ''
            }}
          >
            <option value="">{`스케일: ${scalePresetDisplayLabel}`}</option>
            {LAYOUT_SCALE_PRESETS.map((preset) => (
              <option key={preset.key} value={preset.key}>
                {`스케일: ${preset.label}`}
              </option>
            ))}
          </select>

          <div className={styles.layoutActionStack}>
            <button
              type="button"
              className={styles.layoutApplyButton}
              onClick={handleApplyLayoutEdit}
            >
              적용
            </button>

            <button
              type="button"
              className={styles.layoutResetButton}
              onClick={handleResetSelectedLayout}
            >
              리셋
            </button>
          </div>
        </>
      ) : (
        <p className={styles.layoutEditorEmpty}>편집할 테이블 카드를 선택해 주세요.</p>
      )}
    </div>
  )

  return (
    <section className={styles.layoutPanel}>
      {!hideHeader ? (
        <div className={styles.layoutHeader}>
          <div>
            <h2 className={styles.editorTitle}>테이블 배치</h2>
            <p className={styles.editorDescription}>
              캔버스에서 테이블/룸 카드를 드래그한 뒤 저장해 주세요.
            </p>
          </div>
        </div>
      ) : null}

      {controlSlot ? createPortal(layoutControls, controlSlot) : layoutControls}

      {errorMessage ? (
        <p className={styles.layoutError}>{errorMessage}</p>
      ) : null}

      {editorSlot
        ? createPortal(layoutEditorControlsInline, editorSlot)
        : layoutEditorControls}

      <div className={styles.layoutCanvas}>
        {isLoading ? (
          <div className={styles.layoutEmptyCard}>테이블 배치 정보를 불러오는 중입니다.</div>
        ) : null}

        {!isLoading && visibleCards.length === 0 ? (
          <div className={styles.layoutEmptyCard}>표시할 테이블이 없습니다.</div>
        ) : null}

        {visibleCards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={[
              styles.layoutTableCard,
              selectedCardId === card.id ? styles.layoutTableCardSelected : '',
              dragState?.id === card.id ? styles.layoutTableCardDragging : '',
              card.layoutShape === 'ROOM' ? styles.layoutTableCardRoom : ''
            ].filter(Boolean).join(' ')}
            style={{
              left: card.layoutX,
              top: card.layoutY,
              width: card.layoutWidth,
              height: card.layoutHeight,
              transform: `rotate(${card.layoutRotate}deg)`,
              borderRadius: card.layoutShape === 'ROUND' ? '999px' : card.layoutShape === 'ROOM' ? '18px' : '14px'
            }}
            onMouseDown={(event) => handleCardMouseDown(event, card)}
          >
            <strong className={styles.layoutTableTitle}>{card.tableName}</strong>
            <span className={styles.layoutTableMeta}>{card.floor} · {card.zone}</span>
            <span className={styles.layoutTableStatus}>{card.resourceStatusLabel}</span>
            {dirtyIds.includes(card.id) ? (
              <span className={styles.layoutDirtyBadge}>변경됨</span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  )
}

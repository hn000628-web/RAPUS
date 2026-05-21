// FILE : frontend/app/(pos)/pos/table/settings/_components/PosTableSettingsShell.tsx
// ROOT : frontend/app/(pos)/pos/table/settings/_components/PosTableSettingsShell.tsx
// STATUS : CREATE
// ROLE : POS TABLE SETTINGS HUB SHELL
// CHANGE SUMMARY :
// - /pos/table/settings ?덈툕 ?덉씠?꾩썐 援ъ꽦
// - activeModule ?곹깭 湲곕컲 紐⑤뱢 ???꾪솚 援ъ꽦

'use client'

// SECTION 01 : IMPORT
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'

import PosHeaderMenuBar from '../../../components/PosHeaderMenuBar'
import PosTopbar from '../../../components/PosTopbar'
import { usePosKeyboardMode } from '../../../components/PosKeyboardModeContext'
import type { PosMenuKey } from '../../../components/posTypes'
import { TABLE_POS_SIDEBAR_MENUS } from '../../../components/tablePosMenuConfig'
import BaseModal from '@/components/ui/modal/BaseModal'
import { getMe } from '@/lib/authApi'
import { getPosMenus, type PosMenuItem } from '@/lib/business/pos/posMenuApi'
import styles from '../PosTableSettingsPage.module.css'
import CategoryManagePanel from './CategoryManagePanel'
import MenuManagePanel from './MenuManagePanel'
import TableLayoutPanel from './TableLayoutPanel'
import TableManagePanel from './TableManagePanel'
import type { PosTableSettingsModule } from '../_types/posTableSettingsTypes'

// SECTION 02 : CONSTANT
const MODULE_TABS: Array<{ key: PosTableSettingsModule; label: string }> = [
  { key: 'MENU', label: '메뉴 관리' },
  { key: 'CATEGORY', label: '카테고리관리' },
  { key: 'TABLE', label: '테이블관리' },
  { key: 'LAYOUT', label: '테이블 배치' }
]

type SettingsModalType =
  | 'MENU'
  | 'CATEGORY'
  | 'TABLE'
  | null
type MenuStatusView = 'ALL' | 'ON_SALE' | 'STOPPED' | 'HIDDEN' | null
type CategoryViewMode = 'DASHBOARD' | 'LIST'

type MenuDashboardSummary = {
  total: number
  onSale: number
  stopped: number
  hidden: number
}

type CreateAction =
  | {
    label: string
    onClick: () => void
  }
  | null

type LayoutModalSize = {
  width: number
  height: number
}

type LayoutModalResizeState = {
  startClientX: number
  startClientY: number
  startWidth: number
  startHeight: number
}

type TableFloorControl = {
  selectedFloor: string
  floorOptions: string[]
  onSelectFloor: (floor: string) => void
  onAddFloor: () => void
}

type TableStatusControl = {
  selectedStatus: string
  statusOptions: Array<{ value: string; label: string }>
  onSelectStatus: (status: string) => void
}

type TableTypeControl = {
  selectedTableType: string
  tableTypeOptions: Array<{ value: string; label: string }>
  onSelectTableType: (tableType: string) => void
}

type TableManageViewMode = 'DASHBOARD' | 'LIST'

const LAYOUT_MODAL_DEFAULT_SIZE: LayoutModalSize = {
  width: 1200,
  height: 820
}
const LAYOUT_MODAL_MIN_WIDTH = 900
const LAYOUT_MODAL_MIN_HEIGHT = 600
const LAYOUT_MODAL_VIEWPORT_PADDING = 48

function clampLayoutModalSize(width: number, height: number): LayoutModalSize {
  if (typeof window === 'undefined') {
    return {
      width,
      height
    }
  }

  const maxWidth = Math.max(320, window.innerWidth - LAYOUT_MODAL_VIEWPORT_PADDING)
  const maxHeight = Math.max(320, window.innerHeight - LAYOUT_MODAL_VIEWPORT_PADDING)
  const minWidth = Math.min(LAYOUT_MODAL_MIN_WIDTH, maxWidth)
  const minHeight = Math.min(LAYOUT_MODAL_MIN_HEIGHT, maxHeight)

  return {
    width: Math.min(Math.max(width, minWidth), maxWidth),
    height: Math.min(Math.max(height, minHeight), maxHeight)
  }
}

function isHiddenOnTableOrder(item: PosMenuItem): boolean {
  return Number(item.showOnTableOrder ?? 1) === 0
}

function isOnSale(item: PosMenuItem): boolean {
  return Boolean(item.isActive) && item.menuStatus === 'ON_SALE'
}

function isStopped(item: PosMenuItem): boolean {
  return item.menuStatus === 'STOPPED' || Boolean(item.isSoldOut)
}

// SECTION 03 : COMPONENT
export default function PosTableSettingsShell() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [activeModule, setActiveModule] = useState<PosTableSettingsModule>('MENU')
  const [menuActiveFilter, setMenuActiveFilter] =
    useState<'ALL' | 'ON_SALE' | 'STOPPED' | 'HIDDEN'>('ALL')
  const [menuStatusView, setMenuStatusView] =
    useState<MenuStatusView>(null)
  const [categoryViewMode, setCategoryViewMode] =
    useState<CategoryViewMode>('LIST')
  const [selectedSettingsModal, setSelectedSettingsModal] =
    useState<SettingsModalType>(null)
  const [menuSummary, setMenuSummary] =
    useState<MenuDashboardSummary>({
      total: 0,
      onSale: 0,
      stopped: 0,
      hidden: 0
    })
  const [moduleSaveAction, setModuleSaveAction] =
    useState<(() => Promise<boolean>) | null>(null)
  const [isModuleSaving, setIsModuleSaving] =
    useState<boolean>(false)
  const [isSaveSuccessModalOpen, setIsSaveSuccessModalOpen] =
    useState<boolean>(false)
  const [isLayoutModalOpen, setIsLayoutModalOpen] =
    useState<boolean>(false)
  const [layoutSaveAction, setLayoutSaveAction] =
    useState<(() => Promise<boolean>) | null>(null)
  const [isLayoutSaving, setIsLayoutSaving] =
    useState<boolean>(false)
  const [layoutHeaderControlSlot, setLayoutHeaderControlSlot] =
    useState<HTMLDivElement | null>(null)
  const [layoutHeaderEditorSlot, setLayoutHeaderEditorSlot] =
    useState<HTMLDivElement | null>(null)
  const [layoutModalSize, setLayoutModalSize] =
    useState<LayoutModalSize>(LAYOUT_MODAL_DEFAULT_SIZE)
  const [layoutModalResizeState, setLayoutModalResizeState] =
    useState<LayoutModalResizeState | null>(null)
  const [isLayoutShortcutHelpOpen, setIsLayoutShortcutHelpOpen] =
    useState<boolean>(false)
  const [menuCreateAction, setMenuCreateAction] =
    useState<(() => void) | null>(null)
  const [categoryCreateAction, setCategoryCreateAction] =
    useState<(() => void) | null>(null)
  const [tableCreateAction, setTableCreateAction] =
    useState<(() => void) | null>(null)
  const [tableFloorControl, setTableFloorControl] =
    useState<TableFloorControl | null>(null)
  const [tableStatusControl, setTableStatusControl] =
    useState<TableStatusControl | null>(null)
  const [tableTypeControl, setTableTypeControl] =
    useState<TableTypeControl | null>(null)
  const [tableManageViewMode, setTableManageViewMode] =
    useState<TableManageViewMode>('LIST')

  const handleMenuCreateActionChange = useCallback((action: (() => void) | null) => {
    if (action) {
      setMenuCreateAction(() => action)
    }
  }, [])

  const handleCategoryCreateActionChange = useCallback((action: (() => void) | null) => {
    if (action) {
      setCategoryCreateAction(() => action)
    }
  }, [])

  const handleTableCreateActionChange = useCallback((action: (() => void) | null) => {
    if (action) {
      setTableCreateAction(() => action)
    }
  }, [])

  const handleTableFloorControlChange = useCallback((control: TableFloorControl | null) => {
    setTableFloorControl(control)
  }, [])

  const handleTableStatusControlChange = useCallback((control: TableStatusControl | null) => {
    setTableStatusControl(control)
  }, [])

  const handleTableTypeControlChange = useCallback((control: TableTypeControl | null) => {
    setTableTypeControl(control)
  }, [])

  const loadMenuDashboardSummary = useCallback(async () => {
    try {
      const me = await getMe()
      const user = me.user

      if (user.profileType !== 'BUSINESS') {
        setMenuSummary({
          total: 0,
          onSale: 0,
          stopped: 0,
          hidden: 0
        })
        return
      }

      const response = await getPosMenus({
        profileId: Number(user.profileId),
        channelCode: String(user.channelCode)
      })

      const items = response.items ?? []
      setMenuSummary({
        total: items.length,
        onSale: items.filter(isOnSale).length,
        stopped: items.filter(isStopped).length,
        hidden: items.filter(isHiddenOnTableOrder).length
      })
    } catch (error) {
      console.error('설정 대시보드 메뉴 통계를 불러오지 못했습니다.', error)
      setMenuSummary({
        total: 0,
        onSale: 0,
        stopped: 0,
        hidden: 0
      })
    }
  }, [])

  useEffect(() => {
    void loadMenuDashboardSummary()
  }, [loadMenuDashboardSummary])

  const handleOpenSettingsModal = (module: Exclude<SettingsModalType, null>) => {
    setActiveModule(module)
    if (module === 'MENU') {
      setMenuStatusView(null)
    }
    if (module === 'CATEGORY') {
      setCategoryViewMode('LIST')
    }
    if (module === 'TABLE') {
      setTableManageViewMode('LIST')
    }
    setSelectedSettingsModal(module)
  }

  const handleCloseSettingsModal = () => {
    setMenuStatusView(null)
    setCategoryViewMode('LIST')
    setTableManageViewMode('LIST')
    setSelectedSettingsModal(null)
    void loadMenuDashboardSummary()
  }

  useEffect(() => {
    if (activeModule !== 'MENU') {
      setMenuCreateAction(null)
    }

    if (activeModule !== 'CATEGORY') {
      setCategoryCreateAction(null)
    }

    if (activeModule !== 'TABLE') {
      setTableCreateAction(null)
      setTableFloorControl(null)
      setTableStatusControl(null)
      setTableTypeControl(null)
    }
  }, [activeModule])

  const activePanel = useMemo(() => {
    if (activeModule === 'CATEGORY') {
      return (
        <CategoryManagePanel
          onCreateActionChange={handleCategoryCreateActionChange}
          onSaveActionChange={(action) => setModuleSaveAction(() => action)}
          onSavingChange={setIsModuleSaving}
          onSaveSuccess={() => setIsSaveSuccessModalOpen(true)}
          viewMode={categoryViewMode}
          hideCreateButton
        />
      )
    }

    if (activeModule === 'TABLE') {
      return (
        <TableManagePanel
          onCreateActionChange={handleTableCreateActionChange}
          onFloorControlChange={handleTableFloorControlChange}
          onStatusControlChange={handleTableStatusControlChange}
          onTypeControlChange={handleTableTypeControlChange}
          viewMode={tableManageViewMode}
          onSaveActionChange={(action) => setModuleSaveAction(() => action)}
          onSavingChange={setIsModuleSaving}
          onSaveSuccess={() => setIsSaveSuccessModalOpen(true)}
          hideCreateButton
        />
      )
    }

    return (
      <MenuManagePanel
        onCreateActionChange={handleMenuCreateActionChange}
        hideCreateButton
        activeFilter={menuActiveFilter}
        onActiveFilterChange={setMenuActiveFilter}
        statusView={menuStatusView}
        onStatusViewChange={setMenuStatusView}
      />
    )
  }, [
    activeModule,
    menuActiveFilter,
    menuStatusView,
    categoryViewMode,
    handleCategoryCreateActionChange,
    handleMenuCreateActionChange,
    handleTableCreateActionChange,
    handleTableFloorControlChange,
    handleTableStatusControlChange,
    handleTableTypeControlChange,
    tableManageViewMode
  ])

  const createActionButton = useMemo<CreateAction>(() => {
    if (activeModule === 'CATEGORY') {
      if (!categoryCreateAction) {
        return null
      }

      return {
        label: '+ 카테고리추가',
        onClick: categoryCreateAction
      }
    }

    if (activeModule === 'TABLE') {
      if (!tableCreateAction) {
        return null
      }

      return {
        label: '+ 테이블추가',
        onClick: tableCreateAction
      }
    }

    if (activeModule === 'LAYOUT') {
      return null
    }

    if (!menuCreateAction) {
      return null
    }

    return {
      label: '+ 메뉴추가',
      onClick: menuCreateAction
    }
  }, [activeModule, categoryCreateAction, menuCreateAction, tableCreateAction])

  const visibleSettingsModalTabs = useMemo(() => {
    if (selectedSettingsModal === 'MENU') {
      return MODULE_TABS.filter((tab) => tab.key !== 'CATEGORY')
    }

    return MODULE_TABS
  }, [selectedSettingsModal])

  const handleTopSave = async (): Promise<boolean> => {
    if (
      (activeModule !== 'TABLE' && activeModule !== 'CATEGORY') ||
      !moduleSaveAction ||
      isModuleSaving
    ) {
      return false
    }

    const saved = await moduleSaveAction()

    if (saved) {
      setIsSaveSuccessModalOpen(true)
    }

    return saved
  }

  useEffect(() => {
    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!(event.target instanceof HTMLElement)) {
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        if (isLayoutModalOpen) {
          event.preventDefault()
          if (layoutSaveAction && !isLayoutSaving) {
            void layoutSaveAction()
          }
          return
        }
      }

      const tagName = event.target.tagName.toLowerCase()
      if (
        keyboardMode !== 'POS' ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        event.target.isContentEditable
      ) {
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (isLayoutModalOpen && layoutSaveAction && !isLayoutSaving) {
          void layoutSaveAction()
          return
        }

        void handleTopSave()
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [
    activeModule,
    keyboardMode,
    moduleSaveAction,
    isModuleSaving,
    isLayoutModalOpen,
    layoutSaveAction,
    isLayoutSaving
  ])

  useEffect(() => {
    if (!layoutModalResizeState) {
      return
    }

    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'nwse-resize'
    document.body.style.userSelect = 'none'

    const handleWindowMouseMove = (event: globalThis.MouseEvent) => {
      const nextWidth =
        layoutModalResizeState.startWidth + event.clientX - layoutModalResizeState.startClientX
      const nextHeight =
        layoutModalResizeState.startHeight + event.clientY - layoutModalResizeState.startClientY

      setLayoutModalSize(clampLayoutModalSize(nextWidth, nextHeight))
    }

    const handleWindowMouseUp = () => {
      setLayoutModalResizeState(null)
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)

    return () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [layoutModalResizeState])

  useEffect(() => {
    if (!isLayoutModalOpen) {
      return
    }

    setLayoutModalSize((currentSize) =>
      clampLayoutModalSize(currentSize.width, currentSize.height)
    )
  }, [isLayoutModalOpen])

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleChangeMenu = (menu: PosMenuKey) => {
    if (menu === 'TABLE') {
      router.push('/pos/table')
      return
    }

    if (menu === 'MENU_MANAGE') {
      router.push('/pos/table/settings')
      return
    }

    if (menu === 'COOKING') {
      router.push('/pos/table/cooking')
      return
    }

    if (menu === 'ORDER_HISTORY') {
      router.push('/pos/table/orders')
      return
    }

    if (menu === 'RESERVATION') {
      router.push('/pos/table/reservations')
      return
    }

    if (menu === 'SALES_HISTORY') {
      router.push('/pos/table/stay-sales')
    }
  }

  useEffect(() => {
    if (activeModule === 'MENU') {
      setModuleSaveAction(null)
      setIsModuleSaving(false)
    }
  }, [activeModule])

  const canSaveCurrentModule =
    (activeModule === 'TABLE' || activeModule === 'CATEGORY') &&
    Boolean(moduleSaveAction) &&
    !isModuleSaving

  const canSaveLayoutModule =
    Boolean(layoutSaveAction) &&
    !isLayoutSaving

  const handleTopSaveClick = () => {
    void handleTopSave()
  }

  const handleLayoutModalSaveClick = () => {
    if (!layoutSaveAction || isLayoutSaving) {
      return
    }

    void layoutSaveAction()
  }

  const handleLayoutModalClose = () => {
    setIsLayoutModalOpen(false)
    setLayoutModalResizeState(null)
    setIsLayoutShortcutHelpOpen(false)
  }

  const handleLayoutModalResizeStart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setLayoutModalResizeState({
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidth: layoutModalSize.width,
      startHeight: layoutModalSize.height
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="테이블 POS 설정"
              onHomeClick={handleGoPosHome}
              onSettingsClick={handleOpenPosSettings}
              onMyPageClick={handleGoMyPage}
              syncStatus="ONLINE"
              homeShortcutLabel="F1"
              keyboardMode={keyboardMode}
              onToggleKeyboardMode={toggleKeyboardMode}
            />
          </div>
        </div>

        <div className={styles.mainViewport}>
          <div className={styles.mainGrid}>
            <main className={styles.main}>
              <PosHeaderMenuBar
                activeMenu="MENU_MANAGE"
                onChangeMenu={handleChangeMenu}
                menuOptions={TABLE_POS_SIDEBAR_MENUS}
              />

              <div className={styles.panelScrollArea}>
                <section className={styles.settingsDashboardPanel}>
                  <article className={styles.settingsDashboardHero}>
                    <div>
                      <p className={styles.settingsDashboardEyebrow}>요식업 POS 테이블/메뉴관리</p>
                      <h1 className={styles.settingsDashboardTitle}>테이블/메뉴 운영 설정</h1>
                      <p className={styles.settingsDashboardDescription}>
                        메뉴, 카테고리, 테이블, 배치 정보를 관리하고 POS 운영 구조를 설정합니다.
                      </p>
                    </div>
                  </article>

                  <section className={styles.settingsDashboardActionGrid}>
                    <button
                      type="button"
                      className={styles.settingsDashboardActionCard}
                      onClick={() => handleOpenSettingsModal('MENU')}
                    >
                      <span>메뉴관리 보기</span>
                    </button>
                    <button
                      type="button"
                      className={styles.settingsDashboardActionCard}
                      onClick={() => handleOpenSettingsModal('CATEGORY')}
                    >
                      <span>카테고리관리 보기</span>
                    </button>
                    <button
                      type="button"
                      className={styles.settingsDashboardActionCard}
                      onClick={() => handleOpenSettingsModal('TABLE')}
                    >
                      <span>테이블관리 보기</span>
                    </button>
                    <button
                      type="button"
                      className={styles.settingsDashboardActionCard}
                      onClick={() => setIsLayoutModalOpen(true)}
                    >
                      <span>테이블배치 열기</span>
                    </button>
                  </section>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>
      <BaseModal
        open={isSaveSuccessModalOpen}
        type="success"
        title="저장 완료"
        description="TABLE_POS 설정이 저장되었습니다."
        onClose={() => setIsSaveSuccessModalOpen(false)}
      />
      {selectedSettingsModal ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section
            className={`${styles.menuCreateModalPanel} ${styles.menuCreateModalPanelLarge} ${styles.settingsManageModalPanel}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-manage-modal-title"
          >
            <header className={`${styles.modalHeader} ${styles.settingsManageModalHeader}`}>
              <div className={styles.modalHeaderText}>
                <h2 id="settings-manage-modal-title" className={styles.modalTitle}>
                  {activeModule === 'MENU'
                    ? '메뉴관리'
                    : activeModule === 'CATEGORY'
                      ? '카테고리관리'
                      : '테이블관리'}
                </h2>
                <p className={styles.modalDescription}>
                  등록된 데이터를 확인하고 운영 상태를 관리합니다.
                </p>
              </div>

              <div className={styles.settingsManageHeaderActions}>
                {activeModule === 'TABLE' ? (
                  <div className={styles.settingsManageHeaderActionsStack}>
                    <div className={styles.settingsManageHeaderActionRow}>
                      <span
                        className={`${styles.tableManageSelect} ${styles.tableManageFixedSelect} ${styles.settingsManageHeaderControl} ${styles.settingsManageHeaderSearch}`}
                        aria-label="테이블 검색"
                      >
                        테이블
                      </span>

                      <select
                        className={`${styles.tableManageSelect} ${styles.settingsManageHeaderControl} ${styles.settingsManageHeaderFloorSelect}`}
                        value={tableFloorControl?.selectedFloor ?? 'ALL'}
                        onChange={(event) => tableFloorControl?.onSelectFloor(event.target.value)}
                        aria-label="플로어 필터"
                      >
                        <option value="ALL">플로어: 전체</option>
                        {(tableFloorControl?.floorOptions ?? []).map((floor) => (
                          <option key={floor} value={floor}>
                            {floor}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                        onClick={() => tableFloorControl?.onAddFloor()}
                      >
                        + 플로어 추가
                      </button>

                      {createActionButton ? (
                        <button
                          type="button"
                          className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                          onClick={createActionButton.onClick}
                        >
                          {createActionButton.label}
                        </button>
                      ) : null}

                      {canSaveCurrentModule ? (
                        <button
                          type="button"
                          className={`${styles.saveButton} ${styles.settingsManageHeaderControl}`}
                          onClick={handleTopSaveClick}
                          disabled={!canSaveCurrentModule}
                        >
                          저장
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className={`${styles.modalCloseButton} ${styles.modalCloseButtonText}`}
                        aria-label="닫기"
                        onClick={handleCloseSettingsModal}
                      >
                        닫기
                      </button>
                    </div>

                    <div className={styles.settingsManageHeaderViewSwitchRow}>
                      <select
                        className={`${styles.tableManageSelect} ${styles.settingsManageHeaderControl}`}
                        value={tableStatusControl?.selectedStatus ?? 'ALL'}
                        onChange={(event) => tableStatusControl?.onSelectStatus(event.target.value)}
                        aria-label="상태 필터"
                      >
                        {(tableStatusControl?.statusOptions ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <select
                        className={`${styles.tableManageSelect} ${styles.settingsManageHeaderControl} ${styles.settingsManageHeaderTypeSelect}`}
                        value={tableTypeControl?.selectedTableType ?? 'ALL'}
                        onChange={(event) => tableTypeControl?.onSelectTableType(event.target.value)}
                        aria-label="운영 등급"
                      >
                        {(tableTypeControl?.tableTypeOptions ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                        onClick={() => setTableManageViewMode('DASHBOARD')}
                      >
                        테이블현황
                      </button>

                      <button
                        type="button"
                        className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                        onClick={() => setTableManageViewMode('LIST')}
                      >
                        테이블목록
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeModule === 'MENU' && createActionButton ? (
                      <select
                        className={`${styles.tableManageSelect} ${styles.settingsManageHeaderControl}`}
                        value={menuActiveFilter}
                        onChange={(event) =>
                          setMenuActiveFilter(
                            event.target.value as 'ALL' | 'ON_SALE' | 'STOPPED' | 'HIDDEN'
                          )
                        }
                        aria-label="메뉴 상태 필터"
                      >
                        <option value="ALL">전체</option>
                        <option value="ON_SALE">판매중</option>
                        <option value="STOPPED">품절/중지</option>
                        <option value="HIDDEN">숨김</option>
                      </select>
                    ) : null}

                    {activeModule === 'MENU' && createActionButton ? (
                      <button
                        type="button"
                        className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                        onClick={() => setMenuStatusView(null)}
                      >
                        메뉴현황
                      </button>
                    ) : null}

                    {activeModule === 'MENU' && createActionButton ? (
                      <button
                        type="button"
                        className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                        onClick={() => setMenuStatusView(menuActiveFilter)}
                      >
                        메뉴목록
                      </button>
                    ) : null}

                    {activeModule === 'MENU' && createActionButton ? (
                      <button
                        type="button"
                        className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                        onClick={createActionButton.onClick}
                      >
                        {createActionButton.label}
                      </button>
                    ) : null}

                    {activeModule === 'CATEGORY' && createActionButton ? (
                      <button
                        type="button"
                        className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                        onClick={() => setCategoryViewMode('DASHBOARD')}
                      >
                        카테고리현황
                      </button>
                    ) : null}

                    {activeModule === 'CATEGORY' ? (
                      <button
                        type="button"
                        className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                        onClick={() => setCategoryViewMode('LIST')}
                      >
                        카테고리목록
                      </button>
                    ) : null}

                    {activeModule === 'CATEGORY' && createActionButton ? (
                      <button
                        type="button"
                        className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                        onClick={createActionButton.onClick}
                      >
                        {createActionButton.label}
                      </button>
                    ) : null}

                    {activeModule === 'CATEGORY' && canSaveCurrentModule ? (
                      <button
                        type="button"
                        className={`${styles.saveButton} ${styles.settingsManageHeaderControl}`}
                        onClick={handleTopSaveClick}
                        disabled={!canSaveCurrentModule}
                      >
                        저장
                      </button>
                    ) : null}

                    <button
                      type="button"
                      className={`${styles.modalCloseButton} ${styles.modalCloseButtonText}`}
                      aria-label="닫기"
                      onClick={handleCloseSettingsModal}
                    >
                      닫기
                    </button>
                  </>
                )}
              </div>
            </header>

            <div className={`${styles.modalBody} ${styles.settingsManageModalBody}`}>
              <div className={styles.tabActionRow}>
                
              </div>

              <div className={`${styles.panelScrollAreaModal} ${styles.settingsManagePanelScrollArea}`}>
                {activePanel}
              </div>
            </div>

          </section>
        </div>
      ) : null}
      {isLayoutModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section
            className={`${styles.menuCreateModalPanel} ${styles.menuCreateModalPanelLarge} ${styles.layoutModalPanel}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-layout-modal-title"
            style={{
              width: layoutModalSize.width,
              height: layoutModalSize.height
            }}
          >
            <header className={`${styles.modalHeader} ${styles.layoutModalUnifiedHeader}`}>
              <div>
                <h2 id="table-layout-modal-title" className={styles.modalTitle}>테이블 배치</h2>
                <p className={styles.modalDescription}>
                  캔버스에서 테이블/룸 카드를 드래그한 뒤 저장해 주세요.
                </p>
              </div>

              <div
                className={styles.layoutModalHeaderControls}
                ref={setLayoutHeaderControlSlot}
              />

              <div className={styles.layoutShortcutHelpWrap}>
                <button
                  type="button"
                  className={`${styles.tabActionButton} ${styles.settingsManageHeaderControl}`}
                  onClick={() => setIsLayoutShortcutHelpOpen((prev) => !prev)}
                >
                  단축키
                </button>
                {isLayoutShortcutHelpOpen ? (
                  <div className={styles.layoutShortcutHelpPopover} role="note" aria-label="단축키 안내">
                    <p className={styles.layoutShortcutHelpLine}>Ctrl + S : 저장</p>
                    <p className={styles.layoutShortcutHelpLine}>Ctrl + Z : 되돌리기</p>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className={styles.modalSubmitButton}
                onClick={handleLayoutModalSaveClick}
                disabled={!canSaveLayoutModule}
              >
                저장
              </button>

              <button
                type="button"
                className={`${styles.modalCloseButton} ${styles.modalCloseButtonText}`}
                aria-label="닫기"
                onClick={handleLayoutModalClose}
              >
                닫기
              </button>
              <div
                className={styles.layoutModalEditorBar}
                ref={setLayoutHeaderEditorSlot}
              />
            </header>

            <div className={`${styles.modalBody} ${styles.layoutModalBody}`}>
              <TableLayoutPanel
                hideHeader
                controlSlot={layoutHeaderControlSlot}
                editorSlot={layoutHeaderEditorSlot}
                onSaveActionChange={(action) => setLayoutSaveAction(() => action)}
                onSavingChange={setIsLayoutSaving}
                onSaveSuccess={() => setIsSaveSuccessModalOpen(true)}
              />
            </div>

            <button
              type="button"
              className={styles.layoutModalResizeHandle}
              aria-label="모달 크기 조절"
              onMouseDown={handleLayoutModalResizeStart}
            />
          </section>
        </div>
      ) : null}
    </div>
  )
}

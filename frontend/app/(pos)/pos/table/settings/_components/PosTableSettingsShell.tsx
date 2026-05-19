// FILE : frontend/app/(pos)/pos/table/settings/_components/PosTableSettingsShell.tsx
// ROOT : frontend/app/(pos)/pos/table/settings/_components/PosTableSettingsShell.tsx
// STATUS : CREATE
// ROLE : POS TABLE SETTINGS HUB SHELL
// CHANGE SUMMARY :
// - /pos/table/settings ?덈툕 ?덉씠?꾩썐 援ъ꽦
// - activeModule ?곹깭 湲곕컲 紐⑤뱢 ???꾪솚 援ъ꽦

'use client'

// SECTION 01 : IMPORT
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import PosSidebar from '../../../components/PosSidebar'
import PosTopbar from '../../../components/PosTopbar'
import { usePosKeyboardMode } from '../../../components/PosKeyboardModeContext'
import type { PosMenuKey } from '../../../components/posTypes'
import { TABLE_POS_SIDEBAR_MENUS } from '../../../components/tablePosMenuConfig'
import BaseModal from '@/components/ui/modal/BaseModal'
import styles from '../PosTableSettingsPage.module.css'
import CategoryManagePanel from './CategoryManagePanel'
import MenuManagePanel from './MenuManagePanel'
import TableManagePanel from './TableManagePanel'
import type { PosTableSettingsModule } from '../_types/posTableSettingsTypes'

// SECTION 02 : CONSTANT
const MODULE_TABS: Array<{ key: PosTableSettingsModule; label: string }> = [
  { key: 'MENU', label: '메뉴 관리' },
  { key: 'CATEGORY', label: '카테고리관리' },
  { key: 'TABLE', label: '테이블관리' }
]

type CreateAction =
  | {
    label: string
    onClick: () => void
  }
  | null

// SECTION 03 : COMPONENT
export default function PosTableSettingsShell() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [activeModule, setActiveModule] = useState<PosTableSettingsModule>('MENU')
  const [moduleSaveAction, setModuleSaveAction] =
    useState<(() => Promise<boolean>) | null>(null)
  const [isModuleSaving, setIsModuleSaving] =
    useState<boolean>(false)
  const [isSaveSuccessModalOpen, setIsSaveSuccessModalOpen] =
    useState<boolean>(false)
  const [menuCreateAction, setMenuCreateAction] =
    useState<(() => void) | null>(null)
  const [categoryCreateAction, setCategoryCreateAction] =
    useState<(() => void) | null>(null)
  const [tableCreateAction, setTableCreateAction] =
    useState<(() => void) | null>(null)

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

  useEffect(() => {
    if (activeModule !== 'MENU') {
      setMenuCreateAction(null)
    }

    if (activeModule !== 'CATEGORY') {
      setCategoryCreateAction(null)
    }

    if (activeModule !== 'TABLE') {
      setTableCreateAction(null)
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
          hideCreateButton
        />
      )
    }

    if (activeModule === 'TABLE') {
      return (
        <TableManagePanel
          onCreateActionChange={handleTableCreateActionChange}
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
      />
    )
  }, [
    activeModule,
    handleCategoryCreateActionChange,
    handleMenuCreateActionChange,
    handleTableCreateActionChange
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

    if (!menuCreateAction) {
      return null
    }

    return {
      label: '+ 메뉴추가',
      onClick: menuCreateAction
    }
  }, [activeModule, categoryCreateAction, menuCreateAction, tableCreateAction])

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
        void handleTopSave()
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [activeModule, keyboardMode, moduleSaveAction, isModuleSaving])

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
      router.push('/pos/cooking')
      return
    }

    if (menu === 'ORDER_HISTORY') {
      router.push('/pos/orders')
      return
    }

    if (menu === 'RESERVATION') {
      router.push('/pos/reservations')
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

  const handleTopSaveClick = () => {
    void handleTopSave()
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
            <PosSidebar
              activeMenu="MENU_MANAGE"
              onChangeMenu={handleChangeMenu}
              menuOptions={TABLE_POS_SIDEBAR_MENUS}
              className={styles.sidebar}
            />

            <main className={styles.main}>
              <article className={styles.headerCard}>
                <div className={styles.headerTitleWrap}>
                  <h1 className={styles.pageTitle}>테이블 POS 설정</h1>
                  <p className={styles.pageDescription}>테이블 주문에서 사용하는 메뉴, 카테고리, 테이블 구성을 관리합니다.</p>
                </div>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleTopSaveClick}
                  disabled={!canSaveCurrentModule}
                >
                  저장
                </button>
              </article>

              <article className={styles.moduleCard}>
                <div className={styles.tabActionRow}>
                  <div className={styles.moduleTabs}>
                    {MODULE_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`${styles.moduleTabButton} ${activeModule === tab.key ? styles.moduleTabButtonActive : ''}`}
                        onClick={() => setActiveModule(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {createActionButton ? (
                    <button
                      type="button"
                      className={styles.tabActionButton}
                      onClick={createActionButton.onClick}
                    >
                      {createActionButton.label}
                    </button>
                  ) : null}
                </div>

                <div className={styles.panelScrollArea}>{activePanel}</div>
              </article>
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
    </div>
  )
}

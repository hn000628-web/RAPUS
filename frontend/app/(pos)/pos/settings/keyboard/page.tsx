'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import PosTopbar from '../../components/PosTopbar'
import styles from './PosKeyboardSettingsPage.module.css'

type ShortcutItem = {
  id: string
  actionCode: string
  name: string
  description: string
  keyCode: string
  keyLabel: string
  defaultKeyCode: string
  defaultKeyLabel: string
}

type TestKeyState = {
  code: string
  key: string
}

function createShortcut(
  id: string,
  actionCode: string,
  name: string,
  description: string,
  keyCode: string,
  keyLabel: string
): ShortcutItem {
  return {
    id,
    actionCode,
    name,
    description,
    keyCode,
    keyLabel,
    defaultKeyCode: keyCode,
    defaultKeyLabel: keyLabel
  }
}

const INITIAL_SHORTCUTS: ShortcutItem[] = [
  createShortcut(
    'table-view',
    'TABLE_VIEW',
    '테이블 화면',
    '테이블 화면으로 이동합니다.',
    'Numpad1',
    '숫자패드 1'
  ),
  createShortcut(
    'menu-view',
    'MENU_VIEW',
    '메뉴 화면',
    '메뉴 화면으로 이동합니다.',
    'Numpad2',
    '숫자패드 2'
  ),
  createShortcut(
    'order-history',
    'ORDER_HISTORY',
    '주문내역',
    '주문내역 화면으로 이동합니다.',
    'Numpad3',
    '숫자패드 3'
  ),
  createShortcut(
    'payment-open',
    'PAYMENT_OPEN',
    '결제 화면',
    '결제 화면으로 이동합니다.',
    'Numpad4',
    '숫자패드 4'
  ),
  createShortcut(
    'payment-cash',
    'PAYMENT_CASH',
    '현금 선택',
    '현금 결제를 선택합니다.',
    'Numpad7',
    '숫자패드 7'
  ),
  createShortcut(
    'payment-card',
    'PAYMENT_CARD',
    '카드 선택',
    '카드 결제를 선택합니다.',
    'Numpad8',
    '숫자패드 8'
  ),
  createShortcut(
    'payment-qr',
    'PAYMENT_QR',
    'QR 선택',
    'QR 결제를 선택합니다.',
    'Numpad9',
    '숫자패드 9'
  ),
  createShortcut(
    'confirm',
    'CONFIRM',
    '확인 / 선택',
    '현재 선택을 확인합니다.',
    'NumpadEnter',
    '숫자패드 Enter'
  ),
  createShortcut(
    'cancel',
    'CANCEL',
    '취소',
    '현재 동작을 취소합니다.',
    'NumpadDecimal',
    '숫자패드 .'
  ),
  createShortcut(
    'qty-inc',
    'QUANTITY_INCREASE',
    '수량 증가',
    '선택한 메뉴 수량을 증가합니다.',
    'NumpadAdd',
    '숫자패드 +'
  ),
  createShortcut(
    'qty-dec',
    'QUANTITY_DECREASE',
    '수량 감소',
    '선택한 메뉴 수량을 감소합니다.',
    'NumpadSubtract',
    '숫자패드 -'
  ),
  createShortcut(
    'item-delete',
    'ITEM_DELETE',
    '선택 항목 삭제',
    '현재 선택된 항목을 삭제합니다.',
    'NumpadMultiply',
    '숫자패드 *'
  ),
  createShortcut(
    'f1-table',
    'TABLE_VIEW_FUNCTION',
    '기능키 F1',
    '테이블 화면으로 이동합니다.',
    'F1',
    'F1'
  ),
  createShortcut(
    'f2-menu',
    'MENU_VIEW_FUNCTION',
    '기능키 F2',
    '메뉴 화면으로 이동합니다.',
    'F2',
    'F2'
  ),
  createShortcut(
    'f3-order',
    'ORDER_HISTORY_FUNCTION',
    '기능키 F3',
    '주문내역 화면으로 이동합니다.',
    'F3',
    'F3'
  ),
  createShortcut(
    'f4-payment',
    'PAYMENT_OPEN_FUNCTION',
    '기능키 F4',
    '결제 화면으로 이동합니다.',
    'F4',
    'F4'
  ),
  createShortcut(
    'f5-cash',
    'PAYMENT_CASH_FUNCTION',
    '기능키 F5',
    '현금 결제를 선택합니다.',
    'F5',
    'F5'
  ),
  createShortcut(
    'f6-card',
    'PAYMENT_CARD_FUNCTION',
    '기능키 F6',
    '카드 결제를 선택합니다.',
    'F6',
    'F6'
  ),
  createShortcut(
    'f7-qr',
    'PAYMENT_QR_FUNCTION',
    '기능키 F7',
    'QR 결제를 선택합니다.',
    'F7',
    'F7'
  ),
  createShortcut(
    'f8-reset',
    'ORDER_RESET',
    '기능키 F8',
    '주문 취소 또는 초기화에 사용합니다.',
    'F8',
    'F8'
  ),
  createShortcut(
    'f9-inc',
    'QUANTITY_INCREASE_FUNCTION',
    '기능키 F9',
    '선택한 메뉴 수량을 증가합니다.',
    'F9',
    'F9'
  ),
  createShortcut(
    'f10-dec',
    'QUANTITY_DECREASE_FUNCTION',
    '기능키 F10',
    '선택한 메뉴 수량을 감소합니다.',
    'F10',
    'F10'
  ),
  createShortcut(
    'f11-hold',
    'ORDER_HOLD',
    '기능키 F11',
    '전체화면 또는 주문 보류에 사용합니다.',
    'F11',
    'F11'
  ),
  createShortcut(
    'f12-settings',
    'OPEN_SETTINGS',
    '기능키 F12',
    '설정 또는 관리자 기능에 사용합니다.',
    'F12',
    'F12'
  ),
  createShortcut(
    'enter-confirm',
    'ENTER_CONFIRM',
    'Enter',
    '현재 선택을 확인합니다.',
    'Enter',
    'Enter'
  ),
  createShortcut(
    'escape-cancel',
    'ESCAPE_CANCEL',
    'Escape',
    '현재 동작을 취소합니다.',
    'Escape',
    'Escape'
  ),
  createShortcut(
    'space-toggle',
    'SPACE_TOGGLE',
    'Space',
    '선택 항목을 토글합니다.',
    'Space',
    'Space'
  ),
  createShortcut(
    'backspace-delete',
    'BACKSPACE_DELETE',
    'Backspace',
    '선택 항목을 삭제하거나 되돌립니다.',
    'Backspace',
    'Backspace'
  ),
  createShortcut(
    'save-settings',
    'SAVE_KEYBOARD_SETTINGS',
    '저장',
    '키보드 설정을 서버에 저장합니다.',
    'Ctrl+S',
    'Ctrl + S'
  ),
  createShortcut(
    'arrow-up',
    'MOVE_UP',
    '방향키 위',
    '위 항목으로 이동합니다.',
    'ArrowUp',
    'ArrowUp'
  ),
  createShortcut(
    'arrow-down',
    'MOVE_DOWN',
    '방향키 아래',
    '아래 항목으로 이동합니다.',
    'ArrowDown',
    'ArrowDown'
  ),
  createShortcut(
    'arrow-left',
    'MOVE_LEFT',
    '방향키 왼쪽',
    '왼쪽 항목으로 이동합니다.',
    'ArrowLeft',
    'ArrowLeft'
  ),
  createShortcut(
    'arrow-right',
    'MOVE_RIGHT',
    '방향키 오른쪽',
    '오른쪽 항목으로 이동합니다.',
    'ArrowRight',
    'ArrowRight'
  )
]

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  )
}

function formatKeyLabel(event: KeyboardEvent) {
  const { code } = event

  if (code.startsWith('Numpad')) {
    if (code === 'NumpadAdd') {
      return '숫자패드 +'
    }

    if (code === 'NumpadSubtract') {
      return '숫자패드 -'
    }

    if (code === 'NumpadMultiply') {
      return '숫자패드 *'
    }

    if (code === 'NumpadDivide') {
      return '숫자패드 /'
    }

    if (code === 'NumpadDecimal') {
      return '숫자패드 .'
    }

    if (code === 'NumpadEnter') {
      return '숫자패드 Enter'
    }

    const numeric = code.replace('Numpad', '')
    return `숫자패드 ${numeric}`
  }

  if (/^F\d{1,2}$/.test(code)) {
    return code
  }

  if (code === 'Space') {
    return 'Space'
  }

  return code
}

export default function PosKeyboardSettingsPage() {
  const router = useRouter()
  const {
    keyboardMode,
    toggleKeyboardMode
  } = usePosKeyboardMode()
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(INITIAL_SHORTCUTS)
  const [waitingShortcutId, setWaitingShortcutId] = useState<string | null>(null)
  const [lastTestKey, setLastTestKey] = useState<TestKeyState>({ code: '-', key: '-' })
  const [pageNotice, setPageNotice] = useState<string | null>(null)
  const [executedActionMessage, setExecutedActionMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const waitingShortcut = useMemo(
    () => shortcuts.find((item) => item.id === waitingShortcutId) ?? null,
    [shortcuts, waitingShortcutId]
  )

  const handleGoPos = () => {
    router.push('/pos')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleGoPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleToggleKeyboardMode = () => {
    const nextMode = keyboardMode === 'GENERAL' ? 'POS' : 'GENERAL'

    toggleKeyboardMode()
    setExecutedActionMessage(null)
    setPageNotice(
      nextMode === 'POS'
        ? 'POS 모드가 활성화되었습니다. 이제 POS 단축키를 사용할 수 있습니다.'
        : '일반 모드로 전환되었습니다. POS 단축키는 실행되지 않습니다.'
    )
  }

  const handleStartCapture = (shortcutId: string) => {
    setWaitingShortcutId(shortcutId)
    setExecutedActionMessage(null)
    setPageNotice('변경할 키를 눌러 새 단축키를 등록하세요.')
  }

  const handleResetShortcut = (shortcutId: string) => {
    setShortcuts((prev) =>
      prev.map((item) =>
        item.id === shortcutId
          ? {
              ...item,
              keyCode: item.defaultKeyCode,
              keyLabel: item.defaultKeyLabel
            }
          : item
      )
    )

    if (waitingShortcutId === shortcutId) {
      setWaitingShortcutId(null)
    }

    setExecutedActionMessage(null)
    setPageNotice('선택한 단축키가 기본값으로 초기화되었습니다.')
  }

  const handleSaveShortcuts = useCallback(() => {
    if (isSaving) {
      return
    }

    setIsSaving(true)
    setExecutedActionMessage(null)
    setPageNotice(null)

    window.setTimeout(() => {
      setIsSaving(false)
      setPageNotice('키보드 설정이 저장되었습니다. 현재 단계는 화면 기준 목업 저장입니다.')
    }, 300)
  }, [isSaving])

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrMetaS =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 's'

      if (isCtrlOrMetaS) {
        event.preventDefault()
        setLastTestKey({
          code: 'Ctrl+S',
          key: 'Ctrl + S'
        })
        handleSaveShortcuts()
        setExecutedActionMessage('POS 단축키 실행: 저장')
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      setLastTestKey({
        code: event.code || '-',
        key: event.key || '-'
      })

      if (waitingShortcutId) {
        event.preventDefault()

        const duplicateShortcut = shortcuts.find(
          (item) => item.keyCode === event.code && item.id !== waitingShortcutId
        )

        if (duplicateShortcut) {
          setPageNotice('이미 사용 중인 키입니다.')
          return
        }

        setShortcuts((prev) =>
          prev.map((item) =>
            item.id === waitingShortcutId
              ? {
                  ...item,
                  keyCode: event.code,
                  keyLabel: formatKeyLabel(event)
                }
              : item
          )
        )

        setWaitingShortcutId(null)
        setExecutedActionMessage(null)
        setPageNotice('단축키가 변경되었습니다.')
        return
      }

      if (keyboardMode !== 'POS') {
        return
      }

      const matchedShortcut = shortcuts.find((item) => item.keyCode === event.code)

      if (!matchedShortcut) {
        return
      }

      event.preventDefault()
      setPageNotice(null)
      setExecutedActionMessage(`POS 단축키 실행: ${matchedShortcut.name}`)
    }

    window.addEventListener('keydown', handleWindowKeyDown)

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [handleSaveShortcuts, keyboardMode, shortcuts, waitingShortcutId])

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="키보드 설정"
            onHomeClick={handleGoPos}
            onSettingsClick={handleGoPosSettings}
            onMyPageClick={handleGoMyPage}
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={handleToggleKeyboardMode}
          />
        </div>
      </header>

      <div className={styles.shell}>
        <section className={styles.headerCard}>
          <div>
            <h1 className={styles.pageTitle}>키보드 설정</h1>
            <p className={styles.pageDescription}>
              POS 조작용 전체 키보드 단축키를 설정합니다.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryButton} onClick={handleGoPosSettings}>
              뒤로가기
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSaveShortcuts}
              disabled={isSaving}
            >
              {isSaving ? '저장중' : '저장'}
            </button>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <article className={styles.shortcutPanel}>
            <h2 className={styles.sectionTitle}>키보드 단축키 목록</h2>
            <div className={styles.shortcutList}>
              {shortcuts.map((shortcut) => {
                const isWaiting = waitingShortcutId === shortcut.id

                return (
                  <div key={shortcut.id} className={styles.shortcutCard}>
                    <div className={styles.shortcutInfo}>
                      <p className={styles.shortcutName}>{shortcut.name}</p>
                      <p className={styles.shortcutDescription}>{shortcut.description}</p>
                    </div>

                    <div className={styles.actionButtons}>
                      <span className={isWaiting ? styles.waitingBadge : styles.keyBadge}>
                        {isWaiting ? '키를 입력하세요' : `${shortcut.keyLabel} (${shortcut.keyCode})`}
                      </span>
                      <button
                        type="button"
                        className={styles.cardButton}
                        onClick={() => handleStartCapture(shortcut.id)}
                        disabled={isSaving}
                      >
                        키 변경
                      </button>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => handleResetShortcut(shortcut.id)}
                        disabled={isSaving}
                      >
                        초기화
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>

          <article className={styles.testPanel}>
            <h2 className={styles.sectionTitle}>키 입력 테스트</h2>
            <p className={styles.pageDescription}>
              일반 모드에서는 입력 테스트만 동작하고, POS 모드에서만 단축키가 실행됩니다. 단,
              Ctrl+S 저장 단축키는 입력 필드 포커스 중에도 동작합니다.
            </p>
            <div className={styles.testBox}>
              <p className={styles.testModeValue}>
                현재 모드: {keyboardMode === 'POS' ? 'POS' : '일반'}
              </p>
              <p className={styles.testValue}>code: {lastTestKey.code}</p>
              <p className={styles.testValue}>key: {lastTestKey.key}</p>
              {waitingShortcut ? (
                <p className={styles.waitingBadge}>대기 중: {waitingShortcut.name}</p>
              ) : null}
              {executedActionMessage ? (
                <p className={styles.noticeText}>{executedActionMessage}</p>
              ) : null}
              {pageNotice ? <p className={styles.noticeText}>{pageNotice}</p> : null}
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}

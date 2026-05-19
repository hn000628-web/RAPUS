'use client'

import { createContext, ReactNode, useContext, useMemo, useState } from 'react'
import { useEffect } from 'react'

export type PosKeyboardMode =
  | 'GENERAL'
  | 'POS'

type PosKeyboardModeContextValue = {
  keyboardMode: PosKeyboardMode
  setKeyboardMode: (mode: PosKeyboardMode) => void
  toggleKeyboardMode: () => void
}

const PosKeyboardModeContext = createContext<PosKeyboardModeContextValue | null>(null)

type PosKeyboardModeProviderProps = {
  children: ReactNode
}

export function PosKeyboardModeProvider({ children }: PosKeyboardModeProviderProps) {
  const [keyboardMode, setKeyboardMode] = useState<PosKeyboardMode>('POS')

  useEffect(() => {
    function getVisibleSaveButton(): HTMLButtonElement | null {
      const buttons = Array.from(document.querySelectorAll('button'))

      for (const element of buttons) {
        if (!(element instanceof HTMLButtonElement)) {
          continue
        }

        if (element.disabled) {
          continue
        }

        if (element.offsetParent === null) {
          continue
        }

        const label = element.textContent?.replace(/\s+/g, ' ').trim() ?? ''

        if (label === '저장' || label === '수정 저장') {
          return element
        }
      }

      return null
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (keyboardMode !== 'POS') {
        return
      }

      const isSaveShortcut =
        (event.ctrlKey || event.metaKey)
        && event.key.toLowerCase() === 's'

      if (!isSaveShortcut) {
        return
      }

      const saveButton = getVisibleSaveButton()

      if (!saveButton) {
        return
      }

      event.preventDefault()
      saveButton.click()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [keyboardMode])

  const value = useMemo<PosKeyboardModeContextValue>(() => {
    return {
      keyboardMode,
      setKeyboardMode,
      toggleKeyboardMode: () => {
        setKeyboardMode((prev) => (prev === 'GENERAL' ? 'POS' : 'GENERAL'))
      }
    }
  }, [keyboardMode])

  return (
    <PosKeyboardModeContext.Provider value={value}>
      {children}
    </PosKeyboardModeContext.Provider>
  )
}

export function usePosKeyboardMode() {
  const context = useContext(PosKeyboardModeContext)

  if (!context) {
    throw new Error('usePosKeyboardMode must be used within PosKeyboardModeProvider')
  }

  return context
}

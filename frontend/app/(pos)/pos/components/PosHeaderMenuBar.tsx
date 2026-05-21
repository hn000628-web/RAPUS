// FILE : frontend/app/(pos)/pos/components/PosHeaderMenuBar.tsx
// ROLE : POS TOP HORIZONTAL MENU BAR COMPONENT

'use client'

import { useEffect, useRef, useState } from 'react'

import styles from './PosHeaderMenuBar.module.css'
import { POS_MAIN_MENUS, PosMenuKey, PosMenuOption } from './posTypes'

type PosHeaderMenuBarProps = {
  activeMenu: PosMenuKey
  onChangeMenu: (menu: PosMenuKey) => void
  menuOptions?: PosMenuOption[]
}

export default function PosHeaderMenuBar({
  activeMenu,
  onChangeMenu,
  menuOptions
}: PosHeaderMenuBarProps) {
  const resolvedMenuOptions = menuOptions ?? POS_MAIN_MENUS
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [isCompactViewport, setIsCompactViewport] = useState(false)

  useEffect(() => {
    function handleResize() {
      setIsCompactViewport(window.innerWidth <= 720)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  function handleSlideMenu(direction: 'left' | 'right') {
    const scroller = scrollerRef.current

    if (!scroller) {
      return
    }

    scroller.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth'
    })
  }

  const menuButtons = (
    <div ref={scrollerRef} className={styles.menuScroller}>
      {resolvedMenuOptions.map((menu) => {
        const isActive = activeMenu === menu.key

        return (
          <button
            key={menu.key}
            type="button"
            className={`${styles.menuButton} ${isActive ? styles.menuButtonActive : ''}`}
            aria-pressed={isActive}
            onClick={() => onChangeMenu(menu.key)}
          >
            {menu.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <nav className={styles.menuBar} aria-label="POS menu">
      {isCompactViewport ? (
        <div className={styles.menuSliderShell}>
          <button
            type="button"
            className={styles.menuSlideButton}
            aria-label="이전 메뉴"
            onClick={() => handleSlideMenu('left')}
          >
            ‹
          </button>

          <div className={styles.menuSliderViewport}>{menuButtons}</div>

          <button
            type="button"
            className={styles.menuSlideButton}
            aria-label="다음 메뉴"
            onClick={() => handleSlideMenu('right')}
          >
            ›
          </button>
        </div>
      ) : (
        <div className={styles.menuSliderViewport}>{menuButtons}</div>
      )}
    </nav>
  )
}

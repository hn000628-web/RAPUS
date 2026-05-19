// FILE : frontend/app/(pos)/pos/components/PosSidebar.tsx
// ROOT : frontend/app/(pos)/pos/components/PosSidebar.tsx
// STATUS : CREATE MODE
// ROLE : POS MAIN SIDEBAR COMPONENT
// CHANGE SUMMARY :
// - 醫뚯륫 POS 硫붾돱 ?뚮뜑留?遺꾨━
// - activeMenu / onChangeMenu 援ъ“ ?곸슜
// - 湲곗〈 POS 硫붾돱 踰꾪듉紐낃낵 ?ㅽ????좎?
// - API ?몄텧 ?놁쓬
// - DB 吏곸젒 ?묎렐 ?놁쓬

// SECTION 01 : IMPORT
import type { CSSProperties } from 'react'

import { POS_MAIN_MENUS, PosMenuKey, PosMenuOption } from './posTypes'

// SECTION 02 : TYPE
type PosSidebarProps = {
  activeMenu: PosMenuKey
  onChangeMenu: (menu: PosMenuKey) => void
  shortcutLabels?: Partial<Record<PosMenuKey, string>>
  menuOptions?: PosMenuOption[]
  className?: string
}

// SECTION 03 : COMPONENT
export default function PosSidebar({
  activeMenu,
  onChangeMenu,
  shortcutLabels,
  menuOptions,
  className
}: PosSidebarProps) {
  const resolvedMenuOptions = menuOptions ?? POS_MAIN_MENUS

  return (
    <aside className={className} style={sidebarStyle}>
      <div style={sidebarListStyle}>
        {resolvedMenuOptions.map((menu) => {
          const isSelected = activeMenu === menu.key
          const shortcutLabel = shortcutLabels?.[menu.key]

          return (
            <button
              key={menu.key}
              type="button"
              aria-pressed={isSelected}
              style={isSelected ? menuActiveButtonStyle : menuButtonStyle}
              onClick={() => onChangeMenu(menu.key)}
            >
              <span style={menuLabelRowStyle}>
                <span>{menu.label}</span>
                {shortcutLabel ? (
                  <span style={isSelected ? menuShortcutActiveStyle : menuShortcutStyle}>
                    {shortcutLabel}
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

// SECTION 04 : STYLE
const sidebarStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '16px',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden'
}


const sidebarListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  height: '100%',
  minHeight: 0,
  overflowY: 'auto'
}

const menuButtonStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: '15px',
  fontWeight: 800,
  textAlign: 'left',
  cursor: 'pointer'
}

const menuLabelRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  width: '100%'
}

const menuShortcutStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '36px',
  height: '24px',
  padding: '0 8px',
  borderRadius: '999px',
  border: '1px solid #d1d5db',
  backgroundColor: '#f8fafc',
  color: '#111827',
  fontSize: '12px',
  fontWeight: 900,
  whiteSpace: 'nowrap'
}

const menuShortcutActiveStyle: CSSProperties = {
  ...menuShortcutStyle,
  border: '1px solid rgba(255,255,255,0.35)',
  backgroundColor: 'rgba(255,255,255,0.16)',
  color: '#ffffff'
}

const menuActiveButtonStyle: CSSProperties = {
  ...menuButtonStyle,
  border: '1px solid #111827',
  backgroundColor: '#111827',
  color: '#ffffff'
}


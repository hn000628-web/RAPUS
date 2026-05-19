// FILE : frontend/app/(after-login)/profile/business/pos/components/PosTopbar.tsx
// ROOT : frontend/app/(after-login)/profile/business/pos/components/PosTopbar.tsx
// STATUS : CREATE MODE
// ROLE : POS TOPBAR COMPONENT
// CHANGE SUMMARY :
// - POS ?섏씠吏 ?꾩슜 ?곷떒諛?// - 留ㅼ옣紐??쒖떆
// - 硫붾돱 ?깅줉/?ㅼ젙 踰꾪듉 理쒖냼 援ъ“
// - JSX multi-line, ?듭퐫??援ъ“ 以??
// ==================================================
// SECTION 01 : IMPORT
// ==================================================
import {
  useEffect,
  useState,
  type CSSProperties
} from 'react'

type KeyboardMode =
  | 'GENERAL'
  | 'POS'

type SyncStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'SYNCING'
  | 'ERROR'

type PosTopbarProps = {
  title: string
  onHomeClick: () => void
  onMyPageClick: () => void
  onSettingsClick: () => void
  homeShortcutLabel?: string
  keyboardMode?: KeyboardMode
  onToggleKeyboardMode?: () => void
  syncStatus?: SyncStatus
}

// ==================================================
// SECTION 02 : COMPONENT
// ==================================================
export default function PosTopbar({
  title,
  onHomeClick,
  onMyPageClick,
  onSettingsClick,
  homeShortcutLabel,
  keyboardMode,
  onToggleKeyboardMode,
  syncStatus
}: PosTopbarProps) {
  const effectiveSyncStatus: SyncStatus = syncStatus ?? 'ONLINE'
  const effectiveKeyboardMode: KeyboardMode = keyboardMode ?? 'POS'
  const effectiveHomeShortcutLabel = homeShortcutLabel ?? 'F1'
  const syncStatusText = buildSyncStatusText(effectiveSyncStatus)
  const syncStatusStyle = buildSyncStatusStyle(effectiveSyncStatus)
  const [windowSize, setWindowSize] = useState<{
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    const syncWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    syncWindowSize()
    window.addEventListener('resize', syncWindowSize)

    return () => {
      window.removeEventListener('resize', syncWindowSize)
    }
  }, [])

  // ==================================================
  // SECTION 03 : RETURN
  // ==================================================
  return (
    <header style={topbarStyle}>
      <div style={leftStyle}>
        <strong style={titleStyle}>{title}</strong>
      </div>

      <div style={rightStyle}>
        <div
          aria-label={windowSize
            ? `창: ${windowSize.width}×${windowSize.height}`
            : '창: -×-'}
          style={statusPillStyle}
        >
          {windowSize
            ? `창: ${windowSize.width}×${windowSize.height}`
            : '창: -×-'}
        </div>

        <div
          aria-label={syncStatusText}
          style={{
            ...statusPillStyle,
            ...syncStatusStyle
          }}
        >
          {syncStatusText}
        </div>

        {onToggleKeyboardMode ? (
          <button
            type="button"
            style={{
              ...buttonStyle,
              ...(effectiveKeyboardMode === 'POS'
                ? activeModeButtonStyle
                : null)
            }}
            onClick={onToggleKeyboardMode}
          >
            키보드: {effectiveKeyboardMode === 'POS' ? 'POS' : '일반'}
          </button>
        ) : (
          <div
            aria-label={`키보드: ${effectiveKeyboardMode === 'POS' ? 'POS' : '일반'}`}
            style={{
              ...statusPillStyle,
              ...(effectiveKeyboardMode === 'POS'
                ? activeModeButtonStyle
                : offlineStatusPillStyle)
            }}
          >
            키보드: {effectiveKeyboardMode === 'POS' ? 'POS' : '일반'}
          </div>
        )}

        <button type="button" style={buttonStyle} onClick={onHomeClick}>
          {effectiveHomeShortcutLabel ? `홈 (${effectiveHomeShortcutLabel})` : '홈'}
        </button>
        <button type="button" style={buttonStyle} onClick={onSettingsClick}>
          설정
        </button>
        <button type="button" style={buttonStyle} onClick={onMyPageClick}>
          마이페이지
        </button>
      </div>
    </header>
  )
}

function buildSyncStatusText(
  syncStatus?: SyncStatus
): string {
  if (syncStatus === 'OFFLINE') {
    return '서버싱크: 오프라인'
  }

  if (syncStatus === 'SYNCING') {
    return '서버싱크: 동기화중'
  }

  if (syncStatus === 'ERROR') {
    return '서버싱크: 오류'
  }

  return '서버싱크: 실시간 ON'
}

function buildSyncStatusStyle(
  syncStatus?: SyncStatus
): CSSProperties {
  if (syncStatus === 'OFFLINE') {
    return offlineStatusPillStyle
  }

  if (syncStatus === 'SYNCING') {
    return syncingStatusPillStyle
  }

  if (syncStatus === 'ERROR') {
    return errorStatusPillStyle
  }

  return onlineStatusPillStyle
}

// ==================================================
// SECTION 04 : STYLE
// ==================================================
const topbarStyle: CSSProperties = {
  width: '100%',
  height: '64px',
  boxSizing: 'border-box',
  backgroundColor: '#111827',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '0 24px',
  color: '#ffffff',
  borderRadius: '0 0 16px 16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  flexShrink: 0
}

const leftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0
}

const rightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginLeft: 'auto',
  flexShrink: 1,
  flexWrap: 'wrap',
  justifyContent: 'flex-end'
}

const titleStyle: CSSProperties = {
  fontSize: '20px',
  fontWeight: 900
}

const buttonStyle: CSSProperties = {
  padding: '6px 14px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: '#f8fafc',
  color: '#111827',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}

const activeModeButtonStyle: CSSProperties = {
  backgroundColor: '#1f3b63',
  color: '#ffffff'
}

const statusPillStyle: CSSProperties = {
  padding: '6px 14px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 800,
  whiteSpace: 'nowrap',
  lineHeight: 1.2
}

const onlineStatusPillStyle: CSSProperties = {
  backgroundColor: '#dcfce7',
  color: '#166534'
}

const offlineStatusPillStyle: CSSProperties = {
  backgroundColor: '#e2e8f0',
  color: '#334155'
}

const syncingStatusPillStyle: CSSProperties = {
  backgroundColor: '#fef3c7',
  color: '#92400e'
}

const errorStatusPillStyle: CSSProperties = {
  backgroundColor: '#fee2e2',
  color: '#991b1b'
}

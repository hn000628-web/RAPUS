// FILE : frontend/lib/business/pos/shared/posTableSettingsRuntimeSync.ts
// ROLE : SHARED RUNTIME SYNC FOR POS TABLE SETTINGS

export type PosTableSettingsSyncReason =
  | 'create'
  | 'update'
  | 'soft-disconnect'
  | 'delete'
  | 'save'

export type PosTableSettingsSyncPayload = {
  channelCode: string
  reason: PosTableSettingsSyncReason
  timestamp: number
}

const POS_TABLE_SETTINGS_SYNC_EVENT =
  'pos-table-settings:changed'

const POS_TABLE_SETTINGS_SYNC_STORAGE_KEY =
  'pos-table-settings:changed'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function normalizeChannelCode(value: string): string {
  return String(value || '').trim()
}

export function emitPosTableSettingsSync(params: {
  channelCode: string
  reason: PosTableSettingsSyncReason
}): void {
  if (!isBrowser()) {
    return
  }

  const payload: PosTableSettingsSyncPayload = {
    channelCode: normalizeChannelCode(params.channelCode),
    reason: params.reason,
    timestamp: Date.now()
  }

  window.dispatchEvent(
    new CustomEvent<PosTableSettingsSyncPayload>(
      POS_TABLE_SETTINGS_SYNC_EVENT,
      {
        detail: payload
      }
    )
  )

  try {
    window.localStorage.setItem(
      POS_TABLE_SETTINGS_SYNC_STORAGE_KEY,
      JSON.stringify(payload)
    )
  } catch {
    // localStorage 접근 실패 시 custom event만 사용
  }
}

export function subscribePosTableSettingsSync(params: {
  channelCode: string
  onSync: (payload: PosTableSettingsSyncPayload) => void
}): () => void {
  if (!isBrowser()) {
    return () => undefined
  }

  const targetChannelCode =
    normalizeChannelCode(params.channelCode)

  if (!targetChannelCode) {
    return () => undefined
  }

  const handlePayload = (payload: PosTableSettingsSyncPayload | null) => {
    if (!payload) {
      return
    }

    if (normalizeChannelCode(payload.channelCode) !== targetChannelCode) {
      return
    }

    params.onSync(payload)
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent =
      event as CustomEvent<PosTableSettingsSyncPayload>

    handlePayload(customEvent.detail ?? null)
  }

  const handleStorageEvent = (event: StorageEvent) => {
    if (
      event.key !== POS_TABLE_SETTINGS_SYNC_STORAGE_KEY ||
      !event.newValue
    ) {
      return
    }

    try {
      const parsed =
        JSON.parse(event.newValue) as PosTableSettingsSyncPayload
      handlePayload(parsed)
    } catch {
      // JSON 파싱 실패는 무시
    }
  }

  window.addEventListener(
    POS_TABLE_SETTINGS_SYNC_EVENT,
    handleCustomEvent as EventListener
  )
  window.addEventListener('storage', handleStorageEvent)

  return () => {
    window.removeEventListener(
      POS_TABLE_SETTINGS_SYNC_EVENT,
      handleCustomEvent as EventListener
    )
    window.removeEventListener('storage', handleStorageEvent)
  }
}

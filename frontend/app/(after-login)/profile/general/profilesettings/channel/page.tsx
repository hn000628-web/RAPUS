'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  getMyProfile,
  updateChannel,
  updateProfileInfo
} from '@/lib/profileApi'

import ChannelQRCode from './components/ChannelQRCode'

import styles from './ChannelSettingsPage.module.css'

export type ChannelState = {
  profileId: number | null
  channelCode: string
  channelName: string
  displayName: string
}

type GetMyProfileResponse = {
  profile?: {
    id?: number | null
    profileId?: number | null
    profileType?: 'GENERAL' | 'BUSINESS'
    channelCode?: string | null
    channelName?: string | null
    displayName?: string | null
  } | null
}

type RowProps = {
  label: string
  children: React.ReactNode
}

const DEFAULT_ACCOUNT_TYPE = 'GENERAL'
const DEFAULT_EMPTY_TEXT = '미설정'
const CHANNEL_NAME_MIN_LENGTH = 2

function Row({
  label,
  children
}: RowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.label}>
        {label}
      </div>
      {children}
    </div>
  )
}

export default function ChannelPage() {
  const [channel, setChannel] = useState<ChannelState>({
    profileId: null,
    channelCode: '',
    channelName: '',
    displayName: ''
  })

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const trimmedChannelName = useMemo(() => {
    return channel.channelName.trim()
  }, [channel.channelName])

  const isValid = useMemo(() => {
    return trimmedChannelName.length >= CHANNEL_NAME_MIN_LENGTH
  }, [trimmedChannelName])

  const channelUrl = useMemo(() => {
    if (!channel.channelCode) {
      return DEFAULT_EMPTY_TEXT
    }

    return `xxx.com/@${channel.channelCode}`
  }, [channel.channelCode])

  const qrChannelId = useMemo(() => {
    return (
      trimmedChannelName ||
      channel.displayName ||
      channel.channelCode ||
      DEFAULT_EMPTY_TEXT
    )
  }, [trimmedChannelName, channel.displayName, channel.channelCode])

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const data = await getMyProfile() as GetMyProfileResponse
      const profile = data.profile

      if (!profile) {
        setInitialLoading(false)
        return
      }

      setChannel({
        profileId: profile.profileId || profile.id || null,
        channelCode: profile.channelCode || '',
        channelName: profile.channelName || '',
        displayName: profile.displayName || ''
      })

      setInitialLoading(false)
    } catch {
      alert('프로필 로드에 실패했습니다.')
      setInitialLoading(false)
    }
  }

  function handleChangeChannelName(value: string) {
    setChannel((prev) => ({
      ...prev,
      channelName: value
    }))
  }

  async function handleSave() {
    if (!isValid) {
      alert('채널 ID는 2자 이상이어야 합니다.')
      return
    }

    if (!channel.profileId) {
      alert('프로필 정보가 없습니다.')
      return
    }

    if (!channel.channelCode) {
      alert('채널 코드가 없습니다.')
      return
    }

    try {
      setLoading(true)

      const officialChannelUrl = `xxx.com/@${channel.channelCode}`

      await updateChannel({
        channelName: trimmedChannelName,
        channelURL: officialChannelUrl
      })

      await updateProfileInfo({
        displayName: channel.displayName
      })

      alert('저장되었습니다.')
      await loadProfile()
    } catch {
      alert('저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(channelUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1600)
    } catch {
      alert('복사에 실패했습니다.')
    }
  }

  const LoadingUI = (
    <main className={styles.page}>
      <div className={styles.loadingBox}>
        로딩중...
      </div>
    </main>
  )

  const DashboardHeaderUI = (
    <div className={styles.dashboardHeader}>
      <p className={styles.kicker}>
        GENERAL CHANNEL SETTINGS
      </p>

      <h1 className={styles.title}>
        채널 설정
      </h1>

      <p className={styles.description}>
        채널 ID와 공개 URL을 관리합니다.
      </p>
    </div>
  )

  const SettingsPanelUI = (
    <section className={styles.settingsCard}>
      {DashboardHeaderUI}

      <div className={styles.formStack}>
        <Row label="계정">
          <div className={styles.readonlyField}>
            {DEFAULT_ACCOUNT_TYPE}
          </div>
        </Row>

        <Row label="채널 ID">
          <input
            value={channel.channelName}
            onChange={(event) => {
              handleChangeChannelName(event.target.value)
            }}
            className={styles.inputField}
            placeholder="채널 ID를 입력하세요"
          />
        </Row>

        <Row label="채널 코드">
          <div className={styles.readonlyField}>
            {channel.channelCode || DEFAULT_EMPTY_TEXT}
          </div>
        </Row>

        <Row label="채널 URL">
          <div className={styles.urlField}>
            <span className={styles.urlText}>
              {channelUrl}
            </span>

            <button
              type="button"
              className={styles.copyButton}
              onClick={handleCopy}
            >
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
        </Row>

        <div className={styles.saveArea}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || loading}
            className={
              !isValid || loading
                ? `${styles.saveButton} ${styles.saveButtonDisabled}`
                : styles.saveButton
            }
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </section>
  )

  const QrPanelUI = (
    <aside className={styles.qrCard}>
      <div className={styles.qrHeader}>
        <p className={styles.qrKicker}>
          CHANNEL QR
        </p>

        <h2 className={styles.qrTitle}>
          QR 코드
        </h2>

        <p className={styles.qrDesc}>
          사용자가 스캔하면 현재 채널 URL로 이동합니다.
        </p>
      </div>

      <div className={styles.qrBox}>
        <ChannelQRCode
          channelCode={channel.channelCode}
          channelId={qrChannelId}
        />
      </div>

      <div className={styles.qrUrl}>
        {channelUrl}
      </div>

      <button
        type="button"
        className={styles.qrCopyButton}
        onClick={handleCopy}
      >
        {copied ? 'URL 복사됨' : 'URL 복사'}
      </button>
    </aside>
  )

  const MainUI = (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.settingsGrid}>
          {SettingsPanelUI}
          {QrPanelUI}
        </div>
      </section>
    </main>
  )

  if (initialLoading) {
    return LoadingUI
  }

  return MainUI
}

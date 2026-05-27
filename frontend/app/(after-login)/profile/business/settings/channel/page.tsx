'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import type {
  ReactNode
} from 'react'

import {
  getMe,
  type MeResponse
} from '@/lib/authApi'

import {
  buildProfileStoreRoute,
  getProfileByChannelCode,
  type PlaceFeedTypeCode,
  type ProfileDetailPayload
} from '@/lib/profile-summary-api'

import {
  getBusinessChannel,
  updateBusinessChannelRegion,
  updateBusinessProfileCore
} from '@/lib/business/profileApi'

import ChannelQRCode from './components/ChannelQRCode'

import styles from './ChannelSettingsPage.module.css'

type ChannelState = {
  profileId: number | null
  channelCode: string
  channelName: string
  displayName: string
  placeFeedTypeCode: PlaceFeedTypeCode | null
}

type RowProps = {
  label: string
  children: ReactNode
}

const DEFAULT_ACCOUNT_TYPE = 'BUSINESS'
const DEFAULT_EMPTY_TEXT = '미설정'
const CHANNEL_NAME_MIN_LENGTH = 2
const DEFAULT_CHANNEL_URL = '/channel/unknown'

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

export default function BusinessChannelSettingsPage() {
  const [channel, setChannel] = useState<ChannelState>({
    profileId: null,
    channelCode: '',
    channelName: '',
    displayName: '',
    placeFeedTypeCode: null
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
      return DEFAULT_CHANNEL_URL
    }

    if (typeof window !== 'undefined') {
      return `${window.location.origin}${buildProfileStoreRoute(
        channel.channelCode,
        channel.placeFeedTypeCode
      )}`
    }

    return buildProfileStoreRoute(
      channel.channelCode,
      channel.placeFeedTypeCode
    )
  }, [
    channel.channelCode,
    channel.placeFeedTypeCode
  ])

  const qrChannelId = useMemo(() => {
    return (
      trimmedChannelName ||
      channel.displayName ||
      channel.channelCode ||
      DEFAULT_EMPTY_TEXT
    )
  }, [trimmedChannelName, channel.displayName, channel.channelCode])

  useEffect(() => {
    void loadChannel()
  }, [])

  async function loadChannel() {
    try {
      const meResponse = await getMe() as MeResponse

      const currentProfileId = meResponse.user?.profileId
      const currentChannelCode = meResponse.user?.channelCode

      if (!currentProfileId || !currentChannelCode) {
        alert('로그인 컨텍스트가 없습니다.')
        setInitialLoading(false)
        return
      }

      const businessChannel = await getBusinessChannel(currentProfileId) as {
        id: number
        channelCode: string
        channelURL?: string | null
        channelName?: string | null
      }

      const summary = await getProfileByChannelCode(
        currentChannelCode
      ) as ProfileDetailPayload

      setChannel({
        profileId: businessChannel.id || summary.id || null,
        channelCode: businessChannel.channelCode || summary.channelCode || currentChannelCode,
        channelName: businessChannel.channelName || summary.channelName || '',
        displayName: summary.displayName || '',
        placeFeedTypeCode: summary.placeFeedTypeCode ?? null
      })

      setInitialLoading(false)
    } catch (error) {
      console.error('BUSINESS CHANNEL LOAD FAIL', error)
      alert('채널 정보 로드에 실패했습니다.')
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
      alert('프로필 정보를 찾을 수 없습니다.')
      return
    }

    if (!channel.channelCode) {
      alert('채널 코드를 찾을 수 없습니다.')
      return
    }

    try {
      setLoading(true)
      const officialChannelUrl =
        `xxx.com/@${channel.channelCode}`

      await updateBusinessChannelRegion(channel.profileId, {
        channelName: trimmedChannelName,
        channelURL: officialChannelUrl
      })

      await updateBusinessProfileCore(channel.profileId, {
        displayName: channel.displayName
      })

      alert('저장되었습니다.')
      await loadChannel()
    } catch (error) {
      console.error('BUSINESS CHANNEL SAVE FAIL', error)
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
        BUSINESS CHANNEL SETTINGS
      </p>

      <h1 className={styles.title}>
        채널 설정
      </h1>

      <p className={styles.description}>
        비즈니스 채널 ID와 공개 URL을 관리합니다.
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
          사용자가 스캔하면 현재 비즈니스 채널 URL로 이동합니다.
        </p>
      </div>

      <div className={styles.qrBox}>
        <ChannelQRCode
          channelCode={channel.channelCode}
          channelId={qrChannelId}
          placeFeedTypeCode={channel.placeFeedTypeCode}
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

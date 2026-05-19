'use client'

import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

import { getBusinessProfileContext } from '@/lib/profile-summary-api'
import {
  getMe,
  switchProfile
} from '@/lib/authApi'
import {
  getBusinessHoursSetting,
  saveBusinessHoursSetting,
  defaultBusinessHoursState,
  type BusinessHour,
  type DayKey
} from '@/lib/business/business-hours-api'

// ==================================================
// STYLE
// ==================================================
const page: CSSProperties = { background: '#f4f6fa', minHeight: '100vh', padding: '16px 0' }
const container: CSSProperties = { width: 640, margin: '0 auto', background: '#fff', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
const todayBox: CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 6 }
const todayTitle: CSSProperties = { fontSize: 13, fontWeight: 700, color: '#6b7280' }
const todayText: CSSProperties = { fontSize: 16, fontWeight: 700, color: '#111827' }
const offControlRow: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }
const offControlLabel: CSSProperties = { fontSize: 14, fontWeight: 700, color: '#111827' }
const offControlSubText: CSSProperties = { fontSize: 12, color: '#6b7280', marginTop: 4 }
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 }
const label: CSSProperties = { width: 80, fontWeight: 600, color: '#333' }
const input: CSSProperties = { flex: 1, height: 30, border: '1px solid #ddd', borderRadius: 8, padding: '0 10px' }
const checkbox: CSSProperties = { marginLeft: 10, whiteSpace: 'nowrap' }
const saveBtn: CSSProperties = { marginTop: 20, padding: '12px 0', background: '#2563eb', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer' }
const switchWrap: CSSProperties = { position: 'relative', width: 52, height: 30, flexShrink: 0 }
const switchInput: CSSProperties = { position: 'absolute', opacity: 0, width: 0, height: 0 }

const dayLabels: Record<DayKey, string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일'
}

const dayOrder: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const todayKeyMap: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

type BusinessHoursStateWithMeta = Record<DayKey, BusinessHour> & {
  temporaryClosed?: 0 | 1
  isOpenNow?: boolean
}

export default function Page() {
  const [hours, setHours] = useState<BusinessHoursStateWithMeta>(defaultBusinessHoursState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hoursTemporaryClosed, setHoursTemporaryClosed] = useState(false)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [channelCode, setChannelCode] = useState<string | null>(null)

  // ==================================================
  // INIT
  // ==================================================
  useEffect(() => {
    const init = async () => {
      try {
        const me = await getMe()

        if (me.user?.profileType !== 'BUSINESS') {
          await switchProfile('BUSINESS')
        }

        const context = await getBusinessProfileContext()
        setProfileId(context.profileId)
        setChannelCode(context.channelCode)

        const data = await getBusinessHoursSetting(
          context.profileId,
          context.channelCode
        )

        setHours(data)
        setHoursTemporaryClosed(data.temporaryClosed === 1)
      } catch (err) {
        console.error('영업시간 로딩 오류', err)
        setHours(defaultBusinessHoursState)
        setHoursTemporaryClosed(false)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  function toggleClosed(day: DayKey) {
    setHours((prev) => {
      const nextClosed = !prev[day].isClosed
      return {
        ...prev,
        [day]: {
          ...prev[day],
          isClosed: nextClosed,
          startTime: nextClosed ? '' : (prev[day].startTime || '09:00'),
          endTime: nextClosed ? '' : (prev[day].endTime || '18:00')
        }
      }
    })
  }

  function changeStartTime(day: DayKey, value: string) {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        startTime: value
      }
    }))
  }

  function changeEndTime(day: DayKey, value: string) {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        endTime: value
      }
    }))
  }

  function toggleTemporaryClosed() {
    setHoursTemporaryClosed((prev) => !prev)
  }

  async function save() {
    if (!profileId || !channelCode) {
      alert('프로필 컨텍스트가 없습니다')
      return
    }

    try {
      setSaving(true)

      await saveBusinessHoursSetting({
        ...hours,
        temporaryClosed: hoursTemporaryClosed ? 1 : 0
      } as BusinessHoursStateWithMeta)

      const refreshed = await getBusinessHoursSetting(profileId, channelCode)
      setHours(refreshed)
      setHoursTemporaryClosed(refreshed.temporaryClosed === 1)

      alert('영업시간이 저장되었습니다.')
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error
          ? err.message
          : '영업시간 저장 중 오류 발생'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>loading...</div>

  const hasContext =
    typeof profileId === 'number' &&
    profileId > 0 &&
    typeof channelCode === 'string' &&
    channelCode.trim().length > 0

  const todayKey: DayKey = todayKeyMap[new Date().getDay()]
  const todayHour = hours[todayKey]

  const parseMinutes = (time: string) => {
    const [hour, minute] = (time || '').split(':').map(Number)
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null
    return (hour * 60) + minute
  }

  const localIsOpenNow = (() => {
    if (hoursTemporaryClosed) return false
    if (!todayHour || todayHour.isClosed) return false
    const start = parseMinutes(todayHour.startTime)
    const end = parseMinutes(todayHour.endTime)
    if (start === null || end === null) return false
    const now = new Date()
    const nowMinutes = (now.getHours() * 60) + now.getMinutes()
    return nowMinutes >= start && nowMinutes < end
  })()

  const dbIsOpenNow =
    typeof hours.isOpenNow === 'boolean'
      ? hours.isOpenNow
      : localIsOpenNow

  const todaySummary = hoursTemporaryClosed
    ? '영업종료'
    : todayHour?.isClosed
      ? `${dayLabels[todayKey]} · 휴무`
      : `${dbIsOpenNow ? '영업중' : '영업종료'} ${dayLabels[todayKey]} 오픈 : ${todayHour?.startTime || '--:--'} - 마감 : ${todayHour?.endTime || '--:--'}`

  return (
    <div style={page}>
      <div style={container}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>영업시간 설정</div>

        {hasContext && (
          <div style={todayBox}>
            <div style={todayTitle}>Today</div>
            <div style={todayText}>{todaySummary}</div>
          </div>
        )}

        <div style={offControlRow}>
          <div>
            <div style={offControlLabel}>전체 OFF</div>
            <div style={offControlSubText}>긴급한 문제 발생 시 영업시간 전체를 즉시 비활성화합니다.</div>
          </div>
          <label style={switchWrap}>
            <input type="checkbox" checked={hoursTemporaryClosed} onChange={toggleTemporaryClosed} style={switchInput} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: hoursTemporaryClosed ? '#ef4444' : '#d1d5db', transition: '0.2s', cursor: 'pointer' }} />
            <span style={{ position: 'absolute', top: 3, left: hoursTemporaryClosed ? 25 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transition: '0.2s', cursor: 'pointer' }} />
          </label>
        </div>

        {dayOrder.map((day) => {
          const hour = hours[day]

          return (
            <div style={row} key={day}>
              <div style={label}>{dayLabels[day]}</div>
              <input type="time" value={hour.startTime} onChange={(e) => changeStartTime(day, e.target.value)} style={input} disabled={hour.isClosed || hoursTemporaryClosed} />
              <input type="time" value={hour.endTime} onChange={(e) => changeEndTime(day, e.target.value)} style={input} disabled={hour.isClosed || hoursTemporaryClosed} />
              <label style={checkbox}>
                <input type="checkbox" checked={hour.isClosed} onChange={() => toggleClosed(day)} disabled={hoursTemporaryClosed} /> 휴무
              </label>
            </div>
          )
        })}

        <button style={{ ...saveBtn, opacity: saving ? 0.7 : 1, cursor: saving ? 'default' : 'pointer' }} onClick={save} disabled={saving}>
          {saving ? '저장중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

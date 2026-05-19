// FILE : frontend/app/(after-login)/profile/general/create/components/RegionSelector.tsx
// ROOT : frontend/app/(after-login)/profile/general/create/components/RegionSelector.tsx
// STATUS : RULE SAFE / OPTIONAL REGION TOGGLE / API SAFE
// ROLE : OPTIONAL REGION SELECTOR
// OUTPUT MODE : MODIFY

'use client'

// SECTION 01 : IMPORT

import { useEffect, useMemo, useState } from 'react'

import { apiFetch } from '@/lib/api'

// SECTION 02 : TYPE

type Props = {
  category: 'GENERAL' | 'USED'
  profileRegionId: number | null
  profileRegionName: string | null
  tradeRegionId: number | null
  setTradeRegionId: (value: number | null) => void
  loading?: boolean
}

type Region = {
  id: number
  name: string
}

// SECTION 03 : COMPONENT

export default function RegionSelector({
  category,
  profileRegionId,
  profileRegionName,
  tradeRegionId,
  setTradeRegionId,
  loading = false
}: Props) {
  const [regions, setRegions] = useState<Region[]>([])
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [open, setOpen] = useState(false)
  const [useRegionSetting, setUseRegionSetting] = useState(
    tradeRegionId !== null
  )

  // SECTION 04 : MEMO

  const currentRegion = useMemo(() => {
    const selectedRegionName =
      regions.find((region) => region.id === tradeRegionId)?.name ?? null

    if (selectedRegionName) {
      return selectedRegionName
    }

    if (useRegionSetting && profileRegionName) {
      return profileRegionName
    }

    return '지역 선택'
  }, [
    profileRegionName,
    regions,
    tradeRegionId,
    useRegionSetting
  ])

  // SECTION 05 : DATA FUNCTION

  async function fetchRegions() {
    try {
      setLoadingRegions(true)

      const data = await apiFetch<Region[]>(
        'regions',
        {
          method: 'GET'
        }
      )

      if (Array.isArray(data)) {
        setRegions(data)
      }
    } catch (error) {
      console.error('region load error', error)
    } finally {
      setLoadingRegions(false)
    }
  }

  // SECTION 06 : EVENT FUNCTION

  function handleToggleRegionSetting() {
    const nextValue = !useRegionSetting

    setUseRegionSetting(nextValue)

    if (!nextValue) {
      setTradeRegionId(null)
      setOpen(false)
      return
    }

    if (tradeRegionId === null && profileRegionId !== null) {
      setTradeRegionId(profileRegionId)
    }
  }

  // SECTION 07 : EFFECT

  useEffect(() => {
    if (!useRegionSetting) {
      return
    }

    if (!open) {
      return
    }

    if (regions.length > 0) {
      return
    }

    void fetchRegions()
  }, [
    open,
    regions.length,
    useRegionSetting
  ])

  // SECTION 08 : RETURN

  return (
    <div style={{ marginTop: 12, marginBottom: 12 }}>
      <div
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          gap: 12
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: '#111',
            flex: 1
          }}
        >
          {useRegionSetting
            ? currentRegion
            : '지역설정 사용 안 함'}
        </div>

        <button
          type="button"
          disabled={loading}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: useRegionSetting ? '#2f6bff' : '#666',
            border: 'none',
            background: 'none',
            cursor: 'pointer'
          }}
          onClick={handleToggleRegionSetting}
        >
          {useRegionSetting ? '지역설정 ON' : '지역설정 OFF'}
        </button>

        <button
          type="button"
          disabled={loading || !useRegionSetting}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: useRegionSetting ? '#2f6bff' : '#999',
            border: 'none',
            background: 'none',
            cursor: useRegionSetting ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (!useRegionSetting) {
              return
            }

            setOpen((prev) => !prev)
          }}
        >
          지역선택
        </button>
      </div>

      {open && useRegionSetting && (
        <div style={{ marginTop: 8 }}>
          <select
            value={tradeRegionId ?? ''}
            disabled={loading || loadingRegions}
            onChange={(event) =>
              setTradeRegionId(
                event.target.value
                  ? Number(event.target.value)
                  : null
              )
            }
            style={{
              width: '100%',
              height: 42,
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              padding: '0 10px'
            }}
          >
            <option value="">
              지역 선택
            </option>

            {regions.map((region) => (
              <option
                key={region.id}
                value={region.id}
              >
                {region.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
// FILE : frontend/app/(after-login)/profile/business/create/posts/components/BusinessRegionSelector.tsx
// ROOT : frontend/app/(after-login)/profile/business/create/posts/components/BusinessRegionSelector.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS POST REGION SELECTOR
// CHANGE SUMMARY :
// - BUSINESS 포스트 지역설정 기본값 ON 적용
// - profileRegionId 존재 시 tradeRegionId 자동 세팅
// - 사용자가 OFF로 직접 변경한 경우 자동 ON 재적용 방지
// - category props 제거 유지
// - BusinessRegionSelector 컴포넌트명 유지
// - 하단 select dropdown 제거 유지
// - 지역선택 클릭 시 비즈니스 포스트 전용 지역설정 페이지로 이동 유지
// - 기존 props / UI 스타일 구조 유지

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

// SECTION 02 : TYPE

type Props = {
  profileRegionId: number | null
  profileRegionName: string | null
  tradeRegionId: number | null
  setTradeRegionId: (value: number | null) => void
  loading?: boolean
}

// SECTION 03 : COMPONENT

export default function BusinessRegionSelector({
  profileRegionId,
  profileRegionName,
  tradeRegionId,
  setTradeRegionId,
  loading = false
}: Props) {
  const router = useRouter()

  const userTouchedRegionToggleRef =
    useRef(false)

  const autoAppliedProfileRegionRef =
    useRef(false)

  const [useRegionSetting, setUseRegionSetting] =
    useState(
      tradeRegionId !== null ||
      profileRegionId !== null
    )

  // SECTION 04 : MEMO

  const currentRegion = useMemo(() => {
    if (!useRegionSetting) {
      return '지역설정 사용 안 함'
    }

    if (
      tradeRegionId !== null &&
      tradeRegionId === profileRegionId
    ) {
      return profileRegionName ?? '프로필 지역'
    }

    if (
      tradeRegionId !== null &&
      profileRegionName
    ) {
      return profileRegionName
    }

    if (tradeRegionId !== null) {
      return `선택된 지역 ID: ${tradeRegionId}`
    }

    if (profileRegionName) {
      return profileRegionName
    }

    return '지역 선택'
  }, [
    profileRegionId,
    profileRegionName,
    tradeRegionId,
    useRegionSetting
  ])

  // SECTION 05 : EFFECT

  useEffect(() => {
    if (userTouchedRegionToggleRef.current) {
      return
    }

    if (autoAppliedProfileRegionRef.current) {
      return
    }

    if (profileRegionId === null) {
      return
    }

    autoAppliedProfileRegionRef.current = true

    setUseRegionSetting(true)

    if (tradeRegionId === null) {
      setTradeRegionId(profileRegionId)
    }
  }, [
    profileRegionId,
    tradeRegionId,
    setTradeRegionId
  ])

  // SECTION 06 : EVENT FUNCTION

  function handleToggleRegionSetting() {
    userTouchedRegionToggleRef.current = true

    const nextValue =
      !useRegionSetting

    setUseRegionSetting(nextValue)

    if (!nextValue) {
      setTradeRegionId(null)
      return
    }

    if (
      tradeRegionId === null &&
      profileRegionId !== null
    ) {
      setTradeRegionId(profileRegionId)
    }
  }

  function handleMoveRegionSettingPage() {
    if (loading) {
      return
    }

    if (!useRegionSetting) {
      return
    }

    router.push('/profile/business/create/posts/region')
  }

  // SECTION 07 : RETURN

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
          {currentRegion}
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
            cursor: loading ? 'default' : 'pointer'
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
            cursor: useRegionSetting && !loading ? 'pointer' : 'default'
          }}
          onClick={handleMoveRegionSettingPage}
        >
          지역선택
        </button>
      </div>
    </div>
  )
}
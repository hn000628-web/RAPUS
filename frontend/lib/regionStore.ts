/* =========================================
   Region Store
   frontend/lib/regionStore.ts
========================================= */

type Region = {

  id: number
  dong: string
  gu: string
  city: string
  fullName: string

}

type RegionState = {

  currentRegion: Region | null

}

/* =========================================
   내부 상태
========================================= */

let state: RegionState = {

  currentRegion: null

}

/* =========================================
   초기화
========================================= */

export function initRegion() {

  if (typeof window === 'undefined')
    return

  const saved =
    sessionStorage.getItem('activeRegion')

  if (saved) {

    try {

      const parsed = JSON.parse(saved)

      state.currentRegion = parsed

    } catch {

      state.currentRegion = null

    }

  }

}

/* =========================================
   지역 설정
========================================= */

export function setRegion(region: Region) {

  state.currentRegion = region

  if (typeof window !== 'undefined') {

    sessionStorage.setItem(
      'activeRegion',
      JSON.stringify(region)
    )

  }

}

/* =========================================
   현재 지역 반환
========================================= */

export function getRegion(): Region | null {

  if (state.currentRegion)
    return state.currentRegion

  if (typeof window !== 'undefined') {

    const saved =
      sessionStorage.getItem('activeRegion')

    if (saved) {

      try {

        const parsed = JSON.parse(saved)

        state.currentRegion = parsed

        return parsed

      } catch {}

    }

  }

  return null

}

/* =========================================
   지역 초기화
========================================= */

export function clearRegion() {

  state.currentRegion = null

  if (typeof window !== 'undefined') {

    sessionStorage.removeItem('activeRegion')

  }

}
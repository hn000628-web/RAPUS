'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  getBusinessMenus,
  saveBusinessMenus,
  type PostType
} from '@/lib/business/menuApi'
import { getMe } from '@/lib/authApi'

import presetStyles from './BusinessMenuConfigPreset.module.css'

type MenuItem = {
  id: number
  menuType: PostType
  label: string
  sortOrder: number
  isEnabled: boolean
  isDefault: boolean
  isRequired: boolean
  deletable: boolean
}

type ContextState = {
  profileId: number | null
  channelCode: string
  industryCode: string
  industrySubtypeLabel: string
}

type IndustryMenuPreset = {
  industryCode: string
  label: string
  description: string
  recommendedMenus: string[]
}

const INDUSTRY_MENU_PRESETS: IndustryMenuPreset[] = [
  {
    industryCode: 'FOOD',
    label: '음식점/카페',
    description: '메뉴, 오더, 예약, 리뷰 중심으로 구성합니다.',
    recommendedMenus: ['안내', '소개', '메뉴/상품/서비스', '오더', '예약', '리뷰', '사진첩']
  },
  {
    industryCode: 'BEAUTY',
    label: '미용/뷰티',
    description: '서비스, 예약, 시술사, 리뷰 중심으로 구성합니다.',
    recommendedMenus: ['안내', '소개', '서비스', '예약', '시술사', '리뷰', '사진첩']
  },
  {
    industryCode: 'FITNESS',
    label: '피트니스',
    description: '프로그램, 예약, 강사, 이용안내 중심으로 구성합니다.',
    recommendedMenus: ['안내', '소개', '프로그램', '예약', '강사', '이용안내', '리뷰']
  },
  {
    industryCode: 'TRAVEL',
    label: '숙박/여행',
    description: '객실, 예약, 체크인 안내, 부대서비스 중심으로 구성합니다.',
    recommendedMenus: ['안내', '객실', '예약', '체크인 안내', '부대서비스', '리뷰', '사진첩']
  },
  {
    industryCode: 'EDU',
    label: '교육/학원',
    description: '수업, 시간표, 상담예약, 공지 중심으로 구성합니다.',
    recommendedMenus: ['안내', '소개', '강의/수업', '시간표', '상담예약', '공지', '리뷰']
  },
  {
    industryCode: 'ETC',
    label: '기타 업종',
    description: '기본 채널 메뉴 구성으로 시작합니다.',
    recommendedMenus: ['안내', '소개', '메뉴/상품/서비스', '예약', '게시글', '리뷰', '사진첩']
  }
]

const page: CSSProperties = { background: '#f4f6fa', minHeight: '100vh', padding: '16px 0' }
const container: CSSProperties = {
  width: 1120,
  maxWidth: 'calc(100vw - 40px)',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 20
}
const leftCard: CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
}
const label: CSSProperties = { fontSize: 13, fontWeight: 600, color: '#333' }
const inputRow: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' }
const input: CSSProperties = { flex: 1, height: 30, border: '1px solid #ddd', borderRadius: 10, padding: '0 12px' }
const btn: CSSProperties = { height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }
const onBtn: CSSProperties = { ...btn, background: '#2563eb', color: '#fff', border: 'none' }
const offBtn: CSSProperties = { ...btn, background: '#bbb', color: '#fff', border: 'none' }
const delBtn: CSSProperties = { ...btn, background: '#ef4444', color: '#fff', border: 'none' }
const lockBtn: CSSProperties = { ...btn, background: '#e5e7eb', color: '#6b7280', border: 'none', cursor: 'not-allowed' }

function normalizePostType(value: unknown): PostType | null {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'INFO') return 'INFO'
  if (normalized === 'SUMMARY') return 'SUMMARY'
  if (normalized === 'REVIEW') return 'REVIEW'
  if (normalized === 'GENERAL') return 'GENERAL'
  if (normalized === 'GALLERY') return 'GALLERY'
  if (normalized === 'PRODUCT') return 'PRODUCT'
  if (normalized === 'EVENT') return 'EVENT'
  return null
}

function normalizeIndustryCode(me: any): string {
  const candidates = [
    me?.user?.primaryIndustryCode,
    me?.user?.industryCode,
    me?.user?.businessIndustryCode,
    me?.user?.businessTypeCode,
    me?.profile?.primaryIndustryCode,
    me?.profile?.industryCode,
    me?.profile?.businessIndustryCode,
    me?.profile?.businessTypeCode
  ]

  for (const candidate of candidates) {
    const value = String(candidate || '').trim().toUpperCase()
    if (value) {
      return value
    }
  }

  return 'FOOD'
}

function resolvePreset(industryCode: string): IndustryMenuPreset {
  return INDUSTRY_MENU_PRESETS.find((preset) => preset.industryCode === industryCode)
    ?? INDUSTRY_MENU_PRESETS.find((preset) => preset.industryCode === 'ETC')
    ?? INDUSTRY_MENU_PRESETS[0]
}

export default function Page() {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [context, setContext] = useState<ContextState | null>(null)

  const selectedPreset = useMemo(() => {
    const code = context?.industryCode || 'FOOD'
    return resolvePreset(code)
  }, [context?.industryCode])

  useEffect(() => {
    void init()
  }, [])

  async function init() {
    setLoading(true)

    try {
      const meRaw = await getMe()
      const me: any = meRaw
      const channelCode = String(me?.user?.channelCode || '').trim()
      const profileId = Number(me?.user?.profileId || 0) || null
      const industryCode = normalizeIndustryCode(me)
      const industrySubtypeLabel = String(
        me?.user?.primaryIndustrySubtypeCode
        || me?.user?.industrySubtypeCode
        || me?.profile?.primaryIndustrySubtypeCode
        || me?.profile?.industrySubtypeCode
        || ''
      ).trim()

      if (!channelCode) {
        throw new Error('channelCode missing')
      }

      setContext({ profileId, channelCode, industryCode, industrySubtypeLabel })

      const data = await getBusinessMenus()

      const mapped = (Array.isArray(data) ? data : [])
        .map((item): MenuItem | null => {
          const menuType = normalizePostType(item.menuType || item.postType)
          if (!menuType) {
            return null
          }

          return {
            id: Number(item.id),
            menuType,
            label: String(item.label || item.title || item.name || '').trim(),
            sortOrder: Number(item.sortOrder || 0),
            isEnabled: Boolean(item.isEnabled ?? item.isActive),
            isDefault: Boolean(item.isDefault),
            isRequired: Boolean(item.isRequired),
            deletable: Boolean(item.deletable)
          }
        })
        .filter((item): item is MenuItem => item !== null)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      setMenus(mapped)
    } catch (error) {
      console.error('MENU CONFIG INIT ERROR ->', error)
      setMenus([])
    } finally {
      setLoading(false)
    }
  }

  function moveUp(id: number) {
    setMenus((prev) => {
      const i = prev.findIndex((m) => m.id === id)
      if (i <= 0) return prev
      const arr = [...prev]
      ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
      return arr.map((m, idx) => ({ ...m, sortOrder: idx + 1 }))
    })
  }

  function moveDown(id: number) {
    setMenus((prev) => {
      const i = prev.findIndex((m) => m.id === id)
      if (i === -1 || i === prev.length - 1) return prev
      const arr = [...prev]
      ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
      return arr.map((m, idx) => ({ ...m, sortOrder: idx + 1 }))
    })
  }

  function toggle(id: number) {
    setMenus((prev) => prev.map((m) => {
      if (m.id !== id) return m
      if (m.isRequired) return { ...m, isEnabled: true }
      return { ...m, isEnabled: !m.isEnabled }
    }))
  }

  function changeTitle(id: number, val: string) {
    setMenus((prev) => prev.map((m) => (m.id === id ? { ...m, label: val } : m)))
  }

  function remove(id: number) {
    setMenus((prev) => prev.filter((m) => {
      if (m.id !== id) return true
      return !m.deletable
    }))
  }

  async function save() {
    if (!context?.channelCode) {
      alert('컨텍스트 없음 (로그인 상태 확인 필요)')
      return
    }

    try {
      await saveBusinessMenus(
        menus.map((m) => ({
          menuType: m.menuType,
          label: m.label,
          sortOrder: m.sortOrder,
          isEnabled: m.isRequired ? true : m.isEnabled
        })),
        context.channelCode,
        context.profileId ?? undefined
      )

      await init()
      alert('저장 완료')
    } catch (error: any) {
      const message = error?.message || error?.response?.data?.message || '메뉴 저장 실패'
      alert(`저장 실패: ${String(message)}`)
    }
  }

  function handleMockApplyPreset() {
    alert('업종 기반 자동 세팅은 이후 저장 API 연동 단계에서 적용됩니다.')
  }

  function handleMockPreviewPreset() {
    alert('추천 메뉴 구성이 선택되었습니다. 저장 연동은 다음 단계에서 진행합니다.')
  }

  if (loading) return <div>loading...</div>

  return (
    <div style={page}>
      <div style={container}>
        <div className={presetStyles.menuConfigLayout}>
          <section className={presetStyles.manualMenuColumn}>
            <div style={leftCard}>
              <div style={{ fontWeight: 700 }}>메뉴 관리</div>

              {menus.map((menu) => {
                const isFixed = menu.isRequired || !menu.deletable

                return (
                  <div key={menu.id}>
                    <div style={label}>{menu.menuType}</div>

                    <div style={inputRow}>
                      <input
                        value={menu.label}
                        onChange={(e) => changeTitle(menu.id, e.target.value)}
                        style={input}
                      />

                      <button onClick={() => moveUp(menu.id)} style={btn}>↑</button>
                      <button onClick={() => moveDown(menu.id)} style={btn}>↓</button>

                      <button
                        onClick={() => toggle(menu.id)}
                        style={isFixed ? lockBtn : (menu.isEnabled ? onBtn : offBtn)}
                        disabled={isFixed}
                      >
                        {isFixed ? '기본' : (menu.isEnabled ? 'ON' : 'OFF')}
                      </button>

                      {isFixed ? (
                        <button type="button" style={lockBtn} disabled>
                          고정
                        </button>
                      ) : (
                        <button onClick={() => remove(menu.id)} style={delBtn}>
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              <button onClick={save} style={{ ...btn, height: 36, width: 120 }}>
                저장
              </button>
            </div>
          </section>

          <aside className={presetStyles.presetColumn}>
            <div className={presetStyles.presetCard}>
              <div className={presetStyles.presetHeader}>
                <div className={presetStyles.presetTitle}>업종 기반 자동 세팅</div>
                <div className={presetStyles.presetDescription}>
                  사업자 업종 정보를 기준으로 채널 메뉴 구성을 추천합니다.
                </div>
              </div>

              <div className={presetStyles.industryBox}>
                <div className={presetStyles.sectionLabel}>현재 업종</div>
                <div className={presetStyles.industryName}>{selectedPreset.label}</div>
                <div className={presetStyles.industryMeta}>
                  {context?.industryCode || 'FOOD'}
                  {context?.industrySubtypeLabel ? ` · ${context.industrySubtypeLabel}` : ''}
                </div>
                <div className={presetStyles.industryMeta}>
                  현재는 목업 업종 기준으로 추천 구성을 표시합니다.
                </div>
              </div>

              <div className={presetStyles.sectionLabel}>추천 메뉴 구성</div>
              <div className={presetStyles.presetDescription} style={{ marginBottom: 12 }}>
                {selectedPreset.description}
              </div>

              <div className={presetStyles.recommendedList}>
                {selectedPreset.recommendedMenus.map((menu) => (
                  <span key={menu} className={presetStyles.recommendedChip}>
                    {menu}
                  </span>
                ))}
              </div>

              <div className={presetStyles.presetActions}>
                <button
                  type="button"
                  className={presetStyles.primaryPresetButton}
                  onClick={handleMockApplyPreset}
                >
                  자동 세팅 적용
                </button>

                <button
                  type="button"
                  className={presetStyles.secondaryPresetButton}
                  onClick={handleMockPreviewPreset}
                >
                  미리보기
                </button>
              </div>

              <div className={presetStyles.mockNotice}>
                자동 세팅은 현재 메뉴 구성을 업종 기본값에 맞춰 정리하는 기능입니다.
                현재는 목업 UI 단계이며 실제 저장은 이후 API 연동에서 처리합니다.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

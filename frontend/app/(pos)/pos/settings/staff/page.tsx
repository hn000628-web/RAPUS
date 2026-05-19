'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import PosTopbar from '../../components/PosTopbar'
import styles from './StaffSettingsPage.module.css'

// SECTION 01 : TYPE

type WorkStatus = '근무중' | '대기'

type StaffItem = {
  id: number
  name: string
  role: string
  status: WorkStatus
  clockIn: string
  clockOut: string
  rooms: string
  tasks: string[]
}

// SECTION 02 : CONSTANT

const STAFF_ITEMS: StaffItem[] = [
  {
    id: 1,
    name: '김관리',
    role: '관리인',
    status: '근무중',
    clockIn: '09:00',
    clockOut: '18:00',
    rooms: '101, 102, 201',
    tasks: ['체크인', '체크아웃', '결제확인']
  },
  {
    id: 2,
    name: '이청소',
    role: '청소',
    status: '대기',
    clockIn: '10:00',
    clockOut: '19:00',
    rooms: '202, 203, 204',
    tasks: ['청소', '점검', '룸서비스']
  },
  {
    id: 3,
    name: '박야간',
    role: '야간관리',
    status: '근무중',
    clockIn: '18:00',
    clockOut: '03:00',
    rooms: '301, 302, 303, 304',
    tasks: ['야간 순찰', '고객 문의', '룸서비스']
  }
]

const TASK_OPTIONS = ['청소', '점검', '룸서비스', '체크인', '체크아웃', '결제확인'] as const

function isKeyboardBlockedTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    tagName === 'button' ||
    tagName === 'a' ||
    target.isContentEditable
  )
}

// SECTION 03 : PAGE

export default function StaffSettingsPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [selectedStaffId, setSelectedStaffId] = useState<number>(STAFF_ITEMS[0].id)

  const handleGoPos = useCallback(() => {
    router.push('/pos')
  }, [router])

  const handleGoPosSettings = useCallback(() => {
    router.push('/pos/settings')
  }, [router])

  const handleGoMyPage = useCallback(() => {
    router.push('/profile')
  }, [router])

  const selectedStaff = useMemo(
    () => STAFF_ITEMS.find((item) => item.id === selectedStaffId) ?? STAFF_ITEMS[0],
    [selectedStaffId]
  )

  const selectedStaffIndex = useMemo(() => {
    const index = STAFF_ITEMS.findIndex((item) => item.id === selectedStaffId)
    return index < 0 ? 0 : index
  }, [selectedStaffId])

  useEffect(() => {
    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isKeyboardBlockedTarget(event.target)) {
        return
      }

      if (event.ctrlKey && event.code === 'F1') {
        event.preventDefault()
        router.push('/pos')
        return
      }

      if (keyboardMode !== 'POS') {
        return
      }

      if (event.code === 'F1') {
        event.preventDefault()
        router.push('/pos')
        return
      }

      if (event.code === 'Escape') {
        event.preventDefault()
        router.push('/pos/settings')
        return
      }

      if (event.code === 'ArrowDown') {
        event.preventDefault()
        const nextIndex = Math.min(selectedStaffIndex + 1, STAFF_ITEMS.length - 1)
        setSelectedStaffId(STAFF_ITEMS[nextIndex].id)
        return
      }

      if (event.code === 'ArrowUp') {
        event.preventDefault()
        const nextIndex = Math.max(selectedStaffIndex - 1, 0)
        setSelectedStaffId(STAFF_ITEMS[nextIndex].id)
        return
      }

      if (event.code === 'Enter') {
        event.preventDefault()
        setSelectedStaffId(STAFF_ITEMS[selectedStaffIndex].id)
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [keyboardMode, router, selectedStaffIndex])

  return (
    <div className={styles.page}>
      <header className={styles.topbarWrap}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="직원관리"
            onHomeClick={handleGoPos}
            onSettingsClick={handleGoPosSettings}
            onMyPageClick={handleGoMyPage}
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
            homeShortcutLabel="F1"
          />
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.titleArea}>
          <h1 className={styles.pageTitle}>직원관리</h1>
          <p className={styles.pageDescription}>직원 근무 상태와 담당 업무를 관리합니다.</p>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>직원 목록</h2>
            <div className={styles.staffList}>
              {STAFF_ITEMS.map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  className={`${styles.staffButton} ${selectedStaffId === staff.id ? styles.staffButtonSelected : ''}`}
                  onClick={() => setSelectedStaffId(staff.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedStaffId(staff.id)
                    }
                  }}
                >
                  <strong>{staff.name}</strong>
                  <span>{staff.role}</span>
                  <em>{staff.status}</em>
                </button>
              ))}
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>선택 직원 정보</h2>
            <div className={styles.infoRows}>
              <div className={styles.infoRow}><span>이름</span><strong>{selectedStaff.name}</strong></div>
              <div className={styles.infoRow}><span>역할</span><strong>{selectedStaff.role}</strong></div>
              <div className={styles.infoRow}><span>근무 상태</span><strong>{selectedStaff.status}</strong></div>
              <div className={styles.infoRow}><span>출근 시간</span><strong>{selectedStaff.clockIn}</strong></div>
              <div className={styles.infoRow}><span>퇴근 시간</span><strong>{selectedStaff.clockOut}</strong></div>
              <div className={styles.infoRow}><span>담당 객실</span><strong>{selectedStaff.rooms}</strong></div>
              <div className={styles.infoRow}><span>담당 업무</span><strong>{selectedStaff.tasks.join(', ')}</strong></div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>업무 항목 설정</h2>
            <div className={styles.taskList}>
              {TASK_OPTIONS.map((task) => (
                <label key={task} className={styles.taskItem}>
                  <input type="checkbox" />
                  <span>{task}</span>
                </label>
              ))}
            </div>

            <div className={styles.customArea}>
              <h3 className={styles.customTitle}>커스텀 업무</h3>
              <div className={styles.customInputRow}>
                <input
                  type="text"
                  placeholder="커스텀 업무명 입력"
                  className={styles.customInput}
                />
                <button type="button" className={styles.addButton}>추가</button>
              </div>
              <div className={styles.tagRow}>
                <span className={styles.tag}>침구 교체</span>
                <span className={styles.tag}>야간 순찰</span>
                <span className={styles.tag}>고객 문의</span>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { usePosKeyboardMode } from '../components/PosKeyboardModeContext'
import PosTopbar from '../components/PosTopbar'
import styles from './PosSettingsPage.module.css'

type SettingCardItem = {
  title: string
  description: string
  items: string[]
  actionLabel?: string
  onClick?: () => void
  showActionButton?: boolean
  statusText?: string
}

const DESKTOP_COLUMN_COUNT = 4

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

export default function PosSettingsPage() {
  const router = useRouter()
  const {
    keyboardMode,
    toggleKeyboardMode
  } = usePosKeyboardMode()
  const [selectedCardIndex, setSelectedCardIndex] = useState(0)

  const handleGoPos = useCallback(() => {
    router.push('/pos')
  }, [router])

  const handleGoMyPage = useCallback(() => {
    router.push('/profile')
  }, [router])

  const handleSettingsClick = useCallback(() => {
    router.push('/pos/settings')
  }, [router])

  const handleGoMenuSettings = useCallback(() => {
    router.push('/pos/settings/menu')
  }, [router])

  const handleGoCategorySettings = useCallback(() => {
    router.push('/pos/settings/category')
  }, [router])

  const handleGoTableSettings = useCallback(() => {
    router.push('/pos/settings/table')
  }, [router])

  const handleGoOrderTypesSettings = useCallback(() => {
    router.push('/pos/settings/order-types')
  }, [router])

  const handleGoKeyboardSettings = useCallback(() => {
    router.push('/pos/settings/keyboard')
  }, [router])

  const handleGoStaffSettings = useCallback(() => {
    router.push('/pos/settings/staff')
  }, [router])

  const handleGoPosFeedSettings = useCallback(() => {
    router.push('/pos')
  }, [router])

  const handleGoBusinessSettings = useCallback(() => {
    router.push('/profile/business/account')
  }, [router])

  const settingCards = useMemo<SettingCardItem[]>(() => {
    return [
      {
        title: '메뉴 / 상품 관리',
        description: '판매 아이템 구성과 노출 상태를 관리합니다.',
        items: ['메뉴 등록', '카테고리 관리', '옵션 관리', '판매중지 / 품절 설정'],
        actionLabel: '관리하기',
        onClick: handleGoMenuSettings
      },
      {
        title: '메뉴 / 서비스 카테고리 관리',
        description: 'POS 메뉴와 상품의 분류용 카테고리를 관리합니다.',
        items: [
          '메뉴 / 서비스 카테고리 추가',
          '메뉴 / 서비스 카테고리 수정',
          '메뉴 / 서비스 카테고리 정렬',
          '메뉴 / 서비스 카테고리 활성 / 비활성'
        ],
        actionLabel: '카테고리 관리',
        onClick: handleGoCategorySettings
      },
      {
        title: '주문 유형 설정',
        description: '운영할 주문 채널을 선택합니다.',
        items: ['테이블 주문', '예약 주문', '배달 주문', '픽업 주문', 'QR 주문', '키오스크 주문'],
        actionLabel: '주문유형 관리',
        onClick: handleGoOrderTypesSettings
      },
      {
        title: '테이블 설정',
        description: '매장 내 주문 위치 범위를 설정합니다.',
        items: ['테이블 수', '구역 관리', 'QR 테이블 연결', '사용 / 미사용 상태'],
        actionLabel: '테이블 관리',
        onClick: handleGoTableSettings
      },
      {
        title: '직원관리',
        description: '직원 근무 상태와 담당 업무를 관리합니다.',
        items: ['직원 등록', '근무 관리', '근무 내역', '청소 / 점검 업무 설정', '커스텀 업무 추가'],
        actionLabel: '직원 관리',
        onClick: handleGoStaffSettings
      },
      {
        title: '결제 설정',
        description: '결제 수단과 상태 처리 기준을 정의합니다.',
        items: ['현금', '카드', '미결제'],
        statusText: 'VAN / 로컬 장비 연동 준비중'
      },
      {
        title: '정산관리',
        description: '정산 계좌 및 정산 내역 정보를 관리합니다.',
        items: ['정산관리 통장', '정산 내역 확인'],
        statusText: '플랫폼 결제 및 사업장 정산 정보에 사용됩니다.',
        actionLabel: '정산관리'
      },
      {
        title: '영업 설정',
        description: '영업시간과 내부 정책을 관리합니다.',
        items: ['영업중 / 영업종료', '영업시간', '브레이크타임', '내부 메모']
      },
      {
        title: '비지니스 관리',
        description: '사업장 기본정보 및 운영 정보를 관리합니다.',
        items: ['상호', '주소', '사업자번호', '대표 연락처', '보조 연락처', '팩스', '담당자 이메일'],
        statusText: '사업장 정보는 영수증 / 예약 / 운영 정책에 사용됩니다.',
        actionLabel: '비지니스 정보 관리',
        onClick: handleGoBusinessSettings
      },
      {
        title: '포스피드설정',
        description: '포스 진입 시 사용할 기본 바로가기 경로를 설정합니다.',
        items: ['기본 POS 경로', '포스피드 바로가기', '미설정 시 /pos 사용'],
        actionLabel: '포스피드 설정',
        onClick: handleGoPosFeedSettings
      },
      {
        title: '출력 설정',
        description: '출력 장치와 전표 유형을 관리합니다.',
        items: ['영수증 출력', '주문서 출력', '주방 출력'],
        statusText: '프린터 연결 준비중'
      },
      {
        title: '키오스크 / QR 설정',
        description: '대면 주문 채널 사용 정책을 설정합니다.',
        items: ['키오스크 모드', 'QR 주문 활성화', '테이블 QR 연결']
      },
      {
        title: '키보드 설정',
        description: 'POS 전용 키보드와 숫자 패드 단축키를 설정합니다.',
        items: ['숫자 패드 매핑', '결제 단축키', '주문 단축키', '취소 / 삭제 키', '키 입력 테스트'],
        actionLabel: '키보드 관리',
        onClick: handleGoKeyboardSettings
      }
    ]
  }, [
    handleGoCategorySettings,
    handleGoBusinessSettings,
    handleGoKeyboardSettings,
    handleGoMenuSettings,
    handleGoOrderTypesSettings,
    handleGoPosFeedSettings,
    handleGoStaffSettings,
    handleGoTableSettings
  ])

  const executeCardAction = useCallback((index: number) => {
    const selectedCard = settingCards[index]

    if (!selectedCard?.onClick) {
      return
    }

    selectedCard.onClick()
  }, [settingCards])

  useEffect(() => {
    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (keyboardMode !== 'POS' || isKeyboardBlockedTarget(event.target)) {
        return
      }

      if (event.code === 'ArrowRight') {
        event.preventDefault()
        setSelectedCardIndex((prev) => Math.min(prev + 1, settingCards.length - 1))
        return
      }

      if (event.code === 'ArrowLeft') {
        event.preventDefault()
        setSelectedCardIndex((prev) => Math.max(prev - 1, 0))
        return
      }

      if (event.code === 'ArrowDown') {
        event.preventDefault()
        setSelectedCardIndex((prev) => Math.min(prev + DESKTOP_COLUMN_COUNT, settingCards.length - 1))
        return
      }

      if (event.code === 'ArrowUp') {
        event.preventDefault()
        setSelectedCardIndex((prev) => Math.max(prev - DESKTOP_COLUMN_COUNT, 0))
        return
      }

      if (event.code === 'Enter') {
        event.preventDefault()
        executeCardAction(selectedCardIndex)
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [executeCardAction, keyboardMode, selectedCardIndex, settingCards.length])

  return (
    <div className={styles.page}>
      <div className={styles.topbarWrap}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="POS 설정"
            onHomeClick={handleGoPos}
            onSettingsClick={handleSettingsClick}
            onMyPageClick={handleGoMyPage}
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
          />
        </div>
      </div>

      <main className={styles.content}>
        <section className={styles.sectionGrid}>
          {settingCards.map((card, index) => {
            const isClickable = typeof card.onClick === 'function'
            const isSelected = selectedCardIndex === index

            return (
              <article
                key={card.title}
                className={[
                  styles.sectionCard,
                  isClickable ? styles.sectionCardClickable : '',
                  isSelected ? styles.sectionCardSelected : ''
                ].filter(Boolean).join(' ')}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedCardIndex(index)

                  if (card.onClick) {
                    card.onClick()
                  }
                }}
                onMouseDown={() => {
                  setSelectedCardIndex(index)
                }}
                onKeyDown={(event) => {
                  setSelectedCardIndex(index)

                  if (!isClickable || !card.onClick) {
                    return
                  }

                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    card.onClick()
                  }
                }}
              >
                <h2 className={styles.sectionTitle}>{card.title}</h2>
                <p className={styles.sectionDescription}>{card.description}</p>
                <ul className={styles.itemList}>
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {card.statusText ? (
                  <p className={styles.statusText}>{card.statusText}</p>
                ) : null}
                {card.actionLabel && (card.onClick || card.showActionButton) ? (
                  <button
                    type="button"
                    className={card.onClick ? styles.cardActionButton : `${styles.cardActionButton} ${styles.cardActionButtonDisabled}`}
                    disabled={!card.onClick}
                    onClick={(event) => {
                      if (!card.onClick) {
                        return
                      }

                      event.stopPropagation()
                      setSelectedCardIndex(index)
                      card.onClick?.()
                    }}
                  >
                    {card.actionLabel}
                  </button>
                ) : null}
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}

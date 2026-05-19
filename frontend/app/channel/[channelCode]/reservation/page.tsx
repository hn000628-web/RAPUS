// FILE : frontend/app/channel/[channelCode]/reservation/page.tsx
// ROOT : frontend/app/channel/[channelCode]/reservation/page.tsx
// STATUS : MODIFY MODE
// ROLE : PUBLIC BUSINESS CHANNEL RESERVATION DETAIL PAGE
// CHANGE SUMMARY :
// - 예약 상세 페이지를 PC 기준 2칼럼 구조로 수정
// - 왼쪽 칼럼에 예약 유형 / 예약 정보 배치
// - 오른쪽 칼럼에 메뉴 수량 / 요청사항 / 예약 요약 / 예약 요청 버튼 배치
// - 모바일 반응형 1열 구조 대응
// - 기존 방문 예약 / 포장 예약 / 배달 예약 선택 상태 유지
// - 기존 예약 날짜 / 시간 / 방문 인원 / 메뉴 수량 / 요청사항 입력 유지
// - 예약 요청하기 클릭 시 alert 기반 목업 데이터 확인 유지
// - API 호출 없음
// - DB 직접 접근 없음
// - Service / Controller 수정 없음

'use client'

// SECTION 01 : IMPORT

import {
  useMemo,
  useState
} from 'react'

import {
  useParams,
  useRouter
} from 'next/navigation'

import styles from './ReservationPage.module.css'

// SECTION 02 : TYPE

type RouteParams = {
  channelCode?: string
}

type ReservationType =
  | 'DINE_IN'
  | 'PICKUP'
  | 'DELIVERY'

type MenuQuantityState = {
  kimchiStew: number
  spicyPork: number
  koreanSet: number
}

type ReservationFormState = {
  reservationType: ReservationType
  reservationDate: string
  reservationTime: string
  guestCount: number
  menuQuantity: MenuQuantityState
  requestMemo: string
}

type ReservationTypeOption = {
  type: ReservationType
  label: string
  description: string
}

type MenuQuantityKey =
  keyof MenuQuantityState

type MenuMockItem = {
  key: MenuQuantityKey
  label: string
  description: string
}

// SECTION 03 : CONSTANT

const RESERVATION_TYPE_OPTIONS: ReservationTypeOption[] = [
  {
    type: 'DINE_IN',
    label: '방문 예약',
    description: '매장 방문 식사'
  },
  {
    type: 'PICKUP',
    label: '포장 예약',
    description: '방문 수령'
  },
  {
    type: 'DELIVERY',
    label: '배달 예약',
    description: '시간 지정 배달'
  }
]

const MENU_MOCK_ITEMS: MenuMockItem[] = [
  {
    key: 'kimchiStew',
    label: '김치찌개',
    description: '예약 주문 수량'
  },
  {
    key: 'spicyPork',
    label: '제육볶음',
    description: '예약 주문 수량'
  },
  {
    key: 'koreanSet',
    label: '1인 한정식',
    description: '방문 인원 기준 선주문'
  }
]

const INITIAL_FORM_STATE: ReservationFormState = {
  reservationType: 'DINE_IN',
  reservationDate: '',
  reservationTime: '',
  guestCount: 1,
  menuQuantity: {
    kimchiStew: 0,
    spicyPork: 0,
    koreanSet: 0
  },
  requestMemo: ''
}

// SECTION 04 : COMPONENT

export default function ReservationPage() {
  // SECTION 05 : ROUTE

  const router =
    useRouter()

  const params =
    useParams<RouteParams>()

  const channelCode = useMemo(() => {
    return String(params?.channelCode || '').trim()
  }, [
    params?.channelCode
  ])

  // SECTION 06 : STATE

  const [formState, setFormState] =
    useState<ReservationFormState>(INITIAL_FORM_STATE)

  // SECTION 07 : MEMO

  const selectedReservationLabel = useMemo(() => {
    const selected =
      RESERVATION_TYPE_OPTIONS.find(option => {
        return option.type === formState.reservationType
      })

    return selected?.label ?? '방문 예약'
  }, [
    formState.reservationType
  ])

  const totalMenuQuantity = useMemo(() => {
    return Object.values(formState.menuQuantity).reduce(
      (sum, quantity) => {
        return sum + quantity
      },
      0
    )
  }, [
    formState.menuQuantity
  ])

  const shouldShowGuestCount =
    formState.reservationType === 'DINE_IN'

  // SECTION 08 : EVENT FUNCTION

  function handleBackClick() {
    if (!channelCode) {
      router.back()
      return
    }

    router.push(`/channel/${channelCode}`)
  }

  function handleReservationTypeChange(
    reservationType: ReservationType
  ) {
    setFormState(prev => {
      return {
        ...prev,
        reservationType
      }
    })
  }

  function handleDateChange(
    value: string
  ) {
    setFormState(prev => {
      return {
        ...prev,
        reservationDate: value
      }
    })
  }

  function handleTimeChange(
    value: string
  ) {
    setFormState(prev => {
      return {
        ...prev,
        reservationTime: value
      }
    })
  }

  function handleGuestCountChange(
    value: string
  ) {
    const parsedValue =
      Number(value)

    const safeValue =
      Number.isFinite(parsedValue) && parsedValue > 0
        ? parsedValue
        : 1

    setFormState(prev => {
      return {
        ...prev,
        guestCount: safeValue
      }
    })
  }

  function handleMenuQuantityChange(
    key: MenuQuantityKey,
    value: string
  ) {
    const parsedValue =
      Number(value)

    const safeValue =
      Number.isFinite(parsedValue) && parsedValue >= 0
        ? parsedValue
        : 0

    setFormState(prev => {
      return {
        ...prev,
        menuQuantity: {
          ...prev.menuQuantity,
          [key]: safeValue
        }
      }
    })
  }

  function handleRequestMemoChange(
    value: string
  ) {
    setFormState(prev => {
      return {
        ...prev,
        requestMemo: value
      }
    })
  }

  function handleSubmit() {
    const summary = [
      `예약 유형: ${selectedReservationLabel}`,
      `예약 날짜: ${formState.reservationDate || '-'}`,
      `예약 시간: ${formState.reservationTime || '-'}`,
      `방문 인원: ${
        shouldShowGuestCount
          ? `${formState.guestCount}명`
          : '-'
      }`,
      `김치찌개: ${formState.menuQuantity.kimchiStew}`,
      `제육볶음: ${formState.menuQuantity.spicyPork}`,
      `1인 한정식: ${formState.menuQuantity.koreanSet}`,
      `총 메뉴 수량: ${totalMenuQuantity}`,
      `요청사항: ${formState.requestMemo || '-'}`
    ].join('\n')

    alert(summary)
  }

  // SECTION 09 : UI BLOCK

  const ReservationTypeUI = (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        예약 유형
      </h2>

      <div className={styles.typeGrid}>
        {RESERVATION_TYPE_OPTIONS.map(option => {
          const isActive =
            formState.reservationType === option.type

          return (
            <button
              key={option.type}
              type="button"
              className={
                isActive
                  ? `${styles.typeButton} ${styles.typeButtonActive}`
                  : styles.typeButton
              }
              onClick={() => {
                handleReservationTypeChange(option.type)
              }}
            >
              <span className={styles.typeButtonTitle}>
                {option.label}
              </span>

              <span className={styles.typeButtonDesc}>
                {option.description}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )

  const ReservationInfoUI = (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        예약 정보
      </h2>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.label}>
            예약 날짜
          </span>

          <input
            type="date"
            value={formState.reservationDate}
            className={styles.input}
            onChange={event => {
              handleDateChange(event.target.value)
            }}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            예약 시간
          </span>

          <input
            type="time"
            value={formState.reservationTime}
            className={styles.input}
            onChange={event => {
              handleTimeChange(event.target.value)
            }}
          />
        </label>

        {shouldShowGuestCount && (
          <label className={styles.field}>
            <span className={styles.label}>
              방문 인원
            </span>

            <input
              type="number"
              min={1}
              value={formState.guestCount}
              className={styles.input}
              onChange={event => {
                handleGuestCountChange(event.target.value)
              }}
            />
          </label>
        )}
      </div>
    </section>
  )

  const MenuQuantityUI = (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        메뉴 수량
      </h2>

      <div className={styles.menuList}>
        {MENU_MOCK_ITEMS.map(item => {
          return (
            <div
              key={item.key}
              className={styles.menuRow}
            >
              <div className={styles.menuText}>
                <p className={styles.menuTitle}>
                  {item.label}
                </p>

                <p className={styles.menuDesc}>
                  {item.description}
                </p>
              </div>

              <input
                type="number"
                min={0}
                value={formState.menuQuantity[item.key]}
                className={styles.quantityInput}
                onChange={event => {
                  handleMenuQuantityChange(
                    item.key,
                    event.target.value
                  )
                }}
              />
            </div>
          )
        })}
      </div>
    </section>
  )

  const RequestMemoUI = (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        요청사항
      </h2>

      <textarea
        value={formState.requestMemo}
        placeholder="예: 아이 의자 2개 필요 / 일회용 수저 제외 / 7시까지 준비 요청"
        className={styles.textarea}
        onChange={event => {
          handleRequestMemoChange(event.target.value)
        }}
      />
    </section>
  )

  const SummaryUI = (
    <section className={styles.summaryBox}>
      <h2 className={styles.summaryTitle}>
        예약 요약
      </h2>

      <div className={styles.summaryRow}>
        <span>
          유형
        </span>

        <strong>
          {selectedReservationLabel}
        </strong>
      </div>

      <div className={styles.summaryRow}>
        <span>
          날짜
        </span>

        <strong>
          {formState.reservationDate || '-'}
        </strong>
      </div>

      <div className={styles.summaryRow}>
        <span>
          시간
        </span>

        <strong>
          {formState.reservationTime || '-'}
        </strong>
      </div>

      <div className={styles.summaryRow}>
        <span>
          인원
        </span>

        <strong>
          {shouldShowGuestCount
            ? `${formState.guestCount}명`
            : '-'}
        </strong>
      </div>

      <div className={styles.summaryRow}>
        <span>
          총 메뉴 수량
        </span>

        <strong>
          {totalMenuQuantity}개
        </strong>
      </div>
    </section>
  )

  // SECTION 10 : RETURN

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.card}>
          <div className={styles.header}>
            <button
              type="button"
              className={styles.backButton}
              onClick={handleBackClick}
            >
              채널로 돌아가기
            </button>

            <h1 className={styles.title}>
              예약
            </h1>

            <p className={styles.description}>
              방문 / 포장 / 배달 예약을 선택하고 시간과 메뉴 수량을 입력하세요.
            </p>
          </div>

          <div className={styles.reservationGrid}>
            <div className={styles.leftColumn}>
              {ReservationTypeUI}

              {ReservationInfoUI}
            </div>

            <div className={styles.rightColumn}>
              {MenuQuantityUI}

              {RequestMemoUI}

              {SummaryUI}

              <button
                type="button"
                className={styles.submitButton}
                onClick={handleSubmit}
              >
                예약 요청하기
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
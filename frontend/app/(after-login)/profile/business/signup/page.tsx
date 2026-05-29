'use client'

// SECTION 01 : IMPORT

import {
  FormEvent,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import {
  signupBusinessProfile
} from '@/lib/authApi'

import styles from './BusinessSignupPage.module.css'

// SECTION 02 : TYPE

type BusinessTypeCode =
  | 'NORMAL'
  | 'STORE'
  | 'SHOPPING_MALL'
  | 'FREELANCER'
  | 'MOBILE_BIZ'

// SECTION 03 : CONSTANT

const BUSINESS_TYPE_OPTIONS: Array<{
  value: BusinessTypeCode
  label: string
}> = [
  {
    value: 'NORMAL',
    label: '비즈니스 타입선택'
  },
  {
    value: 'STORE',
    label: '오프라인스토어'
  },
  {
    value: 'SHOPPING_MALL',
    label: '온라인스토어'
  },
  {
    value: 'FREELANCER',
    label: '프리랜서'
  },
  {
    value: 'MOBILE_BIZ',
    label: '모바일 비즈니스'
  }
]

// SECTION 04 : COMPONENT

export default function BusinessSignupPage() {
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [businessTypeCode, setBusinessTypeCode] =
    useState<BusinessTypeCode>('NORMAL')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPaidNoticeOpen, setIsPaidNoticeOpen] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response =
        await signupBusinessProfile({
          displayName: displayName.trim() || undefined,
          businessTypeCode
        })

      if (typeof window !== 'undefined') {
        localStorage.setItem('profileType', 'BUSINESS')
        localStorage.setItem('activeProfileType', 'BUSINESS')
        localStorage.setItem('profileId', String(response.user.profileId))
        localStorage.setItem('activeProfileId', String(response.user.profileId))
        localStorage.setItem('businessProfileId', String(response.user.profileId))
        localStorage.setItem('channelCode', response.user.channelCode)
        localStorage.setItem('displayName', response.user.displayName || '')
        window.dispatchEvent(new Event('auth-change'))
      }

      router.replace('/profile/business')
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'INTRO 프로필 생성에 실패했습니다.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    router.push('/profile/account')
  }

  function handleBusinessTypeChange(value: BusinessTypeCode) {
    setBusinessTypeCode(value)

    if (value !== 'NORMAL') {
      setIsPaidNoticeOpen(true)
    }
  }

  function closePaidNotice() {
    setIsPaidNoticeOpen(false)
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          disabled={isSubmitting}
        >
          개인정보 관리로 돌아가기
        </button>

        <div className={styles.header}>
          <span className={styles.eyebrow}>
            INTRO PROFILE
          </span>

          <h1 className={styles.title}>
            INTRO 프로필 만들기
          </h1>

          <p className={styles.description}>
            상호, 주소, 연락처, 영업시간을 등록하여
            무료 소개 페이지를 만들 수 있습니다.
          </p>

          <p className={styles.description}>
            INTRO 프로필은 무료입니다.
            상품관리, 예약, 주문, 행사, POS 기능은 유료 BUSINESS 전환 후 사용 가능합니다.
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <label className={styles.field}>
            <span className={styles.label}>
              비즈니스 프로필명
            </span>

            <input
              className={styles.input}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="예: RAPUS 매장"
              disabled={isSubmitting}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              비즈니스 유형
            </span>

            <select
              className={styles.input}
              value={businessTypeCode}
              onChange={(event) => {
                handleBusinessTypeChange(event.target.value as BusinessTypeCode)
              }}
              disabled={isSubmitting}
            >
              {BUSINESS_TYPE_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.gradeBox}>
            <span>일반 사용자: userGrade 0</span>
            <span>INTRO 프로필: userGrade 1 / providerGrade 0</span>
            <span>BUSINESS 체험판: userGrade 2 / providerGrade 0</span>
            <span>정식 BUSINESS 사용자: userGrade 2 / providerGrade 1</span>
          </div>

          {errorMessage ? (
            <p className={styles.errorMessage}>
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'INTRO 생성 중...' : 'INTRO 프로필 만들기'}
          </button>
        </form>
      </section>

      {isPaidNoticeOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
        >
          <section
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="business-paid-notice-title"
          >
            <h2
              id="business-paid-notice-title"
              className={styles.modalTitle}
            >
              유료 전환 안내
            </h2>

            <p className={styles.modalDescription}>
              이 기능은 유료 BUSINESS 전환 후 사용할 수 있습니다.
            </p>

            <p className={styles.modalDescription}>
              체험판 후 유료 전환 상품입니다.
            </p>

            <button
              type="button"
              className={styles.modalConfirmButton}
              onClick={closePaidNotice}
            >
              확인
            </button>
          </section>
        </div>
      ) : null}
    </main>
  )
}

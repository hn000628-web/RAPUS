'use client'

// SECTION 01 : IMPORT

import {
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import {
  applyBusinessTrial
} from '@/lib/authApi'

import styles from './PremiumDesignPage.module.css'

// SECTION 02 : CONSTANT

const MARKET_DEMO_CHANNEL_CODE = 'B762491830572'
const MARKET_DEMO_PATH = `/market/${MARKET_DEMO_CHANNEL_CODE}`

// SECTION 03 : COMPONENT

export default function PremiumDesignPage() {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleApply() {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await applyBusinessTrial()

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'))
      }

      setIsComplete(true)
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '서비스 신청에 실패했습니다.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    router.push('/profile')
  }

  function handleMoveProfile() {
    router.push('/profile')
  }

  function handleMoveProfileAdmin() {
    router.push('/profile_admin')
  }

  function handleMoveMarketDemo() {
    router.push(MARKET_DEMO_PATH)
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
          마이페이지로 돌아가기
        </button>

        <div className={styles.header}>
          <span className={styles.eyebrow}>
            DEMO DESIGN
          </span>

          <h1 className={styles.title}>
            프리미엄 UI/UX 디자인
          </h1>

          <p className={styles.description}>
            업종별 특화 디자인과 고급 비즈니스 화면을 체험할 수 있습니다.
          </p>

          <div className={styles.noticeBox}>
            <p>
              서비스 신청 시 BUSINESS 체험판으로 전환됩니다.
            </p>

            <p>
              체험판은 유료 결제 상태가 아니며, 주문/POS/정산 기능은 유료 전환 후 사용할 수 있습니다.
            </p>
          </div>
        </div>

        <div className={styles.demoGrid}>
          <button
            type="button"
            className={styles.demoCard}
            onClick={handleMoveMarketDemo}
          >
            <strong>오프라인스토어(마트)</strong>
            <span>마켓 데모 페이지로 이동하여 오프라인 판매점 화면을 체험합니다.</span>
          </button>

          <article className={styles.demoCard}>
            <strong>고급 비즈니스 레이아웃</strong>
            <span>브랜드 정보와 운영 메뉴가 정리된 확장형 비즈니스 UI를 확인합니다.</span>
          </article>

          <article className={styles.demoCard}>
            <strong>체험판 등급 전환</strong>
            <span>신청 후 userGrade 2, providerGrade 0 상태로 BUSINESS 체험판이 적용됩니다.</span>
          </article>
        </div>

        {errorMessage ? (
          <p className={styles.errorMessage}>
            {errorMessage}
          </p>
        ) : null}

        {isComplete ? (
          <div className={styles.completeBox}>
            <strong>서비스 신청이 완료되었습니다.</strong>
            <span>BUSINESS 체험판으로 전환되었습니다.</span>
          </div>
        ) : null}

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleMoveProfile}
            disabled={isSubmitting}
          >
            마이페이지
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleMoveProfileAdmin}
            disabled={isSubmitting}
          >
            프로필_어드민
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleApply}
            disabled={isSubmitting || isComplete}
          >
            {isSubmitting ? '신청 중...' : '서비스 신청'}
          </button>
        </div>
      </section>
    </main>
  )
}

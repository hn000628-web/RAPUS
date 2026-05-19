'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './PayManagePage.module.css'

const AVAILABLE_CASH = 125000

export default function PayManagePage() {
  const router = useRouter()
  const [chargeAmount, setChargeAmount] = useState('')
  const [chargeError, setChargeError] = useState('')
  const [chargeSuccess, setChargeSuccess] = useState('')

  const [refundAmount, setRefundAmount] = useState('')
  const [refundError, setRefundError] = useState('')
  const [refundSuccess, setRefundSuccess] = useState('')

  function handleChargeSubmit() {
    const trimmed = chargeAmount.trim()

    if (!trimmed) {
      setChargeError('충전할 금액을 입력하세요.')
      setChargeSuccess('')
      return
    }

    const value = Number(trimmed.replace(/,/g, ''))
    if (!Number.isFinite(value) || value <= 0) {
      setChargeError('충전 금액은 1원 이상이어야 합니다.')
      setChargeSuccess('')
      return
    }

    setChargeError('')
    setChargeSuccess('캐시 충전 요청이 완료되었습니다.')
  }

  function handleRefundSubmit() {
    const trimmed = refundAmount.trim()

    if (!trimmed) {
      setRefundError('환급할 금액을 입력하세요.')
      setRefundSuccess('')
      return
    }

    const value = Number(trimmed.replace(/,/g, ''))
    if (!Number.isFinite(value) || value <= 0) {
      setRefundError('환급 금액은 1원 이상이어야 합니다.')
      setRefundSuccess('')
      return
    }

    if (value > AVAILABLE_CASH) {
      setRefundError('보유 캐시를 초과하여 환급할 수 없습니다.')
      setRefundSuccess('')
      return
    }

    setRefundError('')
    setRefundSuccess('환급 신청이 완료되었습니다.')
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>PAY 관리</h1>
            <p className={styles.description}>캐시 충전, 캐시 환급, MY 계좌를 관리합니다.</p>
          </div>
          <button type="button" className={styles.actionButton} onClick={() => router.push('/profile/pay')}>
            PAY 현황
          </button>
        </header>

        <section className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>캐시 잔액</p>
            <strong className={styles.summaryValue}>125,000원</strong>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>환급 가능 금액</p>
            <strong className={styles.summaryValue}>125,000원</strong>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>MY 계좌 상태</p>
            <strong className={styles.summaryValue}>인증 완료</strong>
          </article>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>캐시 충전</h2>
          <p className={styles.cardText}>등록된 본인 계좌에서 PAY 캐시로 충전합니다.</p>

          <div className={styles.fieldLabelRow}>
            <label htmlFor="charge-amount" className={styles.fieldLabel}>충전할 금액</label>
            <span className={styles.fieldUnit}>원</span>
          </div>
          <input
            id="charge-amount"
            type="text"
            className={styles.amountInput}
            placeholder="충전할 금액을 입력하세요"
            value={chargeAmount}
            onChange={(event) => {
              setChargeAmount(event.target.value)
              setChargeError('')
              setChargeSuccess('')
            }}
          />

          {chargeError ? <p className={styles.errorText}>{chargeError}</p> : null}
          {chargeSuccess ? <p className={styles.successText}>{chargeSuccess}</p> : null}

          <div className={styles.accountBox}>
            <p>국민은행 123-****-4567</p>
            <p>예금주: 김정명</p>
            <p>상태: 인증 완료</p>
          </div>

          <button type="button" className={styles.actionButton} onClick={handleChargeSubmit}>
            충전 진행
          </button>

          <ul className={styles.noticeList}>
            <li>캐시는 현금 충전만 가능합니다.</li>
            <li>포인트를 캐시로 전환할 수 없습니다.</li>
            <li>등록된 본인 계좌에서만 충전할 수 있습니다.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>캐시 환급</h2>
          <p className={styles.cardText}>보유 캐시를 등록된 본인 계좌로 환급 신청합니다.</p>
          <p className={styles.cardTextStrong}>환급 가능 캐시: {AVAILABLE_CASH.toLocaleString('ko-KR')}원</p>

          <div className={styles.fieldLabelRow}>
            <label htmlFor="refund-amount" className={styles.fieldLabel}>환급할 캐시 금액</label>
            <span className={styles.fieldUnit}>원</span>
          </div>
          <input
            id="refund-amount"
            type="text"
            className={styles.amountInput}
            placeholder="환급할 금액을 입력하세요"
            value={refundAmount}
            onChange={(event) => {
              setRefundAmount(event.target.value)
              setRefundError('')
              setRefundSuccess('')
            }}
          />

          {refundError ? <p className={styles.errorText}>{refundError}</p> : null}
          {refundSuccess ? <p className={styles.successText}>{refundSuccess}</p> : null}

          <div className={styles.accountBox}>
            <p>국민은행 123-****-4567</p>
            <p>예금주: 김정명</p>
            <p>상태: 인증 완료</p>
          </div>

          <button type="button" className={styles.actionButton} onClick={handleRefundSubmit}>
            환급 신청
          </button>

          <ul className={styles.noticeList}>
            <li>환급은 인증된 본인 계좌로만 가능합니다.</li>
            <li>환급 신청 금액은 보유 캐시 잔액을 초과할 수 없습니다.</li>
            <li>포인트는 환급 대상이 아닙니다.</li>
            <li>포인트를 캐시로 전환할 수 없습니다.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>MY 계좌</h2>
          <p className={styles.cardText}>캐시 충전 및 환급에 사용할 개인 계좌를 관리합니다.</p>

          <div className={styles.accountBox}>
            <p>은행: 국민은행</p>
            <p>계좌번호: 123-****-4567</p>
            <p>예금주: 김정명</p>
            <p>인증 상태: 인증 완료</p>
          </div>

          <div className={styles.actionRow}>
            <button type="button" className={styles.actionButton}>계좌 등록/변경</button>
            <button type="button" className={styles.actionButton}>계좌 인증</button>
          </div>

          <ul className={styles.noticeList}>
            <li>MY 계좌는 개인 캐시 충전 및 환급에 사용됩니다.</li>
            <li>사업자 매출 정산 계좌가 아닙니다.</li>
            <li>계좌 변경 후 재인증이 필요할 수 있습니다.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}

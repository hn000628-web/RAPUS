// FILE : frontend/app/signup/page.tsx
// ROOT : frontend/app/signup/page.tsx
// STATUS : MODIFY MODE
// ROLE : SIGNUP PAGE + SIGNUP API CONNECT + CHANNELCODE DISPLAY + 2STEP FLOW + BACK BUTTON
// CHANGE SUMMARY :
// - 기존 fetch('/api/signup') 제거
// - frontend/lib/signup-api.ts signup() 전용 API 연결
// - 회원가입 request에서 baseCode / channelCode / channelURL 전송 금지
// - GENERAL / BUSINESS profileType 전달
// - BUSINESS 기본 businessTypeCode STORE 전달은 signup-api.ts에서 처리
// - 회원가입 성공 후 로그인 페이지 이동
// - 기존 2단계 UI / 채널코드 자동 생성 예정 표시 유지

'use client'

// SECTION 01 : IMPORT

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties, FormEvent } from 'react'

import { signup } from '@/lib/signup-api'
import type { SignupProfileType } from '@/lib/signup-api'

// SECTION 02 : COMPONENT

export default function SignupPage() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [selectedProfile, setSelectedProfile] =
    useState<SignupProfileType>('GENERAL')
  const [loading, setLoading] = useState(false)
  const [channelCode, setChannelCode] = useState('')

  useEffect(() => {
    setChannelCode('자동 생성 예정 (A/B + BaseCode)')
  }, [selectedProfile])

  const handleNextStep = () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      alert('이메일을 입력해 주세요.')
      return
    }

    setEmail(normalizedEmail)
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (loading) {
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      alert('이메일을 입력해 주세요.')
      setStep(1)
      return
    }

    if (!password) {
      alert('비밀번호를 입력해 주세요.')
      return
    }

    if (!passwordConfirm) {
      alert('비밀번호 확인을 입력해 주세요.')
      return
    }

    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      await signup({
        email: normalizedEmail,
        password,
        profileType: selectedProfile
      })

      alert('회원가입 완료! 로그인 페이지로 이동합니다.')
      router.push('/')
    } catch (err) {
      console.error(err)

      if (err instanceof Error) {
        alert(err.message)
        return
      }

      alert('회원가입 요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={mainStyle}>
      <div style={bgGlow} />

      <div style={cardStyle}>
        <h1 style={logoStyle}>
          RAPUS
        </h1>

        <p style={subTitle}>
          Sign Up for RAPUS Platform
        </p>

        <div style={profileSelectWrapStyle}>
          <button
            type="button"
            style={{
              ...selectButton,
              background:
                selectedProfile === 'GENERAL'
                  ? '#2563eb'
                  : '#f3f4f6',
              color:
                selectedProfile === 'GENERAL'
                  ? '#fff'
                  : '#111827'
            }}
            onClick={() => setSelectedProfile('GENERAL')}
            disabled={loading}
          >
            일반
          </button>

          <button
            type="button"
            style={{
              ...selectButton,
              background:
                selectedProfile === 'BUSINESS'
                  ? '#2563eb'
                  : '#f3f4f6',
              color:
                selectedProfile === 'BUSINESS'
                  ? '#fff'
                  : '#111827'
            }}
            onClick={() => setSelectedProfile('BUSINESS')}
            disabled={loading}
          >
            비즈니스
          </button>
        </div>

        {step === 1 && (
          <div style={formStyle}>
            <input
              type="text"
              value={channelCode}
              readOnly
              style={readonlyInputStyle}
            />

            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              disabled={loading}
              required
            />

            <button
              type="button"
              style={nextButtonStyle}
              onClick={handleNextStep}
              disabled={loading}
            >
              다음
            </button>
          </div>
        )}

        {step === 2 && (
          <form
            onSubmit={handleSignup}
            style={formStyle}
          >
            <input
              type="text"
              value={channelCode}
              readOnly
              style={readonlyInputStyle}
            />

            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              disabled={loading}
              required
            />

            <input
              type="password"
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              style={inputStyle}
              disabled={loading}
              required
            />

            <div style={buttonRowStyle}>
              <button
                type="button"
                style={backButtonStyle}
                onClick={handleBack}
                disabled={loading}
              >
                뒤로가기
              </button>

              <button
                type="submit"
                style={signupButtonStyle}
                disabled={loading}
              >
                {loading ? '가입 중...' : '회원가입'}
              </button>
            </div>
          </form>
        )}

        <div style={footerText}>
          RAPUS Platform v1.0
        </div>
      </div>
    </main>
  )
}

// SECTION 03 : STYLE

const mainStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg,#eef2ff,#f8fafc)',
  position: 'relative',
  fontFamily: '-apple-system,BlinkMacSystemFont,system-ui'
}

const bgGlow: CSSProperties = {
  position: 'absolute',
  width: 700,
  height: 700,
  background: 'radial-gradient(circle,#60a5fa25,transparent)',
  filter: 'blur(90px)'
}

const cardStyle: CSSProperties = {
  width: 400,
  padding: '40px',
  background: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(18px)',
  borderRadius: 22,
  boxShadow: '0 25px 70px rgba(0,0,0,0.08)',
  textAlign: 'center',
  border: '1px solid #ffffffcc',
  boxSizing: 'border-box'
}

const logoStyle: CSSProperties = {
  fontSize: 42,
  fontWeight: 900,
  letterSpacing: 5,
  marginBottom: 8,
  background: 'linear-gradient(90deg,#1877f2,#22c55e)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent'
}

const subTitle: CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  marginBottom: 28
}

const profileSelectWrapStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 12
}

const formStyle: CSSProperties = {
  width: '100%'
}

const inputStyle: CSSProperties = {
  width: '100%',
  height: 52,
  padding: '0 18px',
  marginBottom: 18,
  fontSize: 14,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  outline: 'none',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
  boxSizing: 'border-box'
}

const readonlyInputStyle: CSSProperties = {
  ...inputStyle,
  backgroundColor: '#f0f0f0',
  cursor: 'not-allowed',
  marginBottom: 12
}

const selectButton: CSSProperties = {
  flex: 1,
  height: 42,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer'
}

const submitButtonStyle: CSSProperties = {
  flex: 1,
  height: 54,
  background: 'linear-gradient(90deg,#22c55e,#16a34a)',
  color: '#fff',
  border: 'none',
  fontSize: 16,
  cursor: 'pointer',
  borderRadius: 18,
  fontWeight: 700,
  boxShadow: '0 14px 30px rgba(34,197,94,0.35)'
}

const nextButtonStyle: CSSProperties = {
  ...submitButtonStyle,
  width: '100%',
  marginBottom: 12
}

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12
}

const backButtonStyle: CSSProperties = {
  ...submitButtonStyle,
  background: '#6b7280',
  flex: 1,
  boxShadow: '0 14px 30px rgba(107,114,128,0.25)'
}

const signupButtonStyle: CSSProperties = {
  ...submitButtonStyle,
  flex: 1
}

const footerText: CSSProperties = {
  marginTop: 22,
  fontSize: 11,
  color: '#94a3b8'
}
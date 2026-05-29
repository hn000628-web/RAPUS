// FILE : frontend/app/login/page.tsx
// ROOT : frontend/app/login/page.tsx
// STATUS : MODIFY MODE
// ROLE : LOGIN PAGE
// CHANGE SUMMARY : 회원가입 버튼 실제 경로 활성화, 로딩 중 제외하고 항상 버튼 활성

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'
import {
  clearClientAuthState,
  login
} from '@/lib/authApi'

export default function LoginPage() {
  const router = useRouter()
  const defaultProfileType = 'GENERAL'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    const normalizedEmail = email.trim()
    const normalizedPassword = password.trim()
    if (!normalizedEmail || !normalizedPassword) {
      alert('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    clearClientAuthState()
    setLoading(true)
    try {
      const data = await login({
        email: normalizedEmail,
        password: normalizedPassword,
        profileType: defaultProfileType
      })

      if (!data?.accessToken) {
        alert('로그인에 실패했습니다.')
        return
      }

      localStorage.setItem('accessToken', data.accessToken)
      window.dispatchEvent(new Event('auth-change'))

      if (data?.user?.userId) {
        localStorage.setItem('userId', String(data.user.userId))
      }

      localStorage.setItem('profileType', defaultProfileType)
      localStorage.setItem('activeProfileType', defaultProfileType)

      localStorage.removeItem('profileId')
      localStorage.removeItem('activeProfileId')
      localStorage.removeItem('generalProfileId')
      localStorage.removeItem('businessProfileId')

      router.push('/profile')
    } catch (err) {
      console.error(err)
      alert('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const goHome = () => {
    router.push('/')
  }

  return (
    <main style={mainStyle}>
      <div style={bgGlow} />
      <div style={cardStyle}>
        <h1 style={logoStyle} onClick={goHome}>RAPUS</h1>
        <p style={subTitle}>Connect Local Business &amp; People</p>

        <form onSubmit={handleLogin} style={formStyle}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
            required
          />
          <div style={buttonRowStyle}>
            <button
              type="button"
              style={{
                ...buttonBaseStyle,
                ...signupButtonStyle
              }}
              onClick={() => router.push('/signup')}
              disabled={loading} // 로그인 로딩 중만 비활성
            >
              회원가입
            </button>

            <button
              type="submit"
              style={loginButtonStyle}
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>
        <div style={footerText}>RAPUS Platform v1.0</div>
      </div>
    </main>
  )
}

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
  width: 'min(92vw, 400px)',
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
  color: 'transparent',
  cursor: 'pointer'
}

const subTitle: CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  marginBottom: 28
}

const formStyle: CSSProperties = { width: '100%' }

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

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  width: '100%'
}

const buttonBaseStyle: CSSProperties = {
  width: '100%',
  height: 54,
  background: 'linear-gradient(90deg,#22c55e,#16a34a)',
  color: '#fff',
  border: 'none',
  fontSize: 16,
  cursor: 'pointer',
  borderRadius: 18,
  fontWeight: 700,
  boxShadow: '0 14px 30px rgba(34,197,94,0.35)',
  flex: 1
}

const signupButtonStyle: CSSProperties = {
  background: 'linear-gradient(90deg,#3b82f6,#2563eb)',
  boxShadow: '0 14px 30px rgba(37,99,235,0.25)'
}

const loginButtonStyle: CSSProperties = {
  ...buttonBaseStyle
}

const footerText: CSSProperties = {
  marginTop: 22,
  fontSize: 11,
  color: '#94a3b8'
}

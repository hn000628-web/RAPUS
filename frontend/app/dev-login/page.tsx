'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000'

function DevLoginPageContent() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const profileId = params.get('profileId')

    if (!profileId) {
      router.replace('/admin/users')
      return
    }

    const devLogin = async () => {
      try {
        const res = await fetch(
          `${API}/api/admin/dev-login/${profileId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          }
        )

        if (!res.ok) {
          const txt = await res.text()
          console.error(txt)
          throw new Error()
        }

        const data = await res.json()

        localStorage.setItem(
          'accessToken',
          data.accessToken
        )

        localStorage.setItem(
          'devProfile',
          profileId
        )

        await fetch(
          `${API}/profiles/activate`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.accessToken}`
            },
            body: JSON.stringify({
              profileId: Number(profileId)
            })
          }
        )

        if (data.profileType === 'BUSINESS') {
          router.replace('/profile')
        } else {
          router.replace('/profile')
        }
      } catch (err) {
        console.error('DEV LOGIN FAIL', err)
        router.replace('/admin/users')
      }
    }

    void devLogin()
  }, [params, router])

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18
      }}
    >
      DEV LOGIN PROCESS...
    </div>
  )
}

export default function DevLoginPage() {
  return (
    <Suspense fallback={<div>개발 로그인 페이지를 불러오는 중입니다.</div>}>
      <DevLoginPageContent />
    </Suspense>
  )
}

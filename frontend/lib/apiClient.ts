const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000'

function getToken() {

  if (typeof window === 'undefined')
    return null

  return localStorage.getItem('accessToken')
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {

  const token = getToken()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  }

  /* =====================================
     Authorization
  ===================================== */

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  /* =====================================
     Content-Type
     (GET 요청 제외)
  ===================================== */

  if (options.method && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(
    `${API_BASE}${url}`,
    {
      ...options,
      headers
    }
  )

  /* =====================================
     Unauthorized
  ===================================== */

  if (res.status === 401) {
    throw new Error('Unauthorized')
  }

  /* =====================================
     Error Handling
  ===================================== */

  if (!res.ok) {

    let message = 'API error'

    try {

      const text = await res.text()

      if (text)
        message = text

    } catch {}

    throw new Error(message)

  }

  /* =====================================
     No Content
  ===================================== */

  if (res.status === 204)
    return null

  /* =====================================
     JSON Response
  ===================================== */

  const data = await res.json()

  return data
}
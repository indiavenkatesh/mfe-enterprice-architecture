import { accessToken, refreshTokens, logout } from '@mfe-demo/domain'

const BASE = 'http://localhost:3001'

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = accessToken.value
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE}${url}`, { ...options, headers })

  if (res.status === 401) {
    await refreshTokens((rt) =>
      fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      }).then(r => {
        if (!r.ok) throw new Error('Refresh failed')
        return r.json()
      })
    )

    const newToken = accessToken.value
    if (!newToken) { logout(); throw new Error('Session expired') }

    return fetch(`${BASE}${url}`, {
      ...options,
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
    })
  }

  return res
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()
}

export async function apiLogout(refreshToken: string) {
  await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}

export async function apiGetDashboard() {
  const res = await fetchWithAuth('/dashboard')
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

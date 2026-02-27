import { signal, computed } from '@preact/signals-core'
import { User, TokenPair } from '../types'
import { triggerGlobalReset } from './reset-registry'

// ─── Private State ─────────────────────────────────────────────────────────
const _accessToken  = signal<string | null>(null)
const _refreshToken = signal<string | null>(null)
const _user         = signal<User | null>(null)
const _isRefreshing = signal<boolean>(false)
const _error        = signal<string | null>(null)

// ─── Public Computed (Read-only surface) ───────────────────────────────────
export const isAuthenticated = computed(() => _accessToken.value !== null)
export const currentUser     = computed(() => _user.value)
export const accessToken     = computed(() => _accessToken.value)
export const isRefreshing    = computed(() => _isRefreshing.value)
export const authError       = computed(() => _error.value)

// ─── Actions ───────────────────────────────────────────────────────────────
export function login(user: User, tokens: TokenPair): void {
  _user.value         = user
  _accessToken.value  = tokens.accessToken
  _refreshToken.value = tokens.refreshToken
  _error.value        = null
}

export function logout(): void {
  _user.value         = null
  _accessToken.value  = null
  _refreshToken.value = null
  _isRefreshing.value = false
  _error.value        = null
  triggerGlobalReset()
}

export function setAuthError(message: string): void {
  _error.value = message
}

export function updateTokens(tokens: TokenPair): void {
  _accessToken.value  = tokens.accessToken
  _refreshToken.value = tokens.refreshToken
}

// ─── Controlled Token Refresh (no duplicate calls) ─────────────────────────
let _refreshPromise: Promise<void> | null = null

export async function refreshTokens(
  refreshFn: (token: string) => Promise<TokenPair>
): Promise<void> {
  if (_refreshPromise) return _refreshPromise
  if (_isRefreshing.value) return

  const token = _refreshToken.value
  if (!token) {
    logout()
    return
  }

  _isRefreshing.value = true

  _refreshPromise = refreshFn(token)
    .then((tokens) => {
      updateTokens(tokens)
    })
    .catch(() => {
      logout()
    })
    .finally(() => {
      _isRefreshing.value = false
      _refreshPromise     = null
    })

  return _refreshPromise
}

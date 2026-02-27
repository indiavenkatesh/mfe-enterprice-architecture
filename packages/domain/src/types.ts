export interface User {
  id: string
  name: string
  email: string
  avatar: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated' | 'refreshing'

export type ResetFn = () => void

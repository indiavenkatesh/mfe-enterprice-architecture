import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const app  = express()
const PORT = 3001

const ACCESS_SECRET  = 'access-secret-demo'
const REFRESH_SECRET = 'refresh-secret-demo'
const ACCESS_EXPIRY  = '15s'   // Short for demo — easy to see refresh in action
const REFRESH_EXPIRY = '5m'

// ─── Mock Users DB ──────────────────────────────────────────────────────────
const USERS = [
  {
    id: '1',
    email: 'venki@mfe-demo.com',
    password: 'demo123',
    name: 'Venkatesh Periyasamy',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=VP&backgroundColor=0f172a&textColor=38bdf8',
  },
  {
    id: '2',
    email: 'react@mfe-demo.com',
    password: 'demo123',
    name: 'React User',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=RU&backgroundColor=0f172a&textColor=34d399',
  },
]

// ─── Token Store (in-memory for demo) ───────────────────────────────────────
const activeRefreshTokens = new Set<string>()

// ─── Helpers ────────────────────────────────────────────────────────────────
function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY })
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY })
  return { accessToken, refreshToken }
}

function verifyAccess(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as { userId: string }
}

function verifyRefresh(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string }
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4200'],
  credentials: true,
}))
app.use(express.json())

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' })
    return
  }

  try {
    const payload = verifyAccess(auth.split(' ')[1])
    ;(req as any).userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' })
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /auth/login
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body
  const user = USERS.find(u => u.email === email && u.password === password)

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const tokens = generateTokens(user.id)
  activeRefreshTokens.add(tokens.refreshToken)

  console.log(`[AUTH] Login: ${user.email}`)
  res.json({
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    ...tokens,
  })
})

// POST /auth/refresh
app.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken || !activeRefreshTokens.has(refreshToken)) {
    res.status(401).json({ error: 'Invalid refresh token' })
    return
  }

  try {
    const payload = verifyRefresh(refreshToken)
    const user = USERS.find(u => u.id === payload.userId)
    if (!user) throw new Error('User not found')

    // Rotate refresh token
    activeRefreshTokens.delete(refreshToken)
    const tokens = generateTokens(user.id)
    activeRefreshTokens.add(tokens.refreshToken)

    console.log(`[AUTH] Token refreshed for: ${user.email}`)
    res.json(tokens)
  } catch {
    activeRefreshTokens.delete(refreshToken)
    res.status(401).json({ error: 'Refresh token expired' })
  }
})

// POST /auth/logout
app.post('/auth/logout', (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) activeRefreshTokens.delete(refreshToken)
  console.log(`[AUTH] Logout`)
  res.json({ success: true })
})

// GET /me — protected
app.get('/me', authMiddleware, (req, res) => {
  const userId = (req as any).userId
  const user = USERS.find(u => u.id === userId)
  if (!user) { res.status(404).json({ error: 'User not found' }); return }
  res.json({ id: user.id, name: user.name, email: user.email, avatar: user.avatar })
})

// GET /dashboard — protected
app.get('/dashboard', authMiddleware, (req, res) => {
  const userId = (req as any).userId
  const user = USERS.find(u => u.id === userId)
  res.json({
    message: `Welcome back, ${user?.name}!`,
    stats: {
      mfesRunning: 2,
      signalsActive: 4,
      lastRefresh: new Date().toISOString(),
      tokenExpiresIn: `${ACCESS_EXPIRY}`,
    }
  })
})

// GET /health
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 MFE Auth Demo Backend running on http://localhost:${PORT}`)
  console.log(`\nDemo credentials:`)
  USERS.forEach(u => console.log(`  📧 ${u.email}  🔑 ${u.password}`))
  console.log(`\nAccess token expires in: ${ACCESS_EXPIRY} (short for demo)\n`)
})

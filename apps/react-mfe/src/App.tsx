import { useSignals } from '@preact/signals-react/runtime'
import { isAuthenticated, currentUser, isRefreshing, authError, login, logout } from '@mfe-demo/domain'
import { apiLogin, apiLogout, apiGetDashboard } from './api'
import { useState, useEffect } from 'react'

// ─── Login Page ──────────────────────────────────────────────────────────────
function LoginPage() {
  useSignals()
  const [email, setEmail]       = useState('venki@mfe-demo.com')
  const [password, setPassword] = useState('demo123')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await apiLogin(email, password)
      login(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken })
    } catch {
      setError('Invalid credentials. Try venki@mfe-demo.com / demo123')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.loginCard}>
        <div style={styles.badge}>React MFE</div>
        <h1 style={styles.title}>Auth Store<br /><span style={styles.titleAccent}>Demo</span></h1>
        <p style={styles.subtitle}>Part 4 — Enterprise MFE Architecture</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="venki@mfe-demo.com"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="demo123"
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={loading ? styles.btnDisabled : styles.btn} type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Login →'}
          </button>
        </form>

        <div style={styles.hint}>
          <p style={styles.hintTitle}>🧪 Demo Credentials</p>
          <code style={styles.code}>venki@mfe-demo.com / demo123</code><br />
          <code style={styles.code}>react@mfe-demo.com / demo123</code>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard() {
  useSignals()
  const user      = currentUser.value
  const refreshing = isRefreshing.value
  const [stats, setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGetDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    const storedToken = localStorage.getItem('refreshToken')
    if (storedToken) await apiLogout(storedToken)
    localStorage.removeItem('refreshToken')
    logout()
  }

  return (
    <div style={styles.page}>
      <div style={styles.dashboard}>
        <header style={styles.header}>
          <div style={styles.userInfo}>
            <img src={user?.avatar} alt={user?.name} style={styles.avatar} />
            <div>
              <p style={styles.userName}>{user?.name}</p>
              <p style={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.badge}>React MFE</div>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        </header>

        {refreshing && (
          <div style={styles.refreshBanner}>
            🔄 Token refreshing... (single controlled call, no storm)
          </div>
        )}

        <div style={styles.storeViz}>
          <h2 style={styles.sectionTitle}>📡 Domain Signal State</h2>
          <div style={styles.signalGrid}>
            <SignalCard label="isAuthenticated" value={String(isAuthenticated.value)} positive />
            <SignalCard label="currentUser" value={user?.name ?? 'null'} positive />
            <SignalCard label="isRefreshing" value={String(refreshing)} />
            <SignalCard label="authError" value={authError.value ?? 'null'} />
          </div>
          <p style={styles.note}>
            ↑ These are <strong>@preact/signals-core</strong> computed values consumed via{' '}
            <code>useSignals()</code> — no useState, no props, no context.
          </p>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading dashboard data...</div>
        ) : stats ? (
          <div style={styles.statsGrid}>
            <StatCard icon="🧩" label="MFEs Running" value={stats.stats.mfesRunning} />
            <StatCard icon="⚡" label="Signals Active" value={stats.stats.signalsActive} />
            <StatCard icon="🔑" label="Token Expiry" value={stats.stats.tokenExpiresIn} />
            <StatCard icon="🕐" label="Last Refresh" value={new Date(stats.stats.lastRefresh).toLocaleTimeString()} />
          </div>
        ) : null}

        <div style={styles.archNote}>
          <h3 style={styles.archTitle}>🏗 What's happening under the hood</h3>
          <ul style={styles.archList}>
            <li>Auth store lives in <code>@mfe-demo/domain</code> — outside React</li>
            <li>React consumes signals via <code>useSignals()</code> from <code>@preact/signals-react</code></li>
            <li>Token refresh uses singleton promise — fires exactly once even if called concurrently</li>
            <li>Logout triggers global reset across all registered stores</li>
            <li>Angular MFE (port 4200) shares the same domain store</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function SignalCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div style={styles.signalCard}>
      <p style={styles.signalLabel}>{label}</p>
      <p style={{ ...styles.signalValue, color: positive ? '#34d399' : '#94a3b8' }}>{value}</p>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: any }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statIcon}>{icon}</span>
      <p style={styles.statValue}>{value}</p>
      <p style={styles.statLabel}>{label}</p>
    </div>
  )
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  useSignals()
  return isAuthenticated.value ? <Dashboard /> : <LoginPage />
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#020817',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Mono', 'Fira Code', monospace",
    color: '#e2e8f0',
    padding: '2rem',
  },
  loginCard: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    padding: '3rem',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  badge: {
    display: 'inline-block',
    background: '#0ea5e9',
    color: '#020817',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '4px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 800,
    lineHeight: 1.1,
    margin: '0 0 0.5rem',
    color: '#f8fafc',
  },
  titleAccent: { color: '#38bdf8' },
  subtitle: { color: '#475569', fontSize: '0.85rem', margin: '0 0 2rem' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  label: { fontSize: '0.75rem', color: '#64748b', letterSpacing: '0.05em' },
  input: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#f8fafc',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  btn: {
    background: '#38bdf8',
    color: '#020817',
    border: 'none',
    borderRadius: '8px',
    padding: '0.85rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '0.5rem',
    fontFamily: 'inherit',
    letterSpacing: '0.05em',
  },
  btnDisabled: {
    background: '#1e293b',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    padding: '0.85rem',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    cursor: 'not-allowed',
    marginTop: '0.5rem',
  },
  error: { color: '#f87171', fontSize: '0.8rem', margin: 0 },
  hint: {
    marginTop: '2rem',
    padding: '1rem',
    background: '#0f2137',
    borderRadius: '8px',
    border: '1px solid #1e3a5f',
  },
  hintTitle: { margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#64748b' },
  code: { fontSize: '0.78rem', color: '#38bdf8', fontFamily: 'inherit' },
  dashboard: { width: '100%', maxWidth: '900px' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: '#1e293b' },
  userName: { margin: 0, fontWeight: 700, fontSize: '0.95rem' },
  userEmail: { margin: 0, fontSize: '0.78rem', color: '#475569' },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #334155',
    color: '#94a3b8',
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontFamily: 'inherit',
  },
  refreshBanner: {
    background: '#1c3d5a',
    border: '1px solid #0ea5e9',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
    color: '#7dd3fc',
  },
  storeViz: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  sectionTitle: { margin: '0 0 1rem', fontSize: '0.9rem', color: '#94a3b8' },
  signalGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' },
  signalCard: {
    background: '#1e293b',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    border: '1px solid #334155',
  },
  signalLabel: { margin: '0 0 4px', fontSize: '0.7rem', color: '#475569', letterSpacing: '0.05em' },
  signalValue: { margin: 0, fontSize: '0.85rem', fontWeight: 600 },
  note: { margin: '1rem 0 0', fontSize: '0.75rem', color: '#475569', lineHeight: 1.6 },
  loading: { textAlign: 'center' as const, padding: '2rem', color: '#475569' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '1.25rem',
    textAlign: 'center' as const,
  },
  statIcon: { fontSize: '1.5rem' },
  statValue: { margin: '0.5rem 0 0.25rem', fontWeight: 700, fontSize: '1.1rem', color: '#38bdf8' },
  statLabel: { margin: 0, fontSize: '0.72rem', color: '#475569' },
  archNote: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  archTitle: { margin: '0 0 1rem', fontSize: '0.9rem', color: '#94a3b8' },
  archList: { margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' },
}

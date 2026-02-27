import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import {
  isAuthenticated,
  currentUser,
  isRefreshing,
  authError,
  login,
  logout,
} from '@mfe-demo/domain'
import { toAngularSignal } from './utils/to-angular-signal'
import { apiLogin, apiLogout, apiGetDashboard } from './api'

// ─── Login Component ─────────────────────────────────────────────────────────
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="card">
        <span class="badge">Angular MFE</span>
        <h1 class="title">Auth Store<br /><span class="accent">Demo</span></h1>
        <p class="subtitle">Part 4 — Enterprise MFE Architecture</p>

        <div class="form">
          <div class="field">
            <label class="label">Email</label>
            <input class="input" type="email" [(ngModel)]="email" placeholder="venki@mfe-demo.com" />
          </div>
          <div class="field">
            <label class="label">Password</label>
            <input class="input" type="password" [(ngModel)]="password" placeholder="demo123" />
          </div>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button class="btn" [disabled]="loading()" (click)="handleLogin()">
            {{ loading() ? 'Authenticating...' : 'Login →' }}
          </button>
        </div>

        <div class="hint">
          <p class="hint-title">🧪 Demo Credentials</p>
          <code>venki&#64;mfe-demo.com / demo123</code><br />
          <code>react&#64;mfe-demo.com / demo123</code>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#020817; display:flex; align-items:center; justify-content:center; font-family:'DM Mono','Fira Code',monospace; color:#e2e8f0; padding:2rem; }
    .card { background:#0f172a; border:1px solid #1e293b; border-radius:16px; padding:3rem; width:100%; max-width:440px; box-shadow:0 25px 50px rgba(0,0,0,.5); }
    .badge { display:inline-block; background:#a78bfa; color:#020817; font-size:.7rem; font-weight:700; padding:4px 10px; border-radius:4px; letter-spacing:.1em; text-transform:uppercase; margin-bottom:1.5rem; }
    .title { font-size:2.5rem; font-weight:800; line-height:1.1; margin:0 0 .5rem; color:#f8fafc; }
    .accent { color:#a78bfa; }
    .subtitle { color:#475569; font-size:.85rem; margin:0 0 2rem; }
    .form { display:flex; flex-direction:column; gap:1rem; }
    .field { display:flex; flex-direction:column; gap:6px; }
    .label { font-size:.75rem; color:#64748b; letter-spacing:.05em; }
    .input { background:#1e293b; border:1px solid #334155; border-radius:8px; padding:.75rem 1rem; color:#f8fafc; font-size:.9rem; font-family:inherit; outline:none; }
    .btn { background:#a78bfa; color:#020817; border:none; border-radius:8px; padding:.85rem; font-size:.9rem; font-weight:700; cursor:pointer; margin-top:.5rem; font-family:inherit; letter-spacing:.05em; }
    .btn:disabled { background:#1e293b; color:#475569; cursor:not-allowed; }
    .error { color:#f87171; font-size:.8rem; margin:0; }
    .hint { margin-top:2rem; padding:1rem; background:#1a1040; border-radius:8px; border:1px solid #2d1f6e; }
    .hint-title { margin:0 0 .5rem; font-size:.8rem; color:#64748b; }
    code { font-size:.78rem; color:#a78bfa; font-family:inherit; }
  `]
})
export class LoginComponent {
  email    = 'venki@mfe-demo.com'
  password = 'demo123'
  loading  = signal(false)
  error    = signal<string | null>(null)

  async handleLogin() {
    this.loading.set(true)
    this.error.set(null)
    try {
      const data = await apiLogin(this.email, this.password)
      login(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken })
    } catch {
      this.error.set('Invalid credentials. Try venki@mfe-demo.com / demo123')
    } finally {
      this.loading.set(false)
    }
  }
}

// ─── Dashboard Component ──────────────────────────────────────────────────────
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="dashboard">
        <header class="header">
          <div class="user-info">
            <img [src]="user()?.avatar" [alt]="user()?.name" class="avatar" />
            <div>
              <p class="user-name">{{ user()?.name }}</p>
              <p class="user-email">{{ user()?.email }}</p>
            </div>
          </div>
          <div class="header-right">
            <span class="badge">Angular MFE</span>
            <button class="logout-btn" (click)="handleLogout()">Logout</button>
          </div>
        </header>

        @if (refreshing()) {
          <div class="refresh-banner">
            🔄 Token refreshing... (single controlled call — no storm)
          </div>
        }

        <div class="store-viz">
          <h2 class="section-title">📡 Domain Signal State</h2>
          <div class="signal-grid">
            <div class="signal-card">
              <p class="sig-label">isAuthenticated</p>
              <p class="sig-value positive">{{ isAuth() }}</p>
            </div>
            <div class="signal-card">
              <p class="sig-label">currentUser</p>
              <p class="sig-value positive">{{ user()?.name ?? 'null' }}</p>
            </div>
            <div class="signal-card">
              <p class="sig-label">isRefreshing</p>
              <p class="sig-value">{{ refreshing() }}</p>
            </div>
            <div class="signal-card">
              <p class="sig-label">authError</p>
              <p class="sig-value">{{ err() ?? 'null' }}</p>
            </div>
          </div>
          <p class="note">
            ↑ Domain signals bridged via <strong>toAngularSignal()</strong> — zoneless Angular, OnPush,
            DOM updates only when signal changes.
          </p>
        </div>

        @if (stats()) {
          <div class="stats-grid">
            <div class="stat-card"><span class="stat-icon">🧩</span><p class="stat-val">{{ stats().stats.mfesRunning }}</p><p class="stat-label">MFEs Running</p></div>
            <div class="stat-card"><span class="stat-icon">⚡</span><p class="stat-val">{{ stats().stats.signalsActive }}</p><p class="stat-label">Signals Active</p></div>
            <div class="stat-card"><span class="stat-icon">🔑</span><p class="stat-val">{{ stats().stats.tokenExpiresIn }}</p><p class="stat-label">Token Expiry</p></div>
            <div class="stat-card"><span class="stat-icon">🕐</span><p class="stat-val">{{ formatTime(stats().stats.lastRefresh) }}</p><p class="stat-label">Last Refresh</p></div>
          </div>
        }

        <div class="arch-note">
          <h3 class="arch-title">🏗 What's happening under the hood</h3>
          <ul class="arch-list">
            <li>Zoneless Angular — <code>provideExperimentalZonelessChangeDetection()</code></li>
            <li><code>toAngularSignal()</code> bridges domain signals to Angular signals</li>
            <li><code>ChangeDetectionStrategy.OnPush</code> — DOM only updates on signal change</li>
            <li>Same domain store as React MFE (port 5173) — shared singleton brain</li>
            <li>Logout triggers global reset via the reset registry</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#020817; display:flex; align-items:center; justify-content:center; font-family:'DM Mono','Fira Code',monospace; color:#e2e8f0; padding:2rem; }
    .dashboard { width:100%; max-width:900px; }
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:1.25rem 1.5rem; }
    .header-right { display:flex; align-items:center; gap:1rem; }
    .badge { display:inline-block; background:#a78bfa; color:#020817; font-size:.7rem; font-weight:700; padding:4px 10px; border-radius:4px; letter-spacing:.1em; text-transform:uppercase; }
    .user-info { display:flex; align-items:center; gap:1rem; }
    .avatar { width:44px; height:44px; border-radius:50%; background:#1e293b; }
    .user-name { margin:0; font-weight:700; font-size:.95rem; }
    .user-email { margin:0; font-size:.78rem; color:#475569; }
    .logout-btn { background:transparent; border:1px solid #334155; color:#94a3b8; border-radius:6px; padding:6px 14px; cursor:pointer; font-size:.8rem; font-family:inherit; }
    .refresh-banner { background:#1c1040; border:1px solid #7c3aed; border-radius:8px; padding:.75rem 1rem; margin-bottom:1.5rem; font-size:.85rem; color:#c4b5fd; }
    .store-viz { background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:1.5rem; margin-bottom:1.5rem; }
    .section-title { margin:0 0 1rem; font-size:.9rem; color:#94a3b8; }
    .signal-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:.75rem; }
    .signal-card { background:#1e293b; border-radius:8px; padding:.75rem 1rem; border:1px solid #334155; }
    .sig-label { margin:0 0 4px; font-size:.7rem; color:#475569; letter-spacing:.05em; }
    .sig-value { margin:0; font-size:.85rem; font-weight:600; color:#94a3b8; }
    .positive { color:#a78bfa !important; }
    .note { margin:1rem 0 0; font-size:.75rem; color:#475569; line-height:1.6; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
    .stat-card { background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:1.25rem; text-align:center; }
    .stat-icon { font-size:1.5rem; }
    .stat-val { margin:.5rem 0 .25rem; font-weight:700; font-size:1.1rem; color:#a78bfa; }
    .stat-label { margin:0; font-size:.72rem; color:#475569; }
    .arch-note { background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:1.5rem; }
    .arch-title { margin:0 0 1rem; font-size:.9rem; color:#94a3b8; }
    .arch-list { margin:0; padding:0 0 0 1.25rem; display:flex; flex-direction:column; gap:.5rem; font-size:.82rem; color:#64748b; line-height:1.6; }
    code { color:#a78bfa; font-family:inherit; }
  `]
})
export class DashboardComponent implements OnInit {
  // ← toAngularSignal bridges domain signals to Angular — zoneless + OnPush
  isAuth    = toAngularSignal(isAuthenticated)
  user      = toAngularSignal(currentUser)
  refreshing = toAngularSignal(isRefreshing)
  err       = toAngularSignal(authError)
  stats     = signal<any>(null)

  async ngOnInit() {
    const data = await apiGetDashboard()
    this.stats.set(data)
  }

  async handleLogout() {
    await apiLogout('')
    logout()
  }

  formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString()
  }
}

// ─── Root App Component ───────────────────────────────────────────────────────
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, DashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isAuth()) {
      <app-dashboard />
    } @else {
      <app-login />
    }
  `,
})
export class AppComponent {
  isAuth = toAngularSignal(isAuthenticated)
}

# MFE Auth Store Demo

**Demo app for Part 4 — Enterprise-Grade Micro Frontend Architecture**

> Building a Production-Grade Auth Store with `@preact/signals-core`

---

## 🧑‍💻 Dev Modes via `MFE_MODE`

Three modes. One env var.

| Mode | Command | How it works |
|---|---|---|
| `local` | `pnpm dev` | Rspack aliases → monorepo packages directly, no federation, fast HMR |
| `fed-local` | `pnpm dev:fed` | Real Module Federation → localhost URLs of other MFE dev servers |
| `prod` | `pnpm build` | Federation → CDN/remote URLs |

### `local` — Day-to-day development

```bash
pnpm dev
```

- **No Module Federation** — `ModuleFederationPlugin` is skipped entirely
- Rspack aliases resolve `@mfe-demo/domain` directly to `packages/domain/src/index.ts`
- Instant HMR, no port juggling, no remoteEntry loading
- Use this 95% of the time

### `fed-local` — Pre-merge federation testing

```bash
pnpm dev:fed
```

- **Real Module Federation** — each MFE builds a `remoteEntry.js` and loads from localhost
- Catches singleton conflicts (shared `@preact/signals-core` must be one instance)
- Catches remoteEntry loading failures
- Catches shared version mismatches
- Use this before merging to main or opening a PR

### `prod` — Production build

```bash
pnpm build
```

- Federation points to CDN/remote URLs defined in `config/remotes.js`
- Domain package built first, then MFEs

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

```bash
npm install -g pnpm
```

### Install

```bash
pnpm install
```

### Run

```bash
# Fast local dev (no federation)
pnpm dev

# Federation mode (real remoteEntry, catches singleton issues)
pnpm dev:fed
```

Apps running:

| App | URL | Description |
|---|---|---|
| Backend | http://localhost:3001 | Express + JWT auth |
| React MFE | http://localhost:5173 | React 18 + signals-react |
| Angular MFE | http://localhost:4200 | Angular 17 Zoneless |

---

## 🧪 Demo Credentials

| Email | Password |
|---|---|
| venki@mfe-demo.com | demo123 |
| react@mfe-demo.com | demo123 |

---

## 🗂 Key Files

```
config/
├── remotes.js      ← Central map of all remotes per mode (edit CDN URLs here)
└── federation.js   ← Shared singleton config (@mfe-demo/domain, signals-core, react)

apps/react-mfe/
└── rspack.config.js   ← Aliases active in local, ModuleFederationPlugin in fed-local/prod

apps/angular-mfe/
└── rspack.config.js   ← Same pattern + Angular-specific shared singletons
```

### `config/remotes.js` — edit this for your CDN URLs

```js
prod: {
  reactMfe:   'reactMfe@https://cdn.your-org.com/react-mfe/remoteEntry.js',
  angularMfe: 'angularMfe@https://cdn.your-org.com/angular-mfe/remoteEntry.js',
}
```

### Why `@mfe-demo/domain` must be `singleton: true`

Signals-core maintains a reactive graph in memory.
If two MFEs load separate instances, they have separate graphs.
Auth state changes in React would not propagate to Angular.

`singleton: true` guarantees one instance — one graph — one brain.

---

## 🏗 Monorepo Structure

```
mfe-auth-demo/
├── config/
│   ├── remotes.js              ← Central remote map (local / fed-local / prod)
│   └── federation.js           ← Shared singleton config
│
├── packages/
│   └── domain/                 ← Shared framework-agnostic brain
│       └── src/
│           ├── stores/
│           │   ├── auth-store.ts       ← Signals-based auth store
│           │   └── reset-registry.ts   ← Global reset on logout
│           ├── utils/
│           │   └── to-angular-signal.ts
│           ├── types.ts
│           └── index.ts
│
├── apps/
│   ├── backend/                ← Express + JWT (port 3001)
│   │
│   ├── react-mfe/              ← React 18 + Rspack (port 5173)
│   │   ├── rspack.config.js    ← Aliases in local, federation in fed-local/prod
│   │   └── src/
│   │       ├── App.tsx         ← useSignals() — no bridge needed
│   │       └── api.ts
│   │
│   └── angular-mfe/            ← Angular 17 Zoneless + Rspack (port 4200)
│       ├── rspack.config.js    ← Same pattern + Angular singletons
│       └── src/
│           ├── app.component.ts  ← toAngularSignal() + OnPush
│           ├── utils/to-angular-signal.ts
│           └── main.ts           ← provideExperimentalZonelessChangeDetection()
│
├── pnpm-workspace.yaml
└── package.json                ← concurrently boots all MFEs per mode
```

---

## 🔑 Key Concepts Demonstrated

### 1. Shared Domain Layer
`@mfe-demo/domain` is pure TypeScript, zero framework dependencies. Both MFEs import from the same store.

### 2. Auth Store with Controlled Refresh
Token refresh uses a singleton promise — fires **exactly once** even if multiple MFEs trigger it simultaneously. No refresh storms.

### 3. React Adapter — Built-in
`useSignals()` from `@preact/signals-react` — same ecosystem, no custom bridge needed.

### 4. Angular Adapter — `toAngularSignal()`
Bridges `@preact/signals-core` → Angular signals via a single `effect()`. Zero boilerplate in components.

### 5. Zoneless Angular
No Zone.js. DOM updates fire only when a signal changes.

### 6. Module Federation modes
`local` for speed. `fed-local` to catch real federation issues. `prod` for CDN.

---

## 📖 Article Series

- **Part 1** — [Where the Brain Should Live in MFEs](https://medium.com/@venki88.php/where-the-brain-should-live-in-mfes-enterprise-grade-micro-frontend-architecture-part-1-8c7c95c371ed)
- **Part 2** — [What Is State Management Really?](https://medium.com/@venki88.php/what-is-state-management-really-enterprise-grade-micro-frontend-architecture-part-2-236910aa25ef)
- **Part 3** — [Signals: The Reactive Primitive](https://medium.com/@venki88.php/signals-the-reactive-primitive-enterprise-grade-micro-frontend-architecture-series-part-3-6a1e37b5d6b2)
- **Part 4** — Building a Production-Grade Auth Store *(this demo)*

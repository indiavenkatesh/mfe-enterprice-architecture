/**
 * toAngularSignal
 *
 * Bridges a @preact/signals-core ReadonlySignal into an Angular WritableSignal.
 * Registers an effect() to keep them in sync automatically.
 *
 * Usage:
 *   protected isAuth = toAngularSignal(isAuthenticated)
 *
 * Must be called inside an Angular injection context (constructor or runInInjectionContext).
 */

// NOTE: This file is intentionally kept as a template.
// Angular imports (signal, effect) come from @angular/core at runtime inside the Angular MFE.
// The domain package does NOT depend on Angular — it only defines the pattern.

export type AngularSignalBridge<T> = {
  (): T
  set(value: T): void
  update(fn: (value: T) => T): void
  asReadonly(): { (): T }
}

/**
 * Template showing the bridge pattern.
 * Actual implementation lives in apps/angular-mfe/src/utils/to-angular-signal.ts
 * to avoid pulling @angular/core into the domain package.
 */
export const TO_ANGULAR_SIGNAL_DOCS = `
import { signal, effect } from '@angular/core'
import { ReadonlySignal } from '@preact/signals-core'

export function toAngularSignal<T>(source: ReadonlySignal<T>) {
  const angularSig = signal<T>(source.value)

  effect(() => {
    angularSig.set(source.value)
  })

  return angularSig.asReadonly()
}
`

import { signal, effect, Signal } from '@angular/core'
import { ReadonlySignal } from '@preact/signals-core'

/**
 * toAngularSignal
 *
 * Bridges a @preact/signals-core ReadonlySignal into an Angular readonly Signal.
 * Uses Angular's effect() to sync changes automatically.
 *
 * Must be called inside an Angular injection context (constructor, field initializer, or runInInjectionContext).
 *
 * Usage:
 *   protected isAuth = toAngularSignal(isAuthenticated)
 *   protected user   = toAngularSignal(currentUser)
 */
export function toAngularSignal<T>(source: ReadonlySignal<T>): Signal<T> {
  const angularSig = signal<T>(source.value)

  effect(() => {
    angularSig.set(source.value)
  })

  return angularSig.asReadonly()
}

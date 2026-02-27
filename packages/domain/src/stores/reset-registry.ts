import { ResetFn } from '../types'

const _resetRegistry: ResetFn[] = []

export function registerReset(fn: ResetFn): void {
  _resetRegistry.push(fn)
}

export function triggerGlobalReset(): void {
  _resetRegistry.forEach(fn => fn())
}

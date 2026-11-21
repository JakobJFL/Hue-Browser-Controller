export interface KeyedDebounce {
  schedule: (key: string, fn: () => void | Promise<void>) => void
  clearAll: () => void
}

/**
 * Keyed debounce helper so dragging sliders on separate lights/rooms
 * coalesces rapid updates per resource key without dropping updates on other keys.
 */
export function createKeyedDebounce(delayMs = 250): KeyedDebounce {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function schedule(key: string, fn: () => void | Promise<void>): void {
    const existing = timers.get(key)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(() => {
      timers.delete(key)
      void fn()
    }, delayMs)

    timers.set(key, timer)
  }

  function clearAll(): void {
    for (const timer of timers.values()) {
      clearTimeout(timer)
    }
    timers.clear()
  }

  return { schedule, clearAll }
}

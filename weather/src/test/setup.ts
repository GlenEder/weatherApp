import '@testing-library/jest-dom'

// Polyfill localStorage for jsdom opaque origins (SecurityError)
// JSDOM throws SecurityError for about:blank origins; this replaces it
// unconditionally with a working in-memory store.
const store: Record<string, string> = {}
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = String(value) },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { for (const k in store) delete store[k] },
  get length() { return Object.keys(store).length },
  key: (index: number) => Object.keys(store)[index] ?? null,
} as Storage

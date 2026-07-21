import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ColorModeProvider, useColorMode } from './ColorModeContext'

beforeEach(() => {
  localStorage.clear()
  document.body.classList.remove('dark')
})

afterEach(() => {
  localStorage.clear()
  document.body.classList.remove('dark')
})

describe('useColorMode', () => {
  it('defaults to light mode', () => {
    const { result } = renderHook(() => useColorMode(), {
      wrapper: ({ children }) => <ColorModeProvider>{children}</ColorModeProvider>,
    })

    expect(result.current.mode).toBe('light')
  })

  it('toggles mode', async () => {
    const { result } = renderHook(() => useColorMode(), {
      wrapper: ({ children }) => <ColorModeProvider>{children}</ColorModeProvider>,
    })

    act(() => {
      result.current.toggleColorMode()
    })

    await waitFor(() => {
      expect(result.current.mode).toBe('dark')
    })

    act(() => {
      result.current.toggleColorMode()
    })

    await waitFor(() => {
      expect(result.current.mode).toBe('light')
    })
  })

  it('reads stored dark mode from localStorage', () => {
    localStorage.setItem('mui-mode', 'dark')

    const { result } = renderHook(() => useColorMode(), {
      wrapper: ({ children }) => <ColorModeProvider>{children}</ColorModeProvider>,
    })

    expect(result.current.mode).toBe('dark')
  })

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useColorMode())
    }).toThrow('useColorMode must be used within a ColorModeProvider')
  })
})

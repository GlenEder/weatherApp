import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'
import { ColorModeProvider } from '../ColorModeContext'

function createMatchMedia(matchesDark = false) {
  return ((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? matchesDark : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia
}

beforeEach(() => {
  localStorage.clear()
  document.body.classList.remove('dark')
  vi.unstubAllGlobals()
  vi.stubGlobal('matchMedia', createMatchMedia(false))
})

describe('ThemeToggle', () => {
  it('renders a toggle button', () => {
    render(
      <ColorModeProvider>
        <ThemeToggle />
      </ColorModeProvider>,
    )
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('toggles from light to dark on click', async () => {
    const user = userEvent.setup()
    render(
      <ColorModeProvider>
        <ThemeToggle />
      </ColorModeProvider>,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
    expect(document.body.classList.contains('dark')).toBe(false)

    await user.click(button)

    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
    expect(document.body.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('mui-mode')).toBe('dark')
  })

  it('toggles from dark to light on second click', async () => {
    const user = userEvent.setup()
    localStorage.setItem('mui-mode', 'dark')
    document.body.classList.add('dark')

    render(
      <ColorModeProvider>
        <ThemeToggle />
      </ColorModeProvider>,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')

    await user.click(button)

    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
    expect(document.body.classList.contains('dark')).toBe(false)
  })

  it('uses system preference dark mode when no stored preference', () => {
    localStorage.removeItem('mui-mode')
    vi.stubGlobal('matchMedia', createMatchMedia(true))

    render(
      <ColorModeProvider>
        <ThemeToggle />
      </ColorModeProvider>,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
    expect(document.body.classList.contains('dark')).toBe(true)
  })

  it('persists mode to localStorage after toggle', async () => {
    const user = userEvent.setup()
    render(
      <ColorModeProvider>
        <ThemeToggle />
      </ColorModeProvider>,
    )

    const button = screen.getByRole('button')
    await user.click(button)

    expect(localStorage.getItem('mui-mode')).toBe('dark')

    await user.click(button)

    expect(localStorage.getItem('mui-mode')).toBe('light')
  })

  it('has correct aria-label in light mode', () => {
    render(
      <ColorModeProvider>
        <ThemeToggle />
      </ColorModeProvider>,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  })

  it('has correct aria-label in dark mode', () => {
    localStorage.setItem('mui-mode', 'dark')
    document.body.classList.add('dark')

    render(
      <ColorModeProvider>
        <ThemeToggle />
      </ColorModeProvider>,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
  })
})

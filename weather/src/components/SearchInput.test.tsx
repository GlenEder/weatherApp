import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from './SearchInput'
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

function renderSearchInput(props: Record<string, unknown> = {}) {
  return render(
    <ColorModeProvider>
      <SearchInput {...props} />
    </ColorModeProvider>,
  )
}

describe('SearchInput', () => {
  it('renders a text input with placeholder', () => {
    renderSearchInput({ placeholder: 'Search for a city...' })
    expect(screen.getByPlaceholderText('Search for a city...')).toBeInTheDocument()
  })

  it('renders a search submit button', () => {
    renderSearchInput()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('shows label by default', () => {
    renderSearchInput()
    expect(screen.getByText('Submit your search')).toBeInTheDocument()
  })

  it('hides label when showLabel is false', () => {
    renderSearchInput({ showLabel: false })
    expect(screen.queryByText('Submit your search')).not.toBeInTheDocument()
  })

  it('calls onChange when user types', () => {
    const onChange = vi.fn()
    renderSearchInput({ value: '', onChange })
    const input = screen.getByPlaceholderText('Search')
    fireEvent.change(input, { target: { value: 'Lon' } })
    expect(onChange).toHaveBeenCalledWith('Lon')
  })

  it('calls onSubmit with input value on Enter', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderSearchInput({ value: 'London', onChange: vi.fn(), onSubmit })
    // Type Enter into the input to submit the form
    const input = screen.getByPlaceholderText('Search')
    await user.click(input)
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('London')
  })

  it('calls onFocus when input gains focus', async () => {
    const user = userEvent.setup()
    const onFocus = vi.fn()
    renderSearchInput({ onFocus })
    const input = screen.getByPlaceholderText('Search')
    await user.click(input)
    expect(onFocus).toHaveBeenCalledOnce()
  })

  it('renders readOnly input attribute', () => {
    renderSearchInput({ readOnly: true })
    const input = screen.getByPlaceholderText('Search')
    expect(input).toHaveAttribute('readonly')
  })

  it('uses default placeholder when not provided', () => {
    renderSearchInput()
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
  })

  it('triggers onFocus on readOnly input click', async () => {
    const user = userEvent.setup()
    const onFocus = vi.fn()
    renderSearchInput({ readOnly: true, onFocus })
    const input = screen.getByPlaceholderText('Search')
    await user.click(input)
    expect(onFocus).toHaveBeenCalledOnce()
  })
})

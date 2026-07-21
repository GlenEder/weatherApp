import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverlaySearchBar } from '../components/OverlaySearchBar'
import { ColorModeProvider } from '../ColorModeContext'
import type { Location } from '../types'

const mockLocations: Location[] = [
  {
    id: 1,
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    country_code: 'GB',
    country: 'United Kingdom',
    admin1: 'England',
  },
  {
    id: 2,
    name: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    country_code: 'FR',
    country: 'France',
    admin1: 'Île-de-France',
  },
]

// Mock the API module
vi.mock('../api', () => ({
  searchLocations: vi.fn(),
  ApiError: class ApiError extends Error {
    status?: number
    constructor(message: string, status?: number) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  },
}))

const { searchLocations } = await import('../api')
const mockSearchLocations = vi.mocked(searchLocations)

function renderWithProvider(ui: React.ReactElement) {
  return render(<ColorModeProvider>{ui}</ColorModeProvider>)
}

describe('OverlaySearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when open is false', () => {
    const { container } = renderWithProvider(
      <OverlaySearchBar open={false} onClose={vi.fn()} onSelect={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders backdrop and search input when open is true', () => {
    renderWithProvider(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search for a city...')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    renderWithProvider(<OverlaySearchBar open={true} onClose={onClose} onSelect={vi.fn()} />)
    // The backdrop is the outermost Box with inset: 0
    const backdrop = screen.getByTestId('search-backdrop')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    renderWithProvider(<OverlaySearchBar open={true} onClose={onClose} onSelect={vi.fn()} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows loading indicator while searching', async () => {
    // Return a promise that never resolves during the test
    mockSearchLocations.mockImplementationOnce(() => new Promise(() => {}))
    renderWithProvider(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  it('shows results dropdown after successful search', async () => {
    mockSearchLocations.mockResolvedValueOnce(mockLocations)
    renderWithProvider(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    })
    expect(screen.getByText('Paris')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    mockSearchLocations.mockResolvedValueOnce([])
    renderWithProvider(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Xyzabc')
    await waitFor(() => {
      expect(screen.getByText(/No matches found/)).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    mockSearchLocations.mockRejectedValueOnce(new Error('Network error'))
    renderWithProvider(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
    })
  })

  it('calls onSelect and onClose when a location is clicked', async () => {
    mockSearchLocations.mockResolvedValueOnce(mockLocations)
    const onSelect = vi.fn()
    const onClose = vi.fn()
    renderWithProvider(<OverlaySearchBar open={true} onClose={onClose} onSelect={onSelect} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('London'))
    expect(onSelect).toHaveBeenCalledWith(mockLocations[0])
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('auto-highlights first result when results appear', async () => {
    mockSearchLocations.mockResolvedValueOnce(mockLocations)
    renderWithProvider(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    })
    // First result is automatically highlighted (effect runs after render)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /London/ })).toHaveClass('Mui-selected')
    })
    expect(screen.getByRole('button', { name: /Paris/ })).not.toHaveClass('Mui-selected')
  })

  it('ArrowDown wraps from last to first', async () => {
    mockSearchLocations.mockResolvedValueOnce(mockLocations)
    renderWithProvider(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByText('Paris')).toBeInTheDocument()
    })
    // With auto-highlight on index 0, ArrowDown once moves to index 1 (Paris)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Paris/ })).toHaveClass('Mui-selected')
    })
    // ArrowDown again wraps from last (1) back to first (0)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /London/ })).toHaveClass('Mui-selected')
    })
  })

  it('ArrowUp wraps from first to last', async () => {
    mockSearchLocations.mockResolvedValueOnce(mockLocations)
    renderWithProvider(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    })
    // Auto-highlighted at first, ArrowUp wraps to last
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Paris/ })).toHaveClass('Mui-selected')
    })
  })

  it('Enter selects the highlighted result', async () => {
    mockSearchLocations.mockResolvedValueOnce(mockLocations)
    const onSelect = vi.fn()
    const onClose = vi.fn()
    renderWithProvider(<OverlaySearchBar open={true} onClose={onClose} onSelect={onSelect} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    })
    // Wait for auto-highlight effect to apply before selecting
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /London/ })).toHaveClass('Mui-selected')
    })
    // Press Enter to select the auto-highlighted first result
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith(mockLocations[0])
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('auto-highlights first result when new search results arrive', async () => {
    mockSearchLocations.mockResolvedValueOnce(mockLocations)
    renderWithProvider(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    // First search — first result should be auto-highlighted
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /London/ })).toHaveClass('Mui-selected')
    })

    // Change search term — new first result should be auto-highlighted
    const newMock: Location[] = [
      { id: 3, name: 'Berlin', latitude: 52.52, longitude: 13.41, country_code: 'DE', country: 'Germany', admin1: 'Berlin' },
    ]
    mockSearchLocations.mockResolvedValueOnce(newMock)
    await userEvent.clear(input)
    await userEvent.type(input, 'Ber')
    await waitFor(() => {
      expect(screen.getByText('Berlin')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Berlin/ })).toHaveClass('Mui-selected')
    })
  })
})

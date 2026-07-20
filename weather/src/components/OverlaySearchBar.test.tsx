import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverlaySearchBar } from '../components/OverlaySearchBar'
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

describe('OverlaySearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when open is false', () => {
    const { container } = render(
      <OverlaySearchBar open={false} onClose={vi.fn()} onSelect={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders backdrop and search input when open is true', () => {
    render(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search for a city...')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<OverlaySearchBar open={true} onClose={onClose} onSelect={vi.fn()} />)
    // The backdrop is the outermost Box with inset: 0
    const backdrop = screen.getByTestId('search-backdrop')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<OverlaySearchBar open={true} onClose={onClose} onSelect={vi.fn()} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows loading indicator while searching', async () => {
    // Return a promise that never resolves during the test
    mockSearchLocations.mockImplementationOnce(() => new Promise(() => {}))
    render(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  it('shows results dropdown after successful search', async () => {
    mockSearchLocations.mockResolvedValueOnce(mockLocations)
    render(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    })
    expect(screen.getByText('Paris')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    mockSearchLocations.mockResolvedValueOnce([])
    render(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Xyzabc')
    await waitFor(() => {
      expect(screen.getByText(/No matches found/)).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    mockSearchLocations.mockRejectedValueOnce(new Error('Network error'))
    render(<OverlaySearchBar open={true} onClose={vi.fn()} onSelect={vi.fn()} />)
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
    render(<OverlaySearchBar open={true} onClose={onClose} onSelect={onSelect} />)
    const input = screen.getByPlaceholderText('Search for a city...')
    await userEvent.type(input, 'Lon')
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('London'))
    expect(onSelect).toHaveBeenCalledWith(mockLocations[0])
    expect(onClose).toHaveBeenCalledOnce()
  })
})

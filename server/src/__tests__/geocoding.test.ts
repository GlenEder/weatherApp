import { searchLocations } from '../services/geocoding'
import { config } from '../config'

const mockFetch = jest.fn()

beforeAll(() => {
  jest.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)
})

afterEach(() => {
  mockFetch.mockReset()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('searchLocations', () => {
  it('returns locations on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            name: 'Springfield',
            latitude: 39.8,
            longitude: -89.65,
            country: 'United States',
            admin1: 'Illinois',
            country_code: 'US',
            feature_code: 'PPLA',
            timezone: 'America/Chicago',
            population: 114394,
          },
        ],
        generationtime_ms: 0.5,
      }),
    })

    const result = await searchLocations({ q: 'Springfield' })
    expect(result.locations).toHaveLength(1)
    expect(result.locations[0].name).toBe('Springfield')
    expect(result.locations[0].latitude).toBe(39.8)
    expect(result.locations[0].longitude).toBe(-89.65)
    expect(result.locations[0].country).toBe('United States')
    expect(result.locations[0].admin1).toBe('Illinois')
  })

  it('returns empty locations array when no results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: undefined }),
    })

    const result = await searchLocations({ q: 'Nowhereville' })
    expect(result.locations).toEqual([])
  })

  it('throws ApiError(400) on empty query', async () => {
    await expect(searchLocations({ q: '' })).rejects.toThrow('Missing or empty search term')
    await expect(searchLocations({ q: '   ' })).rejects.toThrow('Missing or empty search term')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws ApiError(400) on too-long query', async () => {
    await expect(searchLocations({ q: 'a'.repeat(201) })).rejects.toThrow('too long')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws ApiError(502) on upstream HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    await expect(searchLocations({ q: 'Test' })).rejects.toThrow('HTTP 500')
  })

  it('throws ApiError(502) on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

    await expect(searchLocations({ q: 'Test' })).rejects.toThrow('Network error')
  })

  it('throws ApiError(502) on invalid JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('parse error')
      },
    })

    await expect(searchLocations({ q: 'Test' })).rejects.toThrow('Invalid JSON')
  })

  it('builds the correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    })

    await searchLocations({ q: 'San José' })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain(encodeURIComponent('San José'))
    expect(calledUrl).toContain('count=10')
    expect(calledUrl).toContain('language=en')
  })
})

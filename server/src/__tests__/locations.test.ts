import request from 'supertest'
import app from '../index'

jest.mock('../services/geocoding', () => ({
  searchLocations: jest.fn(),
}))

import { searchLocations } from '../services/geocoding'

const mockSearchLocations = searchLocations as jest.Mock

describe('GET /locations', () => {
  afterEach(() => {
    mockSearchLocations.mockReset()
  })

  it('returns 200 with locations on success', async () => {
    mockSearchLocations.mockResolvedValueOnce({
      locations: [{ id: 1, name: 'Springfield', latitude: 39.8, longitude: -89.65, country: 'United States' }],
    })

    const res = await request(app).get('/locations?q=Springfield')
    expect(res.status).toBe(200)
    expect(res.body.locations).toHaveLength(1)
    expect(res.body.locations[0].name).toBe('Springfield')
  })

  it('returns 200 with empty locations when no matches', async () => {
    mockSearchLocations.mockResolvedValueOnce({ locations: [] })

    const res = await request(app).get('/locations?q=Nowhere')
    expect(res.status).toBe(200)
    expect(res.body.locations).toEqual([])
  })

  it('returns 400 when q is missing', async () => {
    const res = await request(app).get('/locations')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when q is empty', async () => {
    const res = await request(app).get('/locations?q=')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 502 when service throws ApiError', async () => {
    const { ApiError } = await import('../errors')
    mockSearchLocations.mockRejectedValueOnce(new ApiError(502, 'Upstream error'))

    const res = await request(app).get('/locations?q=Test')
    expect(res.status).toBe(502)
    expect(res.body.error).toBe('Upstream error')
  })
})

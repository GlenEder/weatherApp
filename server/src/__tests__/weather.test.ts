import request from 'supertest'
import app from '../index'

jest.mock('../services/forecast', () => ({
  getCurrentWeather: jest.fn(),
}))

import { getCurrentWeather } from '../services/forecast'

const mockGetCurrentWeather = getCurrentWeather as jest.Mock

describe('GET /weather', () => {
  afterEach(() => {
    mockGetCurrentWeather.mockReset()
  })

  const sampleWeather = {
    latitude: 39.8,
    longitude: -89.65,
    timezone: 'America/Chicago',
    elevation: 182,
    observedAt: '2026-07-20T18:15',
    temperature: 85.3,
    apparentTemperature: 89.7,
    humidity: 63,
    precipitation: 0,
    weatherCode: 0,
    cloudCover: 0,
    surfacePressure: 1013.2,
    windSpeed: 10.0,
    windDirection: 192,
    windGusts: 15.7,
    units: {
      temperature: '°F',
      windSpeed: 'mp/h',
      precipitation: 'inch',
      humidity: '%',
      pressure: 'hPa',
    },
  }

  it('returns 200 with weather on valid coords', async () => {
    mockGetCurrentWeather.mockResolvedValueOnce(sampleWeather)

    const res = await request(app).get('/weather?lat=39.8&lon=-89.65')
    expect(res.status).toBe(200)
    expect(res.body.temperature).toBe(85.3)
    expect(res.body.units.temperature).toBe('°F')
  })

  it('returns 200 with metric units when specified', async () => {
    mockGetCurrentWeather.mockResolvedValueOnce({
      ...sampleWeather,
      units: { ...sampleWeather.units, temperature: '°C' },
    })

    const res = await request(app).get('/weather?lat=39.8&lon=-89.65&units=metric')
    expect(res.status).toBe(200)
    expect(res.body.units.temperature).toBe('°C')
  })

  it('returns 400 when lat is missing', async () => {
    const res = await request(app).get('/weather?lon=-89.65')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when lon is missing', async () => {
    const res = await request(app).get('/weather?lat=39.8')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 on out-of-range lat', async () => {
    const res = await request(app).get('/weather?lat=100&lon=0')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 on out-of-range lon', async () => {
    const res = await request(app).get('/weather?lat=0&lon=200')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 on invalid units', async () => {
    const res = await request(app).get('/weather?lat=0&lon=0&units=kelvin')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 502 when service throws ApiError', async () => {
    const { ApiError } = await import('../errors')
    mockGetCurrentWeather.mockRejectedValueOnce(new ApiError(502, 'Upstream forecast error'))

    const res = await request(app).get('/weather?lat=0&lon=0')
    expect(res.status).toBe(502)
    expect(res.body.error).toBe('Upstream forecast error')
  })
})

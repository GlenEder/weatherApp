import { Router } from 'express'
import { z } from 'zod'
import { getCurrentWeather } from '../services/forecast'
import type { WeatherQuery } from '../types'

const router = Router()

const querySchema = z.object({
  lat: z
    .string()
    .transform((v) => parseFloat(v))
    .pipe(z.number().min(-90).max(90)),
  lon: z
    .string()
    .transform((v) => parseFloat(v))
    .pipe(z.number().min(-180).max(180)),
  units: z.enum(['imperial', 'metric']).optional().default('imperial'),
})

router.get('/', async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.query)
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      res.status(400).json({ error: first.message })
      return
    }

    const query: WeatherQuery = {
      lat: parsed.data.lat,
      lon: parsed.data.lon,
      units: parsed.data.units,
    }
    const result = await getCurrentWeather(query)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router

import { Router } from 'express'
import { z } from 'zod'
import { searchLocations } from '../services/geocoding'
import type { LocationsQuery } from '../types'

const router = Router()

const querySchema = z.object({
  q: z.string().min(1, 'Search term is required').max(200, 'Search term too long'),
})

router.get('/', async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.query)
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      res.status(400).json({ error: first.message })
      return
    }

    const query: LocationsQuery = { q: parsed.data.q }
    const result = await searchLocations(query)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router

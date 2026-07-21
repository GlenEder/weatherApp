import path from 'node:path'
import express from 'express'
import { config } from './config'
import { errorHandler, notFound } from './errors'
import locationsRouter from './routes/locations'
import weatherRouter from './routes/weather'

const app = express()

app.disable('x-powered-by')

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/locations', locationsRouter)
app.use('/weather', weatherRouter)

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(process.cwd(), '..', 'weather', 'dist')
  app.use(express.static(frontendDist))
  // SPA fallback — any non-API GET returns index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  app.listen(config.port, () => {
    console.log(`Weather server listening on http://localhost:${config.port}`)
  })
}

export default app

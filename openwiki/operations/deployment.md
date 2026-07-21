# Operations & Deployment

---

## Development Workflow

### Root-Level Scripts (`/package.json`)

The root `package.json` uses `concurrently` to orchestrate server and client:

| Script | Command | Effect |
|---|---|---|
| `npm run dev` | `concurrently "cd server && npm run dev" "cd weather && npm run dev"` | Starts both server (port 3001) and client (port 5173) |
| `npm run build` | `cd server && npm run build && cd ../weather && npm run build` | Compiles both packages |
| `npm test` | `cd server && npm test && cd ../weather && npm test` | Runs both test suites sequentially |

### Per-Package Scripts

**Server (`server/`):**

| Script | Command | Notes |
|---|---|---|
| `dev` | `tsx watch src/index.ts` | Auto-restart on file changes |
| `build` | `tsc` | Compiles to `server/dist/` |
| `start` | `node dist/index.js` | Must be built first |
| `typecheck` | `tsc --noEmit` | No output files |
| `test` | `jest --passWithNoTests` | Jest test suite |

**Client (`weather/`):**

| Script | Command | Notes |
|---|---|---|
| `dev` | `vite` | HMR dev server on port 5173 |
| `build` | `tsc -b && vite build` | Type-check + production build to `weather/dist/` |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | ESLint check |
| `test` | `vitest run` | Single run |
| `test:watch` | `vitest` | Watch mode |

---

## Production Build

### Build Process

The production build has two steps:

1. **Server**: `tsc` compiles TypeScript to `server/dist/`
2. **Client**: `tsc -b` type-checks, then `vite build` produces `weather/dist/`

The root `npm run build` runs both in sequence.

### Production Server Behavior

When `NODE_ENV === 'production'`, the Express server (`server/src/index.ts`):
1. **Serves static files** from `../weather/dist` (relative to the server process working directory). This means the server process should run from the `server/` directory.
2. **SPA fallback**: Any unmatched `GET *` route returns `weather/dist/index.html` for client-side routing.

**No Vite proxy is needed** — the frontend makes requests to `/locations` and `/weather` relative to the same origin.

### Running in Production

```bash
# 1. Build both packages from root
npm run build

# 2. Start the server from server/
cd server
NODE_ENV=production npm start

# The app is now available on http://localhost:3001
```

---

## Environment Variables

### Server

| Variable | Default | Required | Notes |
|---|---|---|---|
| `PORT` | `3001` | No | HTTP listen port |
| `NODE_ENV` | (none) | No | Set to `production` to serve static frontend |
| `GEOCODING_BASE_URL` | `https://geocoding-api.open-meteo.com/v1` | No | Override for testing or mirror |
| `FORECAST_BASE_URL` | `https://api.open-meteo.com/v1` | No | Override for testing or mirror |
| `DEFAULT_UNITS` | `imperial` | No | `imperial` or `metric` |
| `REQUEST_TIMEOUT_MS` | `5000` | No | Upstream API timeout in milliseconds |

### Client (Vite)

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE` | (empty) | If set, overrides the API base URL. Leave empty in dev to use the Vite proxy. Set to the server URL (e.g., `http://localhost:3001`) when running the client standalone. |

---

## Deployment Considerations

### What the App Needs to Run
- **Node.js >= 20** (for native `fetch` support)
- **Network access** to `api.open-meteo.com` and `geocoding-api.open-meteo.com`
- **No database** required
- **No API keys** required

### Port Configuration
Default port is 3001. Override with `PORT` env var. For production behind a reverse proxy (nginx, Caddy), set the proxy to forward `/locations`, `/weather`, and `/health` to the Express server.

### Reverse Proxy / Load Balancer
No special configuration is needed. The server is a standard Express app. If using a reverse proxy:
- Forward requests to `localhost:3001`
- The server does not handle HTTPS (terminate TLS at the proxy)
- The server does not emit `X-Forwarded-*` headers (not needed for current features)

### Monitoring
- `GET /health` returns `{ status: "ok" }` — suitable for health checks
- Unhandled errors are logged via `console.error`; there is no structured logging library
- There is no request logging by default (an attempt was added and reverted — see git commit `0580c3d` → `eb39c33`)

---

## CI/CD Considerations

- **Tests** run with `npm test` (Jest for server, Vitest for client). Both are self-contained with no external network dependencies.
- **Build** runs with `npm run build`. TypeScript errors fail the build.
- **Test environment**: Server tests skip `app.listen()` when `NODE_ENV === 'test'` or `JEST_WORKER_ID` is set. No special CI configuration is needed.
- **Static analysis**: The client project has an ESLint configuration (`weather/eslint.config.js`) with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`.

---

## Testing Commands

```bash
# Run everything
npm test

# Run server tests only
cd server && npm test

# Run client tests only (single run)
cd weather && npm test

# Run client tests in watch mode
cd weather && npm run test:watch
```

### Test Structure

**Server (Jest, 4 files, ~30 tests):**
- Service-level tests mock `globalThis.fetch` directly
- Route-level tests mock the entire service module via `jest.mock` and use `supertest`
- All tests pass without network or database

**Client (Vitest, 6 files, ~14+ tests):**
- Component tests co-located with components
- Context tests for `ColorModeContext`
- Integration test (`App.test.tsx`) mocks all components and API
- `jsdom` environment with `localStorage` polyfill
- All tests pass without network

---

## CI Configuration (New Projects)

If adding this app to CI, the configuration should:

1. `actions/setup-node@v4` with Node 20+
2. `npm ci` (or `npm install`) from root (installs server, client, and root dev deps)
3. `npm test` (runs server + client test suites)
4. `npm run build` (produces static assets + compiled server)

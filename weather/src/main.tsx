import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { lightTheme, darkTheme } from './theme'
import { ColorModeProvider, useColorMode } from './ColorModeContext'
import App from './App.tsx'

// Fix default marker icon paths broken by bundlers (per .maki/skills/leaflet)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ThemedApp() {
  const { mode } = useColorMode()
  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeProvider>
      <ThemedApp />
    </ColorModeProvider>
  </StrictMode>,
)

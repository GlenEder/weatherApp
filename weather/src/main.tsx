/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import { lightTheme, darkTheme } from './theme'
import { ColorModeProvider, useColorMode } from './ColorModeContext'
import App from './App.tsx'

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

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

// Fade out the static loading screen after React renders
const loadingScreen = document.getElementById('loading-screen')
createRoot(rootEl).render(
  <StrictMode>
    <ColorModeProvider>
      <ThemedApp />
    </ColorModeProvider>
  </StrictMode>,
)
if (loadingScreen) {
  requestAnimationFrame(() => {
    loadingScreen.classList.add('hidden')
    let removed = false
    const cleanup = () => {
      if (removed) return
      removed = true
      loadingScreen.remove()
    }
    loadingScreen.addEventListener('transitionend', cleanup)
    setTimeout(cleanup, 1000)
  })
}

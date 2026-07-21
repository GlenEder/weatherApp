import { Component, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ position: 'fixed', bottom: 24, left: 24, right: 24, zIndex: 2000 }}>
          <Alert severity="error" variant="filled">
            Something went wrong. Please refresh the page.
          </Alert>
        </Box>
      )
    }
    return this.props.children
  }
}

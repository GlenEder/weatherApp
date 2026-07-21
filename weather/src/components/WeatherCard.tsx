import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import type { Location, CurrentWeather } from '../types'

interface WeatherCardProps {
  location: Location
  weather: CurrentWeather
  onClose: () => void
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
}

function weatherDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? `Weather code ${code}`
}

function formatTemp(value: number, unit: string): string {
  return `${Math.round(value)}°${unit === '°F' ? 'F' : 'C'}`
}

export function WeatherCard({ location, weather, onClose }: WeatherCardProps) {
  return (
    <Card
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 1100,
        minWidth: 260,
        maxWidth: 380,
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ position: 'relative', pb: '16px !important' }}>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ position: 'absolute', top: 4, right: 4 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Typography variant="subtitle1" color="text.secondary" sx={{ pr: 3, fontWeight: 500 }}>
          {location.name}
          {location.admin1 ? `, ${location.admin1}` : ''}
        </Typography>

        <Typography variant="h2" component="div" sx={{ fontWeight: 300, lineHeight: 1.1, mt: 0.5 }}>
          {formatTemp(weather.temperature, weather.units.temperature)}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {weatherDescription(weather.weatherCode)}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Feels like {formatTemp(weather.apparentTemperature, weather.units.temperature)}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Humidity
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {weather.humidity}{weather.units.humidity}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Wind
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {Math.round(weather.windSpeed)} {weather.units.windSpeed}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Precip
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {weather.precipitation}{weather.units.precipitation}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

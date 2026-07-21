import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import type { Location, LocationWithWeather } from '../types'

interface SameNameCityCardsProps {
  cities: LocationWithWeather[]
  loading: boolean
  onSelect: (location: Location) => void
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

function buildLocationLabel(loc: Location): string {
  return [loc.admin1, loc.country].filter(Boolean).join(', ')
}

export function SameNameCityCards({
  cities,
  loading,
  onSelect,
}: SameNameCityCardsProps) {
  if (!loading && cities.length === 0) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 340,
        right: 24,
        zIndex: 1100,
        display: 'flex',
        gap: 1.5,
        overflowX: 'auto',
        pb: 0.5,
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'divider',
          borderRadius: 2,
        },
      }}
    >
      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              elevation={4}
              sx={{ minWidth: 160, maxWidth: 180, borderRadius: 2, flexShrink: 0 }}
            >
              <CardContent sx={{ pb: '16px !important', px: 1.5 }}>
                <Skeleton variant="text" width={80} />
                <Skeleton variant="text" width={60} height={28} sx={{ mt: 0.5 }} />
                <Skeleton variant="text" width={70} />
              </CardContent>
            </Card>
          ))
        : cities.map(({ location, weather }) => (
            <Card
              key={location.id}
              elevation={4}
              sx={{
                minWidth: 160,
                maxWidth: 180,
                borderRadius: 2,
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 6,
                },
              }}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(location)}
            >
              <CardContent sx={{ pb: '16px !important', px: 1.5, py: 1.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {location.name}
                  {buildLocationLabel(location) ? ` · ${buildLocationLabel(location)}` : ''}
                </Typography>

                <Typography
                  variant="h5"
                  component="div"
                  sx={{ fontWeight: 300, lineHeight: 1.2, mt: 0.5 }}
                >
                  {formatTemp(weather.temperature, weather.units.temperature)}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {weatherDescription(weather.weatherCode)}
                </Typography>
              </CardContent>
            </Card>
          ))}
    </Box>
  )
}

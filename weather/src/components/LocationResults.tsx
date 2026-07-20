import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Location } from '../types'

interface LocationResultsProps {
  locations: Location[]
  selectedId?: number | null
  onSelect: (location: Location) => void
}

function flagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const cc = countryCode.toUpperCase()
  const A = 0x1f1e6
  return (
    String.fromCodePoint(A + cc.charCodeAt(0) - 65) +
    String.fromCodePoint(A + cc.charCodeAt(1) - 65)
  )
}

function formatPopulation(pop?: number): string {
  if (!pop) return ''
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`
  if (pop >= 1_000) return `${Math.round(pop / 1_000)}K`
  return String(pop)
}

function buildSecondary(loc: Location): string {
  const region = [loc.admin1, loc.country].filter(Boolean).join(', ')
  const pop = formatPopulation(loc.population)
  const coords = `${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`
  return [region, pop ? `pop. ${pop}` : '', coords].filter(Boolean).join(' · ')
}

export function LocationResults({ locations, selectedId, onSelect }: LocationResultsProps) {
  return (
    <List disablePadding>
      {locations.map((loc) => (
        <ListItemButton
          key={loc.id}
          selected={loc.id === selectedId}
          onClick={() => onSelect(loc)}
        >
          <ListItemText
            primary={
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography component="span" aria-hidden>
                  {flagEmoji(loc.country_code)}
                </Typography>
                <Typography component="span" sx={{ fontWeight: 600 }}>
                  {loc.name}
                </Typography>
              </Box>
            }
            secondary={buildSecondary(loc)}
          />
        </ListItemButton>
      ))}
    </List>
  )
}

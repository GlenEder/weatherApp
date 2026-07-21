import { useRef, type FormEvent } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputBase from '@mui/material/InputBase'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

interface SearchInputProps {
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (query: string) => void
  placeholder?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  showLabel?: boolean
  style?: React.CSSProperties
  onFocus?: () => void
  readOnly?: boolean
}

const PillInput = styled(InputBase)(({ theme }) => ({
  width: '100%',
  height: '2.8rem',
  background: theme.palette.mode === 'dark'
    ? theme.palette.grey[900]
    : theme.palette.grey[100],
  borderRadius: '1.625rem',
  fontSize: '1rem',
  fontFamily: 'inherit',
  '& .MuiInputBase-input': {
    padding: '0 0.25rem 0 1.5rem',
    height: '2.8rem',
    boxSizing: 'border-box',
    '&::placeholder': {
      color: theme.palette.text.secondary,
      opacity: 1,
    },
  },
}))

const StyledLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.625rem',
  fontWeight: 400,
  textTransform: 'uppercase',
  letterSpacing: '1.3px',
  marginBottom: '1rem',
  color: theme.palette.mode === 'dark'
    ? theme.palette.grey[500]
    : theme.palette.text.secondary,
}))

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search',
  inputRef: externalRef,
  showLabel = true,
  style,
  onFocus,
  readOnly: isReadOnly,
}: SearchInputProps) {
  const internalRef = useRef<HTMLInputElement>(null)
  const inputElRef = externalRef ?? internalRef

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit?.(inputElRef.current?.value ?? '')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  const inputProps = value !== undefined
    ? { value, onChange: handleChange }
    : { defaultValue: '' }

  return (
    <Box style={style}>
      {showLabel && <StyledLabel variant="caption">Submit your search</StyledLabel>}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'center' }}>
        <PillInput
          id="searchQueryInput"
          name="searchQueryInput"
          placeholder={placeholder}
          inputRef={inputElRef}
          {...inputProps}
          readOnly={isReadOnly}
          onFocus={onFocus}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                id="searchQuerySubmit"
                type="submit"
                name="searchQuerySubmit"
                aria-label="Search"
                edge="end"
                sx={{ color: 'text.secondary' }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          }
        />
      </Box>
    </Box>
  )
}

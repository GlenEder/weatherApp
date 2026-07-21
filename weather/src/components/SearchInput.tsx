import { useRef, type FormEvent, type ChangeEvent } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import { useColorMode } from '../ColorModeContext'

interface SearchInputProps {
  value?: string
  onChange?: (value: string) => void
  onSearch?: (query: string) => void
  placeholder?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  showLabel?: boolean
  style?: React.CSSProperties
  onFocus?: () => void
  readOnly?: boolean
}

const styles = {
  wrapper: {
    width: '100%',
    maxWidth: '31.25rem',
    margin: '6rem auto',
  },
  label: {
    fontSize: '0.625rem',
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '1.3px',
    marginBottom: '1rem',
  },
  searchBar: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: '2.8rem',
    background: '#f5f5f5',
    outline: 'none',
    border: 'none',
    borderRadius: '1.625rem',
    padding: '0 3.5rem 0 1.5rem',
    fontSize: '1rem',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  button: {
    width: '3.5rem',
    height: '2.8rem',
    marginLeft: '-3.5rem',
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
} as const satisfies Record<string, React.CSSProperties>

const darkOverrides = {
  input: {
    background: '#2b2b2b',
    color: '#e0e0e0',
  },
  label: {
    color: '#999',
  },
  icon: {
    fill: '#999',
  },
} as const

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search',
  inputRef: externalRef,
  showLabel = true,
  style,
  onFocus,
  readOnly: isReadOnly,
}: SearchInputProps) {
  const { mode } = useColorMode()
  const isDark = mode === 'dark'
  const internalRef = useRef<HTMLInputElement>(null)
  const inputElRef = externalRef ?? internalRef

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (inputElRef.current) {
      onSearch?.(inputElRef.current.value)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  const inputProps = value !== undefined
    ? { value, onChange: handleChange }
    : { defaultValue: '' }

  return (
    <div style={{ ...styles.wrapper, ...style }}>
      {showLabel && <div style={{ ...styles.label, ...(isDark && darkOverrides.label) }}>Submit your search</div>}
      <form style={styles.searchBar} onSubmit={handleSubmit}>
        <input
          id="searchQueryInput"
          type="text"
          name="searchQueryInput"
          placeholder={placeholder}
          ref={inputElRef}
          {...inputProps}
          readOnly={isReadOnly}
          onFocus={onFocus}
          style={{ ...styles.input, ...(isDark && darkOverrides.input) }}
        />
        <button
          id="searchQuerySubmit"
          type="submit"
          name="searchQuerySubmit"
          style={styles.button}
        >
          <SearchIcon sx={{ color: isDark ? darkOverrides.icon.fill : '#666666', fontSize: 24 }} />
        </button>
      </form>
    </div>
  )
}

'use client'

import { Search } from 'lucide-react'
import styles from '../../styles/shared.module.css'

type FilterSearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function FilterSearchInput({
  value,
  onChange,
  placeholder = 'Search events...',
}: FilterSearchInputProps) {
  return (
    <div className={styles.filterSearch}>
      <Search size={16} className={styles.filterSearchIcon} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.filterSearchInput}
        aria-label="Search events"
      />
    </div>
  )
}

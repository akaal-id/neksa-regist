'use client'

import { formatFilterDate } from '../../lib/eventList'
import FilterSearchInput from '../FilterSearchInput/FilterSearchInput'
import styles from '../../styles/shared.module.css'

export type AdminStatusFilter = 'all' | 'draft' | 'upcoming' | 'past'

type AdminEventFilterProps = {
  dates: string[]
  statusFilter: AdminStatusFilter
  dateFilter: string
  searchTerm: string
  onStatusChange: (status: AdminStatusFilter) => void
  onDateChange: (date: string) => void
  onSearchChange: (value: string) => void
}

const STATUS_OPTIONS: { value: AdminStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

export default function AdminEventFilter({
  dates,
  statusFilter,
  dateFilter,
  searchTerm,
  onStatusChange,
  onDateChange,
  onSearchChange,
}: AdminEventFilterProps) {
  return (
    <div className={styles.filterBar}>
      <FilterSearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search by name, location, or slug..."
      />

      <div className={styles.filterChipTrack}>
        <div className={styles.dateFilterScroll}>
          <div className={styles.dateFilter}>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.filterBtn} ${
                  statusFilter === option.value && dateFilter === 'all'
                    ? styles.filterBtnActive
                    : statusFilter === option.value
                      ? styles.filterBtnActiveSoft
                      : ''
                }`}
                onClick={() => {
                  onStatusChange(option.value)
                  onDateChange('all')
                }}
              >
                {option.label}
              </button>
            ))}

            {dates.length > 0 && <span className={styles.filterDivider} aria-hidden />}

            {dates.length > 0 && (
              <button
                type="button"
                className={`${styles.filterBtn} ${dateFilter === 'all' ? styles.filterBtnActiveSoft : ''}`}
                onClick={() => onDateChange('all')}
              >
                All dates
              </button>
            )}

            {dates.map((date) => (
              <button
                key={date}
                type="button"
                className={`${styles.filterBtn} ${dateFilter === date ? styles.filterBtnActive : ''}`}
                onClick={() => onDateChange(date)}
              >
                {formatFilterDate(date)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

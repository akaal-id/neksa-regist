'use client'

import { DATE_FILTER_ALL, DATE_FILTER_PAST, formatFilterDate } from '../../lib/eventList'
import FilterSearchInput from '../FilterSearchInput/FilterSearchInput'
import styles from '../../styles/shared.module.css'

type EventDateFilterProps = {
  dates: string[]
  selectedDate: string
  searchTerm: string
  onDateChange: (date: string) => void
  onSearchChange: (value: string) => void
}

export default function EventDateFilter({
  dates,
  selectedDate,
  searchTerm,
  onDateChange,
  onSearchChange,
}: EventDateFilterProps) {
  return (
    <div className={styles.filterBar}>
      <FilterSearchInput value={searchTerm} onChange={onSearchChange} />

      <div className={styles.filterChipTrack}>
        <div className={styles.dateFilterScroll}>
          <div className={styles.dateFilter}>
            <button
              type="button"
              className={`${styles.filterBtn} ${selectedDate === DATE_FILTER_ALL ? styles.filterBtnActive : ''}`}
              onClick={() => onDateChange(DATE_FILTER_ALL)}
            >
              All
            </button>

            {dates.map((date) => (
              <button
                key={date}
                type="button"
                className={`${styles.filterBtn} ${selectedDate === date ? styles.filterBtnActive : ''}`}
                onClick={() => onDateChange(date)}
              >
                {formatFilterDate(date)}
              </button>
            ))}

            <span className={styles.filterDivider} aria-hidden />

            <button
              type="button"
              className={`${styles.filterBtn} ${selectedDate === DATE_FILTER_PAST ? styles.filterBtnActive : ''}`}
              onClick={() => onDateChange(DATE_FILTER_PAST)}
            >
              Past Events
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

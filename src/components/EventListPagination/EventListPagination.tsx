'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { scrollToTop } from '../../lib/eventList'
import styles from '../../styles/shared.module.css'

type EventListPaginationProps = {
  currentPage: number
  totalPages: number
  totalItems: number
  rangeStart: number
  rangeEnd: number
  onPageChange: (page: number) => void
}

export default function EventListPagination({
  currentPage,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  onPageChange,
}: EventListPaginationProps) {
  if (totalItems === 0) return null

  const handleChange = (page: number) => {
    onPageChange(page)
    scrollToTop()
  }

  return (
    <nav className={styles.listPagination} aria-label="Event list pagination">
      <span className={styles.pageInfo}>
        Showing <strong>{rangeStart}–{rangeEnd}</strong> of {totalItems}
      </span>

      <div className={styles.pageControls}>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => handleChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        <span className={styles.pageCurrent}>
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => handleChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  )
}

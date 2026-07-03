'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { brand } from '../lib/brand'
import {
  DATE_FILTER_ALL,
  DATE_FILTER_PAST,
  EVENTS_PER_PAGE,
  EventWithCount,
  fetchEventsWithCounts,
  filterEventsByDate,
  getEventSlug,
  getUniqueDates,
  paginate,
  searchEvents,
} from '../lib/eventList'
import EventCard from '../components/EventCard/EventCard'
import EventCardSkeleton from '../components/EventCard/EventCardSkeleton'
import EventDateFilter from '../components/EventDateFilter/EventDateFilter'
import EventListHeader from '../components/EventListHeader/EventListHeader'
import EventListPagination from '../components/EventListPagination/EventListPagination'
import EmptyState from '../components/EmptyState/EmptyState'
import styles from '../styles/shared.module.css'

export default function HomeContent() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<EventWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(DATE_FILTER_ALL)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function loadEvents() {
      const data = await fetchEventsWithCounts('asc')
      setEvents(data)
      setLoading(false)
    }
    loadEvents()
  }, [])

  useEffect(() => {
    if (searchParams.get('filter') === 'past') {
      setSelectedDate(DATE_FILTER_PAST)
    }
  }, [searchParams])

  const availableDates = useMemo(() => getUniqueDates(events), [events])

  const filteredEvents = useMemo(() => {
    const byDate = filterEventsByDate(events, selectedDate)
    return searchEvents(byDate, searchTerm)
  }, [events, selectedDate, searchTerm])

  const pagination = useMemo(
    () => paginate(filteredEvents, currentPage, EVENTS_PER_PAGE),
    [filteredEvents, currentPage]
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDate, searchTerm])

  const emptyMessage = () => {
    if (searchTerm.trim()) {
      return 'No events match your search. Try a different keyword or clear the search.'
    }
    if (selectedDate === DATE_FILTER_PAST) {
      return 'No past events found.'
    }
    if (selectedDate === DATE_FILTER_ALL) {
      return 'There are no upcoming events right now. Check past events or come back later.'
    }
    return 'No events match this date. Try another filter or view all.'
  }

  return (
    <main className={styles.page}>
      <section className={`${styles.hero} ${styles.heroCompact}`}>
        <p className={styles.heroEyebrow}>{brand.heroEyebrow}</p>
        <h1 className={styles.heroTitle}>{brand.tagline}</h1>
        <p className={styles.heroSubtitle}>{brand.description}</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          {!loading && events.length > 0 && (
            <EventListHeader count={filteredEvents.length}>
              <EventDateFilter
                dates={availableDates}
                selectedDate={selectedDate}
                searchTerm={searchTerm}
                onDateChange={setSelectedDate}
                onSearchChange={setSearchTerm}
              />
            </EventListHeader>
          )}

          {loading ? (
            <div className={styles.cardGrid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className={styles.cardGrid}>
                {pagination.items.length === 0 ? (
                  <EmptyState title="No events found" message={emptyMessage()} />
                ) : (
                  pagination.items.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="user"
                      href={`/event/${getEventSlug(event)}`}
                    />
                  ))
                )}
              </div>

              <EventListPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                rangeStart={pagination.rangeStart}
                rangeEnd={pagination.rangeEnd}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </section>
    </main>
  )
}

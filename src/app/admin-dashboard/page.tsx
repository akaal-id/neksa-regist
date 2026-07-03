'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LogOut } from 'lucide-react'
import Button from '../../components/Button/Button'
import EventFormModal from '../../components/EventFormModal/EventFormModal'
import EventCard from '../../components/EventCard/EventCard'
import EventCardSkeleton from '../../components/EventCard/EventCardSkeleton'
import EventListPagination from '../../components/EventListPagination/EventListPagination'
import EmptyState from '../../components/EmptyState/EmptyState'
import AdminEventFilter, { AdminStatusFilter } from '../../components/AdminEventFilter/AdminEventFilter'
import {
  EVENTS_PER_PAGE,
  EventWithCount,
  fetchEventsWithCounts,
  getUniqueDates,
  isPastEvent,
  paginate,
  searchEvents,
} from '../../lib/eventList'
import styles from '../../styles/shared.module.css'

export default function AdminDashboard() {
  const router = useRouter()
  const [events, setEvents] = useState<EventWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMode, setModalMode] = useState<'none' | 'create'>('none')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin')
    if (isAdmin !== 'true') {
      router.push('/admin')
    } else {
      fetchEvents()
    }
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    const data = await fetchEventsWithCounts('desc')
    setEvents(data)
    setLoading(false)
  }

  const statusFilteredEvents = useMemo(() => {
    if (statusFilter === 'upcoming') {
      return events.filter((event) => !isPastEvent(event.date))
    }
    if (statusFilter === 'past') {
      return events.filter((event) => isPastEvent(event.date))
    }
    return events
  }, [events, statusFilter])

  const availableDates = useMemo(
    () => getUniqueDates(statusFilteredEvents),
    [statusFilteredEvents]
  )

  const filteredEvents = useMemo(() => {
    let list = statusFilteredEvents
    if (dateFilter !== 'all') {
      list = list.filter((event) => event.date === dateFilter)
    }
    return searchEvents(list, searchTerm)
  }, [statusFilteredEvents, dateFilter, searchTerm])

  const pagination = useMemo(
    () => paginate(filteredEvents, currentPage, EVENTS_PER_PAGE),
    [filteredEvents, currentPage]
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, dateFilter, searchTerm])

  useEffect(() => {
    if (dateFilter !== 'all' && !availableDates.includes(dateFilter)) {
      setDateFilter('all')
    }
  }, [availableDates, dateFilter])

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    router.push('/admin')
  }

  const openCreate = () => {
    setModalMode('create')
  }

  const closeModal = () => {
    setModalMode('none')
  }

  const emptyMessage = () => {
    if (events.length === 0) {
      return 'Create your first event to start collecting RSVPs.'
    }
    if (searchTerm.trim()) {
      return 'No events match your search. Try a different keyword or clear the search.'
    }
    if (dateFilter !== 'all') {
      return 'No events match this date. Try another filter.'
    }
    if (statusFilter === 'upcoming') return 'No upcoming events found.'
    if (statusFilter === 'past') return 'No past events found.'
    return 'No events match the current filters.'
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminContent}>
        <div className={styles.adminHeader}>
          <div className={styles.adminHeaderMain}>
            <div className={styles.adminTitleRow}>
              <h1 className={styles.adminTitle}>Event Manager</h1>
              {!loading && (
                <span className={styles.sectionCount}>
                  {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
                </span>
              )}
            </div>
          </div>
          <div className={styles.adminActions}>
            <button onClick={handleLogout} className={styles.iconBtn} aria-label="Log out">
              <LogOut size={18} />
            </button>
            <Button onClick={openCreate} icon={Plus} className={styles.adminCreateBtn}>
              Create Event
            </Button>
          </div>
        </div>

        {!loading && events.length > 0 && (
          <div className={styles.adminFilters}>
            <AdminEventFilter
              dates={availableDates}
              statusFilter={statusFilter}
              dateFilter={dateFilter}
              searchTerm={searchTerm}
              onStatusChange={setStatusFilter}
              onDateChange={setDateFilter}
              onSearchChange={setSearchTerm}
            />
          </div>
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
                <EmptyState
                  title={events.length === 0 ? 'No events yet' : 'No matching events'}
                  message={emptyMessage()}
                  onAction={events.length === 0 ? openCreate : undefined}
                  actionLabel={events.length === 0 ? 'Create Event' : undefined}
                />
              ) : (
                pagination.items.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="admin"
                    onClick={() => router.push(`/admin-dashboard/event/${event.id}`)}
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

      {modalMode === 'create' && (
        <EventFormModal
          mode="create"
          event={null}
          onClose={closeModal}
          onSaved={fetchEvents}
        />
      )}
    </div>
  )
}

import { supabase } from './supabaseClient'
import { EventRecord } from './events'
import { stripHtml } from './richText'

export const EVENTS_PER_PAGE = 10
export const DATE_FILTER_ALL = 'all'
export const DATE_FILTER_PAST = 'past'

export type EventWithCount = EventRecord & {
  registration_count: number
}

export function isPastEvent(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(`${date}T00:00:00`)
  return eventDate < today
}

export function formatFilterDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getUniqueDates(events: EventRecord[]) {
  return [...new Set(events.map((event) => event.date))].sort()
}

export function filterEventsByDate<T extends EventRecord>(events: T[], selectedDate: string) {
  if (selectedDate === DATE_FILTER_PAST) {
    return events.filter((event) => isPastEvent(event.date))
  }
  if (selectedDate === DATE_FILTER_ALL) {
    return events.filter((event) => !isPastEvent(event.date))
  }
  return events.filter((event) => event.date === selectedDate)
}

export function getEventSlug(event: EventRecord) {
  return event.slug || event.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
}

export function isEventFull(event: EventRecord, registrationCount: number) {
  return event.capacity != null && registrationCount >= event.capacity
}

export function getSpotsLeft(event: EventRecord, registrationCount: number) {
  if (event.capacity == null) return null
  return Math.max(0, event.capacity - registrationCount)
}

export function paginate<T>(items: T[], page: number, perPage = EVENTS_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const start = (currentPage - 1) * perPage

  return {
    items: items.slice(start, start + perPage),
    totalPages,
    currentPage,
    totalItems: items.length,
    rangeStart: items.length === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + perPage, items.length),
  }
}

export async function fetchEventsWithCounts(order: 'asc' | 'desc' = 'asc'): Promise<EventWithCount[]> {
  const { data } = await supabase
    .from('events')
    .select('*, registrations(count)')
    .order('date', { ascending: order === 'asc' })

  if (!data) return []

  return data.map((event) => {
    const row = event as EventRecord & { registrations?: { count: number }[] }
    return {
      ...row,
      registration_count: row.registrations?.[0]?.count ?? 0,
    }
  })
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function searchEvents<T extends EventRecord>(events: T[], query: string): T[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return events

  return events.filter((event) => {
    const haystack = [
      event.name,
      stripHtml(event.description),
      event.address,
      event.slug,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(trimmed)
  })
}

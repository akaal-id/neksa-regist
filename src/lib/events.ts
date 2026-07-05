import { stripHtml } from './richText'

export type EventStatus = 'draft' | 'upcoming' | 'past'

export type EventRecord = {
  id: number
  name: string
  description: string | null
  date: string
  start_time: string | null
  end_time: string | null
  address: string | null
  slug: string | null
  image_url: string | null
  capacity: number | null
  status: EventStatus
  created_at: string
}

function isPastEventDate(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(`${date}T00:00:00`)
  return eventDate < today
}

export function hasPendingSpeakers(description?: string | null): boolean {
  const text = stripHtml(description).toLowerCase()
  if (!text) return true
  return (
    text.includes('pending final confirmation') ||
    text.includes('tbc (to be confirmed)')
  )
}

export function computeEventStatus(
  description: string | null | undefined,
  date: string,
  options?: { forceDraft?: boolean }
): EventStatus {
  if (options?.forceDraft) return 'draft'
  if (hasPendingSpeakers(description)) return 'draft'
  return isPastEventDate(date) ? 'past' : 'upcoming'
}

export type EventFormData = {
  name: string
  description: string
  date: string
  start_time: string
  end_time: string
  address: string
  slug: string
  image_url: string
  capacity: string
}

export const EMPTY_EVENT_FORM: EventFormData = {
  name: '',
  description: '',
  date: '',
  start_time: '',
  end_time: '',
  address: '',
  slug: '',
  image_url: '',
  capacity: '',
}

export const EVENT_IMAGE_BUCKET = 'event-images'

export function slugify(name: string) {
  return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
}

export function parseCapacity(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error('Capacity must be a positive whole number.')
  }
  return parsed
}

function toTimeInputValue(time?: string | null) {
  return time ? time.slice(0, 5) : ''
}

export function parseOptionalTime(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export function validateTimeRange(startTime: string | null, endTime: string | null) {
  if (endTime && !startTime) {
    throw new Error('Start time is required when end time is set.')
  }
  if (startTime && endTime && endTime <= startTime) {
    throw new Error('End time must be after start time.')
  }
}

export function eventToFormData(event: EventRecord): EventFormData {
  return {
    name: event.name ?? '',
    description: event.description ?? '',
    date: event.date ?? '',
    start_time: toTimeInputValue(event.start_time),
    end_time: toTimeInputValue(event.end_time),
    address: event.address ?? '',
    slug: event.slug ?? '',
    image_url: event.image_url ?? '',
    capacity: event.capacity != null ? String(event.capacity) : '',
  }
}

function formatClockTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const dt = new Date()
  dt.setHours(hours, minutes, 0, 0)
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatEventTimeRange(startTime?: string | null, endTime?: string | null) {
  if (!startTime) return null
  const start = formatClockTime(startTime)
  if (!endTime) return start
  return `${start} – ${formatClockTime(endTime)}`
}

export function formatEventDateTime(
  date: string,
  startTime?: string | null,
  endTime?: string | null
) {
  const dateStr = new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeRange = formatEventTimeRange(startTime, endTime)
  return timeRange ? `${dateStr} · ${timeRange}` : dateStr
}

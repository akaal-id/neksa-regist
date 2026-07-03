import { supabase } from './supabaseClient'

export type RegistrationRecord = {
  id: number
  event_id: number
  ticket_code: string | null
  full_name: string
  title: string | null
  email: string | null
  phone: string | null
  dob: string | null
  gender: string | null
  status: string
  created_at: string
}

export function formatRegistrationDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDob(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function displayValue(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed || '—'
}

/** e.g. event 3, registration 42 → "3-000042" */
export function buildTicketCode(eventId: number, registrationId: number): string {
  return `${eventId}-${String(registrationId).padStart(6, '0')}`
}

export function getTicketCode(
  reg: Pick<RegistrationRecord, 'id' | 'event_id'> & { ticket_code?: string | null }
): string {
  return reg.ticket_code || buildTicketCode(reg.event_id, reg.id)
}

export function formatTicketCodeDisplay(ticketCode: string): string {
  return `#${ticketCode}`
}

export type ParsedTicketScan =
  | { ticketCode: string; eventId: number; registrationId: number }
  | { registrationId: number }

export function parseScannedTicket(raw: string): ParsedTicketScan | null {
  const trimmed = raw.trim()
  const composite = trimmed.match(/^(\d+)-(\d+)$/)
  if (composite) {
    return {
      ticketCode: trimmed,
      eventId: Number(composite[1]),
      registrationId: Number(composite[2]),
    }
  }
  if (/^\d+$/.test(trimmed)) {
    return { registrationId: Number(trimmed) }
  }
  return null
}

export async function getRegistrationCount(eventId: number): Promise<number> {
  const { count, error } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  if (error) throw error
  return count ?? 0
}

export function isEventFull(capacity: number | null | undefined, registrationCount: number): boolean {
  if (capacity == null) return false
  return registrationCount >= capacity
}

export function spotsRemaining(capacity: number | null | undefined, registrationCount: number): number | null {
  if (capacity == null) return null
  return Math.max(0, capacity - registrationCount)
}

export function formatCapacityLabel(capacity: number | null | undefined, registrationCount: number): string | null {
  if (capacity == null) return null
  const remaining = spotsRemaining(capacity, registrationCount)!
  if (remaining === 0) return 'Registration full'
  return `${remaining} of ${capacity} spots left`
}

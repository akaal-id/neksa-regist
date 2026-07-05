'use client'

import Link from 'next/link'
import { Calendar, MapPin, ArrowRight, ChevronRight, Link as LinkIcon, Users } from 'lucide-react'
import { EventRecord, formatEventDateTime } from '../../lib/events'
import { EventWithCount, getEventStatus, getSpotsLeft, isEventFull } from '../../lib/eventList'
import styles from '../../styles/shared.module.css'

type EventCardProps = {
  event: EventRecord | EventWithCount
  variant?: 'user' | 'admin'
  href?: string
  onClick?: () => void
}

export default function EventCard({ event, variant = 'user', href, onClick }: EventCardProps) {
  const status = getEventStatus(event)
  const registrationCount = 'registration_count' in event ? event.registration_count : 0
  const full = isEventFull(event, registrationCount)
  const spotsLeft = getSpotsLeft(event, registrationCount)
  const fewSpotsLeft = spotsLeft != null && spotsLeft > 0 && spotsLeft <= 5

  const statusBadge = () => {
    if (variant === 'admin') {
      if (status === 'draft') {
        return <span className={`${styles.badge} ${styles.badgeDraft}`}>Draft</span>
      }
      return (
        <span className={`${styles.badge} ${status === 'upcoming' ? styles.badgeGold : styles.badgeMuted}`}>
          {status === 'upcoming' ? 'Upcoming' : 'Past'}
        </span>
      )
    }

    if (status === 'past') {
      return <span className={`${styles.badge} ${styles.badgeMuted}`}>Past Event</span>
    }

    if (full) {
      return <span className={`${styles.badge} ${styles.badgeFull}`}>Sold Out</span>
    }

    if (fewSpotsLeft) {
      return <span className={`${styles.badge} ${styles.badgeWarning}`}>{spotsLeft} spots left</span>
    }

    return <span className={`${styles.badge} ${styles.badgeGold}`}>Upcoming</span>
  }

  const hasImage = Boolean(event.image_url)

  const content = (
    <>
      {hasImage && (
        <div className={styles.cardMedia}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.image_url!} alt="" className={styles.cardImage} loading="lazy" />
        </div>
      )}

      <div className={styles.cardBody}>
        <div className={styles.cardBadges}>{statusBadge()}</div>

        <h2 className={styles.cardTitle}>{event.name}</h2>

        <div className={styles.cardMeta}>
          <div className={styles.metaRow}>
            <Calendar size={15} aria-hidden />
            <span>{formatEventDateTime(event.date, event.start_time, event.end_time)}</span>
          </div>
          {event.address && (
            <div className={styles.metaRow}>
              <MapPin size={15} aria-hidden />
              <span title={event.address}>{event.address}</span>
            </div>
          )}
          {event.capacity != null && variant === 'admin' && (
            <div className={styles.metaRow}>
              <Users size={14} aria-hidden />
              <span>
                {registrationCount} / {event.capacity} registered
                {full ? ' · Full' : ''}
              </span>
            </div>
          )}
          {variant === 'admin' && event.slug && (
            <div className={styles.metaRow}>
              <LinkIcon size={14} aria-hidden />
              <span>/event/{event.slug}</span>
            </div>
          )}
        </div>

        {variant === 'user' && (
          <span className={styles.cardLink}>
            {full && status === 'upcoming' ? 'View Details' : 'View Event'}
            <ArrowRight size={14} className={styles.cardLinkIcon} aria-hidden />
          </span>
        )}
      </div>

      {variant === 'admin' && <ChevronRight size={20} className={styles.cardChevron} aria-hidden />}
    </>
  )

  const cardClassName = hasImage ? styles.eventCard : `${styles.eventCard} ${styles.eventCardNoMedia}`

  if (href) {
    return (
      <Link href={href} className={cardClassName} aria-label={`View ${event.name}`}>
        {content}
      </Link>
    )
  }

  return (
    <div
      className={cardClassName}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter') onClick()
            }
          : undefined
      }
      aria-label={onClick ? `Manage ${event.name}` : undefined}
    >
      {content}
    </div>
  )
}

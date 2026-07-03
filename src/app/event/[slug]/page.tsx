'use client'
import { useEffect, useState, use } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { Calendar, ChevronLeft, Check, MapPin } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useRouter } from 'next/navigation'
import { formatEventDateTime, EventRecord } from '../../../lib/events'
import { getRegistrationCount, isEventFull, getTicketCode, formatTicketCodeDisplay } from '../../../lib/registrations'
import { createTicketPdf } from '../../../lib/ticketPdf'
import { getSpotsLeft, isPastEvent } from '../../../lib/eventList'
import Button from '../../../components/Button/Button'
import RichTextContent from '../../../components/RichTextContent/RichTextContent'
import { EditorialInput, EditorialSelect } from '../../../components/ui/editorial-form'
import formStyles from '../../../components/ui/EditorialForm.module.css'
import styles from '../../../styles/shared.module.css'
import btnStyles from '../../../components/Button/Button.module.css'

function getStatusBadge(event: EventRecord, registrationCount: number) {
  const past = isPastEvent(event.date)
  const full = isEventFull(event.capacity, registrationCount)
  const spotsLeft = getSpotsLeft(event, registrationCount)
  const fewSpots = spotsLeft != null && spotsLeft > 0 && spotsLeft <= 5 && !past

  if (past) {
    return { label: 'Past Event', className: styles.badgeMuted }
  }
  if (full) {
    return { label: 'Sold Out', className: styles.badgeFull }
  }
  if (fewSpots) {
    return { label: `${spotsLeft} spots left`, className: styles.badgeWarning }
  }
  return { label: 'Open for Registration', className: styles.badgeGold }
}

function EventDetailSkeleton() {
  return (
    <main className={styles.page}>
      <section className={styles.eventDetailSection}>
        <div className={`${styles.skeletonBlock} ${styles.eventDetailMedia}`} />
        <div className={styles.eventDetailPanel}>
          <div className={styles.eventDetailBody}>
            <div className={`${styles.skeletonBlock} ${styles.skeletonBadge}`} />
            <div className={`${styles.skeletonBlock} ${styles.eventDetailSkeletonTitle}`} />
            <div className={`${styles.skeletonBlock} ${styles.skeletonLine}`} />
            <div className={`${styles.skeletonBlock} ${styles.skeletonLineShort}`} />
            <div className={styles.eventDetailFacts}>
              <div className={`${styles.skeletonBlock} ${styles.eventDetailSkeletonFact}`} />
              <div className={`${styles.skeletonBlock} ${styles.eventDetailSkeletonFact}`} />
            </div>
          </div>
          <div className={styles.eventDetailActions}>
            <div className={`${styles.skeletonBlock} ${styles.eventDetailBack}`} style={{ width: 120, height: 36 }} />
          </div>
        </div>
      </section>
    </main>
  )
}

export default function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()

  const [event, setEvent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({ full_name: '', email: '', title: '', phone: '', dob: '', gender: '' })
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState<any>(null)

  const [registrationCount, setRegistrationCount] = useState(0)

  const registrationFull = event ? isEventFull(event.capacity, registrationCount) : false
  const isPast = event ? isPastEvent(event.date) : false
  const statusBadge = event ? getStatusBadge(event, registrationCount) : null

  useEffect(() => {
    async function loadEvent() {
      try {
        const slugOrId = resolvedParams.slug
        let eventData = null

        const { data: dataBySlug } = await supabase.from('events').select('*').eq('slug', slugOrId).single()

        if (dataBySlug) {
          eventData = dataBySlug
        } else if (!isNaN(Number(slugOrId))) {
          const { data: dataById } = await supabase.from('events').select('*').eq('id', slugOrId).single()
          eventData = dataById
        }

        if (eventData) {
            setEvent(eventData)
            const count = await getRegistrationCount(eventData.id)
            setRegistrationCount(count)
        } else {
          setError('Event not found.')
        }
      } catch (err) {
        console.error(err)
        setError('Error loading event.')
      }
    }
    loadEvent()
  }, [resolvedParams.slug])

  const generatePDF = async (user: any, eventData: any) => {
    const doc = await createTicketPdf(user, eventData)
    doc.save(`${user.full_name}_ticket.pdf`)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    setLoading(true)

    try {
      const currentCount = await getRegistrationCount(event.id)
      if (isEventFull(event.capacity, currentCount)) {
        setRegistrationCount(currentCount)
        alert('Sorry, this event is fully booked.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.from('registrations').insert([{
        ...formData,
        event_id: event.id,
        status: 'pending'
      }]).select().single()

      if (error) {
        alert(error.message)
      } else {
        setRegistrationCount(currentCount + 1)
        const ticketCode = getTicketCode(data)
        const enriched = { ...data, ticket_code: ticketCode }
        setTicketData(enriched)
        setTimeout(() => generatePDF(enriched, event), 500)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Registration failed')
    }
    setLoading(false)
  }

  if (error) return (
    <div className={styles.errorPage}>
      <h1 className={styles.errorTitle}>Oops!</h1>
      <p className={styles.errorText}>{error}</p>
      <Button variant="secondary" onClick={() => router.push('/')}>Back to Home</Button>
    </div>
  )

  if (!event) return <EventDetailSkeleton />

  return (
    <main className={styles.page}>
      <section className={styles.eventDetailSection}>
        <div className={styles.eventDetailMedia}>
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image_url} alt={event.name} className={styles.eventDetailImage} />
        ) : (
          <div className={styles.eventDetailPlaceholder} aria-hidden />
        )}
      </div>

      <div className={styles.eventDetailPanel}>
        <div className={styles.eventDetailBody}>
              <div className={styles.eventDetailIntro}>
                {statusBadge && (
                  <span className={`${styles.badge} ${statusBadge.className}`}>{statusBadge.label}</span>
                )}

                <h1 className={styles.eventDetailTitle}>{event.name}</h1>
                <RichTextContent
                  html={event.description}
                  className={styles.eventDetailDescription}
                />
              </div>

              <div className={styles.eventDetailFacts}>
                <div className={styles.eventDetailFact}>
                  <div className={styles.eventDetailFactIcon}>
                    <Calendar size={18} aria-hidden />
                  </div>
                  <div>
                    <span className={styles.eventDetailFactLabel}>Date &amp; Time</span>
                    <span className={styles.eventDetailFactValue}>
                      {formatEventDateTime(event.date, event.start_time, event.end_time)}
                    </span>
                  </div>
                </div>

                {event.address && (
                  <div className={styles.eventDetailFact}>
                    <div className={styles.eventDetailFactIcon}>
                      <MapPin size={18} aria-hidden />
                    </div>
                    <div>
                      <span className={styles.eventDetailFactLabel}>Location</span>
                      <span className={styles.eventDetailFactValue}>{event.address}</span>
                    </div>
                  </div>
                )}
              </div>

              {ticketData ? (
                <div className={styles.eventDetailSuccess}>
                  <div className={styles.successIcon}>
                    <Check size={32} strokeWidth={2.5} />
                  </div>
                  <h2 className={styles.eventDetailSuccessTitle}>You&apos;re In!</h2>
                  <p className={styles.eventDetailSuccessLead}>
                    Your ticket has been downloaded automatically. Screenshot this QR code or download
                    your e-ticket below.
                  </p>
                  <div className={styles.eventDetailSuccessTicket}>
                    <div className={styles.qrBox}>
                      <QRCodeSVG value={getTicketCode(ticketData)} size={160} />
                      <p className={styles.qrId}>{formatTicketCodeDisplay(getTicketCode(ticketData))}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => generatePDF(ticketData, event)}
                      className={styles.textLink}
                    >
                      Download Ticket Again
                    </button>
                  </div>
                </div>
              ) : isPast ? (
                <p className={styles.eventDetailNotice}>This event has ended.</p>
              ) : registrationFull ? (
                <p className={`${styles.eventDetailNotice} ${styles.eventDetailNoticeSoldOut}`}>
                  This event has reached its registration limit.
                </p>
              ) : (
                <div className={styles.eventDetailForm}>
                  <p className={styles.eventDetailFormEyebrow}>Register</p>

                  <form
                    id="event-registration-form"
                    onSubmit={handleRegister}
                    className={`${styles.eventDetailFormBlock} ${formStyles.eventDetailForm}`}
                  >
                    <div className={formStyles.gridHalf}>
                      <EditorialInput
                        label="Full Name"
                        required
                        placeholder="e.g. Asad Muhammad"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      />
                      <EditorialInput
                        label="Job Title"
                        required
                        placeholder="e.g. Director"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    <div className={formStyles.gridHalf}>
                      <EditorialInput
                        label="Email Address"
                        type="email"
                        required
                        placeholder="asad@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />

                      <EditorialInput
                        label="Phone Number"
                        type="tel"
                        placeholder="+62 812..."
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className={formStyles.gridHalf}>
                      <EditorialInput
                        label="Date of Birth"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      />
                      <EditorialSelect
                        label="Gender"
                        placeholder="Select"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        options={[
                          { value: 'Male', label: 'Male' },
                          { value: 'Female', label: 'Female' },
                        ]}
                      />
                    </div>
                  </form>
                </div>
              )}
        </div>

        <div className={styles.eventDetailActions}>
          <button type="button" onClick={() => router.push('/')} className={styles.eventDetailBack}>
            <ChevronLeft size={16} aria-hidden />
            All Events
          </button>

          {!ticketData && !isPast && !registrationFull && (
            <Button
              type="submit"
              form="event-registration-form"
              variant="yellow"
              hideIcon
              disabled={loading}
              className={`${btnStyles.compact} ${styles.eventDetailActionsSubmit}`}
              textClassName={styles.eventDetailSubmitText}
            >
              {loading ? (
                'Generating...'
              ) : (
                <>
                  <span className={styles.eventDetailSubmitLabelFull}>Complete Registration</span>
                  <span className={styles.eventDetailSubmitLabelShort}>Register</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      </section>
    </main>
  )
}

'use client'
import { useEffect, useState } from 'react'
'use client'
import { useEffect, useState } from 'react'
import { branding } from '../lib/branding'
import { supabase } from '../lib/supabaseClient'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import styles from '../styles/shared.module.css'

export default function Home() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true })
      if (data) setEvents(data)
      setLoading(false)
    }
    loadEvents()
  }, [])

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>{branding.appName}</p>
        <h1 className={styles.heroTitle}>Events &amp; Registration</h1>
        <p className={styles.heroSubtitle}>
          The seamless RSVP and ticketing platform. Select an event below to get started.
        </p>
      </section>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Upcoming Events</p>
        {loading ? (
          <div className={styles.loading}>Loading events...</div>
        ) : (
          <div className={styles.cardGrid}>
            {events.length === 0 ? (
              <div className={styles.empty}>
                <p>No events available yet. Check back soon.</p>
              </div>
            ) : (
              events.map((event) => {
                const urlSlug = event.slug || event.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
                const isUpcoming = new Date(event.date) > new Date()

                return (
                  <Link key={event.id} href={`/event/${urlSlug}`} className={styles.eventCard}>
                    <span className={`${styles.badge} ${isUpcoming ? styles.badgeGold : ''}`}>
                      {isUpcoming ? 'Upcoming' : 'Past Event'}
                    </span>
                    <h2 className={styles.cardTitle}>{event.name}</h2>
                    <p className={styles.cardDescription}>{event.description || 'Join us for an unforgettable experience.'}</p>
                    <div className={styles.cardMeta}>
                      <div className={styles.metaRow}>
                        <Calendar size={15} />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <MapPin size={15} />
                        <span>{event.address}</span>
                      </div>
                    </div>
                    <span className={styles.cardLink}>
                      View Event <ArrowRight size={14} />
                    </span>
                  </Link>
                )
              })
            )}
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerBrand}>{branding.appName.toUpperCase()}</p>
        <p>© Copyright {branding.copyright} 2026</p>
      </footer>
    </main>
  )
}

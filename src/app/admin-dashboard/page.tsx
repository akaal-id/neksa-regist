'use client'
import { useEffect, useState } from 'react'
import { branding } from '../../lib/branding'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Plus, LogOut, Calendar, MapPin, ChevronRight, Link as LinkIcon } from 'lucide-react'
import Button from '../../components/Button/Button'
import { EditorialInput, EditorialTextarea } from '../../components/ui/editorial-form'
import formStyles from '../../components/ui/EditorialForm.module.css'
import styles from '../../styles/shared.module.css'
import btnStyles from '../../components/Button/Button.module.css'

export default function AdminDashboard() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newEvent, setNewEvent] = useState({ name: '', description: '', date: '', address: '', slug: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin')
    if (isAdmin !== 'true') {
      router.push('/admin')
    } else {
      fetchEvents()
    }
  }, [])

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false })
    if (data) setEvents(data)
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    router.push('/admin')
  }

  const createEvent = async () => {
    if (!newEvent.name || !newEvent.date) return alert('Name and Date are required')

    const finalSlug = newEvent.slug || newEvent.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

    setLoading(true)
    const { error } = await supabase.from('events').insert([{
      ...newEvent,
      slug: finalSlug
    }])

    if (error) {
      alert(error.message)
    } else {
      setShowModal(false)
      setNewEvent({ name: '', description: '', date: '', address: '', slug: '' })
      fetchEvents()
    }
    setLoading(false)
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.adminTitle}>Event Manager</h1>
          <p className={styles.adminSubtitle}>Select an event to manage RSVPs</p>
        </div>
        <div className={styles.adminActions}>
          <button onClick={handleLogout} className={styles.iconBtn} aria-label="Log out">
            <LogOut size={18} />
          </button>
          <Button onClick={() => setShowModal(true)} icon={Plus}>
            Create Event
          </Button>
        </div>
      </div>

      <div className={styles.cardGrid}>
        {events.length === 0 ? (
          <div className={styles.empty}>
            <p>No events found. Create your first one!</p>
          </div>
        ) : (
          events.map(event => (
            <div
              key={event.id}
              onClick={() => router.push(`/admin-dashboard/event/${event.id}`)}
              className={styles.eventCard}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin-dashboard/event/${event.id}`)}
            >
              <ChevronRight size={20} className={styles.cardChevron} />
              <h2 className={styles.cardTitle}>{event.name}</h2>
              <p className={styles.cardDescription}>{event.description || 'No description'}</p>
              <div className={styles.cardMeta}>
                <div className={styles.metaRow}>
                  <Calendar size={14} />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className={styles.metaRow}>
                  <MapPin size={14} />
                  <span>{event.address}</span>
                </div>
                {event.slug && (
                  <div className={styles.metaRow}>
                    <LinkIcon size={14} />
                    <span>/event/{event.slug}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create New Event</h2>
            <p className={styles.modalLead}>Fill in the details for your new event.</p>

            <div className={styles.formBlock}>
              <EditorialInput
                label="Event Name"
                required
                placeholder="e.g. HEI Talk Launch Party"
                value={newEvent.name}
                onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
              />

              <div>
                <label className={formStyles.label}>Custom URL Slug</label>
                <div className={styles.slugPrefix}>
                  <span className={styles.slugPrefixLabel}>{branding.eventUrlPrefix}</span>
                  <EditorialInput
                    placeholder="my-event-name"
                    value={newEvent.slug}
                    onChange={e => setNewEvent({ ...newEvent, slug: e.target.value })}
                    containerClassName={styles.slugPrefixInput}
                  />
                </div>
              </div>

              <EditorialInput
                label="Date"
                type="date"
                required
                value={newEvent.date}
                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
              />

              <EditorialInput
                label="Location"
                placeholder="e.g. Grand Ballroom"
                value={newEvent.address}
                onChange={e => setNewEvent({ ...newEvent, address: e.target.value })}
              />

              <EditorialTextarea
                label="Description"
                placeholder="Event details..."
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              />

              <div className={styles.formActions}>
                <Button variant="secondary" onClick={() => setShowModal(false)} className={btnStyles.fullWidth}>
                  Cancel
                </Button>
                <Button onClick={createEvent} disabled={loading} className={btnStyles.fullWidth}>
                  {loading ? 'Saving...' : 'Create Event'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { eventUrlPrefix } from '../../lib/brand'
import {
  EMPTY_EVENT_FORM,
  EventFormData,
  EventRecord,
  eventToFormData,
  slugify,
  parseCapacity,
  parseOptionalTime,
  validateTimeRange,
  computeEventStatus,
  resolvePublishedStatus,
  hasPendingSpeakers,
} from '../../lib/events'
import { uploadEventImage, validateEventImage } from '../../lib/eventImage'
import { hasRichTextContent } from '../../lib/richText'
import Button from '../Button/Button'
import RichTextEditor from '../RichTextEditor/RichTextEditor'
import { EditorialInput } from '../ui/editorial-form'
import formStyles from '../ui/EditorialForm.module.css'
import styles from './EventFormModal.module.css'
import shared from '../../styles/shared.module.css'
import btnStyles from '../Button/Button.module.css'

type EventFormModalProps = {
  mode: 'create' | 'edit'
  event?: EventRecord | null
  onClose: () => void
  onSaved: () => void
}

export default function EventFormModal({ mode, event, onClose, onSaved }: EventFormModalProps) {
  const [form, setForm] = useState<EventFormData>(EMPTY_EVENT_FORM)
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'edit' && event) {
      setForm(eventToFormData(event))
      setImagePreview(event.image_url)
    } else {
      setForm(EMPTY_EVENT_FORM)
      setImagePreview(null)
    }
    setImageFile(null)
  }, [mode, event])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateEventImage(file)
    if (validationError) {
      alert(validationError)
      e.target.value = ''
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.name || !form.date) {
      alert('Name and Date are required')
      return
    }

    setLoading(true)

    try {
      const finalSlug = form.slug || slugify(form.name)
      const capacity = parseCapacity(form.capacity)
      const startTime = parseOptionalTime(form.start_time)
      const endTime = parseOptionalTime(form.end_time)
      validateTimeRange(startTime, endTime)

      const description = hasRichTextContent(form.description) ? form.description : null
      let status: 'draft' | 'upcoming' | 'past' = 'draft'
      if (mode === 'create') {
        status = 'draft'
      } else if (event?.status === 'draft') {
        status = computeEventStatus(description, form.date)
      } else if (hasPendingSpeakers(description)) {
        status = event!.status
      } else {
        status = resolvePublishedStatus(form.date)
      }

      const payload = {
        name: form.name,
        description,
        date: form.date,
        start_time: startTime,
        end_time: endTime,
        address: form.address || null,
        slug: finalSlug,
        capacity,
        status,
      }

      let eventId = event?.id

      if (mode === 'create') {
        const { data, error } = await supabase.from('events').insert([payload]).select().single()
        if (error) throw error
        eventId = data.id
      } else if (eventId) {
        const { error } = await supabase.from('events').update(payload).eq('id', eventId)
        if (error) throw error
      }

      if (imageFile && eventId) {
        const imageUrl = await uploadEventImage(imageFile, eventId)
        const { error } = await supabase.from('events').update({ image_url: imageUrl }).eq('id', eventId)
        if (error) throw error
      }

      onSaved()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save event'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={shared.modalOverlay} onClick={onClose}>
      <div className={`${shared.modal} ${shared.modalWide}`} onClick={(e) => e.stopPropagation()}>
        <h2 className={shared.modalTitle}>
          {mode === 'create' ? 'Create New Event' : 'Edit Event'}
        </h2>
        <p className={shared.modalLead}>
          {mode === 'create'
            ? 'Fill in the details for your new event.'
            : 'Update event details and cover image.'}
        </p>

        <div className={shared.formBlock}>
          <EditorialInput
            label="Event Name"
            required
            placeholder="e.g. HEI Talk Launch Party"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div>
            <label className={formStyles.label}>Custom URL Slug</label>
            <div className={shared.slugPrefix}>
              <span className={shared.slugPrefixLabel}>{eventUrlPrefix()}</span>
              <EditorialInput
                placeholder="my-event-name"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                containerClassName={shared.slugPrefixInput}
              />
            </div>
          </div>

          <EditorialInput
            label="Date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <div className={formStyles.gridHalf}>
            <EditorialInput
              label="Start Time"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
            <EditorialInput
              label="End Time"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </div>

          <EditorialInput
            label="Location"
            placeholder="e.g. Grand Ballroom"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <EditorialInput
            label="Registration Capacity"
            type="number"
            min={1}
            placeholder="Leave empty for unlimited"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />

          <RichTextEditor
            label="Description"
            placeholder="Event details..."
            value={form.description}
            onChange={(description) => setForm({ ...form, description })}
          />

          <div className={styles.imageField}>
            <label className={formStyles.label}>Cover Image</label>
            <div
              className={styles.imageUpload}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Event cover preview" className={styles.imagePreview} />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <span>Click to upload</span>
                  <span className={styles.imageHint}>JPEG, PNG, WebP or GIF · max 5 MB · 4:5 ratio recommended</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={styles.fileInput}
              onChange={handleImageChange}
            />
          </div>

          <div className={shared.formActions}>
            <Button variant="secondary" onClick={onClose} className={btnStyles.fullWidth}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className={btnStyles.fullWidth}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

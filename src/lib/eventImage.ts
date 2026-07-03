import { supabase } from './supabaseClient'
import { EVENT_IMAGE_BUCKET } from './events'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateEventImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please upload a JPEG, PNG, WebP, or GIF image.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be 5 MB or smaller.'
  }
  return null
}

export async function uploadEventImage(file: File, eventId: number): Promise<string> {
  const validationError = validateEventImage(file)
  if (validationError) throw new Error(validationError)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${eventId}/cover-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(EVENT_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from(EVENT_IMAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteEventImageByUrl(imageUrl: string) {
  const marker = `/storage/v1/object/public/${EVENT_IMAGE_BUCKET}/`
  const index = imageUrl.indexOf(marker)
  if (index === -1) return

  const path = decodeURIComponent(imageUrl.slice(index + marker.length))
  await supabase.storage.from(EVENT_IMAGE_BUCKET).remove([path])
}

export async function deleteEvent(event: { id: number; image_url: string | null }) {
  if (event.image_url) {
    try {
      await deleteEventImageByUrl(event.image_url)
    } catch {
      // Continue even if storage cleanup fails
    }
  }

  const { error } = await supabase.from('events').delete().eq('id', event.id)
  if (error) throw error
}

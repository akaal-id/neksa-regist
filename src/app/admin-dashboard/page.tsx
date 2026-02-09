'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Plus, LogOut, Calendar, MapPin, ChevronRight, Link as LinkIcon } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  // ADDED: slug field to state
  const [newEvent, setNewEvent] = useState({ name: '', description: '', date: '', address: '', slug: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 1. SECURITY CHECK: Are you logged in?
    const isAdmin = localStorage.getItem('isAdmin')
    if (isAdmin !== 'true') {
      router.push('/admin') // Kick them back to login
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
    
    // Auto-generate slug if empty (optional safety)
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
      setNewEvent({ name: '', description: '', date: '', address: '', slug: '' }) // Reset form
      fetchEvents() // Refresh list
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 md:p-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Manager</h1>
          <p className="text-gray-400 text-sm mt-1">Select an event to manage RSVPs</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white transition">
            <LogOut size={20} />
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-black font-bold px-4 py-2 rounded-lg transition"
          >
            <Plus size={18} /> Create Event
          </button>
        </div>
      </div>

      {/* EVENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-xl">
            <p>No events found. Create your first one!</p>
          </div>
        ) : (
          events.map(event => (
            <div 
              key={event.id} 
              // THIS IS KEY: It redirects to the specific event page we will build next
              onClick={() => router.push(`/admin-dashboard/event/${event.id}`)}
              className="group bg-[#111] border border-[#222] rounded-xl p-6 hover:border-green-500/50 hover:bg-[#161616] transition cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                <ChevronRight className="text-green-500" />
              </div>

              <h2 className="text-xl font-bold mb-2 pr-8">{event.name}</h2>
              <p className="text-gray-400 text-sm mb-6 line-clamp-2">{event.description || 'No description'}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} className="text-green-600" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={14} className="text-green-600" />
                  <span className="truncate">{event.address}</span>
                </div>
                {event.slug && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <LinkIcon size={14} className="text-blue-500" />
                        <span className="truncate text-blue-400">/event/{event.slug}</span>
                    </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] border border-[#333] p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Create New Event</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Event Name *</label>
                <input 
                  className="w-full bg-[#222] p-3 rounded-lg border border-gray-700 mt-1 focus:border-green-500 outline-none text-white"
                  placeholder="e.g. Neksa Launch Party"
                  value={newEvent.name}
                  onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                />
              </div>

              {/* NEW: SLUG INPUT */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Custom URL Slug</label>
                <div className="flex items-center mt-1">
                    <span className="bg-[#333] p-3 rounded-l-lg border border-[#333] text-gray-400 border-r-0 text-sm">neksa.id/event/</span>
                    <input 
                    className="w-full bg-[#222] p-3 rounded-r-lg border border-gray-700 border-l-0 focus:border-green-500 outline-none text-white"
                    placeholder="my-event-name"
                    value={newEvent.slug}
                    onChange={e => setNewEvent({...newEvent, slug: e.target.value})}
                    />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Date *</label>
                <input 
                  type="date"
                  className="w-full bg-[#222] p-3 rounded-lg border border-gray-700 mt-1 focus:border-green-500 outline-none text-white"
                  value={newEvent.date}
                  onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Location</label>
                <input 
                  className="w-full bg-[#222] p-3 rounded-lg border border-gray-700 mt-1 focus:border-green-500 outline-none text-white"
                  placeholder="e.g. Grand Ballroom"
                  value={newEvent.address}
                  onChange={e => setNewEvent({...newEvent, address: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">Description</label>
                <textarea 
                  className="w-full bg-[#222] p-3 rounded-lg border border-gray-700 mt-1 focus:border-green-500 outline-none text-white h-24 resize-none"
                  placeholder="Event details..."
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowModal(false)} 
                className="flex-1 bg-[#222] hover:bg-[#333] text-white py-3 rounded-lg font-bold transition"
              >
                Cancel
              </button>
              <button 
                onClick={createEvent} 
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-black py-3 rounded-lg font-bold transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
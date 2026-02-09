'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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
    <main className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Hero Section */}
      <section className="py-20 px-8 text-center border-b border-gray-900">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-4">
          Neksa Events
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          The seamless RSVP and Ticketing platform. Select an event below to get started.
        </p>
      </section>

      {/* Events Carousel / Grid */}
      <section className="flex-1 p-8 overflow-y-auto">
        {loading ? (
            <div className="text-center text-gray-500">Loading events...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {events.map((event) => {
                // FORCE SLUG GENERATION if missing from DB
                // This ensures we never see "/event/1" even if DB is empty
                const urlSlug = event.slug || event.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

                return (
                  <Link 
                    key={event.id} 
                    href={`/event/${urlSlug}`} 
                    className="group bg-[#111] border border-[#222] rounded-2xl p-6 hover:border-green-500/50 hover:bg-[#161616] transition flex flex-col h-full"
                  >
                      <div className="mb-4">
                          <span className="text-xs font-bold text-green-500 uppercase tracking-widest border border-green-500/20 px-2 py-1 rounded">
                              {new Date(event.date) > new Date() ? 'Upcoming' : 'Past Event'}
                          </span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2 group-hover:text-green-400 transition">{event.name}</h2>
                      <p className="text-gray-400 text-sm mb-6 flex-1 line-clamp-3">{event.description}</p>
                      
                      <div className="space-y-3 pt-6 border-t border-[#222]">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Calendar size={16} />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                              <MapPin size={16} />
                              <span className="truncate">{event.address}</span>
                          </div>
                      </div>
                      
                      <div className="mt-6 flex items-center text-green-500 text-sm font-bold gap-1 group-hover:gap-2 transition-all">
                          View Event <ArrowRight size={16} />
                      </div>
                  </Link>
                )
            })}
            </div>
        )}
      </section>

      <footer className="p-8 text-center text-xs text-gray-800 border-t border-gray-900">
        © Copyright Neksa 2026
      </footer>
    </main>
  )
}
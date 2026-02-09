'use client'
import { useEffect, useState, use } from 'react' // Added 'use' for params
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ChevronLeft, QrCode, List, UserCheck } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'rsvp' | 'scan'>('rsvp')
  const [registrations, setRegistrations] = useState<any[]>([])
  
  // Scanner State
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(true)

  // 1. Fetch Event & Registrations
  useEffect(() => {
    async function loadData() {
      // Get Event Details
      const { data: eventData } = await supabase.from('events').select('*').eq('id', eventId).single()
      if (eventData) setEvent(eventData)

      fetchRegistrations()
    }
    loadData()

    // Realtime Listener
    const channel = supabase
      .channel(`event-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations', filter: `event_id=eq.${eventId}` }, 
        () => fetchRegistrations()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  const fetchRegistrations = async () => {
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (data) setRegistrations(data)
  }

  // 2. Handle QR Scan
  const handleScan = async (result: any) => {
    if (result && result[0]?.rawValue && isScanning) {
        const ticketId = result[0].rawValue
        setIsScanning(false) // Pause

        // Update DB
        const { error } = await supabase
            .from('registrations')
            .update({ status: 'attended' })
            .eq('id', ticketId)
            .eq('event_id', eventId) // Security: Ensure ticket belongs to THIS event

        if (error) {
            alert('Error or Wrong Event: ' + error.message)
        } else {
            setLastScan(ticketId)
            // Play Beep
            new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3').play().catch(() => {})
        }

        // Resume after 2s
        setTimeout(() => {
            setIsScanning(true)
            setLastScan(null)
        }, 2000)
    }
  }

  if (!event) return <div className="min-h-screen bg-black text-white p-10">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      
      {/* HEADER */}
      <div className="border-b border-gray-800 bg-[#111] p-6 sticky top-0 z-10">
        <button onClick={() => router.push('/admin-dashboard')} className="flex items-center text-gray-400 hover:text-white mb-4">
            <ChevronLeft size={20} /> Back to Events
        </button>
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold">{event.name}</h1>
                <p className="text-green-500">{registrations.length} Registrations</p>
            </div>
            {/* TABS */}
            <div className="flex bg-[#222] p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('rsvp')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold transition ${activeTab === 'rsvp' ? 'bg-green-600 text-black' : 'text-gray-400 hover:text-white'}`}
                >
                    <List size={18} /> RSVP List
                </button>
                <button 
                    onClick={() => setActiveTab('scan')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold transition ${activeTab === 'scan' ? 'bg-green-600 text-black' : 'text-gray-400 hover:text-white'}`}
                >
                    <QrCode size={18} /> Scanner
                </button>
            </div>
        </div>
      </div>

      <div className="p-6">
        
        {/* TAB 1: RSVP TABLE */}
        {activeTab === 'rsvp' && (
            <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#1a1a1a] text-gray-500 border-b border-[#333]">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                        {registrations.map(reg => (
                            <tr key={reg.id} className="hover:bg-[#161616]">
                                <td className="p-4 font-bold">{reg.title} {reg.full_name}</td>
                                <td className="p-4 text-gray-400">{reg.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${reg.status === 'attended' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-500'}`}>
                                        {reg.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {registrations.length === 0 && <div className="p-10 text-center text-gray-500">No RSVPs yet.</div>}
            </div>
        )}

        {/* TAB 2: SCANNER */}
        {activeTab === 'scan' && (
            <div className="max-w-md mx-auto">
                <div className={`border-4 rounded-2xl overflow-hidden relative ${isScanning ? 'border-green-500' : 'border-gray-700'}`}>
                    <Scanner onScan={handleScan} paused={!isScanning} />
                    {!isScanning && (
                        <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                            <div className="text-center">
                                <UserCheck size={64} className="mx-auto text-white mb-2" />
                                <h2 className="text-2xl font-bold text-white">CHECKED IN!</h2>
                            </div>
                        </div>
                    )}
                </div>
                <p className="text-center text-gray-500 mt-4">Point camera at User QR Code</p>
            </div>
        )}

      </div>
    </div>
  )
}
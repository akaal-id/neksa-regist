'use client'
import { useEffect, useState, use } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ChevronLeft, QrCode, List, UserCheck, Upload, Download } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'
import Papa from 'papaparse' // CSV Parser
import { jsPDF } from 'jspdf' // PDF Generator
import QRCode from 'qrcode' // QR Generator

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id
  const router = useRouter()
  
  const [event, setEvent] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'rsvp' | 'scan'>('rsvp')
  const [registrations, setRegistrations] = useState<any[]>([])
  
  // Scanner State
  const [lastScan, setLastScan] = useState<any>(null) // Changed to object to store user data
  const [isScanning, setIsScanning] = useState(true)

  // 1. Fetch Logic (Same as before)
  useEffect(() => {
    async function loadData() {
      const { data: eventData } = await supabase.from('events').select('*').eq('id', eventId).single()
      if (eventData) setEvent(eventData)
      fetchRegistrations()
    }
    loadData()
    const channel = supabase.channel(`event-${eventId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'registrations', filter: `event_id=eq.${eventId}` }, () => fetchRegistrations()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  const fetchRegistrations = async () => {
    const { data } = await supabase.from('registrations').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
    if (data) setRegistrations(data)
  }

  // -------------------------
  // 2. CSV UPLOAD LOGIC
  // -------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[]
        // Map CSV columns to DB columns (Adjust keys based on your CSV header)
        // Expected CSV Headers: Name, Email, Title, Phone
        const formattedRows = rows.map(row => ({
          event_id: eventId,
          full_name: row.Name || row.name || row.Full_Name,
          email: row.Email || row.email,
          title: row.Title || row.title || '-',
          phone: row.Phone || row.phone || null,
          status: 'pending'
        }))

        // Bulk Insert
        const { error } = await supabase.from('registrations').insert(formattedRows)
        if (error) alert('Import Error: ' + error.message)
        else {
            alert(`Successfully imported ${formattedRows.length} users!`)
            fetchRegistrations()
        }
      }
    })
  }

  // -------------------------
  // 3. PDF DOWNLOAD LOGIC (Admin Side)
  // -------------------------
  const downloadTicket = async (user: any) => {
    // Re-use the exact same logic from User Side (Copy-Paste generatePDF content here)
    // For brevity, I'll put a simplified version, but you should copy the "Professional" one
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' })
    const qrDataUrl = await QRCode.toDataURL(user.id.toString(), { margin: 2, width: 500 })
    doc.addImage(qrDataUrl, 'PNG', 20, 20, 50, 50)
    doc.setFontSize(20)
    doc.text(user.full_name, 80, 40)
    doc.text(event.name, 80, 60)
    doc.save(`${user.full_name}_ticket.pdf`)
  }

  // -------------------------
  // 4. SCANNER LOGIC (Updated)
  // -------------------------
  const handleScan = async (result: any) => {
    if (result && result[0]?.rawValue && isScanning) {
        const ticketId = result[0].rawValue
        setIsScanning(false) // Pause

        // Update DB
        const { error } = await supabase.from('registrations').update({ status: 'attended' }).eq('id', ticketId).eq('event_id', eventId)

        if (error) {
            alert('Error: ' + error.message)
            setIsScanning(true)
        } else {
            // Fetch user for display
            const { data } = await supabase.from('registrations').select('*').eq('id', ticketId).single()
            setLastScan(data)
            new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3').play().catch(() => {})
        }
    }
  }

  const resetScanner = () => {
    setLastScan(null)
    setIsScanning(true)
  }

  if (!event) return <div className="p-10 text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* ... (Keep Header) ... */}
      <div className="border-b border-gray-800 bg-[#111] p-6 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
             <button onClick={() => router.push('/admin-dashboard')} className="flex items-center text-gray-400 hover:text-white">
                <ChevronLeft size={20} /> Back to Events
            </button>
            <div className="flex bg-[#222] p-1 rounded-lg">
                <button onClick={() => setActiveTab('rsvp')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold ${activeTab === 'rsvp' ? 'bg-green-600 text-black' : 'text-gray-400'}`}>
                    <List size={18} /> RSVP List
                </button>
                <button onClick={() => setActiveTab('scan')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold ${activeTab === 'scan' ? 'bg-green-600 text-black' : 'text-gray-400'}`}>
                    <QrCode size={18} /> Scanner
                </button>
            </div>
        </div>
        <h1 className="text-3xl font-bold">{event.name}</h1>
      </div>

      <div className="p-6">
        {activeTab === 'rsvp' && (
            <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                {/* CSV UPLOAD BAR */}
                <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#161616]">
                    <h3 className="font-bold text-gray-400">Total: {registrations.length}</h3>
                    <label className="flex items-center gap-2 bg-[#222] hover:bg-[#333] border border-[#444] px-4 py-2 rounded-lg cursor-pointer transition">
                        <Upload size={16} />
                        <span className="text-sm font-bold">Import CSV</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-[#1a1a1a] text-gray-500 border-b border-[#333]">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Title</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                        {registrations.map(reg => (
                            <tr key={reg.id} className="hover:bg-[#161616]">
                                <td className="p-4 font-bold">{reg.full_name} <br/><span className="text-xs text-gray-500 font-normal">{reg.email}</span></td>
                                <td className="p-4 text-gray-400">{reg.title}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${reg.status === 'attended' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-500'}`}>
                                        {reg.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button onClick={() => downloadTicket(reg)} className="text-gray-400 hover:text-green-400 transition" title="Download Ticket">
                                        <Download size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* UPDATED ADMIN SCANNER */}
        {activeTab === 'scan' && (
            <div className="max-w-md mx-auto">
                {!lastScan ? (
                    <>
                        <div className={`border-4 rounded-2xl overflow-hidden relative ${isScanning ? 'border-green-500' : 'border-gray-700'}`}>
                            <Scanner onScan={handleScan} paused={!isScanning} />
                        </div>
                        <p className="text-center text-gray-500 mt-4">Point camera at User QR Code</p>
                    </>
                ) : (
                    <div className="text-center bg-[#111] border border-[#333] p-8 rounded-2xl animate-in zoom-in">
                        <UserCheck size={64} className="mx-auto text-green-500 mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">CHECKED IN!</h2>
                        <h3 className="text-xl text-green-400 font-bold mb-6">{lastScan.title} {lastScan.full_name}</h3>
                        <button onClick={resetScanner} className="w-full bg-green-600 hover:bg-green-700 text-black font-bold py-4 rounded-xl transition">
                            Scan Next Person
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  )
}
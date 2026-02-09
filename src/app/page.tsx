'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ChevronLeft } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { Scanner } from '@yudiel/react-qr-scanner'

export default function Home() {
  const [event, setEvent] = useState<any>(null)
  const [modalMode, setModalMode] = useState<'none' | 'register' | 'scan'>('none')
  
  // Registration States
  const [formData, setFormData] = useState({ full_name: '', email: '', title: '', phone: '', dob: '', gender: '' })
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState<any>(null)

  // Scanner States
  const [scanResult, setScanResult] = useState<any>(null)

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase.from('events').select('*').order('id', { ascending: false }).limit(1).single()
      if (data) setEvent(data)
    }
    loadEvent()
  }, [])

  // ------------------------------------------
  //  PROFESSIONAL PDF GENERATOR
  // ------------------------------------------
  const generatePDF = async (user: any, eventData: any) => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' })
    const width = doc.internal.pageSize.getWidth()
    const height = doc.internal.pageSize.getHeight()

    // --- LEFT COLUMN (Dark Brand Section) ---
    const leftWidth = width * 0.35
    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, leftWidth, height, 'F')

    // 1. NEKSA Branding
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('NEKSA PASS', 20, 20)
    
    // 2. THE QR CODE
    try {
      const qrDataUrl = await QRCode.toDataURL(user.id.toString(), { margin: 2, width: 500 })
      const qrSize = 60
      const qrX = (leftWidth - qrSize) / 2
      doc.addImage(qrDataUrl, 'PNG', qrX, 60, qrSize, qrSize)
      
      doc.setFont('courier', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      const idText = `ID: ${user.id}`.toUpperCase()
      const idWidth = doc.getTextWidth(idText)
      doc.text(idText, (leftWidth - idWidth) / 2, 60 + qrSize + 10)
    } catch (err) {
      console.error("QR Error", err)
    }

    // --- RIGHT COLUMN (Event Details) ---
    const rightMargin = leftWidth + 20
    
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('OFFICIAL EVENT TICKET', rightMargin, 20)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(28)
    doc.text(eventData.name, rightMargin, 35)

    doc.setDrawColor(200, 200, 200)
    doc.line(rightMargin, 45, width - 20, 45)

    // 5. User Details
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('ATTENDEE', rightMargin, 60)

    doc.setFontSize(22)
    doc.setTextColor(0, 0, 0)
    doc.text(user.full_name, rightMargin, 72)
    
    // NEW: Display Job Title on Ticket
    if (user.title) {
        doc.setFontSize(14)
        doc.setTextColor(80, 80, 80)
        doc.text(user.title.toUpperCase(), rightMargin, 80) // Job Title
        
        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text(user.email, rightMargin, 88) // Email pushed down
    } else {
        doc.setFontSize(12)
        doc.setTextColor(80, 80, 80)
        doc.text(user.email, rightMargin, 82)
    }

    const gridY = 110
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('DATE', rightMargin, gridY)
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    const dateStr = new Date(eventData.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.text(dateStr, rightMargin, gridY + 10)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('LOCATION', rightMargin + 80, gridY)
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    const splitAddress = doc.splitTextToSize(eventData.address, 90)
    doc.text(splitAddress, rightMargin + 80, gridY + 10)

    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Please present this QR code at the entrance.', rightMargin, height - 20)
    doc.text('© 2026 Neksa Registration System', width - 20, height - 20, { align: 'right' })

    doc.save(`${user.full_name.replace(/\s+/g, '_')}_ticket.pdf`)
  }

  // ------------------------------------------
  //  LOGIC HANDLERS
  // ------------------------------------------

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!event) return
    setLoading(true)

    const { data, error } = await supabase.from('registrations').insert([{
      ...formData,
      event_id: event.id,
      status: 'pending'
    }]).select().single()

    if (error) {
      alert(error.message)
    } else {
      setTicketData(data)
      setTimeout(() => generatePDF(data, event), 500)
    }
    setLoading(false)
  }

  const handleScan = async (result: any) => {
    if (result && result[0]?.rawValue) {
       const id = result[0].rawValue
       await supabase.from('registrations').update({ status: 'attended' }).eq('id', id)
       const { data } = await supabase.from('registrations').select('*').eq('id', id).single()
       if(data) setScanResult(data)
    }
  }

  if (!event) return <div className="min-h-screen bg-black text-white flex items-center justify-center animate-pulse">Loading Event...</div>

  return (
    <main className="min-h-screen bg-black text-white flex flex-col font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="z-10 flex flex-col items-center">
            <span className="text-green-500 font-bold tracking-widest uppercase text-sm mb-4 border border-green-500/30 px-3 py-1 rounded-full">Open for Registration</span>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white mb-6">
            {event.name}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">{event.description || 'Join us for an unforgettable experience.'}</p>
        </div>
        
        <div className="z-10 flex flex-col md:flex-row gap-12 items-center border-t border-gray-800 pt-8 mt-8">
          <div className="text-center">
            <span className="block text-xs text-gray-500 uppercase tracking-widest mb-1">Date</span>
            <span className="text-2xl font-mono font-bold">{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className="hidden md:block h-12 w-px bg-gray-800"></div>
          <div className="text-center">
            <span className="block text-xs text-gray-500 uppercase tracking-widest mb-1">Location</span>
            <span className="text-2xl font-mono font-bold">{event.address}</span>
          </div>
        </div>

        <div className="flex gap-4 mt-10 z-10">
          <button 
            onClick={() => setModalMode('register')}
            className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:-translate-y-1"
          >
            Register Now
          </button>
          <button 
            onClick={() => setModalMode('scan')}
            className="px-8 py-4 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition text-lg"
          >
            Scan RSVP
          </button>
        </div>
      </section>

      <footer className="p-8 text-center border-t border-gray-900 z-10 bg-black">
        <p className="text-sm font-bold text-gray-600 mb-2">NEKSA, your RSVP registration system</p>
        <p className="text-xs text-gray-800">© Copyright Neksa 2026</p>
      </footer>

      {/* --- MODAL: REGISTER --- */}
      {modalMode === 'register' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a0a0a] border border-[#333] rounded-2xl p-8 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setModalMode('none')} className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 transition">
              <ChevronLeft size={20} /> Back
            </button>

            {!ticketData ? (
              <div className="mt-12">
                <h2 className="text-3xl font-bold mb-2">Secure your Spot</h2>
                <p className="text-gray-500 mb-8">Fill in your details to receive your entry pass.</p>
                
                <form onSubmit={handleRegister} className="flex flex-col gap-5">
                  {/* CHANGED: 50/50 Split for Name and Job Title */}
                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Full Name</label>
                        <input className="w-full p-3 bg-[#111] border border-[#333] rounded-lg text-white focus:border-green-500 outline-none" placeholder="e.g. Asad Muhammad" onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                     </div>
                     <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Job Title</label>
                        <input 
                            className="w-full p-3 bg-[#111] border border-[#333] rounded-lg text-white focus:border-green-500 outline-none" 
                            placeholder="e.g. CEO / Director" 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            required 
                        />
                     </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Email Address</label>
                    <input type="email" className="w-full p-3 bg-[#111] border border-[#333] rounded-lg text-white focus:border-green-500 outline-none" placeholder="asad@example.com" onChange={e => setFormData({...formData, email: e.target.value})} required />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Phone Number</label>
                    <input type="tel" className="w-full p-3 bg-[#111] border border-[#333] rounded-lg text-white focus:border-green-500 outline-none" placeholder="+62 812..." onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>

                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Date of Birth</label>
                        <input type="date" className="w-full p-3 bg-[#111] border border-[#333] rounded-lg text-white focus:border-green-500 outline-none" onChange={e => setFormData({...formData, dob: e.target.value})} />
                     </div>
                     <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Gender</label>
                        <select className="w-full p-3 bg-[#111] border border-[#333] rounded-lg text-white focus:border-green-500 outline-none" onChange={e => setFormData({...formData, gender: e.target.value})}>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                     </div>
                  </div>

                  <button disabled={loading} className="bg-green-600 hover:bg-green-700 text-black py-4 rounded-xl font-bold text-lg mt-4 disabled:opacity-50 transition transform active:scale-95">
                    {loading ? 'Generating Ticket...' : 'Complete Registration'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="mt-12 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">You're In!</h2>
                <p className="text-gray-400 mb-8">Your ticket has been downloaded automatically.</p>
                
                <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-lg transform rotate-1">
                  <QRCodeSVG value={ticketData.id.toString()} size={180} />
                  <p className="text-black font-mono text-sm mt-2 font-bold tracking-widest">#{ticketData.id}</p>
                </div>
                
                <div className="flex flex-col gap-3">
                    <button onClick={() => generatePDF(ticketData, event)} className="text-green-500 hover:text-green-400 font-bold underline">
                        Download Ticket Again
                    </button>
                    <button onClick={() => setModalMode('none')} className="text-gray-500 hover:text-white transition">
                        Close Window
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: SCANNER --- */}
      {modalMode === 'scan' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a0a0a] border border-[#333] rounded-2xl p-8 relative">
            <button onClick={() => setModalMode('none')} className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 transition">
              <ChevronLeft size={20} /> Back
            </button>

            <div className="mt-12 flex flex-col items-center">
              {!scanResult ? (
                <>
                  <h2 className="text-2xl font-bold mb-2">Scan Entry Pass</h2>
                  <p className="text-gray-500 mb-6 text-sm">Position the QR code within the frame</p>
                  
                  <div className="w-72 h-72 rounded-2xl overflow-hidden border-2 border-green-500 relative shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                     <Scanner onScan={handleScan} />
                     <div className="absolute inset-0 border-[30px] border-black/30 pointer-events-none"></div>
                  </div>
                  
                  <button 
                    onClick={() => setModalMode('register')} 
                    className="mt-8 text-sm text-gray-500 hover:text-white transition"
                  >
                    No ticket? <span className="underline text-green-500">Register here</span>
                  </button>
                </>
              ) : (
                <div className="text-center animate-in fade-in zoom-in duration-300 py-10">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg">
                    👋
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Welcome!</h2>
                  <div className="bg-[#111] border border-[#333] rounded-xl p-6 mt-6 mb-6">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Attendee</p>
                      <h3 className="text-2xl text-green-400 font-bold">{scanResult.title} {scanResult.full_name}</h3>
                      <p className="text-gray-400 text-sm mt-1">{scanResult.email}</p>
                  </div>
                  <button onClick={() => setModalMode('none')} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
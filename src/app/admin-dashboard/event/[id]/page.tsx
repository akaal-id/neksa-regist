'use client'
import { useEffect, useState, use, useMemo } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, QrCode, List, UserCheck, Upload, Download, Eye, Search, ArrowUpDown } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'
import Papa from 'papaparse'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id
  const router = useRouter()
  
  const [event, setEvent] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'rsvp' | 'scan'>('rsvp')
  const [registrations, setRegistrations] = useState<any[]>([])
  
  // NEW: Search, Sort & Pagination State
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Scanner State
  const [lastScan, setLastScan] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(true)

  // 1. Fetch Data
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
  // 2. SEARCH, SORT & PAGINATION LOGIC
  // -------------------------
  
  // A. Filter & Sort
  const filteredRegistrations = useMemo(() => {
    let data = [...registrations]

    // Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      data = data.filter(reg => 
        (reg.full_name?.toLowerCase() || '').includes(lowerTerm) ||
        (reg.email?.toLowerCase() || '').includes(lowerTerm) ||
        (reg.title?.toLowerCase() || '').includes(lowerTerm)
      )
    }

    // Sort
    if (sortConfig) {
      data.sort((a, b) => {
        const aValue = (a[sortConfig.key] || '').toString().toLowerCase()
        const bValue = (b[sortConfig.key] || '').toString().toLowerCase()

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return data
  }, [registrations, searchTerm, sortConfig])

  // B. Pagination Slicing
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage)
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }


  // -------------------------
  // 3. ACTIONS (CSV, PDF, Status)
  // -------------------------

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[]
        const errors: string[] = []
        
        // Validate required fields and process data
        const formattedRows = rows.map((row, index) => {
          // Check mandatory fields
          const fullName = row.full_name || row.Full_Name || row.name || row.Name || ''
          const title = row.title || row.Title || ''
          
          if (!fullName.trim()) {
            errors.push(`Row ${index + 1}: full_name is required`)
            return null
          }
          
          if (!title.trim()) {
            errors.push(`Row ${index + 1}: title is required`)
            return null
          }
          
          // Validate email format if provided
          const email = row.email || row.Email || ''
          if (email && !/\S+@\S+\.\S+/.test(email)) {
            errors.push(`Row ${index + 1}: Invalid email format`)
            return null
          }
          
          return {
            event_id: eventId,
            full_name: fullName.trim(),
            email: email.trim() || null,
            title: title.trim(),
            phone: row.phone || row.Phone || null,
            dob: row.dob || row.DOB || null,
            gender: row.gender || row.Gender || null,
            status: 'pending'
          }
        }).filter(Boolean) // Remove rows with errors
        
        // Show errors if any
        if (errors.length > 0) {
          alert(`Import completed with ${errors.length} error(s):\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n\n...and more errors' : ''}`)
        }
        
        // Show success if any valid rows were imported
        if (formattedRows.length > 0) {
          alert(`Successfully imported ${formattedRows.length} users!${errors.length > 0 ? ' (Some rows were skipped due to errors)' : ''}`)
          
          const { error } = await supabase.from('registrations').insert(formattedRows)
          if (error) {
            alert('Import Error: ' + error.message)
          } else {
            fetchRegistrations()
          }
        } else if (errors.length > 0) {
          alert('No valid data to import. Please check your CSV file format and required fields.')
        }
      }
    })
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setRegistrations(prev => prev.map(reg => reg.id === userId ? { ...reg, status: newStatus } : reg))
    const { error } = await supabase.from('registrations').update({ status: newStatus }).eq('id', userId)
    if (error) {
        alert('Failed to update status')
        fetchRegistrations()
    }
  }

  // PDF Generation (Reused)
  const createPdfDoc = async (user: any) => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' })
    const width = doc.internal.pageSize.getWidth()
    const height = doc.internal.pageSize.getHeight()
    const leftWidth = width * 0.35
    
    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, leftWidth, height, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('NEKSA PASS', 20, 20)
    
    try {
      const qrDataUrl = await QRCode.toDataURL(user.id.toString(), { margin: 2, width: 500 })
      doc.addImage(qrDataUrl, 'PNG', (leftWidth - 60) / 2, 60, 60, 60)
      doc.setFont('courier', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text(`ID: ${user.id}`.toUpperCase(), (leftWidth - doc.getTextWidth(`ID: ${user.id}`.toUpperCase())) / 2, 130)
    } catch (err) {}

    const rightMargin = leftWidth + 20
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('OFFICIAL EVENT TICKET', rightMargin, 20)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(28)
    doc.text(event.name.substring(0, 25), rightMargin, 35)
    doc.setDrawColor(200, 200, 200)
    doc.line(rightMargin, 45, width - 20, 45)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('ATTENDEE', rightMargin, 60)
    doc.setFontSize(22)
    doc.setTextColor(0, 0, 0)
    doc.text(user.full_name, rightMargin, 72)
    if (user.title && user.title !== '-') {
        doc.setFontSize(14)
        doc.setTextColor(80, 80, 80)
        doc.text(user.title.toUpperCase(), rightMargin, 80)
    }
    const gridY = 110
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('DATE', rightMargin, gridY)
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(new Date(event.date).toLocaleDateString(), rightMargin, gridY + 10)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('LOCATION', rightMargin + 80, gridY)
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(doc.splitTextToSize(event.address, 90), rightMargin + 80, gridY + 10)
    return doc
  }

  const handleViewTicket = async (user: any) => {
    const doc = await createPdfDoc(user)
    window.open(doc.output('bloburl'), '_blank')
  }

  const handleDownloadTicket = async (user: any) => {
    const doc = await createPdfDoc(user)
    doc.save(`${user.full_name}_ticket.pdf`)
  }

  const handleExportCsv = () => {
    if (registrations.length === 0) {
      alert('No data to export')
      return
    }

    // Prepare CSV headers
    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Title',
      'Phone',
      'DOB',
      'Gender',
      'Status',
      'Created At'
    ]

    // Convert registrations to CSV rows
    const csvContent = [
      headers.join(','), // Header row
      ...registrations.map(reg => [
        reg.id,
        `"${reg.full_name || ''}"`, // Wrap in quotes to handle commas
        `"${reg.email || ''}"`,
        `"${reg.title || ''}"`,
        `"${reg.phone || ''}"`,
        `"${reg.dob || ''}"`,
        `"${reg.gender || ''}"`,
        reg.status,
        `"${new Date(reg.created_at).toLocaleString()}"`
      ].join(','))
    ].join('\n')

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${event.name.replace(/[^a-z0-9]/gi, '_')}_registrations.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

// -------------------------
  // 4. SCANNER LOGIC
  // -------------------------
  const handleScan = async (result: any) => {
    if (result && result[0]?.rawValue && isScanning) {
        const ticketId = result[0].rawValue
        setIsScanning(false) // Pause scanner

        // 1. Update Database
        const { error } = await supabase
            .from('registrations')
            .update({ status: 'attended' })
            .eq('id', ticketId)
            .eq('event_id', eventId)

        if (error) {
            alert('Error: ' + error.message)
            setIsScanning(true) // Resume if failed
        } else {
            // 2. Fetch the specific user to show "Checked In" card
            const { data } = await supabase.from('registrations').select('*').eq('id', ticketId).single()
            setLastScan(data)
            
            // 3. CRITICAL FIX: Refresh the main list immediately!
            fetchRegistrations() 

            // 4. Play Sound
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
            <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden flex flex-col">
                
                {/* TOOLBAR: SEARCH & CSV */}
                <div className="p-4 border-b border-[#333] flex flex-col md:flex-row justify-between items-center gap-4 bg-[#161616]">
                    
                    {/* SEARCH BAR */}
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search name, email, or title..." 
                            className="w-full bg-[#000] border border-[#333] rounded-lg py-2 pl-10 pr-4 text-white focus:border-green-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-gray-400 text-sm">Total: {registrations.length}</h3>
                        <label className="flex items-center gap-2 bg-[#222] hover:bg-[#333] border border-[#444] px-4 py-2 rounded-lg cursor-pointer transition">
                            <Upload size={16} />
                            <span className="text-sm font-bold">Import CSV</span>
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </label>
                        <button 
                            onClick={handleExportCsv}
                            className="flex items-center gap-2 bg-[#222] hover:bg-[#333] border border-[#444] px-4 py-2 rounded-lg cursor-pointer transition"
                        >
                            <Download size={16} />
                            <span className="text-sm font-bold">Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#1a1a1a] text-gray-500 border-b border-[#333]">
                            <tr>
                                <th className="p-4 w-1/3 cursor-pointer hover:text-white" onClick={() => requestSort('full_name')}>
                                    <div className="flex items-center gap-1">Name <ArrowUpDown size={14}/></div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-white" onClick={() => requestSort('title')}>
                                    <div className="flex items-center gap-1">Title <ArrowUpDown size={14}/></div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-white" onClick={() => requestSort('status')}>
                                    <div className="flex items-center gap-1">Status <ArrowUpDown size={14}/></div>
                                </th>
                                <th className="p-4 text-right">Ticket Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222]">
                            {paginatedRegistrations.length > 0 ? (
                                paginatedRegistrations.map(reg => (
                                    <tr key={reg.id} className="hover:bg-[#161616] transition">
                                        <td className="p-4 font-bold">
                                            {reg.full_name} 
                                            <br/><span className="text-xs text-gray-500 font-normal">{reg.email}</span>
                                        </td>
                                        <td className="p-4 text-gray-400">{reg.title}</td>
                                        <td className="p-4">
                                            <select 
                                                value={reg.status}
                                                onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                                                className={`px-3 py-1.5 rounded text-xs uppercase font-bold border outline-none cursor-pointer transition ${
                                                    reg.status === 'attended' 
                                                    ? 'bg-green-900/50 text-green-300 border-green-800 hover:bg-green-900' 
                                                    : 'bg-yellow-900/50 text-yellow-500 border-yellow-800 hover:bg-yellow-900'
                                                }`}
                                            >
                                                <option value="pending" className="bg-black text-yellow-500">PENDING</option>
                                                <option value="attended" className="bg-black text-green-500">ATTENDED</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleViewTicket(reg)} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded transition" title="View Ticket"><Eye size={18} /></button>
                                                <button onClick={() => handleDownloadTicket(reg)} className="p-2 text-green-400 hover:bg-green-900/30 rounded transition" title="Download PDF"><Download size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No registrations found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-[#333] flex justify-between items-center bg-[#161616]">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded hover:bg-[#333] disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm text-gray-400">
                            Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded hover:bg-[#333] disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* SCANNER TAB */}
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
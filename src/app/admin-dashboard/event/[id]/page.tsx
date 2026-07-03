'use client'
import { useEffect, useState, use, useMemo } from 'react'
import { branding } from '../../../../lib/branding'
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, QrCode, List, UserCheck, Upload, Download, Eye, Search, ArrowUpDown } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'
import Papa from 'papaparse'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import Button from '../../../../components/Button/Button'
import styles from '../../../../styles/shared.module.css'
import admin from '../../../../styles/admin.module.css'
import btnStyles from '../../../../components/Button/Button.module.css'

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id
  const router = useRouter()

  const [event, setEvent] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'rsvp' | 'scan'>('rsvp')
  const [registrations, setRegistrations] = useState<any[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [lastScan, setLastScan] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(true)

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

  const filteredRegistrations = useMemo(() => {
    let data = [...registrations]

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      data = data.filter(reg =>
        (reg.full_name?.toLowerCase() || '').includes(lowerTerm) ||
        (reg.email?.toLowerCase() || '').includes(lowerTerm) ||
        (reg.title?.toLowerCase() || '').includes(lowerTerm)
      )
    }

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

  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage)
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[]
        const errors: string[] = []

        const formattedRows = rows.map((row, index) => {
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
        }).filter(Boolean)

        if (errors.length > 0) {
          alert(`Import completed with ${errors.length} error(s):\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n\n...and more errors' : ''}`)
        }

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

  const createPdfDoc = async (user: any) => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' })
    const width = doc.internal.pageSize.getWidth()
    const height = doc.internal.pageSize.getHeight()
    const leftWidth = width * 0.35

    doc.setFillColor(15, 92, 92)
    doc.rect(0, 0, leftWidth, height, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(branding.ticketLabel, 20, 20)

    try {
      const qrDataUrl = await QRCode.toDataURL(user.id.toString(), { margin: 2, width: 500 })
      doc.addImage(qrDataUrl, 'PNG', (leftWidth - 60) / 2, 60, 60, 60)
      doc.setFont('courier', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(200, 200, 200)
      doc.text(`ID: ${user.id}`.toUpperCase(), (leftWidth - doc.getTextWidth(`ID: ${user.id}`.toUpperCase())) / 2, 130)
    } catch (err) {}

    const rightMargin = leftWidth + 20
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('OFFICIAL EVENT TICKET', rightMargin, 20)
    doc.setTextColor(28, 43, 43)
    doc.setFontSize(28)
    doc.text(event.name.substring(0, 25), rightMargin, 35)
    doc.setDrawColor(200, 200, 200)
    doc.line(rightMargin, 45, width - 20, 45)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('ATTENDEE', rightMargin, 60)
    doc.setFontSize(22)
    doc.setTextColor(28, 43, 43)
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
    doc.setTextColor(28, 43, 43)
    doc.text(new Date(event.date).toLocaleDateString(), rightMargin, gridY + 10)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('LOCATION', rightMargin + 80, gridY)
    doc.setFontSize(14)
    doc.setTextColor(28, 43, 43)
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

    const headers = ['ID', 'Full Name', 'Email', 'Title', 'Phone', 'DOB', 'Gender', 'Status', 'Created At']
    const csvContent = [
      headers.join(','),
      ...registrations.map(reg => [
        reg.id,
        `"${reg.full_name || ''}"`,
        `"${reg.email || ''}"`,
        `"${reg.title || ''}"`,
        `"${reg.phone || ''}"`,
        `"${reg.dob || ''}"`,
        `"${reg.gender || ''}"`,
        reg.status,
        `"${new Date(reg.created_at).toLocaleString()}"`
      ].join(','))
    ].join('\n')

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

  const handleScan = async (result: any) => {
    if (result && result[0]?.rawValue && isScanning) {
      const ticketId = result[0].rawValue
      setIsScanning(false)

      const { error } = await supabase
        .from('registrations')
        .update({ status: 'attended' })
        .eq('id', ticketId)
        .eq('event_id', eventId)

      if (error) {
        alert('Error: ' + error.message)
        setIsScanning(true)
      } else {
        const { data } = await supabase.from('registrations').select('*').eq('id', ticketId).single()
        setLastScan(data)
        fetchRegistrations()
        new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3').play().catch(() => {})
      }
    }
  }

  const resetScanner = () => {
    setLastScan(null)
    setIsScanning(true)
  }

  if (!event) return <div className={styles.loading}>Loading...</div>

  return (
    <div className={styles.page}>
      <div className={admin.detailHeader}>
        <div className={admin.detailHeaderTop}>
          <button onClick={() => router.push('/admin-dashboard')} className={admin.backLink}>
            <ChevronLeft size={18} /> Back to Events
          </button>
          <div className={admin.tabs}>
            <button
              onClick={() => setActiveTab('rsvp')}
              className={`${admin.tab} ${activeTab === 'rsvp' ? admin.tabActive : ''}`}
            >
              <List size={16} /> RSVP List
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`${admin.tab} ${activeTab === 'scan' ? admin.tabActive : ''}`}
            >
              <QrCode size={16} /> Scanner
            </button>
          </div>
        </div>
        <h1 className={admin.detailTitle}>{event.name}</h1>
      </div>

      <div className={admin.detailBody}>
        {activeTab === 'rsvp' && (
          <div className={admin.panel}>
            <div className={admin.toolbar}>
              <div className={admin.searchWrap}>
                <Search className={admin.searchIcon} size={16} />
                <input
                  type="text"
                  placeholder="Search name, email, or title..."
                  className={admin.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={admin.toolbarActions}>
                <span className={admin.totalCount}>Total: {registrations.length}</span>
                <label className={admin.toolBtn}>
                  <Upload size={15} />
                  Import CSV
                  <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
                </label>
                <button onClick={handleExportCsv} className={admin.toolBtn}>
                  <Download size={15} />
                  Export CSV
                </button>
              </div>
            </div>

            <div className={admin.tableWrap}>
              <table className={admin.table}>
                <thead>
                  <tr>
                    <th onClick={() => requestSort('full_name')}>
                      <span className={admin.thContent}>Name <ArrowUpDown size={12} /></span>
                    </th>
                    <th onClick={() => requestSort('title')}>
                      <span className={admin.thContent}>Title <ArrowUpDown size={12} /></span>
                    </th>
                    <th onClick={() => requestSort('status')}>
                      <span className={admin.thContent}>Status <ArrowUpDown size={12} /></span>
                    </th>
                    <th style={{ textAlign: 'right' }}>Ticket Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRegistrations.length > 0 ? (
                    paginatedRegistrations.map(reg => (
                      <tr key={reg.id}>
                        <td className={admin.nameCell}>
                          {reg.full_name}
                          <br /><span className={admin.emailSub}>{reg.email}</span>
                        </td>
                        <td>{reg.title}</td>
                        <td>
                          <select
                            value={reg.status}
                            onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                            className={`${admin.statusSelect} ${reg.status === 'attended' ? admin.statusAttended : admin.statusPending}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="attended">Attended</option>
                          </select>
                        </td>
                        <td>
                          <div className={admin.actionBtns}>
                            <button onClick={() => handleViewTicket(reg)} className={`${admin.actionBtn} ${admin.actionBtnView}`} title="View Ticket">
                              <Eye size={17} />
                            </button>
                            <button onClick={() => handleDownloadTicket(reg)} className={`${admin.actionBtn} ${admin.actionBtnDownload}`} title="Download PDF">
                              <Download size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className={admin.emptyRow}>
                        No registrations found{searchTerm ? ` matching "${searchTerm}"` : ''}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={admin.pagination}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={admin.pageBtn}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className={admin.pageInfo}>
                  Page <strong>{currentPage}</strong> of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={admin.pageBtn}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scan' && (
          <div className={admin.scannerPanel}>
            {!lastScan ? (
              <>
                <div className={`${styles.scannerBox} ${isScanning ? '' : ''}`}>
                  <Scanner onScan={handleScan} paused={!isScanning} />
                </div>
                <p className={admin.scannerHint}>Point camera at user QR code</p>
              </>
            ) : (
              <div className={admin.checkinCard}>
                <UserCheck size={56} className={admin.checkinIcon} />
                <h2 className={admin.checkinTitle}>Checked In!</h2>
                <p className={admin.checkinName}>{lastScan.title} {lastScan.full_name}</p>
                <Button onClick={resetScanner} className={btnStyles.fullWidth}>Scan Next Person</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState, use, useMemo } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, QrCode, List, UserCheck, Upload, Download, Eye, Search, ArrowUpDown, User, Pencil, Trash2, Globe, EyeOff } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'
import Papa from 'papaparse'
import { createTicketPdf } from '../../../../lib/ticketPdf'
import { formatEventDateTime, EventRecord, resolvePublishedStatus } from '../../../../lib/events'
import { getEventStatus } from '../../../../lib/eventList'
import { deleteEvent } from '../../../../lib/eventImage'
import Button from '../../../../components/Button/Button'
import EventFormModal from '../../../../components/EventFormModal/EventFormModal'
import VisitorDetailModal from '../../../../components/VisitorDetailModal/VisitorDetailModal'
import {
  RegistrationRecord,
  displayValue,
  formatDob,
  formatRegistrationDate,
  getTicketCode,
  parseScannedTicket,
} from '../../../../lib/registrations'
import styles from '../../../../styles/shared.module.css'
import admin from '../../../../styles/admin.module.css'
import btnStyles from '../../../../components/Button/Button.module.css'

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id
  const router = useRouter()

  const [event, setEvent] = useState<EventRecord | null>(null)
  const [activeTab, setActiveTab] = useState<'rsvp' | 'scan'>('rsvp')
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof RegistrationRecord; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [lastScan, setLastScan] = useState<RegistrationRecord | null>(null)
  const [isScanning, setIsScanning] = useState(true)
  const [selectedVisitor, setSelectedVisitor] = useState<RegistrationRecord | null>(null)

  const fetchEvent = async () => {
    const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
    if (data) setEvent(data)
  }

  useEffect(() => {
    async function loadData() {
      await fetchEvent()
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
        (reg.title?.toLowerCase() || '').includes(lowerTerm) ||
        (reg.phone?.toLowerCase() || '').includes(lowerTerm)
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

  const requestSort = (key: keyof RegistrationRecord) => {
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
          const capacity = event?.capacity
          const remaining = capacity != null
            ? Math.max(0, capacity - registrations.length)
            : formattedRows.length
          const rowsToInsert = capacity != null
            ? formattedRows.slice(0, remaining)
            : formattedRows

          if (capacity != null && formattedRows.length > remaining) {
            alert(`Only ${remaining} spot(s) available. Importing ${rowsToInsert.length} of ${formattedRows.length} row(s).`)
          } else {
            alert(`Successfully imported ${rowsToInsert.length} users!${errors.length > 0 ? ' (Some rows were skipped due to errors)' : ''}`)
          }

          if (rowsToInsert.length === 0) {
            alert('No spots available. Event is at capacity.')
            return
          }

          const { error } = await supabase.from('registrations').insert(rowsToInsert)
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

  const handleStatusChange = async (userId: number, newStatus: string) => {
    setRegistrations(prev => prev.map(reg => reg.id === userId ? { ...reg, status: newStatus } : reg))
    setSelectedVisitor(prev => prev?.id === userId ? { ...prev, status: newStatus } : prev)
    const { error } = await supabase.from('registrations').update({ status: newStatus }).eq('id', userId)
    if (error) {
      alert('Failed to update status')
      fetchRegistrations()
    }
  }

  const createPdfDoc = async (user: RegistrationRecord) => {
    if (!event) throw new Error('Event not loaded')
    return createTicketPdf(user, event)
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
    if (!event || registrations.length === 0) {
      alert(registrations.length === 0 ? 'No data to export' : 'Event not loaded')
      return
    }

    const headers = ['Ticket ID', 'Full Name', 'Email', 'Title', 'Phone', 'DOB', 'Gender', 'Status', 'Created At']
    const csvContent = [
      headers.join(','),
      ...registrations.map(reg => [
        getTicketCode(reg),
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
      const rawValue = result[0].rawValue
      const parsed = parseScannedTicket(rawValue)
      if (!parsed) {
        alert('Invalid ticket QR code')
        return
      }

      if ('eventId' in parsed && parsed.eventId !== Number(eventId)) {
        alert('This ticket is for a different event')
        return
      }

      setIsScanning(false)

      let query = supabase
        .from('registrations')
        .update({ status: 'attended' })
        .eq('event_id', eventId)

      if ('ticketCode' in parsed) {
        query = query.eq('ticket_code', parsed.ticketCode)
      } else {
        query = query.eq('id', parsed.registrationId)
      }

      const { error } = await query

      if (error) {
        alert('Error: ' + error.message)
        setIsScanning(true)
      } else {
        let fetchQuery = supabase.from('registrations').select('*').eq('event_id', eventId)
        if ('ticketCode' in parsed) {
          fetchQuery = fetchQuery.eq('ticket_code', parsed.ticketCode)
        } else {
          fetchQuery = fetchQuery.eq('id', parsed.registrationId)
        }
        const { data } = await fetchQuery.single()
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

  const handleDeleteEvent = async () => {
    if (!event) return

    const registrationNote =
      registrations.length > 0
        ? ` This will also permanently delete ${registrations.length} registration(s).`
        : ''

    const confirmed = window.confirm(
      `Delete "${event.name}"?${registrationNote} This action cannot be undone.`
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteEvent(event)
      router.push('/admin-dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete event'
      alert(message)
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!event) return

    const isDraft = event.status === 'draft'
    const confirmed = window.confirm(
      isDraft
        ? `Activate "${event.name}"? It will be visible on the public site.`
        : `Move "${event.name}" to draft? It will be hidden from the public site.`
    )
    if (!confirmed) return

    setIsTogglingStatus(true)
    const newStatus = isDraft ? resolvePublishedStatus(event.date) : 'draft'
    const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', event.id)

    if (error) {
      alert('Failed to update event status: ' + error.message)
    } else {
      setEvent({ ...event, status: newStatus })
    }
    setIsTogglingStatus(false)
  }

  if (!event) return <div className={styles.loading}>Loading...</div>

  const isDraft = event.status === 'draft'
  const eventStatus = getEventStatus(event)

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

        <div className={admin.titleRow}>
          <div>
            <div className={admin.detailTitleRow}>
              <h1 className={admin.detailTitle}>{event.name}</h1>
              <span
                className={`${styles.badge} ${
                  eventStatus === 'draft'
                    ? styles.badgeDraft
                    : eventStatus === 'upcoming'
                      ? styles.badgeGold
                      : styles.badgeMuted
                }`}
              >
                {eventStatus === 'draft' ? 'Draft' : eventStatus === 'upcoming' ? 'Upcoming' : 'Past'}
              </span>
            </div>
            {event.capacity != null && (
              <p className={admin.capacitySummary}>
                {registrations.length} / {event.capacity} registered
              </p>
            )}
          </div>
          <div className={admin.titleActions}>
            <button
              type="button"
              className={admin.editBtn}
              onClick={() => setShowEditModal(true)}
            >
              <Pencil size={16} />
              Edit Event
            </button>
            <button
              type="button"
              className={isDraft ? admin.activateBtn : admin.draftBtn}
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
            >
              {isDraft ? <Globe size={16} /> : <EyeOff size={16} />}
              {isTogglingStatus
                ? 'Updating...'
                : isDraft
                  ? 'Activate Event'
                  : 'Set as Draft'}
            </button>
            <button
              type="button"
              className={admin.deleteBtn}
              onClick={handleDeleteEvent}
              disabled={isDeleting}
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </button>
          </div>
        </div>
      </div>

      <div className={`${admin.detailBody} ${activeTab === 'scan' ? admin.detailBodyScan : ''}`}>
        {activeTab === 'rsvp' && (
          <div className={admin.panel}>
            <div className={admin.toolbar}>
              <div className={admin.searchWrap}>
                <Search className={admin.searchIcon} size={16} />
                <input
                  type="text"
                  placeholder="Search name, email, phone, or title..."
                  className={admin.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={admin.toolbarActions}>
                <span className={admin.totalCount}>
                  Total: {registrations.length}
                  {event.capacity != null ? ` / ${event.capacity}` : ''}
                </span>
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
                    <th onClick={() => requestSort('phone')}>
                      <span className={admin.thContent}>Phone <ArrowUpDown size={12} /></span>
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
                      <tr key={reg.id} className={admin.clickableRow} onClick={() => setSelectedVisitor(reg)}>
                        <td className={admin.nameCell}>
                          {reg.full_name}
                          <br /><span className={admin.emailSub}>{reg.email || '—'}</span>
                        </td>
                        <td>{reg.title || '—'}</td>
                        <td>{reg.phone || '—'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            value={reg.status}
                            onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                            className={`${admin.statusSelect} ${reg.status === 'attended' ? admin.statusAttended : admin.statusPending}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="attended">Attended</option>
                          </select>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className={admin.actionBtns}>
                            <button onClick={() => setSelectedVisitor(reg)} className={`${admin.actionBtn} ${admin.actionBtnDetails}`} title="View Details">
                              <User size={17} />
                            </button>
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
                      <td colSpan={6} className={admin.emptyRow}>
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
                <div className={admin.scannerBox}>
                  <Scanner onScan={handleScan} paused={!isScanning} />
                </div>
                <p className={admin.scannerHint}>Point camera at user QR code</p>
              </>
            ) : (
              <div className={admin.checkinCard}>
                <UserCheck size={56} className={admin.checkinIcon} />
                <h2 className={admin.checkinTitle}>Checked In!</h2>
                <p className={admin.checkinName}>{lastScan.title} {lastScan.full_name}</p>
                <dl className={admin.scanDetails}>
                  <div><dt>Email</dt><dd>{displayValue(lastScan.email)}</dd></div>
                  <div><dt>Phone</dt><dd>{displayValue(lastScan.phone)}</dd></div>
                  <div><dt>DOB</dt><dd>{formatDob(lastScan.dob)}</dd></div>
                  <div><dt>Gender</dt><dd>{displayValue(lastScan.gender)}</dd></div>
                </dl>
                <button type="button" className={admin.viewDetailsLink} onClick={() => setSelectedVisitor(lastScan)}>
                  View full details
                </button>
                <Button onClick={resetScanner} className={btnStyles.fullWidth}>Scan Next Person</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedVisitor && (
        <VisitorDetailModal
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
          onStatusChange={handleStatusChange}
          onViewTicket={handleViewTicket}
          onDownloadTicket={handleDownloadTicket}
        />
      )}

      {showEditModal && event && (
        <EventFormModal
          mode="edit"
          event={event}
          onClose={() => setShowEditModal(false)}
          onSaved={fetchEvent}
        />
      )}
    </div>
  )
}

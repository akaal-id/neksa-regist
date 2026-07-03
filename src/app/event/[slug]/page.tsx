'use client'
import { useEffect, useState, use } from 'react'
import { branding } from '../../../lib/branding'
import { supabase } from '../../../lib/supabaseClient'
import { ChevronLeft, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { Scanner } from '@yudiel/react-qr-scanner'
import { useRouter } from 'next/navigation'
import Button from '../../../components/Button/Button'
import { EditorialInput, EditorialSelect } from '../../../components/ui/editorial-form'
import formStyles from '../../../components/ui/EditorialForm.module.css'
import styles from '../../../styles/shared.module.css'
import btnStyles from '../../../components/Button/Button.module.css'

export default function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()

  const [event, setEvent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'none' | 'register' | 'scan'>('none')

  const [formData, setFormData] = useState({ full_name: '', email: '', title: '', phone: '', dob: '', gender: '' })
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState<any>(null)

  const [scanResult, setScanResult] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    async function loadEvent() {
      try {
        const slugOrId = resolvedParams.slug
        let eventData = null

        const { data: dataBySlug } = await supabase.from('events').select('*').eq('slug', slugOrId).single()

        if (dataBySlug) {
          eventData = dataBySlug
        } else if (!isNaN(Number(slugOrId))) {
          const { data: dataById } = await supabase.from('events').select('*').eq('id', slugOrId).single()
          eventData = dataById
        }

        if (eventData) {
          setEvent(eventData)
        } else {
          setError('Event not found.')
        }
      } catch (err) {
        console.error(err)
        setError('Error loading event.')
      }
    }
    loadEvent()
  }, [resolvedParams.slug])

  const generatePDF = async (user: any, eventData: any) => {
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
      const qrSize = 60
      const qrX = (leftWidth - qrSize) / 2
      doc.addImage(qrDataUrl, 'PNG', qrX, 60, qrSize, qrSize)

      doc.setFont('courier', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(200, 200, 200)
      const idText = `ID: ${user.id}`.toUpperCase()
      doc.text(idText, (leftWidth - doc.getTextWidth(idText)) / 2, 60 + qrSize + 10)
    } catch (err) {
      console.error('QR Error', err)
    }

    const rightMargin = leftWidth + 20

    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('OFFICIAL EVENT TICKET', rightMargin, 20)

    doc.setTextColor(28, 43, 43)
    doc.setFontSize(28)
    const eventName = eventData.name.length > 25 ? eventData.name.substring(0, 25) + '...' : eventData.name
    doc.text(eventName, rightMargin, 35)

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
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(user.email, rightMargin, 88)
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
    doc.setTextColor(28, 43, 43)
    doc.text(new Date(eventData.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }), rightMargin, gridY + 10)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('LOCATION', rightMargin + 80, gridY)
    doc.setFontSize(14)
    doc.setTextColor(28, 43, 43)
    doc.text(doc.splitTextToSize(eventData.address, 90), rightMargin + 80, gridY + 10)

    doc.save(`${user.full_name}_ticket.pdf`)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
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
    if (result && result[0]?.rawValue && isScanning) {
      const id = result[0].rawValue
      setIsScanning(false)

      await supabase.from('registrations').update({ status: 'attended' }).eq('id', id).eq('event_id', event.id)

      const { data } = await supabase.from('registrations').select('*').eq('id', id).single()
      if (data) setScanResult(data)
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setIsScanning(true)
  }

  const closeRegisterModal = () => {
    setModalMode('none')
    setTicketData(null)
    setFormData({ full_name: '', email: '', title: '', phone: '', dob: '', gender: '' })
  }

  if (error) return (
    <div className={styles.errorPage}>
      <h1 className={styles.errorTitle}>Oops!</h1>
      <p className={styles.errorText}>{error}</p>
      <Button variant="secondary" onClick={() => router.push('/')}>Back to Home</Button>
    </div>
  )

  if (!event) return (
    <div className={styles.loading} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading Event...
    </div>
  )

  return (
    <main className={styles.page}>
      <section className={styles.eventHero}>
        <button onClick={() => router.push('/')} className={styles.backBtn}>
          <ChevronLeft size={16} /> All Events
        </button>

        <p className={styles.heroEyebrow}>Open for Registration</p>
        <h1 className={styles.heroTitle}>{event.name}</h1>
        <p className={styles.heroSubtitle}>{event.description || 'Join us for an unforgettable experience.'}</p>

        <div className={styles.eventMeta}>
          <div className={styles.eventMetaItem}>
            <span>Date</span>
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className={styles.eventMetaItem}>
            <span>Location</span>
            <span>{event.address}</span>
          </div>
        </div>

        <div className={styles.ctaRow}>
          <Button variant="yellow" onClick={() => setModalMode('register')}>Register Now</Button>
          <Button variant="outline" onClick={() => setModalMode('scan')}>Scan RSVP</Button>
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerBrand}>{branding.appName}, your RSVP registration system</p>
        <p>© Copyright {branding.copyright} 2026</p>
      </footer>

      {modalMode === 'register' && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.modalWide}`}>
            <button onClick={closeRegisterModal} className={styles.modalBack}>
              <ChevronLeft size={18} /> Back
            </button>

            {!ticketData ? (
              <>
                <h2 className={styles.modalTitle}>Secure your Spot</h2>
                <p className={styles.modalLead}>Fill in your details to receive your entry pass.</p>

                <form onSubmit={handleRegister} className={styles.formBlock}>
                  <div className={formStyles.gridHalf}>
                    <EditorialInput
                      label="Full Name"
                      required
                      placeholder="e.g. Asad Muhammad"
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    />
                    <EditorialInput
                      label="Job Title"
                      required
                      placeholder="e.g. Director"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <EditorialInput
                    label="Email Address"
                    type="email"
                    required
                    placeholder="asad@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />

                  <EditorialInput
                    label="Phone Number"
                    type="tel"
                    placeholder="+62 812..."
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />

                  <div className={formStyles.gridHalf}>
                    <EditorialInput
                      label="Date of Birth"
                      type="date"
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    />
                    <EditorialSelect
                      label="Gender"
                      placeholder="Select"
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      options={[
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                      ]}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className={btnStyles.fullWidth}>
                    {loading ? 'Generating Ticket...' : 'Complete Registration'}
                  </Button>
                </form>
              </>
            ) : (
              <div className={styles.successCenter}>
                <div className={styles.successIcon}>
                  <Check size={36} strokeWidth={2.5} />
                </div>
                <h2 className={styles.modalTitle}>You&apos;re In!</h2>
                <p className={styles.modalLead}>Your ticket has been downloaded automatically.</p>

                <div className={styles.qrBox}>
                  <QRCodeSVG value={ticketData.id.toString()} size={180} />
                  <p className={styles.qrId}>#{ticketData.id}</p>
                </div>

                <button onClick={() => generatePDF(ticketData, event)} className={styles.textLink}>
                  Download Ticket Again
                </button>
                <button onClick={closeRegisterModal} className={styles.textLinkMuted}>
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {modalMode === 'scan' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button onClick={() => { setModalMode('none'); resetScanner() }} className={styles.modalBack}>
              <ChevronLeft size={18} /> Back
            </button>

            <div className={styles.scannerCenter}>
              {!scanResult ? (
                <>
                  <h2 className={styles.modalTitle}>Scan Entry Pass</h2>
                  <div className={styles.scannerBox}>
                    <Scanner onScan={handleScan} paused={!isScanning} />
                    <div className={styles.scannerOverlay} />
                  </div>
                </>
              ) : (
                <>
                  <h2 className={styles.modalTitle}>Welcome!</h2>
                  <div className={styles.scanResultCard}>
                    <p className={styles.scanResultLabel}>Attendee</p>
                    <p className={styles.scanResultName}>{scanResult.title} {scanResult.full_name}</p>
                  </div>
                  <Button onClick={resetScanner} className={btnStyles.fullWidth}>Scan Next Person</Button>
                  <button onClick={() => setModalMode('none')} className={styles.textLinkMuted}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

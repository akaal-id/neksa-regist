'use client'

import { X, Download, Eye } from 'lucide-react'
import {
  RegistrationRecord,
  displayValue,
  formatDob,
  formatRegistrationDate,
  getTicketCode,
  formatTicketCodeDisplay,
} from '../../lib/registrations'
import shared from '../../styles/shared.module.css'
import styles from './VisitorDetailModal.module.css'

type VisitorDetailModalProps = {
  visitor: RegistrationRecord
  onClose: () => void
  onStatusChange: (id: number, status: string) => void
  onViewTicket: (visitor: RegistrationRecord) => void
  onDownloadTicket: (visitor: RegistrationRecord) => void
}

export default function VisitorDetailModal({
  visitor,
  onClose,
  onStatusChange,
  onViewTicket,
  onDownloadTicket,
}: VisitorDetailModalProps) {
  const fields = [
    { label: 'Ticket ID', value: formatTicketCodeDisplay(getTicketCode(visitor)) },
    { label: 'Full Name', value: displayValue(visitor.full_name) },
    { label: 'Title', value: displayValue(visitor.title) },
    { label: 'Email', value: displayValue(visitor.email) },
    { label: 'Phone', value: displayValue(visitor.phone) },
    { label: 'Date of Birth', value: formatDob(visitor.dob) },
    { label: 'Gender', value: displayValue(visitor.gender) },
    { label: 'Registered At', value: formatRegistrationDate(visitor.created_at) },
  ]

  return (
    <div className={shared.modalOverlay} onClick={onClose}>
      <div className={`${shared.modal} ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <p className={styles.eyebrow}>Visitor Details</p>
        <h2 className={shared.modalTitle}>{visitor.full_name}</h2>
        {visitor.title && <p className={styles.subtitle}>{visitor.title}</p>}

        <div className={styles.statusRow}>
          <label className={styles.statusLabel} htmlFor="visitor-status">Status</label>
          <select
            id="visitor-status"
            value={visitor.status}
            onChange={(e) => onStatusChange(visitor.id, e.target.value)}
            className={`${styles.statusSelect} ${visitor.status === 'attended' ? styles.statusAttended : styles.statusPending}`}
          >
            <option value="pending">Pending</option>
            <option value="attended">Attended</option>
          </select>
        </div>

        <dl className={styles.detailGrid}>
          {fields.map((field) => (
            <div key={field.label} className={styles.detailItem}>
              <dt className={styles.detailLabel}>{field.label}</dt>
              <dd className={styles.detailValue}>{field.value}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} onClick={() => onViewTicket(visitor)}>
            <Eye size={16} /> View Ticket
          </button>
          <button type="button" className={styles.actionBtn} onClick={() => onDownloadTicket(visitor)}>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}

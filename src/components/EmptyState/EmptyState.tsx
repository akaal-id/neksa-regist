import Link from 'next/link'
import { CalendarX, Plus } from 'lucide-react'
import styles from '../../styles/shared.module.css'

type EmptyStateProps = {
  title: string
  message: string
  action?: {
    href: string
    label: string
  }
  onAction?: () => void
  actionLabel?: string
}

export default function EmptyState({ title, message, action, onAction, actionLabel }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        {onAction ? <Plus size={28} /> : <CalendarX size={28} />}
      </div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyMessage}>{message}</p>
      {action && (
        <Link href={action.href} className={styles.emptyAction}>
          {action.label}
        </Link>
      )}
      {onAction && actionLabel && (
        <button type="button" className={styles.emptyAction} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

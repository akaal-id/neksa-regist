import styles from '../../styles/shared.module.css'

type EventListHeaderProps = {
  title?: string
  count?: number
  children?: React.ReactNode
}

export default function EventListHeader({ title, count, children }: EventListHeaderProps) {
  if (!title && count === undefined && !children) return null

  return (
    <div className={`${styles.listHeader} ${!title ? styles.listHeaderCompact : ''}`}>
      {(title || count !== undefined) && (
        <div className={styles.listHeaderMeta}>
          {title && <h2 className={styles.sectionHeading}>{title}</h2>}
          {count !== undefined && (
            <span className={styles.sectionCount}>
              {count} {count === 1 ? 'event' : 'events'}
            </span>
          )}
        </div>
      )}
      {children && <div className={styles.listHeaderActions}>{children}</div>}
    </div>
  )
}

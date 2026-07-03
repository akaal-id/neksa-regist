import styles from '../../styles/shared.module.css'

export default function EventCardSkeleton() {
  return (
    <div className={styles.eventCardSkeleton} aria-hidden>
      <div className={`${styles.skeletonBlock} ${styles.skeletonMedia}`} />
      <div className={styles.skeletonBody}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonBadge}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonLine}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonLineShort}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonMeta}`} />
      </div>
    </div>
  )
}

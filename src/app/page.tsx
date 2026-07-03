'use client'

import { Suspense } from 'react'
import HomeContent from './HomeContent'
import EventCardSkeleton from '../components/EventCard/EventCardSkeleton'
import styles from '../styles/shared.module.css'

function HomeLoading() {
  return (
    <main className={styles.page}>
      <section className={`${styles.hero} ${styles.heroCompact}`} />
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.cardGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  )
}

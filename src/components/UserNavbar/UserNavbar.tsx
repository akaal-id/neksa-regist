'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { brand } from '../../lib/brand'
import shared from '../../styles/shared.module.css'
import styles from './UserNavbar.module.css'

function shouldShowUserNavbar(pathname: string) {
  if (pathname.startsWith('/admin')) return false
  if (pathname.startsWith('/event/')) return false
  return pathname === '/' || pathname === '/past-events'
}

export default function UserNavbar() {
  const pathname = usePathname()

  if (!shouldShowUserNavbar(pathname)) {
    return null
  }

  return (
    <header className={styles.navbar}>
      <div className={`${shared.sectionInner} ${styles.inner}`}>
        <a
          href={brand.mainSiteUrl}
          className={styles.backLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.backIcon} aria-hidden>
            <ArrowLeft size={16} strokeWidth={2.25} />
          </span>
          <span className={styles.backLabel}>Back to Halal Expo Indonesia</span>
        </a>

        <div className={styles.logoMark}>
          <Image
            src="/D8-assets/logo_D8_hor_white.svg"
            alt="Halal Expo Indonesia"
            width={88}
            height={28}
            className={styles.logoImage}
            priority
          />
        </div>
      </div>
    </header>
  )
}

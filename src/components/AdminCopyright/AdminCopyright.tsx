import { brand } from '../../lib/brand'
import styles from './AdminCopyright.module.css'

export default function AdminCopyright() {
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>© {brand.copyright}</p>
    </footer>
  )
}

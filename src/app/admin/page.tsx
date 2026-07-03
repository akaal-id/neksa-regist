'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { brand } from '../../lib/brand'
import Button from '../../components/Button/Button'
import { EditorialInput } from '../../components/ui/editorial-form'
import styles from '../../styles/shared.module.css'
import btnStyles from '../../components/Button/Button.module.css'

export default function AdminLogin() {
  const [id, setId] = useState('')
  const [pass, setPass] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (id === 'admin' && pass === 'Asia2025!') {
      localStorage.setItem('isAdmin', 'true')
      router.push('/admin-dashboard')
    } else {
      alert('Invalid Credentials')
    }
  }

  return (
    <div className={styles.loginPage}>
      <form onSubmit={handleLogin} className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>{brand.adminTitle}</h1>
          <p className={styles.loginSubtitle}>Please sign in to continue</p>
        </div>

        <div className={styles.formBlock}>
          <EditorialInput
            label="Admin ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Enter ID"
            required
          />
          <EditorialInput
            label="Password"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Button type="submit" className={btnStyles.fullWidth}>
            Sign In
          </Button>
        </div>
      </form>
    </div>
  )
}

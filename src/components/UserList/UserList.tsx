'use client'
import styles from './UserList.module.css'

// We define what data this component expects
interface User {
  id: number
  full_name: string
  email: string
  status: string
}

export default function UserList({ users }: { users: User[] }) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Recent Registrations</h3>
      <div className={styles.list}>
        {users.length === 0 ? (
          <p className={styles.empty}>No registrations yet.</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className={styles.card}>
              <div>
                <span className={styles.name}>{user.full_name}</span>
                <span className={styles.email}>{user.email}</span>
              </div>
              <span className={`${styles.badge} ${user.status === 'approved' ? styles.approved : styles.pending}`}>
                {user.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
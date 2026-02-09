'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { QRCodeSVG } from 'qrcode.react' // Use SVG for better quality
import styles from './RegistrationForm.module.css'

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    title: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Select Gender'
  })
  
  const [loading, setLoading] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null) // If set, show QR

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Insert data and return the ID (needed for QR)
    const { data, error } = await supabase
      .from('registrations')
      .insert([{
        full_name: formData.full_name,
        title: formData.title,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob || null, // Handle empty date
        gender: formData.gender === 'Select Gender' ? null : formData.gender
      }])
      .select() // Ask Supabase to return the new row
      .single()

    if (error) {
      alert('Error: ' + error.message)
    } else {
      // Success! Show QR code
      setTicketId(data.id.toString())
    }
    setLoading(false)
  }

  // View: Success / QR Code
  if (ticketId) {
    return (
      <div className={styles.container}>
        <div className={styles.successContainer}>
          <h2 className={styles.successTitle}>Registration Successful!</h2>
          <div className={styles.qrWrapper}>
            <QRCodeSVG value={ticketId} size={200} />
          </div>
          <p className={styles.ticketInfo}>
            Here is your event ticket.<br/>
            Please save this QR code.
          </p>
          <button 
            onClick={() => window.print()} 
            className={styles.downloadBtn}
          >
            Download / Print Ticket
          </button>
        </div>
      </div>
    )
  }

  // View: Registration Form
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Event Registration</h2>
        <p className={styles.subtitle}>Enter your details to secure your spot.</p>
      </div>
      
      <form onSubmit={handleRegister} className={styles.form}>
        
        {/* Row 1: Title & Name */}
        <div className={styles.row}>
          <div className={styles.group} style={{ flex: '0 0 80px' }}>
            <label className={`${styles.label} ${styles.mandatory}`}>Title</label>
            <input 
              name="title" 
              className={styles.input} 
              placeholder="Mr." 
              required 
              onChange={handleChange}
            />
          </div>
          <div className={styles.group}>
            <label className={`${styles.label} ${styles.mandatory}`}>Full Name</label>
            <input 
              name="full_name" 
              className={styles.input} 
              placeholder="John Doe" 
              required 
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Row 2: Email & Phone */}
        <div className={styles.group}>
          <label className={styles.label}>Email Address</label>
          <input 
            type="email" 
            name="email" 
            className={styles.input} 
            placeholder="john@example.com" 
            onChange={handleChange}
          />
        </div>
        
        <div className={styles.group}>
          <label className={styles.label}>Phone Number</label>
          <input 
            type="tel" 
            name="phone" 
            className={styles.input} 
            placeholder="+62..." 
            onChange={handleChange}
          />
        </div>

        {/* Row 3: DOB & Gender */}
        <div className={styles.row}>
          <div className={styles.group}>
            <label className={styles.label}>Date of Birth</label>
            <input 
              type="date" 
              name="dob" 
              className={styles.input} 
              onChange={handleChange}
            />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Gender</label>
            <select name="gender" className={styles.select} onChange={handleChange}>
              <option>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Processing...' : 'Get My Ticket'}
        </button>
      </form>
    </div>
  )
}
'use client';

import Image from 'next/image';
import { Mail, CheckCircle, Phone } from 'lucide-react';
import Button from '../Button/Button';
import styles from './Footer.module.css';
import { useGoogleForm } from '../../hooks/useGoogleForm';
import { brand } from '../../lib/brand';

export default function Footer() {
  const { email, setEmail, status, handleSubmit, resetForm } = useGoogleForm();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.columnLeft}>
            <div className={styles.logo}>
              <Image
                src="/D8-assets/logo_D8_hor_white.svg"
                alt="HEI 2026"
                width={120}
                height={60}
                style={{ width: 'auto', height: '60px' }}
              />
            </div>
            <h4 className={styles.heading}>Headoffice</h4>
            <a
              href="https://maps.app.goo.gl/aAbeEmPSP51X9QcU6"
              className={styles.text}
              target="_blank"
              rel="noopener noreferrer"
            >
              Jl. Gotong Royong I No.50 RT.03/RW.01,<br />
              Ragunan, Ps. Minggu, Kota Jakarta Selatan,<br />
              Daerah Khusus Ibukota Jakarta 12550
            </a>
          </div>

          <div className={styles.columnRight}>
            <h4 className={styles.mainHeading} style={{ color: '#F5F5F5' }}>
              Get our latest updates, <span style={{ color: '#7CC6C6' }}>here!</span>
            </h4>

            {status === 'success' ? (
              <div className={styles.successContainer}>
                <p className={styles.successMessage}>Thank you! You&apos;ve been subscribed.</p>
                <Button
                  onClick={resetForm}
                  className={styles.subscribeButton}
                  textClassName={styles.subscribeButtonText}
                  iconClassName={styles.subscribeButtonIcon}
                  icon={CheckCircle}
                >
                  Add another email
                </Button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="YOUR EMAIL HERE"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === 'submitting'}
                />
                <Button
                  icon={Mail}
                  className={styles.subscribeButton}
                  textClassName={styles.subscribeButtonText}
                  iconClassName={styles.subscribeButtonIcon}
                  type="submit"
                >
                  {status === 'submitting' ? 'Sending...' : 'Subscribe'}
                </Button>
              </form>
            )}
          </div>

          <div className={styles.contactGroup}>
            <h4 className={styles.heading}>Contact us</h4>
            <h5 className={styles.contactLabel}>Sales</h5>
            <a href="https://wa.me/62895403824515" className={styles.link} target="_blank" rel="noopener noreferrer">
              <Phone size={14} /> +62 895-4038-24515
            </a>
            <a href="mailto:Sales@halalexpoindonesia.com" className={styles.link}>
              <Mail size={14} /> Sales@halalexpoindonesia.com
            </a>
          </div>

          <div className={`${styles.contactGroup} ${styles.contactGroupAligned}`}>
            <h5 className={styles.contactLabel}>Marketing</h5>
            <a href="https://wa.me/62895428247935" className={styles.link} target="_blank" rel="noopener noreferrer">
              <Phone size={14} /> +62 895-4282-47935
            </a>
            <a href="mailto:marketing@halalexpoindonesia.com" className={styles.link}>
              <Mail size={14} /> marketing@halalexpoindonesia.com
            </a>
          </div>

          <div className={`${styles.contactGroup} ${styles.contactGroupAligned}`}>
            <h5 className={styles.contactLabel}>Inquiries</h5>
            <a href="https://wa.me/62895428247935" className={styles.link} target="_blank" rel="noopener noreferrer">
              <Phone size={14} /> +62 895-4282-47935
            </a>
            <a href="mailto:Inquiries@halalexpoindonesia.com" className={styles.link}>
              <Mail size={14} /> Inquiries@halalexpoindonesia.com
            </a>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottomSection}>
          <p className={styles.copyright}>
            © {brand.copyright}. All rights reserved. - Managed and Designed by Akaal Creative.
          </p>
          <div className={styles.legalLinks}>
            <a href={`${brand.mainSiteUrl}/faq`} className={styles.legalLink} target="_blank" rel="noopener noreferrer">FAQ</a>
            <a href={`${brand.mainSiteUrl}/privacy`} className={styles.legalLink} target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href={`${brand.mainSiteUrl}/terms`} className={styles.legalLink} target="_blank" rel="noopener noreferrer">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

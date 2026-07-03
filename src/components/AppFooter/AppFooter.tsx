'use client'

import { usePathname } from 'next/navigation'
import Footer from '../Footer/Footer'
import AdminCopyright from '../AdminCopyright/AdminCopyright'

function isAdminRoute(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin-dashboard')
}

export default function AppFooter() {
  const pathname = usePathname()

  if (isAdminRoute(pathname)) {
    return <AdminCopyright />
  }

  return <Footer />
}

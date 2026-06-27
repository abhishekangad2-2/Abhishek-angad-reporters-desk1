'use client'

import { usePathname } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import LiveDispatchesWidget from '@/components/LiveDispatchesWidget'
import FooterTabs from '@/components/FooterTabs'

// Public-site chrome (language switcher, live dispatches, footer tabs).
// Suppressed on the admin/login surfaces so the editor login and CMS panel
// render clean, without the reader-facing widgets piled on top.
export default function SiteChrome({ current }: { current: string }) {
  const pathname = usePathname() || ''
  const isAdminSurface = pathname.startsWith('/admin-login') || pathname.startsWith('/cms')
  if (isAdminSurface) return null

  return (
    <>
      <LanguageSwitcher current={current} />
      <LiveDispatchesWidget />
      <FooterTabs />
    </>
  )
}

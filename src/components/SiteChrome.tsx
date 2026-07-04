'use client'

import { usePathname } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import LiveDispatches from '@/components/LiveDispatches'
import FooterTabs from '@/components/FooterTabs'
import ReaderSettings from '@/components/ReaderSettings'

// Public-site chrome (language switcher, reader accessibility gear, live
// dispatches, footer tabs). Suppressed on the admin/login surfaces so the
// editor login and CMS panel render clean, without the reader-facing widgets
// piled on top.
export default function SiteChrome({ current }: { current: string }) {
  const pathname = usePathname() || ''
  const isAdminSurface = pathname.startsWith('/admin-login') || pathname.startsWith('/cms')
  if (isAdminSurface) return null

  return (
    <>
      <LanguageSwitcher current={current} />
      <ReaderSettings />
      <LiveDispatches />
      <FooterTabs />
    </>
  )
}

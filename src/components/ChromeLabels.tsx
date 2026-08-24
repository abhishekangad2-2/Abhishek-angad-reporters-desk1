'use client'

import { createContext, useContext } from 'react'
import { CHROME_DEFAULT, type ChromeLabels } from '@/lib/chrome'

// Translated site-chrome labels, computed server-side from the locale cookie in
// the root layout and provided to the client chrome (masthead nav, footer tabs).
const ChromeContext = createContext<ChromeLabels>({ ...CHROME_DEFAULT })

export function ChromeProvider({
  value,
  children,
}: {
  value: ChromeLabels
  children: React.ReactNode
}) {
  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>
}

export function useChrome(): ChromeLabels {
  return useContext(ChromeContext)
}

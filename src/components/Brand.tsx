'use client'

import { createContext, useContext } from 'react'

// Which imprint the current request is being served as, decided server-side
// from the Host header in the root layout. thelongpress.org renders as the
// LongPress book-review imprint; every other host is Reporters Desk. Provided
// to the shared client chrome (masthead, footer) so one shell serves both.
export type Brand = 'reportersdesk' | 'longpress'

const BrandContext = createContext<Brand>('reportersdesk')

export function BrandProvider({ value, children }: { value: Brand; children: React.ReactNode }) {
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export function useBrand(): Brand {
  return useContext(BrandContext)
}

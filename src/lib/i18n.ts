// Pure, client+server safe locale config for the public multilingual site.
export type Locale = {
  code: string
  label: string // English name
  native: string // endonym
  dir?: 'rtl'
}

// English is the source; the rest are machine-translated (Vertex). Indian
// languages first, then a few global ones. Extend this list to add a language.
export const LOCALES: Locale[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'zh', label: 'Chinese', native: '中文' },
]

export const DEFAULT_LOCALE = 'en'
export const LOCALE_COOKIE = 'rd_lang'

export function isLocale(code: unknown): code is string {
  return typeof code === 'string' && LOCALES.some((l) => l.code === code)
}

export function localeByCode(code: string): Locale {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0]
}

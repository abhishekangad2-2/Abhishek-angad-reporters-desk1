'use client'

// One-tap "Broadcast on WhatsApp". Opens WhatsApp (app on mobile, web on
// desktop) with the message pre-written; the user then picks a broadcast list
// or chats and sends. This is the only way to reach a personal broadcast list
// programmatically — Meta gives no send API for it — so we prepare the message
// and hand off to the app. No accounts, no cost, no opt-in list required.
export default function WhatsAppBroadcast({
  text,
  label = 'Broadcast on WhatsApp',
  block = false,
}: {
  text: string
  label?: string
  /** Full-width pill (story pages) vs inline (composer). */
  block?: boolean
}) {
  const href = `https://wa.me/?text=${encodeURIComponent(text)}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: block ? 'flex' : 'inline-flex',
        width: block ? '100%' : undefined,
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.7rem 1.1rem',
        borderRadius: 999,
        background: '#25D366',
        color: '#0a2b17',
        fontWeight: 600,
        fontSize: '0.9rem',
        textDecoration: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-ibm-plex-sans, system-ui, sans-serif)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.53.07-.8.38-.27.3-1.05 1.02-1.05 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.02 21.5h-.01a9.44 9.44 0 0 1-4.8-1.32l-.35-.2-3.57.94.95-3.48-.22-.36a9.42 9.42 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.9.98 6.68 2.77a9.4 9.4 0 0 1 2.77 6.68c0 5.2-4.24 9.45-9.46 9.45zM20.5 3.49A11.35 11.35 0 0 0 12.02.01C5.76.01.68 5.09.68 11.34c0 2 .52 3.95 1.52 5.67L.58 23l6.13-1.6a11.3 11.3 0 0 0 5.4 1.38h.01c6.26 0 11.34-5.08 11.34-11.33 0-3.03-1.18-5.88-3.32-8.02z" />
      </svg>
      {label}
    </a>
  )
}

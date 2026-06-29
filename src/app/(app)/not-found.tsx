import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <h2 className="text-4xl font-serif font-black mb-4">404 - Not Found</h2>
      <p className="text-xl text-stone-600 mb-8">We could not find the page you were looking for.</p>
      <Link href="/" className="px-6 py-3 bg-stone-900 text-white font-bold tracking-widest uppercase text-sm hover:bg-stone-800 transition-colors">
        Return Home
      </Link>
    </div>
  )
}

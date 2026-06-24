import Link from 'next/link'
import PlexusBackground from '@/components/PlexusBackground'
import { getPayload } from 'payload'
import config from '@/payload.config'

import { SECTIONS } from '@/lib/sections'

export const dynamic = 'force-dynamic'

async function getSections() {
  return SECTIONS
}

export default async function Home() {
  const sections = await getSections()

  return (
    <div className="relative min-h-screen font-sans selection:bg-stone-300 selection:text-stone-900">
      {/* 3D WebGL Background Component */}
      <PlexusBackground />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-6 md:px-12 py-24 flex flex-col min-h-screen">
        
        {/* Navigation & Admin Link */}
        <header className="flex justify-between items-center mb-24 border-b border-stone-300 pb-6">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500">
            Est. 2026
          </div>
          <Link 
            href="/admin" 
            className="text-xs uppercase tracking-widest font-bold border border-stone-900 px-6 py-2 hover:bg-stone-900 hover:text-stone-50 transition-colors duration-300"
          >
            Editor Login (CMS)
          </Link>
        </header>

        {/* Masthead */}
        <div className="flex-1 flex flex-col justify-center max-w-5xl">
          <h2 className="text-stone-500 font-serif italic text-2xl md:text-3xl mb-4">
            Abhishek Angad Ink.
          </h2>
          <h1 className="text-7xl md:text-9xl font-serif font-black tracking-tighter uppercase leading-[0.85] text-stone-900 mix-blend-multiply">
            Reporters <br /> Desk
          </h1>
          <p className="mt-8 text-xl md:text-2xl font-sans font-light text-stone-600 max-w-2xl leading-relaxed">
            A unified intelligence platform for high-stakes investigative journalism. Featuring immersive narratives, live ground dispatches, and an iron-clad editorial workflow.
          </p>
        </div>

        {/* Editorial Desks Grid */}
        <div className="mt-32">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-stone-900 flex-1"></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900">The Editorial Desks</h3>
            <div className="h-px bg-stone-900 flex-1"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
            {sections.map((section: any, idx: number) => (
              <Link key={section.id} href={`/${section.slug}`} className="group cursor-pointer no-underline">
                <div className="text-stone-400 font-serif text-5xl mb-2 group-hover:text-stone-900 transition-colors duration-500">
                  0{idx + 1}
                </div>
                <h4 className="text-lg font-bold font-sans uppercase tracking-wide text-stone-900 mb-2 group-hover:underline underline-offset-4">
                  {section.name}
                </h4>
                <p className="text-sm text-stone-600 font-sans leading-relaxed">
                  {section.description || `Archives and live reports from the ${section.name} desk.`}
                </p>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}

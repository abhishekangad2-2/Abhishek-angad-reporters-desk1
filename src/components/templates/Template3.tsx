import React from 'react';
import Image from 'next/image';
import { Story } from '@/payload-types';
import { LayoutRenderer } from '@/components/LexicalRenderer';

export default function Template3({ story }: { story: Story }) {
  const heroMediaUrl = story.heroMedia && typeof story.heroMedia === 'object' && 'url' in story.heroMedia ? story.heroMedia.url : null;
  const sectionName = story.section ?? 'Feature';

  return (
    <div className="landing landing--newspaper">
      
      {/* Newspaper Masthead Banner */}
      <div className="newspaper-masthead-band py-4 text-center">
         <div className="font-mono text-sm tracking-widest uppercase">The Daily Dispatch</div>
         <div className="text-xs text-ink-soft mt-1">
           {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
         </div>
      </div>

      <div className="newspaper-grid mt-6">
        {/* Main Lead Column */}
        <div className="newspaper-lead">
          <div className="newspaper-section mb-3">{sectionName}</div>
          <h1 className="mb-6">{story.headline}</h1>
          
          {story.strap && <p className="text-xl font-serif italic text-ink-soft mb-6">{story.strap}</p>}

          <div className="flex items-center gap-4 mb-8 border-y border-ink-soft/30 py-3">
             {story.author && Array.isArray(story.author) && story.author.length > 0 && (
                <div className="text-sm font-bold font-sans uppercase">
                   By {story.author.map((a: any) => typeof a === 'object' && a.firstName ? `${a.firstName} ${a.lastName ?? ''}`.trim() : '').filter(Boolean).join(', ')}
                </div>
             )}
             <div className="text-sm font-mono text-ink-soft">
               {story.publishedAt ? new Date(story.publishedAt).toLocaleDateString('en-IN') : 'Published'}
             </div>
          </div>

          <div className="prose prose-lg max-w-none font-serif leading-relaxed text-ink newspaper-dropcap">
            <LayoutRenderer layout={(story as any).layout ?? []} />
          </div>
        </div>

        {/* Secondary Column */}
        <div className="newspaper-secondary">
          {heroMediaUrl && (
            <div className="mb-6">
              <div className="relative w-full aspect-[4/3] border border-ink p-1 bg-white">
                <Image src={heroMediaUrl} alt={story.headline} fill className="object-cover" />
              </div>
              {story.caption && <div className="text-xs font-mono mt-2 text-ink-soft">{story.caption}</div>}
            </div>
          )}

          <h3 className="font-serif font-bold text-xl mb-4 border-b border-ink-soft/30 pb-2">Key Details</h3>
          <ul className="list-disc pl-5 font-sans text-sm space-y-3">
            <li>Section: {sectionName}</li>
            {story.issueTags && (story.issueTags as string[]).map((tag: string) => (
              <li key={tag} className="capitalize">{tag}</li>
            ))}
          </ul>
        </div>

        {/* Tertiary Column (Briefs/Sidebar) */}
        <div className="newspaper-briefs bg-paper-cool/50 p-4 border border-ink-soft/20">
          <h4 className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Related Coverage</h4>
          
          <div className="mb-6">
            <h5 className="font-serif font-bold leading-tight mb-1">Corrections & Notes</h5>
            {(story as any).corrections?.length > 0 ? (
              (story as any).corrections.map((c: any, i: number) => (
                <p key={i} className="font-sans text-xs text-ink-soft mb-2">
                  <span className="font-bold text-accent">Correction:</span> {c.correctionText}
                </p>
              ))
            ) : (
              <p className="font-sans text-xs text-ink-soft">No corrections have been issued for this article.</p>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-ink-soft/30 text-center">
             <div className="font-mono text-xs text-ink-soft mb-2">Have a tip?</div>
             <a
               href="mailto:tips@reportersdesk.abhishekangad.com"
               className="block bg-ink text-white font-sans text-xs uppercase font-bold py-2 px-4 w-full text-center"
             >
               Contact Us Securely
             </a>
          </div>
        </div>
      </div>

    </div>
  );
}


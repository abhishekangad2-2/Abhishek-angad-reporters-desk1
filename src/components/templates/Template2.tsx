import React from 'react';
import Image from 'next/image';
import { Story } from '@/payload-types';
import { LayoutRenderer } from '@/components/LexicalRenderer';

export default function Template2({ story }: { story: Story }) {
  const heroMediaUrl = story.heroMedia && typeof story.heroMedia === 'object' && 'url' in story.heroMedia ? story.heroMedia.url : null;
  const sectionName = (typeof story.section === 'object' && story.section ? (story.section as any).name : story.section) ?? 'Feature';

  return (
    <div className="landing landing--z-pattern bg-paper-cool text-ink">
      
      {/* Intro Row */}
      <div className="z-row">
        <div className="z-row-text bg-paper-newsprint">
          <div className="font-mono text-sm text-accent uppercase tracking-widest mb-4">{sectionName}</div>
          <h2 className="mb-6">{story.headline}</h2>
          {story.strap && <p className="text-xl font-serif leading-relaxed text-ink-soft mb-8">{story.strap}</p>}
          {story.author && Array.isArray(story.author) && story.author.length > 0 && (
             <div className="text-sm font-bold font-sans">
                By {story.author.map((a: any) => typeof a === 'object' && a.firstName ? `${a.firstName} ${a.lastName ?? ''}`.trim() : '').filter(Boolean).join(', ')}
             </div>
          )}
        </div>
        <div className="z-row-image relative min-h-[50vh] md:min-h-screen">
          {heroMediaUrl && <Image src={heroMediaUrl} alt={story.headline} fill className="object-cover" />}
        </div>
      </div>

      {/* Body Content Rows (Reversed) — the layout blocks drive the Z-pattern naturally */}
      <div className="z-row z-row--reversed">
        <div className="z-row-text bg-ink text-paper-cool">
          <div className="prose prose-invert prose-lg max-w-2xl mx-auto font-serif leading-loose">
            {story.caption && <p className="text-2xl italic mb-10 border-l-4 border-accent pl-6">{story.caption}</p>}
            <LayoutRenderer layout={(story as any).layout ?? []} />
          </div>
        </div>
        <div className="z-row-image relative bg-ink-soft min-h-[50vh] md:min-h-screen flex items-center justify-center">
           <div className="text-paper-cool/50 font-mono text-sm">Secondary Media Placeholder</div>
        </div>
      </div>

    </div>
  );
}


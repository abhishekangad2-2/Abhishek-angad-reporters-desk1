import React from 'react';
import Image from 'next/image';
import { Story } from '@/payload-types';

export default function Template3({ story }: { story: Story }) {
  const heroMediaUrl = story.heroMedia && typeof story.heroMedia === 'object' && 'url' in story.heroMedia ? story.heroMedia.url : null;
  const sectionName = story.section && typeof story.section === 'object' && 'title' in story.section ? story.section.title : 'Feature';

  return (
    <div className="landing landing--newspaper">
      
      {/* Newspaper Masthead Banner */}
      <div className="newspaper-masthead-band py-4 text-center">
         <div className="font-mono text-sm tracking-widest uppercase">The Daily Dispatch</div>
         <div className="text-xs text-ink-soft mt-1">Vol. 1, No. 1 • June 2026</div>
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
                   By {story.author.map((a: any) => typeof a === 'object' && a.name ? a.name : '').join(', ')}
                </div>
             )}
             <div className="text-sm font-mono text-ink-soft">Published Today</div>
          </div>

          <div className="prose prose-lg max-w-none font-serif leading-relaxed text-ink">
            <p className="newspaper-dropcap">
              T{/* Placeholder for first letter of the actual content */}his is the lead article layout. It uses a prominent drop cap to signal the start of a major investigative piece. The typography is heavily reliant on Fraunces to give it that authoritative, classic newspaper feel, while the grid layout allows for sidebars and secondary content.
            </p>
            <p>
              In a full implementation, this area would render the Lexical rich text content from Payload CMS. We would parse the Lexical nodes and output standard HTML paragraphs, blockquotes, and inline images.
            </p>
          </div>
        </div>

        {/* Secondary Column */}
        <div className="newspaper-secondary">
          {heroMediaUrl && (
            <div className="mb-6">
              <div className="relative w-full aspect-[4/3] border border-ink p-1 p-1 bg-white">
                <Image src={heroMediaUrl} alt={story.headline} fill className="object-cover" />
              </div>
              {story.caption && <div className="text-xs font-mono mt-2 text-ink-soft">{story.caption}</div>}
            </div>
          )}

          <h3 className="font-serif font-bold text-xl mb-4 border-b border-ink-soft/30 pb-2">Key Findings</h3>
          <ul className="list-disc pl-5 font-sans text-sm space-y-3">
            <li>The investigation revealed significant discrepancies in the public record.</li>
            <li>Multiple sources confirmed the timeline of events.</li>
            <li>Documents obtained via RTI requests contradict official statements.</li>
          </ul>
        </div>

        {/* Tertiary Column (Briefs/Sidebar) */}
        <div className="newspaper-briefs bg-paper-cool/50 p-4 border border-ink-soft/20">
          <h4 className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Related Coverage</h4>
          
          <div className="mb-6">
            <h5 className="font-serif font-bold leading-tight mb-1">Previous Audit Raised Red Flags</h5>
            <p className="font-sans text-xs text-ink-soft">A 2024 report highlighted similar vulnerabilities in the procurement process.</p>
          </div>

          <div className="mb-6">
            <h5 className="font-serif font-bold leading-tight mb-1">Interactive: Track the Money</h5>
            <p className="font-sans text-xs text-ink-soft">Explore our database of contractors involved in the project.</p>
          </div>

          <div className="mt-8 pt-4 border-t border-ink-soft/30 text-center">
             <div className="font-mono text-xs text-ink-soft mb-2">Have a tip?</div>
             <button className="bg-ink text-white font-sans text-xs uppercase font-bold py-2 px-4 w-full">Contact Us Securely</button>
          </div>
        </div>
      </div>

    </div>
  );
}

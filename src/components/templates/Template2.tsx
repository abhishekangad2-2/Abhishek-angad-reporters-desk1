import React from 'react';
import Image from 'next/image';
import { Story } from '@/payload-types';

export default function Template2({ story }: { story: Story }) {
  const heroMediaUrl = story.heroMedia && typeof story.heroMedia === 'object' && 'url' in story.heroMedia ? story.heroMedia.url : null;
  const sectionName = story.section && typeof story.section === 'object' && 'title' in story.section ? story.section.title : 'Feature';

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
                By {story.author.map((a: any) => typeof a === 'object' && a.name ? a.name : '').join(', ')}
             </div>
          )}
        </div>
        <div className="z-row-image relative min-h-[50vh] md:min-h-screen">
          {heroMediaUrl && <Image src={heroMediaUrl} alt={story.headline} fill className="object-cover" />}
        </div>
      </div>

      {/* Body Content Row (Reversed) */}
      <div className="z-row z-row--reversed">
        <div className="z-row-text bg-ink text-paper-cool">
          <div className="prose prose-invert prose-lg max-w-2xl mx-auto font-serif leading-loose">
            {story.caption && <p className="text-2xl italic mb-10 border-l-4 border-accent pl-6">{story.caption}</p>}
            <p>This is where the lexical rich text body goes for the first chunk of the story. In a true Z-pattern layout, you break the body into sections and alternate them with images.</p>
          </div>
        </div>
        <div className="z-row-image relative bg-ink-soft min-h-[50vh] md:min-h-screen flex items-center justify-center">
           {/* Placeholder for secondary image */}
           <div className="text-paper-cool/50 font-mono text-sm">Image / Data Visualization Placeholder</div>
        </div>
      </div>

       {/* Conclusion Row */}
       <div className="z-row">
        <div className="z-row-text bg-paper-cool border-t border-ink-soft/20">
          <div className="prose prose-lg max-w-2xl mx-auto font-serif leading-loose">
            <p>The final conclusion of the article goes here. The Z-pattern forces the user's eye to zigzag across the screen, breaking up dense investigative reporting into digestible scrolly chunks.</p>
          </div>
        </div>
        <div className="z-row-image relative bg-paper-newsprint min-h-[50vh] md:min-h-screen flex items-center justify-center border-l border-ink-soft/20">
           {/* Placeholder for third image */}
           <div className="text-ink/50 font-mono text-sm">Supporting Evidence Placeholder</div>
        </div>
      </div>

    </div>
  );
}

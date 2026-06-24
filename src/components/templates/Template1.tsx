import React from 'react';
import Image from 'next/image';
import { Media, Story } from '@/payload-types';

export default function Template1({ story }: { story: Story }) {
  // Extracting media URL if exists
  const heroMediaUrl = story.heroMedia && typeof story.heroMedia === 'object' && 'url' in story.heroMedia ? story.heroMedia.url : null;
  const sectionName = story.section && typeof story.section === 'object' && 'title' in story.section ? story.section.title : 'Feature';

  return (
    <div className="landing">
      {/* Background Hero */}
      {heroMediaUrl && (
        <div className="landing-canvas landing-canvas--fixed w-full h-screen">
          <Image src={heroMediaUrl} alt={story.headline} fill className="object-cover opacity-80" />
        </div>
      )}

      {/* Main Content Area */}
      <div className="three-col-grid container mx-auto px-4 mt-[30vh]">
        {/* Left Column: Context/Strap */}
        <div className="three-col-card bg-ink/90 backdrop-blur-md p-8 border-r border-ink-soft">
          <div className="three-col-section mb-4">{sectionName}</div>
          {story.strap && <div className="three-col-strap text-lg font-medium font-serif leading-relaxed mb-6">{story.strap}</div>}
          
          {story.author && Array.isArray(story.author) && story.author.length > 0 && (
             <div className="text-sm font-mono text-paper-cool mt-auto">
                By {story.author.map((a: any) => typeof a === 'object' && a.name ? a.name : '').join(', ')}
             </div>
          )}
        </div>

        {/* Center Column: Headline & Lead */}
        <div className="three-col-card bg-ink/95 backdrop-blur-md p-10 border-r border-ink-soft flex-col justify-start">
          <h1 className="three-col-headline text-5xl mb-8 leading-tight">{story.headline}</h1>
          <div className="prose prose-invert prose-lg max-w-none font-serif leading-relaxed">
             {/* We will render Lexical content here later, for now placeholder */}
             {story.caption && <p className="text-xl italic text-paper-newsprint border-l-2 border-accent pl-4">{story.caption}</p>}
          </div>
        </div>

        {/* Right Column: Key Details / Content */}
        <div className="three-col-card bg-ink/90 backdrop-blur-md p-8">
           <div className="prose prose-invert font-sans text-sm leading-relaxed">
              <p>The full story goes here. This column is for details, related links, or continued body text in a multi-column masonry layout if preferred.</p>
              {/* Note: Proper Lexical renderer will be needed */}
           </div>
        </div>
      </div>
    </div>
  );
}

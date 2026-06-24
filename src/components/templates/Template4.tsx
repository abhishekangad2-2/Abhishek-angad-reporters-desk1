import React from 'react';
import Image from 'next/image';
import { Story } from '@/payload-types';
import PlexusBackground from '../PlexusBackground';
import { RichTextRenderer } from '@/components/LexicalRenderer';

export default function Template4({ story }: { story: Story }) {
  const chapters = (story as any).scrollytellingChapters || [];

  return (
    <div className="landing landing--immersive">
      {/* Plexus Background runs underneath the entire immersive experience */}
      <div className="fixed inset-0 z-0">
        <PlexusBackground />
      </div>
      
      {/* Immersive Hero */}
      <div className="immersive-hero">
        <div className="font-mono text-sm tracking-widest uppercase text-accent mb-2 z-10 relative">
           {story.section ?? 'Feature'}
        </div>
        <h1 className="z-10 relative">{story.headline}</h1>
        {story.strap && <p className="text-xl font-serif max-w-2xl text-paper-cool z-10 relative">{story.strap}</p>}
        
        {/* Audio toggle — functional implementation requires WaveSurfer.js integration */}
        <button className="audio-toggle mt-8 z-10 relative flex items-center gap-2">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
           </svg>
           Experience with Audio
        </button>
      </div>

      {/* Chapters */}
      <div className="relative z-10">
        {chapters.length > 0 ? (
          chapters.map((chapter: any, index: number) => {
            const bgMediaUrl = chapter.backgroundMedia && typeof chapter.backgroundMedia === 'object' && 'url' in chapter.backgroundMedia ? chapter.backgroundMedia.url : null;
            
            return (
              <div key={index} className="chapter relative">
                 {/* Chapter Background */}
                 {bgMediaUrl && (
                    <div className="absolute inset-0 z-0 opacity-40 transition-opacity duration-1000">
                       <Image src={bgMediaUrl} alt={chapter.chapterTitle || ''} fill className="object-cover" />
                       <div className="absolute inset-0 bg-ink/60"></div>
                    </div>
                 )}
                 
                 <div className={`chapter-text relative z-10 ${
                    chapter.alignment === 'left' ? 'mr-auto ml-10' :
                    chapter.alignment === 'right' ? 'ml-auto mr-10' : 'mx-auto text-center'
                 }`}>
                    {chapter.chapterTitle && <h3 className="font-serif text-2xl font-bold mb-4 text-accent">{chapter.chapterTitle}</h3>}
                    <div className="prose prose-invert prose-lg font-serif">
                      {/* Render the chapter's Lexical rich text content */}
                      <RichTextRenderer content={chapter.content} />
                    </div>
                 </div>
              </div>
            );
          })
        ) : (
          <div className="chapter">
             <div className="chapter-text mx-auto text-center">
                <p>No scrollytelling chapters were defined for this article.</p>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}


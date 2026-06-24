import React from 'react'

export default function ReadDeeper({ story }: { story: any }) {
  if (!story?.readDeeper?.suggestedTags || story.readDeeper.suggestedTags.length === 0) {
    return null
  }

  const tags = story.readDeeper.suggestedTags

  return (
    <div className="my-16 max-w-4xl mx-auto px-6 sm:px-12 w-full">
      <div className="p-8 md:p-10 rounded-3xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden group">
        {/* Subtle AI Sparkle effect background */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-stone-300/40 dark:from-stone-700/30 to-transparent rounded-full blur-3xl opacity-50 transform translate-x-1/3 -translate-y-1/3 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center border border-stone-300 dark:border-stone-700 shadow-sm">
              <span className="text-sm">✨</span>
            </div>
            <h3 className="font-serif text-xl md:text-2xl font-medium text-stone-900 dark:text-stone-50 tracking-tight">Read Deeper</h3>
          </div>
          
          <p className="text-lg md:text-xl text-stone-700 dark:text-stone-300 font-serif leading-relaxed mb-8 border-l-2 border-stone-400 dark:border-stone-600 pl-6 py-1">
            <span className="opacity-60 italic">AI Suggestion: </span>"{story.readDeeper.reasoning}"
          </p>
          
          <div className="flex flex-wrap gap-3">
            {tags.map((tag: any, idx: number) => {
              // Ensure we have a valid object and title
              if (!tag || !tag.title) return null
              
              return (
                <a 
                  key={tag.id || idx}
                  href={`#`}
                  className="px-5 py-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-full text-sm font-medium text-stone-800 dark:text-stone-200 hover:border-stone-400 hover:bg-stone-50 dark:hover:border-stone-600 dark:hover:bg-stone-800 transition-all shadow-sm flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-600"></span>
                  {tag.title}
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client";

import React, { useState, useEffect, useCallback } from 'react';

type Dispatch = {
  id: string | number
  text: string
  journalist: { initials: string; name: string }
  postedAt: string
}

export default function LiveDispatchesWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);

  const fetchDispatches = useCallback(async () => {
    try {
      const res = await fetch('/api/live-dispatches/recent')
      if (res.ok) {
        const data = await res.json()
        setDispatches(data)
      }
    } catch {
      // silently ignore — widget is non-critical
    }
  }, [])

  useEffect(() => {
    fetchDispatches()
    // Poll every 60 seconds for new dispatches
    const interval = setInterval(fetchDispatches, 60_000)
    return () => clearInterval(interval)
  }, [fetchDispatches])

  if (dispatches.length === 0) return null

  return (
    <div className="dispatch-widget">
      <button
        className="dispatch-toggle shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle live dispatches"
      >
        <span className="dispatch-pulse"></span>
        LIVE DISPATCHES
      </button>

      {isOpen && (
        <ul className="dispatch-list shadow-xl max-h-64 overflow-y-auto">
          {dispatches.map((dispatch) => (
            <li key={dispatch.id} className="dispatch-item">
              <span className="dispatch-initials">{dispatch.journalist.initials}</span>
              <div className="flex-1">
                <p className="dispatch-text">{dispatch.text}</p>
                <div className="text-[0.65rem] text-ink-soft mt-1 font-mono">
                  {new Date(dispatch.postedAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {dispatch.journalist.name && ` · ${dispatch.journalist.name}`}
                </div>
              </div>
              <button
                className="share-button"
                aria-label="Share this dispatch"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ text: dispatch.text })
                  } else {
                    navigator.clipboard.writeText(dispatch.text)
                  }
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


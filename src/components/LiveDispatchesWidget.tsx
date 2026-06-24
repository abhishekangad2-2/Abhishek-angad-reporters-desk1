"use client";

import React, { useState } from 'react';

// In a real implementation, you would fetch these from the Payload REST/GraphQL API
const MOCK_DISPATCHES = [
  { id: 1, initials: 'JD', text: 'Sources report the hearing has been delayed by 2 hours.', time: '10:05 AM' },
  { id: 2, initials: 'AA', text: 'Document drop confirms the earlier allegations.', time: '9:45 AM' },
];

export default function LiveDispatchesWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dispatch-widget">
      <button 
        className="dispatch-toggle shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="dispatch-pulse"></span>
        LIVE DISPATCHES
      </button>

      {isOpen && (
        <ul className="dispatch-list shadow-xl max-h-64 overflow-y-auto">
          {MOCK_DISPATCHES.map((dispatch) => (
            <li key={dispatch.id} className="dispatch-item">
              <span className="dispatch-initials">{dispatch.initials}</span>
              <div className="flex-1">
                 <p className="dispatch-text">{dispatch.text}</p>
                 <div className="text-[0.65rem] text-ink-soft mt-1 font-mono">{dispatch.time}</div>
              </div>
              <button className="share-button" aria-label="Share this dispatch">
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

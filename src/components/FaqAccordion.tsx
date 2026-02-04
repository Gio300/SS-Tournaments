'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Entry {
  q: string;
  a: string;
}

export function FaqAccordion({ entries }: { entries: Entry[] }) {
  const [openId, setOpenId] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <div
          key={i}
          className="bg-panel border border-border rounded-xl overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setOpenId(openId === i ? null : i)}
            className="w-full flex items-center gap-3 px-4 sm:px-6 py-4 text-left hover:bg-white/5 transition"
          >
            {openId === i ? (
              <ChevronDown className="flex-shrink-0 text-accent" size={20} />
            ) : (
              <ChevronRight className="flex-shrink-0 text-text-muted" size={20} />
            )}
            <span className="font-medium text-text-primary">{entry.q}</span>
          </button>
          {openId === i && (
            <div className="px-4 sm:px-6 pb-4 pt-0 border-t border-border">
              <p className="text-text-muted text-sm sm:text-base pt-3">
                {entry.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

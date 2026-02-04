'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { RuleSection } from '@/data/rules';

const kindClass = {
  ban: 'rule-ban text-red-400',
  restriction: 'rule-restriction text-amber-400',
  allowed: 'rule-allowed text-emerald-400',
};

export function RuleCard({ section }: { section: RuleSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-panel border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left hover:bg-white/5 transition"
      >
        <span className="font-display font-semibold text-text-primary">
          {section.title}
        </span>
        {open ? (
          <ChevronDown className="flex-shrink-0 text-text-muted" size={20} />
        ) : (
          <ChevronRight className="flex-shrink-0 text-text-muted" size={20} />
        )}
      </button>
      {open && (
        <ul className="px-4 sm:px-6 pb-4 space-y-2 border-t border-border pt-3">
          {section.items.map((item, i) => (
            <li
              key={i}
              className={`text-sm sm:text-base ${kindClass[item.kind]}`}
            >
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

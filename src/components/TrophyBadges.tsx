'use client';

import { Trophy, Zap, Crown, Star } from 'lucide-react';

const TROPHY_CONFIG: Record<string, { label: string; icon: typeof Trophy; title: string }> = {
  centurion: { label: 'Centurion', icon: Zap, title: '100+ pts – First steps to glory' },
  top_dog: { label: 'Top Dog', icon: Star, title: '1,000+ pts – Rising star' },
  legendary: { label: 'Legendary', icon: Crown, title: '5,000+ pts – Elite player' },
  its_over_9000: { label: "It's Over 9000!", icon: Trophy, title: '9,000+ pts – Ultimate power' },
};

export function TrophyBadges({ trophyTypes }: { trophyTypes: string[] }) {
  if (!trophyTypes?.length) return null;
  const ordered = ['centurion', 'top_dog', 'legendary', 'its_over_9000'].filter((t) =>
    trophyTypes.includes(t)
  );
  if (ordered.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 ml-1" title={ordered.map((t) => TROPHY_CONFIG[t]?.label ?? t).join(', ')}>
      {ordered.map((t) => {
        const cfg = TROPHY_CONFIG[t];
        const Icon = cfg?.icon ?? Trophy;
        return (
          <span key={t} className="text-accent" title={cfg?.title ?? t}>
            <Icon size={14} className="inline" />
          </span>
        );
      })}
    </span>
  );
}

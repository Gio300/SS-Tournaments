'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Tournament } from '@/types/database';

export default function StatCheckPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('tournaments').select('id, name, status').order('created_at', { ascending: false }).then(({ data }) => {
      setTournaments((data ?? []) as Tournament[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-text-muted">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Stat Check</h1>
      <p className="text-text-muted mb-6">
        Stat check is now under each tournament. Select a tournament to submit your build video for review.
      </p>
      <div className="space-y-3">
        {tournaments.map((t) => (
          <Link
            key={t.id}
            href={`/tournaments/${t.id}/`}
            className="block rounded-xl border border-border bg-panel p-4 hover:border-accent/50 transition"
          >
            <h2 className="font-semibold text-text-primary">{t.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded mt-2 inline-block ${t.status === 'closed' ? 'bg-panel border border-border text-text-muted' : 'bg-accent/20 text-accent'}`}>
              {t.status === 'closed' ? 'Closed' : 'Open'}
            </span>
          </Link>
        ))}
      </div>
      {tournaments.length === 0 && (
        <p className="text-text-muted">No tournaments yet. <Link href="/tournaments/" className="text-accent hover:underline">Create one</Link> or browse tournaments.</p>
      )}
    </div>
  );
}

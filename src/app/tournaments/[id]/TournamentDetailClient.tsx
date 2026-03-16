'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Tournament } from '@/types/database';

export function TournamentDetailClient() {
  const params = useParams();
  const id = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      const { data } = await supabase.from('tournaments').select('*').eq('id', id).single();
      setTournament(data as Tournament | null);
      setLoading(false);
    }
    fetch();
  }, [id]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-text-muted">Loading...</div>;
  if (!tournament) return <div className="max-w-3xl mx-auto px-4 py-8 text-text-muted">Tournament not found.</div>;

  const statTimes = Array.isArray(tournament.stat_check_times)
    ? (tournament.stat_check_times as string[]).filter((t): t is string => typeof t === 'string')
    : [];
  const daysTimes = tournament.tournament_days_times && typeof tournament.tournament_days_times === 'object'
    ? tournament.tournament_days_times as { raw?: string }
    : {};

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/tournaments/" className="text-accent hover:underline text-sm mb-4 inline-block">← Back to Tournaments</Link>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">{tournament.name}</h1>
      {tournament.description && <p className="text-text-muted mb-6">{tournament.description}</p>}

      {tournament.rules && (
        <div className="rounded-xl border border-border bg-panel p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Rules</h2>
          <div className="text-text-muted whitespace-pre-wrap text-sm">{tournament.rules}</div>
        </div>
      )}

      {statTimes.length > 0 && (
        <div className="rounded-xl border border-border bg-panel p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Stat check times</h2>
          <ul className="text-text-muted text-sm space-y-1">
            {statTimes.map((t, i) => (
              <li key={i}>{String(t)}</li>
            ))}
          </ul>
        </div>
      )}

      {daysTimes.raw && (
        <div className="rounded-xl border border-border bg-panel p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Tournament days and times</h2>
          <p className="text-text-muted text-sm whitespace-pre-wrap">{daysTimes.raw}</p>
        </div>
      )}

      {!tournament.rules && !(statTimes.length > 0) && !daysTimes.raw && (
        <p className="text-text-muted text-sm">No rules or schedule set yet.</p>
      )}
    </div>
  );
}

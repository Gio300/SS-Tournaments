'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Tournament } from '@/types/database';

export function TournamentDetailClient() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      const { data } = await supabase.from('tournaments').select('*').eq('id', id).single();
      setTournament(data as Tournament | null);
      setLoading(false);
    }
    fetch();
  }, [id]);

  async function handleClose() {
    if (!tournament || !user || tournament.created_by !== user.id) return;
    setClosing(true);
    const { error } = await supabase.from('tournaments').update({ status: 'closed', ends_at: new Date().toISOString() }).eq('id', id);
    setClosing(false);
    if (!error) setTournament((t) => (t ? { ...t, status: 'closed', ends_at: new Date().toISOString() } : null));
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-text-muted">Loading...</div>;
  if (!tournament) return <div className="max-w-3xl mx-auto px-4 py-8 text-text-muted">Tournament not found.</div>;

  const statTimes = Array.isArray(tournament.stat_check_times)
    ? (tournament.stat_check_times as string[]).filter((t): t is string => typeof t === 'string')
    : [];
  const daysTimes = tournament.tournament_days_times && typeof tournament.tournament_days_times === 'object'
    ? tournament.tournament_days_times as { raw?: string }
    : {};

  const isCreator = user && tournament.created_by === user.id;
  const isClosed = tournament.status === 'closed';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/tournaments/" className="text-accent hover:underline text-sm mb-4 inline-block">← Back to Tournaments</Link>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">{tournament.name}</h1>
        {isClosed ? (
          <span className="text-xs px-2 py-0.5 rounded bg-panel border border-border text-text-muted">Closed</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">Open</span>
        )}
        {isCreator && !isClosed && (
          <button
            type="button"
            onClick={handleClose}
            disabled={closing}
            className="text-sm px-3 py-1 rounded border border-border text-text-muted hover:text-accent hover:border-accent transition disabled:opacity-50"
          >
            {closing ? 'Closing...' : 'Close tournament'}
          </button>
        )}
      </div>
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

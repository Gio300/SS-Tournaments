'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Tournament } from '@/types/database';

export default function TournamentsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [statCheckTimes, setStatCheckTimes] = useState('');
  const [tournamentDaysTimes, setTournamentDaysTimes] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      setTournaments((data ?? []) as Tournament[]);
      setLoading(false);
    }
    fetch();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setCreating(true);
    try {
      const statTimes = statCheckTimes.trim()
        ? statCheckTimes.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
        : [];
      const daysTimes = tournamentDaysTimes.trim()
        ? { raw: tournamentDaysTimes }
        : {};
      const { error: err } = await supabase.from('tournaments').insert({
        name: name.trim(),
        description: description.trim() || null,
        rules: rules.trim() || null,
        stat_check_times: statTimes,
        tournament_days_times: daysTimes,
        created_by: user.id,
      });
      if (err) throw err;
      setShowCreate(false);
      setName('');
      setDescription('');
      setRules('');
      setStatCheckTimes('');
      setTournamentDaysTimes('');
      const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
      setTournaments((data ?? []) as Tournament[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">Tournaments</h1>
          <p className="text-text-muted mt-1">Create custom tournaments with your own rules. Users sign up and follow tournament rules.</p>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90"
          >
            {showCreate ? 'Cancel' : 'Create Tournament'}
          </button>
        )}
      </div>

      {showCreate && user && (
        <form onSubmit={handleCreate} className="rounded-xl border border-border bg-panel p-6 mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">New Tournament</h2>
          <div>
            <label className="block text-sm text-text-muted mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary"
              placeholder="Tournament name"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary min-h-[80px]"
              placeholder="Brief description"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Rules</label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary min-h-[120px]"
              placeholder="Tournament rules (format, restrictions, etc.)"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Stat check times (one per line or comma-separated)</label>
            <textarea
              value={statCheckTimes}
              onChange={(e) => setStatCheckTimes(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary min-h-[60px]"
              placeholder="e.g. 2025-03-15 18:00"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Tournament days and times</label>
            <textarea
              value={tournamentDaysTimes}
              onChange={(e) => setTournamentDaysTimes(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary min-h-[60px]"
              placeholder="e.g. March 20, 2025 at 7:00 PM"
            />
          </div>
          {error && <p className="text-accent text-sm">{error}</p>}
          <button type="submit" disabled={creating} className="px-4 py-2 rounded-lg bg-accent text-white font-semibold disabled:opacity-50">
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : tournaments.length === 0 ? (
        <div className="rounded-xl border border-border bg-panel p-8 text-center">
          <p className="text-text-muted mb-4">No tournaments yet.</p>
          {user ? (
            <button type="button" onClick={() => setShowCreate(true)} className="text-accent hover:underline font-medium">
              Create a tournament
            </button>
          ) : (
            <Link href="/login/" className="text-accent hover:underline font-medium">
              Sign in to create
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/tournaments/${t.id}/`}
              className="rounded-xl border border-border bg-panel p-6 hover:border-accent/50 transition"
            >
              <h2 className="font-semibold text-lg text-text-primary">{t.name}</h2>
              <p className="text-sm text-text-muted mt-2 line-clamp-2">{t.description ?? 'No description'}</p>
              {t.rules && <p className="text-xs text-accent mt-2">Has rules</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

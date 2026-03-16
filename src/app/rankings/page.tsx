'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AdSlot } from '@/components/AdSlot';
import type { MatchType } from '@/types/database';

const MATCH_TYPES: { value: MatchType; label: string }[] = [
  { value: 'survival', label: 'Survival' },
  { value: 'quick_match', label: 'Quick Match' },
  { value: 'red_white', label: 'Red vs White' },
  { value: 'ninja_world_league', label: 'Ninja World League' },
  { value: 'tournament', label: 'Tournament' },
];

type RankingRow = {
  profile_id: string;
  username: string;
  avatar_url: string | null;
  rating: number;
  wins: number;
  losses: number;
};

export default function RankingsPage() {
  const [filter, setFilter] = useState<MatchType>('quick_match');
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      const { data } = await supabase
        .from('power_ratings')
        .select('profile_id, rating, wins, losses')
        .eq('match_type', filter)
        .order('rating', { ascending: false })
        .limit(50);
      if (!data?.length) {
        setRows([]);
        setLoading(false);
        return;
      }
      const ids = Array.from(new Set(data.map((r) => r.profile_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', ids);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const merged: RankingRow[] = data.map((r) => ({
        profile_id: r.profile_id,
        username: profileMap.get(r.profile_id)?.username ?? 'Unknown',
        avatar_url: profileMap.get(r.profile_id)?.avatar_url ?? null,
        rating: r.rating,
        wins: r.wins,
        losses: r.losses,
      }));
      setRows(merged);
      setLoading(false);
    }
    fetchRankings();
  }, [filter]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Hall of Fame</h1>
      <p className="text-text-muted mb-6">
        Rankings by match type. Submit results from the end screen to climb the leaderboard.
      </p>

      <AdSlot slotId="rankings-hero-below" className="mb-6" />

      <div className="flex flex-wrap gap-2 mb-6">
        {MATCH_TYPES.map((m) => (
          <button
            key={m.value}
            onClick={() => setFilter(m.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === m.value ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Link
        href="/submit-result/"
        className="inline-block mb-6 px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90"
      >
        Submit Result
      </Link>

      <AdSlot slotId="rankings-between" className="mb-6" />

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-text-muted">No rankings yet. Be the first to submit a result!</p>
      ) : (
        <div className="rounded-xl border border-border bg-panel overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">#</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Player</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Rating</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">W-L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.profile_id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-primary font-medium">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/profile/${r.profile_id}/`} className="flex items-center gap-2 hover:text-accent">
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
                          {r.username[0] ?? '?'}
                        </div>
                      )}
                      {r.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-accent font-semibold">{r.rating}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {r.wins}-{r.losses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { TrophyBadges } from '@/components/TrophyBadges';
import { supabase } from '@/lib/supabase';
import { AdSlot } from '@/components/AdSlot';
import type { MatchType } from '@/types/database';

const MATCH_TYPES: { value: MatchType; label: string }[] = [
  { value: 'survival', label: 'Survival' },
  { value: 'quick_match', label: 'Quick Match' },
  { value: 'barrier_battle', label: 'Barrier Battle' },
  { value: 'red_white', label: 'Red vs White' },
  { value: 'ninja_world_league', label: 'Ninja World League' },
  { value: 'tournament', label: 'Tournament' },
];

const TROPHY_LABELS: Record<string, string> = {
  centurion: 'Centurion (100+ pts)',
  top_dog: 'Top Dog (1k+ pts)',
  legendary: 'Legendary (5k+ pts)',
  its_over_9000: "It's over 9000! (9k+ pts)",
};

type RankingRow = {
  profile_id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  wins: number;
  losses: number;
  trophy_types: string[];
};

type ClanRow = {
  id: string;
  name: string;
  total_points: number;
  member_count: number;
};

export default function RankingsPage() {
  const [tab, setTab] = useState<'players' | 'clans'>('players');
  const [filter, setFilter] = useState<MatchType>('quick_match');
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [clanRows, setClanRows] = useState<ClanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      const { data } = await supabase
        .from('power_ratings')
        .select('profile_id, accumulated_points, wins, losses')
        .eq('match_type', filter)
        .order('accumulated_points', { ascending: false })
        .limit(50);
      if (!data?.length) {
        setRows([]);
        setLoading(false);
        return;
      }
      const ids = Array.from(new Set(data.map((r) => r.profile_id)));
      const [profilesRes, trophiesRes] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', ids),
        supabase.from('trophies').select('profile_id, trophy_type').in('profile_id', ids),
      ]);
      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
      const trophyMap = new Map<string, string[]>();
      for (const t of trophiesRes.data ?? []) {
        const arr = trophyMap.get(t.profile_id) ?? [];
        if (!arr.includes(t.trophy_type)) arr.push(t.trophy_type);
        trophyMap.set(t.profile_id, arr);
      }
      const merged: RankingRow[] = data.map((r) => ({
        profile_id: r.profile_id,
        username: profileMap.get(r.profile_id)?.username ?? 'Unknown',
        avatar_url: profileMap.get(r.profile_id)?.avatar_url ?? null,
        points: r.accumulated_points ?? 0,
        wins: r.wins ?? 0,
        losses: r.losses ?? 0,
        trophy_types: trophyMap.get(r.profile_id) ?? [],
      }));
      setRows(merged);
      setLoading(false);
    }
    if (tab === 'players') fetchRankings();
  }, [filter, tab]);

  useEffect(() => {
    async function fetchClans() {
      setLoading(true);
      const { data: servers } = await supabase
        .from('servers')
        .select('id, name, total_points')
        .order('total_points', { ascending: false })
        .limit(50);
      if (!servers?.length) {
        setClanRows([]);
        setLoading(false);
        return;
      }
      const { data: counts } = await supabase
        .from('server_members')
        .select('server_id');
      const countMap = new Map<string, number>();
      for (const c of counts ?? []) {
        countMap.set(c.server_id, (countMap.get(c.server_id) ?? 0) + 1);
      }
      setClanRows(servers.map((s) => ({
        id: s.id,
        name: s.name,
        total_points: s.total_points ?? 0,
        member_count: countMap.get(s.id) ?? 0,
      })));
      setLoading(false);
    }
    if (tab === 'clans') fetchClans();
  }, [tab]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Rankings</h1>
      <p className="text-text-muted mb-6">
        User power levels and clan leaderboards. Submit results from the end screen to climb.
      </p>

      <AdSlot slotId="rankings-hero-below" className="mb-6" />

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('players')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'players' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          Players
        </button>
        <button
          type="button"
          onClick={() => setTab('clans')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'clans' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          Clans
        </button>
      </div>

      {tab === 'players' && (
        <>
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
        </>
      )}

      <AdSlot slotId="rankings-between" className="mb-6" />

      {tab === 'players' && (
        loading ? (
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Points</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Trophies</th>
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
                    <td className="px-4 py-3">
                      <span className="text-accent font-semibold inline-flex items-center">
                        {r.points}
                        <TrophyBadges trophyTypes={r.trophy_types} />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.trophy_types.map((t) => (
                          <span key={t} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-accent/20 text-accent text-xs" title={TROPHY_LABELS[t] ?? t}>
                            <Trophy size={12} />
                            {TROPHY_LABELS[t] ?? t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {r.wins}-{r.losses}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'clans' && (
        loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : clanRows.length === 0 ? (
          <p className="text-text-muted">No clans yet.</p>
        ) : (
          <div className="rounded-xl border border-border bg-panel overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">#</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Clan</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Points</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Members</th>
                </tr>
              </thead>
              <tbody>
                {clanRows.map((c, i) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text-primary font-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/boards/${c.id}/`} className="hover:text-accent font-medium">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-accent font-semibold">{c.total_points}</td>
                    <td className="px-4 py-3 text-text-muted">{c.member_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

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
  const [tab, setTab] = useState<'players' | 'clans' | 'hallOfFame'>('players');
  const [filter, setFilter] = useState<MatchType>('quick_match');
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [clanRows, setClanRows] = useState<ClanRow[]>([]);
  const [hallOfFame, setHallOfFame] = useState<{
    mostTournamentWins: { profile_id: string; username: string; avatar_url: string | null; wins: number }[];
    highestPower: { profile_id: string; username: string; avatar_url: string | null; power_level: number }[];
    mostTrophies: { profile_id: string; username: string; avatar_url: string | null; count: number }[];
  }>({ mostTournamentWins: [], highestPower: [], mostTrophies: [] });
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

  useEffect(() => {
    async function fetchHallOfFame() {
      setLoading(true);
      const [winsRes, powerRes, trophiesRes] = await Promise.all([
        supabase.from('tournament_results').select('winner_profile_id'),
        supabase.from('profiles').select('id, username, avatar_url, power_level').not('power_level', 'is', null).order('power_level', { ascending: false }).limit(10),
        supabase.from('trophies').select('profile_id'),
      ]);
      const winCounts = new Map<string, number>();
      for (const w of winsRes.data ?? []) {
        winCounts.set(w.winner_profile_id, (winCounts.get(w.winner_profile_id) ?? 0) + 1);
      }
      const trophyCounts = new Map<string, number>();
      for (const t of trophiesRes.data ?? []) {
        trophyCounts.set(t.profile_id, (trophyCounts.get(t.profile_id) ?? 0) + 1);
      }
      const winSorted = [...winCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      const trophySorted = [...trophyCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      const winIds = winSorted.map(([id]) => id);
      const trophyIds = trophySorted.map(([id]) => id);
      const { data: winProfiles } = winIds.length ? await supabase.from('profiles').select('id, username, avatar_url').in('id', winIds) : { data: [] };
      const { data: trophyProfiles } = trophyIds.length ? await supabase.from('profiles').select('id, username, avatar_url').in('id', trophyIds) : { data: [] };
      const winProfMap = new Map((winProfiles ?? []).map((p) => [p.id, p]));
      const trophyProfMap = new Map((trophyProfiles ?? []).map((p) => [p.id, p]));
      setHallOfFame({
        mostTournamentWins: winSorted.map(([id, wins]) => ({ profile_id: id, username: winProfMap.get(id)?.username ?? 'Unknown', avatar_url: winProfMap.get(id)?.avatar_url ?? null, wins })),
        highestPower: (powerRes.data ?? []).map((p) => ({ profile_id: p.id, username: p.username, avatar_url: p.avatar_url, power_level: p.power_level ?? 0 })),
        mostTrophies: trophySorted.map(([id, count]) => ({ profile_id: id, username: trophyProfMap.get(id)?.username ?? 'Unknown', avatar_url: trophyProfMap.get(id)?.avatar_url ?? null, count })),
      });
      setLoading(false);
    }
    if (tab === 'hallOfFame') fetchHallOfFame();
  }, [tab]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Rankings</h1>
          <p className="text-text-muted">
            User power levels and clan leaderboards. Submit results from the end screen to climb.
          </p>
        </div>
        <Link
          href="/submit-result/"
          className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 shrink-0"
        >
          Submit Result
        </Link>
      </div>

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
        <button
          type="button"
          onClick={() => setTab('hallOfFame')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'hallOfFame' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          Hall of Fame
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

      {tab === 'hallOfFame' && (
        loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : (
          <div className="space-y-8">
            <div className="rounded-xl border border-border bg-panel p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Most Tournament Wins</h2>
              {hallOfFame.mostTournamentWins.length === 0 ? (
                <p className="text-text-muted">No tournament wins yet.</p>
              ) : (
                <div className="space-y-2">
                  {hallOfFame.mostTournamentWins.map((r, i) => (
                    <Link key={r.profile_id} href={`/profile/${r.profile_id}/`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                      <span className="text-text-muted font-medium w-6">{i + 1}</span>
                      {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-accent/20" />}
                      <span className="text-text-primary font-medium">{r.username}</span>
                      <span className="text-accent">{r.wins} wins</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-panel p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Highest Power Level</h2>
              {hallOfFame.highestPower.length === 0 ? (
                <p className="text-text-muted">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {hallOfFame.highestPower.map((r, i) => (
                    <Link key={r.profile_id} href={`/profile/${r.profile_id}/`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                      <span className="text-text-muted font-medium w-6">{i + 1}</span>
                      {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-accent/20" />}
                      <span className="text-text-primary font-medium">{r.username}</span>
                      <span className="text-accent">{r.power_level} pts</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-panel p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Most Trophies</h2>
              {hallOfFame.mostTrophies.length === 0 ? (
                <p className="text-text-muted">No trophies yet.</p>
              ) : (
                <div className="space-y-2">
                  {hallOfFame.mostTrophies.map((r, i) => (
                    <Link key={r.profile_id} href={`/profile/${r.profile_id}/`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                      <span className="text-text-muted font-medium w-6">{i + 1}</span>
                      {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-accent/20" />}
                      <span className="text-text-primary font-medium">{r.username}</span>
                      <span className="text-accent">{r.count} trophies</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
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

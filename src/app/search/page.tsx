'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, UserPlus, UserMinus, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type UserSearchResult = {
  type: 'user';
  id: string;
  username: string;
  game_tag: string | null;
  avatar_url: string | null;
  power_level: number;
  isFollowing: boolean;
};
type ClanSearchResult = { type: 'clan'; id: string; name: string };
type SearchResult = UserSearchResult | ClanSearchResult;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { user } = useAuth();
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    async function search() {
      setLoading(true);
      const q = query.trim();
      const [usersByUsername, usersByTag, clansData] = await Promise.all([
        supabase.from('profiles').select('id, username, game_tag, avatar_url, power_level').ilike('username', `%${q}%`).limit(20),
        supabase.from('profiles').select('id, username, game_tag, avatar_url, power_level').not('game_tag', 'is', null).ilike('game_tag', `%${q}%`).limit(20),
        supabase.from('servers').select('id, name').ilike('name', `%${q}%`).limit(20),
      ]);
      const seen = new Set<string>();
      const userResults: UserSearchResult[] = [];
      for (const p of usersByUsername.data ?? []) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          userResults.push({ type: 'user', id: p.id, username: p.username, game_tag: p.game_tag ?? null, avatar_url: p.avatar_url ?? null, power_level: p.power_level ?? 0, isFollowing: false });
        }
      }
      for (const p of usersByTag.data ?? []) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          userResults.push({ type: 'user', id: p.id, username: p.username, game_tag: p.game_tag ?? null, avatar_url: p.avatar_url ?? null, power_level: p.power_level ?? 0, isFollowing: false });
        }
      }
      const ids = userResults.map((r) => r.id);
      let follows: { following_id: string }[] = [];
      if (user && ids.length) {
        const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id).in('following_id', ids);
        follows = data ?? [];
      }
      const followSet = new Set(follows.map((f) => f.following_id));
      const clanResults: ClanSearchResult[] = (clansData.data ?? []).map((s) => ({ type: 'clan' as const, id: s.id, name: s.name }));
      setResults([
        ...userResults.map((u) => ({ ...u, isFollowing: followSet.has(u.id) })),
        ...clanResults,
      ]);
      setFollowing(followSet);
      setLoading(false);
    }
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [query, user?.id]);

  async function toggleFollow(targetId: string) {
    if (!user || targetId === user.id) return;
    const isFollowingNow = following.has(targetId);
    if (isFollowingNow) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowing((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      setResults((prev) => prev.map((x) => (x.type === 'user' && x.id === targetId ? { ...x, isFollowing: false } : x)));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      setFollowing((prev) => new Set(Array.from(prev).concat(targetId)));
      setResults((prev) => prev.map((r) => (r.id === targetId ? { ...r, isFollowing: true } : r)));
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Search Users</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.querySelector<HTMLInputElement>('input[name="q"]');
          if (input) window.history.replaceState(null, '', `/search/?q=${encodeURIComponent(input.value)}`);
        }}
        className="flex gap-2 mb-8"
      >
        <input
          type="text"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or game tag..."
          className="flex-1 px-4 py-2 rounded-lg bg-panel border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
        />
        <button type="submit" className="p-2 rounded-lg bg-accent text-white">
          <Search size={20} />
        </button>
      </form>

      {loading && <p className="text-text-muted">Searching...</p>}
      {!loading && query.trim() && results.length === 0 && (
        <p className="text-text-muted">No users found.</p>
      )}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((r) =>
            r.type === 'user' ? (
              <div key={`user-${r.id}`} className="flex items-center justify-between rounded-xl border border-border bg-panel p-4">
                <Link href={`/profile/${r.id}/`} className="flex items-center gap-3 hover:text-accent">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      {r.username[0] ?? '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-text-primary">{r.username}</p>
                    {r.game_tag && <p className="text-xs text-text-muted">@{r.game_tag}</p>}
                    <p className="text-sm text-text-muted">{r.power_level} pts</p>
                  </div>
                </Link>
                {user && r.id !== user.id && (
                  <button
                    type="button"
                    onClick={() => toggleFollow(r.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      r.isFollowing ? 'border border-border text-text-muted hover:text-accent' : 'bg-accent text-white hover:opacity-90'
                    }`}
                  >
                    {r.isFollowing ? <><UserMinus size={16} /> Unfollow</> : <><UserPlus size={16} /> Follow</>}
                  </button>
                )}
              </div>
            ) : (
              <Link key={`clan-${r.id}`} href={`/boards/${r.id}/`} className="flex items-center gap-3 rounded-xl border border-border bg-panel p-4 hover:border-accent/50 transition">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                  <Users size={24} />
                </div>
                <p className="font-medium text-text-primary">{r.name}</p>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

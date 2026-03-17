'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Users, Award, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FAQ_ENTRIES } from '@/data/rules';

type UserResult = { type: 'user'; id: string; username: string; game_tag: string | null; avatar_url: string | null; power_level: number };
type ClanResult = { type: 'clan'; id: string; name: string };
type TournamentResult = { type: 'tournament'; id: string; name: string }; 
type FaqResult = { type: 'faq'; q: string; a: string };
type SearchResult = UserResult | ClanResult | TournamentResult | FaqResult;

const SITE_FAQ = [
  { q: 'how do i change username', a: 'Go to Settings → Account. Enter a new username and click Save.', link: '/settings/' },
  { q: 'what is game tag', a: 'Your in-game name (PSN) required for submitting match screenshots. Set it in Settings → Account.', link: '/settings/' },
  { q: 'how does power level work', a: 'Power level is based on verified match screenshots. Submit results from Rankings or Profile.', link: '/rankings/' },
  { q: 'how do i join clan', a: 'Browse under Clan. Some clans are open; others require an application.', link: '/boards/' },
  { q: 'how do tournaments work', a: 'Users create custom tournaments with their own rules. Browse under Play → Tournaments.', link: '/tournaments/' },
  { q: 'where are tournament rules', a: 'Rules are tournament-specific. Open a tournament to read its rules.', link: '/tournaments/' },
  { q: 'submit result', a: 'Submit match screenshots from Rankings or Profile to earn power level points.', link: '/submit-result/' },
  { q: 'stat check', a: 'Stat check is inside each tournament. Submit build/buff videos for tournament admins to verify.', link: '/tournaments/' },
  ...FAQ_ENTRIES.map((f) => ({ q: f.q.toLowerCase(), a: f.a, link: '/settings/' as string })),
];

export function NavSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    const q = query.trim().toLowerCase();
    setLoading(true);
    const t = setTimeout(async () => {
      const faqMatches: FaqResult[] = SITE_FAQ.filter((f) => f.q.includes(q) || q.split(/\s+/).some((w) => w.length >= 3 && f.q.includes(w))).slice(0, 3).map((f) => ({ type: 'faq' as const, q: f.q, a: f.a }));

      const [usersByUsername, usersByTag, clans, tournaments] = await Promise.all([
        supabase.from('profiles').select('id, username, game_tag, avatar_url, power_level').ilike('username', `%${q}%`).limit(8),
        supabase.from('profiles').select('id, username, game_tag, avatar_url, power_level').not('game_tag', 'is', null).ilike('game_tag', `%${q}%`).limit(8),
        supabase.from('servers').select('id, name').ilike('name', `%${q}%`).limit(5),
        supabase.from('tournaments').select('id, name').ilike('name', `%${q}%`).limit(5),
      ]);
      const seen = new Set<string>();
      const merged: SearchResult[] = [...faqMatches];
      for (const p of usersByUsername.data ?? []) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          merged.push({ type: 'user', id: p.id, username: p.username, game_tag: p.game_tag ?? null, avatar_url: p.avatar_url ?? null, power_level: p.power_level ?? 0 });
        }
      }
      for (const p of usersByTag.data ?? []) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          merged.push({ type: 'user', id: p.id, username: p.username, game_tag: p.game_tag ?? null, avatar_url: p.avatar_url ?? null, power_level: p.power_level ?? 0 });
        }
      }
      for (const s of clans.data ?? []) {
        merged.push({ type: 'clan', id: s.id, name: s.name });
      }
      for (const t of tournaments.data ?? []) {
        merged.push({ type: 'tournament', id: t.id, name: t.name });
      }
      setResults(merged.slice(0, 15));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = open && (focused || results.length > 0) && query.trim().length > 0;

  function handleSelect(r: SearchResult) {
    if (r.type === 'user') {
      router.push(`/profile/${r.id}/`);
    } else if (r.type === 'clan') {
      router.push(`/boards/${r.id}/`);
    } else if (r.type === 'tournament') {
      router.push(`/tournaments/${r.id}/`);
    } else if (r.type === 'faq') {
      router.push('/settings/');
    }
    setQuery('');
    setOpen(false);
    setResults([]);
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs mx-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search people, clans, tournaments, or ask..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-bg/50 border border-border text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent"
        />
      </div>
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 py-2 rounded-lg bg-panel border border-border shadow-xl z-50 max-h-72 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-2 text-text-muted text-sm">Searching...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-2 text-text-muted text-sm">No results</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.type === 'faq' ? `faq-${i}-${r.q}` : r.type + r.id}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition"
              >
                {r.type === 'user' ? (
                  <>
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <User size={14} className="text-accent" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{r.username}</p>
                      {r.game_tag && <p className="text-xs text-text-muted truncate">@{r.game_tag}</p>}
                    </div>
                    <span className="text-xs text-accent">{r.power_level} pts</span>
                  </>
                ) : r.type === 'clan' || r.type === 'tournament' ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                      {r.type === 'clan' ? <Users size={14} className="text-accent" /> : <Award size={14} className="text-accent" />}
                    </div>
                    <p className="font-medium text-text-primary truncate">{r.name}</p>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                      <HelpCircle size={14} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary text-sm truncate">{r.q}</p>
                      <p className="text-xs text-text-muted truncate">{r.a}</p>
                    </div>
                  </>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

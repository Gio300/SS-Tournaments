'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Trophy as TrophyRow } from '@/types/database';

const TROPHY_LABELS: Record<string, string> = {
  centurion: 'Centurion (100+ pts)',
  top_dog: 'Top Dog (1k+ pts)',
  legendary: 'Legendary (5k+ pts)',
  its_over_9000: "It's Over 9000! (9k+ pts)",
  tournament_win: 'Tournament Winner',
};

export default function TrophiesPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const [trophies, setTrophies] = useState<(TrophyRow & { tournament_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    async function fetch() {
      const { data: pData } = await supabase.from('profiles').select('username').eq('id', userId).single();
      setProfile(pData ?? null);
      const { data: tData } = await supabase.from('trophies').select('*').eq('profile_id', userId).order('earned_at', { ascending: false });
      setTrophies((tData ?? []) as (TrophyRow & { tournament_name?: string })[]);
      setLoading(false);
    }
    fetch();
  }, [userId]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-text-muted">Loading...</div>;
  if (!profile) return <div className="max-w-2xl mx-auto px-4 py-8 text-text-muted">Profile not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href={`/profile/${userId}/`} className="text-accent hover:underline text-sm mb-4 inline-block">← Back to {profile.username}</Link>
      <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Trophies earned</h1>
      <p className="text-text-muted mb-6">All trophies earned by {profile.username}</p>
      {trophies.length === 0 ? (
        <p className="text-text-muted">No trophies yet.</p>
      ) : (
        <div className="space-y-3">
          {trophies.map((t) => {
            const label = t.trophy_type === 'tournament_win'
              ? (t.metadata as { tournament_name?: string })?.tournament_name
                ? `Winner: ${(t.metadata as { tournament_name: string }).tournament_name}`
                : 'Tournament Winner'
              : TROPHY_LABELS[t.trophy_type] ?? t.trophy_type;
            return (
              <div key={t.id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-panel">
                <Trophy className="text-accent shrink-0" size={24} />
                <div>
                  <p className="font-medium text-text-primary">{label}</p>
                  <p className="text-text-muted text-sm">{new Date(t.earned_at).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

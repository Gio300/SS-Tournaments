'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';

type FollowingProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  game_tag: string | null;
  power_level: number;
};

function FollowingContent() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<FollowingProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    async function fetch() {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', uid);
      const ids = (follows ?? []).map((f) => f.following_id);
      if (ids.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, game_tag, power_level')
        .in('id', ids)
        .order('username');
      setProfiles((profilesData ?? []) as FollowingProfile[]);
      setLoading(false);
    }
    fetch();
  }, [user?.id ?? '']);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Following</h1>
      <p className="text-text-muted text-sm mb-6">
        People you follow. Click to view their profile.
      </p>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-border bg-panel p-8 text-center">
          <Users className="mx-auto text-text-muted mb-4" size={48} />
          <p className="text-text-muted mb-4">You&apos;re not following anyone yet.</p>
          <Link href="/search/" className="text-accent hover:underline font-medium">
            Search for users to follow
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((p) => (
            <Link
              key={p.id}
              href={`/profile/${p.id}/`}
              className="flex items-center gap-4 rounded-xl border border-border bg-panel p-4 hover:border-accent/50 transition"
            >
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  {p.username[0] ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary">{p.username}</p>
                {p.game_tag && <p className="text-xs text-text-muted">@{p.game_tag}</p>}
                <p className="text-sm text-accent">{p.power_level} pts</p>
              </div>
              <span className="text-text-muted text-sm">View profile →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FollowingPage() {
  return (
    <AuthGuard>
      <FollowingContent />
    </AuthGuard>
  );
}

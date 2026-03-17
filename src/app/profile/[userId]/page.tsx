'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { TrophyBadges } from '@/components/TrophyBadges'
import type { Reel } from '@/types/database'

type ReelWithProfile = Reel & { profiles?: { username: string } }

export default function ProfileViewPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const { user } = useAuth()
  const [profile, setProfile] = useState<{ id: string; username: string; avatar_url: string | null; bio: string | null; status: string | null; power_level: number | null } | null>(null)
  const [reels, setReels] = useState<ReelWithProfile[]>([])
  const [trophyTypes, setTrophyTypes] = useState<string[]>([])

  useEffect(() => {
    if (!userId) return
    async function fetch() {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, status, power_level')
        .eq('id', userId)
        .single()
      setProfile(profileData ?? null)
      if (profileData) {
        const [{ data: reelsData }, { data: trophiesData }] = await Promise.all([
          supabase.from('reels').select('*, profiles(username)').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('trophies').select('trophy_type').eq('profile_id', userId),
        ])
        setReels(reelsData ?? [])
        setTrophyTypes((trophiesData ?? []).map((t) => t.trophy_type))
      }
    }
    fetch()
  }, [userId])

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="rounded-xl border border-border bg-panel p-6 mb-8">
        <div className="flex items-start gap-6">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent text-2xl font-bold">
              {profile.username[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-text-primary">{profile.username}</h1>
            <p className="text-accent text-sm mt-1 flex items-center gap-2">
              Power level: {profile.power_level ?? 0} pts
              <TrophyBadges trophyTypes={trophyTypes} />
              <Link href={`/profile/${userId}/trophies/`} className="text-accent hover:underline text-sm">Trophies earned</Link>
            </p>
            {profile.status && <p className="text-text-muted mt-2 italic">&quot;{profile.status}&quot;</p>}
            {profile.bio && <p className="text-text-muted mt-2">{profile.bio}</p>}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-4">Reels</h2>
      <div className="space-y-4">
        {reels.map((reel) => (
          <Link
            key={reel.id}
            href={`/reels/${reel.id}/`}
            className="block rounded-lg border border-border bg-panel p-4 hover:border-accent/50 transition-colors"
          >
            <h3 className="font-medium text-text-primary">{reel.title}</h3>
            <p className="text-sm text-text-muted">{reel.clip_ids?.length ?? 0} clips</p>
          </Link>
        ))}
      </div>
      {reels.length === 0 && <p className="text-text-muted">No reels yet.</p>}
      <div className="flex gap-4 mt-6">
        <Link href="/profile/" className="text-accent hover:underline text-sm">← My profile</Link>
        <Link href="/following/" className="text-accent hover:underline text-sm">Following</Link>
      </div>
    </div>
  )
}

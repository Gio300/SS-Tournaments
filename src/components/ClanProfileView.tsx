'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Server, Channel } from '@/types/database'

interface MemberWithProfile {
  id: string
  user_id: string
  role: string
  profile?: { username: string; avatar_url?: string }
}

interface ClanProfileViewProps {
  server: Server
  channels: Channel[]
  serverId: string
  isMember: boolean
}

export function ClanProfileView({ server, channels, serverId, isMember }: ClanProfileViewProps) {
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [reels, setReels] = useState<{ id: string; title: string; user_id: string }[]>([])

  useEffect(() => {
    async function fetch() {
      const { data: membersData } = await supabase
        .from('server_members')
        .select('id, user_id, role')
        .eq('server_id', serverId)
      const membersList = (membersData ?? []) as { id: string; user_id: string; role: string }[]
      const userIds = membersList.map((m) => m.user_id)
      const { data: profilesData } = userIds.length
        ? await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds)
        : { data: [] }
      const profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]))
      setMembers(
        membersList.map((m) => ({
          ...m,
          profile: profileMap.get(m.user_id),
        })) as MemberWithProfile[]
      )

      if (membersList.length) {
        const { data: reelsData } = await supabase
          .from('reels')
          .select('id, title, user_id')
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
          .limit(6)
        setReels(reelsData ?? [])
      }
    }
    fetch()
  }, [serverId])

  const isUltra = server.ultra_tier_expires_at && new Date(server.ultra_tier_expires_at) > new Date()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="rounded-xl border border-border bg-panel overflow-hidden mb-8">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-accent/20 to-accent-secondary/20" />
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {server.icon_url ? (
              <img src={server.icon_url} alt="" className="w-20 h-20 rounded-xl border-4 border-panel" />
            ) : (
              <div className="w-20 h-20 rounded-xl border-4 border-panel bg-accent/20 flex items-center justify-center text-accent font-bold text-2xl">
                {server.name[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-bold text-text-primary">{server.name}</h1>
                {server.clan_tag && (
                  <span className="text-accent font-mono text-lg">[{server.clan_tag}]</span>
                )}
                {isUltra && (
                  <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent font-medium">Ultra</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-semibold text-text-primary mb-4">Channels</h2>
          <div className="space-y-2">
            {channels.map((ch) => (
              <Link
                key={ch.id}
                href={`/boards/${serverId}/${ch.id}/`}
                className="block px-4 py-2 rounded-lg bg-panel border border-border hover:border-accent/50 text-text-primary transition"
              >
                # {ch.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-text-primary mb-4">Members ({members.length})</h2>
          <div className="space-y-2 max-h-48 overflow-auto">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-panel border border-border"
              >
                {m.profile?.avatar_url ? (
                  <img src={m.profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium">
                    {m.profile?.username?.[0] ?? '?'}
                  </div>
                )}
                <span className="text-text-primary font-medium">@{m.profile?.username ?? 'Unknown'}</span>
                {m.role !== 'member' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">{m.role}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {reels.length > 0 && (
        <div>
          <h2 className="font-semibold text-text-primary mb-4">Recent reels from clan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reels.map((r) => (
              <Link
                key={r.id}
                href={`/reels/${r.id}/`}
                className="p-4 rounded-lg bg-panel border border-border hover:border-accent/50 transition"
              >
                <p className="font-medium text-text-primary truncate">{r.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isMember && (
        <div className="mt-8">
          <Link
            href={`/boards/${serverId}/dashboard/`}
            className="inline-block px-4 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:border-accent transition"
          >
            Clan dashboard
          </Link>
        </div>
      )}
    </div>
  )
}

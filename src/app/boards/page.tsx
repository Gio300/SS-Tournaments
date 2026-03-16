'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Server } from '@/types/database'

type ServerWithStatus = Server & { isMember?: boolean; applicationStatus?: 'pending' | 'approved' | 'rejected' }

export default function BoardsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [servers, setServers] = useState<ServerWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('servers')
        .select('*')
        .order('ultra_tier_expires_at', { ascending: false, nullsFirst: false })
        .order('name')
      const list = (data ?? []) as ServerWithStatus[]
      if (user) {
        const { data: members } = await supabase.from('server_members').select('server_id').eq('user_id', user.id)
        const memberIds = new Set((members ?? []).map((m) => m.server_id))
        const { data: apps } = await supabase
          .from('server_applications')
          .select('server_id, status')
          .eq('user_id', user.id)
          .eq('status', 'pending')
        const appMap = new Map((apps ?? []).map((a) => [a.server_id, a.status]))
        list.forEach((s) => {
          s.isMember = memberIds.has(s.id)
          s.applicationStatus = appMap.get(s.id) ?? undefined
        })
      }
      setServers(list)
      setLoading(false)
    }
    fetch()
  }, [user?.id])

  async function handleJoin(server: ServerWithStatus) {
    if (!user) {
      router.push('/login/')
      return
    }
    const joinMode = (server as Server & { join_mode?: string }).join_mode ?? 'open'
    if (joinMode === 'apply') {
      router.push(`/boards/${server.id}/apply/`)
      return
    }
    const { error } = await supabase.from('server_members').insert({
      server_id: server.id,
      user_id: user.id,
      role: 'member',
    })
    if (!error) router.push(`/boards/${server.id}/`)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
        <div className="animate-pulse text-accent">Loading clans...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">Clans</h1>
        <Link
          href="/boards/create/"
          className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 transition"
        >
          Create Clan
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => {
          const s = server as Server & { join_mode?: string; ultra_tier_expires_at?: string }
          const joinMode = s.join_mode ?? 'open'
          const isUltra = s.ultra_tier_expires_at && new Date(s.ultra_tier_expires_at) > new Date()
          const card = (
            <div className="rounded-xl border border-border bg-panel p-6 hover:border-accent/50 transition flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {server.icon_url ? (
                  <img src={server.icon_url} alt="" className="w-12 h-12 rounded-xl" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold">
                    {server.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-text-primary">
                      {server.name}
                      {server.clan_tag && server.clan_tag !== 'SML' && (
                        <span className="ml-2 text-accent text-sm font-mono">[{server.clan_tag}]</span>
                      )}
                    </h2>
                    {isUltra && (
                      <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent font-medium">Ultra</span>
                    )}
                    {joinMode !== 'open' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-panel border border-border text-text-muted">
                        {joinMode}
                      </span>
                    )}
                    {server.applicationStatus === 'pending' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-accent-secondary/20 text-accent-secondary">Pending</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {server.isMember ? (
                  <Link
                    href={`/boards/${server.id}/`}
                    className="flex-1 text-center px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 transition"
                  >
                    Open
                  </Link>
                ) : server.applicationStatus === 'pending' ? (
                  <span className="flex-1 text-center px-4 py-2 rounded-lg bg-panel border border-border text-text-muted text-sm">
                    Application pending
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleJoin(server)}
                    className="flex-1 px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 transition"
                  >
                    {joinMode === 'apply' ? 'Apply' : 'Join'}
                  </button>
                )}
              </div>
            </div>
          )
          return <div key={server.id}>{card}</div>
        })}
      </div>
      {servers.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p>No clans yet.</p>
        </div>
      )}
    </div>
  )
}

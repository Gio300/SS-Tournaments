'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Server } from '@/types/database'

export default function BoardsPage() {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('servers').select('*').order('name')
      setServers(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

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
        {servers.map((server) => (
          <Link
            key={server.id}
            href={`/boards/${server.id}/`}
            className="rounded-xl border border-border bg-panel p-6 hover:border-accent/50 transition flex items-center gap-4"
          >
            {server.icon_url ? (
              <img src={server.icon_url} alt="" className="w-12 h-12 rounded-xl" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold">
                {server.name[0]}
              </div>
            )}
            <div>
              <h2 className="font-semibold text-text-primary">
                {server.name}
                {server.clan_tag && (
                  <span className="ml-2 text-accent text-sm font-mono">[{server.clan_tag}]</span>
                )}
              </h2>
            </div>
          </Link>
        ))}
      </div>
      {servers.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p>No clans yet.</p>
        </div>
      )}
    </div>
  )
}

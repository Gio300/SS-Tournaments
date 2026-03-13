'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Server, Channel } from '@/types/database'

export function BoardServerClient() {
  const params = useParams()
  const router = useRouter()
  const serverId = params.serverId as string
  const [server, setServer] = useState<Server | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!serverId) return
    async function fetch() {
      const { data: serverData } = await supabase.from('servers').select('*').eq('id', serverId).single()
      setServer(serverData)
      const { data: channelsData } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', serverId)
        .order('name')
      setChannels(channelsData ?? [])
      setLoading(false)
      const first = (channelsData ?? [])[0]
      if (first) {
        router.replace(`/boards/${serverId}/${first.id}/`)
      }
    }
    fetch()
  }, [serverId, router])

  if (loading || !server) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-text-muted">No channels in this server.</p>
        <Link href="/boards/" className="mt-4 inline-block text-accent hover:underline">← Back to Boards</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
      <div className="animate-pulse text-accent">Redirecting...</div>
    </div>
  )
}

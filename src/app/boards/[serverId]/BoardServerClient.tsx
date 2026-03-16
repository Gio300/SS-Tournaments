'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { ClanProfileView } from '@/components/ClanProfileView'
import type { Server, Channel } from '@/types/database'

export function BoardServerClient() {
  const params = useParams()
  const serverId = params.serverId as string
  const { user } = useAuth()
  const [server, setServer] = useState<Server | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [isMember, setIsMember] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
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
      if (user) {
        const { data: mem } = await supabase.from('server_members').select('id, role').eq('server_id', serverId).eq('user_id', user.id).single()
        setIsMember(!!mem)
        setUserRole(mem?.role ?? null)
      }
      setLoading(false)
    }
    fetch()
  }, [serverId, user?.id])

  if (loading || !server) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/boards/" className="inline-block mb-4 text-text-muted hover:text-accent">← Back to Clans</Link>
      <ClanProfileView server={server} channels={channels} serverId={serverId} isMember={isMember} userRole={userRole} />
    </div>
  )
}

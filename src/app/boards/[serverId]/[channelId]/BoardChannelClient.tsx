'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Server, Channel, Message } from '@/types/database'

export function BoardChannelClient() {
  const params = useParams()
  const serverId = params.serverId as string
  const channelId = params.channelId as string
  const { user } = useAuth()
  const [server, setServer] = useState<Server | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<(Message & { profiles?: { username: string } })[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [newMessage, setNewMessage] = useState('')
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
      const ch = (channelsData ?? []).find((c) => c.id === channelId) ?? (channelsData ?? [])[0]
      setActiveChannel(ch)
      setLoading(false)
    }
    fetch()
  }, [serverId, channelId])

  useEffect(() => {
    if (!activeChannel) return
    const chId = activeChannel.id
    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(username)')
        .eq('channel_id', chId)
        .order('created_at', { ascending: true })
      setMessages(data ?? [])
    }
    fetchMessages()

    const sub = supabase
      .channel(`messages:${chId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${chId}` }, fetchMessages)
      .subscribe()

    return () => {
      sub.unsubscribe()
    }
  }, [activeChannel?.id])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !activeChannel || !newMessage.trim()) return
    await supabase.from('messages').insert({
      channel_id: activeChannel.id,
      user_id: user.id,
      content: newMessage.trim(),
    })
    setNewMessage('')
  }

  if (loading || !server) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row min-h-[60vh]">
      <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-border bg-panel flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href={`/boards/${serverId}/`} className="font-semibold truncate text-text-primary hover:text-accent">
            {server.name}
          </Link>
        </div>
        <nav className="flex-1 p-2 overflow-auto flex flex-row sm:flex-col gap-1">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/boards/${serverId}/${ch.id}/`}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                activeChannel?.id === ch.id ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              # {ch.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1 flex flex-col min-h-[40vh]">
        {activeChannel ? (
          <>
            <div className="p-4 border-b border-border">
              <h2 className="font-medium text-text-primary"># {activeChannel.name}</h2>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-accent text-sm font-medium">
                      {(msg.profiles as { username?: string })?.username?.[0] ?? '?'}
                    </span>
                  </div>
                  <div>
                    <span className="text-accent text-sm font-medium">
                      {(msg.profiles as { username?: string })?.username ?? 'Unknown'}
                    </span>
                    <span className="text-text-muted text-sm ml-2">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                    <p className="text-text-primary mt-0.5">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            {user && (
              <form onSubmit={sendMessage} className="p-4 border-t border-border">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message # ${activeChannel.name}`}
                  className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted">
            Select a channel
          </div>
        )}
      </div>
    </div>
  )
}

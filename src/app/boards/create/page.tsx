'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/AuthGuard'

function CreateServerContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [clanTag, setClanTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Enter a clan name')
      return
    }
    if (!user) return
    setLoading(true)
    const { data: server, error: serverErr } = await supabase
      .from('servers')
      .insert({
        name: name.trim(),
        clan_tag: clanTag.trim() || null,
        owner_id: user.id,
        join_mode: 'open',
      })
      .select('id')
      .single()
    if (serverErr) {
      setError(serverErr.message)
      setLoading(false)
      return
    }
    await supabase.from('server_members').insert({ server_id: server.id, user_id: user.id, role: 'owner' })
    await supabase.from('channels').insert({ server_id: server.id, name: 'general', type: 'text' })
    router.push(`/boards/${server.id}/`)
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Create Clan</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-text-muted mb-1">Clan name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
            placeholder="My Clan"
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Clan tag (optional)</label>
          <input
            type="text"
            value={clanTag}
            onChange={(e) => setClanTag(e.target.value.toUpperCase().slice(0, 8))}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
            placeholder="SML"
            maxLength={8}
          />
        </div>
        {error && <p className="text-accent text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  )
}

export default function CreateServerPage() {
  return (
    <AuthGuard>
      <CreateServerContent />
    </AuthGuard>
  )
}

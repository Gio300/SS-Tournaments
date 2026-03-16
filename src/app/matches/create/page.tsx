'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/AuthGuard'
import type { Reel } from '@/types/database'

function CreateMatchContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [liveStreamUrl, setLiveStreamUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [reels, setReels] = useState<Reel[]>([])
  const [selectedReelIds, setSelectedReelIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('reels').select('*').order('created_at', { ascending: false })
      setReels(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  function toggleReel(id: string) {
    setSelectedReelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Enter a name')
      return
    }
    setSaving(true)
    const { data, error: err } = await supabase
      .from('matches')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        reel_ids: selectedReelIds,
        live_stream_url: liveStreamUrl.trim() || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        status: 'open',
      })
      .select('id')
      .single()
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push(`/matches/${data.id}/`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Create Match</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-text-muted mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
            placeholder="Weekend Finals"
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Schedule date & time (optional)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Live stream URL (optional)</label>
          <input
            type="url"
            value={liveStreamUrl}
            onChange={(e) => setLiveStreamUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent resize-none"
            placeholder="Optional description"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-2">Select reels</label>
          {loading ? (
            <p className="text-text-muted">Loading reels...</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-auto">
              {reels.map((reel) => (
                <label key={reel.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedReelIds.includes(reel.id)}
                    onChange={() => toggleReel(reel.id)}
                    className="rounded border-border"
                  />
                  <span className="truncate text-text-primary">{reel.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-accent text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Match'}
        </button>
      </form>
    </div>
  )
}

export default function CreateMatchPage() {
  return (
    <AuthGuard>
      <CreateMatchContent />
    </AuthGuard>
  )
}

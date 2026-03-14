'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function ApplyClient() {
  const params = useParams()
  const router = useRouter()
  const serverId = params.serverId as string
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <p className="text-text-muted mb-4">Sign in to apply.</p>
        <Link href="/login/" className="text-accent hover:underline">Sign in</Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    setSubmitting(true)
    const { error: err } = await supabase.from('server_applications').upsert(
      { server_id: serverId, user_id: user.id, status: 'pending', message: message.trim() || null },
      { onConflict: 'server_id,user_id' }
    )
    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push('/boards/')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Apply to join clan</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-text-muted mb-1">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
            rows={4}
            placeholder="Introduce yourself..."
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
          <Link
            href="/boards/"
            className="px-4 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Match } from '@/types/database'

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false })
      setMatches(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
        <div className="animate-pulse text-accent">Loading matches...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">Matches</h1>
        <Link
          href="/matches/create/"
          className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 transition"
        >
          Create Match
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}/`}
            className="rounded-xl border border-border bg-panel p-6 hover:border-accent/50 transition"
          >
            <h2 className="font-semibold text-lg text-text-primary">{match.name}</h2>
            <p className="text-sm text-text-muted mt-2 line-clamp-2">{match.description}</p>
            <p className="text-xs text-accent mt-4">{match.reel_ids?.length ?? 0} reels</p>
          </Link>
        ))}
      </div>
      {matches.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p>No matches yet.</p>
        </div>
      )}
    </div>
  )
}

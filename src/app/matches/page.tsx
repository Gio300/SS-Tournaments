'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Radio, Swords, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Match } from '@/types/database'

export default function MatchesPage() {
  const [section, setSection] = useState<'live' | 'upcoming' | 'played' | 'tournaments'>('played')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (section !== 'played' && section !== 'upcoming') return
    async function fetch() {
      setLoading(true)
      const now = new Date().toISOString()
      if (section === 'upcoming') {
        const { data } = await supabase
          .from('matches')
          .select('*')
          .not('scheduled_at', 'is', null)
          .gt('scheduled_at', now)
          .order('scheduled_at', { ascending: true })
        setMatches(data ?? [])
      } else {
        const { data } = await supabase
          .from('matches')
          .select('*')
          .order('created_at', { ascending: false })
        setMatches(data ?? [])
      }
      setLoading(false)
    }
    fetch()
  }, [section])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-6">Matches</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => setSection('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            section === 'live' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          <Radio size={18} /> Live
        </button>
        <button
          type="button"
          onClick={() => setSection('upcoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            section === 'upcoming' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          <Calendar size={18} /> Upcoming
        </button>
        <button
          type="button"
          onClick={() => setSection('played')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            section === 'played' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          <Swords size={18} /> Played
        </button>
        <button
          type="button"
          onClick={() => setSection('tournaments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            section === 'tournaments' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          <Trophy size={18} /> Tournaments
        </button>
      </div>

      {section === 'upcoming' && (
        <>
          <div className="flex justify-end mb-6">
            <Link
              href="/matches/create/"
              className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 transition"
            >
              Schedule Match
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <span className="animate-pulse text-accent">Loading upcoming matches...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}/`}
                  className="rounded-xl border border-border bg-panel p-6 hover:border-accent/50 transition"
                >
                  <h2 className="font-semibold text-lg text-text-primary">{match.name}</h2>
                  <p className="text-sm text-accent mt-2">
                    {match.scheduled_at
                      ? new Date(match.scheduled_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </p>
                  <p className="text-sm text-text-muted mt-2 line-clamp-2">{match.description}</p>
                  <p className="text-xs text-text-muted mt-4">{match.reel_ids?.length ?? 0} reels</p>
                </Link>
              ))}
            </div>
          )}
          {!loading && matches.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <p>No upcoming matches scheduled.</p>
              <Link href="/matches/create/" className="mt-4 inline-block text-accent hover:underline">
                Schedule a match
              </Link>
            </div>
          )}
        </>
      )}

      {section === 'live' && (
        <div className="rounded-xl border border-border bg-panel p-8 text-center">
          <p className="text-text-muted mb-4">Watch live streams</p>
          <Link href="/live/" className="inline-block px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90">
            Go to Live
          </Link>
        </div>
      )}

      {section === 'tournaments' && (
        <div className="rounded-xl border border-border bg-panel p-8 text-center">
          <p className="text-text-muted mb-4">Browse and join tournaments</p>
          <Link href="/tournaments/" className="inline-block px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90">
            Go to Tournaments
          </Link>
        </div>
      )}

      {section === 'played' && (
        <>
          <div className="flex justify-end mb-6">
            <Link
              href="/matches/create/"
              className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 transition"
            >
              Create Match
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <span className="animate-pulse text-accent">Loading matches...</span>
            </div>
          ) : (
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
          )}
          {!loading && matches.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <p>No matches yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

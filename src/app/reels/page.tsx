'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Reel } from '@/types/database'

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('reels')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
      setReels(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
        <div className="animate-pulse text-accent">Loading reels...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">Highlight Reels</h1>
        <Link
          href="/reels/create/"
          className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 transition"
        >
          Create Reel
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reels.map((reel) => (
          <Link
            key={reel.id}
            href={`/reels/${reel.id}/`}
            className="group rounded-xl border border-border bg-panel overflow-hidden hover:border-accent/50 transition"
          >
            <div className="aspect-video bg-[#0B0E14] flex items-center justify-center">
              {reel.thumbnail ? (
                <img src={reel.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-border group-hover:text-accent/50 transition-colors">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-semibold truncate text-text-primary">{reel.title}</h2>
              <p className="text-sm text-text-muted mt-1">
                {(reel as Reel & { profiles?: { username: string } }).profiles?.username ?? 'Unknown'} • {reel.clip_ids?.length ?? 0} clips
              </p>
            </div>
          </Link>
        ))}
      </div>
      {reels.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p>No reels yet. Create the first one!</p>
          <Link href="/reels/create/" className="mt-4 inline-block text-accent hover:underline">Create Reel</Link>
        </div>
      )}
    </div>
  )
}

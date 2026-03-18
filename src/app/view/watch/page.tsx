'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { extractYouTubeId } from '@/lib/youtube'
import type { Reel, Clip, LiveStream } from '@/types/database'

type PlaylistItem = { type: 'reel'; id: string } | { type: 'live'; id: string }

type ReelWithProfile = Reel & { profiles?: { username: string } }
type PlaylistEntry =
  | { type: 'reel'; id: string; data: ReelWithProfile; clips: Clip[] }
  | { type: 'live'; id: string; data: LiveStream }

function idsToPlaylist(ids: string): PlaylistItem[] {
  if (!ids.trim()) return []
  return ids.split(',').map((s) => {
    const [type, id] = s.trim().split(':')
    if (type === 'reel' && id) return { type: 'reel' as const, id }
    if (type === 'live' && id) return { type: 'live' as const, id }
    return null
  }).filter((x): x is PlaylistItem => x !== null)
}

function playlistToIds(items: PlaylistItem[]): string {
  return items.map((i) => `${i.type}:${i.id}`).join(',')
}

function YouTubeEmbed({ clip }: { clip: Clip }) {
  const videoId = clip.url_or_path.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? clip.url_or_path
  const start = clip.start_sec ?? 0
  const end = clip.end_sec ? `&end=${clip.end_sec}` : ''
  const src = `https://www.youtube.com/embed/${videoId}?start=${start}${end}`

  return (
    <div className="aspect-video rounded-lg overflow-hidden border border-border">
      <iframe
        src={src}
        title={clip.title ?? 'Clip'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  )
}

function ReelPlayer({ reel, clips }: { reel: ReelWithProfile; clips: Clip[] }) {
  const youtubeClips = clips.filter((c) => c.source_type === 'youtube')
  const uploadClips = clips.filter((c) => c.source_type === 'upload')

  if (reel.combined_video_url) {
    return <video src={reel.combined_video_url} controls className="w-full h-full" />
  }
  if (youtubeClips.length > 0) {
    return (
      <div className="w-full h-full p-4 overflow-auto space-y-4">
        {youtubeClips.map((clip) => (
          <YouTubeEmbed key={clip.id} clip={clip} />
        ))}
      </div>
    )
  }
  if (uploadClips.length > 0) {
    return <video src={uploadClips[0].url_or_path} controls className="w-full h-full" />
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-text-muted">
      <p>No clips.</p>
    </div>
  )
}

function LivePlayer({ stream }: { stream: LiveStream }) {
  const videoId = extractYouTubeId(stream.youtube_url)
  if (!videoId) return <div className="w-full h-full flex items-center justify-center text-text-muted">Invalid stream URL</div>
  const src = `https://www.youtube.com/embed/${videoId}`
  return (
    <iframe
      src={src}
      title={stream.title ?? 'Live'}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full"
    />
  )
}

function WatchContent() {
  const searchParams = useSearchParams()
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
  const [entries, setEntries] = useState<PlaylistEntry[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [reels, setReels] = useState<(Reel & { profiles?: { username: string } })[]>([])
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [loading, setLoading] = useState(true)

  const syncUrl = useCallback((items: PlaylistItem[]) => {
    const ids = playlistToIds(items)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (ids) url.searchParams.set('ids', ids)
      else url.searchParams.delete('ids')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  useEffect(() => {
    const ids = searchParams.get('ids') ?? ''
    setPlaylist(idsToPlaylist(ids))
  }, [searchParams])

  useEffect(() => {
    async function fetchReelsAndStreams() {
      const [reelsRes, streamsRes] = await Promise.all([
        supabase.from('reels').select('*, profiles(username)').order('created_at', { ascending: false }),
        supabase.from('live_streams').select('*').order('created_at', { ascending: false }),
      ])
      setReels((reelsRes.data ?? []) as (Reel & { profiles?: { username: string } })[])
      setStreams((streamsRes.data ?? []) as LiveStream[])
      setLoading(false)
    }
    fetchReelsAndStreams()
  }, [])

  useEffect(() => {
    if (playlist.length === 0) {
      setEntries([])
      setActiveIndex(0)
      return
    }

    async function fetchEntries() {
      const results: PlaylistEntry[] = []
      for (const item of playlist) {
        if (item.type === 'reel') {
          const { data: reel } = await supabase.from('reels').select('*, profiles(username)').eq('id', item.id).single()
          if (!reel) continue
          let clips: Clip[] = []
          if (reel.clip_ids?.length) {
            const { data: clipsData } = await supabase.from('clips').select('*').in('id', reel.clip_ids)
            clips = clipsData ?? []
          }
          results.push({ type: 'reel', id: item.id, data: reel as ReelWithProfile, clips })
        } else {
          const { data: stream } = await supabase.from('live_streams').select('*').eq('id', item.id).single()
          if (!stream) continue
          results.push({ type: 'live', id: item.id, data: stream as LiveStream })
        }
      }
      setEntries(results)
      setActiveIndex(0)
    }
    fetchEntries()
  }, [playlist])

  function addReel(id: string) {
    if (playlist.some((p) => p.type === 'reel' && p.id === id)) return
    const next = [...playlist, { type: 'reel' as const, id }]
    setPlaylist(next)
    syncUrl(next)
  }

  function addLive(id: string) {
    if (playlist.some((p) => p.type === 'live' && p.id === id)) return
    const next = [...playlist, { type: 'live' as const, id }]
    setPlaylist(next)
    syncUrl(next)
  }

  function removeFromPlaylist(index: number) {
    const next = playlist.filter((_, i) => i !== index)
    setPlaylist(next)
    syncUrl(next)
    if (activeIndex >= next.length && next.length > 0) setActiveIndex(Math.max(0, next.length - 1))
    else if (activeIndex >= index && activeIndex > 0) setActiveIndex(activeIndex - 1)
  }

  const currentEntry = entries[activeIndex]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">Watch</h1>
        <Link href="/view/" className="text-accent hover:underline text-sm">← View</Link>
      </div>
      <p className="text-text-muted mb-6">Build a playlist of reels and live streams. Watch multiple in sequence.</p>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-72 shrink-0">
          <div className="rounded-xl border border-border bg-panel p-4 sticky top-24">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Add to playlist</h3>

            <div className="mb-4">
              <p className="text-xs text-text-muted mb-2">Reels</p>
              {loading ? (
                <p className="text-xs text-text-muted">Loading...</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {reels.slice(0, 20).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => addReel(r.id)}
                      className="block w-full text-left px-2 py-1.5 rounded text-sm text-text-primary hover:bg-accent/10 truncate"
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-text-muted mb-2">Live streams</p>
              {loading ? (
                <p className="text-xs text-text-muted">Loading...</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {streams.slice(0, 20).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addLive(s.id)}
                      className="block w-full text-left px-2 py-1.5 rounded text-sm text-text-primary hover:bg-accent/10 truncate"
                    >
                      {s.title || 'Untitled stream'}
                    </button>
                  ))}
                  {streams.length === 0 && <p className="text-xs text-text-muted">No streams yet.</p>}
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {entries.length === 0 ? (
            <div className="rounded-xl border border-border bg-panel p-12 text-center text-text-muted">
              <p>Your playlist is empty.</p>
              <p className="text-sm mt-2">Add reels or live streams from the sidebar.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-panel overflow-hidden mb-4">
                <div className="aspect-video bg-black">
                  {currentEntry?.type === 'reel' && (
                    <ReelPlayer reel={currentEntry.data} clips={currentEntry.clips} />
                  )}
                  {currentEntry?.type === 'live' && (
                    <LivePlayer stream={currentEntry.data} />
                  )}
                </div>
                <div className="p-4 flex items-center justify-between">
                  <h2 className="font-semibold text-text-primary truncate flex-1">
                    {currentEntry?.type === 'reel' ? currentEntry.data.title : currentEntry?.data.title ?? 'Live'}
                  </h2>
                  <div className="flex gap-2 ml-2">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                      disabled={activeIndex === 0}
                      className="px-3 py-1 rounded border border-border text-text-muted hover:text-text-primary disabled:opacity-40 text-sm"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveIndex(Math.min(entries.length - 1, activeIndex + 1))}
                      disabled={activeIndex === entries.length - 1}
                      className="px-3 py-1 rounded border border-border text-text-muted hover:text-text-primary disabled:opacity-40 text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-panel p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Playlist</h3>
                <ul className="space-y-2">
                  {entries.map((entry, i) => (
                    <li
                      key={`${entry.type}-${entry.id}`}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition ${
                        i === activeIndex ? 'bg-accent/20 border border-accent/50' : 'hover:bg-panel'
                      }`}
                      onClick={() => setActiveIndex(i)}
                    >
                      <span className="text-sm text-text-primary truncate flex-1">
                        {entry.type === 'reel' ? '🎬' : '🔴'} {entry.data.title ?? 'Untitled'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFromPlaylist(i) }}
                        className="text-text-muted hover:text-accent text-sm ml-2"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    }>
      <WatchContent />
    </Suspense>
  )
}

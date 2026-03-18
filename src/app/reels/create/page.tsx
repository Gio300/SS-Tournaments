'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import { AuthGuard } from '@/components/AuthGuard'
import { ExtensionRequiredModal } from '@/components/ExtensionRequiredModal'
import { useExtensionPrompt } from '@/hooks/useExtensionPrompt'
import { extractYouTubeId } from '@/lib/youtube'
import type { UserYoutubeLink } from '@/types/database'

type ClipInput =
  | { type: 'youtube'; url: string; startSec: number; endSec: number; title?: string }
  | { type: 'upload'; file: File; title?: string }

type TimeMode = 'auto' | 'manual'

const PROGRESS_STEPS = ['Downloading clips', 'Combining videos', 'Uploading', 'Creating reel', 'Done']

function ProgressSection({
  show,
  progress,
  step,
}: {
  show: boolean
  progress: number
  step: string
}) {
  if (!show) return null
  const stepIndex = PROGRESS_STEPS.indexOf(step)
  return (
    <div className="rounded-xl border border-border bg-panel p-6 animate-in fade-in duration-300">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Creating your highlight</h3>
      <div className="h-3 rounded-full bg-bg overflow-hidden mb-3">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-text-muted mb-4">{step}</p>
      <div className="flex gap-1">
        {PROGRESS_STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded transition-colors ${i <= stepIndex ? 'bg-accent' : 'bg-bg'}`}
            title={s}
          />
        ))}
      </div>
    </div>
  )
}

function YoutubeSignInModal({
  show,
  onClose,
  onContinue,
  cookies,
  onCookiesChange,
  creating,
  progress,
  step,
}: {
  show: boolean
  onClose: () => void
  onContinue: () => void
  cookies: string
  onCookiesChange: (v: string) => void
  creating: boolean
  progress: number
  step: string
}) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={creating ? undefined : onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-panel shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        {creating ? (
          <>
            <h3 className="font-display text-lg font-bold text-text-primary mb-2">Creating your highlight</h3>
            <div className="h-3 rounded-full bg-bg overflow-hidden mb-3">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-text-muted">{step}</p>
          </>
        ) : (
          <>
            <h3 className="font-display text-lg font-bold text-text-primary mb-2">Link YouTube to create highlight</h3>
            <p className="text-sm text-text-muted mb-4">
              YouTube may block downloads. Install VidBridge for one-click sign-in, or sign in to YouTube and paste cookies below.
            </p>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 mb-4"
            >
              Open YouTube to sign in
            </a>
            <textarea
              value={cookies}
              onChange={(e) => onCookiesChange(e.target.value)}
              placeholder="Paste Netscape-format cookies here (optional – try without first)"
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text-primary text-xs font-mono placeholder:text-text-muted mb-2"
            />
            <p className="text-xs text-text-muted mb-4">
              <a href="https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">How to export cookies</a> • Cookies are not stored
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary">
                Cancel
              </button>
              <button
                type="button"
                onClick={onContinue}
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Create Highlight
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CreateReelContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showPrompt, dismissPrompt } = useExtensionPrompt('create')
  const { concatVideos, loading: ffmpegLoading, progress } = useFFmpeg()
  const [title, setTitle] = useState('')
  const [clips, setClips] = useState<ClipInput[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [timeMode, setTimeMode] = useState<TimeMode>('auto')
  const [autoSecondsPerClip, setAutoSecondsPerClip] = useState(30)
  const [youtubeStart, setYoutubeStart] = useState('')
  const [youtubeEnd, setYoutubeEnd] = useState('')
  const [savedLinks, setSavedLinks] = useState<UserYoutubeLink[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pipStep, setPipStep] = useState('')
  const [pipProgress, setPipProgress] = useState(0)
  const [showPip, setShowPip] = useState(false)
  const [youtubeCookies, setYoutubeCookies] = useState('')
  const [showYoutubeModal, setShowYoutubeModal] = useState(false)
  const [completedReel, setCompletedReel] = useState<{ id: string; combinedVideoUrl: string; title: string } | null>(null)

  useEffect(() => {
    const urlParam = searchParams.get('url')
    if (urlParam && /youtube\.com|youtu\.be/.test(urlParam)) {
      setYoutubeUrl(urlParam)
      router.replace('/reels/create/', { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => {
    if (!user) return
    supabase.from('user_youtube_links').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setSavedLinks(data ?? []))
  }, [user?.id])

  function addYoutubeClip(url?: string, startSec?: number, endSec?: number) {
    const urlToUse = url ?? youtubeUrl
    const videoId = extractYouTubeId(urlToUse)
    if (!videoId) {
      setError('Invalid YouTube URL')
      return
    }
    let start: number
    let end: number
    if (startSec !== undefined && endSec !== undefined) {
      start = startSec
      end = endSec
    } else if (timeMode === 'auto') {
      start = 0
      end = autoSecondsPerClip
    } else {
      start = parseInt(youtubeStart, 10) || 0
      end = parseInt(youtubeEnd, 10) || 0
    }
    if (end > 0 && end <= start) {
      setError('End time must be after start time')
      return
    }
    const fullUrl = urlToUse.startsWith('http') ? urlToUse : `https://www.youtube.com/watch?v=${videoId}`
    setClips((c) => [...c, { type: 'youtube', url: fullUrl, startSec: start, endSec: end || 0 }])
    setYoutubeUrl('')
    setYoutubeStart('')
    setYoutubeEnd('')
    setError('')
  }

  function autoAddAllSaved() {
    setError('')
    savedLinks.forEach((link) => addYoutubeClip(link.url))
  }

  function addFileClip(files: FileList | null) {
    if (!files?.length) return
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (f.type.startsWith('video/')) {
        setClips((c) => [...c, { type: 'upload', file: f }])
      }
    }
  }

  function removeClip(i: number) {
    setClips((c) => c.filter((_, j) => j !== i))
  }

  function requestExtensionCookies(): Promise<string | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 2000)
      const handler = (e: CustomEvent<{ cookies: string }>) => {
        clearTimeout(timeout)
        document.removeEventListener('buttonmasherz:yt-cookies', handler as EventListener)
        document.removeEventListener('buttonmasherz:yt-cookies-error', errHandler as EventListener)
        resolve(e.detail?.cookies?.trim() || null)
      }
      const errHandler = () => {
        clearTimeout(timeout)
        document.removeEventListener('buttonmasherz:yt-cookies', handler as EventListener)
        document.removeEventListener('buttonmasherz:yt-cookies-error', errHandler as EventListener)
        resolve(null)
      }
      document.addEventListener('buttonmasherz:yt-cookies', handler as EventListener)
      document.addEventListener('buttonmasherz:yt-cookies-error', errHandler as EventListener)
      document.dispatchEvent(new CustomEvent('buttonmasherz:request-yt-cookies'))
    })
  }

  async function doYoutubeCombine() {
    const youtubeClips = clips.filter((c): c is ClipInput & { type: 'youtube' } => c.type === 'youtube')
    const combineUrl = process.env.NEXT_PUBLIC_COMBINE_API_URL!
    setSaving(true)
    setShowPip(true)
    setPipStep('Downloading clips')
    setPipProgress(15)
    try {
      const extensionCookies = await requestExtensionCookies()
      const cookiesToUse = extensionCookies || youtubeCookies.trim() || undefined

      setPipStep('Combining videos')
      setPipProgress(40)
      const res = await fetch(`${combineUrl.replace(/\/$/, '')}/combine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: youtubeClips.map((c) => c.url),
          title: title.trim(),
          userId: user!.id,
          ...(cookiesToUse && { cookies: cookiesToUse }),
        }),
      })
      const data = await res.json()
      // #region agent log
      if (!res.ok) {
        fetch('http://127.0.0.1:7308/ingest/8d921e9d-92c7-4815-8e32-88bd8715ba82',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8792d5'},body:JSON.stringify({sessionId:'8792d5',location:'reels/create/page.tsx:combine',message:'Combine API error',data:{status:res.status,error:data.error,urls:youtubeClips.map(c=>c.url)},hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
      }
      // #endregion
      if (!res.ok) throw new Error(data.error || 'Combine failed')
      setPipStep('Done')
      setPipProgress(100)
      setCompletedReel({ id: data.reelId, combinedVideoUrl: data.combinedVideoUrl, title: title.trim() })
      setShowYoutubeModal(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Combine failed')
    } finally {
      setShowPip(false)
      setSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) {
      setError('Enter a title')
      return
    }
    const uploadClips = clips.filter((c): c is ClipInput & { type: 'upload' } => c.type === 'upload')
    const youtubeClips = clips.filter((c): c is ClipInput & { type: 'youtube' } => c.type === 'youtube')

    if (uploadClips.length > 0 && uploadClips.length < 2) {
      setError('Need 2–8 uploaded clips to combine. Use YouTube clips only for reference-only reels.')
      return
    }
    if (uploadClips.length > 8) {
      setError('Maximum 8 upload clips')
      return
    }
    if (youtubeClips.length >= 2 && youtubeClips.length <= 8 && uploadClips.length === 0) {
      const combineUrl = process.env.NEXT_PUBLIC_COMBINE_API_URL
      if (!combineUrl) {
        setError('Combine service not configured. Add NEXT_PUBLIC_COMBINE_API_URL to enable YouTube combine, or upload 2–8 video files instead.')
        return
      }
      setShowYoutubeModal(true)
      return
    }

    setSaving(true)
    setShowPip(true)
    setPipStep('Initializing')
    setPipProgress(5)

    try {
      let combinedUrl: string | null = null

      if (uploadClips.length >= 2) {
        setPipStep('Combining videos')
        setPipProgress(20)
        const blob = await concatVideos(uploadClips.map((c) => c.file))
        if (blob) {
          setPipStep('Uploading')
          setPipProgress(60)
          const path = `${user!.id}/${crypto.randomUUID()}.mp4`
          const { error: uploadErr } = await supabase.storage.from('videos').upload(path, blob, {
            contentType: 'video/mp4',
            upsert: false,
          })
          if (uploadErr) throw uploadErr
          const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path)
          combinedUrl = urlData.publicUrl
        }
      }

      setPipStep('Processing clips')
      setPipProgress(uploadClips.length >= 2 ? 70 : 30)
      const clipIds: string[] = []

      for (const c of youtubeClips) {
        const { data: clipData } = await supabase
          .from('clips')
          .insert({
            user_id: user!.id,
            source_type: 'youtube',
            url_or_path: c.url,
            start_sec: c.startSec,
            end_sec: c.endSec || null,
            title: c.title,
          })
          .select('id')
          .single()
        if (clipData) clipIds.push(clipData.id)
      }

      for (const c of uploadClips) {
        const path = `${user!.id}/clips/${crypto.randomUUID()}_${c.file.name}`
        const { error: upErr } = await supabase.storage.from('videos').upload(path, c.file, {
          contentType: c.file.type,
          upsert: false,
        })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path)
        const { data: clipData } = await supabase
          .from('clips')
          .insert({
            user_id: user!.id,
            source_type: 'upload',
            url_or_path: urlData.publicUrl,
            title: c.title,
          })
          .select('id')
          .single()
        if (clipData) clipIds.push(clipData.id)
      }

      setPipStep('Creating reel')
      setPipProgress(90)
      const { data: reelData, error: reelErr } = await supabase
        .from('reels')
        .insert({
          user_id: user!.id,
          title: title.trim(),
          clip_ids: clipIds,
          combined_video_url: combinedUrl,
        })
        .select('id')
        .single()

      if (reelErr) throw reelErr
      setPipStep('Done')
      setPipProgress(100)
      setCompletedReel({ id: reelData.id, combinedVideoUrl: combinedUrl ?? '', title: title.trim() })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create reel')
      setShowPip(false)
    } finally {
      setSaving(false)
    }
  }

  const youtubeClips = clips.filter((c): c is ClipInput & { type: 'youtube' } => c.type === 'youtube')
  const uploadClips = clips.filter((c): c is ClipInput & { type: 'upload' } => c.type === 'upload')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <ExtensionRequiredModal show={showPrompt} onSkip={dismissPrompt} />
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Create Highlight</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-text-muted mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
            placeholder="Weekend Match Highlights"
          />
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-2">Add YouTube clip (URL)</label>
          <p className="text-xs text-text-muted mb-2">Paste a URL and add. Add 2–8 YouTube clips to combine them into one highlight.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTimeMode('auto')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  timeMode === 'auto' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setTimeMode('manual')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  timeMode === 'manual' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
                }`}
              >
                Manual
              </button>
            </div>
            {timeMode === 'auto' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-muted">Seconds per clip:</label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={autoSecondsPerClip}
                  onChange={(e) => setAutoSecondsPerClip(Math.max(5, Math.min(600, parseInt(e.target.value, 10) || 30)))}
                  className="w-20 px-2 py-1 rounded bg-panel border border-border text-text-primary text-sm"
                />
              </div>
            )}
            {timeMode === 'manual' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={youtubeStart}
                  onChange={(e) => setYoutubeStart(e.target.value)}
                  placeholder="Start (sec)"
                  className="w-24 px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
                />
                <input
                  type="number"
                  value={youtubeEnd}
                  onChange={(e) => setYoutubeEnd(e.target.value)}
                  placeholder="End (sec)"
                  className="w-24 px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            )}
            <button type="button" onClick={() => addYoutubeClip()} className="px-4 py-2 rounded-lg border border-accent text-accent hover:bg-accent/10">
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-2">Auto-add from saved links</label>
          {savedLinks.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={autoAddAllSaved}
                  className="px-4 py-2 rounded-lg border border-accent text-accent text-sm font-medium hover:bg-accent/10"
                >
                  Auto-add all saved ({savedLinks.length})
                </button>
              </div>
              <div className="space-y-2">
                {savedLinks.map((link) => (
                  <div key={link.id} className="flex items-center gap-2 flex-wrap">
                    <span className="truncate text-sm text-text-primary flex-1 min-w-0">{link.url}</span>
                    <button type="button" onClick={() => addYoutubeClip(link.url)} className="px-3 py-1 rounded border border-border text-text-muted text-sm hover:bg-panel hover:text-text-primary">
                      Add one
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-text-muted">
              <Link href="/profile/" className="text-accent hover:underline">Save links in Profile</Link> for quick Auto-add. Or paste URLs above.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-2">Or upload clips (2–8 for combining)</label>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => addFileClip(e.target.files)}
            className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white file:font-semibold"
          />
        </div>

        {clips.length > 0 && (
          <div>
            <label className="block text-sm text-text-muted mb-2">Clips ({clips.length})</label>
            <ul className="space-y-2">
              {clips.map((c, i) => (
                <li key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-panel border border-border">
                  <span className="truncate text-sm text-text-primary">
                    {c.type === 'youtube' ? c.url : c.file.name}
                    {c.type === 'youtube' && (c.startSec > 0 || c.endSec > 0) && ` (${c.startSec}s–${c.endSec}s)`}
                  </span>
                  <button type="button" onClick={() => removeClip(i)} className="text-accent hover:opacity-80 text-sm">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-accent text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving || ffmpegLoading || clips.length === 0}
          className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Highlight'}
        </button>
      </form>

      <ProgressSection
        show={showPip && (saving || ffmpegLoading)}
        progress={ffmpegLoading ? progress : pipProgress}
        step={ffmpegLoading ? 'Combining videos' : pipStep || 'Initializing'}
      />

      {completedReel && (
        <div className="mt-8 rounded-xl border border-border bg-panel overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 border-b border-border">
            <h3 className="font-display text-lg font-bold text-text-primary">Your highlight is ready!</h3>
            <p className="text-sm text-text-muted mt-1">{completedReel.title}</p>
          </div>
          <div className="aspect-video bg-black">
            <video src={completedReel.combinedVideoUrl} controls className="w-full h-full" />
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            <a
              href={completedReel.combinedVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90"
            >
              Download / Open
            </a>
            <button
              type="button"
              onClick={() => {
                const url = typeof window !== 'undefined' ? `${window.location.origin}/reels/${completedReel.id}/` : ''
                navigator.clipboard?.writeText(url)
              }}
              className="px-4 py-2 rounded-lg border border-accent text-accent font-semibold hover:bg-accent/10"
            >
              Copy link
            </button>
            <Link
              href={`/reels/${completedReel.id}/`}
              className="px-4 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary font-semibold"
            >
              View full reel
            </Link>
            <button
              type="button"
              onClick={() => { setCompletedReel(null); setClips([]); setTitle('') }}
              className="px-4 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary font-semibold"
            >
              Create another
            </button>
          </div>
        </div>
      )}

      <YoutubeSignInModal
        show={showYoutubeModal}
        onClose={() => setShowYoutubeModal(false)}
        onContinue={doYoutubeCombine}
        cookies={youtubeCookies}
        onCookiesChange={setYoutubeCookies}
        creating={saving}
        progress={pipProgress}
        step={pipStep}
      />
    </div>
  )
}

export default function CreateReelPage() {
  return (
    <AuthGuard>
      <CreateReelContent />
    </AuthGuard>
  )
}

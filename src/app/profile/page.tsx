'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/AuthGuard'
import { PostComposer } from '@/components/PostComposer'
import { PostCard } from '@/components/PostCard'
import type { Reel, UserYoutubeLink, Post, PostAttachment, PostPoll, PostPollOption } from '@/types/database'

type ReelWithProfile = Reel & { profiles?: { username: string; power_level?: number } }
type PostWithExtras = Post & {
  profiles?: { username: string; avatar_url: string | null; power_level?: number }
  post_attachments?: (PostAttachment & { reels?: { id: string; title: string; thumbnail: string | null } })[]
  post_polls?: (PostPoll & { post_poll_options?: (PostPollOption & { vote_count?: number; user_voted?: boolean })[] })[]
}
type FeedItem = { type: 'post'; data: PostWithExtras } | { type: 'reel'; data: ReelWithProfile }

function ProfileContent() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [wallMode, setWallMode] = useState<'my' | 'feed'>('feed')
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [youtubeLinks, setYoutubeLinks] = useState<UserYoutubeLink[]>([])
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('')
  const [addingLink, setAddingLink] = useState(false)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    setUsername(profile?.username ?? '')
    setBio(profile?.bio ?? '')
  }, [profile])

  useEffect(() => {
    if (!user) return
    const uid = user.id
    async function fetchLinks() {
      const { data } = await supabase
        .from('user_youtube_links')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      setYoutubeLinks(data ?? [])
    }
    fetchLinks()
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const uid = user.id
    async function fetchWall() {
      const ids = wallMode === 'my' ? [uid] : await (async () => {
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', uid)
        return [uid, ...(follows ?? []).map((f) => f.following_id)]
      })()

      const [reelsRes, postsRes] = await Promise.all([
        supabase.from('reels').select('*, profiles(username, power_level)').in('user_id', ids).order('created_at', { ascending: false }),
        supabase.from('posts').select(`
          *,
          profiles(username, avatar_url, power_level),
          post_attachments(*),
          post_polls(
            *,
            post_poll_options(*)
          )
        `).in('user_id', ids).order('created_at', { ascending: false })
      ])

      const reels = (reelsRes.data ?? []) as ReelWithProfile[]
      const posts = postsRes.error ? [] : ((postsRes.data ?? []) as PostWithExtras[])

      const reelIds = new Set<string>()
      for (const p of posts) {
        for (const a of p.post_attachments ?? []) {
          if (a.type === 'reel') reelIds.add(a.url_or_id)
        }
      }
      let reelsMap: Record<string, { id: string; title: string; thumbnail: string | null }> = {}
      if (reelIds.size > 0) {
        const { data: reelData } = await supabase.from('reels').select('id, title, thumbnail').in('id', Array.from(reelIds))
        for (const r of reelData ?? []) reelsMap[r.id] = r
      }
      for (const p of posts) {
        for (const a of p.post_attachments ?? []) {
          if (a.type === 'reel' && reelsMap[a.url_or_id]) (a as any).reels = reelsMap[a.url_or_id]
        }
      }

      const optionIds: string[] = []
      for (const p of posts) {
        for (const poll of p.post_polls ?? []) {
          for (const opt of poll.post_poll_options ?? []) optionIds.push(opt.id)
        }
      }
      const voteCounts: Record<string, number> = {}
      const userVotes: Record<string, boolean> = {}
      if (optionIds.length > 0) {
        const { data: votes } = await supabase.from('post_poll_votes').select('option_id, user_id').in('option_id', optionIds)
        for (const v of votes ?? []) {
          voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1
          if (v.user_id === uid) userVotes[v.option_id] = true
        }
      }
      for (const p of posts) {
        for (const poll of p.post_polls ?? []) {
          for (const opt of poll.post_poll_options ?? []) {
            (opt as any).vote_count = voteCounts[opt.id] ?? 0
            ;(opt as any).user_voted = userVotes[opt.id] ?? false
          }
        }
      }

      const items: FeedItem[] = [
        ...reels.map((r) => ({ type: 'reel' as const, data: r })),
        ...posts.map((p) => ({ type: 'post' as const, data: p }))
      ]
      items.sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime())
      setFeedItems(items)
    }
    fetchWall()
  }, [user?.id, wallMode, refreshKey])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) {
      setUploadingAvatar(false)
      return
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    await refreshProfile?.()
    setUploadingAvatar(false)
    e.target.value = ''
  }

  async function addYoutubeLink(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newYoutubeUrl.trim()) return
    const url = newYoutubeUrl.trim()
    if (!/youtube\.com|youtu\.be/.test(url)) return
    setAddingLink(true)
    const { data } = await supabase.from('user_youtube_links').insert({ user_id: user.id, url }).select().single()
    if (data) setYoutubeLinks((prev) => [data, ...prev])
    setNewYoutubeUrl('')
    setAddingLink(false)
  }

  async function removeYoutubeLink(id: string) {
    await supabase.from('user_youtube_links').delete().eq('id', id)
    setYoutubeLinks((prev) => prev.filter((l) => l.id !== id))
  }

  async function handleSave() {
    if (!user) return
    await supabase.from('profiles').update({ username, bio, updated_at: new Date().toISOString() }).eq('id', user.id)
    setEditing(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handlePollVote(optionId: string) {
    if (!user) return
    const { data: opt } = await supabase.from('post_poll_options').select('poll_id').eq('id', optionId).single()
    if (opt) {
      const { data: opts } = await supabase.from('post_poll_options').select('id').eq('poll_id', opt.poll_id)
      const ids = (opts ?? []).map((o) => o.id)
      await supabase.from('post_poll_votes').delete().eq('user_id', user.id).in('option_id', ids)
    }
    await supabase.from('post_poll_votes').insert({ option_id: optionId, user_id: user.id })
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="rounded-xl border border-border bg-panel p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="relative group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent text-2xl font-bold">
                {username[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <span className="text-white text-xs font-medium">
                {uploadingAvatar ? 'Uploading...' : 'Change photo'}
              </span>
            </label>
          </div>
          <div className="flex-1">
            {editing ? (
              <>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary mb-2"
                  placeholder="Username"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary mb-2 resize-none"
                  placeholder="Bio"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-accent text-white font-semibold">
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-border text-text-muted">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-display text-xl font-bold text-text-primary">{username}</h1>
                {bio && <p className="text-text-muted mt-2">{bio}</p>}
                <button
                  onClick={() => setEditing(true)}
                  className="mt-4 text-accent hover:underline text-sm"
                >
                  Edit profile
                </button>
              </>
            )}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-6 text-text-muted hover:text-accent text-sm"
        >
          Sign out
        </button>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-4">My YouTube Sources</h2>
      <p className="text-text-muted text-sm mb-4">Save YouTube URLs to use when creating highlights.</p>
      <form onSubmit={addYoutubeLink} className="flex gap-2 mb-4">
        <input
          type="url"
          value={newYoutubeUrl}
          onChange={(e) => setNewYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 px-4 py-2 rounded-lg bg-panel border border-border text-text-primary"
        />
        <button type="submit" disabled={addingLink || !newYoutubeUrl.trim()} className="px-4 py-2 rounded-lg border border-accent text-accent hover:bg-accent/10 disabled:opacity-50">
          Add
        </button>
      </form>
      <div className="space-y-2 mb-8">
        {youtubeLinks.map((link) => (
          <div key={link.id} className="flex items-center justify-between rounded-lg bg-panel border border-border p-2">
            <span className="truncate text-sm text-text-primary">{link.url}</span>
            <button onClick={() => removeYoutubeLink(link.id)} className="text-accent hover:opacity-80 text-sm ml-2">
              Remove
            </button>
          </div>
        ))}
        {youtubeLinks.length === 0 && <p className="text-text-muted text-sm">No saved links yet.</p>}
      </div>

      <div className="mb-6 flex gap-2">
        <Link href="/reels/create/" className="inline-block px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90">
          Create Highlight
        </Link>
      </div>

      <PostComposer onPosted={() => setRefreshKey((k) => k + 1)} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Wall</h2>
        <div className="flex rounded-lg border border-border bg-panel p-1">
          <button
            onClick={() => setWallMode('my')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              wallMode === 'my' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            My wall
          </button>
          <button
            onClick={() => setWallMode('feed')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              wallMode === 'feed' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Feed
          </button>
        </div>
      </div>
      <p className="text-text-muted text-sm mb-4">
        {wallMode === 'my' ? 'Your posts only.' : 'Your posts + activity from people you follow (including patternAft3r).'}
      </p>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {feedItems.map((item) =>
          item.type === 'reel' ? (
            <Link
              key={`reel-${item.data.id}`}
              href={`/reels/${item.data.id}/`}
              className="block rounded-lg border border-border bg-panel p-4 hover:border-accent/50 transition-colors"
            >
              <h3 className="font-medium text-text-primary">{item.data.title}</h3>
              <p className="text-sm text-text-muted">
                <Link href={`/profile/${item.data.user_id}`} className="text-accent hover:underline">
                  {item.data.profiles?.username ?? 'Unknown'}
                </Link>
                {(item.data.profiles as { power_level?: number })?.power_level != null && (
                  <> · PL {(item.data.profiles as { power_level?: number }).power_level}</>
                )}
                {' · '}{item.data.clip_ids?.length ?? 0} clips
              </p>
            </Link>
          ) : (
            <PostCard
              key={`post-${item.data.id}`}
              post={item.data}
              onVote={handlePollVote}
              currentUserId={user?.id}
            />
          )
        )}
      </div>
      {feedItems.length === 0 && (
        <p className="text-text-muted">
          {wallMode === 'my' ? 'No posts yet. Create a post or highlight!' : 'No activity yet. Follow others to see their posts.'}
        </p>
      )}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}

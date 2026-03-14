'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/AuthGuard'
import type { Reel, UserYoutubeLink } from '@/types/database'

function ProfileContent() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [reels, setReels] = useState<Reel[]>([])
  const [youtubeLinks, setYoutubeLinks] = useState<UserYoutubeLink[]>([])
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('')
  const [addingLink, setAddingLink] = useState(false)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    setUsername(profile?.username ?? '')
    setBio(profile?.bio ?? '')
  }, [profile])

  useEffect(() => {
    if (!user) return
    const userId = user.id
    async function fetch() {
      const [reelsRes, linksRes] = await Promise.all([
        supabase.from('reels').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('user_youtube_links').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ])
      setReels(reelsRes.data ?? [])
      setYoutubeLinks(linksRes.data ?? [])
    }
    fetch()
  }, [user?.id])

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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="rounded-xl border border-border bg-panel p-6 mb-8">
        <div className="flex items-start gap-6">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent text-2xl font-bold">
              {username[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="flex-1">
            {editing ? (
              <>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#0B0E14] border border-border text-text-primary mb-2"
                  placeholder="Username"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#0B0E14] border border-border text-text-primary mb-2 resize-none"
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

      <div className="mb-6">
        <Link href="/reels/create/" className="inline-block px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90">
          Create Highlight
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-4">My Reels</h2>
      <div className="space-y-4">
        {reels.map((reel) => (
          <Link
            key={reel.id}
            href={`/reels/${reel.id}/`}
            className="block rounded-lg border border-border bg-panel p-4 hover:border-accent/50 transition-colors"
          >
            <h3 className="font-medium text-text-primary">{reel.title}</h3>
            <p className="text-sm text-text-muted">{reel.clip_ids?.length ?? 0} clips</p>
          </Link>
        ))}
      </div>
      {reels.length === 0 && <p className="text-text-muted">No reels yet.</p>}
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

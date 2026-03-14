'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Server, ServerApplication } from '@/types/database'

interface MemberWithProfile {
  id: string
  user_id: string
  role: string
  profile?: { username: string }
}

export function DashboardClient() {
  const params = useParams()
  const serverId = params.serverId as string
  const { user } = useAuth()
  const [server, setServer] = useState<Server | null>(null)
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [applications, setApplications] = useState<(ServerApplication & { profile?: { username: string } })[]>([])
  const [tab, setTab] = useState<'members' | 'applications' | 'settings'>('members')
  const [loading, setLoading] = useState(true)
  const [canManage, setCanManage] = useState(false)
  const [joinMode, setJoinMode] = useState<string>('open')
  const [criteriaDesc, setCriteriaDesc] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const uid = user?.id
    if (!serverId || !uid) return
    async function fetch() {
      const { data: serverData } = await supabase.from('servers').select('*').eq('id', serverId).single()
      setServer(serverData)
      if (serverData) {
        setJoinMode((serverData as Server & { join_mode?: string }).join_mode ?? 'open')
        const c = (serverData as Server & { criteria?: { description?: string } }).criteria
        setCriteriaDesc(c?.description ?? '')
      }

      const { data: myMem } = await supabase
        .from('server_members')
        .select('role')
        .eq('server_id', serverId)
        .eq('user_id', uid)
        .single()
      const isOwner = (serverData as Server & { owner_id?: string })?.owner_id === uid
      const isAdmin = (myMem?.role === 'owner' || myMem?.role === 'admin') ?? false
      setCanManage(isOwner || isAdmin)

      const { data: membersData } = await supabase
        .from('server_members')
        .select('id, user_id, role')
        .eq('server_id', serverId)
      const memList = membersData ?? []
      const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', memList.map((m) => m.user_id))
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
      setMembers(memList.map((m) => ({ ...m, profile: profileMap.get(m.user_id) })))

      const { data: appsData } = await supabase
        .from('server_applications')
        .select('*')
        .eq('server_id', serverId)
        .eq('status', 'pending')
      const apps = (appsData ?? []) as (ServerApplication & { user_id: string })[]
      const { data: appProfiles } = apps.length
        ? await supabase.from('profiles').select('id, username').in('id', apps.map((a) => a.user_id))
        : { data: [] }
      const appProfileMap = new Map((appProfiles ?? []).map((p) => [p.id, p]))
      setApplications(apps.map((a) => ({ ...a, profile: appProfileMap.get(a.user_id) })))

      setLoading(false)
    }
    fetch()
  }, [serverId, user?.id])

  async function handleApprove(app: ServerApplication) {
    await supabase
      .from('server_applications')
      .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', app.id)
    await supabase.from('server_members').insert({ server_id: serverId, user_id: app.user_id, role: 'member' })
    setApplications((prev) => prev.filter((a) => a.id !== app.id))
  }

  async function handleReject(app: ServerApplication) {
    await supabase
      .from('server_applications')
      .update({ status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', app.id)
    setApplications((prev) => prev.filter((a) => a.id !== app.id))
  }

  async function handleKick(member: MemberWithProfile) {
    if (member.user_id === user?.id) return
    await supabase.from('server_members').delete().eq('id', member.id)
    setMembers((prev) => prev.filter((m) => m.id !== member.id))
  }

  async function handlePromote(member: MemberWithProfile, newRole: string) {
    await supabase.from('server_members').update({ role: newRole }).eq('id', member.id)
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)))
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase
      .from('servers')
      .update({
        join_mode: joinMode,
        criteria: { description: criteriaDesc.trim() || undefined },
      })
      .eq('id', serverId)
    setSaving(false)
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-text-muted">Sign in to access the dashboard.</p>
        <Link href="/login/" className="text-accent hover:underline mt-2 inline-block">Sign in</Link>
      </div>
    )
  }

  if (loading || !server) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    )
  }

  if (!canManage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-text-muted">You don&apos;t have permission to manage this clan.</p>
        <Link href={`/boards/${serverId}/`} className="text-accent hover:underline mt-2 inline-block">← Back to clan</Link>
      </div>
    )
  }

  const tabs = [
    { id: 'members' as const, label: 'Members' },
    { id: 'applications' as const, label: 'Applications' },
    { id: 'settings' as const, label: 'Settings' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href={`/boards/${serverId}/`} className="inline-block mb-6 text-text-muted hover:text-accent">← Back to clan</Link>
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Clan dashboard</h1>

      <div className="flex gap-2 mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'members' && (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-2 rounded-lg bg-panel border border-border">
              <span className="text-text-primary font-medium">@{m.profile?.username ?? 'Unknown'}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">{m.role}</span>
                {m.user_id !== user?.id && (
                  <>
                    {m.role === 'member' && (
                      <button
                        type="button"
                        onClick={() => handlePromote(m, 'mod')}
                        className="text-xs text-accent hover:underline"
                      >
                        Promote
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleKick(m)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Kick
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <p className="text-text-muted">No pending applications.</p>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="p-4 rounded-lg bg-panel border border-border">
                <p className="font-medium text-text-primary">@{app.profile?.username ?? 'Unknown'}</p>
                {app.message && <p className="text-text-muted text-sm mt-1">{app.message}</p>}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(app)}
                    className="px-3 py-1 rounded bg-accent text-white text-sm hover:opacity-90"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(app)}
                    className="px-3 py-1 rounded border border-border text-text-muted text-sm hover:text-text-primary"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-8">
          <div className="p-4 rounded-lg border border-accent/50 bg-accent/5">
            <h3 className="font-semibold text-text-primary mb-2">Clan Ultra ($49.99/mo)</h3>
            <p className="text-text-muted text-sm mb-3">
              All members get AI dashboard, no ads on clan page, listed at top.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_CLAN_ULTRA_PRICE_ID ? `/api/checkout?product=clan_ultra&server_id=${serverId}` : '#'}
              className="inline-block px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
            >
              Upgrade to Clan Ultra
            </a>
          </div>
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-text-muted mb-1">Join mode</label>
            <select
              value={joinMode}
              onChange={(e) => setJoinMode(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary"
            >
              <option value="open">Open (anyone can join)</option>
              <option value="apply">Apply (requires approval)</option>
              <option value="invite">Invite only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Criteria description</label>
            <textarea
              value={criteriaDesc}
              onChange={(e) => setCriteriaDesc(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary"
              rows={3}
              placeholder="What you're looking for in members..."
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
        </div>
      )}
    </div>
  )
}

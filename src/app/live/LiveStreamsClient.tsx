'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import type { LiveGroup } from '@/types/database';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

type GroupWithMembers = LiveGroup & {
  members: { id: string; user_id: string; accepted: boolean; stream_id: string | null; profile?: { username: string } }[];
};

export function LiveStreamsClient() {
  const { user } = useAuth();
  const { hasPro } = useSubscription();
  const [streams, setStreams] = useState<{ id: string; youtube_url: string; title: string | null }[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [multiView, setMultiView] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [switchMode, setSwitchMode] = useState<'manual' | 'auto' | 'pro'>('manual');
  const [autoInterval, setAutoInterval] = useState(30);
  const [pipHostUrl, setPipHostUrl] = useState('');

  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [groupName, setGroupName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitingGroupId, setInvitingGroupId] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<{ id: string; group_id: string; group?: { name: string } }[]>([]);
  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null);
  const [myStreams, setMyStreams] = useState<{ id: string; title: string | null }[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('live_streams')
        .select('id, youtube_url, title')
        .order('created_at', { ascending: false });
      setStreams(data ?? []);
      setLoading(false);
    }
    fetch();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('live_streams').select('id, title').eq('user_id', user.id).then(({ data }) => setMyStreams(data ?? []));
  }, [user, streams]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    async function fetchGroups() {
      const { data: members } = await supabase.from('live_group_members').select('group_id').eq('user_id', userId);
      const groupIds = Array.from(new Set((members ?? []).map((m) => m.group_id)));
      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }
      const { data: groupsData } = await supabase.from('live_groups').select('*').in('id', groupIds);
      const { data: membersData } = await supabase.from('live_group_members').select('id, group_id, user_id, accepted, stream_id').in('group_id', groupIds);
      const { data: profiles } = await supabase.from('profiles').select('id, username');
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const groupsWithMembers: GroupWithMembers[] = (groupsData ?? []).map((g) => ({
        ...g,
        members: (membersData ?? []).filter((m) => m.group_id === g.id).map((m) => ({ ...m, profile: profileMap.get(m.user_id) })),
      }));
      setGroups(groupsWithMembers);
    }
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    async function fetchPending() {
      const { data: rows } = await supabase.from('live_group_members').select('id, group_id').eq('user_id', userId).eq('accepted', false);
      if (!rows?.length) {
        setPendingInvites([]);
        return;
      }
      const { data: groupRows } = await supabase.from('live_groups').select('id, name').in('id', rows.map((r) => r.group_id));
      const nameMap = new Map((groupRows ?? []).map((g) => [g.id, g.name]));
      setPendingInvites(rows.map((r) => ({ id: r.id, group_id: r.group_id, group: { name: nameMap.get(r.group_id) ?? 'Unknown' } })));
    }
    fetchPending();
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setError('Invalid YouTube URL');
      return;
    }
    if (!user) return;
    setAdding(true);
    const { error: err } = await supabase.from('live_streams').insert({
      user_id: user.id,
      youtube_url: youtubeUrl.trim(),
      title: title.trim() || null,
    });
    setAdding(false);
    if (err) {
      setError(err.message);
      return;
    }
    setYoutubeUrl('');
    setTitle('');
    const { data } = await supabase.from('live_streams').select('id, youtube_url, title').order('created_at', { ascending: false });
    setStreams(data ?? []);
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !groupName.trim()) return;
    const { data: g, error: err } = await supabase.from('live_groups').insert({ name: groupName.trim(), creator_id: user.id }).select().single();
    if (err) {
      setError(err.message);
      return;
    }
    await supabase.from('live_group_members').insert({ group_id: g.id, user_id: user.id, accepted: true });
    setGroupName('');
    const { data: members } = await supabase.from('live_group_members').select('id, group_id, user_id, accepted, stream_id').eq('group_id', g.id);
    const { data: profiles } = await supabase.from('profiles').select('id, username');
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    setGroups((prev) => [...prev, { ...g, members: (members ?? []).map((m) => ({ ...m, profile: profileMap.get(m.user_id) })) }]);
  }

  async function handleInvite(groupId: string) {
    if (!inviteUsername.trim()) return;
    setInvitingGroupId(groupId);
    const { data: profile } = await supabase.from('profiles').select('id').ilike('username', inviteUsername.trim()).single();
    if (!profile) {
      setError('User not found');
      setInvitingGroupId(null);
      return;
    }
    const { error: err } = await supabase.from('live_group_members').insert({ group_id: groupId, user_id: profile.id, accepted: false });
    setInvitingGroupId(null);
    if (err) {
      setError(err.message);
      return;
    }
    setInviteUsername('');
    setError('');
    const { data: members } = await supabase.from('live_group_members').select('id, group_id, user_id, accepted, stream_id').eq('group_id', groupId);
    const { data: profiles } = await supabase.from('profiles').select('id, username');
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, members: (members ?? []).map((m) => ({ ...m, profile: profileMap.get(m.user_id) })) } : g)));
  }

  async function handleAccept(memberId: string) {
    await supabase.from('live_group_members').update({ accepted: true }).eq('id', memberId).eq('user_id', user!.id);
    setPendingInvites((prev) => prev.filter((p) => p.id !== memberId));
  }

  async function handleDecline(memberId: string) {
    await supabase.from('live_group_members').delete().eq('id', memberId).eq('user_id', user!.id);
    setPendingInvites((prev) => prev.filter((p) => p.id !== memberId));
  }

  const groupStreams = viewingGroupId
    ? (() => {
        const grp = groups.find((g) => g.id === viewingGroupId);
        const streamIds = (grp?.members ?? []).filter((m) => m.stream_id).map((m) => m.stream_id!);
        return streams.filter((s) => streamIds.includes(s.id));
      })()
    : streams;
  const displayStreams = viewingGroupId ? groupStreams : streams;

  // Auto-rotate when in auto mode and multi-view
  useEffect(() => {
    if (!multiView || displayStreams.length < 2 || switchMode !== 'auto') return;
    const id = setInterval(() => {
      setFocusedIndex((prev) => (prev + 1) % Math.min(4, displayStreams.length));
    }, autoInterval * 1000);
    return () => clearInterval(id);
  }, [multiView, displayStreams.length, switchMode, autoInterval]);

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="animate-pulse text-accent">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {user && (
        <form onSubmit={handleAdd} className="rounded-xl border border-border bg-panel p-6 mb-8">
          <h2 className="font-semibold text-text-primary mb-4">Add stream</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">YouTube URL</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary"
                placeholder="My stream"
              />
            </div>
            {error && <p className="text-accent text-sm">{error}</p>}
            <button type="submit" disabled={adding} className="px-4 py-2 rounded-lg bg-accent text-white font-semibold disabled:opacity-50">
              {adding ? 'Adding...' : 'Add stream'}
            </button>
          </div>
        </form>
      )}

      {!user && (
        <p className="text-text-muted mb-8">
          <Link href="/login/" className="text-accent hover:underline">Sign in</Link> to add streams.
        </p>
      )}

      {user && (
        <div className="rounded-xl border border-border bg-panel p-6 mb-8">
          <h2 className="font-semibold text-text-primary mb-4">Live Groups</h2>
          <p className="text-text-muted text-sm mb-4">Create a group, invite others. When all are live, watch together in multi-view.</p>
          <form onSubmit={handleCreateGroup} className="flex gap-2 mb-4">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-panel border border-border text-text-primary"
              placeholder="Group name"
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-white font-semibold">
              Create group
            </button>
          </form>
          {pendingInvites.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-text-muted mb-2">Pending invites</h3>
              <div className="space-y-2">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg bg-panel p-2">
                    <span className="text-text-primary">{inv.group?.name ?? 'Group'}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleAccept(inv.id)} className="px-2 py-1 rounded bg-accent text-white text-sm font-medium">
                        Accept
                      </button>
                      <button type="button" onClick={() => handleDecline(inv.id)} className="px-2 py-1 rounded border border-border text-text-muted text-sm hover:border-red-500 hover:text-red-400">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {groups.length > 0 && (
            <div className="space-y-3">
              {groups.map((grp) => (
                <div key={grp.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-text-primary">{grp.name}</h3>
                    <button
                      type="button"
                      onClick={() => setViewingGroupId(viewingGroupId === grp.id ? null : grp.id)}
                      className="px-3 py-1 rounded border border-accent text-accent text-sm hover:bg-accent/10"
                    >
                      {viewingGroupId === grp.id ? 'Exit group view' : 'View group streams'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {grp.members.map((m) => (
                      <span key={m.user_id} className="text-sm text-text-muted">
                        @{m.profile?.username ?? '…'}
                        {m.accepted ? ' ✓' : ' (pending)'}
                        {m.stream_id ? ' [stream linked]' : ''}
                      </span>
                    ))}
                  </div>
                  {grp.members.some((m) => m.user_id === user.id) && myStreams.length > 0 && (
                    <div className="mb-2">
                      <label className="text-sm text-text-muted mr-2">Link my stream:</label>
                      <select
                        value={grp.members.find((m) => m.user_id === user.id)?.stream_id ?? ''}
                        onChange={async (e) => {
                          const streamId = e.target.value || null;
                          const myMember = grp.members.find((m) => m.user_id === user.id);
                          if (!myMember?.id) return;
                          await supabase.from('live_group_members').update({ stream_id: streamId }).eq('id', myMember.id).eq('user_id', user.id);
                          setGroups((prev) =>
                            prev.map((g) =>
                              g.id === grp.id ? { ...g, members: g.members.map((m) => (m.user_id === user.id ? { ...m, stream_id: streamId } : m)) } : g
                            )
                          );
                        }}
                        className="px-2 py-1 rounded bg-panel border border-border text-text-primary text-sm"
                      >
                        <option value="">None</option>
                        {myStreams.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title ?? 'Stream'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {user.id === grp.creator_id && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleInvite(grp.id);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                        className="flex-1 max-w-[200px] px-2 py-1 rounded bg-panel border border-border text-text-primary text-sm"
                        placeholder="Invite by username"
                      />
                      <button type="submit" disabled={!!invitingGroupId} className="px-2 py-1 rounded bg-accent/80 text-white text-sm font-medium disabled:opacity-50">
                        Invite
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="font-semibold text-text-primary">{viewingGroupId ? 'Group streams' : 'Live now'}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {displayStreams.length >= 2 && (
            <>
              <button
                type="button"
                onClick={() => setMultiView(!multiView)}
                className="px-4 py-2 rounded-lg border border-border text-text-muted hover:text-accent hover:border-accent/50 text-sm"
              >
                {multiView ? 'Single view' : 'Multi-view (4-up)'}
              </button>
              {multiView && (
                <>
                  <span className="text-text-muted text-sm">Switch:</span>
                  <button
                    type="button"
                    onClick={() => setSwitchMode('manual')}
                    className={`px-3 py-1 rounded text-sm ${switchMode === 'manual' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'}`}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSwitchMode('auto')}
                    className={`px-3 py-1 rounded text-sm ${switchMode === 'auto' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'}`}
                  >
                    Auto
                  </button>
                  {hasPro && (
                    <button
                      type="button"
                      onClick={() => setSwitchMode('pro')}
                      className={`px-3 py-1 rounded text-sm ${switchMode === 'pro' ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'}`}
                      title="Pro: pixel-based action switching"
                    >
                      Pro
                    </button>
                  )}
                  {(switchMode === 'auto' || switchMode === 'pro') && (
                    <select
                      value={autoInterval}
                      onChange={(e) => setAutoInterval(Number(e.target.value))}
                      className="px-2 py-1 rounded bg-panel border border-border text-text-primary text-sm"
                    >
                      <option value={15}>15s</option>
                      <option value={30}>30s</option>
                      <option value={45}>45s</option>
                      <option value={60}>1 min</option>
                    </select>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      {displayStreams.length === 0 ? (
        <div className="rounded-xl border border-border bg-panel p-8 text-center text-text-muted">
          {viewingGroupId ? 'No streams linked in this group yet.' : 'No streams yet.'}
        </div>
      ) : multiView && displayStreams.length >= 2 ? (
        <div className="space-y-4 relative">
          {pipHostUrl && (
            <div className="absolute bottom-4 right-4 z-10 w-32 h-24 rounded-lg border-2 border-accent overflow-hidden bg-panel">
              {extractYouTubeId(pipHostUrl) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(pipHostUrl)}`}
                  title="Host PiP"
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">Host</div>
              )}
            </div>
          )}
          <div className="rounded-xl border-2 border-accent overflow-hidden">
            {(() => {
              const focused = displayStreams[focusedIndex];
              const videoId = focused && extractYouTubeId(focused.youtube_url);
              return (
                <>
                  <div className="aspect-video">
                    {videoId && (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={focused?.title ?? 'Stream'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    )}
                  </div>
                  <div className="p-2 bg-panel">
                    <h3 className="font-medium text-text-primary truncate">{focused?.title ?? 'Stream'}</h3>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-text-muted">Host PiP (YouTube URL):</label>
            <input
              type="url"
              value={pipHostUrl}
              onChange={(e) => setPipHostUrl(e.target.value)}
              placeholder="Optional host/webcam stream"
              className="flex-1 min-w-[200px] px-3 py-1 rounded bg-panel border border-border text-text-primary text-sm"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {displayStreams.slice(0, 4).map((stream, i) => {
              const videoId = extractYouTubeId(stream.youtube_url);
              const isFocused = i === focusedIndex;
              return (
                <button
                  key={stream.id}
                  type="button"
                  onClick={() => setFocusedIndex(i)}
                  className={`rounded-lg border overflow-hidden text-left transition-all ${isFocused ? 'border-accent ring-2 ring-accent' : 'border-border hover:border-accent/50'}`}
                >
                  <div className="aspect-video">
                    {videoId && (
                      <iframe src={`https://www.youtube.com/embed/${videoId}`} title={stream.title ?? 'Stream'} className="w-full h-full pointer-events-none" />
                    )}
                  </div>
                  <div className="p-1 bg-panel">
                    <span className="text-xs text-text-primary truncate block">{stream.title ?? 'Stream'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {displayStreams.map((stream) => {
            const videoId = extractYouTubeId(stream.youtube_url);
            return (
              <div key={stream.id} className="rounded-xl border border-border bg-panel overflow-hidden">
                <div className="aspect-video">
                  {videoId && (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={stream.title ?? 'Stream'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-text-primary">{stream.title ?? 'Stream'}</h3>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-8">
        <Link href="/live/director/" className="text-accent hover:underline font-medium">
          AI Director mode (8 streams) →
        </Link>
      </div>
    </>
  );
}

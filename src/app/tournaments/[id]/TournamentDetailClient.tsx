'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';
import type { Tournament, StatCheckSubmission, TournamentResult } from '@/types/database';

type SubmissionWithProfile = StatCheckSubmission & { profiles?: { username: string; avatar_url: string | null } };
type ResultWithProfile = TournamentResult & { winner_profiles?: { username: string; avatar_url: string | null }; tournaments?: { name: string } };

export function TournamentDetailClient() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [admins, setAdmins] = useState<{ user_id: string; profiles?: { username: string } }[]>([]);
  const [statSubmissions, setStatSubmissions] = useState<SubmissionWithProfile[]>([]);
  const [results, setResults] = useState<ResultWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const [statVideoUrl, setStatVideoUrl] = useState('');
  const [statCharacter, setStatCharacter] = useState('');
  const [statDesc, setStatDesc] = useState('');
  const [statSubmitting, setStatSubmitting] = useState(false);
  const [winnerSearch, setWinnerSearch] = useState('');
  const [winnerResults, setWinnerResults] = useState<{ id: string; username: string }[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<{ id: string; username: string } | null>(null);
  const [teamName, setTeamName] = useState('');
  const [resultSubmitting, setResultSubmitting] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminSearchResults, setAdminSearchResults] = useState<{ id: string; username: string }[]>([]);
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      const { data: tData } = await supabase.from('tournaments').select('*').eq('id', id).single();
      setTournament(tData as Tournament | null);
      const [{ data: adminsData }, { data: statData }, { data: resultsData }] = await Promise.all([
        supabase.from('tournament_admins').select('user_id').eq('tournament_id', id),
        supabase.from('stat_check_submissions').select('*, profiles(username, avatar_url)').eq('tournament_id', id).order('created_at', { ascending: false }),
        supabase.from('tournament_results').select('*').eq('tournament_id', id).order('created_at', { ascending: false }),
      ]);
      const adminList = (adminsData ?? []) as { user_id: string }[];
      if (adminList.length > 0) {
        const { data: profData } = await supabase.from('profiles').select('id, username').in('id', adminList.map((a) => a.user_id));
        const profMap = new Map((profData ?? []).map((p) => [p.id, p.username]));
        setAdmins(adminList.map((a) => ({ user_id: a.user_id, profiles: { username: profMap.get(a.user_id) ?? 'Unknown' } })));
      } else {
        setAdmins([]);
      }
      setStatSubmissions((statData ?? []) as SubmissionWithProfile[]);
      const resList = (resultsData ?? []) as TournamentResult[];
      if (resList.length > 0) {
        const winnerIds = [...new Set(resList.map((r) => r.winner_profile_id))];
        const { data: profData } = await supabase.from('profiles').select('id, username').in('id', winnerIds);
        const profMap = new Map((profData ?? []).map((p) => [p.id, p.username]));
        setResults(resList.map((r) => ({ ...r, winner_username: profMap.get(r.winner_profile_id) ?? 'Unknown' })));
      } else {
        setResults([]);
      }
      setLoading(false);
    }
    fetch();
  }, [id]);

  const isCreator = user && tournament?.created_by === user.id;
  const adminIds = new Set(admins.map((a) => a.user_id));
  const isAdmin = isCreator || (user && adminIds.has(user.id));
  const isClosed = tournament?.status === 'closed';

  async function handleClose() {
    if (!tournament || !user || tournament.created_by !== user.id) return;
    setClosing(true);
    const { error } = await supabase.from('tournaments').update({ status: 'closed', ends_at: new Date().toISOString() }).eq('id', id);
    setClosing(false);
    if (!error) setTournament((t) => (t ? { ...t, status: 'closed', ends_at: new Date().toISOString() } : null));
  }

  async function handleStatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !statVideoUrl.trim()) return;
    setStatSubmitting(true);
    const { error } = await supabase.from('stat_check_submissions').insert({
      user_id: user.id,
      video_url: statVideoUrl.trim(),
      character_name: statCharacter.trim() || null,
      description: statDesc.trim() || null,
      tournament_id: id,
      status: 'pending',
    });
    setStatSubmitting(false);
    if (!error) {
      setStatVideoUrl('');
      setStatCharacter('');
      setStatDesc('');
      const { data } = await supabase.from('stat_check_submissions').select('*, profiles(username, avatar_url)').eq('tournament_id', id).order('created_at', { ascending: false });
      setStatSubmissions((data ?? []) as SubmissionWithProfile[]);
    }
  }

  async function handleStatReview(submissionId: string, status: 'approved' | 'rejected') {
    if (!user || !isAdmin) return;
    await supabase.from('stat_check_submissions').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq('id', submissionId);
    const { data } = await supabase.from('stat_check_submissions').select('*, profiles(username, avatar_url)').eq('tournament_id', id).order('created_at', { ascending: false });
    setStatSubmissions((data ?? []) as SubmissionWithProfile[]);
  }

  useEffect(() => {
    if (!winnerSearch.trim()) {
      setWinnerResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id, username').ilike('username', `%${winnerSearch}%`).limit(10);
      setWinnerResults((data ?? []) as { id: string; username: string }[]);
    }, 300);
    return () => clearTimeout(t);
  }, [winnerSearch]);

  async function handleResultSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !isAdmin || !selectedWinner || !tournament) return;
    setResultSubmitting(true);
    const { error } = await supabase.from('tournament_results').insert({
      tournament_id: id,
      winner_profile_id: selectedWinner.id,
      team_name: teamName.trim() || null,
      submitted_by: user.id,
    });
    if (!error) {
      await supabase.from('trophies').insert({
        profile_id: selectedWinner.id,
        trophy_type: 'tournament_win',
        metadata: { tournament_id: id, tournament_name: tournament.name },
      });
      setSelectedWinner(null);
      setTeamName('');
      const { data: resData } = await supabase.from('tournament_results').select('*').eq('tournament_id', id).order('created_at', { ascending: false });
      const resList = (resData ?? []) as TournamentResult[];
      if (resList.length > 0) {
        const winnerIds = [...new Set(resList.map((r) => r.winner_profile_id))];
        const { data: profData } = await supabase.from('profiles').select('id, username').in('id', winnerIds);
        const profMap = new Map((profData ?? []).map((p) => [p.id, p.username]));
        setResults(resList.map((r) => ({ ...r, winner_username: profMap.get(r.winner_profile_id) ?? 'Unknown' })));
      } else {
        setResults([]);
      }
    }
    setResultSubmitting(false);
  }

  useEffect(() => {
    if (!adminSearch.trim()) {
      setAdminSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id, username').ilike('username', `%${adminSearch}%`).limit(10);
      setAdminSearchResults((data ?? []) as { id: string; username: string }[]);
    }, 300);
    return () => clearTimeout(t);
  }, [adminSearch]);

  async function handleAddAdmin(uid: string) {
    if (!isCreator) return;
    setAddingAdmin(true);
    await supabase.from('tournament_admins').insert({ tournament_id: id, user_id: uid });
    const { data } = await supabase.from('tournament_admins').select('user_id').eq('tournament_id', id);
    const adminList = (data ?? []) as { user_id: string }[];
    if (adminList.length > 0) {
      const { data: profData } = await supabase.from('profiles').select('id, username').in('id', adminList.map((a) => a.user_id));
      const profMap = new Map((profData ?? []).map((p) => [p.id, p.username]));
      setAdmins(adminList.map((a) => ({ user_id: a.user_id, profiles: { username: profMap.get(a.user_id) ?? 'Unknown' } })));
    } else {
      setAdmins([]);
    }
    setAdminSearch('');
    setAdminSearchResults([]);
    setAddingAdmin(false);
  }

  async function handleRemoveAdmin(uid: string) {
    if (!isCreator) return;
    await supabase.from('tournament_admins').delete().eq('tournament_id', id).eq('user_id', uid);
    const { data } = await supabase.from('tournament_admins').select('user_id, profiles(username)').eq('tournament_id', id);
    setAdmins((data ?? []) as { user_id: string; profiles?: { username: string } }[]);
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-text-muted">Loading...</div>;
  if (!tournament) return <div className="max-w-3xl mx-auto px-4 py-8 text-text-muted">Tournament not found.</div>;

  const statTimes = Array.isArray(tournament.stat_check_times)
    ? (tournament.stat_check_times as string[]).filter((t): t is string => typeof t === 'string')
    : [];
  const daysTimes = tournament.tournament_days_times && typeof tournament.tournament_days_times === 'object'
    ? tournament.tournament_days_times as { raw?: string }
    : {};

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/tournaments/" className="text-accent hover:underline text-sm mb-4 inline-block">← Back to Tournaments</Link>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">{tournament.name}</h1>
        {isClosed ? (
          <span className="text-xs px-2 py-0.5 rounded bg-panel border border-border text-text-muted">Closed</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">Open</span>
        )}
        {isCreator && !isClosed && (
          <button
            type="button"
            onClick={handleClose}
            disabled={closing}
            className="text-sm px-3 py-1 rounded border border-border text-text-muted hover:text-accent hover:border-accent transition disabled:opacity-50"
          >
            {closing ? 'Closing...' : 'Close tournament'}
          </button>
        )}
      </div>
      {tournament.description && <p className="text-text-muted mb-6">{tournament.description}</p>}

      {tournament.rules && (
        <div className="rounded-xl border border-border bg-panel p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Rules</h2>
          <div className="text-text-muted whitespace-pre-wrap text-sm">{tournament.rules}</div>
        </div>
      )}

      {statTimes.length > 0 && (
        <div className="rounded-xl border border-border bg-panel p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Stat check times</h2>
          <ul className="text-text-muted text-sm space-y-1">
            {statTimes.map((t, i) => (
              <li key={i}>{String(t)}</li>
            ))}
          </ul>
        </div>
      )}

      {daysTimes.raw && (
        <div className="rounded-xl border border-border bg-panel p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Tournament days and times</h2>
          <p className="text-text-muted text-sm whitespace-pre-wrap">{daysTimes.raw}</p>
        </div>
      )}

      {/* Stat Check */}
      <div className="rounded-xl border border-border bg-panel p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Stat Check</h2>
        <p className="text-text-muted text-sm mb-4">Submit a video of your builds and buffs to verify you don&apos;t have too many. Tournament owner and admins can approve or reject.</p>
        <AuthGuard>
          <form onSubmit={handleStatSubmit} className="space-y-3 mb-6">
            <input type="url" value={statVideoUrl} onChange={(e) => setStatVideoUrl(e.target.value)} placeholder="Video URL (YouTube or direct)" required className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary" />
            <input type="text" value={statCharacter} onChange={(e) => setStatCharacter(e.target.value)} placeholder="Character name (optional)" className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary" />
            <textarea value={statDesc} onChange={(e) => setStatDesc(e.target.value)} placeholder="Describe buffs shown..." rows={2} className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary resize-y" />
            <button type="submit" disabled={statSubmitting} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50">{statSubmitting ? 'Submitting...' : 'Submit'}</button>
          </form>
        </AuthGuard>
        <div className="space-y-3">
          {statSubmissions.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border bg-bg/50">
              <div className="flex items-center gap-2 min-w-0">
                {s.profiles?.avatar_url ? <img src={s.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" /> : <div className="w-8 h-8 rounded-full bg-accent/20 shrink-0" />}
                <div className="min-w-0">
                  <span className="font-medium text-text-primary">{s.profiles?.username ?? 'Unknown'}</span>
                  <a href={s.video_url} target="_blank" rel="noopener noreferrer" className="block text-accent text-sm hover:underline truncate">{s.video_url}</a>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'approved' ? 'bg-green-500/20 text-green-400' : s.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{s.status}</span>
                {isAdmin && s.status === 'pending' && (
                  <>
                    <button type="button" onClick={() => handleStatReview(s.id, 'approved')} className="text-green-500 hover:underline text-sm">Approve</button>
                    <button type="button" onClick={() => handleStatReview(s.id, 'rejected')} className="text-red-500 hover:underline text-sm">Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {statSubmissions.length === 0 && <p className="text-text-muted text-sm">No stat check submissions yet.</p>}
        </div>
      </div>

      {/* Submit Result (admin only) */}
      {isAdmin && (
        <div className="rounded-xl border border-border bg-panel p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Submit Result</h2>
          <p className="text-text-muted text-sm mb-4">Record a tournament win. Winner receives a trophy with the tournament name.</p>
          <form onSubmit={handleResultSubmit} className="space-y-3">
            <input type="text" value={winnerSearch} onChange={(e) => { setWinnerSearch(e.target.value); setSelectedWinner(null); }} placeholder="Search winner by username" className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary" />
            {winnerSearch && (
              <div className="border border-border rounded-lg overflow-hidden">
                {winnerResults.map((p) => (
                  <button key={p.id} type="button" onClick={() => { setSelectedWinner(p); setWinnerSearch(''); setWinnerResults([]); }} className="block w-full text-left px-4 py-2 hover:bg-white/5 text-text-primary">{p.username}</button>
                ))}
              </div>
            )}
            {selectedWinner && <p className="text-sm text-text-primary">Winner: <strong>{selectedWinner.username}</strong> <button type="button" onClick={() => setSelectedWinner(null)} className="text-accent hover:underline">Change</button></p>}
            <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name (optional)" className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary" />
            <button type="submit" disabled={!selectedWinner || resultSubmitting} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50">{resultSubmitting ? 'Submitting...' : 'Submit Result'}</button>
          </form>
        </div>
      )}

      {/* Tournament Results */}
      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-panel p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Results</h2>
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-bg/50">
                <Link href={`/profile/${r.winner_profile_id}/`} className="font-medium text-accent hover:underline">{r.winner_username ?? 'Unknown'}</Link>
                {r.team_name && <span className="text-text-muted text-sm">({r.team_name})</span>}
                <span className="text-text-muted text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admins (owner only) */}
      {isCreator && (
        <div className="rounded-xl border border-border bg-panel p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Admins</h2>
          <p className="text-text-muted text-sm mb-4">Admins can review stat checks and submit results.</p>
          <input type="text" value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} placeholder="Search user to add as admin" className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary mb-2" />
          {adminSearch && (
            <div className="border border-border rounded-lg overflow-hidden mb-4">
              {adminSearchResults.filter((p) => p.id !== tournament.created_by && !adminIds.has(p.id)).map((p) => (
                <button key={p.id} type="button" onClick={() => handleAddAdmin(p.id)} disabled={addingAdmin} className="block w-full text-left px-4 py-2 hover:bg-white/5 text-text-primary flex items-center justify-between">
                  {p.username}
                  <span className="text-accent text-sm">Add</span>
                </button>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {admins.map((a) => (
              <div key={a.user_id} className="flex items-center justify-between p-2 rounded-lg bg-bg/50">
                <span className="text-text-primary">{a.profiles?.username ?? a.user_id}</span>
                <button type="button" onClick={() => handleRemoveAdmin(a.user_id)} className="text-accent hover:underline text-sm">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

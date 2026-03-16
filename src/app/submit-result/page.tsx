'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';
import { AdSlot } from '@/components/AdSlot';
import type { MatchType } from '@/types/database';

const MATCH_TYPES: { value: MatchType; label: string }[] = [
  { value: 'survival', label: 'Survival (1v1)' },
  { value: 'quick_match', label: 'Quick Match' },
  { value: 'red_white', label: 'Red vs White' },
  { value: 'ninja_world_league', label: 'Ninja World League' },
  { value: 'tournament', label: 'Tournament' },
];

function SubmitResultContent() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [matchType, setMatchType] = useState<MatchType>('quick_match');
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [loserIds, setLoserIds] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; username: string }[]>([]);
  const [aiResult, setAiResult] = useState<{
    winnerName?: string | null;
    loserNames?: string[];
    redTeam?: string[] | null;
    whiteTeam?: string[] | null;
    scores?: { red?: number; white?: number } | null;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;

  useEffect(() => {
    supabase.from('profiles').select('id, username').order('username').then(({ data }) => setProfiles(data ?? []));
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setAiResult(null);
    e.target.value = '';
  }

  async function handleAnalyze() {
    if (!screenshotFile || !workerUrl) {
      setError(workerUrl ? 'Select a screenshot first' : 'AI not configured. Set NEXT_PUBLIC_CF_WORKER_URL.');
      return;
    }
    setAnalyzing(true);
    setError('');
    try {
      const buf = await screenshotFile.arrayBuffer();
      const arr = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
      const base64 = btoa(binary);
      const base = workerUrl.replace(/\/$/, '');
      const res = await fetch(`${base}/screenshot-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, matchType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAiResult(data);
      if (data.winnerName) {
        const match = profiles.find((p) =>
          p.username.toLowerCase().includes(data.winnerName.toLowerCase())
        );
        if (match) setWinnerId(match.id);
      }
      if (data.loserNames?.length) {
        const ids = data.loserNames
          .map((name: string) => profiles.find((p) => p.username.toLowerCase().includes(name.toLowerCase())))
          .filter(Boolean)
          .map((p: { id: string }) => p.id);
        setLoserIds(ids);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !screenshotFile) return;
    setError('');
    if (!winnerId) {
      setError('Select the winner.');
      return;
    }
    if (matchType === 'survival' && loserIds.length !== 1) {
      setError('Survival requires exactly one loser.');
      return;
    }
    setSubmitting(true);
    try {
      const path = `${user.id}/${crypto.randomUUID()}_${screenshotFile.name}`;
      const { error: upErr } = await supabase.storage.from('screenshots').upload(path, screenshotFile, {
        contentType: screenshotFile.type,
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(path);

      const { data: resultData, error: resultErr } = await supabase
        .from('match_results')
        .insert({
          uploader_id: user.id,
          screenshot_url: urlData.publicUrl,
          match_type: matchType,
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .select('id')
        .single();
      if (resultErr) throw resultErr;

      await supabase.from('match_result_players').insert({
        result_id: resultData.id,
        profile_id: winnerId,
        role: 'winner',
      });
      for (const lid of loserIds) {
        await supabase.from('match_result_players').insert({
          result_id: resultData.id,
          profile_id: lid,
          role: 'loser',
        });
      }

      const K = 32;
      const defaultRating = 1000;
      const participants = [winnerId, ...loserIds];
      const { data: existing } = await supabase
        .from('power_ratings')
        .select('profile_id, rating, wins, losses')
        .eq('match_type', matchType)
        .in('profile_id', participants);
      const ratingsMap = new Map((existing ?? []).map((r) => [r.profile_id, r]));
      const winnerRow = ratingsMap.get(winnerId);
      const winnerRating = winnerRow?.rating ?? defaultRating;
      const loserRatings = loserIds.map((id) => ratingsMap.get(id)?.rating ?? defaultRating);
      const avgLoserRating = loserRatings.length ? loserRatings.reduce((a, b) => a + b, 0) / loserRatings.length : defaultRating;
      const expectedWinner = 1 / (1 + Math.pow(10, (avgLoserRating - winnerRating) / 400));
      const newWinnerRating = Math.round(winnerRating + K * (1 - expectedWinner));
      const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - avgLoserRating) / 400));
      const newLoserRating = Math.round(avgLoserRating + K * (0 - expectedLoser));

      await supabase.from('power_ratings').upsert(
        [
          {
            profile_id: winnerId,
            match_type: matchType,
            rating: newWinnerRating,
            wins: (winnerRow?.wins ?? 0) + 1,
            losses: winnerRow?.losses ?? 0,
            updated_at: new Date().toISOString(),
          },
          ...loserIds.map((id) => {
            const row = ratingsMap.get(id);
            return {
              profile_id: id,
              match_type: matchType,
              rating: newLoserRating,
              wins: row?.wins ?? 0,
              losses: (row?.losses ?? 0) + 1,
              updated_at: new Date().toISOString(),
            };
          }),
        ],
        { onConflict: 'profile_id,match_type' }
      );

      const { data: allRatings } = await supabase
        .from('power_ratings')
        .select('profile_id, rating')
        .in('profile_id', participants);
      for (const pid of participants) {
        const userRatings = (allRatings ?? []).filter((r) => r.profile_id === pid).map((r) => r.rating);
        const maxRating = userRatings.length ? Math.max(...userRatings) : defaultRating;
        await supabase.from('profiles').update({ power_level: maxRating, updated_at: new Date().toISOString() }).eq('id', pid);
      }

      router.push('/rankings/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  function addLoser(id: string) {
    if (!loserIds.includes(id)) setLoserIds([...loserIds, id]);
  }
  function removeLoser(id: string) {
    setLoserIds(loserIds.filter((x) => x !== id));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Submit Match Result</h1>
      <p className="text-text-muted mb-6">
        Upload a Shinobi Strikers end-screen screenshot. Use AI to extract names or tag players manually.
      </p>

      <AdSlot slotId="screenshots-submit-below" className="mb-6" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-text-muted mb-2">Screenshot</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-border rounded-lg text-text-muted hover:border-accent hover:text-accent transition"
          >
            {screenshotPreview ? (
              <img src={screenshotPreview} alt="Preview" className="max-h-48 mx-auto rounded" />
            ) : (
              'Click to select screenshot'
            )}
          </button>
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-2">Match type</label>
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value as MatchType)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary"
          >
            {MATCH_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {screenshotFile && workerUrl && (
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 rounded-lg border border-accent text-accent hover:bg-accent/10 disabled:opacity-50"
          >
            {analyzing ? 'Analyzing...' : 'Extract with AI'}
          </button>
        )}

        {aiResult && (
          <div className="p-3 rounded-lg bg-panel border border-border text-sm">
            <p className="text-text-muted">AI extracted: Winner: {aiResult.winnerName ?? '?'}</p>
            {aiResult.loserNames?.length ? (
              <p className="text-text-muted">Losers: {aiResult.loserNames.join(', ')}</p>
            ) : null}
          </div>
        )}

        <div>
          <label className="block text-sm text-text-muted mb-2">Winner</label>
          <select
            value={winnerId ?? ''}
            onChange={(e) => setWinnerId(e.target.value || null)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary"
          >
            <option value="">Select winner</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.username}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-2">Loser(s)</label>
          <select
            value=""
            onChange={(e) => {
              const id = e.target.value;
              if (id) addLoser(id);
              e.target.value = '';
            }}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary mb-2"
          >
            <option value="">Add loser</option>
            {profiles.filter((p) => p.id !== winnerId && !loserIds.includes(p.id)).map((p) => (
              <option key={p.id} value={p.id}>
                {p.username}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {loserIds.map((id) => {
              const p = profiles.find((x) => x.id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-accent/10 text-text-primary text-sm"
                >
                  {p?.username ?? id}
                  <button type="button" onClick={() => removeLoser(id)} className="text-accent hover:opacity-80">
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {error && <p className="text-accent text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !winnerId}
          className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Result'}
        </button>
      </form>

      <Link href="/rankings/" className="inline-block mt-6 text-accent hover:underline text-sm">
        ← View Rankings
      </Link>
    </div>
  );
}

export default function SubmitResultPage() {
  return (
    <AuthGuard>
      <SubmitResultContent />
    </AuthGuard>
  );
}

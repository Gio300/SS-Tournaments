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
  { value: 'barrier_battle', label: 'Barrier Battle' },
  { value: 'red_white', label: 'Red vs White' },
  { value: 'ninja_world_league', label: 'Ninja World League' },
  { value: 'tournament', label: 'Tournament' },
];

type AiPlayer = { name: string; points: number; team: string; isUploader?: boolean };

type AiResult = {
  uploaderName?: string | null;
  victoryTeam?: string[];
  defeatTeam?: string[];
  players?: AiPlayer[];
  playTimeSec?: number | null;
  resultsRemainingSec?: number | null;
  matchMode?: string;
  winnerName?: string | null;
  loserNames?: string[];
};

function SubmitResultContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [matchType, setMatchType] = useState<MatchType>('quick_match');
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setAiResult(null);
    setError('');
    e.target.value = '';
  }

  async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function gameTagMatches(tag: string | null | undefined, inGameName: string | null | undefined): boolean {
    if (!tag?.trim() || !inGameName?.trim()) return false;
    const t = tag.trim().toLowerCase().replace(/\s+/g, '');
    const n = inGameName.trim().toLowerCase().replace(/\s+/g, '');
    return n.includes(t) || t.includes(n) || n === t;
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
      if (res.status === 429) throw new Error('Rate limit reached. Try again in a few minutes.');
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAiResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !screenshotFile || !aiResult) return;
    setError('');

    const gameTag = profile?.game_tag?.trim();
    if (!gameTag) {
      setError('Set your in-game name in Profile first.');
      return;
    }

    const uploaderName = aiResult.uploaderName ?? aiResult.winnerName;
    if (!gameTagMatches(gameTag, uploaderName)) {
      setError(`Screenshot shows "${uploaderName ?? 'unknown'}". Update your game tag to match or use your own screenshot.`);
      return;
    }

    const playTimeSec = aiResult.playTimeSec ?? null;
    const resultsRemainingSec = aiResult.resultsRemainingSec ?? null;

    setSubmitting(true);
    try {
      const buf = await screenshotFile.arrayBuffer();
      const screenshotHash = await sha256Hex(buf);

      if (screenshotHash) {
        let isDuplicate = false;
        if (playTimeSec != null && resultsRemainingSec != null) {
          const { data: existing } = await supabase
            .from('match_results')
            .select('id')
            .eq('play_time_sec', playTimeSec)
            .eq('results_remaining_sec', resultsRemainingSec)
            .eq('screenshot_hash', screenshotHash)
            .limit(1);
          isDuplicate = (existing?.length ?? 0) > 0;
        } else {
          const { data: existingByHash } = await supabase
            .from('match_results')
            .select('id')
            .eq('screenshot_hash', screenshotHash)
            .limit(1);
          isDuplicate = (existingByHash?.length ?? 0) > 0;
        }
        if (isDuplicate) {
          setError('Duplicate screenshot: this result was already submitted. Each screenshot can only be submitted once.');
          setSubmitting(false);
          return;
        }
      }

      const path = `${user.id}/${crypto.randomUUID()}_${screenshotFile.name}`;
      const { error: upErr } = await supabase.storage.from('match-screenshots').upload(path, screenshotFile, {
        contentType: screenshotFile.type,
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('match-screenshots').getPublicUrl(path);

      const resolvedMatchType = (aiResult.matchMode as MatchType) || matchType;
      const validMatchTypes: MatchType[] = ['survival', 'quick_match', 'red_white', 'ninja_world_league', 'tournament', 'barrier_battle'];
      const matchTypeFinal = validMatchTypes.includes(resolvedMatchType) ? resolvedMatchType : matchType;

      const { data: resultData, error: resultErr } = await supabase
        .from('match_results')
        .insert({
          uploader_id: user.id,
          screenshot_url: urlData.publicUrl,
          screenshot_hash: screenshotHash,
          play_time_sec: playTimeSec,
          results_remaining_sec: resultsRemainingSec,
          uploader_in_game_name: uploaderName,
          match_type: matchTypeFinal,
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .select('id')
        .single();
      if (resultErr) throw resultErr;

      const { data: profilesWithTag } = await supabase
        .from('profiles')
        .select('id, game_tag')
        .not('game_tag', 'is', null);

      const tagToProfile = new Map<string, string>();
      for (const p of profilesWithTag ?? []) {
        if (p.game_tag) tagToProfile.set(p.game_tag.trim().toLowerCase(), p.id);
      }

      const players = aiResult.players ?? [];
      const victoryNames = new Set((aiResult.victoryTeam ?? []).map((n) => n.trim().toLowerCase()));
      const defeatNames = new Set((aiResult.defeatTeam ?? []).map((n) => n.trim().toLowerCase()));
      const insertedProfileIds = new Set<string>();

      for (const player of players) {
        const name = player.name?.trim();
        if (!name) continue;
        const nameLower = name.toLowerCase();
        const entry = Array.from(tagToProfile.entries()).find(
          ([tag]) => nameLower.includes(tag) || tag.includes(nameLower)
        );
        const profileId = entry ? entry[1] : null;
        if (!profileId) continue;

        const role = victoryNames.has(nameLower) ? 'winner' : defeatNames.has(nameLower) ? 'loser' : 'participant';
        await supabase.from('match_result_players').insert({
          result_id: resultData.id,
          profile_id: profileId,
          role,
          points: player.points ?? 0,
          in_game_name: name,
          team: player.team === 'victory' ? 'red' : player.team === 'defeat' ? 'white' : null,
        });
        insertedProfileIds.add(profileId);
      }

      if (!insertedProfileIds.has(user.id)) {
        const uploaderPlayer = players.find((p) => p.isUploader || gameTagMatches(gameTag, p.name));
        const uploaderPoints = uploaderPlayer?.points ?? 0;
        const uploaderRole = victoryNames.has((uploaderName ?? '').toLowerCase()) ? 'winner' : defeatNames.has((uploaderName ?? '').toLowerCase()) ? 'loser' : 'participant';
        await supabase.from('match_result_players').insert({
          result_id: resultData.id,
          profile_id: user.id,
          role: uploaderRole,
          points: uploaderPoints,
          in_game_name: uploaderName ?? gameTag,
          team: victoryNames.has((uploaderName ?? '').toLowerCase()) ? 'red' : 'white',
        });
      }

      router.push('/rankings/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  const gameTag = profile?.game_tag?.trim();
  const uploaderName = aiResult?.uploaderName ?? aiResult?.winnerName;
  const canSubmit =
    aiResult &&
    screenshotFile &&
    gameTag &&
    gameTagMatches(gameTag, uploaderName);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Submit Match Result</h1>
      <p className="text-text-muted mb-6">
        Upload a Shinobi Strikers end-screen screenshot. AI extracts everything. Your in-game name must match the blue-highlighted player.
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
          <label className="block text-sm text-text-muted mb-2">Match type (fallback if AI cannot detect)</label>
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

        {!workerUrl && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            <p className="font-medium">AI not configured</p>
            <p className="text-sm mt-1">Screenshot extraction requires NEXT_PUBLIC_CF_WORKER_URL. Add it in GitHub repo Secrets for deployment, or in .env.local for local dev.</p>
            <Link href="/profile/" className="inline-block mt-2 text-sm underline">Set up Profile first</Link>
          </div>
        )}

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
          <div className="p-3 rounded-lg bg-panel border border-border text-sm space-y-2">
            <p className="text-text-muted">Uploader (blue): {aiResult.uploaderName ?? aiResult.winnerName ?? '?'}</p>
            {aiResult.playTimeSec != null && <p className="text-text-muted">Play time: {Math.floor(aiResult.playTimeSec / 60)}:{String(aiResult.playTimeSec % 60).padStart(2, '0')}</p>}
            {aiResult.resultsRemainingSec != null && <p className="text-text-muted">Remaining: {aiResult.resultsRemainingSec}s</p>}
            {aiResult.players?.length ? (
              <div className="mt-2">
                <p className="text-text-muted font-medium mb-1">Players & points:</p>
                {aiResult.players.map((p, i) => (
                  <p key={i} className="text-text-muted text-xs">
                    {p.name}: {p.points} pts {p.isUploader ? '(you)' : ''}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        )}

        <div className="p-3 rounded-lg bg-panel border border-border text-sm space-y-1">
          <p className="font-medium text-text-muted mb-2">Requirements to submit:</p>
          <p className={screenshotFile ? 'text-green-600' : 'text-text-muted'}>
            {screenshotFile ? '✓' : '○'} Select screenshot
          </p>
          <p className={workerUrl ? 'text-green-600' : 'text-amber-500'}>
            {workerUrl ? '✓' : '○'} AI configured (Cloudflare Worker)
          </p>
          <p className={screenshotFile && aiResult ? 'text-green-600' : 'text-text-muted'}>
            {screenshotFile && aiResult ? '✓' : '○'} Extract with AI (click button above)
          </p>
          <p className={gameTag ? 'text-green-600' : 'text-amber-500'}>
            {gameTag ? '✓' : '○'} Game tag set in Profile ({gameTag ? `"${gameTag}"` : 'not set'})
          </p>
          <p className={aiResult && gameTag && gameTagMatches(gameTag, uploaderName) ? 'text-green-600' : 'text-text-muted'}>
            {aiResult && gameTag && gameTagMatches(gameTag, uploaderName) ? '✓' : '○'} Game tag matches blue-highlighted name ({uploaderName ? `"${uploaderName}"` : '—'})
          </p>
        </div>

        {error && <p className="text-accent text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !canSubmit}
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

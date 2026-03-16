'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';
import { AdSlot } from '@/components/AdSlot';
import type { StatCheckSubmission } from '@/types/database';

type SubmissionWithProfile = StatCheckSubmission & {
  profiles?: { username: string; avatar_url: string | null };
};

function StatCheckContent() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionWithProfile[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('stat_check_submissions')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setSubmissions((data as SubmissionWithProfile[]) ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !videoUrl.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from('stat_check_submissions').insert({
        user_id: user.id,
        video_url: videoUrl.trim(),
        character_name: characterName.trim() || null,
        description: description.trim() || null,
        status: 'pending',
      });
      if (err) throw err;
      setVideoUrl('');
      setCharacterName('');
      setDescription('');
      const { data } = await supabase
        .from('stat_check_submissions')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: false });
      setSubmissions((data as SubmissionWithProfile[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Stat Check</h1>
      <p className="text-text-muted mb-6">
        Submit videos showing your character buffs. The community can verify if someone is stacking buffs.
      </p>

      <AdSlot slotId="stat-check-hero-below" className="mb-6" />

      <AuthGuard>
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-panel p-4 mb-8">
          <h2 className="font-semibold text-text-primary mb-4">Submit Video</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-text-muted mb-1">Video URL (YouTube or direct link)</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Character name (optional)</label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g. Naruto"
                className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the buffs shown..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary resize-y"
              />
            </div>
          </div>
          {error && <p className="mt-2 text-accent text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </AuthGuard>

      <AdSlot slotId="stat-check-between" className="mb-6" />

      <h2 className="font-semibold text-text-primary mb-4">Submissions</h2>
      {submissions.length === 0 ? (
        <p className="text-text-muted">No submissions yet.</p>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-panel p-4">
              <div className="flex items-center gap-2 mb-2">
                {s.profiles?.avatar_url ? (
                  <img src={s.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
                    {s.profiles?.username?.[0] ?? '?'}
                  </div>
                )}
                <span className="font-medium text-text-primary">{s.profiles?.username ?? 'Unknown'}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    s.status === 'approved' ? 'bg-green-500/20 text-green-400' : s.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <a
                href={s.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline text-sm break-all"
              >
                {s.video_url}
              </a>
              {s.character_name && <p className="text-text-muted text-sm mt-1">Character: {s.character_name}</p>}
              {s.description && <p className="text-text-muted text-sm mt-1">{s.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatCheckPage() {
  return <StatCheckContent />;
}

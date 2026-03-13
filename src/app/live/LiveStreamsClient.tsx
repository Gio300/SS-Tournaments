'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { LiveStream } from '@/types/database';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function YouTubeEmbed({ url, title }: { url: string; title?: string | null }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return (
    <div className="aspect-video rounded-lg overflow-hidden border border-border">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title ?? 'Live stream'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

function AddStreamForm() {
  const { user } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setError('Invalid YouTube URL');
      return;
    }
    if (!user) return;
    setLoading(true);
    const { error: err } = await supabase.from('live_streams').insert({
      user_id: user.id,
      youtube_url: youtubeUrl.trim(),
      title: title.trim() || null,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setYoutubeUrl('');
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-border bg-panel mb-8">
      <h2 className="font-semibold text-text-primary mb-4">Add stream</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-text-muted mb-1">YouTube URL</label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-panel border border-border text-text-primary focus:outline-none focus:border-accent"
            placeholder="My stream"
          />
        </div>
        {error && <p className="text-accent text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add stream'}
        </button>
      </div>
    </form>
  );
}

export function LiveStreamsClient() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchStreams() {
      const { data } = await supabase
        .from('live_streams')
        .select('*')
        .order('created_at', { ascending: false });
      setStreams(data ?? []);
      setLoading(false);
    }
    fetchStreams();

    const sub = supabase
      .channel('live_streams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, fetchStreams)
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-pulse text-accent">Loading streams...</div>
      </div>
    );
  }

  return (
    <>
      {user && <AddStreamForm />}
      {!user && (
        <p className="text-text-muted text-sm mb-8">
          <Link href="/login/" className="text-accent hover:underline">Sign in</Link> to add streams.
        </p>
      )}
      <div className="space-y-8">
        <h2 className="font-semibold text-text-primary">Streams</h2>
        {streams.length === 0 ? (
          <p className="text-text-muted">No streams yet.</p>
        ) : (
          <div className="grid gap-6">
            {streams.map((stream) => (
              <div key={stream.id} className="rounded-xl border border-border bg-panel overflow-hidden">
                <div className="p-4">
                  <h3 className="font-medium text-text-primary">{stream.title ?? 'Stream'}</h3>
                  {stream.title && (
                    <p className="text-text-muted text-sm mt-1">{stream.title}</p>
                  )}
                </div>
                <YouTubeEmbed url={stream.youtube_url} title={stream.title} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8">
        <Link href="/live/director/" className="text-accent hover:underline font-medium">
          AI Director mode (8 streams) →
        </Link>
      </div>
    </>
  );
}

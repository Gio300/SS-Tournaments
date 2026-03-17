'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Radio } from 'lucide-react';
import { getWorkerUrl } from '@/lib/workerUrl';
import { extractYouTubeId } from '@/lib/youtube';

const POLL_INTERVAL_MS = 25000;

export default function DirectorPage() {
  const [urls, setUrls] = useState<string[]>(Array(8).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const videoIds = urls.map((u) => extractYouTubeId(u)).filter(Boolean) as string[];
  const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;

  const pollDirector = useCallback(async () => {
    if (!workerUrl || videoIds.length < 2) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${workerUrl.replace(/\/$/, '')}/director`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds }),
      });
      const data = await res.json();
      if (data.index && data.index >= 1 && data.index <= videoIds.length) {
        setActiveIndex(data.index - 1);
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workerUrl, videoIds.join(',')]);

  useEffect(() => {
    if (videoIds.length < 2 || !workerUrl) return;
    pollDirector();
    const id = setInterval(pollDirector, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pollDirector, videoIds.length, workerUrl]);

  const activeId = videoIds[activeIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2">
            <Radio className="text-accent" size={28} />
            AI Director
          </h1>
          <p className="text-text-muted mt-1">
            Add up to 8 YouTube stream URLs. AI picks which stream has the most action.
          </p>
        </div>
        <Link href="/live/" className="text-accent hover:underline text-sm">
          ← Back to Live
        </Link>
      </div>

      {!workerUrl && (
        <div className="p-4 rounded-lg border border-accent bg-accent/10 text-accent mb-6">
          Configure AI Worker URL in Settings → Appearance to enable AI Director.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-panel overflow-hidden">
            {activeId ? (
              <div className="aspect-video relative">
                <iframe
                  key={activeId}
                  src={`https://www.youtube.com/embed/${activeId}`}
                  title="Active stream"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
                {loading && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-sm">AI selecting...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center text-text-muted">
                Add at least 2 stream URLs below
              </div>
            )}
          </div>
          {error && <p className="text-accent text-sm">{error}</p>}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-text-primary">Stream URLs</h2>
          <div className="space-y-2">
            {urls.map((url, i) => (
              <input
                key={i}
                type="url"
                value={url}
                onChange={(e) => {
                  const next = [...urls];
                  next[i] = e.target.value;
                  setUrls(next);
                }}
                placeholder={`Stream ${i + 1}`}
                className="w-full px-3 py-2 rounded-lg bg-panel border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {videoIds.map((id, i) => (
              <div
                key={id}
                className={`w-16 h-9 rounded overflow-hidden border-2 ${
                  i === activeIndex ? 'border-accent' : 'border-border'
                }`}
              >
                <img
                  src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

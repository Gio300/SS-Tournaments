'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const ACTIONS = [
  { id: 'rewrite', label: 'Rewrite', desc: 'Improve clarity and grammar' },
  { id: 'shorten', label: 'Shorten', desc: 'Condense for captions' },
  { id: 'expand', label: 'Expand', desc: 'Add detail and context' },
  { id: 'suggest_caption', label: 'Suggest caption', desc: 'Generate a caption' },
  { id: 'suggest_poll_options', label: 'Suggest poll options', desc: 'Given question, propose options' },
] as const;

export function MetaAIButton({
  body,
  pollQuestion,
  onResult,
  onPollOptionsResult,
}: {
  body: string;
  pollQuestion?: string;
  onResult: (text: string) => void;
  onPollOptionsResult?: (options: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;
  const hasInput = body.trim().length > 0 || (pollQuestion ?? '').trim().length > 0;

  async function runAction(action: string) {
    if (!workerUrl) {
      setError('AI assist not configured. Set NEXT_PUBLIC_CF_WORKER_URL.');
      return;
    }
    const isPollAction = action === 'suggest_poll_options';
    if (isPollAction && !(pollQuestion ?? '').trim()) {
      setError('Add a poll question first.');
      return;
    }
    if (!isPollAction && !body.trim()) {
      setError('Add some text first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const base = workerUrl.replace(/\/$/, '');
      const res = await fetch(`${base}/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: body.trim(),
          pollQuestion: (pollQuestion ?? '').trim() || undefined,
          action,
        }),
      });
      const data = await res.json();
      if (res.status === 429) throw new Error('Rate limit reached. Try again in a few minutes.');
      if (!res.ok) throw new Error(data.error || data.details || 'Request failed');
      const text = data.text ?? '';
      if (text) {
        if (isPollAction && onPollOptionsResult) {
          const lines = text.split(/\n|,/).map((s: string) => s.trim()).filter(Boolean);
          onPollOptionsResult(lines.slice(0, 6));
        } else {
          onResult(text);
        }
      }
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI assist failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
        title="Meta AI assist"
      >
        <Sparkles size={20} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-border bg-panel shadow-xl p-2 z-50">
          <p className="text-xs text-text-muted px-2 py-1 mb-2">Meta AI can help with:</p>
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => runAction(a.id)}
              disabled={loading || (a.id === 'suggest_poll_options' ? !(pollQuestion ?? '').trim() : !body.trim())}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="font-medium">{a.label}</span>
              <span className="text-xs text-text-muted block">{a.desc}</span>
            </button>
          ))}
          {loading && <p className="text-xs text-accent px-2 py-1">Working...</p>}
          {error && <p className="text-xs text-accent px-2 py-1">{error}</p>}
        </div>
      )}
    </div>
  );
}

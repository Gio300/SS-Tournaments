'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Post } from '@/types/database';

export function SharePostModal({
  post,
  currentUserId,
  onClose,
  onShared,
}: {
  post: Post & { profiles?: { username: string } };
  currentUserId: string;
  onClose: () => void;
  onShared?: () => void;
}) {
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) return;
    setError('');
    setSending(true);
    try {
      const { error: err } = await supabase.from('posts').insert({
        user_id: currentUserId,
        body: comment.trim() || ' ',
        repost_of_id: post.id,
        updated_at: new Date().toISOString(),
      });
      if (err) throw err;
      onShared?.();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? (err instanceof Error ? err.message : 'Failed to share');
      setError(String(msg));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="rounded-xl border border-border bg-panel p-4 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-text-primary mb-2">Share post</h3>
        <p className="text-sm text-text-muted mb-3">
          Add a comment to share {post.profiles?.username ?? 'Unknown'}&apos;s post to your wall.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-y"
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              {sending ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

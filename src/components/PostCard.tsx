'use client';

import Link from 'next/link';
import type { Post, PostAttachment, PostPoll, PostPollOption } from '@/types/database'

type PostWithExtras = Post & {
  profiles?: { username: string; avatar_url: string | null };
  post_attachments?: (PostAttachment & { reels?: { id: string; title: string; thumbnail: string | null } })[];
  post_polls?: (PostPoll & { post_poll_options?: (PostPollOption & { vote_count?: number; user_voted?: boolean })[] })[];
};

function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) =>
    part.match(urlRegex) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">
        {part}
      </a>
    ) : (
      part
    )
  );
}

export function PostCard({
  post,
  onVote,
  currentUserId,
}: {
  post: PostWithExtras;
  onVote?: (optionId: string) => void;
  currentUserId?: string | null;
}) {
  const poll = post.post_polls?.[0];
  const options = poll?.post_poll_options ?? [];
  const attachments = post.post_attachments ?? [];
  const images = attachments.filter((a) => a.type === 'image');
  const reels = attachments.filter((a) => a.type === 'reel');

  const pollEnded = poll?.ends_at ? new Date(poll.ends_at) < new Date() : false;
  const canVote = poll && !pollEnded && currentUserId;

  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className="flex gap-3">
        {post.profiles?.avatar_url ? (
          <img src={post.profiles.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold shrink-0">
            {post.profiles?.username?.[0] ?? '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${post.user_id}/`} className="font-medium text-accent hover:underline">
            {post.profiles?.username ?? 'Unknown'}
          </Link>
          <span className="text-text-muted text-sm ml-2">
            {new Date(post.created_at).toLocaleString()}
          </span>
        </div>
      </div>
      {post.body.trim() && (
        <p className="mt-2 text-text-primary whitespace-pre-wrap break-words">{linkify(post.body)}</p>
      )}
      {images.length > 0 && (
        <div className={`mt-2 grid gap-1 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {images.slice(0, 4).map((a) => (
            <img key={a.id} src={a.url_or_id} alt="" className="rounded-lg object-cover max-h-64 w-full" />
          ))}
        </div>
      )}
      {reels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {reels.map((a) => {
            const reel = (a as PostAttachment & { reels?: { title: string; thumbnail: string | null } }).reels
            return (
              <Link
                key={a.id}
                href={`/reels/${a.url_or_id}/`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20"
              >
                {reel?.thumbnail ? <img src={reel.thumbnail} alt="" className="w-12 h-8 rounded object-cover" /> : null}
                <span className="text-sm font-medium truncate max-w-[140px]">{reel?.title ?? 'Reel'}</span>
              </Link>
            )
          })}
        </div>
      )}
      {poll && (
        <div className="mt-3 p-3 rounded-lg border border-border bg-bg/50">
          <p className="font-medium text-text-primary mb-2">{poll.question}</p>
          <div className="space-y-2">
            {options.map((opt) => {
              const total = options.reduce((s, o) => s + (o.vote_count ?? 0), 0);
              const pct = total > 0 ? ((opt.vote_count ?? 0) / total) * 100 : 0;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => canVote && onVote?.(opt.id)}
                  disabled={!canVote || opt.user_voted}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    opt.user_voted ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                  } ${!canVote ? 'cursor-default' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-text-primary">{opt.label}</span>
                    {!canVote && <span className="text-text-muted text-sm">{Math.round(pct)}%</span>}
                  </div>
                  {!canVote && (
                    <div className="mt-1 h-1.5 rounded-full bg-bg overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Post, PostAttachment, PostPoll, PostPollOption, PostReaction, PostComment, PostReactionEmoji } from '@/types/database';
import { SharePostModal } from './SharePostModal';

type PostWithExtras = Post & {
  profiles?: { username: string; avatar_url: string | null; power_level?: number };
  post_attachments?: (PostAttachment & { reels?: { id: string; title: string; thumbnail: string | null } })[];
  post_polls?: (PostPoll & { post_poll_options?: (PostPollOption & { vote_count?: number; user_voted?: boolean })[] })[];
};

const REACTION_EMOJIS: { emoji: PostReactionEmoji; label: string; char: string }[] = [
  { emoji: 'like', label: 'Like', char: '👍' },
  { emoji: 'love', label: 'Love', char: '❤️' },
  { emoji: 'haha', label: 'Haha', char: '😂' },
  { emoji: 'wow', label: 'Wow', char: '😮' },
  { emoji: 'sad', label: 'Sad', char: '😢' },
  { emoji: 'angry', label: 'Angry', char: '😠' },
];

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

type CommentWithProfile = PostComment & { profiles?: { username: string; avatar_url: string | null } };

export function PostCard({
  post,
  onVote,
  currentUserId,
  onRefresh,
}: {
  post: PostWithExtras;
  onVote?: (optionId: string) => void;
  currentUserId?: string | null;
  onRefresh?: () => void;
}) {
  const poll = post.post_polls?.[0];
  const options = poll?.post_poll_options ?? [];
  const attachments = post.post_attachments ?? [];
  const images = attachments.filter((a) => a.type === 'image');
  const reels = attachments.filter((a) => a.type === 'reel');

  const [reactions, setReactions] = useState<PostReaction[]>([]);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [originalPost, setOriginalPost] = useState<PostWithExtras | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (showReactionPicker && !(e.target as Element).closest('[data-reaction-picker]')) setShowReactionPicker(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReactionPicker]);

  useEffect(() => {
    async function fetch() {
      const [reactionsRes, commentsRes] = await Promise.all([
        supabase.from('post_reactions').select('*').eq('post_id', post.id),
        supabase.from('post_comments').select('*, profiles(username, avatar_url)').eq('post_id', post.id).order('created_at', { ascending: true }),
      ]);
      setReactions((reactionsRes.data ?? []) as PostReaction[]);
      setComments((commentsRes.data ?? []) as CommentWithProfile[]);
    }
    fetch();
  }, [post.id]);

  useEffect(() => {
    if (!post.repost_of_id) return;
    async function fetchOriginal() {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url, power_level), post_attachments(*, reels(id, title, thumbnail)), post_polls(*, post_poll_options(*))')
        .eq('id', post.repost_of_id!)
        .single();
      if (data) setOriginalPost(data as PostWithExtras);
    }
    fetchOriginal();
  }, [post.repost_of_id]);

  const reactionCounts = REACTION_EMOJIS.map((r) => ({
    ...r,
    count: reactions.filter((x) => x.emoji === r.emoji).length,
  })).filter((r) => r.count > 0);
  const myReaction = currentUserId ? reactions.find((r) => r.user_id === currentUserId) : null;
  const totalReactions = reactions.length;

  async function handleReaction(emoji: PostReactionEmoji) {
    if (!currentUserId) return;
    setShowReactionPicker(false);
    if (myReaction?.emoji === emoji) {
      await supabase.from('post_reactions').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      setReactions((prev) => prev.filter((r) => !(r.user_id === currentUserId)));
    } else {
      await supabase.from('post_reactions').upsert({ post_id: post.id, user_id: currentUserId, emoji }, { onConflict: 'post_id,user_id' });
      setReactions((prev) => {
        const rest = prev.filter((r) => r.user_id !== currentUserId);
        return [...rest, { id: '', post_id: post.id, user_id: currentUserId, emoji, created_at: new Date().toISOString() }];
      });
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || !commentInput.trim()) return;
    setSubmittingComment(true);
    const body = commentInput.trim();
    setCommentInput('');
    const { data } = await supabase.from('post_comments').insert({ post_id: post.id, user_id: currentUserId, body }).select('*, profiles(username, avatar_url)').single();
    setSubmittingComment(false);
    if (data) setComments((prev) => [...prev, data as CommentWithProfile]);
    onRefresh?.();
  }

  const pollEnded = poll?.ends_at ? new Date(poll.ends_at) < new Date() : false;
  const canVote = poll && !pollEnded && currentUserId;
  const isRepost = !!post.repost_of_id;
  const canShare = post.shareable !== false && !!currentUserId && !isRepost;

  const embeddedAttachments = originalPost?.post_attachments ?? [];
  const embeddedImages = embeddedAttachments.filter((a) => a.type === 'image');
  const embeddedReels = embeddedAttachments.filter((a) => a.type === 'reel');

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
          {isRepost && originalPost && (
            <span className="text-text-muted text-sm ml-1">
              shared{' '}
              <Link href={`/profile/${originalPost.user_id}/`} className="text-accent hover:underline">
                {originalPost.profiles?.username ?? 'Unknown'}
              </Link>
              &apos;s post
            </span>
          )}
          <span className="text-accent text-sm ml-2">Power level {post.profiles?.power_level ?? 0}</span>
          <span className="text-text-muted text-sm ml-2">
            {new Date(post.created_at).toLocaleString()}
          </span>
        </div>
      </div>
      {isRepost && originalPost && (
        <div className="mt-2 rounded-lg border border-border bg-bg/50 p-3">
          <div className="flex gap-2">
            {originalPost.profiles?.avatar_url ? (
              <img src={originalPost.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                {originalPost.profiles?.username?.[0] ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${originalPost.user_id}/`} className="font-medium text-accent hover:underline text-sm">
                {originalPost.profiles?.username ?? 'Unknown'}
              </Link>
              {originalPost.body?.trim() && (
                <p className="mt-1 text-text-primary text-sm whitespace-pre-wrap break-words">{linkify(originalPost.body)}</p>
              )}
              {embeddedImages.length > 0 && (
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {embeddedImages.slice(0, 2).map((a) => (
                    <img key={a.id} src={a.url_or_id} alt="" className="rounded object-cover max-h-32 w-full" />
                  ))}
                </div>
              )}
              {embeddedReels.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {embeddedReels.map((a) => {
                    const reel = (a as PostAttachment & { reels?: { title: string; thumbnail: string | null } }).reels;
                    return (
                      <Link
                        key={a.id}
                        href={`/reels/${a.url_or_id}/`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-accent/10 border border-accent/30 text-accent text-xs hover:bg-accent/20"
                      >
                        {reel?.thumbnail ? <img src={reel.thumbnail} alt="" className="w-8 h-5 rounded object-cover" /> : null}
                        <span className="truncate max-w-[80px]">{reel?.title ?? 'Reel'}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
            const reel = (a as PostAttachment & { reels?: { title: string; thumbnail: string | null } }).reels;
            return (
              <Link
                key={a.id}
                href={`/reels/${a.url_or_id}/`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20"
              >
                {reel?.thumbnail ? <img src={reel.thumbnail} alt="" className="w-12 h-8 rounded object-cover" /> : null}
                <span className="text-sm font-medium truncate max-w-[140px]">{reel?.title ?? 'Reel'}</span>
              </Link>
            );
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

      {/* Reaction bar */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-4">
        <div className="relative" data-reaction-picker>
          <button
            type="button"
            onClick={() => currentUserId && setShowReactionPicker((v) => !v)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition ${
              myReaction ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
            }`}
          >
            <span>{myReaction ? REACTION_EMOJIS.find((r) => r.emoji === myReaction.emoji)?.char ?? '👍' : '👍'}</span>
            {totalReactions > 0 && <span>{totalReactions}</span>}
          </button>
          {showReactionPicker && (
            <div className="absolute bottom-full left-0 mb-1 flex gap-1 p-2 rounded-xl border border-border bg-panel shadow-xl z-10">
              {REACTION_EMOJIS.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => handleReaction(r.emoji)}
                  className={`p-1.5 rounded-lg text-lg transition hover:scale-125 ${
                    myReaction?.emoji === r.emoji ? 'bg-accent/20' : 'hover:bg-white/10'
                  }`}
                  title={r.label}
                >
                  {r.char}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition"
        >
          <span>💬</span>
          {comments.length > 0 && <span>{comments.length}</span>}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition"
            title="Share"
          >
            <Share2 size={16} />
          </button>
        )}
      </div>
      {showShareModal && currentUserId && (
        <SharePostModal
          post={post}
          currentUserId={currentUserId}
          onClose={() => setShowShareModal(false)}
          onShared={onRefresh}
        />
      )}

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              {c.profiles?.avatar_url ? (
                <img src={c.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                  {c.profiles?.username?.[0] ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${c.user_id}/`} className="font-medium text-accent hover:underline text-sm">
                  {c.profiles?.username ?? 'Unknown'}
                </Link>
                <p className="text-text-primary text-sm whitespace-pre-wrap break-words">{linkify(c.body)}</p>
                <span className="text-text-muted text-xs">{new Date(c.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {currentUserId && (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded-lg bg-bg border border-border text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent"
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={!commentInput.trim() || submittingComment}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submittingComment ? '...' : 'Comment'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ImagePlus, Film, BarChart2, X } from 'lucide-react';
import type { Reel } from '@/types/database';
import { MetaAIButton } from './MetaAIButton';

const MAX_IMAGES = 4;

type ReelOption = Reel & { profiles?: { username: string } };

export function PostComposer({ onPosted }: { onPosted?: () => void }) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [attachedReelIds, setAttachedReelIds] = useState<string[]>([]);
  const [showReelPicker, setShowReelPicker] = useState(false);
  const [userReels, setUserReels] = useState<ReelOption[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollEndsAt, setPollEndsAt] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !showReelPicker) return;
    supabase
      .from('reels')
      .select('*, profiles(username)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setUserReels(data ?? []));
  }, [user?.id, showReelPicker]);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !user) return;
    const newFiles: File[] = [];
    for (let i = 0; i < files.length && imageFiles.length + newFiles.length < MAX_IMAGES; i++) {
      if (files[i].type.startsWith('image/')) newFiles.push(files[i]);
    }
    if (newFiles.length === 0) return;
    setImageFiles((prev) => [...prev, ...newFiles].slice(0, MAX_IMAGES));
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setImageUrls((prev) => [...prev, ...urls].slice(0, MAX_IMAGES));
    e.target.value = '';
  }

  function removeImage(i: number) {
    setImageFiles((prev) => prev.filter((_, j) => j !== i));
    URL.revokeObjectURL(imageUrls[i]);
    setImageUrls((prev) => prev.filter((_, j) => j !== i));
  }

  function addPollOption() {
    if (pollOptions.length >= 6) return;
    setPollOptions((prev) => [...prev, '']);
  }

  function removePollOption(i: number) {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, j) => j !== i));
  }

  function addReel(reelId: string) {
    if (attachedReelIds.includes(reelId)) return;
    setAttachedReelIds((prev) => [...prev, reelId].slice(0, 4));
  }

  function removeReel(reelId: string) {
    setAttachedReelIds((prev) => prev.filter((id) => id !== reelId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    const hasBody = body.trim().length > 0;
    const hasImages = imageFiles.length > 0;
    const hasReels = attachedReelIds.length > 0;
    const hasPoll = showPoll && pollQuestion.trim() && pollOptions.some((o) => o.trim());
    if (!hasBody && !hasImages && !hasReels && !hasPoll) {
      setError('Add some text, images, a reel, or a poll.');
      return;
    }
    if (showPoll) {
      const valid = pollOptions.filter((o) => o.trim()).length;
      if (valid < 2) {
        setError('Poll needs at least 2 options.');
        return;
      }
    }
    setSending(true);
    try {
      const { data: postData, error: postErr } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          body: body.trim() || ' ',
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (postErr) throw postErr;
      const postId = postData.id;

      const sortOrder = 0;
      for (const file of imageFiles) {
        const path = `${user.id}/${crypto.randomUUID()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from('post-images').upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path);
        await supabase.from('post_attachments').insert({
          post_id: postId,
          type: 'image',
          url_or_id: urlData.publicUrl,
          sort_order: sortOrder,
        });
      }
      attachedReelIds.forEach((reelId, i) => {
        supabase.from('post_attachments').insert({
          post_id: postId,
          type: 'reel',
          url_or_id: reelId,
          sort_order: 100 + i,
        });
      });

      if (showPoll && pollQuestion.trim()) {
        const opts = pollOptions.filter((o) => o.trim());
        if (opts.length >= 2) {
          const { data: pollData, error: pollErr } = await supabase
            .from('post_polls')
            .insert({
              post_id: postId,
              question: pollQuestion.trim(),
              ends_at: pollEndsAt || null,
            })
            .select('id')
            .single();
          if (pollErr) throw pollErr;
          for (let i = 0; i < opts.length; i++) {
            await supabase.from('post_poll_options').insert({
              poll_id: pollData.id,
              label: opts[i].trim(),
              sort_order: i,
            });
          }
        }
      }

      setBody('');
      setImageFiles([]);
      imageUrls.forEach((u) => URL.revokeObjectURL(u));
      setImageUrls([]);
      setAttachedReelIds([]);
      setShowPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollEndsAt('');
      onPosted?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post');
    } finally {
      setSending(false);
    }
  }

  const hasContent = body.trim() || imageFiles.length > 0 || attachedReelIds.length > 0 || (showPoll && pollQuestion.trim());

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-panel p-4 mb-6 relative">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        maxLength={2000}
        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-y mb-3"
      />

      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {imageUrls.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-xs"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {attachedReelIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachedReelIds.map((reelId) => {
            const reel = userReels.find((r) => r.id === reelId);
            return (
              <div
                key={reelId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-sm"
              >
                <Film size={14} className="text-accent" />
                <span className="text-text-primary truncate max-w-[120px]">{reel?.title ?? reelId}</span>
                <button type="button" onClick={() => removeReel(reelId)} className="text-text-muted hover:text-accent">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showPoll && (
        <div className="mb-3 p-3 rounded-lg border border-border bg-bg/50 space-y-2">
          <input
            type="text"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Poll question"
            className="w-full px-3 py-2 rounded bg-panel border border-border text-text-primary text-sm"
          />
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const next = [...pollOptions];
                  next[i] = e.target.value;
                  setPollOptions(next);
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-2 rounded bg-panel border border-border text-text-primary text-sm"
              />
              <button
                type="button"
                onClick={() => removePollOption(i)}
                disabled={pollOptions.length <= 2}
                className="text-text-muted hover:text-accent disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button type="button" onClick={addPollOption} className="text-sm text-accent hover:underline">
              + Add option
            </button>
          )}
          <div className="pt-2">
            <label className="text-xs text-text-muted">End date (optional)</label>
            <input
              type="datetime-local"
              value={pollEndsAt}
              onChange={(e) => setPollEndsAt(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded bg-panel border border-border text-text-primary text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageFiles.length >= MAX_IMAGES}
            className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 disabled:opacity-40"
            title="Add image"
          >
            <ImagePlus size={20} />
          </button>
          <button
            type="button"
            onClick={() => setShowReelPicker(!showReelPicker)}
            className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10"
            title="Attach reel"
          >
            <Film size={20} />
          </button>
          <button
            type="button"
            onClick={() => setShowPoll(!showPoll)}
            className={`p-2 rounded-lg ${showPoll ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-accent hover:bg-accent/10'}`}
            title="Add poll"
          >
            <BarChart2 size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <MetaAIButton
            body={body}
            pollQuestion={pollQuestion}
            onResult={(text) => {
              if (text) setBody(text);
            }}
            onPollOptionsResult={(opts) => {
              if (opts.length > 0) setPollOptions(opts.length >= 2 ? opts : [...opts, '']);
            }}
          />
          <button
            type="submit"
            disabled={sending || !hasContent}
            className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {sending ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {showReelPicker && (
        <div className="mt-3 p-3 rounded-lg border border-border bg-bg/50 max-h-40 overflow-y-auto">
          <p className="text-sm text-text-muted mb-2">Attach your reel</p>
          {userReels.length === 0 ? (
            <p className="text-sm text-text-muted">No reels yet. Create one first.</p>
          ) : (
            <div className="space-y-1">
              {userReels.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => addReel(r.id)}
                  className={`block w-full text-left px-3 py-2 rounded text-sm ${
                    attachedReelIds.includes(r.id) ? 'bg-accent/20 text-accent' : 'hover:bg-white/5 text-text-primary'
                  }`}
                >
                  {r.title} · {r.clip_ids?.length ?? 0} clips
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
    </form>
  );
}

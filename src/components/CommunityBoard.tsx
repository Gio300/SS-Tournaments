'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, type CommunityPost } from '@/lib/supabase';
import { MessageCircle, Send, Lock } from 'lucide-react';

const DISPLAY_NAME_KEY = 'sml_rules_display_name';

function getDisplayName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DISPLAY_NAME_KEY);
}

function setDisplayName(name: string) {
  localStorage.setItem(DISPLAY_NAME_KEY, name.trim().slice(0, 32));
}

function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) =>
    part.match(urlRegex) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline break-all"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

export function CommunityBoard() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const [promptName, setPromptName] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [newBody, setNewBody] = useState('');
  const [sending, setSending] = useState(false);

  const loadName = useCallback(() => {
    setDisplayNameState(getDisplayName());
  }, []);

  useEffect(() => {
    loadName();
  }, [loadName]);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
      setPosts([]);
    } else {
      setPosts((data as CommunityPost[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel('community')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        fetchPosts
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  function handleSetName(e: React.FormEvent) {
    e.preventDefault();
    const name = promptName.trim().slice(0, 32);
    if (name) {
      setDisplayName(name);
      setDisplayNameState(name);
      setPromptName('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = getDisplayName();
    if (!name || !newBody.trim() || sending) return;

    setSending(true);
    const { error } = await supabase.from('community_posts').insert({
      display_name: name,
      body: newBody.trim().slice(0, 2000),
      parent_id: replyTo || null,
    });

    if (error) console.error(error);
    else {
      setNewBody('');
      setReplyTo(null);
    }
    setSending(false);
  }

  const rootPosts = posts.filter((p) => !p.parent_id);
  const repliesByParent = posts.reduce<Record<string, CommunityPost[]>>((acc, p) => {
    if (p.parent_id) {
      if (!acc[p.parent_id]) acc[p.parent_id] = [];
      acc[p.parent_id].push(p);
    }
    return acc;
  }, {});

  if (!isSupabaseConfigured) {
    return (
      <div className="bg-panel border border-border rounded-xl p-6 space-y-4">
        <div className="text-center">
          <p className="text-text-primary font-medium mb-2">Community Board Not Configured</p>
          <p className="text-text-muted text-sm mb-4">
            To enable the community discussion board, you need to set up Supabase.
          </p>
        </div>
        <div className="bg-bg/50 rounded-lg p-4 text-sm">
          <p className="text-text-primary font-medium mb-2">Setup Steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-text-muted">
            <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">supabase.com</a></li>
            <li>Run the SQL script in <code className="text-text-primary">supabase/schema.sql</code></li>
            <li>Add environment variables:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code className="text-text-primary">NEXT_PUBLIC_SUPABASE_URL</code></li>
                <li><code className="text-text-primary">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
              </ul>
            </li>
            <li>For GitHub Pages: Add these as repository secrets in <strong>Settings → Secrets and variables → Actions</strong></li>
            <li>Rebuild and redeploy</li>
          </ol>
        </div>
        <p className="text-text-muted text-xs text-center">
          Until configured, use the "Discuss on GitHub" option above or the Rules Bot for questions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-lg border border-accent-secondary/50 bg-accent-secondary/5">
        <MessageCircle className="flex-shrink-0 text-accent-secondary mt-0.5" size={24} />
        <p className="text-sm text-text-muted">
          Community chat is <strong className="text-text-primary">NOT</strong> an official ruling. For official answers, use the Rules and the Rules Bot.
        </p>
      </div>

      {displayName === null ? (
        <div className="bg-panel border border-border rounded-xl p-6">
          <p className="text-text-primary font-medium mb-2">Choose a display name to post</p>
          <p className="text-text-muted text-sm mb-4">Stored in this device only. Duplicate names are allowed.</p>
          <form onSubmit={handleSetName} className="flex gap-2">
            <input
              type="text"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              placeholder="Display name"
              maxLength={32}
              className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button type="submit" className="px-4 py-2.5 min-h-[44px] rounded-lg bg-accent text-white font-medium hover:bg-accent/90 touch-no-zoom">
              Continue
            </button>
          </form>
        </div>
      ) : (
        <>
          <p className="text-text-muted text-sm">Posting as <span className="text-text-primary">{displayName}</span></p>

          <form onSubmit={handleSubmit} className="space-y-2">
            {replyTo && (
              <p className="text-sm text-text-muted">
                Replying to post. <button type="button" className="text-accent hover:underline py-2 px-2 min-h-[44px] min-w-[44px] touch-no-zoom" onClick={() => setReplyTo(null)}>Cancel</button>
              </p>
            )}
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Write a message..."
              rows={3}
              maxLength={2000}
              className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-y"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || !newBody.trim()}
                className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50 touch-no-zoom"
              >
                <Send size={18} /> Post
              </button>
            </div>
          </form>
        </>
      )}

      <div className="border-t border-border pt-6">
        <h2 className="font-display font-semibold text-text-primary mb-4">Discussion</h2>
        {loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : rootPosts.length === 0 ? (
          <p className="text-text-muted">No posts yet. Be the first to start a thread.</p>
        ) : (
          <ul className="space-y-4">
            {rootPosts.map((post) => (
              <li key={post.id} className="bg-panel border border-border rounded-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-text-primary">{post.display_name}</span>
                    <span className="text-text-muted text-sm">
                      {new Date(post.created_at).toLocaleString()}
                    </span>
                    {post.locked && <Lock size={14} className="text-text-muted" />}
                  </div>
                  <p className="mt-1 text-text-primary whitespace-pre-wrap break-words">
                    {linkify(post.body)}
                  </p>
                  {displayName && !post.locked && (
                    <button
                      type="button"
                      onClick={() => setReplyTo(post.id)}
                      className="mt-2 text-sm text-accent hover:underline py-2 px-2 min-h-[44px] min-w-[44px] touch-no-zoom"
                    >
                      Reply
                    </button>
                  )}
                </div>
                {(repliesByParent[post.id]?.length ?? 0) > 0 && (
                  <ul className="border-t border-border bg-bg/50 pl-4 sm:pl-6 pr-4 pb-4 space-y-3">
                    {repliesByParent[post.id].map((r) => (
                      <li key={r.id} className="pt-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-text-primary text-sm">{r.display_name}</span>
                          <span className="text-text-muted text-xs">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-text-muted whitespace-pre-wrap break-words">
                          {linkify(r.body)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

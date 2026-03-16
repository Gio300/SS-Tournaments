'use client';

import { useEffect, useState, useRef } from 'react';
import { Sun, Moon, Smartphone, Monitor, Send, Bot } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { getWorkerUrl, setWorkerUrl, getStoredWorkerUrl } from '@/lib/workerUrl';
import { FaqAccordion } from '@/components/FaqAccordion';
import { getAIBotReply, type BotMessage } from '@/lib/rulesBot';
import { FAQ_ENTRIES } from '@/data/rules';

const SETTINGS_FAQ = [
  { q: 'How do I change my username?', a: 'Go to Settings → Account. Enter a new username and click Save. Usernames must be unique and available.' },
  { q: 'What is the game tag?', a: 'Your game tag (in-game name) is required for submitting match screenshots. It must match the name highlighted in blue on your screenshot.' },
  { q: 'How does power level work?', a: 'Power level is based on accumulated points from verified match screenshots. Submit results from the end screen to climb the leaderboard.' },
  { q: 'How do I join a clan?', a: 'Browse under Clans. Some clans are open (join directly); others require an application.' },
  { q: 'How do tournaments work?', a: 'Users create custom tournaments with their own rules. Browse under Tournaments to find and join events.' },
  { q: 'Where are the rules?', a: 'Rules are tournament-specific. When you join a tournament, view its rules from the tournament page.' },
  ...FAQ_ENTRIES,
];

const TEXT_SCALES = [0.9, 1, 1.1, 1.2];

function SettingsContent() {
  const { user, profile, refreshProfile } = useAuth();
  const { theme, setTheme, colorScheme, setColorScheme } = useTheme();
  const [activeSection, setActiveSection] = useState<'appearance' | 'account' | 'help'>('appearance');
  const [textScale, setTextScale] = useState(1);
  const [previewMode, setPreviewMode] = useState<'phone' | 'desktop'>('desktop');
  const [username, setUsername] = useState('');
  const [gameTag, setGameTag] = useState('');
  const [email, setEmail] = useState('');
  const [usernameCheck, setUsernameCheck] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [chatMessages, setChatMessages] = useState<BotMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUsername(profile?.username ?? '');
    setGameTag(profile?.game_tag ?? '');
    setEmail(user?.email ?? '');
  }, [profile, user]);

  useEffect(() => {
    const stored = getStoredWorkerUrl();
    const env = process.env.NEXT_PUBLIC_CF_WORKER_URL;
    setAiWorkerUrl(stored || env || '');
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('smashhub-text-scale');
    if (stored) {
      const n = parseFloat(stored);
      if (TEXT_SCALES.includes(n)) setTextScale(n);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${textScale * 100}%`;
    localStorage.setItem('smashhub-text-scale', String(textScale));
  }, [textScale]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function checkUsernameAvailability(name: string) {
    if (!name.trim()) {
      setUsernameCheck('idle');
      return;
    }
    if (name === profile?.username) {
      setUsernameCheck('available');
      return;
    }
    setUsernameCheck('checking');
    const { data } = await supabase.from('profiles').select('id').eq('username', name.trim()).maybeSingle();
    setUsernameCheck(data ? 'taken' : 'available');
  }

  async function handleSaveAccount() {
    if (!user) return;
    setSaving(true);
    setSaveMsg('');
    try {
      if (username.trim() && username !== profile?.username) {
        const { error } = await supabase.from('profiles').update({ username: username.trim(), updated_at: new Date().toISOString() }).eq('id', user.id);
        if (error) throw error;
      }
      if (gameTag !== (profile?.game_tag ?? '')) {
        const { error } = await supabase.from('profiles').update({ game_tag: gameTag.trim() || null, updated_at: new Date().toISOString() }).eq('id', user.id);
        if (error) throw error;
      }
      await refreshProfile();
      setSaveMsg('Saved.');
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setChatMessages((m) => [...m, { role: 'user', text }]);
    setChatLoading(true);
    try {
      const reply = await getAIBotReply(text);
      setChatMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch {
      setChatMessages((m) => [...m, { role: 'assistant', text: 'Sorry, I encountered an error. Try rephrasing.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-6">Settings</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        {(['appearance', 'account', 'help'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveSection(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeSection === s ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
            }`}
          >
            {s === 'appearance' ? 'Appearance' : s === 'account' ? 'Account' : 'Need help'}
          </button>
        ))}
      </div>

      {activeSection === 'appearance' && (
        <div className="space-y-6 rounded-xl border border-border bg-panel p-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">AI Assist (Meta AI)</h2>
            <p className="text-text-muted text-sm mb-2">Cloudflare Worker URL for post rewrite, screenshot analysis, and chatbot. Leave empty to use build-time env.</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={aiWorkerUrl}
                onChange={(e) => { setAiWorkerUrl(e.target.value); setAiUrlSaved(false); }}
                placeholder="https://your-worker.workers.dev"
                className="flex-1 px-4 py-2 rounded-lg bg-bg border border-border text-text-primary"
              />
              <button
                type="button"
                onClick={() => { setWorkerUrl(aiWorkerUrl); setAiUrlSaved(true); }}
                className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90"
              >
                Save
              </button>
            </div>
            {aiUrlSaved && <p className="text-green-500 text-sm mt-1">Saved. AI assist will use this URL.</p>}
            {getWorkerUrl() && <p className="text-text-muted text-xs mt-1">Currently configured.</p>}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Color scheme</h2>
            <p className="text-text-muted text-sm mb-2">Accent color for buttons, links, and highlights.</p>
            <div className="flex gap-2 flex-wrap">
              {(['red', 'blue', 'green', 'purple', 'orange'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setColorScheme(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                    colorScheme === s ? 'ring-2 ring-offset-2 ring-offset-panel' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: s === 'red' ? '#E10600' : s === 'blue' ? '#3B82F6' : s === 'green' ? '#22c55e' : s === 'purple' ? '#A855F7' : '#F97316',
                    color: 'white',
                    ringColor: colorScheme === s ? (s === 'red' ? '#E10600' : s === 'blue' ? '#3B82F6' : s === 'green' ? '#22c55e' : s === 'purple' ? '#A855F7' : '#F97316') : undefined,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Theme</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                  theme === 'dark' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted hover:text-text-primary'
                }`}
              >
                <Moon size={18} /> Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                  theme === 'light' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted hover:text-text-primary'
                }`}
              >
                <Sun size={18} /> Light
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Text size</h2>
            <p className="text-text-muted text-sm mb-2">Adjust text and UI scale. Changes apply immediately.</p>
            <div className="flex gap-2 flex-wrap">
              {TEXT_SCALES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTextScale(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    textScale === s ? 'bg-accent text-white' : 'border border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {Math.round(s * 100)}%
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Preview</h2>
            <p className="text-text-muted text-sm mb-2">See how the site looks on different screen sizes.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode('phone')}
                className={`p-2 rounded-lg border transition ${
                  previewMode === 'phone' ? 'border-accent bg-accent/10' : 'border-border hover:bg-white/5'
                }`}
                title="Phone view"
              >
                <Smartphone size={24} className="text-text-primary" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-lg border transition ${
                  previewMode === 'desktop' ? 'border-accent bg-accent/10' : 'border-border hover:bg-white/5'
                }`}
                title="Desktop view"
              >
                <Monitor size={24} className="text-text-primary" />
              </button>
            </div>
            <div
              className={`mt-4 rounded-lg border border-border overflow-hidden bg-panel transition-all ${
                previewMode === 'phone' ? 'max-w-[375px]' : 'max-w-full'
              }`}
            >
              <div className="p-4 text-text-primary text-sm">
                <p className="font-medium">Preview</p>
                <p className="text-text-muted mt-1">This is how text and layout will appear at {Math.round(textScale * 100)}% scale.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'account' && user && (
        <div className="space-y-6 rounded-xl border border-border bg-panel p-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Username</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameCheck('idle');
                  }}
                  onBlur={() => checkUsernameAvailability(username)}
                  className="flex-1 px-4 py-2 rounded-lg bg-bg border border-border text-text-primary"
                  placeholder="username"
                />
              </div>
              {usernameCheck === 'checking' && <p className="text-text-muted text-sm mt-1">Checking...</p>}
              {usernameCheck === 'taken' && <p className="text-accent text-sm mt-1">Username is taken.</p>}
              {usernameCheck === 'available' && username !== profile?.username && <p className="text-green-500 text-sm mt-1">Available.</p>}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Email</h2>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-2 rounded-lg bg-bg/50 border border-border text-text-muted"
              />
              <p className="text-text-muted text-sm mt-1">Email is managed by your auth provider. Change it in your provider settings.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Game tag</h2>
              <input
                type="text"
                value={gameTag}
                onChange={(e) => setGameTag(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-bg border border-border text-text-primary"
                placeholder="In-game name (PSN for Shinobi Striker)"
              />
              <p className="text-text-muted text-sm mt-1">Required for submitting match screenshots. Must match the name highlighted in blue on your screenshot.</p>
            </div>
            <button
              type="button"
              onClick={handleSaveAccount}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saveMsg && <p className="text-sm mt-2 text-text-muted">{saveMsg}</p>}
        </div>
      )}

      {activeSection === 'account' && !user && (
        <div className="rounded-xl border border-border bg-panel p-6 text-center text-text-muted">
          Sign in to edit your account settings.
        </div>
      )}

      {activeSection === 'help' && (
        <div className="space-y-8">
          <div className="rounded-xl border border-border bg-panel p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Chatbot</h2>
            <p className="text-text-muted text-sm mb-4">Ask about profiles, reels, clans, tiers, tournaments, or rules.</p>
            <div className="bg-bg border border-border rounded-lg flex flex-col overflow-hidden min-h-[280px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <Bot className="text-accent" size={18} />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                      msg.role === 'assistant' ? 'bg-accent/10 border border-accent/30' : 'bg-border/50'
                    }`}>
                      {msg.text.split('**').map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <Bot className="text-accent" size={18} />
                    </div>
                    <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2.5 text-text-muted text-sm">...</div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about SmashHub..."
                    className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary"
                  />
                  <button type="submit" disabled={chatLoading || !chatInput.trim()} className="p-2.5 rounded-lg bg-accent text-white disabled:opacity-50">
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">FAQ</h2>
            <FaqAccordion entries={SETTINGS_FAQ} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}

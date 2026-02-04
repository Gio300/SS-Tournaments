'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { getBotReply, type BotMessage } from '@/lib/rulesBot';

export default function AskPage() {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);

    setTimeout(() => {
      const reply = getBotReply(text);
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
      setLoading(false);
    }, 300);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        Rules Bot
      </h1>
      <p className="text-text-muted mb-6">
        Have questions? Ask the Rules Bot. Answers are based only on official smL rules.
      </p>

      <div className="bg-panel border border-border rounded-xl flex flex-col overflow-hidden min-h-[400px]">
        <div className="px-4 py-3 border-b border-border bg-panel/80">
          <p className="text-sm font-medium text-text-primary">
            Have questions? Ask the Rules Bot.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px]">
          {messages.length === 0 && (
            <p className="text-text-muted text-sm">
              Type a question (e.g. &quot;Can two people use the same tool?&quot; or &quot;Is Rebirth allowed on Base?&quot;).
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="text-accent" size={18} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                  msg.role === 'assistant'
                    ? 'bg-accent/10 border border-accent/30 text-text-primary'
                    : 'bg-border/50 text-text-primary'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">
                  {msg.text.split('**').map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <Bot className="text-accent" size={18} />
              </div>
              <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2.5 text-text-muted text-sm">
                ...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a rule..."
              className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Question"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 text-white transition"
              aria-label="Send"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

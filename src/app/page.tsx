import Link from 'next/link';
import { BookOpen, Film, Swords, Users, Radio, MessageCircle } from 'lucide-react';
import { AdSlot } from '@/components/AdSlot';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="hero-bg border border-border rounded-xl p-6 sm:p-8 mb-8 min-h-[180px] flex flex-col justify-center">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-3">
          smL Tournament Hub
        </h1>
        <p className="text-text-muted text-lg sm:text-xl">
          Rules · Reels · Matches · Clans · Live Streams
        </p>
      </div>

      <AdSlot slotId="home-hero-below" className="mb-8" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link
          href="/rules/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <BookOpen className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Tournament Rules</h2>
            <p className="text-text-muted text-sm">Official rules, FAQ, Rules Bot, Community</p>
          </div>
        </Link>

        <Link
          href="/reels/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Film className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Reels</h2>
            <p className="text-text-muted text-sm">Create highlight reels from clips</p>
          </div>
        </Link>

        <Link
          href="/matches/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Swords className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Matches</h2>
            <p className="text-text-muted text-sm">View and manage tournament matches</p>
          </div>
        </Link>

        <Link
          href="/boards/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Users className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Clans</h2>
            <p className="text-text-muted text-sm">Chat with your clan, share clips</p>
          </div>
        </Link>

        <Link
          href="/live/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Radio className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Live Streams</h2>
            <p className="text-text-muted text-sm">Watch and share live streams</p>
          </div>
        </Link>

        <Link
          href="/ask/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <MessageCircle className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Rules Bot</h2>
            <p className="text-text-muted text-sm">AI-powered rule questions</p>
          </div>
        </Link>
      </div>

      <AdSlot slotId="home-between-cards" className="mb-8" />

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/login/"
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Sign in
        </Link>
        <Link
          href="/rules/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          View Tournament Rules
        </Link>
      </div>

      <AdSlot slotId="home-footer" className="mt-12" />
    </div>
  );
}

import Link from 'next/link';
import { Trophy, Swords, Users, User, Settings, Film, Radio, BookOpen } from 'lucide-react';
import { AdSlot } from '@/components/AdSlot';
import { HeroBg } from '@/components/HeroBg';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <HeroBg className="border border-border rounded-xl p-6 sm:p-8 mb-8 min-h-[180px] flex flex-col justify-center">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-3">
          SmashHub
        </h1>
        <p className="text-text-muted text-lg sm:text-xl">
          Social platform for gaming · Rankings · Matches · Clans · Tournaments
        </p>
      </HeroBg>

      <AdSlot slotId="home-hero-below" className="mb-8" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link
          href="/rankings/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Trophy className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Rankings</h2>
            <p className="text-text-muted text-sm">User power levels, trophies, and clan leaderboards</p>
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
            <p className="text-text-muted text-sm">Live streams, played matches, and tournaments</p>
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
            <p className="text-text-muted text-sm">Chat with your clan, share clips, clan rankings</p>
          </div>
        </Link>

        <Link
          href="/profile/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <User className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Profile</h2>
            <p className="text-text-muted text-sm">Your profile, feed, reels, and activity</p>
          </div>
        </Link>

        <Link
          href="/settings/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Settings className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Settings</h2>
            <p className="text-text-muted text-sm">Theme, account, FAQ, and chatbot</p>
          </div>
        </Link>

        <Link
          href="/tournaments/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <BookOpen className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Tournaments</h2>
            <p className="text-text-muted text-sm">Create custom tournaments with your own rules</p>
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
          href="/live/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Radio className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Live</h2>
            <p className="text-text-muted text-sm">Watch and share live streams</p>
          </div>
        </Link>

        <Link
          href="/submit-result/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Trophy className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Submit Result</h2>
            <p className="text-text-muted text-sm">Upload match screenshots to earn points</p>
          </div>
        </Link>
      </div>

      <AdSlot slotId="home-between-cards" className="mb-8" />

      <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
        <Link
          href="/submit-result/"
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Submit Result
        </Link>
        <Link
          href="/rankings/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          Rankings
        </Link>
        <Link
          href="/reels/create/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          Create Highlight
        </Link>
        <Link
          href="/live/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          Live Now
        </Link>
        <Link
          href="/login/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          Sign in
        </Link>
        <Link
          href="/settings/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          Settings
        </Link>
      </div>

      <AdSlot slotId="home-footer" className="mt-12" />
    </div>
  );
}

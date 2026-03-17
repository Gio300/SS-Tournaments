'use client';

import Link from 'next/link';
import { Trophy, Swords, Users, Film, Radio } from 'lucide-react';
import { AdSlot } from '@/components/AdSlot';
import { HeroBg } from '@/components/HeroBg';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <HeroBg className="border border-border rounded-xl p-6 sm:p-8 mb-8 min-h-[140px] flex flex-col justify-center">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
            Welcome to SmashHub
          </h1>
          <p className="text-text-muted">
            Quick links to get started
          </p>
        </HeroBg>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/play/"
            className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
          >
            <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
              <Swords className="text-accent" size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary mb-1">Play</h2>
              <p className="text-text-muted text-sm">Create tournaments, matches, streams, reels</p>
            </div>
          </Link>

          <Link
            href="/view/"
            className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
          >
            <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
              <Trophy className="text-accent" size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary mb-1">View</h2>
              <p className="text-text-muted text-sm">Rankings, live streams, reels, matches</p>
            </div>
          </Link>

          <Link
            href="/profile/"
            className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
          >
            <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
              <Users className="text-accent" size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary mb-1">Profile</h2>
              <p className="text-text-muted text-sm">Your feed, stats, trophies, activity</p>
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
              <h2 className="font-semibold text-text-primary mb-1">Clan</h2>
              <p className="text-text-muted text-sm">Join, view, or create clans</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

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
          href="/reels/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Film className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Reels</h2>
            <p className="text-text-muted text-sm">Create and watch highlight reels</p>
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
      </div>

      <AdSlot slotId="home-between-cards" className="mb-8" />

      <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
        <Link
          href="/signup/"
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Sign up
        </Link>
        <Link
          href="/login/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          Sign in
        </Link>
        <Link
          href="/rankings/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          View Rankings
        </Link>
        <Link
          href="/live/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          Live Now
        </Link>
      </div>

      <AdSlot slotId="home-footer" className="mt-12" />
    </div>
  );
}

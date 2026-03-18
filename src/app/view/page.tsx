import Link from 'next/link';
import { Trophy, Radio, Film, LayoutGrid, MessageSquare, Swords, Search } from 'lucide-react';

export default function ViewPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">View</h1>
      <p className="text-text-muted mb-8">See things happen. Rankings, live streams, reels, posts, and matches.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/rankings/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Trophy className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Rankings</h2>
            <p className="text-text-muted text-sm">Power levels, trophies, Hall of Fame, clan leaderboards</p>
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
          href="/reels/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Film className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Reels</h2>
            <p className="text-text-muted text-sm">Highlight reels and clips</p>
          </div>
        </Link>

        <Link
          href="/view/watch/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <LayoutGrid className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Watch</h2>
            <p className="text-text-muted text-sm">Build a playlist of reels and live streams. Watch multiple in sequence.</p>
          </div>
        </Link>

        <Link
          href="/community/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <MessageSquare className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Community</h2>
            <p className="text-text-muted text-sm">Posts and community feed</p>
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
            <p className="text-text-muted text-sm">Watch past matches and results</p>
          </div>
        </Link>

        <Link
          href="/search/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Search className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Search</h2>
            <p className="text-text-muted text-sm">Find people, clans, tournaments</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

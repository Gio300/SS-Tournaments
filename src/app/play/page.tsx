import Link from 'next/link';
import { Trophy, Swords, Award } from 'lucide-react';

export default function PlayPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">Play</h1>
      <p className="text-text-muted mb-8">Rankings, matches, and tournaments</p>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/rankings/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Trophy className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Rankings</h2>
            <p className="text-text-muted text-sm">Power levels, trophies, and clan leaderboards</p>
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
            <p className="text-text-muted text-sm">Live, upcoming, open matches and results</p>
          </div>
        </Link>

        <Link
          href="/tournaments/"
          className="flex items-start gap-4 p-4 rounded-xl border border-border bg-panel hover:border-accent transition group"
        >
          <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition">
            <Award className="text-accent" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Tournaments</h2>
            <p className="text-text-muted text-sm">Create and browse tournaments</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

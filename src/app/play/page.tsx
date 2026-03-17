import Link from 'next/link';
import { Award, Radio, Film } from 'lucide-react';

export default function PlayPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">Play</h1>
      <p className="text-text-muted mb-8">Make things happen. Create tournaments, matches, streams, and reels.</p>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-panel p-6">
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Award className="text-accent" size={24} />
            Tournaments
          </h2>
          <p className="text-text-muted text-sm mb-4">
            Create and manage tournaments. Stat check and submit results inside each tournament.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tournaments/"
              className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition"
            >
              Browse tournaments
            </Link>
            <Link
              href="/tournaments/"
              className="px-4 py-2 rounded-lg border border-border hover:border-accent text-text-primary font-medium transition"
            >
              Create tournament
            </Link>
            <Link
              href="/matches/create/"
              className="px-4 py-2 rounded-lg border border-border hover:border-accent text-text-primary font-medium transition"
            >
              Create match
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-panel p-6">
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Radio className="text-accent" size={24} />
            Stream
          </h2>
          <p className="text-text-muted text-sm mb-4">
            Go live or turn previous gameplay into highlight reels.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/live/"
              className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition"
            >
              Add live stream
            </Link>
            <Link
              href="/reels/create/"
              className="px-4 py-2 rounded-lg border border-border hover:border-accent text-text-primary font-medium transition"
            >
              Create reel from gameplay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function TournamentsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        Active Tournaments
      </h1>
      <p className="text-text-muted mb-8">
        Browse and join tournaments. Create your own from your profile.
      </p>
      <div className="rounded-xl border border-border bg-panel p-8 text-center">
        <p className="text-text-muted mb-4">No tournaments yet.</p>
        <Link href="/profile/" className="text-accent hover:underline">
          Create one from your profile
        </Link>
      </div>
    </div>
  );
}

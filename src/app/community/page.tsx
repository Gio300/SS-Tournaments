import Link from 'next/link';
import { CommunityBoard } from '@/components/CommunityBoard';
import { MessageSquare } from 'lucide-react';

const GITHUB_DISCUSSIONS_URL = 'https://github.com/Gio300/SS-Tournaments/discussions';

export default function CommunityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        Community Board
      </h1>
      <p className="text-text-muted mb-6">
        Discuss rules and ask the community. Anonymous; display name stored on your device only.
      </p>

      <Link
        href={GITHUB_DISCUSSIONS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-panel p-4 text-text-primary hover:border-accent transition"
      >
        <MessageSquare className="flex-shrink-0 text-accent" size={24} />
        <div>
          <p className="font-semibold">Discuss on GitHub</p>
          <p className="text-sm text-text-muted">
            Join the repo Discussions for zero-setup chat with your GitHub identity.
          </p>
        </div>
      </Link>

      <CommunityBoard />
    </div>
  );
}

import { CommunityBoard } from '@/components/CommunityBoard';

export default function CommunityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        Community Board
      </h1>
      <p className="text-text-muted mb-6">
        Discuss rules and ask the community. Anonymous; display name stored on your device only.
      </p>
      <CommunityBoard />
    </div>
  );
}

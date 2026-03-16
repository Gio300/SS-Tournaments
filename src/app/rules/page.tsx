import Link from 'next/link';
import { BookOpen, MessageCircle, Users } from 'lucide-react';
import { AdSlot } from '@/components/AdSlot';
import { HeroBg } from '@/components/HeroBg';

export default function RulesHubPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <HeroBg className="border border-border rounded-xl p-6 sm:p-8 mb-6 min-h-[200px] flex flex-col justify-center">
        <p className="text-accent font-display font-bold text-sm uppercase tracking-wider mb-2">
          Tournament Rules
        </p>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-3">
          Rules are tournament-specific
        </h1>
        <p className="text-text-muted text-lg sm:text-xl">
          Each tournament has its own rules. Select a tournament to view its rules.
        </p>
      </HeroBg>

      <AdSlot slotId="rules-hero-below" />

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Link
          href="/tournaments/"
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <BookOpen size={20} />
          Browse Tournaments
        </Link>
        <Link
          href="/settings/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          <MessageCircle size={20} />
          Need help?
        </Link>
        <Link
          href="/community/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent-secondary text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          <Users size={20} />
          Community Board
        </Link>
      </div>

      <p className="text-text-muted">
        When you join a tournament, view its rules from the tournament page. Tournament creators define their own rules, stat check times, and schedule.
      </p>
    </div>
  );
}

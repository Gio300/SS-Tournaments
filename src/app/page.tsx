import Link from 'next/link';
import { BookOpen, MessageCircle, Users, AlertTriangle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="hero-bg border border-border rounded-xl p-6 sm:p-8 mb-6 min-h-[200px] flex flex-col justify-center">
        <p className="text-accent font-display font-bold text-sm uppercase tracking-wider mb-2">
          Official
        </p>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-3">
          smL Tournament Rules Hub
        </h1>
        <p className="text-text-muted text-lg sm:text-xl">
          Official Rules · Restrictions · Clarifications
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Link
          href="/rules/"
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          <BookOpen size={20} />
          View Rules
        </Link>
        <Link
          href="/ask/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          <MessageCircle size={20} />
          Ask the Rules Bot
        </Link>
        <Link
          href="/community/"
          className="flex items-center justify-center gap-2 bg-panel border border-border hover:border-accent-secondary text-text-primary font-semibold py-3 px-6 rounded-lg transition"
        >
          <Users size={20} />
          Community Board
        </Link>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-accent bg-accent/5">
        <AlertTriangle className="flex-shrink-0 text-accent mt-0.5" size={24} />
        <div>
          <p className="font-semibold text-text-primary">Warning</p>
          <p className="text-text-muted text-sm sm:text-base">
            ANY RULE VIOLATION = MATCH DOES NOT COUNT / POSSIBLE BAN
          </p>
        </div>
      </div>
    </div>
  );
}

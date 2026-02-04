'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export function RulesBotFab() {
  return (
    <Link
      href="/ask/"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-white font-semibold shadow-lg hover:bg-accent/90 transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
      aria-label="Ask the Rules Bot"
    >
      <MessageCircle size={22} />
      <span className="hidden sm:inline">Ask the Rules Bot</span>
    </Link>
  );
}

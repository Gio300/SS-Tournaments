'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export function RulesBotFab() {
  return (
    <Link
      href="/ask/"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center justify-center gap-2 rounded-full bg-accent p-3 sm:px-4 sm:py-3 text-white font-semibold shadow-lg hover:bg-accent/90 transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg touch-no-zoom"
      aria-label="Ask the Rules Bot"
    >
      <MessageCircle size={22} className="flex-shrink-0" />
      <span className="hidden sm:inline">Ask the Rules Bot</span>
    </Link>
  );
}

import Link from 'next/link';
import { RULES_UPDATE_DATE } from '@/data/rules';

export function Footer() {
  return (
    <footer className="border-t border-border bg-panel py-6 px-4">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-text-muted text-sm">
        <span>Updated {RULES_UPDATE_DATE} – ButtonMasherz</span>
        <Link href="/privacy/" className="text-accent hover:underline">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}

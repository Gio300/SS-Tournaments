import { RULES_UPDATE_DATE } from '@/data/rules';

export function Footer() {
  return (
    <footer className="border-t border-border bg-panel py-6 px-4">
      <p className="text-center text-text-muted text-sm">
        Updated {RULES_UPDATE_DATE} – smL Tournament Rules
      </p>
    </footer>
  );
}

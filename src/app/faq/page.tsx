import { FAQ_ENTRIES } from '@/data/rules';
import { FaqAccordion } from '@/components/FaqAccordion';

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        FAQ
      </h1>
      <p className="text-text-muted mb-8">
        Common questions about smL tournament rules.
      </p>
      <FaqAccordion entries={FAQ_ENTRIES} />
    </div>
  );
}

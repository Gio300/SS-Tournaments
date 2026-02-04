import { RULES_SECTIONS } from '@/data/rules';
import { RuleCard } from '@/components/RuleCard';

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
        Rule Index
      </h1>
      <p className="text-text-muted mb-8">
        Expand each section to view official rules. These are the single source of truth.
      </p>
      <div className="space-y-4">
        {RULES_SECTIONS.map((section) => (
          <RuleCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}

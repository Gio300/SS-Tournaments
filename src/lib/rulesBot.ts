import { getAllRuleTexts } from '@/data/rules';
import { FAQ_ENTRIES } from '@/data/rules';

export interface BotMessage {
  role: 'user' | 'assistant';
  text: string;
}

const allRules = getAllRuleTexts();
const faqLower = FAQ_ENTRIES.map((f) => ({
  q: f.q.toLowerCase(),
  a: f.a,
}));

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function scoreRule(keywords: string[], section: string, text: string): number {
  const combined = `${section} ${text}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (combined.includes(kw)) score += 1;
  }
  return score;
}

export function getBotReply(userMessage: string): string {
  const trimmed = userMessage.trim();
  if (!trimmed) return 'Please ask a question about the smL tournament rules.';

  const keywords = tokenize(trimmed);

  // Check FAQ first for close match
  for (const faq of faqLower) {
    const matchCount = keywords.filter((k) => faq.q.includes(k)).length;
    if (matchCount >= Math.min(2, keywords.length)) {
      return `**From FAQ:**\n\n${faq.a}\n\nIf your situation differs, this scenario may require staff confirmation.`;
    }
  }

  // Score all rules
  const scored = allRules
    .map((r) => ({
      ...r,
      score: scoreRule(keywords, r.section, r.text),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) {
    return "I couldn't find a specific rule matching that. Please rephrase or check the Rules and FAQ pages. **This scenario requires staff confirmation.**";
  }

  const lines = ['**Relevant rules:**\n'];
  const seen = new Set<string>();
  for (const r of scored) {
    if (seen.has(r.text)) continue;
    seen.add(r.text);
    const prefix = r.kind === 'ban' ? '❌' : r.kind === 'restriction' ? '⚠️' : '✅';
    lines.push(`• ${prefix} (${r.section}) ${r.text}`);
  }
  lines.push('\nIf your scenario is not clearly covered above, **this requires staff confirmation.**');
  return lines.join('\n');
}

import { getAllRuleTexts } from '@/data/rules';
import { FAQ_ENTRIES } from '@/data/rules';
import { getRulesContext } from '@/data/rulesContext';

export interface BotMessage {
  role: 'user' | 'assistant';
  text: string;
}

const allRules = getAllRuleTexts();
const faqLower = FAQ_ENTRIES.map((f) => ({
  q: f.q.toLowerCase(),
  a: f.a,
}));

// Synonym and partial word mappings (includes slang)
const synonyms: Record<string, string[]> = {
  // Slang for modes
  mods: ['mods', 'modes', 'mode', 'game modes', 'game mods'],
  mode: ['mode', 'modes', 'mods', 'game mode', 'game modes'],
  // Modes
  base: ['base', 'base mode', 'base mod', 'base mods'],
  combat: ['combat', 'combat mode', 'combat mod', 'combat mods'],
  flag: ['flag', 'flag mode', 'flag mod', 'flag mods'],
  // Ultimates/Jutsu
  koto: ['koto', 'kotoamatsukami', 'koto amatsukami', 'koto ult', 'koto ultimate'],
  mist: ['mist', 'hidden mist', 'hiddenmist', 'mist jutsu', 'mist ult', 'hidden mist ult'],
  rebirth: ['rebirth', 'rebirth jutsu', 'rebirth ult', 'rebirth ultimate'],
  mitotic: ['mitotic', 'mitotic regeneration', 'mitotic ult'],
  fuu: ['fuu', 'fuu jutsu', 'fuu ult'],
  ino: ['ino', 'ino jutsu', 'ino ult'],
  kaguya: ['kaguya', 'kaguya jutsu', 'kaguya ult'],
  isshiki: ['isshiki', 'isshiki jutsu', 'isshiki ult'],
  baryon: ['baryon', 'baryon mode', 'baryon ult'],
  temari: ['temari', 'temari sea dragon', 'temari ult'],
  crystal: ['crystal', 'crystal ice mirrors', 'ice mirrors', 'crystal ult'],
  izanami: ['izanami', 'izanami jutsu', 'izanami ult'],
  tsukuyomi: ['tsukuyomi', 'infinite tsukuyomi', 'infinite tsukuyomi jutsu', 'tsukuyomi ult'],
  konan: ['konan', 'konan papers', 'papers', 'konan ult'],
  karma: ['karma', 'defense karma', 'karma jutsu', 'karma ult'],
  kawaki: ['kawaki', 'kawaki strange taste', 'strange taste', 'kawaki ult'],
  hashirama: ['hashirama', 'hashirama jutsu', 'hashirama ult'],
  // Classes
  ranger: ['ranger', 'range', 'rang'],
  tank: ['tank', 'defense', 'def'],
  healer: ['healer', 'heal', 'heals'],
  dps: ['dps', 'damage', 'attack', 'atk'],
  // Common slang
  ult: ['ult', 'ults', 'ultimate', 'ultimates', 'jutsu', 'jutsus'],
  tool: ['tool', 'tools', 'ninja tool', 'ninja tools'],
  sub: ['sub', 'subs', 'substitution', 'substitutions'],
  summon: ['summon', 'summons', 'summoning', 'summonings'],
};

function expandSynonyms(word: string): string[] {
  const lower = word.toLowerCase();
  const expanded: string[] = [lower];
  
  // Check if word is a key or part of a synonym list
  for (const [key, values] of Object.entries(synonyms)) {
    if (values.some(v => v.includes(lower) || lower.includes(v))) {
      expanded.push(...values);
    }
  }
  
  return [...new Set(expanded)];
}

function tokenize(s: string): string[] {
  const tokens = s
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  
  // Expand synonyms and partial matches
  const expanded: string[] = [];
  for (const token of tokens) {
    expanded.push(token);
    expanded.push(...expandSynonyms(token));
  }
  
  return [...new Set(expanded)];
}

function scoreRule(keywords: string[], section: string, text: string): number {
  const combined = `${section} ${text}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    // Exact match
    if (combined.includes(kw)) {
      score += 2;
    }
    // Partial word match (e.g., "koto" matches "Kotoamatsukami")
    else if (combined.split(/\s+/).some(word => word.includes(kw) || kw.includes(word))) {
      score += 1;
    }
  }
  return score;
}

// Fallback keyword-based matching (used when AI is unavailable)
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

// AI-powered bot reply using Cloudflare Workers AI
export async function getAIBotReply(userMessage: string): Promise<string> {
  const trimmed = userMessage.trim();
  if (!trimmed) return 'Please ask a question about the smL tournament rules.';

  const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;
  
  // If no worker URL configured, fall back to keyword matching
  if (!workerUrl) {
    return getBotReply(userMessage);
  }

  try {
    const rulesContext = getRulesContext();
    
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: trimmed,
        rulesContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker responded with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Return AI answer with indicator
    return `**AI-Powered Answer:**\n\n${data.answer}\n\n*Powered by Cloudflare Workers AI (Llama 3.1 8B)*`;
  } catch (error: any) {
    console.error('AI bot error:', error);
    // Fallback to keyword matching on error
    return `**Fallback Answer:**\n\n${getBotReply(userMessage)}\n\n*Note: AI service unavailable, using keyword matching*`;
  }
}

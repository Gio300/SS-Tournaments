/**
 * smL Tournament Rules — SINGLE SOURCE OF TRUTH
 * Updated 02/01/26
 */

export type RuleKind = 'ban' | 'restriction' | 'allowed';

export interface RuleItem {
  kind: RuleKind;
  text: string;
}

export interface RuleSection {
  id: string;
  title: string;
  items: RuleItem[];
}

export const RULES_SECTIONS: RuleSection[] = [
  {
    id: 'overview',
    title: 'Overview & Core Rules',
    items: [
      { kind: 'allowed', text: 'Mandatory Rainbow on ALL modes (1 ATK / RNG / DEF / HEAL)' },
      { kind: 'ban', text: 'NO DPS Host — Host must be Healer or Defense ONLY for countdowns' },
      { kind: 'ban', text: 'No Sunlight or Moonlight Pills on ANY mode' },
      { kind: 'ban', text: 'No exploit / crispy activity' },
    ],
  },
  {
    id: 'ninja-tools',
    title: 'Ninja Tools & Items',
    items: [
      { kind: 'ban', text: 'No double ninja tools (all players must be unique)' },
      { kind: 'ban', text: 'Weighted Seals banned on Base & Flag' },
      { kind: 'ban', text: 'Pit-falling via Snowball Tool or Flaming Hook = DQ' },
    ],
  },
  {
    id: 'substitutions',
    title: 'Substitutions & Summonings',
    items: [
      { kind: 'ban', text: 'No identical substitution stocks' },
      { kind: 'allowed', text: 'All 22 subs allowed' },
      { kind: 'allowed', text: 'Each player must use a DIFFERENT sub' },
      { kind: 'ban', text: 'No double summonings' },
      { kind: 'ban', text: 'Ninja Cat & Ninja Tortoise banned on ALL modes' },
    ],
  },
  {
    id: 'weapons-class',
    title: 'Weapons & Class Rules',
    items: [
      { kind: 'restriction', text: 'Rangers on BASE: ONLY Kusanagi variants OR Approved SS Range weapons' },
      { kind: 'ban', text: 'Range Tags + Heavenly Hand Power together' },
      { kind: 'ban', text: 'Double Amaterasu burns on Ranger' },
      { kind: 'ban', text: 'Tank Genjutsu Sharingan + Temari Twisters together' },
      { kind: 'ban', text: 'SS+ Madara Fan banned' },
      { kind: 'ban', text: 'SS+ Inventive Destruction Sword banned' },
      { kind: 'ban', text: 'Double Moon Sword Blue Blade on Base (Tank) — Combat & Flag ONLY' },
    ],
  },
  {
    id: 'healer',
    title: 'Healer-Only Rules',
    items: [
      { kind: 'restriction', text: 'Must choose: Rebirth OR Mitotic Regeneration' },
      { kind: 'ban', text: 'Rebirth banned on Base' },
      { kind: 'allowed', text: 'Rebirth ONLY Combat & Flag' },
      { kind: 'ban', text: 'Rebirth + Mitotic + Slug together' },
    ],
  },
  {
    id: 'ultimate-jutsu',
    title: 'Ultimate Jutsu Restrictions',
    items: [
      { kind: 'ban', text: 'Insect Jamming – ALL modes' },
      { kind: 'restriction', text: 'Fuu – Flag ONLY (❌ with Paper)' },
      { kind: 'restriction', text: 'Ino – Flag ONLY' },
      { kind: 'restriction', text: 'Kaguya – Combat ONLY' },
      { kind: 'restriction', text: 'Isshiki – Combat ONLY' },
      { kind: 'restriction', text: 'Baryon Mode – Combat ONLY' },
      { kind: 'restriction', text: 'Temari Sea Dragon – Combat ONLY' },
      { kind: 'restriction', text: 'Crystal Ice Mirrors – Combat & Flag ONLY' },
    ],
  },
  {
    id: 'map-specific',
    title: 'Map-Specific Ultimates',
    items: [
      { kind: 'restriction', text: 'Izanami: Combat ONLY, Flat maps ONLY' },
      { kind: 'restriction', text: 'Infinite Tsukuyomi: Combat ONLY, Pitfall maps ONLY' },
    ],
  },
  {
    id: 'combos',
    title: 'Combo / Interaction Restrictions',
    items: [
      { kind: 'ban', text: 'Papers + Hidden Mist together on Flag' },
      { kind: 'restriction', text: 'Konan Papers: Flag ONLY, ❌ with Fuu or Hidden Mist' },
      { kind: 'restriction', text: 'Koto: Combat ONLY, ❌ Base & Flag. If glitch → MATCH REPLAY' },
      { kind: 'restriction', text: 'Defense Karma: ❌ Base, Combat & Flag ONLY. If paired with sleep/immobilize ult → Karma activates ONLY after enemy freed' },
      { kind: 'restriction', text: 'Kawaki Strange Taste: ❌ Base, Combat & Flag ONLY, ❌ with Hashirama or ANY transformation ult' },
    ],
  },
  {
    id: 'enforcement',
    title: 'Enforcement & Penalties',
    items: [
      { kind: 'ban', text: 'ANY rule violation = match does NOT count' },
      { kind: 'ban', text: 'Repeated / exploit violations = possible ban' },
      { kind: 'restriction', text: 'Tournament staff decisions are FINAL' },
    ],
  },
];

/** Flat list of all rule texts for bot search (lowercase for matching) */
export function getAllRuleTexts(): { section: string; kind: RuleKind; text: string }[] {
  const out: { section: string; kind: RuleKind; text: string }[] = [];
  for (const sec of RULES_SECTIONS) {
    for (const item of sec.items) {
      out.push({ section: sec.title, kind: item.kind, text: item.text });
    }
  }
  return out;
}

export const FAQ_ENTRIES = [
  {
    q: 'Can two people use the same tool?',
    a: 'No. All players must use unique ninja tools — no double ninja tools are allowed.',
  },
  {
    q: 'Is SS clothing allowed?',
    a: 'Cosmetics (including SS clothing) are not banned unless a specific rule states otherwise. When in doubt, ask staff or the Rules Bot.',
  },
  {
    q: 'What happens if Koto glitches?',
    a: 'Koto is Combat ONLY (banned on Base & Flag). If Koto glitches during a match, the match must be replayed.',
  },
  {
    q: 'What counts as a transformation ultimate?',
    a: 'Transformation ultimates include ults that change the character form (e.g. Baryon Mode, Isshiki, etc.). Kawaki Strange Taste is banned with Hashirama or ANY transformation ult.',
  },
  {
    q: 'Are cosmetics banned?',
    a: 'Cosmetics are not listed as banned in the official rules. Only explicitly banned items (e.g. Sunlight/Moonlight Pills, specific weapons, Ninja Cat/Tortoise) apply.',
  },
  {
    q: 'Can rules change mid-tournament?',
    a: 'Rule updates are announced by tournament staff. The Rules Hub is the single source of truth; check the “Updated” date in the footer. Staff decisions are final.',
  },
];

export const RULES_UPDATE_DATE = '02/01/26';

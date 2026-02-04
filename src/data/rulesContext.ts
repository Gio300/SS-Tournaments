/**
 * Formatted rules context for LLM consumption
 * Optimized for Cloudflare Workers AI
 */

import { RULES_SECTIONS, FAQ_ENTRIES } from './rules';

export function getRulesContext(): string {
  const sections: string[] = [];

  sections.push('=== smL TOURNAMENT RULES ===\n');
  sections.push('Updated: 02/01/26\n\n');

  for (const section of RULES_SECTIONS) {
    sections.push(`\n## ${section.title}\n`);
    for (const item of section.items) {
      const prefix = item.kind === 'ban' ? '❌ BANNED:' : item.kind === 'restriction' ? '⚠️ RESTRICTION:' : '✅ ALLOWED:';
      sections.push(`${prefix} ${item.text}`);
    }
  }

  sections.push('\n\n=== FREQUENTLY ASKED QUESTIONS ===\n');
  for (const faq of FAQ_ENTRIES) {
    sections.push(`Q: ${faq.q}\nA: ${faq.a}\n`);
  }

  sections.push('\n=== GAME TERMINOLOGY ===\n');
  sections.push('Modes (also called "mods"): Base, Combat, Flag');
  sections.push('Ultimates/Jutsu (also called "ults"): Koto (Kotoamatsukami), Hidden Mist, Fuu, Ino, Kaguya, Isshiki, Baryon Mode, Temari Sea Dragon, Crystal Ice Mirrors, Izanami, Infinite Tsukuyomi, Konan Papers, Defense Karma, Kawaki Strange Taste');
  sections.push('Classes: Ranger (also "rang"), Tank (also "def" or "defense"), Healer (also "heal"), Defense, DPS (also "atk" or "attack" or "damage")');
  sections.push('Items: Sunlight Pills, Moonlight Pills, Weighted Seals, Snowball Tool, Flaming Hook');
  sections.push('Summonings (also "summons"): Ninja Cat, Ninja Tortoise');
  sections.push('Weapons: Kusanagi, Range Tags, Heavenly Hand Power, Amaterasu, Genjutsu Sharingan, Temari Twisters, SS+ Madara Fan, SS+ Inventive Destruction Sword, Moon Sword Blue Blade');
  sections.push('Healer abilities: Rebirth, Mitotic Regeneration, Slug');
  sections.push('\nCommon slang: "mods" = modes, "ult" = ultimate/jutsu, "tool" = ninja tool, "sub" = substitution, "summon" = summoning');

  return sections.join('\n');
}

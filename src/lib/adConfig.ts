/**
 * Ad slot configuration.
 * Use NEXT_PUBLIC_ADS_SLOTS JSON env for overrides, or define defaults here.
 */

export type AdSlotType = 'custom' | 'adsense';

export interface AdSlotConfig {
  slotId: string;
  type: AdSlotType;
  /** For custom: React node or HTML string. For adsense: slot ID from AdSense. */
  content?: string;
  /** Optional: only show on these paths */
  paths?: string[];
}

const defaultSlots: AdSlotConfig[] = [
  { slotId: 'home-hero-below', type: 'custom', paths: ['/'] },
  { slotId: 'home-between-cards', type: 'custom', paths: ['/'] },
  { slotId: 'home-footer', type: 'custom', paths: ['/'] },
  { slotId: 'rules-hero-below', type: 'custom', paths: ['/rules'] },
];

function getSlotsFromEnv(): AdSlotConfig[] | null {
  const env = process.env.NEXT_PUBLIC_ADS_SLOTS;
  if (env) {
    try {
      return JSON.parse(env) as AdSlotConfig[];
    } catch {
      return null;
    }
  }
  return null;
}

export function getSlotConfig(slotId: string, currentPath?: string): AdSlotConfig | null {
  const envSlots = getSlotsFromEnv();
  const slots = envSlots ?? defaultSlots;
  const slot = slots.find((s) => s.slotId === slotId);
  if (!slot) return null;
  if (slot.paths && currentPath && !slot.paths.some((p) => currentPath === p || currentPath.startsWith(p + '/'))) {
    return null;
  }
  return slot;
}

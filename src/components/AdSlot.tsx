'use client';

import { usePathname } from 'next/navigation';
import { getSlotConfig } from '@/lib/adConfig';
import { useSubscription } from '@/hooks/useSubscription';

interface AdSlotProps {
  slotId: string;
  /** Optional custom content override (for your own business promos) */
  customContent?: React.ReactNode;
  className?: string;
  /** When true, hide ads (e.g. on clan page for Clan Ultra) */
  forceHide?: boolean;
}

export function AdSlot({ slotId, customContent, className = '', forceHide = false }: AdSlotProps) {
  const pathname = usePathname();
  const { hasNoAds } = useSubscription();
  const config = getSlotConfig(slotId, pathname ?? undefined);

  if (!config || forceHide || hasNoAds) return null;

  // Custom slot: render provided content or placeholder for your businesses
  if (config.type === 'custom') {
    return (
      <div className={`ad-slot min-h-[90px] flex items-center justify-center border border-border rounded-lg bg-panel/50 ${className}`}>
        {customContent ?? (
          <div className="text-text-muted text-sm py-4 px-4 text-center">
            {/* Placeholder for your business ads - replace with your content */}
            Ad slot: {slotId}
          </div>
        )}
      </div>
    );
  }

  // AdSense slot
  if (config.type === 'adsense' && config.content) {
    return (
      <div className={`ad-slot min-h-[90px] ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
          data-ad-slot={config.content}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return null;
}

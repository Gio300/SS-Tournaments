'use client';

import { basePath } from '@/lib/basePath';

interface BrandLogoProps {
  className?: string;
  as?: 'span' | 'h1';
  /** 'text' = gradient text (nav), 'image' = logo image (hero, blends into bg) */
  variant?: 'text' | 'image';
}

export function BrandLogo({ className = '', as: Tag = 'span', variant = 'text' }: BrandLogoProps) {
  if (variant === 'text') {
    return (
      <Tag
        className={`font-display font-bold ${className}`}
        style={{
          background: 'linear-gradient(to right, #22c55e 0%, #ef4444 35%, #7f1d1d 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        ButtonMasherz
      </Tag>
    );
  }

  const src = basePath ? `${basePath}/buttonmasherz-logo.png` : '/buttonmasherz-logo.png';
  return (
    <Tag className={`inline-flex items-center justify-center w-full ${className}`}>
      <img
        src={src}
        alt="ButtonMasherz"
        className="w-full max-w-[10rem] sm:max-w-[12rem] md:max-w-[14rem] lg:max-w-[16rem] object-contain opacity-[0.85]"
        style={{ mixBlendMode: 'overlay' }}
      />
    </Tag>
  );
}

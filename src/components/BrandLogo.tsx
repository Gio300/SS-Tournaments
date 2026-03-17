'use client';

import { basePath } from '@/lib/basePath';

interface BrandLogoProps {
  className?: string;
  as?: 'span' | 'h1';
}

export function BrandLogo({ className = '', as: Tag = 'span' }: BrandLogoProps) {
  const src = basePath ? `${basePath}/buttonmasherz-logo.png` : '/buttonmasherz-logo.png';
  return (
    <Tag className={`inline-flex items-center ${className}`}>
      <img src={src} alt="ButtonMasherz" className="h-[1em] w-auto object-contain" />
    </Tag>
  );
}

'use client';

interface BrandLogoProps {
  className?: string;
  as?: 'span' | 'h1';
}

export function BrandLogo({ className = '', as: Tag = 'span' }: BrandLogoProps) {
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

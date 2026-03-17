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
        background: 'linear-gradient(to right, #22c55e, #ef4444)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      ButtonMasherz
    </Tag>
  );
}

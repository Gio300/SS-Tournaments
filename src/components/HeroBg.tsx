import { basePath } from '@/lib/basePath';

interface HeroBgProps {
  children: React.ReactNode;
  className?: string;
}

export function HeroBg({ children, className = '' }: HeroBgProps) {
  const bgImageUrl = basePath
    ? `linear-gradient(to right, rgba(11, 14, 20, 0.92) 0%, rgba(20, 24, 36, 0.88) 50%, rgba(11, 14, 20, 0.92) 100%), url('${basePath}/hero.jpg.svg')`
    : undefined;

  return (
    <div
      className={`hero-bg ${className}`}
      style={bgImageUrl ? { backgroundImage: bgImageUrl } : undefined}
    >
      {children}
    </div>
  );
}
